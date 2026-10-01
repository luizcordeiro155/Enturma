const {
  app,
  BrowserWindow,
  Menu,
  desktopCapturer,
  dialog,
  ipcMain,
  net,
  session,
  shell,
} = require("electron");
const path = require("node:path");
const fs = require("node:fs");
const crypto = require("node:crypto");
const { spawn } = require("node:child_process");
const { Readable } = require("node:stream");
const { pipeline } = require("node:stream/promises");
const { URL } = require("node:url");

function loadLocalEnv() {
  const file = path.join(__dirname, "..", ".env");
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const index = trimmed.indexOf("=");
    if (index < 1) continue;
    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim().replace(/^['"]|['"]$/g, "");
    if (!(key in process.env)) process.env[key] = value;
  }
}

loadLocalEnv();

const WEB_URL = process.env.ENTURMA_WEB_URL || "https://enturma-flax.vercel.app";
const WEB_ORIGIN = new URL(WEB_URL).origin;
const APP_PARTITION = "persist:enturma";
const UPDATE_MANIFEST_URL =
  process.env.ENTURMA_UPDATE_MANIFEST_URL ||
  "https://enturma-desktop-download-v5-production.up.railway.app/latest.json";
const RELEASES_URL =
  "https://github.com/luizcordeiro155/Enturma/releases";
const ALLOWED_PERMISSIONS = new Set([
  "media",
  "notifications",
  "fullscreen",
  "pointerLock",
]);

let mainWindow = null;
let pendingDeepLink = process.argv.find((arg) => arg.startsWith("enturma://")) || null;
let updateTimer = null;
let updateInProgress = false;
let lastPromptedVersion = null;

if (process.platform === "linux") {
  app.commandLine.appendSwitch("enable-features", "WebRTCPipeWireCapturer");
}

function isEnturmaUrl(raw) {
  try {
    return new URL(raw).origin === WEB_ORIGIN;
  } catch {
    return false;
  }
}

function isExternalUrl(raw) {
  try {
    return ["https:", "http:", "mailto:"].includes(new URL(raw).protocol);
  } catch {
    return false;
  }
}

function deepLinkToWeb(raw) {
  try {
    const link = new URL(raw);
    if (link.protocol !== "enturma:") return null;
    const host = link.hostname ? `/${link.hostname}` : "";
    const pathname = link.pathname && link.pathname !== "/" ? link.pathname : "";
    const target = new URL(`${host}${pathname}` || "/home", WEB_URL);
    target.search = link.search;
    target.hash = link.hash;
    return target.toString();
  } catch {
    return null;
  }
}

function focusMainWindow() {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  if (mainWindow.isMinimized()) mainWindow.restore();
  mainWindow.show();
  mainWindow.focus();
}

function handleDeepLink(raw) {
  const target = deepLinkToWeb(raw);
  if (!target) return;
  if (!mainWindow || mainWindow.isDestroyed()) {
    pendingDeepLink = raw;
    return;
  }
  void mainWindow.loadURL(target);
  focusMainWindow();
}

function registerProtocol() {
  if (process.defaultApp && process.argv[1]) {
    app.setAsDefaultProtocolClient("enturma", process.execPath, [
      path.resolve(process.argv[1]),
    ]);
  } else {
    app.setAsDefaultProtocolClient("enturma");
  }
}

function versionParts(value) {
  return String(value)
    .replace(/^v/i, "")
    .split(".")
    .map((part) => Number.parseInt(part, 10) || 0);
}

function newerThan(remote, current) {
  const a = versionParts(remote);
  const b = versionParts(current);
  for (let i = 0; i < Math.max(a.length, b.length); i += 1) {
    if ((a[i] || 0) > (b[i] || 0)) return true;
    if ((a[i] || 0) < (b[i] || 0)) return false;
  }
  return false;
}

function updateDirectory() {
  return path.join(app.getPath("userData"), "updates");
}

function sha256File(file) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash("sha256");
    const input = fs.createReadStream(file);
    input.on("error", reject);
    input.on("data", (chunk) => hash.update(chunk));
    input.on("end", () => resolve(hash.digest("hex")));
  });
}

