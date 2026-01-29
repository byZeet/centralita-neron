const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// API Routes

// Get all operators
app.get('/api/operators', (req, res) => {
  db.all("SELECT * FROM operators", [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ operators: rows });
  });
});

const bcrypt = require('bcryptjs');

// Login
app.post('/api/login', (req, res) => {
  const { name, password } = req.body;
  if (!name || !password) return res.status(400).json({ error: "Nombre y contraseña requeridos" });

  db.get("SELECT * FROM operators WHERE LOWER(name) = LOWER(?)", [name], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    
    if (!row) {
        return res.status(401).json({ error: "Usuario no existe" });
    }

    const valid = bcrypt.compareSync(password, row.password);
    if (!valid) {
        return res.status(401).json({ error: "Contraseña incorrecta" });
    }

    // Success
    // Don't send password back
    const { password: _, ...userWithoutPass } = row;
    res.json({ operator: userWithoutPass });
  });
});

// ADMIN: Create User
app.post('/api/operators', (req, res) => {
    console.log("Received operator creation request:", req.body);
    const { name, password, department, role, extension, shift } = req.body;
    if (!name || !password) return res.status(400).json({ error: "Datos incompletos" });

    const hash = bcrypt.hashSync(password, 8);
    const userRole = role || 'user';
    const dept = department || 'Dpto.General';
    // If no extension provided, generate random one
    const ext = extension || Math.floor(100 + Math.random() * 900).toString();
    const userShift = shift || null;

    db.run("INSERT INTO operators (name, password, role, department, extension, shift, status) VALUES (?, ?, ?, ?, ?, ?, ?)", 
        [name, hash, userRole, dept, ext, userShift, 'offline'], 
        function(err) {
            if (err) {
                console.error("Error creating user:", err.message);
                if (err.message.includes('UNIQUE constraint failed')) {
                    if (err.message.includes('operators.name')) {
                        return res.status(400).json({ error: "El nombre de usuario ya existe." });
                    }
                    if (err.message.includes('operators.extension') || err.message.includes('idx_operators_extension')) {
                        return res.status(400).json({ error: "La extensión ya está asignada a otro usuario." });
                    }
                }
                return res.status(400).json({ error: "Error al crear usuario: " + err.message });
            }
            res.json({ id: this.lastID, name, role: userRole, department: dept, extension: ext, shift: userShift });
        }
    );
});

// ADMIN: Update User
app.put('/api/operators/:id', (req, res) => {
    const { name, department, password, role, extension, shift } = req.body;
    const { id } = req.params;

    let query = "UPDATE operators SET name = ?, department = ?, role = ?, extension = ?, shift = ? WHERE id = ?";
    let params = [name, department, role, extension, shift, id];

    if (password) {
        const hash = bcrypt.hashSync(password, 8);
        query = "UPDATE operators SET name = ?, department = ?, role = ?, extension = ?, shift = ?, password = ? WHERE id = ?";
        params = [name, department, role, extension, shift, hash, id];
    }

    db.run(query, params, function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

// ADMIN: Delete User
app.delete('/api/operators/:id', (req, res) => {
    db.run("DELETE FROM operators WHERE id = ?", [req.params.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

// Update status or shift (User Profile)
app.post('/api/status', (req, res) => {
  const { id, status, shift } = req.body;
  
  if (status && !['available', 'busy', 'away', 'offline'].includes(status)) {
    return res.status(400).json({ error: "Invalid status" });
  }

  let query = "UPDATE operators SET last_seen = CURRENT_TIMESTAMP";
  let params = [];

  if (status) { // Update status
      query += ", status = ?";
      params.push(status);
  }
  if (shift !== undefined) { // Update shift (allow null)
      query += ", shift = ?";
      params.push(shift);
  }

  query += " WHERE id = ?";
  params.push(id);

  db.run(query, params, function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// Serve frontend in production (after build)
const clientBuildPath = path.join(__dirname, '../client/dist');
app.use(express.static(clientBuildPath));

// For any other request, send index.html (SPA support)
app.get(/(.*)/, (req, res) => {
    if (require('fs').existsSync(path.join(clientBuildPath, 'index.html'))) {
        res.sendFile(path.join(clientBuildPath, 'index.html'));
    } else {
        res.send('API running. Frontend not built yet. Run "npm run build" in client folder.');
    }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});
