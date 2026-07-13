const router = require('express').Router();
const pool   = require('../db/pool');
const { auth, requireRole } = require('../middleware/auth');

const admin = [auth, requireRole('admin')];

// GET /api/admin/users
router.get('/users', ...admin, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      select u.id, u.username, u.email, u.full_name, u.role, u.is_suspended, u.created_at,
             coalesce(op.is_verified, false) as is_verified,
             coalesce(op.payout_phone, bp.phone) as phone
      from users u
      left join organizer_profiles op on op.user_id = u.id
      left join buyer_profiles bp on bp.user_id = u.id
      order by u.created_at desc limit 200
    `);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// PATCH /api/admin/users/:id/suspend
router.patch('/users/:id/suspend', ...admin, async (req, res) => {
  const { suspend } = req.body;
  try {
    await pool.query('update users set is_suspended=$1,updated_at=now() where id=$2', [suspend, req.params.id]);
    await pool.query("insert into audit_logs(actor_id,action,target) values($1,$2,$3)",
      [req.user.id, suspend ? 'user.suspended' : 'user.unsuspended', req.params.id]);
    res.json({ message: 'Done' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// PATCH /api/admin/users/:id/role
router.patch('/users/:id/role', ...admin, async (req, res) => {
  const { role } = req.body;
  if (!['customer','organizer','admin'].includes(role)) return res.status(400).json({ error: 'Invalid role' });
  const client = await pool.connect();
  try {
    await client.query('begin');
    await client.query('update users set role=$1,updated_at=now() where id=$2', [role, req.params.id]);
    if (role === 'organizer') {
      await client.query(
        'insert into organizer_profiles (user_id, is_verified) values ($1, false) on conflict (user_id) do nothing',
        [req.params.id]
      );
    } else if (role === 'customer') {
      await client.query(
        'insert into buyer_profiles (user_id) values ($1) on conflict (user_id) do nothing',
        [req.params.id]
      );
    }
    await client.query('commit');
    res.json({ message: 'Role updated' });
  } catch (e) {
    await client.query('rollback');
    res.status(500).json({ error: e.message });
  } finally {
    client.release();
  }
});

// PATCH /api/admin/users/:id/verify
router.patch('/users/:id/verify', ...admin, async (req, res) => {
  try {
    await pool.query(
      'insert into organizer_profiles (user_id, is_verified) values ($1, true) on conflict (user_id) do update set is_verified=true, updated_at=now()',
      [req.params.id]
    );
    await pool.query("insert into audit_logs(actor_id,action,target) values($1,'organizer.verified',$2)", [req.user.id, req.params.id]);
    res.json({ message: 'Verified' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/admin/payouts
router.get('/payouts', ...admin, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      select p.*, u.full_name as organizer_name, e.title as event_title
      from payouts p
      join users u on u.id = p.organizer_id
      left join events e on e.id = p.event_id
      order by p.created_at desc
    `);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// PATCH /api/admin/payouts/:id
