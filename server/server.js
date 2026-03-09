const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const crypto = require('crypto');

// ============================================
//  COVINOR Régleur — Backend Express
//  Usage: node server.js
// ============================================

const PORT = process.env.PORT || 3001;

const dbConfig = {
  host: process.env.MYSQL_HOST || 'localhost',
  port: parseInt(process.env.MYSQL_PORT || '3306'),
  user: process.env.MYSQL_USER || 'covinor',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'covinor_regleur',
  waitForConnections: true,
  connectionLimit: 10,
};

const pool = mysql.createPool(dbConfig);

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// --- Health check ---
app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', db: 'connected' });
  } catch (e) {
    res.status(500).json({ status: 'error', db: 'disconnected', error: e.message });
  }
});

// --- Auth ---
function sha256(str) {
  return crypto.createHash('sha256').update(str).digest('hex');
}

app.post('/api/auth', async (req, res) => {
  try {
    const { action, username, password } = req.body;

    if (action === 'login') {
      const hashed = sha256(password);
      const [rows] = await pool.query(
        'SELECT id, username FROM users WHERE username = ? AND password_hash = ?',
        [username, hashed]
      );

      if (rows.length === 0) {
        return res.status(401).json({ error: 'Identifiants incorrects' });
      }

      const user = rows[0];
      const token = crypto.randomUUID();
      res.json({ ok: true, user: { id: user.id, username: user.username }, token });
    } else {
      res.status(400).json({ error: 'Action inconnue' });
    }
  } catch (e) {
    console.error('Auth error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// --- MySQL API (fiches & notes) ---
app.post('/api/data', async (req, res) => {
  try {
    const { action, table, data, id } = req.body;

    if (table === 'fiches') {
      switch (action) {
        case 'list': {
          const [rows] = await pool.query('SELECT * FROM fiches ORDER BY createdAt DESC');
          return res.json(rows);
        }
        case 'save': {
          const [existing] = await pool.query('SELECT id FROM fiches WHERE id = ?', [data.id]);
          if (existing.length > 0) {
            await pool.query(
              `UPDATE fiches SET codeProduit=?, reference=?, dateApplication=?, designation=?, client=?, marque=?, gencod=?, bouteille=?, bouchon=?, etiquette=?, colle=?, dluo=?, carton=?, collerCarton=?, etiquetteCarton=?, intercalaire=?, typePalette=?, palettisation=?, uvcParCarton=?, cartonsParCouche=?, couchesParPalette=?, uvcParPalette=?, filmEtirable=?, etiquettePalette=?, imageUrl=?, notes=? WHERE id=?`,
              [
                data.codeProduit, data.reference, data.dateApplication, data.designation,
                data.client, data.marque, data.gencod, data.bouteille, data.bouchon,
                data.etiquette, data.colle, data.dluo, data.carton, data.collerCarton,
                data.etiquetteCarton, data.intercalaire, data.typePalette, data.palettisation,
                data.uvcParCarton, data.cartonsParCouche, data.couchesParPalette, data.uvcParPalette,
                data.filmEtirable, data.etiquettePalette, data.imageUrl || '', data.notes,
                data.id,
              ]
            );
          } else {
            await pool.query(
              `INSERT INTO fiches (id, codeProduit, reference, dateApplication, designation, client, marque, gencod, bouteille, bouchon, etiquette, colle, dluo, carton, collerCarton, etiquetteCarton, intercalaire, typePalette, palettisation, uvcParCarton, cartonsParCouche, couchesParPalette, uvcParPalette, filmEtirable, etiquettePalette, imageUrl, notes, createdAt) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
              [
                data.id, data.codeProduit, data.reference, data.dateApplication, data.designation,
                data.client, data.marque, data.gencod, data.bouteille, data.bouchon,
                data.etiquette, data.colle, data.dluo, data.carton, data.collerCarton,
                data.etiquetteCarton, data.intercalaire, data.typePalette, data.palettisation,
                data.uvcParCarton, data.cartonsParCouche, data.couchesParPalette, data.uvcParPalette,
                data.filmEtirable, data.etiquettePalette, data.imageUrl || '', data.notes,
                data.createdAt,
              ]
            );
          }
          return res.json({ ok: true });
        }
        case 'delete': {
          await pool.query('DELETE FROM fiches WHERE id = ?', [id]);
          return res.json({ ok: true });
        }
      }
    } else if (table === 'notes') {
      switch (action) {
        case 'list': {
          const [rows] = await pool.query('SELECT * FROM format_notes ORDER BY updatedAt DESC');
          const parsed = rows.map((r) => ({
            ...r,
            keywords: typeof r.keywords === 'string' ? JSON.parse(r.keywords) : (r.keywords || []),
            machines: typeof r.machines === 'string' ? JSON.parse(r.machines) : (r.machines || []),
          }));
          return res.json(parsed);
        }
        case 'save': {
          const [existing] = await pool.query('SELECT id FROM format_notes WHERE id = ?', [data.id]);
          const keywordsJson = JSON.stringify(data.keywords || []);
          const machinesJson = JSON.stringify(data.machines || []);
          if (existing.length > 0) {
            await pool.query(
              'UPDATE format_notes SET title=?, content=?, keywords=?, machines=?, updatedAt=? WHERE id=?',
              [data.title, data.content, keywordsJson, machinesJson, data.updatedAt, data.id]
            );
          } else {
            await pool.query(
              'INSERT INTO format_notes (id, title, content, keywords, machines, createdAt, updatedAt) VALUES (?,?,?,?,?,?,?)',
              [data.id, data.title, data.content, keywordsJson, machinesJson, data.createdAt, data.updatedAt]
            );
          }
          return res.json({ ok: true });
        }
        case 'delete': {
          await pool.query('DELETE FROM format_notes WHERE id = ?', [id]);
          return res.json({ ok: true });
        }
      }
    }

    res.status(400).json({ error: 'Requête invalide' });
  } catch (e) {
    console.error('Data error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// --- Start ---
app.listen(PORT, () => {
  console.log(`\n  🚀 COVINOR Backend démarré sur le port ${PORT}`);
  console.log(`  📡 API : http://localhost:${PORT}/api/health\n`);
});
