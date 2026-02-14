const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./bot.db');

// Crear tabla de inventario
db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS inventory (
            userId TEXT,
            code TEXT,
            idol TEXT,
            grupo TEXT,
            era TEXT,
            issue INTEGER,
            image TEXT
        )
    `);
});

module.exports = db;
