const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("enturmaDesktopPicker", {
  onSources: (callback) => {
    ipcRenderer.once("desktop-picker:sources", (_event, sources) =>
      callback(sources),
    );
  },
  select: (id) => ipcRenderer.send("desktop-picker:select", id),
  cancel: () => ipcRenderer.send("desktop-picker:cancel"),
});
