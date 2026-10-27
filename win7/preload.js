const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('sqlAPI', {
  mode: () => ipcRenderer.invoke('db:mode'),
  info: () => ipcRenderer.invoke('db:info'),
  load: () => ipcRenderer.invoke('db:load'),
  apply: (ops) => ipcRenderer.invoke('db:apply', ops),
  getDir: () => ipcRenderer.invoke('bk:get'),
  pickDir: () => ipcRenderer.invoke('bk:pick'),
  clearDir: () => ipcRenderer.invoke('bk:clear'),
  writeBackup: (json, name) => ipcRenderer.invoke('bk:write', json, name)
});
