const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = process.env.RAILWAY_VOLUME_MOUNT_PATH
    ? path.join(process.env.RAILWAY_VOLUME_MOUNT_PATH, 'stocks.db')
    : path.resolve(__dirname, 'stocks.db');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to the SQLite database.');
        initDb();
    }
});

function initDb() {
    db.run(`CREATE TABLE IF NOT EXISTS portfolio (
    symbol TEXT PRIMARY KEY
  )`, (err) => {
        if (err) {
            console.error('Error creating table:', err.message);
        } else {
            // Seed default data if empty
            // We check if table is empty first to avoid duplicates or errors if unique constraint is hit (though INSERT OR IGNORE works too)
            const defaultStocks = ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'AMZN'];

            db.get("SELECT count(*) as count FROM portfolio", (err, row) => {
                if (err) return console.error(err);

                if (row.count === 0) {
                    console.log("Seeding initial data...");
                    const stmt = db.prepare("INSERT INTO portfolio (symbol) VALUES (?)");
                    defaultStocks.forEach(stock => stmt.run(stock));
                    stmt.finalize();
                }
            });
        }
    });
}

function getPortfolio() {
    return new Promise((resolve, reject) => {
        db.all("SELECT symbol FROM portfolio", [], (err, rows) => {
            if (err) reject(err);
            else resolve(rows.map(r => r.symbol));
        });
    });
}

function addStock(symbol) {
    return new Promise((resolve, reject) => {
        const stmt = db.prepare("INSERT OR IGNORE INTO portfolio (symbol) VALUES (?)");
        stmt.run(symbol, function (err) {
            if (err) reject(err);
            else resolve(this.changes);
        });
        stmt.finalize();
    });
}

function removeStock(symbol) {
    return new Promise((resolve, reject) => {
        const stmt = db.prepare("DELETE FROM portfolio WHERE symbol = ?");
        stmt.run(symbol, function (err) {
            if (err) reject(err);
            else resolve(this.changes);
        });
        stmt.finalize();
    });
}

module.exports = { db, getPortfolio, addStock, removeStock };
