const router  = require('express').Router();
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const pool    = require('../db/pool');
const { auth } = require('../middleware/auth');

const sign = (user) => jwt.sign(
  { id: user.id, username: user.username, email: user.email, role: user.role, name: user.full_name },
  process.env.JWT_SECRET,
  { expiresIn: process.env.JWT_EXPIRES_IN }
);

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
  // Check if registration is open
  try {
    const { rows: regRows } = await pool.query("select value from settings where key = 'registration_open'");
    if (regRows[0]?.value === 'false') {
      return res.status(403).json({ error: 'Registration is currently closed. Please contact support for assistance.' });
    }
  } catch { /* if settings table doesn't exist, allow registration */ }

  const { username, email, password, full_name, role = 'customer', business_name = '', phone = null } = req.body;
  if (!username || !email || !password || !full_name) return res.status(400).json({ error: 'All fields required' });
  if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });
  if (!['customer','organizer'].includes(role)) return res.status(400).json({ error: 'Invalid role' });
  
  const client = await pool.connect();
  try {
    await client.query('begin');
    const usernameExists = await client.query('select id from users where lower(username)=$1', [username.toLowerCase()]);
    if (usernameExists.rows.length) {
      await client.query('rollback');
      return res.status(409).json({ error: 'Username unavailable.' });
    }
    const emailExists = await client.query('select id from users where lower(email)=$1', [email.toLowerCase()]);
    if (emailExists.rows.length) {
      await client.query('rollback');
      return res.status(409).json({ error: 'Username or email already in use.' });
    }
    const hash = await bcrypt.hash(password, 10);
    const { rows: userRows } = await client.query(
      'insert into users (username,email,password,full_name,role) values($1,$2,$3,$4,$5) returning id,username,email,full_name,role,is_suspended',
      [username.toLowerCase(), email.toLowerCase(), hash, full_name, role]
    );
    const user = userRows[0];

    if (role === 'organizer') {
      await client.query(
        'insert into organizer_profiles (user_id, business_name, payout_phone, is_verified) values($1, $2, $3, false)',
        [user.id, business_name, phone]
      );
      // Insert Admin Notification
      await client.query(
        `insert into notifications (recipient_id, type, title, message, link, is_read)
         values(null, 'new_organizer', 'New Organizer Registered', $1, '/admin/organizers', false)`,
        [`Organizer "${full_name}" (Company: "${business_name || 'Individual'}") has registered and is pending approval.`]
      );

      // Simulated Email log
      console.log('================================================================================');
      console.log(`✉️ SIMULATED EMAIL SENT TO ORGANIZER: ${email}`);
      console.log('Subject: Welcome to Sunshine Tickets - Organizer Account Pending Approval');
      console.log(`Hi ${full_name},\n\nThank you for registering as an organizer at Sunshine Tickets.`);
      console.log('Your account is currently under review by our administration team.');
      console.log('Please wait at least 24 hours for approval before attempting to sign in.');
      console.log('We will notify you as soon as your account is verified.\n\nBest regards,\nSunshine Tickets Team');
      console.log('================================================================================');
    } else {
      await client.query(
        'insert into buyer_profiles (user_id) values($1)',
        [user.id]
      );
    }

    await client.query('commit');

    if (role === 'organizer') {
      res.status(201).json({
        message: 'Registration successful. Your account is pending admin approval. Please wait at least 24 hours.',
        requiresApproval: true
      });
    } else {
      res.status(201).json({
        token: sign(user),
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          full_name: user.full_name,
          role: user.role,
          phone: null,
          avatar_url: null,
          is_verified: false,
          is_suspended: user.is_suspended,
          business_name: null
        }
      });
    }
  } catch (e) {
    await client.query('rollback');
    console.error('Signup error:', e);
    res.status(500).json({ error: 'Registration failed. Please try again.' });
  } finally {
    client.release();
  }
});

