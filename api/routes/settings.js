const router = require('express').Router();
const pool   = require('../db/pool');
const { auth, requireRole } = require('../middleware/auth');

// Public: check if registration is open
router.get('/registration-open', async (req, res) => {
  try {
    const { rows } = await pool.query(
      "select value from settings where key = 'registration_open'"
    );
    res.json({ open: rows[0]?.value === 'true' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Public: check if maintenance mode is active
router.get('/maintenance-mode', async (req, res) => {
  try {
    const { rows } = await pool.query(
      "select value from settings where key = 'maintenance_mode'"
    );
    res.json({ maintenance: rows[0]?.value === 'true' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Admin: get all settings
router.get('/admin', auth, requireRole('admin'), async (req, res) => {
  try {
    const { rows } = await pool.query('select key, value from settings order by key');
    const obj = {};
    for (const r of rows) obj[r.key] = r.value;
    res.json(obj);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Admin: update settings
router.put('/admin', auth, requireRole('admin'), async (req, res) => {
  const updates = req.body;
  if (!updates || typeof updates !== 'object') return res.status(400).json({ error: 'Expected object of key-value pairs' });
  try {
    for (const [key, value] of Object.entries(updates)) {
      if (typeof value === 'string') {
        await pool.query(
          'insert into settings (key, value, updated_at) values ($1, $2, now()) on conflict (key) do update set value = $2, updated_at = now()',
          [key, value]
        );
      }
    }
    const { rows } = await pool.query('select key, value from settings order by key');
    const obj = {};
    for (const r of rows) obj[r.key] = r.value;
    res.json(obj);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
