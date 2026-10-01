const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("enturmaDesktop", {
  isDesktop: true,
  getInfo: () => ipcRenderer.invoke("desktop:get-info"),
  checkForUpdates: () => ipcRenderer.invoke("desktop:check-for-updates"),
  openExternal: (url) => ipcRenderer.invoke("desktop:open-external", url),
});

contextBridge.exposeInMainWorld("enturmaOffline", {
  retry: () => ipcRenderer.send("desktop:retry"),
});