// POST /api/auth/signin
router.post('/signin', async (req, res) => {
  const { username, password, code } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Username and password required' });
  try {
    const { rows } = await pool.query(`
      select u.*, 
             coalesce(op.is_verified, false) as is_verified,
             op.business_name,
             coalesce(op.payout_phone, bp.phone) as phone,
             bp.avatar_url
      from users u
      left join organizer_profiles op on op.user_id = u.id
      left join buyer_profiles bp on bp.user_id = u.id
      where lower(u.username)=$1
    `, [username.toLowerCase()]);
    
    const user = rows[0];
    if (!user) return res.status(401).json({ error: 'Invalid username or password' });
    if (user.is_suspended) return res.status(403).json({ error: 'Account suspended' });
    if (user.role === 'organizer' && !user.is_verified) {
      return res.status(403).json({ error: 'Your organizer account is pending admin approval. Please wait up to 24 hours.' });
    }
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Invalid username or password' });
    if (user.role === 'admin') {
      if (!code) return res.status(401).json({ error: 'Admin code required' });
      if (code !== user.admin_code) return res.status(401).json({ error: 'Invalid admin code' });
    }
    const { password: _, admin_code: __, ...safeUser } = user;
    res.json({ token: sign(user), user: safeUser });
  } catch (e) {
    console.error('Signin error:', e);
    res.status(500).json({ error: 'Authentication failed. Please try again.' });
  }
});

// GET /api/auth/me
router.get('/me', auth, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      select u.id, u.username, u.email, u.full_name, u.role, u.is_suspended, u.created_at,
             coalesce(op.is_verified, false) as is_verified,
             op.business_name,
             coalesce(op.payout_phone, bp.phone) as phone,
             bp.avatar_url
      from users u
      left join organizer_profiles op on op.user_id = u.id
      left join buyer_profiles bp on bp.user_id = u.id
      where u.id=$1
    `, [req.user.id]);
    if (!rows[0]) return res.status(404).json({ error: 'User not found' });
    res.json(rows[0]);
  } catch (e) {
    console.error('Fetch profile error:', e);
    res.status(500).json({ error: 'Failed to retrieve profile.' });
  }
});

// PUT /api/auth/profile
router.put('/profile', auth, async (req, res) => {
  const { full_name, email, phone, business_name } = req.body;
  if (!full_name || !email) return res.status(400).json({ error: 'Name and email required' });
  const client = await pool.connect();
  try {
    await client.query('begin');
    await client.query(
      'update users set full_name=$1,email=$2,updated_at=now() where id=$3',
      [full_name, email.toLowerCase(), req.user.id]
    );
    if (req.user.role === 'organizer') {
      await client.query(
        'insert into organizer_profiles (user_id, business_name, payout_phone) values ($1, $2, $3) on conflict (user_id) do update set business_name=coalesce($2, organizer_profiles.business_name), payout_phone=$3, updated_at=now()',
        [req.user.id, business_name || null, phone || null]
      );
    } else {
      await client.query(
        'insert into buyer_profiles (user_id, phone) values ($1, $2) on conflict (user_id) do update set phone=$2, updated_at=now()',
        [req.user.id, phone || null]
      );
    }
    await client.query('commit');

    const { rows } = await pool.query(`
      select u.id, u.username, u.email, u.full_name, u.role, u.is_suspended,
             coalesce(op.is_verified, false) as is_verified,
             op.business_name,
             coalesce(op.payout_phone, bp.phone) as phone,
             bp.avatar_url
      from users u
      left join organizer_profiles op on op.user_id = u.id
      left join buyer_profiles bp on bp.user_id = u.id
      where u.id=$1
    `, [req.user.id]);

    res.json(rows[0]);
  } catch (e) {
    await client.query('rollback');
    console.error('Profile update error:', e);
    res.status(500).json({ error: 'Failed to update profile. Please try again.' });
  } finally {
    client.release();
  }
});

// PUT /api/auth/password
router.put('/password', auth, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) return res.status(400).json({ error: 'Both passwords required' });
  if (newPassword.length < 6) return res.status(400).json({ error: 'New password too short' });
  try {
    const { rows } = await pool.query('select password from users where id=$1', [req.user.id]);
    const valid = await bcrypt.compare(currentPassword, rows[0].password);
    if (!valid) return res.status(401).json({ error: 'Current password is incorrect' });
    const hash = await bcrypt.hash(newPassword, 10);
    await pool.query('update users set password=$1,updated_at=now() where id=$2', [hash, req.user.id]);
    res.json({ message: 'Password updated' });
  } catch (e) {
    console.error('Password update error:', e);
    res.status(500).json({ error: 'Failed to update password. Please try again.' });
  }
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });
  try {
    const { rows } = await pool.query('select id from users where email=$1', [email.toLowerCase()]);
    if (!rows.length) return res.status(404).json({ error: 'Email not registered' });
    // In a production app, we would send a reset token via email here.
    // For local simulation, we return a success status.
    res.json({ message: 'Password reset link sent successfully.' });
  } catch (e) {
    console.error('Reset password error:', e);
    res.status(500).json({ error: 'Failed to request password reset. Please try again.' });
  }
});

module.exports = router;
