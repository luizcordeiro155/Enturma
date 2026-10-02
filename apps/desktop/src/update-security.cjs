const path = require("node:path");
function validateManifest(manifest, manifestUrl) {
  const source = new URL(manifestUrl),
    url = new URL(manifest?.downloadUrl || "invalid:");
  if (
    !/^\d+\.\d+\.\d+$/.test(manifest?.version || "") ||
    !/^[a-f0-9]{64}$/i.test(manifest?.sha256 || "") ||
    !Number.isSafeInteger(manifest?.size) ||
    manifest.size < 1 ||
    manifest.size > 600 * 1024 * 1024 ||
    url.origin !== source.origin ||
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    !url.pathname.endsWith(".zip")
  )
    throw Error("Manifesto de atualização inválido ou origem não autorizada.");
  return manifest;
}
function trustedSender(event, window, origin) {
  try {
    return (
      !!window &&
      event.sender === window.webContents &&
      event.senderFrame === window.webContents.mainFrame &&
      new URL(event.senderFrame.url).origin === origin
    );
  } catch {
    return false;
  }
}

function inside(root, target) {
  const relative = path.relative(path.resolve(root), path.resolve(target));
  return !!relative && !relative.startsWith("..") && !path.isAbsolute(relative);
}
module.exports = { validateManifest, trustedSender, inside };
