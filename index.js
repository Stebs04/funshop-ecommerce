let sql;
const sqlite = require('sqlite3').verbose();

const db = new sqlite.Database('database/datastorage.db',sqlite3.OPEN_READWRITE ,(err) => {
  if (err) throw err;
});

sql = `CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL
);`;

db.run(sql);