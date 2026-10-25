const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");
const { execFileSync } = require("node:child_process");

function git(repository, args) {
  return execFileSync(
    "git",
    ["--no-replace-objects", "-C", repository, ...args],
    {
      encoding: "utf8",
      timeout: 180000,
      windowsHide: true,
      env: {
        ...process.env,
        GIT_TERMINAL_PROMPT: "0",
        GCM_INTERACTIVE: "never",
      },
      stdio: ["ignore", "pipe", "pipe"],
    },
  ).trim();
}
function revisionCount(repository, sha) {
  if (!/^[a-f0-9]{40}$/.test(sha || "")) throw Error("Invalid source SHA");
  if (git(repository, ["rev-parse", "--is-shallow-repository"]) !== "false")
    throw Error("A complete commit history is required for release versions");
  if (git(repository, ["rev-parse", "--verify", `${sha}^{commit}`]) !== sha)
    throw Error("Release source mismatch");
  const count = Number(git(repository, ["rev-list", "--count", sha]));
  if (!Number.isSafeInteger(count) || count < 1 || count > 10000000)
    throw Error("Invalid commit count");
  return count;
}
function fetchRevisionCount(sha) {
  if (!/^[a-f0-9]{40}$/.test(sha || "")) throw Error("Invalid source SHA");
  const root = path.resolve(os.tmpdir());
  const directory = fs.mkdtempSync(path.join(root, "enturma-release-"));
  try {
    git(directory, ["init", "--bare", "--quiet"]);
    // Fetch commits/trees over Git, without checking out code or downloading media.
    // Public GitHub API quotas are shared by builders and can reject healthy builds.
    git(directory, [
      "-c",
      "credential.helper=",
      "fetch",
      "--quiet",
      "--no-tags",
      "--filter=blob:none",
      "https://github.com/luizcordeiro155/Enturma.git",
      sha,
    ]);
    return revisionCount(directory, sha);
  } finally {
    if (
      path.dirname(path.resolve(directory)) !== root ||
      !path.basename(directory).startsWith("enturma-release-")
    )
      throw Error("Unexpected release cache directory");
    fs.rmSync(directory, { recursive: true, force: true });
  }
}
async function main(platform) {
  if (!["desktop", "mobile"].includes(platform))
    throw Error("Choose desktop or mobile");
  const sha = process.env.RAILWAY_GIT_COMMIT_SHA;
  if (!sha) {
    const version = require(`../apps/${platform}/package.json`).version;
    fs.writeFileSync(
      path.join(
        __dirname,
        `${platform === "mobile" ? "android" : "desktop"}-download/release.json`,
      ),
      JSON.stringify({ version, sourceCommit: null }) + "\n",
    );
    console.log("Local build: keeping the checked-in version.");
    return;
  }
  if (!/^[a-f0-9]{40}$/.test(sha)) throw Error("Invalid source SHA");
  // The immutable commit's reachable history grows monotonically on protected main.
  // It gives retries the same version and never publishes two binaries under one
  // version simply because a developer forgot to bump package.json.
  const count = fetchRevisionCount(sha);
  const version = `0.4.${count}`;
  const root = path.resolve(__dirname, "..");
  const packagePath = path.join(root, "apps", platform, "package.json");
  const pkg = JSON.parse(fs.readFileSync(packagePath, "utf8"));
  pkg.version = version;
  fs.writeFileSync(packagePath, JSON.stringify(pkg, null, 2) + "\n");
  if (platform === "mobile") {
    const configPath = path.join(root, "apps/mobile/app.json");
    const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
    config.expo.version = version;
    config.expo.android.versionCode = 40000000 + count;
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2) + "\n");
  }
  fs.writeFileSync(
    path.join(
      root,
      `deploy/${platform === "mobile" ? "android" : "desktop"}-download/release.json`,
    ),
    JSON.stringify({ version, sourceCommit: sha }) + "\n",
  );
  console.log(`Verified ${platform} release ${version} at ${sha}`);
}
module.exports = { revisionCount, fetchRevisionCount };
if (require.main === module)
  main(process.argv[2]).catch((e) => {
    console.error(e.message);
    process.exitCode = 1;
  });
