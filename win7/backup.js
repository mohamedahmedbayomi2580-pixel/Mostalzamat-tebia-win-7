// ربط مجلد النسخ الاحتياطي اليومي (يُحفظ مساره في config.json داخل مجلد بيانات البرنامج)
const fs = require('fs');
const path = require('path');
const { app, ipcMain, dialog, BrowserWindow } = require('electron');

const cfgFile = () => path.join(app.getPath('userData'), 'config.json');
const rd = () => { try { return JSON.parse(fs.readFileSync(cfgFile(), 'utf8')); } catch (e) { return {}; } };
const wr = (c) => { fs.mkdirSync(path.dirname(cfgFile()), { recursive: true }); fs.writeFileSync(cfgFile(), JSON.stringify(c)); };

ipcMain.handle('bk:get', () => rd().bkdir || '');

ipcMain.handle('bk:pick', async () => {
  const w = BrowserWindow.getFocusedWindow();
  const r = await dialog.showOpenDialog(w, {
    title: 'اختر مجلد النسخ الاحتياطي',
    properties: ['openDirectory', 'createDirectory']
  });
  if (r.canceled || !r.filePaths[0]) return rd().bkdir || '';
  const c = rd(); c.bkdir = r.filePaths[0]; wr(c);
  return c.bkdir;
});

ipcMain.handle('bk:clear', () => { const c = rd(); delete c.bkdir; wr(c); return ''; });

ipcMain.handle('bk:write', (e, json, name) => {
  const d = rd().bkdir;
  if (!d) return { ok: false, err: 'no-dir' };
  try {
    fs.mkdirSync(d, { recursive: true });
    const f = path.join(d, String(name).replace(/[^\w.\-]/g, '_'));
    fs.writeFileSync(f + '.tmp', json);
    fs.renameSync(f + '.tmp', f);
    // الاحتفاظ بآخر 30 نسخة فقط
    fs.readdirSync(d).filter(x => /^cashier-backup-.*\.json$/.test(x)).sort().reverse().slice(30)
      .forEach(x => { try { fs.unlinkSync(path.join(d, x)); } catch (_) {} });
    return { ok: true, path: f };
  } catch (err) {
    return { ok: false, err: String(err.message || err) };
  }
});