async function downloadUpdate(manifest) {
  const dir = updateDirectory();
  fs.mkdirSync(dir, { recursive: true });

  const finalPath = path.join(dir, `Enturma-${manifest.version}-win-x64.zip`);
  const partialPath = `${finalPath}.part`;

  if (fs.existsSync(finalPath)) {
    const currentHash = await sha256File(finalPath);
    if (currentHash.toLowerCase() === String(manifest.sha256).toLowerCase()) {
      return finalPath;
    }
    fs.rmSync(finalPath, { force: true });
  }

  fs.rmSync(partialPath, { force: true });

  const response = await net.fetch(manifest.downloadUrl, {
    cache: "no-store",
    headers: {
      "User-Agent": `EnturmaDesktop/${app.getVersion()}`,
    },
  });
  if (!response.ok || !response.body) {
    throw new Error(`Download respondeu ${response.status}`);
  }

  await pipeline(
    Readable.fromWeb(response.body),
    fs.createWriteStream(partialPath),
  );

  if (manifest.size) {
    const actualSize = fs.statSync(partialPath).size;
    if (actualSize !== Number(manifest.size)) {
      fs.rmSync(partialPath, { force: true });
      throw new Error("Tamanho da atualização não confere.");
    }
  }

  const hash = await sha256File(partialPath);
  if (hash.toLowerCase() !== String(manifest.sha256).toLowerCase()) {
    fs.rmSync(partialPath, { force: true });
    throw new Error("A atualização baixada falhou na verificação SHA-256.");
  }

  fs.renameSync(partialPath, finalPath);
  fs.writeFileSync(
    path.join(dir, "pending-update.json"),
    JSON.stringify(
      {
        version: manifest.version,
        sha256: manifest.sha256,
        file: finalPath,
        downloadedAt: new Date().toISOString(),
      },
      null,
      2,
    ),
  );
  return finalPath;
}

function ps(value) {
  return `'${String(value).replace(/'/g, "''")}'`;
}

function installDownloadedUpdate(manifest, zipPath) {
  if (process.platform !== "win32") {
    void shell.openExternal(manifest.downloadUrl || RELEASES_URL);
    return;
  }

  const targetDir = path.dirname(process.execPath);
  const updatesDir = updateDirectory();
  const scriptPath = path.join(updatesDir, `install-${manifest.version}.ps1`);
  const extractDir = path.join(updatesDir, `extract-${manifest.version}`);
  const executableName = path.basename(process.execPath);
  const currentPid = process.pid;

  const script = `$ErrorActionPreference = "Stop"
$zip = ${ps(zipPath)}
$target = ${ps(targetDir)}
$extract = ${ps(extractDir)}
$exeName = ${ps(executableName)}
$pidToWait = ${currentPid}

while (Get-Process -Id $pidToWait -ErrorAction SilentlyContinue) {
  Start-Sleep -Milliseconds 400
}
Start-Sleep -Seconds 2

if (Test-Path $extract) {
  Remove-Item $extract -Recurse -Force -ErrorAction SilentlyContinue
}
New-Item -ItemType Directory -Path $extract -Force | Out-Null
Expand-Archive -Path $zip -DestinationPath $extract -Force

$newExe = Join-Path $extract $exeName
if (-not (Test-Path $newExe)) {
  throw "Enturma.exe não foi encontrado no pacote da atualização."
}

$updated = $false
for ($attempt = 0; $attempt -lt 20 -and -not $updated; $attempt++) {
  try {
    Get-ChildItem -Path $target -Force | Remove-Item -Recurse -Force -ErrorAction Stop
    Copy-Item -Path (Join-Path $extract "*") -Destination $target -Recurse -Force -ErrorAction Stop
    $updated = $true
  } catch {
    Start-Sleep -Milliseconds 750
  }
}

if (-not $updated) {
  throw "Não foi possível substituir os arquivos do Enturma."
}

Start-Process (Join-Path $target $exeName)
Remove-Item $extract -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item $zip -Force -ErrorAction SilentlyContinue
Remove-Item (Join-Path ${ps(updatesDir)} "pending-update.json") -Force -ErrorAction SilentlyContinue
Remove-Item $MyInvocation.MyCommand.Path -Force -ErrorAction SilentlyContinue
`;

  fs.mkdirSync(updatesDir, { recursive: true });
  fs.writeFileSync(scriptPath, script, "utf8");

  const updater = spawn(
    "powershell.exe",
    [
      "-NoProfile",
      "-NonInteractive",
      "-ExecutionPolicy",
      "Bypass",
      "-File",
      scriptPath,
    ],
    {
      detached: true,
      stdio: "ignore",
      windowsHide: true,
    },
  );
  updater.unref();
  app.quit();
}

