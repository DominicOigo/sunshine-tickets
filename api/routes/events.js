const router = require('express').Router();
const pool   = require('../db/pool');
const { auth, requireRole } = require('../middleware/auth');

// GET /api/events/featured-organizers — public
router.get('/featured-organizers', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      select u.id, u.full_name as name,
             op.business_name, op.is_verified,
             count(distinct e.id)::int as event_count,
             coalesce(avg(oi.total), 0)::int as avg_rating,
             sum(oi.sold)::int as total_tickets_sold
      from users u
      join organizer_profiles op on op.user_id = u.id
      left join events e on e.organizer_id = u.id and e.status = 'published'
      left join (
        select o.event_id, sum(o.quantity) as sold, sum(o.total_amount) as total
        from orders o where o.status = 'confirmed' group by o.event_id
      ) oi on oi.event_id = e.id
      where u.role = 'organizer' and u.is_suspended = false
      group by u.id, op.business_name, op.is_verified
      having count(distinct e.id) > 0
      order by total_tickets_sold desc
      limit 10
    `);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/events  — public, only published
router.get('/', async (req, res) => {
  try {
    const { rows: events } = await pool.query(`
      select e.*, u.full_name as organizer_name, u.email as organizer_email,
             c.name as category_name, c.slug as category_slug,
             coalesce(
               (select json_agg(t order by t.sort_order) from ticket_tiers t where t.event_id = e.id),
               '[]'
             ) as tiers,
             coalesce(
               (select json_agg(m) from event_merch m where m.event_id = e.id),
               '[]'
             ) as merch
      from events e
      join users u on u.id = e.organizer_id
      left join categories c on c.id = e.category_id
      where e.status = 'published'
      order by e.created_at desc
    `);
    res.json(events);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/events/all  — admin sees everything
router.get('/all', auth, requireRole('admin'), async (req, res) => {
  try {
    const { rows } = await pool.query(`
      select e.*, u.full_name as organizer_name, u.email as organizer_email,
             coalesce(
               (select json_agg(t order by t.sort_order) from ticket_tiers t where t.event_id = e.id),
               '[]'
             ) as tiers,
             coalesce(
               (select json_agg(m) from event_merch m where m.event_id = e.id),
               '[]'
             ) as merch
      from events e
      join users u on u.id = e.organizer_id
      order by e.created_at desc
    `);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/events/organizer/stats — organizer sees their stats
router.get('/organizer/stats', auth, requireRole('organizer','admin'), async (req, res) => {
  try {
    const { rows } = await pool.query(
      'select * from event_stats where organizer_id = $1',
      [req.user.id]
    );
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/events/categories — public, with event counts
router.get('/categories', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      select c.*, count(e.id)::int as event_count
      from categories c
      left join events e on e.category_id = c.id and e.status = 'published'
      group by c.id
      order by c.name
    `);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/events/mine — organizer's own events
router.get('/mine', auth, requireRole('organizer','admin'), async (req, res) => {
  try {
    const { rows } = await pool.query(`
      select e.*, u.full_name as organizer_name, u.email as organizer_email,
             c.name as category_name, c.slug as category_slug,
             coalesce(
               (select json_agg(t order by t.sort_order) from ticket_tiers t where t.event_id = e.id),
               '[]'
             ) as tiers,
             coalesce(
               (select json_agg(m) from event_merch m where m.event_id = e.id),
               '[]'
             ) as merch
      from events e
      join users u on u.id = e.organizer_id
      left join categories c on c.id = e.category_id
      where e.organizer_id = $1 or e.status = 'published'
      order by e.created_at desc
    `, [req.user.id]);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/events/:id
router.get('/:id', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      select e.*, u.full_name as organizer_name, u.email as organizer_email,
             c.name as category_name, c.slug as category_slug,
             coalesce(
               (select json_agg(t order by t.sort_order) from ticket_tiers t where t.event_id = e.id),
               '[]'
             ) as tiers,
             coalesce(
               (select json_agg(m) from event_merch m where m.event_id = e.id),
               '[]'
             ) as merch
      from events e
      join users u on u.id = e.organizer_id
      left join categories c on c.id = e.category_id
      where e.id = $1
    `, [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Event not found' });
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/events
router.post('/', auth, requireRole('organizer','admin'), async (req, res) => {
  if (req.user.role === 'organizer' && !req.user.is_verified) {
    return res.status(403).json({ error: 'Your organizer account must be verified by an admin before you can create events.' });
  }
  const { title, description, location, coordinates, image_url, start_date, end_date, category_id, tiers = [], merch = [] } = req.body;
  if (!title || !start_date || !location) return res.status(400).json({ error: 'title, start_date, location required' });
  const client = await pool.connect();
  try {
    await client.query('begin');
    const { rows: autoApproveRows } = await pool.query("select value from settings where key = 'event_auto_approve'");
    const autoApprove = autoApproveRows[0]?.value === 'true';
    const status = autoApprove ? 'published' : 'pending_approval';
    const { rows } = await client.query(
      `insert into events (title,description,organizer_id,category_id,location,coordinates,image_url,start_date,end_date,status)
       values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) returning *`,
      [title, description||'', req.user.id, category_id||null, location, coordinates||null, image_url||null, start_date, end_date||null, status]
    );
    const event = rows[0];
    for (let i = 0; i < tiers.length; i++) {
      const t = tiers[i];
      await client.query(
        'insert into ticket_tiers (event_id,name,price,capacity,sort_order) values($1,$2,$3,$4,$5)',
        [event.id, t.name, t.price, t.capacity, i]
      );
    }
    for (const m of merch) {
      await client.query(
        'insert into event_merch (event_id,name,price,stock) values($1,$2,$3,$4)',
        [event.id, m.name, m.price, m.stock]
      );
    }
    await client.query('commit');
    res.status(201).json(event);
  } catch (e) { await client.query('rollback'); res.status(500).json({ error: e.message }); }
  finally { client.release(); }
});

// PATCH /api/events/:id/approve
router.patch('/:id/approve', auth, requireRole('admin'), async (req, res) => {
  try {
    await pool.query("update events set status='published',admin_feedback=null,updated_at=now() where id=$1", [req.params.id]);
    await pool.query("insert into audit_logs(actor_id,action,target) values($1,'event.approved',$2)", [req.user.id, req.params.id]);
    res.json({ message: 'Event approved' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// PATCH /api/events/:id/reject
router.patch('/:id/reject', auth, requireRole('admin'), async (req, res) => {
  const { feedback } = req.body;
  if (!feedback) return res.status(400).json({ error: 'Feedback required' });
  try {
    await pool.query("update events set status='rejected',admin_feedback=$1,updated_at=now() where id=$2", [feedback, req.params.id]);
    await pool.query("insert into audit_logs(actor_id,action,target) values($1,'event.rejected',$2)", [req.user.id, req.params.id]);
    res.json({ message: 'Event rejected' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// DELETE /api/events/:id
router.delete('/:id', auth, requireRole('admin','organizer'), async (req, res) => {
  try {
    await pool.query('delete from events where id=$1', [req.params.id]);
    res.json({ message: 'Event deleted' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
