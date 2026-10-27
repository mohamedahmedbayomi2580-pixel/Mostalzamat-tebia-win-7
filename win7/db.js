// طبقة التخزين: SQLite (better-sqlite3) وإن لم تتوفر يُستخدم ملف على القرص
const fs = require('fs');
const path = require('path');
const { app, ipcMain } = require('electron');

const TB = ['p', 'c', 'i', 'r', 'h', 'kv'];
let mode = 'file', db = null, mem = {}, file = '', dbpath = '', ver = '';

function init() {
  const dir = app.getPath('userData');
  fs.mkdirSync(dir, { recursive: true });
  try {
    const D = require('better-sqlite3');
    dbpath = path.join(dir, 'cashier.db');
    db = new D(dbpath);
    db.pragma('journal_mode = WAL');
    TB.forEach(t => db.exec(`CREATE TABLE IF NOT EXISTS ${t}(k ${t === 'kv' ? 'TEXT' : 'INTEGER'} PRIMARY KEY, j TEXT NOT NULL)`));
    ver = db.prepare('select sqlite_version() as v').get().v;
    mode = 'sqlite';
  } catch (e) {
    mode = 'file';
    file = path.join(dir, 'cashier-data.json');
    try { mem = JSON.parse(fs.readFileSync(file, 'utf8')); } catch (x) { mem = {}; }
    TB.forEach(t => { mem[t] = mem[t] || {}; });
  }
}

ipcMain.handle('db:mode', () => mode);

ipcMain.handle('db:info', () => {
  const p = mode === 'sqlite' ? dbpath : file;
  let size = 0;
  try { size = fs.statSync(p).size; } catch (e) {}
  return { mode, ver, path: p, size };
});

ipcMain.handle('db:load', () => {
  const o = {};
  TB.forEach(t => {
    if (mode === 'sqlite') o[t] = db.prepare(`SELECT k, j FROM ${t} ORDER BY k`).all();
    else o[t] = Object.keys(mem[t]).map(k => ({ k: t === 'kv' ? k : Number(k), j: mem[t][k] })).sort((a, b) => (t === 'kv' ? 0 : a.k - b.k));
  });
  return o;
});

ipcMain.handle('db:apply', (e, ops) => {
  if (mode === 'sqlite') {
    const ins = {}, del = {};
    TB.forEach(t => {
      ins[t] = db.prepare(`INSERT OR REPLACE INTO ${t}(k, j) VALUES(?, ?)`);
      del[t] = db.prepare(`DELETE FROM ${t} WHERE k = ?`);
    });
    db.transaction(() => {
      ops.forEach(o => {
        if (!TB.includes(o.t)) return;
        if (o.d) del[o.t].run(o.k); else ins[o.t].run(o.k, o.j);
      });
    })();
  } else {
    ops.forEach(o => {
      if (!TB.includes(o.t)) return;
      if (o.d) delete mem[o.t][o.k]; else mem[o.t][o.k] = o.j;
    });
    const tmp = file + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(mem));
    fs.renameSync(tmp, file);
  }
  return true;
});

app.on('quit', () => { try { if (db) db.close(); } catch (e) {} });

module.exports = { init };
