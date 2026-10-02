const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("enturmaDesktop", {
  isDesktop: true,
  getInfo: () => ipcRenderer.invoke("desktop:get-info"),
  getUpdateState: () => ipcRenderer.invoke("desktop:update-state"),
  installUpdate: () => ipcRenderer.invoke("desktop:install-update"),
  onUpdateState: (callback) => {
    if (typeof callback !== "function") throw TypeError("callback required");
    const listener = (_event, state) => callback(state);
    ipcRenderer.on("desktop:update-state", listener);
    return () => ipcRenderer.removeListener("desktop:update-state", listener);
  },
  checkForUpdates: () => ipcRenderer.invoke("desktop:check-for-updates"),
  openExternal: (url) => ipcRenderer.invoke("desktop:open-external", url),
});

contextBridge.exposeInMainWorld("enturmaOffline", {
  retry: () => ipcRenderer.send("desktop:retry"),
});
