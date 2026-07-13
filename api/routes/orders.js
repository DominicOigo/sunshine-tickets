const router = require('express').Router();
const pool   = require('../db/pool');
const { auth, requireRole } = require('../middleware/auth');

// POST /api/orders  — create order + payment record
router.post('/', auth, async (req, res) => {
  const { event_id, tier_id, quantity, phone, payment_method = 'mpesa' } = req.body;
  if (!event_id || !tier_id || !quantity || !phone) return res.status(400).json({ error: 'Missing required fields' });
  const client = await pool.connect();
  try {
    await client.query('begin');
    const { rows: tiers } = await client.query('select * from ticket_tiers where id=$1 for update', [tier_id]);
    const tier = tiers[0];
    if (!tier) throw new Error('Ticket tier not found');
    if (tier.capacity - tier.sold < quantity) throw new Error('Not enough tickets available');

    const total = tier.price * quantity;
    const { rows } = await client.query(
      `insert into orders (customer_id,event_id,tier_id,quantity,unit_price,total_amount,status,phone)
       values($1,$2,$3,$4,$5,$6,'pending',$7) returning *`,
      [req.user.id, event_id, tier_id, quantity, tier.price, total, phone]
    );
    const order = rows[0];

    const method = ['mpesa','card','bank_transfer','cash'].includes(payment_method) ? payment_method : 'mpesa';
    const { rows: payments } = await client.query(
      `insert into payments (order_id,customer_id,amount,method,mpesa_phone,status)
       values($1,$2,$3,$4,$5,'pending') returning *`,
      [order.id, req.user.id, total, method, method === 'mpesa' ? phone : null]
    );

    await client.query('commit');
    res.status(201).json({ order, payment: payments[0] });
  } catch (e) { await client.query('rollback'); res.status(400).json({ error: e.message }); }
  finally { client.release(); }
});

// GET /api/orders/:id/payment — get payment details for an order
router.get('/:id/payment', auth, async (req, res) => {
  try {
    const { rows } = await pool.query('select * from payments where order_id=$1', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Payment not found' });
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/orders/:id/confirm-payment  — simulate M-Pesa confirmation
router.post('/:id/confirm-payment', auth, async (req, res) => {
  const { payment_id } = req.body;
  try {
    const mpesa_code = 'SIM' + Math.random().toString(36).slice(2,10).toUpperCase();
    await pool.query("update payments set status='success',mpesa_code=$1,updated_at=now() where id=$2", [mpesa_code, payment_id]);
    await pool.query("update orders set status='confirmed',updated_at=now() where id=$1", [req.params.id]);
    res.json({ mpesa_code });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/orders/confirm-payment-direct — simulate direct payment confirmation
router.post('/confirm-payment-direct', auth, async (req, res) => {
  const { payment_id } = req.body;
  try {
    const mpesa_code = 'SIM' + Math.random().toString(36).slice(2,10).toUpperCase();
    const { rows } = await pool.query('select order_id from payments where id=$1', [payment_id]);
    if (!rows[0]) return res.status(404).json({ error: 'Payment not found' });
    const order_id = rows[0].order_id;
    await pool.query("update payments set status='success',mpesa_code=$1,updated_at=now() where id=$2", [mpesa_code, payment_id]);
    await pool.query("update orders set status='confirmed',updated_at=now() where id=$1", [order_id]);
    res.json({ mpesa_code });
  } catch (e) { res.status(500).json({ error: e.message }); }
});


// POST /api/orders/fail-payment-direct — simulate direct payment failure
router.post('/fail-payment-direct', auth, async (req, res) => {
  const { payment_id, reason } = req.body;
  try {
    await pool.query("update payments set status='failed',failure_reason=$1,updated_at=now() where id=$2", [reason||null, payment_id]);
    res.json({ message: 'Failed status updated' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/orders/payment-direct/:payment_id — get payment details directly by payment ID
router.get('/payment-direct/:payment_id', auth, async (req, res) => {
  try {
    const { rows } = await pool.query('select * from payments where id=$1', [req.params.payment_id]);
    if (!rows[0]) return res.status(404).json({ error: 'Payment not found' });
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/orders/mine
router.get('/mine', auth, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      select o.*, e.title as event_title, t.name as tier_name,
             p.mpesa_code, p.status as payment_status, p.reference as payment_ref
      from orders o
      join events e on e.id = o.event_id
      join ticket_tiers t on t.id = o.tier_id
      left join payments p on p.order_id = o.id
      where o.customer_id = $1
      order by o.created_at desc
    `, [req.user.id]);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/orders  — admin all orders
router.get('/', auth, requireRole('admin'), async (req, res) => {
  try {
    const { rows } = await pool.query(`
      select o.*, e.title as event_title, t.name as tier_name,
             u.full_name as customer_name, u.email as customer_email,
             p.mpesa_code, p.status as payment_status
      from orders o
      join events e on e.id = o.event_id
      join ticket_tiers t on t.id = o.tier_id
      join users u on u.id = o.customer_id
      left join payments p on p.order_id = o.id
      order by o.created_at desc
      limit 200
    `);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/orders/organizer — organizer sees all orders for all their events
router.get('/organizer', auth, requireRole('organizer','admin'), async (req, res) => {
  try {
    const { rows } = await pool.query(`
      select o.*, e.title as event_title, t.name as tier_name,
             u.full_name as customer_name, u.email as customer_email,
             p.mpesa_code, p.status as payment_status
      from orders o
      join events e on e.id = o.event_id
      join ticket_tiers t on t.id = o.tier_id
      join users u on u.id = o.customer_id
      left join payments p on p.order_id = o.id
      where e.organizer_id = $1
      order by o.created_at desc
    `, [req.user.id]);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/orders/event/:event_id  — organizer sees orders for their event
router.get('/event/:event_id', auth, requireRole('organizer','admin'), async (req, res) => {
  try {
    const { rows } = await pool.query(`
      select o.*, u.full_name as customer_name, u.email as customer_email,
             t.name as tier_name, p.status as payment_status, p.mpesa_code
      from orders o
      join users u on u.id = o.customer_id
      join ticket_tiers t on t.id = o.tier_id
      left join payments p on p.order_id = o.id
      where o.event_id = $1
      order by o.created_at desc
    `, [req.params.event_id]);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// PATCH /api/orders/:id/checkin
router.patch('/:id/checkin', auth, requireRole('organizer','admin'), async (req, res) => {
  try {
    await pool.query("update orders set checked_in=true,checked_in_at=now(),updated_at=now() where id=$1", [req.params.id]);
    res.json({ message: 'Checked in' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/orders/payments  — admin
router.get('/payments', auth, requireRole('admin'), async (req, res) => {
  try {
    const { rows } = await pool.query(`
      select p.*, u.full_name as customer_name, u.email as customer_email,
             e.title as event_title, o.quantity
      from payments p
      join users u on u.id = p.customer_id
      join orders o on o.id = p.order_id
      join events e on e.id = o.event_id
      order by p.created_at desc limit 200
    `);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
