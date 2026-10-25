const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { execFileSync } = require("node:child_process");
const { pathToFileURL } = require("node:url");
const { revisionCount } = require("./native-version.cjs");

test("release counts the exact revision, remains stable on retry and rejects incomplete history", () => {
  const root = path.resolve(os.tmpdir());
  const directory = fs.mkdtempSync(path.join(root, "enturma-version-test-"));
  const repository = path.join(directory, "repo");
  fs.mkdirSync(repository);
  const git = (args) =>
    execFileSync("git", ["-C", repository, ...args], {
      encoding: "utf8",
      windowsHide: true,
      stdio: ["ignore", "pipe", "pipe"],
    }).trim();
  try {
    git(["init", "--quiet"]);
    const commit = () =>
      git([
        "-c",
        "user.name=Enturma test",
        "-c",
        "user.email=test@example.test",
        "-c",
        "commit.gpgsign=false",
        "commit",
        "--allow-empty",
        "--quiet",
        "-m",
        "test",
      ]);
    commit();
    const first = git(["rev-parse", "HEAD"]);
    commit();
    const second = git(["rev-parse", "HEAD"]);
    assert.equal(revisionCount(repository, second), 2);
    assert.equal(revisionCount(repository, first), 1);
    assert.equal(revisionCount(repository, second), 2);
    assert.throws(() => revisionCount(repository, "main"), /Invalid source/);
    assert.throws(() => revisionCount(repository, "0".repeat(40)));
    const shallow = path.join(directory, "shallow");
    git([
      "clone",
      "--quiet",
      "--depth=1",
      pathToFileURL(repository).href,
      shallow,
    ]);
    assert.throws(
      () => revisionCount(shallow, second),
      /complete commit history/,
    );
  } finally {
    if (
      path.dirname(path.resolve(directory)) !== root ||
      !path.basename(directory).startsWith("enturma-version-test-")
    )
      throw Error("Unexpected test directory");
    fs.rmSync(directory, { recursive: true, force: true });
  }
});
