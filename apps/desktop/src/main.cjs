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
const {
  validateManifest,
  trustedSender,
  inside,
} = require("./update-security.cjs");
const { Readable, Transform } = require("node:stream");
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
    const value = trimmed
      .slice(index + 1)
      .trim()
      .replace(/^['"]|['"]$/g, "");
    if (!(key in process.env)) process.env[key] = value;
  }
}

loadLocalEnv();

const WEB_URL =
  process.env.ENTURMA_WEB_URL || "https://enturma-flax.vercel.app";
const WEB_ORIGIN = new URL(WEB_URL).origin;
const APP_PARTITION = "persist:enturma";
const UPDATE_MANIFEST_URL =
  process.env.ENTURMA_UPDATE_MANIFEST_URL ||
  "https://enturma-desktop-download-v5-production.up.railway.app/latest.json";
const RELEASES_URL = "https://github.com/luizcordeiro155/Enturma/releases";
const ALLOWED_PERMISSIONS = new Set([
  "media",
  "notifications",
  "fullscreen",
  "pointerLock",
]);

let mainWindow = null;
let pendingDeepLink =
  process.argv.find((arg) => arg.startsWith("enturma://")) || null;
let updateTimer = null;
let updateInProgress = false;
let pendingUpdate = null;
let updateState = {
  status: "idle",
  currentVersion: app.getVersion(),
  progress: 0,
};
function updateStatus(status, details = {}) {
  updateState = { ...updateState, ...details, status };
  if (
    mainWindow &&
    !mainWindow.isDestroyed() &&
    isEnturmaUrl(mainWindow.webContents.getURL())
  )
    mainWindow.webContents.send("desktop:update-state", updateState);
}
function requireTrusted(event) {
  if (!trustedSender(event, mainWindow, WEB_ORIGIN))
    throw Error("Origem IPC não autorizada.");
}

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
    const pathname =
      link.pathname && link.pathname !== "/" ? link.pathname : "";
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
  if (process.env.ENTURMA_PORTABLE === "1") return;
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

  updateStatus("downloading", { version: manifest.version, progress: 0 });
  const response = await net.fetch(manifest.downloadUrl, {
    redirect: "error",
    signal: AbortSignal.timeout(300000),
    cache: "no-store",
    headers: {
      "User-Agent": `EnturmaDesktop/${app.getVersion()}`,
    },
  });
  if (!response.ok || !response.body) {
    throw new Error(`Download respondeu ${response.status}`);
  }

  let received = 0,
    lastProgress = -1;
  const meter = new Transform({
    transform(chunk, encoding, callback) {
      received += chunk.length;
      if (received > manifest.size)
        return callback(Error("Download excedeu o tamanho autorizado."));
      const progress = Math.floor((received * 100) / manifest.size);
      if (progress !== lastProgress) {
        lastProgress = progress;
        updateStatus("downloading", { progress });
        mainWindow?.setProgressBar(progress / 100);
      }
      callback(null, chunk);
    },
  });
  try {
    await pipeline(
      Readable.fromWeb(response.body),
      meter,
      fs.createWriteStream(partialPath),
    );
  } catch (error) {
    fs.rmSync(partialPath, { force: true });
    throw error;
  }

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

  if (
    !inside(updatesDir, zipPath) ||
    !inside(updatesDir, extractDir) ||
    !inside(updatesDir, scriptPath)
  )
    throw Error("Diretório de atualização inválido.");
  const backupDir = path.join(
    updatesDir,
    `backup-${manifest.version}-${Date.now()}`,
  );
  const script = `$ErrorActionPreference = "Stop"
$zip = ${ps(zipPath)}
$target = [IO.Path]::GetFullPath(${ps(targetDir)})
$updatesRoot = [IO.Path]::GetFullPath(${ps(updatesDir)})
$extract = [IO.Path]::GetFullPath(${ps(extractDir)})
$backup = [IO.Path]::GetFullPath(${ps(backupDir)})
$exeName = ${ps(executableName)}
$pidToWait = ${currentPid}
function Assert-Child([string]$root,[string]$child) {
 $rootPrefix = [IO.Path]::GetFullPath($root).TrimEnd([IO.Path]::DirectorySeparatorChar) + [IO.Path]::DirectorySeparatorChar
 if (-not [IO.Path]::GetFullPath($child).StartsWith($rootPrefix,[StringComparison]::OrdinalIgnoreCase)) {throw "Caminho fora do diretório permitido."}
}
Assert-Child $updatesRoot $extract
Assert-Child $updatesRoot $backup
Assert-Child $updatesRoot $zip
if (-not (Test-Path -LiteralPath (Join-Path $target $exeName))) {throw "Instalação de origem não encontrada."}
if ((Get-FileHash -LiteralPath $zip -Algorithm SHA256).Hash -ne ${ps(manifest.sha256)}) {throw "SHA-256 divergente."}
Add-Type -AssemblyName System.IO.Compression.FileSystem
$archive = [IO.Compression.ZipFile]::OpenRead($zip)
try {
 $total = 0
 foreach ($entry in $archive.Entries) {Assert-Child $extract (Join-Path $extract $entry.FullName);$total += $entry.Length;if ($total -gt 2147483648) {throw "Pacote expandido excede o limite."}}
} finally {$archive.Dispose()}
if (Test-Path -LiteralPath $extract) {Remove-Item -LiteralPath $extract -Recurse -Force}
New-Item -ItemType Directory -Path $extract -Force | Out-Null
Expand-Archive -LiteralPath $zip -DestinationPath $extract -Force
if (-not (Test-Path -LiteralPath (Join-Path $extract $exeName))) {throw "Executável ausente no pacote."}
while (Get-Process -Id $pidToWait -ErrorAction SilentlyContinue) {Start-Sleep -Milliseconds 400}
Start-Sleep -Seconds 2
New-Item -ItemType Directory -Path $backup -Force | Out-Null
$written = [System.Collections.Generic.List[string]]::new()
try {
 foreach ($file in Get-ChildItem -LiteralPath $extract -Recurse -File) {
  $relative = $file.FullName.Substring($extract.Length).TrimStart([IO.Path]::DirectorySeparatorChar)
  $destination = [IO.Path]::GetFullPath((Join-Path $target $relative))
  $saved = [IO.Path]::GetFullPath((Join-Path $backup $relative))
  Assert-Child $target $destination
  Assert-Child $backup $saved
  $parent = Split-Path $destination
  $check = $parent
  while ($check.Length -ge $target.Length) {if ((Test-Path -LiteralPath $check) -and ((Get-Item -LiteralPath $check).Attributes -band [IO.FileAttributes]::ReparsePoint)) {throw "Junção não permitida na instalação."};$check=Split-Path $check}
  if (Test-Path -LiteralPath $destination) {New-Item -ItemType Directory -Path (Split-Path $saved) -Force | Out-Null;Copy-Item -LiteralPath $destination -Destination $saved -Force}
  New-Item -ItemType Directory -Path $parent -Force | Out-Null
  $written.Add($relative)
  Copy-Item -LiteralPath $file.FullName -Destination $destination -Force
 }
 Start-Process -FilePath (Join-Path $target $exeName) -WindowStyle Hidden
 Remove-Item -LiteralPath (Join-Path $updatesRoot "pending-update.json") -Force -ErrorAction SilentlyContinue
 Assert-Child $updatesRoot $extract
 Remove-Item -LiteralPath $extract -Recurse -Force
 Remove-Item -LiteralPath $zip -Force
} catch {
 foreach ($relative in $written) {
  $destination=Join-Path $target $relative;$saved=Join-Path $backup $relative
  Assert-Child $target $destination;Assert-Child $backup $saved
  if(Test-Path -LiteralPath $saved){Copy-Item -LiteralPath $saved -Destination $destination -Force}else{Remove-Item -LiteralPath $destination -Force -ErrorAction SilentlyContinue}
 }
 "Atualização não aplicada. A versão anterior foi restaurada." | Set-Content -LiteralPath (Join-Path $updatesRoot "last-error.txt")
 Start-Process -FilePath (Join-Path $target $exeName) -WindowStyle Hidden
 throw
}
`;

  fs.mkdirSync(updatesDir, { recursive: true });
  fs.writeFileSync(scriptPath, script, "utf8");

  const powershell = path.join(
    process.env.SystemRoot || "C:\\Windows",
    "System32",
    "WindowsPowerShell",
    "v1.0",
    "powershell.exe",
  );
  // Start-Process creates an independent hidden console. DETACHED_PROCESS can
  // make Windows PowerShell 5.1 exit without executing the installer script.
  const launch = `$ErrorActionPreference='Stop';$ProgressPreference='SilentlyContinue';Start-Process -WindowStyle Hidden -FilePath ${ps(powershell)} -ArgumentList @('-NoProfile','-NonInteractive','-ExecutionPolicy','Bypass','-File',${ps('"' + scriptPath + '"')}) -RedirectStandardOutput ${ps(path.join(updatesDir, "install.log"))} -RedirectStandardError ${ps(path.join(updatesDir, "install-error.log"))} -PassThru | Out-Null`;
  const updater = spawn(
    powershell,
    [
      "-NoProfile",
      "-NonInteractive",
      "-EncodedCommand",
      Buffer.from(launch, "utf16le").toString("base64"),
    ],
    { windowsHide: true, stdio: "ignore" },
  );
  updater.once("error", (error) =>
    updateStatus("error", {
      message: "Não foi possível iniciar a atualização: " + error.message,
    }),
  );
  updater.once("close", (code) => {
    if (code === 0) app.quit();
    else
      updateStatus("error", {
        message:
          "O instalador não iniciou. Tente novamente ou consulte o log de atualização.",
      });
  });
}

