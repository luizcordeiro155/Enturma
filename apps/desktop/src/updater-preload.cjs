const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('setup', {
  state: () => ipcRenderer.invoke('native-update:state'),
  check: () => ipcRenderer.invoke('native-update:check'),
  install: () => ipcRenderer.invoke('native-update:install'),
  close: () => ipcRenderer.invoke('native-update:close'),
  subscribe: callback => {
    const listener = (_, state) => callback(state);
    ipcRenderer.on('desktop:update-state', listener);
    return () => ipcRenderer.removeListener('desktop:update-state', listener);
  },
});
