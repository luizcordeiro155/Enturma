const { test } = require("node:test");
const assert = require("node:assert/strict");
const {
  validateManifest,
  trustedSender,
  trustedLocalSender,
  inside,
  deepLinkToWeb,
} = require("../src/update-security.cjs");
const url = "https://downloads.example/latest.json";
test('local updater IPC rejects remote pages, sibling files, subframes and other windows', () => {
  const file = require('node:path').resolve(__dirname, '../src/updater.html');
  const mainFrame = { url: require('node:url').pathToFileURL(file).href };
  const webContents = { mainFrame };
  const window = { webContents, isDestroyed: () => false };
  const event = { sender: webContents, senderFrame: mainFrame };
  assert.equal(trustedLocalSender(event, window, file), true);
  assert.equal(trustedLocalSender({ ...event, sender: {} }, window, file), false);
  assert.equal(trustedLocalSender({ ...event, senderFrame: { ...mainFrame } }, window, file), false);
  for (const input of ['https://enturma-flax.vercel.app', 'file:///tmp/updater.html', mainFrame.url + '?fake=1']) {
    const original = mainFrame.url; mainFrame.url = input;
    assert.equal(trustedLocalSender(event, window, file), false);
    mainFrame.url = original;
  }
  assert.equal(trustedLocalSender(event, null, file), false);
  assert.equal(trustedLocalSender(event, { ...window, isDestroyed: () => true }, file), false);
});
test("deep links keep the application origin, including network-path inputs", () => {
  const web = "https://app.example";
  assert.equal(deepLinkToWeb("enturma://rooms/123?tab=chat", web), web + "/rooms/123?tab=chat");
  assert.equal(deepLinkToWeb("enturma://verify-email#token=one-time", web), web + "/verify-email#token=one-time");
  for (const input of ["enturma:////evil.example/login", "enturma://///evil.example/login", "https://evil.example", "enturma:///\\evil.example/login"])
    assert.equal(deepLinkToWeb(input, web), null);
});
const valid = {
  version: "0.3.0",
  sha256: "a".repeat(64),
  size: 12345,
  downloadUrl: "https://downloads.example/Enturma-Windows.zip",
};
test("accepts legacy 0.2 ZIP manifest with additive installer fields", () =>
  assert.equal(
    validateManifest(
      {
        ...valid,
        installerUrl: "https://downloads.example/Enturma-Setup-0.3.0.exe",
        installerSha256: "b".repeat(64),
        installerSize: 67890,
      },
      url,
    ).version,
    "0.3.0",
  ));
test("rejects malformed, oversized, untrusted and credential-bearing artifacts", () => {
  for (const patch of [
    { version: "latest" },
    { sha256: "abc" },
    { size: 0 },
    { size: 700 * 1024 * 1024 },
    { size: 1.3 },
    { downloadUrl: "http://downloads.example/a.zip" },
    { downloadUrl: "https://other.example/a.zip" },
    { downloadUrl: "https://user:pass@downloads.example/a.zip" },
    { downloadUrl: "https://downloads.example/a.exe" },
    {
      installerUrl: "https://other.example/Enturma-Setup-0.3.0.exe",
      installerSha256: "b".repeat(64),
      installerSize: 67890,
    },
    {
      installerUrl: "https://downloads.example/Enturma-Setup-0.3.0.exe",
      installerSha256: "bad",
      installerSize: 67890,
    },
  ])
    assert.throws(() => validateManifest({ ...valid, ...patch }, url));
});
test("only the trusted main frame may invoke privileged IPC", () => {
  const mainFrame = { url: "https://app.example/profile" },
    webContents = { mainFrame },
    window = { webContents };
  assert.equal(
    trustedSender(
      { sender: webContents, senderFrame: mainFrame },
      window,
      "https://app.example",
    ),
    true,
  );
  assert.equal(
    trustedSender(
      { sender: {}, senderFrame: mainFrame },
      window,
      "https://app.example",
    ),
    false,
  );
  assert.equal(
    trustedSender(
      { sender: webContents, senderFrame: { url: mainFrame.url } },
      window,
      "https://app.example",
    ),
    false,
  );
  mainFrame.url = "https://evil.example";
  assert.equal(
    trustedSender(
      { sender: webContents, senderFrame: mainFrame },
      window,
      "https://app.example",
    ),
    false,
  );
  mainFrame.url = "about:blank";
  assert.equal(
    trustedSender(
      { sender: webContents, senderFrame: mainFrame },
      window,
      "https://app.example",
    ),
    false,
  );
});
test("updater destination validation prevents root and sibling traversal", () => {
  assert.equal(inside("updates", "updates/release/app.exe"), true);
  assert.equal(inside("updates", "updates"), false);
  assert.equal(inside("updates", "updates/../private.txt"), false);
  assert.equal(inside("updates", "updates-other/app.exe"), false);
});