router.patch('/payouts/:id', ...admin, async (req, res) => {
  const { status } = req.body;
  try {
    await pool.query("update payouts set status=$1,processed_at=case when $1='completed' then now() else null end,updated_at=now() where id=$2",
      [status, req.params.id]);
    res.json({ message: 'Updated' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/admin/refunds
router.get('/refunds', ...admin, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      select r.*, u.full_name as customer_name, u.email as customer_email,
             o.reference as order_reference, e.title as event_title
      from refunds r
      join users u on u.id = r.customer_id
      join orders o on o.id = r.order_id
      join events e on e.id = o.event_id
      order by r.created_at desc
    `);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// PATCH /api/admin/refunds/:id
router.patch('/refunds/:id', ...admin, async (req, res) => {
  const { status, admin_note } = req.body;
  try {
    await pool.query('update refunds set status=$1,admin_note=$2,updated_at=now() where id=$3', [status, admin_note||null, req.params.id]);
    await pool.query("insert into audit_logs(actor_id,action,target) values($1,$2,$3)",
      [req.user.id, `refund.${status}`, req.params.id]);
    res.json({ message: 'Updated' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/admin/announcements
router.get('/announcements', ...admin, async (req, res) => {
  try {
    const { rows } = await pool.query('select * from announcements order by created_at desc');
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/admin/announcements
router.post('/announcements', ...admin, async (req, res) => {
  const { title, body, audience = 'all' } = req.body;
  if (!title || !body) return res.status(400).json({ error: 'Title and body required' });
  try {
    const { rows } = await pool.query(
      "insert into announcements(title,body,audience,status,created_by) values($1,$2,$3,'published',$4) returning *",
      [title, body, audience, req.user.id]
    );
    res.status(201).json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/admin/audit-logs
router.get('/audit-logs', ...admin, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      select l.*, u.full_name as actor_name
      from audit_logs l
      left join users u on u.id = l.actor_id
      order by l.created_at desc limit 200
    `);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/admin/analytics/meta
router.get('/analytics/meta', ...admin, async (req, res) => {
  try {
    const [confirmedOrders, totalUsers, churned, usersWithOrders] = await Promise.all([
      pool.query("select count(*)::integer as count from orders where status='confirmed'"),
      pool.query("select count(*)::integer as count from users"),
      pool.query(`
        select count(*)::integer as count from users u
        where u.created_at < now() - interval '90 days'
        and not exists (select 1 from orders o where o.customer_id = u.id and o.created_at > now() - interval '90 days')
      `),
      pool.query("select count(distinct customer_id)::integer as count from orders"),
    ]);

    const confirmed = confirmedOrders.rows[0].count;
    const registered = totalUsers.rows[0].count;
    const churnedCount = churned.rows[0].count;
    const buyers = usersWithOrders.rows[0].count;

    const conversionRate = registered > 0 ? Math.round((buyers / registered) * 1000) / 10 : 0;
    const churnRate = registered > 0 ? Math.round((churnedCount / registered) * 1000) / 10 : 0;

    res.json({ conversion_rate: conversionRate, churn_rate: churnRate });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/admin/roles
router.get('/roles', ...admin, async (req, res) => {
  try {
    const { rows } = await pool.query('select * from admin_roles order by name');
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/admin/roles
router.post('/roles', ...admin, async (req, res) => {
  const { name, description, permissions, color, users } = req.body;
  if (!name) return res.status(400).json({ error: 'Name required' });
  try {
    const { rows } = await pool.query(
      'insert into admin_roles (name, description, permissions, color, users) values ($1,$2,$3,$4,$5) returning *',
      [name, description || '', JSON.stringify(permissions || []), color || '#888', users || 0]
    );
    await pool.query("insert into audit_logs(actor_id,action,target) values($1,'role.created',$2)", [req.user.id, name]);
    res.status(201).json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// PUT /api/admin/roles/:id
router.put('/roles/:id', ...admin, async (req, res) => {
  const { name, description, permissions, color, users } = req.body;
  try {
    const { rows } = await pool.query(
      `update admin_roles set
        name=coalesce($1,name), description=coalesce($2,description),
        permissions=coalesce($3,permissions), color=coalesce($4,color),
        users=coalesce($5,users), updated_at=now()
       where id=$6 returning *`,
      [name, description, permissions ? JSON.stringify(permissions) : null, color, users, req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Role not found' });
    await pool.query("insert into audit_logs(actor_id,action,target) values($1,'role.updated',$2)", [req.user.id, rows[0].name]);
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// DELETE /api/admin/roles/:id
router.delete('/roles/:id', ...admin, async (req, res) => {
  try {
    const { rows } = await pool.query('delete from admin_roles where id=$1 returning name', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Role not found' });
    await pool.query("insert into audit_logs(actor_id,action,target) values($1,'role.deleted',$2)", [req.user.id, rows[0].name]);
    res.json({ message: 'Deleted' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/admin/audit-logs
router.post('/audit-logs', ...admin, async (req, res) => {
  const { action, target, metadata } = req.body;
  if (!action || !target) return res.status(400).json({ error: 'action and target required' });
  try {
    await pool.query(
      'insert into audit_logs (actor_id, action, target, metadata) values ($1, $2, $3, $4)',
      [req.user.id, action, target, metadata ? JSON.stringify(metadata) : null]
    );
    res.status(201).json({ message: 'Logged' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/admin/stats
router.get('/stats', ...admin, async (req, res) => {
  try {
    const [users, orders, payments] = await Promise.all([
      pool.query('select count(*) from users'),
      pool.query('select count(*) from orders'),
      pool.query("select coalesce(sum(amount),0) as total from payments where status='success'"),
    ]);
    res.json({
      totalUsers:   parseInt(users.rows[0].count),
      totalOrders:  parseInt(orders.rows[0].count),
      totalRevenue: parseInt(payments.rows[0].total),
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/admin/analytics/trends?period=30d
router.get('/analytics/trends', ...admin, async (req, res) => {
  const period = req.query.period || '30d';
  const days = period === '7d' ? 7 : period === '30d' ? 30 : period === '90d' ? 90 : 365;
  try {
    const interval = `${days} days`;
    const [revenue, tickets, users, events, refunds] = await Promise.all([
      pool.query(`
        select to_char(date_trunc($1, p.created_at), 'YYYY-MM-DD') as label,
               coalesce(sum(p.amount),0) as value
        from payments p where p.status='success' and p.created_at >= now() - $2::interval
        group by label order by label
      `, [days <= 30 ? 'day' : 'month', interval]),
      pool.query(`
        select to_char(date_trunc($1, o.created_at), 'YYYY-MM-DD') as label,
               coalesce(sum(o.quantity),0) as value
        from orders o where o.status='confirmed' and o.created_at >= now() - $2::interval
        group by label order by label
      `, [days <= 30 ? 'day' : 'month', interval]),
      pool.query(`
        select to_char(date_trunc($1, u.created_at), 'YYYY-MM-DD') as label,
               count(*) as value
        from users u where u.created_at >= now() - $2::interval
        group by label order by label
      `, [days <= 30 ? 'day' : 'month', interval]),
      pool.query(`
        select to_char(date_trunc($1, e.created_at), 'YYYY-MM-DD') as label,
               count(*) as value
        from events e where e.created_at >= now() - $2::interval
        group by label order by label
      `, [days <= 30 ? 'day' : 'month', interval]),
      pool.query(`
        select to_char(date_trunc($1, r.created_at), 'YYYY-MM-DD') as label,
               coalesce(sum(r.amount),0) as value
        from refunds r where r.created_at >= now() - $2::interval
        group by label order by label
      `, [days <= 30 ? 'day' : 'month', interval]),
    ]);
    res.json({
      revenue: revenue.rows.map(r => ({ label: r.label, value: parseInt(r.value) })),
      tickets: tickets.rows.map(r => ({ label: r.label, value: parseInt(r.value) })),
      users:   users.rows.map(r => ({ label: r.label, value: parseInt(r.value) })),
      events:  events.rows.map(r => ({ label: r.label, value: parseInt(r.value) })),
      refunds: refunds.rows.map(r => ({ label: r.label, value: parseInt(r.value) })),
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/admin/analytics/top-events
router.get('/analytics/top-events', ...admin, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      select e.title, e.id,
             coalesce(sum(o.quantity),0) as tickets,
             coalesce(sum(o.unit_price * o.quantity),0) as revenue
      from orders o
      join events e on e.id = o.event_id
      where o.status = 'confirmed'
      group by e.id, e.title
      order by revenue desc limit 10
    `);
    const maxRev = rows.length ? Math.max(...rows.map(r => parseInt(r.revenue))) : 1;
    res.json(rows.map(r => ({
      name: r.title,
      tickets: parseInt(r.tickets),
      revenue: parseInt(r.revenue),
      pct: Math.round(parseInt(r.revenue) / maxRev * 100),
    })));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/admin/analytics/top-locations
router.get('/analytics/top-locations', ...admin, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      select e.location,
             coalesce(sum(o.quantity),0) as tickets
      from orders o
      join events e on e.id = o.event_id
      where o.status = 'confirmed'
      group by e.location
      order by tickets desc limit 10
    `);
    const total = rows.length ? rows.reduce((s, r) => s + parseInt(r.tickets), 0) : 1;
    res.json(rows.map(r => ({
      name: r.location,
      pct: Math.round(parseInt(r.tickets) / total * 100),
    })));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/admin/organizer-payouts (organizer requests)
router.get('/organizer-payouts', auth, requireRole('organizer'), async (req, res) => {
  try {
    const { rows } = await pool.query(
      'select p.*,e.title as event_title from payouts p left join events e on e.id=p.event_id where p.organizer_id=$1 order by p.created_at desc',
      [req.user.id]
    );
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/admin/organizer-payouts
router.post('/organizer-payouts', auth, requireRole('organizer'), async (req, res) => {
  const { event_id, gross_amount, mpesa_phone } = req.body;
  if (!gross_amount) return res.status(400).json({ error: 'Amount required' });
  const fee    = Math.round(gross_amount * 0.05);
  const net    = gross_amount - fee;
  try {
    const { rows } = await pool.query(
      "insert into payouts(organizer_id,event_id,gross_amount,fee_amount,net_amount,status,mpesa_phone) values($1,$2,$3,$4,$5,'pending',$6) returning *",
      [req.user.id, event_id||null, gross_amount, fee, net, mpesa_phone||null]
    );
    res.status(201).json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/admin/notifications
router.get('/notifications', ...admin, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'select * from notifications where (recipient_id=$1 or recipient_id is null) order by created_at desc limit 100',
      [req.user.id]
    );
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// PATCH /api/admin/notifications/:id/read
router.patch('/notifications/:id/read', ...admin, async (req, res) => {
  try {
    await pool.query('update notifications set is_read=true where id=$1', [req.params.id]);
    res.json({ message: 'Marked as read' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// PATCH /api/admin/users/:id/unverify
router.patch('/users/:id/unverify', ...admin, async (req, res) => {
  try {
    await pool.query(
      'update organizer_profiles set is_verified=false, updated_at=now() where user_id=$1',
      [req.params.id]
    );
    await pool.query("insert into audit_logs(actor_id,action,target) values($1,'organizer.unverified',$2)", [req.user.id, req.params.id]);
    res.json({ message: 'Organizer unverified' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// DELETE /api/admin/users/:id
router.delete('/users/:id', ...admin, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('begin');
    
    // Delete refunds related to orders of the user's events OR orders of the user as customer
    await client.query(`
      delete from refunds 
      where customer_id = $1 or order_id in (
        select o.id from orders o
        left join events e on e.id = o.event_id
        where o.customer_id = $1 or e.organizer_id = $1
      )
    `, [req.params.id]);

    // Delete payments related to orders of the user's events OR orders of the user as customer
    await client.query(`
      delete from payments 
      where customer_id = $1 or order_id in (
        select o.id from orders o
        left join events e on e.id = o.event_id
        where o.customer_id = $1 or e.organizer_id = $1
      )
    `, [req.params.id]);

    // Delete payouts where organizer_id = $1 or event_id in user's events
    await client.query(`
      delete from payouts 
      where organizer_id = $1 or event_id in (
        select id from events where organizer_id = $1
      )
    `, [req.params.id]);

    // Delete orders where customer_id = $1 or event_id in user's events
    await client.query(`
      delete from orders 
      where customer_id = $1 or event_id in (
        select id from events where organizer_id = $1
      )
    `, [req.params.id]);

    // Delete events where organizer_id = $1 (will delete cascade to ticket_tiers and event_merch)
    await client.query('delete from events where organizer_id = $1', [req.params.id]);

    // Delete user (cascades to organizer_profile, buyer_profile, refresh_tokens, notifications)
    await client.query('delete from users where id = $1', [req.params.id]);

    await client.query('commit');

    await pool.query("insert into audit_logs(actor_id,action,target) values($1,'user.deleted',$2)", [req.user.id, req.params.id]);
    res.json({ message: 'User deleted' });
  } catch (e) {
    await client.query('rollback');
    res.status(500).json({ error: e.message });
  } finally {
    client.release();
  }
});

// GET /api/admin/organizers/:id/details
router.get('/organizers/:id/details', ...admin, async (req, res) => {
  try {
    // 1. Get profile details
    const { rows: profiles } = await pool.query(`
      select u.id, u.username, u.email, u.full_name, u.role, u.is_suspended, u.created_at,
             op.business_name, op.payout_phone, op.is_verified
      from users u
      join organizer_profiles op on op.user_id = u.id
      where u.id = $1
    `, [req.params.id]);
    
    const organizer = profiles[0];
    if (!organizer) return res.status(404).json({ error: 'Organizer not found' });

    // 2. Get events, categories, and sales stats
    const { rows: events } = await pool.query(`
      select e.id, e.title, e.location, e.start_date, e.status, c.name as category_name,
             coalesce(sum(o.quantity), 0)::integer as tickets_sold,
             coalesce(sum(o.total_amount), 0)::integer as revenue
      from events e
      left join categories c on c.id = e.category_id
      left join orders o on o.event_id = e.id and o.status = 'confirmed'
      where e.organizer_id = $1
      group by e.id, e.title, e.location, e.start_date, e.status, c.name
      order by e.start_date desc
    `, [req.params.id]);

    // 3. Get payouts history
    const { rows: payouts } = await pool.query(`
      select p.*, e.title as event_title
      from payouts p
      left join events e on e.id = p.event_id
      where p.organizer_id = $1
      order by p.created_at desc
    `, [req.params.id]);

    // 4. Get ticket purchase orders
    const { rows: orders } = await pool.query(`
      select o.id, o.reference, o.quantity, o.total_amount, o.status, o.created_at,
             e.title as event_title, u.full_name as customer_name, u.email as customer_email
      from orders o
      join events e on e.id = o.event_id
      join users u on u.id = o.customer_id
      where e.organizer_id = $1
      order by o.created_at desc
      limit 50
    `, [req.params.id]);

    // 5. Calculate financial summary
    let totalRevenue = 0;
    let totalTicketsSold = 0;
    events.forEach(e => {
      totalRevenue += e.revenue;
      totalTicketsSold += e.tickets_sold;
    });

    res.json({
      organizer,
      events,
      payouts,
      orders,
      stats: {
        totalRevenue,
        totalTicketsSold,
        totalEvents: events.length
      }
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ═══════════════════════════════════════════════════════════════════════════
// CATEGORIES CRUD
// ═══════════════════════════════════════════════════════════════════════════

router.get('/categories', ...admin, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      select c.*, coalesce(e.event_count, 0)::integer as event_count
      from categories c
      left join (select category_id, count(*) as event_count from events group by category_id) e on e.category_id = c.id
      order by c.name
    `);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/categories', ...admin, async (req, res) => {
  const { name, slug, icon } = req.body;
  if (!name || !slug) return res.status(400).json({ error: 'Name and slug required' });
  try {
    const { rows } = await pool.query(
      'insert into categories (name, slug, icon) values ($1, $2, $3) returning *',
      [name, slug, icon || null]
    );
    await pool.query("insert into audit_logs(actor_id,action,target) values($1,'category.created',$2)", [req.user.id, name]);
    res.status(201).json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/categories/:id', ...admin, async (req, res) => {
  const { name, slug, icon } = req.body;
  try {
    const { rows } = await pool.query(
      'update categories set name=coalesce($1,name), slug=coalesce($2,slug), icon=coalesce($3,icon) where id=$4 returning *',
      [name, slug, icon, req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Not found' });
    await pool.query("insert into audit_logs(actor_id,action,target) values($1,'category.updated',$2)", [req.user.id, rows[0].name]);
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/categories/:id', ...admin, async (req, res) => {
  try {
    const { rows } = await pool.query('delete from categories where id=$1 returning name', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Not found' });
    await pool.query("insert into audit_logs(actor_id,action,target) values($1,'category.deleted',$2)", [req.user.id, rows[0].name]);
    res.json({ message: 'Deleted' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ═══════════════════════════════════════════════════════════════════════════
// EMAIL LOGS
// ═══════════════════════════════════════════════════════════════════════════

router.get('/email-logs', ...admin, async (req, res) => {
  try {
    const { search, from, to } = req.query;
    let sql = 'select * from email_logs where 1=1';
    const params = [];
    if (search) {
      params.push(`%${search}%`);
      sql += ` and (recipient ilike $${params.length} or subject ilike $${params.length})`;
    }
    if (from) { params.push(from); sql += ` and sent_at >= $${params.length}`; }
    if (to)   { params.push(to);   sql += ` and sent_at <= $${params.length}`; }
    sql += ' order by sent_at desc limit 200';
    const { rows } = await pool.query(sql, params);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ═══════════════════════════════════════════════════════════════════════════
// SALES REPORTS
// ═══════════════════════════════════════════════════════════════════════════

router.get('/reports/sales', ...admin, async (req, res) => {
  try {
    const period = req.query.period || 'daily';
    const from   = req.query.from || '1970-01-01';
    const to     = req.query.to || '2999-12-31';
    const trunc  = period === 'daily' ? 'day' : period === 'weekly' ? 'week' : 'month';

    const { rows } = await pool.query(`
      select to_char(date_trunc($1, p.created_at), 'YYYY-MM-DD') as label,
             count(distinct p.id)::integer as transactions,
             coalesce(sum(p.amount),0)::integer as revenue,
             count(distinct p.customer_id)::integer as customers,
             coalesce(sum(o.quantity),0)::integer as tickets
      from payments p
      left join orders o on o.id = p.order_id
      where p.status = 'success' and p.created_at >= $2 and p.created_at <= $3
      group by label
      order by label
    `, [trunc, from, to]);

    const totals = await pool.query(`
      select coalesce(sum(p.amount),0)::integer as total_revenue,
             count(distinct p.id)::integer as total_transactions,
             count(distinct p.customer_id)::integer as total_customers,
             coalesce(sum(o.quantity),0)::integer as total_tickets
      from payments p
      left join orders o on o.id = p.order_id
      where p.status = 'success' and p.created_at >= $1 and p.created_at <= $2
    `, [from, to]);

    const { rows: methodRows } = await pool.query(`
      select p.method, coalesce(sum(p.amount),0)::integer as revenue, count(*)::integer as count
      from payments p
      where p.status = 'success' and p.created_at >= $1 and p.created_at <= $2
      group by p.method
    `, [from, to]);

    res.json({
      series: rows,
      summary: totals.rows[0],
      byMethod: methodRows,
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ═══════════════════════════════════════════════════════════════════════════
// EVENT PERFORMANCE
// ═══════════════════════════════════════════════════════════════════════════

router.get('/analytics/event-performance', ...admin, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      select e.id, e.title, e.location, e.status, e.start_date,
             c.name as category_name,
             coalesce(sum(o.quantity),0)::integer as tickets_sold,
             coalesce(sum(o.total_amount),0)::integer as revenue,
             coalesce(avg(t.price),0)::integer as avg_ticket_price,
             coalesce(sum(case when o.status='confirmed' then o.quantity else 0 end)::float / nullif(sum(tt.capacity),0) * 100, 0)::integer as capacity_pct,
             coalesce(sum(case when o.checked_in then 1 else 0 end)::float / nullif(sum(o.quantity),0) * 100, 0)::integer as checkin_pct,
             count(distinct o.customer_id)::integer as unique_buyers
      from events e
      left join categories c on c.id = e.category_id
      left join orders o on o.event_id = e.id and o.status = 'confirmed'
      left join (select event_id, sum(capacity) as capacity from ticket_tiers group by event_id) tt on tt.event_id = e.id
      left join ticket_tiers t on t.event_id = e.id
      group by e.id, e.title, e.location, e.status, e.start_date, c.name
      order by revenue desc nulls last
    `);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ═══════════════════════════════════════════════════════════════════════════
// USER ANALYTICS / SEGMENTS
// ═══════════════════════════════════════════════════════════════════════════

router.get('/analytics/user-segments', ...admin, async (req, res) => {
  try {
    const [total, byRole, signups, spend, topBuyers] = await Promise.all([
      pool.query('select count(*)::integer as count from users'),
      pool.query(`select role, count(*)::integer as count from users group by role`),
      pool.query(`
        select to_char(date_trunc('month', created_at), 'YYYY-MM') as label,
               count(*)::integer as value
        from users group by label order by label desc limit 12
      `),
      pool.query(`
        select coalesce(sum(o.total_amount),0)::integer as total_spent,
               count(distinct o.customer_id)::integer as active_buyers,
               coalesce(avg(spent),0)::integer as avg_lifetime
        from (
          select customer_id, sum(total_amount) as spent
          from orders where status='confirmed' group by customer_id
        ) o
      `),
      pool.query(`
        select u.id, u.full_name, u.email, u.created_at,
               coalesce(sum(o.total_amount),0)::integer as total_spent,
               count(o.id)::integer as orders
        from users u
        join orders o on o.customer_id = u.id and o.status = 'confirmed'
        group by u.id, u.full_name, u.email, u.created_at
        order by total_spent desc limit 20
      `),
    ]);

    res.json({
      totalUsers: total.rows[0].count,
      byRole: byRole.rows,
      signupTrend: signups.rows,
      spendSummary: spend.rows[0],
      topBuyers: topBuyers.rows,
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ═══════════════════════════════════════════════════════════════════════════
// ACTIVITY LOGS (broader audit_logs view)
// ═══════════════════════════════════════════════════════════════════════════

router.get('/activity-logs', ...admin, async (req, res) => {
  try {
    const { search, action } = req.query;
    let sql = `
      select l.*, u.full_name as actor_name
      from audit_logs l
      left join users u on u.id = l.actor_id
      where 1=1
    `;
    const params = [];
    if (search) {
      params.push(`%${search}%`);
      sql += ` and (l.action ilike $${params.length} or l.target ilike $${params.length} or u.full_name ilike $${params.length})`;
    }
    if (action) { params.push(action); sql += ` and l.action = $${params.length}`; }
    sql += ' order by l.created_at desc limit 200';
    const { rows } = await pool.query(sql, params);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ═══════════════════════════════════════════════════════════════════════════
// BACKUP & RESTORE
// ═══════════════════════════════════════════════════════════════════════════

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const BACKUP_DIR = path.join(__dirname, '..', '..', 'backups');

if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });

router.get('/backups', ...admin, async (req, res) => {
  try {
    const files = fs.readdirSync(BACKUP_DIR)
      .filter(f => f.endsWith('.sql'))
      .map(f => {
        const stat = fs.statSync(path.join(BACKUP_DIR, f));
        return { name: f, size: stat.size, created_at: stat.birthtime || stat.mtime };
      })
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    res.json(files);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/backups/create', ...admin, async (req, res) => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `backup-${timestamp}.sql`;
  const filepath = path.join(BACKUP_DIR, filename);

  // Read DB config from pool to build pg_dump args
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) return res.status(500).json({ error: 'DATABASE_URL not configured' });

  exec(`pg_dump "${dbUrl}" --no-owner --no-acl -f "${filepath}"`, { timeout: 60000 }, async (err) => {
    if (err) {
      await pool.query("insert into audit_logs(actor_id,action,target,metadata) values($1,'backup.failed',$2,$3)",
        [req.user.id, filename, JSON.stringify({ error: err.message })]);
      return res.status(500).json({ error: err.message });
    }
    await pool.query("insert into audit_logs(actor_id,action,target) values($1,'backup.created',$2)", [req.user.id, filename]);
    res.json({ message: 'Backup created', filename, filepath });
  });
});

router.post('/backups/restore', ...admin, async (req, res) => {
  const { filename } = req.body;
  if (!filename) return res.status(400).json({ error: 'Filename required' });
  const filepath = path.join(BACKUP_DIR, filename);
  if (!fs.existsSync(filepath)) return res.status(404).json({ error: 'Backup not found' });

  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) return res.status(500).json({ error: 'DATABASE_URL not configured' });

  exec(`psql "${dbUrl}" < "${filepath}"`, { timeout: 120000 }, async (err) => {
    if (err) {
      await pool.query("insert into audit_logs(actor_id,action,target,metadata) values($1,'restore.failed',$2,$3)",
        [req.user.id, filename, JSON.stringify({ error: err.message })]);
      return res.status(500).json({ error: err.message });
    }
    await pool.query("insert into audit_logs(actor_id,action,target) values($1,'restore.completed',$2)", [req.user.id, filename]);
    res.json({ message: 'Restore completed', filename });
  });
});

router.delete('/backups/:name', ...admin, async (req, res) => {
  const filepath = path.join(BACKUP_DIR, req.params.name);
  try {
    if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
    await pool.query("insert into audit_logs(actor_id,action,target) values($1,'backup.deleted',$2)", [req.user.id, req.params.name]);
    res.json({ message: 'Deleted' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
