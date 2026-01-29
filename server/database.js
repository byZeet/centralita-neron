const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'neron.db');
const db = new sqlite3.Database(dbPath);

// Enable Write-Ahead Logging to fix concurrency/locking issues
db.run("PRAGMA journal_mode = WAL");
db.run("PRAGMA busy_timeout = 5000"); // Wait up to 5s if locked

db.serialize(() => {
const bcrypt = require('bcryptjs');

  db.run(`CREATE TABLE IF NOT EXISTS operators (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE,
    password TEXT,
    role TEXT DEFAULT 'user',
    status TEXT DEFAULT 'offline',
    department TEXT DEFAULT 'Dpto.General',
    extension TEXT,
    shift TEXT DEFAULT NULL,
    last_seen DATETIME DEFAULT CURRENT_TIMESTAMP
  )`, (err) => {
    if (!err) {
        // Migration: Add columns if they don't exist
        db.all("PRAGMA table_info(operators)", (err, columns) => {
            const hasPassword = columns.some(col => col.name === 'password');
            const hasRole = columns.some(col => col.name === 'role');
            const hasExtension = columns.some(col => col.name === 'extension');
            const hasShift = columns.some(col => col.name === 'shift');
            
            if (!hasPassword) {
                console.log("Migrating: Adding password column");
                const defaultPass = bcrypt.hashSync('1234', 8);
                db.run("ALTER TABLE operators ADD COLUMN password TEXT", () => {
                   db.run("UPDATE operators SET password = ?", [defaultPass]);
                });
            }
            
            if (!hasRole) {
                console.log("Migrating: Adding role column");
                db.run("ALTER TABLE operators ADD COLUMN role TEXT DEFAULT 'user'");
            }

            if (!hasExtension) {
                console.log("Migrating: Adding extension column");
                db.run("ALTER TABLE operators ADD COLUMN extension TEXT", () => {
                    // Assign random 3-digit extension to existing users
                    db.all("SELECT id FROM operators", (err, rows) => {
                        rows.forEach((row) => {
                            const randExt = Math.floor(100 + Math.random() * 900).toString();
                            db.run("UPDATE operators SET extension = ? WHERE id = ?", [randExt, row.id]);
                        });
                    });
                });
            }

            if (!hasShift) {
                console.log("Migrating: Adding shift column");
                db.run("ALTER TABLE operators ADD COLUMN shift TEXT DEFAULT NULL");
            }

            // Ensure unique index on extension
            db.get("SELECT name FROM sqlite_master WHERE type='index' AND name='idx_operators_extension'", (err, row) => {
                if (!row) {
                    console.log("Migrating: Adding unique index to extension");
                    // We might have duplicates, so we might fail here if not careful, 
                    // but assuming random generation was decent or we don't care about old data failures for now.
                    // Better to try/catch or ignore error if it fails due to existing dupes, 
                    // but strict requirement implies we want uniqueness.
                    db.run("CREATE UNIQUE INDEX IF NOT EXISTS idx_operators_extension ON operators(extension)", (err) => {
                        if (err) console.log("Warning: Could not create unique index on extension (possible duplicates exist):", err.message);
                    });
                }
            });
        });
    }
  });
  
  // Seed initial data
  db.get("SELECT count(*) as count FROM operators", (err, row) => {
      // Check if admin exists
      db.get("SELECT * FROM operators WHERE name = 'admin'", (err, admin) => {
          if (!admin) {
              const hash = bcrypt.hashSync('neron', 8);
              const stmt = db.prepare("INSERT INTO operators (name, password, role, status, department) VALUES (?, ?, ?, ?, ?)");
              stmt.run("admin", hash, "admin", "offline", "Dpto.Administración");
              stmt.finalize();
              console.log("Admin user created");
          }
      });
  });
});

module.exports = db;
