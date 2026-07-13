const router = require('express').Router();
const pool   = require('../db/pool');
const { auth, requireRole } = require('../middleware/auth');

const organizerOrAdmin = [auth, requireRole('organizer', 'admin')];

// GET /api/team - fetch team members
router.get('/', ...organizerOrAdmin, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'select * from team_members where organizer_id = $1 order by created_at desc',
      [req.user.id]
    );
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/team - add team member
router.post('/', ...organizerOrAdmin, async (req, res) => {
  const { name, email, role } = req.body;
  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required' });
  }
  try {
    const { rows } = await pool.query(
      'insert into team_members (organizer_id, name, email, role) values ($1, $2, $3, $4) returning *',
      [req.user.id, name.trim(), email.trim().toLowerCase(), role || 'Editor']
    );
    res.status(201).json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// DELETE /api/team/:id - remove team member
router.delete('/:id', ...organizerOrAdmin, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'delete from team_members where id = $1 and organizer_id = $2 returning id',
      [req.params.id, req.user.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Team member not found' });
    res.json({ message: 'Team member removed successfully.' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
