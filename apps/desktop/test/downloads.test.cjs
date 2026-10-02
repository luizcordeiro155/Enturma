const { test } = require("node:test");
const assert = require("node:assert/strict"),
  fs = require("node:fs"),
  os = require("node:os"),
  path = require("node:path"),
  crypto = require("node:crypto");
const { spawn } = require("node:child_process");
test("download service serves NSIS while preserving verified legacy ZIP updates", async (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "enturma-download-test-"));
  const dir = path.join(root, "downloads");
  fs.mkdirSync(dir);
  fs.copyFileSync(
    path.resolve(__dirname, "../../../deploy/desktop-download/server.cjs"),
    path.join(root, "server.cjs"),
  );
  const zip = Buffer.from("fixture archive for transport verification");
  fs.writeFileSync(path.join(dir, "Enturma-0.3.0-win-x64.zip"), zip);
  fs.writeFileSync(path.join(dir, "Enturma-0.2.0-win-x64.zip"), "old");
  fs.writeFileSync(path.join(dir, "Enturma-Setup-0.3.0.exe"), "installer");
  const child = spawn(process.execPath, [path.join(root, "server.cjs")], {
    env: {
      ...process.env,
      PORT: "0",
      RAILWAY_PUBLIC_DOMAIN: "downloads.example",
    },
    windowsHide: true,
  });
  t.after(async () => {
    child.kill();
    await new Promise((r) => child.once("exit", r));
    fs.rmSync(root, { recursive: true, force: true });
  });
  const port = await new Promise((resolve, reject) => {
    child.stdout.once("data", (d) =>
      resolve(Number(String(d).match(/(\d+)\s*$/)[1])),
    );
    child.once("error", reject);
  });
  const base = `http://127.0.0.1:${port}`;
  const manifest = await (await fetch(base + "/latest.json")).json();
  assert.equal(manifest.version, "0.3.0");
  assert.equal(manifest.size, zip.length);
  assert.equal(
    manifest.sha256,
    crypto.createHash("sha256").update(zip).digest("hex"),
  );
  assert.ok(manifest.installerUrl.endsWith("Enturma-Setup-0.3.0.exe"));
  assert.deepEqual(
    Buffer.from(
      await (await fetch(base + "/Enturma-Windows.zip")).arrayBuffer(),
    ),
    zip,
  );
  assert.equal(await (await fetch(base + "/download")).text(), "installer");
  assert.equal(
    await (await fetch(base + "/Enturma-Windows.exe")).text(),
    "installer",
  );
  assert.equal(
    await (await fetch(base + "/Enturma-Setup.exe")).text(),
    "installer",
  );
  assert.equal(
    (
      await fetch(base + "/Enturma-Setup-0.3.0.exe", { method: "HEAD" })
    ).headers.get("content-length"),
    "9",
  );
  assert.equal((await fetch(base + "/health")).status, 200);
  assert.equal((await fetch(base + "/%2e%2e%2fserver.cjs")).status, 404);
  assert.equal(
    (await fetch(base + "/latest.json", { method: "POST" })).status,
    405,
  );
  fs.unlinkSync(path.join(dir, "Enturma-Setup-0.3.0.exe"));
  assert.equal((await fetch(base + "/latest.json")).status, 503);
});
