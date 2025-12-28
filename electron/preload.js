const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
  openPdf: () => ipcRenderer.invoke("pdf:open"),
  saveQuestion: data => ipcRenderer.invoke("db:saveQuestion", data)
});
