const router = require('express').Router();
const pool   = require('../db/pool');
const { auth, requireRole } = require('../middleware/auth');

const organizerOrAdmin = [auth, requireRole('organizer', 'admin')];

// GET /api/discounts - fetch organizer's discounts
router.get('/', ...organizerOrAdmin, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'select * from discounts where organizer_id = $1 order by created_at desc',
      [req.user.id]
    );
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/discounts - create a new discount
router.post('/', ...organizerOrAdmin, async (req, res) => {
  const { code, discount_percent, max_uses } = req.body;
  if (!code || !discount_percent) {
    return res.status(400).json({ error: 'Code and discount percent are required' });
  }
  try {
    const { rows } = await pool.query(
      'insert into discounts (organizer_id, code, discount_percent, max_uses) values ($1, $2, $3, $4) returning *',
      [req.user.id, code.toUpperCase().trim(), discount_percent, max_uses || null]
    );
    res.status(201).json(rows[0]);
  } catch (e) {
    if (e.code === '23505') {
      return res.status(409).json({ error: 'Discount code already exists.' });
    }
    res.status(500).json({ error: e.message });
  }
});

// PATCH /api/discounts/:id/toggle - enable/disable discount
router.patch('/:id/toggle', ...organizerOrAdmin, async (req, res) => {
  const { is_active } = req.body;
  try {
    const { rows } = await pool.query(
      'update discounts set is_active = $1 where id = $2 and organizer_id = $3 returning *',
      [is_active, req.params.id, req.user.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Discount not found' });
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// DELETE /api/discounts/:id - delete a discount
router.delete('/:id', ...organizerOrAdmin, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'delete from discounts where id = $1 and organizer_id = $2 returning id',
      [req.params.id, req.user.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Discount not found' });
    res.json({ message: 'Discount deleted successfully.' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
