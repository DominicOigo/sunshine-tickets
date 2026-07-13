const jwt = require('jsonwebtoken');
const pool = require('../db/pool');

const auth = async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return res.status(401).json({ error: 'No token provided' });
  try {
    const decoded = jwt.verify(header.slice(7), process.env.JWT_SECRET);
    const { rows } = await pool.query(`
      select u.role, u.is_suspended, coalesce(op.is_verified, false) as is_verified
      from users u
      left join organizer_profiles op on op.user_id = u.id
      where u.id=$1
    `, [decoded.id]);
    const user = rows[0];
    if (!user) return res.status(401).json({ error: 'User not found' });
    if (user.is_suspended) return res.status(403).json({ error: 'Account suspended' });
    if (user.role === 'organizer' && !user.is_verified) {
      return res.status(403).json({ error: 'Your organizer account is pending admin approval. Please wait up to 24 hours.' });
    }

    req.user = {
      id: decoded.id,
      email: decoded.email,
      name: decoded.name,
      role: user.role,
      is_verified: user.is_verified
    };
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};

const requireRole = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user?.role)) return res.status(403).json({ error: 'Forbidden' });
  next();
};

module.exports = { auth, requireRole };