async function promptUpdateReady(manifest, zipPath) {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  if (lastPromptedVersion === manifest.version) return;
  lastPromptedVersion = manifest.version;

  const result = await dialog.showMessageBox(mainWindow, {
    type: "info",
    title: "Atualização pronta",
    message: `Enturma ${manifest.version} está pronto para instalar.`,
    detail:
      "A atualização já foi baixada e verificada. O Enturma será reiniciado para concluir a instalação.",
    buttons: ["Atualizar e reiniciar", "Depois"],
    defaultId: 0,
    cancelId: 1,
  });

  if (result.response === 0) {
    installDownloadedUpdate(manifest, zipPath);
  }
}

async function fetchUpdateManifest() {
  const response = await net.fetch(
    `${UPDATE_MANIFEST_URL}?t=${Date.now()}`,
    {
      cache: "no-store",
      headers: {
        Accept: "application/json",
        "User-Agent": `EnturmaDesktop/${app.getVersion()}`,
      },
    },
  );
  if (!response.ok) {
    throw new Error(`Servidor de atualização respondeu ${response.status}`);
  }
  const manifest = await response.json();
  if (
    !manifest?.version ||
    !manifest?.downloadUrl ||
    !manifest?.sha256
  ) {
    throw new Error("Manifesto de atualização inválido.");
  }
  return manifest;
}

async function checkForUpdates(showResult) {
  if (!app.isPackaged) {
    if (showResult && mainWindow) {
      await dialog.showMessageBox(mainWindow, {
        type: "info",
        title: "Atualizações",
        message: "Você está executando o Enturma em modo de desenvolvimento.",
      });
    }
    return;
  }

  if (process.platform !== "win32") {
    if (showResult && mainWindow) {
      await dialog.showMessageBox(mainWindow, {
        type: "info",
        title: "Atualizações",
        message: "A atualização automática está disponível no Windows.",
        detail: "No macOS e Linux, utilize a página oficial de downloads.",
      });
    }
    return;
  }

  try {
    const manifest = await fetchUpdateManifest();
    if (!newerThan(manifest.version, app.getVersion())) {
      if (showResult && mainWindow) {
        await dialog.showMessageBox(mainWindow, {
          type: "info",
          title: "Atualizações",
          message: "Você já está usando a versão mais recente do Enturma.",
          detail: `Versão instalada: ${app.getVersion()}`,
        });
      }
      return;
    }

    if (updateInProgress) return;
    updateInProgress = true;

    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.setProgressBar(2);
    }

    const zipPath = await downloadUpdate(manifest);

    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.setProgressBar(-1);
    }

    await promptUpdateReady(manifest, zipPath);
  } catch (error) {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.setProgressBar(-1);
    }
    if (showResult && mainWindow) {
      await dialog.showMessageBox(mainWindow, {
        type: "warning",
        title: "Atualizações",
        message: "Não foi possível verificar ou baixar a atualização.",
        detail:
          error instanceof Error
            ? error.message
            : "Confira sua conexão e tente novamente mais tarde.",
      });
    }
  } finally {
    updateInProgress = false;
  }
}


