const express = require('express');
const cors    = require('cors');

const app = express();
const pool = require('../server/src/db/pool');

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:5173', 'http://localhost:4173'];

app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json());

app.get('/api/health', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT NOW() as time');
    res.json({ status: 'ok', time: rows[0].time, db: 'connected' });
  } catch (err) {
    res.json({ status: 'ok', time: new Date(), db: 'error', error: err.message });
  }
});

module.exports = app;
