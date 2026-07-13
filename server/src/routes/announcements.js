const router = require('express').Router();
const pool   = require('../db/pool');
const { auth } = require('../middleware/auth');

// GET /api/announcements - fetch announcements relevant to the logged-in user's role
router.get('/', auth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      "select * from announcements where audience = 'all' or audience = $1 order by created_at desc limit 50",
      [req.user.role]
    );
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
