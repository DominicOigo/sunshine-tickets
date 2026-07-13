const router = require('express').Router();
const pool   = require('../db/pool');
const { auth, requireRole } = require('../middleware/auth');

// Public: list all active payment methods
router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'select * from payment_methods where is_active = true order by sort_order'
    );
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Public: payment methods for a specific organizer (event's organizer)
router.get('/organizer/:organizerId', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      select pm.*, opm.is_active as organizer_active
      from payment_methods pm
      join organizer_payment_methods opm on opm.payment_method_id = pm.id
      where opm.organizer_id = $1 and opm.is_active = true and pm.is_active = true
      order by pm.sort_order
    `, [req.params.organizerId]);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Auth organizer: get own payment methods
router.get('/my', auth, requireRole('organizer'), async (req, res) => {
  try {
    const { rows } = await pool.query(`
      select pm.*,
             coalesce(opm.is_active, false) as organizer_active
      from payment_methods pm
      left join organizer_payment_methods opm
        on opm.payment_method_id = pm.id and opm.organizer_id = $1
      where pm.is_active = true
      order by pm.sort_order
    `, [req.user.id]);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Auth organizer: toggle a payment method
router.put('/my/toggle', auth, requireRole('organizer'), async (req, res) => {
  const { method_id, active } = req.body;
  if (!method_id) return res.status(400).json({ error: 'method_id required' });
  try {
    await pool.query(`
      insert into organizer_payment_methods (organizer_id, payment_method_id, is_active)
      values ($1, $2, $3)
      on conflict (organizer_id, payment_method_id)
      do update set is_active = $3
    `, [req.user.id, method_id, active ? true : false]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Admin: get all payment methods
router.get('/admin', auth, requireRole('admin'), async (req, res) => {
  try {
    const { rows } = await pool.query('select * from payment_methods order by sort_order');
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Admin: update a payment method
router.put('/admin/:id', auth, requireRole('admin'), async (req, res) => {
  const { name, description, icon, is_active, sort_order } = req.body;
  try {
    const { rows } = await pool.query(
      `update payment_methods set name=coalesce($1,name), description=coalesce($2,description),
       icon=coalesce($3,icon), is_active=coalesce($4,is_active), sort_order=coalesce($5,sort_order),
       updated_at=now() where id=$6 returning *`,
      [name, description, icon, is_active, sort_order, req.params.id]
    );
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
