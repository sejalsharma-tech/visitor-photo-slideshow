const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'visitor_slideshow',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Safely ensure new columns exist on existing local MySQL installations
async function ensureSchemaColumns() {
  try {
    const dbName = process.env.DB_NAME || 'visitor_slideshow';
    const [cols] = await pool.query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'photos'`,
      [dbName]
    );
    const existing = new Set(cols.map((c) => c.COLUMN_NAME));

    if (!existing.has('caption')) {
      await pool.query(`ALTER TABLE photos ADD COLUMN caption VARCHAR(100) DEFAULT NULL`);
    }
    if (!existing.has('frame_style')) {
      await pool.query(`ALTER TABLE photos ADD COLUMN frame_style VARCHAR(20) NOT NULL DEFAULT 'glass'`);
    }
  } catch (err) {
    console.error('Schema column check warning:', err.message);
  }
}

ensureSchemaColumns();

module.exports = pool;
