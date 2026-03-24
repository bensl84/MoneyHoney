const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronStore', {
  get: (key) => ipcRenderer.invoke('store:get', key),
  set: (key, value) => ipcRenderer.invoke('store:set', key, value),
  getAll: () => ipcRenderer.invoke('store:getAll'),
});

contextBridge.exposeInMainWorld('electronPDF', {
  parse: (filePath) => ipcRenderer.invoke('pdf:parse', filePath),
});

contextBridge.exposeInMainWorld('electronDialog', {
  openFile: (filters) => ipcRenderer.invoke('dialog:openFile', filters),
});