function createMenu() {
  const template = [
    {
      label: "Enturma",
      submenu: [
        {
          label: "Início",
          accelerator: "CmdOrCtrl+Shift+H",
          click: () =>
            void mainWindow?.loadURL(new URL("/home", WEB_URL).toString()),
        },
        {
          label: "Recarregar",
          accelerator: "CmdOrCtrl+R",
          click: () => mainWindow?.webContents.reload(),
        },
        { type: "separator" },
        {
          label: "Abrir no navegador",
          click: () => {
            const current = mainWindow?.webContents.getURL();
            void shell.openExternal(
              isEnturmaUrl(current || "") ? current : WEB_URL,
            );
          },
        },
        {
          label: "Verificar atualizações",
          click: () => void checkForUpdates(true),
        },
        { type: "separator" },
        { role: "quit", label: "Sair" },
      ],
    },
    {
      label: "Editar",
      submenu: [
        { role: "undo", label: "Desfazer" },
        { role: "redo", label: "Refazer" },
        { type: "separator" },
        { role: "cut", label: "Recortar" },
        { role: "copy", label: "Copiar" },
        { role: "paste", label: "Colar" },
        { role: "selectAll", label: "Selecionar tudo" },
      ],
    },
    {
      label: "Exibir",
      submenu: [
        { role: "zoomIn", label: "Aumentar zoom" },
        { role: "zoomOut", label: "Diminuir zoom" },
        { role: "resetZoom", label: "Restaurar zoom" },
        { type: "separator" },
        { role: "togglefullscreen", label: "Tela cheia" },
      ],
    },
    {
      label: "Ajuda",
      submenu: [
        {
          label: "GitHub do Enturma",
          click: () =>
            void shell.openExternal(
              "https://github.com/luizcordeiro155/Enturma",
            ),
        },
        {
          label: `Sobre o Enturma ${app.getVersion()}`,
          click: () => {
            void dialog.showMessageBox(mainWindow, {
              type: "info",
              title: "Enturma",
              message: `Enturma ${app.getVersion()}`,
              detail:
                "Aplicativo desktop conectado à versão Web oficial do Enturma.",
            });
          },
        },
      ],
    },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

function chooseDesktopSource(sources) {
  return new Promise((resolve) => {
    let settled = false;
    const picker = new BrowserWindow({
      width: 920,
      height: 680,
      minWidth: 720,
      minHeight: 520,
      parent: mainWindow || undefined,
      modal: Boolean(mainWindow),
      title: "Compartilhar tela - Enturma",
      backgroundColor: "#0f1917",
      autoHideMenuBar: true,
      webPreferences: {
        preload: path.join(__dirname, "picker-preload.cjs"),
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true,
      },
    });

    const payload = sources.map((source) => ({
      id: source.id,
      name: source.name,
      thumbnail: source.thumbnail.toDataURL(),
      icon:
        source.appIcon && !source.appIcon.isEmpty()
          ? source.appIcon.toDataURL()
          : null,
    }));

    const finish = (source) => {
      if (settled) return;
      settled = true;
      ipcMain.removeListener("desktop-picker:select", onSelect);
      ipcMain.removeListener("desktop-picker:cancel", onCancel);
      if (!picker.isDestroyed()) picker.destroy();
      resolve(source || null);
    };

    const onSelect = (event, id) => {
      if (event.sender.id !== picker.webContents.id) return;
      finish(sources.find((source) => source.id === id) || null);
    };
    const onCancel = (event) => {
      if (event.sender.id !== picker.webContents.id) return;
      finish(null);
    };

    ipcMain.on("desktop-picker:select", onSelect);
    ipcMain.on("desktop-picker:cancel", onCancel);
    picker.on("closed", () => finish(null));
    picker.webContents.once("did-finish-load", () => {
      picker.webContents.send("desktop-picker:sources", payload);
    });
    void picker.loadFile(path.join(__dirname, "picker.html"));
  });
}

function configureSession(ses) {
  ses.setPermissionCheckHandler(
    (webContents, permission, requestingOrigin, details) => {
      const origin =
        requestingOrigin ||
        details?.requestingUrl ||
        details?.securityOrigin ||
        webContents?.getURL() ||
        "";
      return isEnturmaUrl(origin) && ALLOWED_PERMISSIONS.has(permission);
    },
  );

  ses.setPermissionRequestHandler(
    (webContents, permission, callback, details) => {
      const origin =
        details.requestingUrl ||
        details.securityOrigin ||
        webContents?.getURL() ||
        "";
      callback(
        isEnturmaUrl(origin) && ALLOWED_PERMISSIONS.has(permission),
      );
    },
  );

  ses.setDisplayMediaRequestHandler(async (request, callback) => {
    if (!isEnturmaUrl(request.securityOrigin) || !request.videoRequested) {
      callback({});
      return;
    }
    try {
      const sources = await desktopCapturer.getSources({
        types: ["screen", "window"],
        thumbnailSize: { width: 360, height: 220 },
        fetchWindowIcons: true,
      });
      const source = await chooseDesktopSource(sources);
      if (!source) {
        callback({});
        return;
      }
      const streams = { video: source };
      if (request.audioRequested && process.platform === "win32") {
        streams.audio = "loopbackWithMute";
      }
      callback(streams);
    } catch {
      callback({});
    }
  });
}

function openOfflinePage() {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  void mainWindow.loadFile(path.join(__dirname, "offline.html"));
}

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 980,
    minHeight: 640,
    show: false,
    title: "Enturma",
    backgroundColor: "#0f1917",
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      partition: APP_PARTITION,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
      allowRunningInsecureContent: false,
      spellcheck: true,
    },
  });

  mainWindow.webContents.setUserAgent(
    `${mainWindow.webContents.getUserAgent()} EnturmaDesktop/${app.getVersion()}`,
  );

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (isEnturmaUrl(url)) {
      void mainWindow.loadURL(url);
      return { action: "deny" };
    }
    if (isExternalUrl(url)) void shell.openExternal(url);
    return { action: "deny" };
  });

  mainWindow.webContents.on("will-navigate", (event, url) => {
    if (url.startsWith("file://") || isEnturmaUrl(url)) return;
    event.preventDefault();
    if (isExternalUrl(url)) void shell.openExternal(url);
  });

  mainWindow.webContents.on(
    "did-fail-load",
    (_event, errorCode, _errorDescription, validatedURL, isMainFrame) => {
      if (
        !isMainFrame ||
        errorCode === -3 ||
        validatedURL.startsWith("file://")
      )
        return;
      openOfflinePage();
    },
  );

  mainWindow.once("ready-to-show", () => mainWindow?.show());
  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  const target = pendingDeepLink
    ? deepLinkToWeb(pendingDeepLink) || WEB_URL
    : WEB_URL;
  pendingDeepLink = null;
  void mainWindow.loadURL(target);
}

