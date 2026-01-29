const fs = require('fs');
const path = require('path');

// Portability Support for PKG executable
let sqlite3;
try {
    // Standard load
    sqlite3 = require('sqlite3').verbose();
} catch (e) {
    // If we are inside PKG, we might need to load the .node file manually from the local folder
    try {
        const bindingPath = path.resolve(process.cwd(), 'node_sqlite3.node');
        const binding = require(bindingPath);
        sqlite3 = require('sqlite3').verbose(); 
        // Note: some versions of sqlite3 need more complex binding injection, 
        // but often just having it in the same dir or using a custom loader works.
    } catch (err) {
        console.error("Critical: Could not load sqlite3 binding. Please ensure node_sqlite3.node is next to the .exe");
        process.exit(1);
    }
}

// We want the database to stay in a folder "BaseCentralita" next to the .exe
const baseDir = path.join(process.cwd(), 'BaseCentralita');
if (!fs.existsSync(baseDir)) {
    fs.mkdirSync(baseDir, { recursive: true });
}

const dbPath = path.resolve(baseDir, 'neron.db');
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
  
  // Check/Create tickets table
  db.run(`CREATE TABLE IF NOT EXISTS tickets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_name TEXT,
    client_number TEXT,
    issue_description TEXT,
    status TEXT DEFAULT 'pending',
    assigned_to INTEGER,
    created_by INTEGER,
    transferred_from INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(assigned_to) REFERENCES operators(id),
    FOREIGN KEY(created_by) REFERENCES operators(id),
    FOREIGN KEY(transferred_from) REFERENCES operators(id)
  )`);

  // Migration: Add created_by if it doesn't exist
  db.all("PRAGMA table_info(tickets)", (err, columns) => {
    if (err) return;
    const hasCreatedBy = columns.some(col => col.name === 'created_by');
    if (!hasCreatedBy) {
      db.run("ALTER TABLE tickets ADD COLUMN created_by INTEGER REFERENCES operators(id)");
    }
    const hasTransferredFrom = columns.some(col => col.name === 'transferred_from');
    if (!hasTransferredFrom) {
      db.run("ALTER TABLE tickets ADD COLUMN transferred_from INTEGER REFERENCES operators(id)");
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