async function fetchUpdateManifest() {
  const response = await net.fetch(`${UPDATE_MANIFEST_URL}?t=${Date.now()}`, {
    cache: "no-store",
    redirect: "error",
    signal: AbortSignal.timeout(15000),
    headers: {
      Accept: "application/json",
      "User-Agent": `EnturmaDesktop/${app.getVersion()}`,
    },
  });
  if (!response.ok) {
    throw new Error(`Servidor de atualização respondeu ${response.status}`);
  }
  const manifest = await response.json();
  return validateManifest(manifest, UPDATE_MANIFEST_URL);
}
async function checkForUpdates() {
  if (updateInProgress) return updateState;
  if (!app.isPackaged || process.platform !== "win32") {
    updateStatus("unsupported", {
      message: !app.isPackaged
        ? "Atualizações disponíveis na versão instalada."
        : "Use a página de downloads para atualizar este sistema.",
    });
    return updateState;
  }
  if (pendingUpdate) {
    updateStatus("ready");
    return updateState;
  }
  updateInProgress = true;
  updateStatus("checking", { message: "", progress: 0 });
  try {
    const manifest = await fetchUpdateManifest();
    if (!newerThan(manifest.version, app.getVersion())) {
      updateStatus("current");
      return updateState;
    }
    updateStatus("available", { version: manifest.version });
    const zipPath = await downloadUpdate(manifest);
    pendingUpdate = { manifest, zipPath };
    updateStatus("ready", { version: manifest.version, progress: 100 });
  } catch (error) {
    updateStatus("error", {
      message:
        error instanceof Error ? error.message : "Não foi possível atualizar.",
    });
  } finally {
    updateInProgress = false;
    mainWindow?.setProgressBar(-1);
  }
  return updateState;
}
async function installUpdate() {
  if (!pendingUpdate || updateState.status !== "ready")
    throw Error("Nenhuma atualização pronta.");
  if (
    (await sha256File(pendingUpdate.zipPath)) !==
    pendingUpdate.manifest.sha256.toLowerCase()
  )
    throw Error("Verificação de integridade falhou.");
  updateStatus("installing");
  try {
    installDownloadedUpdate(pendingUpdate.manifest, pendingUpdate.zipPath);
  } catch (e) {
    updateStatus("error", { message: e.message });
    throw e;
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
      callback(isEnturmaUrl(origin) && ALLOWED_PERMISSIONS.has(permission));
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
    minWidth: 360,
    minHeight: 480,
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

ipcMain.handle("desktop:get-info", (event) => {
  requireTrusted(event);
  return {
    version: app.getVersion(),
    platform: process.platform,
    webUrl: WEB_URL,
  };
});
ipcMain.handle("desktop:update-state", (event) => {
  requireTrusted(event);
  return updateState;
});
ipcMain.handle("desktop:check-for-updates", (event) => {
  requireTrusted(event);
  return checkForUpdates();
});
ipcMain.handle("desktop:install-update", (event) => {
  requireTrusted(event);
  return installUpdate();
});
ipcMain.handle("desktop:open-external", (event, url) => {
  requireTrusted(event);
  if (typeof url === "string" && url.length < 4096 && isExternalUrl(url))
    return shell.openExternal(url);
  return false;
});
ipcMain.on("desktop:retry", (event) => {
  if (
    mainWindow &&
    event.sender === mainWindow.webContents &&
    event.senderFrame === mainWindow.webContents.mainFrame &&
    event.senderFrame.url ===
      require("node:url").pathToFileURL(path.join(__dirname, "offline.html"))
        .href
  )
    void mainWindow.loadURL(WEB_URL);
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
