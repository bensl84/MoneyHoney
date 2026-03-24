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

// IPC Handlers — key allowlist for security
const ALLOWED_STORE_KEYS = [
  'ynabToken', 'anthropicApiKey', 'ynabBudgetId',
  'goals', 'baseline', 'statementHistory', 'cache',
];

ipcMain.handle('store:get', (_event, key) => {
  if (!ALLOWED_STORE_KEYS.some((k) => key === k || key.startsWith(k + '.'))) {
    return undefined;
  }
  return store.get(key);
});

ipcMain.handle('store:set', (_event, key, value) => {
  if (!ALLOWED_STORE_KEYS.some((k) => key === k || key.startsWith(k + '.'))) {
    return { success: false, error: 'Invalid key' };
  }
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
    if (!filePath || !filePath.toLowerCase().endsWith('.pdf')) {
      return { success: false, error: 'Only PDF files are allowed' };
    }
    const fs = require('fs');
    const pdfParse = require('pdf-parse');
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(dataBuffer);
    return { success: true, text: data.text, pages: data.numpages };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// API proxy — YNAB and Claude APIs don't allow browser CORS, so we proxy through main process
const ALLOWED_API_ORIGINS = ['https://api.ynab.com', 'https://api.anthropic.com'];

ipcMain.handle('api:fetch', async (_event, url, options) => {
  try {
    if (!ALLOWED_API_ORIGINS.some((origin) => url.startsWith(origin))) {
      return { ok: false, status: 403, statusText: 'URL not in allowlist', data: null };
    }
    const res = await fetch(url, {
      method: options.method || 'GET',
      headers: options.headers || {},
      body: options.body || undefined,
    });
    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
    return { ok: res.ok, status: res.status, statusText: res.statusText, data };
  } catch (err) {
    return { ok: false, status: 0, statusText: err.message, data: null };
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
