const fs = require("node:fs");
const path = require("node:path");

function historyCount(link, entries) {
  const last = link?.split(",").find((part) => /rel="last"/.test(part));
  const match = last?.match(/[?&]page=(\d+)/);
  const count = match ? Number(match[1]) : entries;
  if (!Number.isSafeInteger(count) || count < 1 || count > 10000000)
    throw Error("Invalid commit count");
  return count;
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
  const response = await fetch(
    `https://api.github.com/repos/luizcordeiro155/Enturma/commits?sha=${sha}&per_page=1`,
    {
      headers: {
        Accept: "application/vnd.github+json",
        "User-Agent": "Enturma-native-release",
      },
      signal: AbortSignal.timeout(20000),
    },
  );
  if (!response.ok)
    throw Error(`Could not verify release source (${response.status})`);
  const commits = await response.json();
  if (!Array.isArray(commits) || commits[0]?.sha !== sha)
    throw Error("Release source mismatch");
  const count = historyCount(response.headers.get("link"), commits.length);
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
module.exports = { historyCount };
if (require.main === module)
  main(process.argv[2]).catch((e) => {
    console.error(e.message);
    process.exitCode = 1;
  });
