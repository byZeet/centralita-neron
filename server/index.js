const express = require('express');
const cors = require('cors');
const path = require('path');
const cron = require('node-cron');
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

// Tickets API

// Get all tickets
app.get('/api/tickets', (req, res) => {
    db.all(`
        SELECT t.*, o1.name as assignee_name, o2.name as creator_name, o3.name as transferor_name
        FROM tickets t 
        LEFT JOIN operators o1 ON t.assigned_to = o1.id 
        LEFT JOIN operators o2 ON t.created_by = o2.id 
        LEFT JOIN operators o3 ON t.transferred_from = o3.id
        ORDER BY t.created_at DESC
    `, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ tickets: rows });
    });
});

// Cleanup old completed tickets (>30 days)
function cleanupOldTickets() {
    console.log('Running scheduled ticket cleanup...');
    db.run("DELETE FROM tickets WHERE status = 'completed' AND created_at < datetime('now', '-30 days')", function(err) {
        if (err) console.error('Error during cleanup:', err.message);
        else console.log(`Deleted ${this.changes} old completed tickets.`);
    });
}

// Manual cleanup route - Deletes ALL completed tickets
app.post('/api/tickets/cleanup', (req, res) => {
    db.run("DELETE FROM tickets WHERE status = 'completed'", function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Limpieza total completada', count: this.changes });
    });
});

// Schedule cleanup: Every Friday at 18:00
cron.schedule('0 18 * * 5', () => {
    cleanupOldTickets();
}, {
    timezone: "Europe/Madrid"
});

// Create ticket
app.post('/api/tickets', (req, res) => {
    const { client_name, client_number, issue_description, created_by } = req.body;
    if (!client_name || !issue_description) return res.status(400).json({ error: "Faltan datos" });
    
    db.run("INSERT INTO tickets (client_name, client_number, issue_description, created_by) VALUES (?, ?, ?, ?)", 
    [client_name, client_number, issue_description, created_by], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID, success: true });
    });
});

// Update ticket (Assign/Transfer)
app.put('/api/tickets/:id', (req, res) => {
    const { assigned_to, status, transferred_from } = req.body;
    const { id } = req.params;
    
    let query = "UPDATE tickets SET ";
    let params = [];
    let updates = [];
    
    if (assigned_to !== undefined) {
        updates.push("assigned_to = ?");
        params.push(assigned_to);
    }
    if (status !== undefined) {
        updates.push("status = ?");
        params.push(status);
    }
    if (transferred_from !== undefined) {
        updates.push("transferred_from = ?");
        params.push(transferred_from);
    }
    
    if (updates.length === 0) return res.json({ success: true }); 
    
    query += updates.join(", ") + " WHERE id = ?";
    params.push(id);
    
    db.run(query, params, function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

// --- CHAT API ---

// Create Channel (Group or DM)
app.post('/api/channels', (req, res) => {
    const { name, type, members, created_by } = req.body; // members = [user_id, ...]

    if (type === 'dm') {
        // Check if DM already exists between these 2 users
        // Members should contain [userA, userB]
         const memberParams = members.sort().join(',');
         // Doing a precise check is hard in pure SQL without join complexity.
         // Simpler approach: Create if not exists logic in frontend or just always create and filter duplicates?
         // Better: frontend checks if channel exists in list.
    }

    db.run("INSERT INTO channels (name, type, created_by) VALUES (?, ?, ?)", [name, type, created_by], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        const channelId = this.lastID;
        
        // Add members
        const stmt = db.prepare("INSERT INTO channel_members (channel_id, user_id) VALUES (?, ?)");
        members.forEach(uid => stmt.run(channelId, uid));
        stmt.finalize();

        res.json({ id: channelId, name, type });
    });
});

// Get Channels for User
app.get('/api/channels', (req, res) => {
    const userId = req.query.user_id;
    const userDept = req.query.department;

    if (!userId) return res.status(400).json({ error: "User ID required" });

    // Fetch Global, My Dept, and any channel I am a member of
    db.all(`
        SELECT DISTINCT c.*,
        (SELECT MAX(created_at) FROM messages m WHERE m.channel_id = c.id) as last_message_at
        FROM channels c
        LEFT JOIN channel_members cm ON c.id = cm.channel_id
        WHERE 
           c.type = 'global' 
           OR (c.type = 'department' AND c.department_target = ?)
           OR cm.user_id = ?
    `, [userDept, userId], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        
        // For DMs, we might want to fetch the "other user's name" to display
        // But we can handle that in frontend by matching member list.
        // Let's attach members to the channels for simpler frontend handling
        const promises = rows.map(channel => {
            return new Promise((resolve) => {
                db.all("SELECT user_id FROM channel_members WHERE channel_id = ?", [channel.id], (err, members) => {
                    channel.members = members.map(m => m.user_id);
                    resolve(channel);
                });
            });
        });

        Promise.all(promises).then(channels => res.json({ channels }));
    });
});

// Get Messages
app.get('/api/channels/:id/messages', (req, res) => {
    db.all(`
        SELECT m.*, o.name as sender_name 
        FROM messages m
        JOIN operators o ON m.sender_id = o.id
        WHERE m.channel_id = ?
        ORDER BY m.created_at ASC
    `, [req.params.id], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ messages: rows });
    });
});

// Send Message
app.post('/api/channels/:id/messages', (req, res) => {
    const { sender_id, content } = req.body;
    const channelId = req.params.id;
    
    db.run("INSERT INTO messages (channel_id, sender_id, content) VALUES (?, ?, ?)", [channelId, sender_id, content], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID });
    });
});


// Chat Cleanup: Every Sunday at 00:00
cron.schedule('0 0 * * 0', () => {
    console.log('Running weekly chat cleanup...');
    db.run("DELETE FROM messages", (err) => {
        if (err) console.error('Error cleaning chat:', err.message);
        else console.log('Chat messages cleared.');
    });
}, { timezone: "Europe/Madrid" });

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
