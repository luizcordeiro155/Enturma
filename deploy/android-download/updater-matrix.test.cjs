const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const source = fs.readFileSync(
  path.resolve(__dirname, "install-web-shell.cjs"),
  "utf8",
);

function has(fragment) {
  assert.ok(
    source.includes(fragment),
    "Fluxo Android esperado não encontrado: " + fragment,
  );
}

test("updater Android: download normal e origem segura", () => {
  has('uri.scheme == "https"');
  has('uri.path?.endsWith(".apk") == true');
  has("manager.enqueue(");
  has("watchUpdateDownload(it)");
});

test("updater Android: cancelamento da permissão permite segunda tentativa", () => {
  has("pendingUpdateUrl = downloadUrl");
  has("Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES");
  has("startUpdateInstall(downloadUrl)");
});

test("updater Android: segunda tentativa reutiliza download existente", () => {
  has("previousId > 0");
  has("previousUrl == downloadUrl");
  has("DownloadManager.STATUS_PENDING");
  has("DownloadManager.STATUS_RUNNING");
  has("DownloadManager.STATUS_PAUSED");
  has("DownloadManager.STATUS_SUCCESSFUL");
  has("openDownloadedInstaller(downloaded, previousId, true)");
});

test("updater Android: app fechado no meio e download concluído são recuperáveis", () => {
  has("class EnturmaDownloadCompleteReceiver");
  has("PREF_DOWNLOAD_ID");
  has("PREF_DOWNLOAD_BASE_VERSION");
  has("showInstallReadyNotification(context, downloadId)");
});

test("updater Android: rede perdida não transforma download incompleto em instalador", () => {
  has("DownloadManager.STATUS_FAILED -> return@Thread");
  has("downloadedApkUri(context, downloadId)");
  has("DownloadManager.STATUS_SUCCESSFUL");
});

test("updater Android: APK já baixado e confirmação cancelada podem ser reabertos", () => {
  has("PREF_INSTALL_PROMPTED_ID");
  has("INSTALLER_DEDUP_MS");
  has("force: Boolean = false");
  has("openDownloadedInstaller(downloaded, previousId, true)");
});

test("updater Android: app já atualizado limpa estado e relança", () => {
  has("Intent.ACTION_MY_PACKAGE_REPLACED");
  has(".edit()\n            .clear()");
  has("UPDATE_RELAUNCH_REQUEST");
});

test("updater Android: versão já atual não é oferecida novamente", () => {
  has("isNewerVersion(release.version");
  has("nativeVersionIsNewer(");
});
