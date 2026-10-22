const { app, BrowserWindow, Menu, session, shell } = require('electron');
const path = require('path');

function createWindow() {
  Menu.setApplicationMenu(null);
  const win = new BrowserWindow({
    width: 900,
    height: 800,
    minWidth: 380,
    title: 'نظام الكاشير',
    autoHideMenuBar: true,
    webPreferences: { contextIsolation: true }
  });
  // فتح روابط واتساب في المتصفح الخارجي
  win.webContents.setWindowOpenHandler(({ url }) => { shell.openExternal(url); return { action: 'deny' }; });
  win.loadFile(path.join(__dirname, 'www', 'index.html'));
}

app.whenReady().then(() => {
  // السماح بالكاميرا فقط (لقراءة الباركود)
  session.defaultSession.setPermissionRequestHandler((wc, permission, cb) => cb(permission === 'media'));
  createWindow();
});

app.on('window-all-closed', () => app.quit());
