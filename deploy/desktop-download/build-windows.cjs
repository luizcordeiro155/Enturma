// NSIS's temporary bootstrap is a 32-bit Windows program. Railway's kernel
// cannot execute it, including through Wine WoW64. Use electron-builder's own
// validated PE/NSIS extractor (also used by its macOS build path) instead.
// This adapter is deliberately pinned and limited to the unsigned bootstrap;
// the standard NSIS script, uninstaller and installer checks remain enabled.
const path = require("node:path");
const fs = require("node:fs/promises");
const modules = path.resolve(process.argv[2] || "node_modules");
const load = (name) => require(path.join(modules, name));
if (load("app-builder-lib/package.json").version !== "26.15.3") {
  throw new Error(
    "Review NSIS extraction adapter before upgrading electron-builder",
  );
}
const projectDir = path.resolve(__dirname, "../../apps/desktop");
const pkg = require(path.join(projectDir, "package.json"));
const bootstrap = path.join(
  projectDir,
  "dist",
  `Enturma-Setup-${pkg.version}.exe`,
);
const { WineVmManager } = load("app-builder-lib/out/vm/WineVm.js");
const { UninstallerReader } = load(
  "app-builder-lib/out/targets/nsis/nsisUtil.js",
);
WineVmManager.prototype.exec = async function (file, args) {
  if (path.resolve(file) !== bootstrap || args.length !== 0) {
    throw new Error(
      `Unexpected Wine operation in the NSIS build: ${path.basename(file)}`,
    );
  }
  const destination = bootstrap.slice(0, -3) + "__uninstaller.exe";
  await UninstallerReader.exec(bootstrap, destination);
  if ((await fs.stat(destination)).size < 1024)
    throw new Error("Invalid NSIS uninstaller");
  console.log(
    "Validated NSIS uninstaller extracted without executing the bootstrap",
  );
};
const { build, Platform, Arch } = load("electron-builder");
build({
  projectDir,
  targets: Platform.WINDOWS.createTarget(["nsis", "zip"], Arch.x64),
  publish: "never",
}).catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
