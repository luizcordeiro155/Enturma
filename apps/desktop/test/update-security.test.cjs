const { test } = require("node:test");
const assert = require("node:assert/strict");
const {
  validateManifest,
  trustedSender,
  inside,
} = require("../src/update-security.cjs");
const url = "https://downloads.example/latest.json";
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
