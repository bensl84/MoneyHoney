const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const Store = require('electron-store');

const store = new Store({
  defaults: {
    ynabToken: '',
    anthropicApiKey: '',
    ynabBudgetId: '',
    goals: {
      bofaTarget: 0,
      bofaCurrentBalance: 13500,
      bofaLastUpdated: '',
      leakageLimits: {
        'Dining Out': 150,
        'Booze': 80,
        'Kids Activities / Stuff': 200,
        'Amazon / Online Shopping': 150,
      },
    },
    baseline: {
      categoryAverages: {},
      lastCalculated: '',
      monthsOfData: 0,
    },
    statementHistory: [],
    cache: {
      lastFetchDate: '',
      transactions: [],
    },
  },
});

const isDev = !app.isPackaged;

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    resizable: true,
    minWidth: 1000,
    minHeight: 700,
    backgroundColor: '#0a0a0f',
    title: 'MoneyHoney',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }

  mainWindow.setMenuBarVisibility(false);
}

// IPC Handlers
ipcMain.handle('store:get', (_event, key) => {
  return store.get(key);
});

ipcMain.handle('store:set', (_event, key, value) => {
  store.set(key, value);
  return { success: true };
});

ipcMain.handle('store:getAll', () => {
  return store.store;
});

ipcMain.handle('dialog:openFile', async (_event, filters) => {
  const result = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: filters || [{ name: 'PDF Files', extensions: ['pdf'] }],
  });
  if (result.canceled || result.filePaths.length === 0) {
    return { filePath: null };
  }
  return { filePath: result.filePaths[0] };
});

ipcMain.handle('pdf:parse', async (_event, filePath) => {
  try {
    const fs = require('fs');
    const pdfParse = require('pdf-parse');
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(dataBuffer);
    return { success: true, text: data.text, pages: data.numpages };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
