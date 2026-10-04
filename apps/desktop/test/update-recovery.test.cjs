const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const source = fs.readFileSync(
  path.join(__dirname, "..", "src", "main.cjs"),
  "utf8",
);

test("desktop persists verified installer/zip state and restores it on restart", () => {
  assert.match(source, /function persistPendingUpdate\(/);
  assert.match(source, /async function restorePendingUpdate\(/);
  assert.match(source, /await restorePendingUpdate\(\)/);
  assert.match(source, /persistPendingUpdate\(pendingUpdate\)/);
  assert.match(source, /sha256File\(file\)/);
});

test("desktop discards stale or corrupt ready artifacts safely", () => {
  assert.match(source, /!newerThan\(manifest\.version, app\.getVersion\(\)\)/);
  assert.match(source, /clearPendingUpdateState\(true\)/);
  assert.match(source, /inside\(updateDirectory\(\), file\)/);
});

test("ready update is reused instead of downloading twice", () => {
  assert.match(source, /if \(pendingUpdate\)/);
  assert.match(source, /updateStatus\("ready"/);
  assert.match(source, /fs\.existsSync\(finalPath\)/);
});