ipcMain.handle("desktop:get-info", () => ({
  version: app.getVersion(),
  platform: process.platform,
  webUrl: WEB_URL,
}));
ipcMain.handle("desktop:check-for-updates", () => checkForUpdates(true));
ipcMain.handle("desktop:open-external", (_event, url) => {
  if (isExternalUrl(url)) return shell.openExternal(url);
  return false;
});
ipcMain.on("desktop:retry", () => {
  if (mainWindow) void mainWindow.loadURL(WEB_URL);
});

registerProtocol();

const hasLock = app.requestSingleInstanceLock();
if (!hasLock) {
  app.quit();
} else {
  app.on("second-instance", (_event, argv) => {
    const deepLink = argv.find((arg) => arg.startsWith("enturma://"));
    if (deepLink) handleDeepLink(deepLink);
    focusMainWindow();
  });

  app.on("open-url", (event, url) => {
    event.preventDefault();
    handleDeepLink(url);
  });

  app.whenReady().then(() => {
    const appSession = session.fromPartition(APP_PARTITION);
    configureSession(appSession);
    createMenu();
    createMainWindow();
    setTimeout(() => void checkForUpdates(false), 12000);
    updateTimer = setInterval(
      () => void checkForUpdates(false),
      6 * 60 * 60 * 1000,
    );
  });

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
    else focusMainWindow();
  });

  app.on("before-quit", () => {
    if (updateTimer) clearInterval(updateTimer);
  });

  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
  });
}
