const express = require('express');
const cors    = require('cors');
const jwt     = require('jsonwebtoken');

const app = express();
const pool = require('../server/src/db/pool');

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:5173', 'http://localhost:4173'];

app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json());

app.use(async (req, res, next) => {
  if (req.path.startsWith('/api/auth/') || req.path.startsWith('/api/settings/') || req.path.startsWith('/api/payment-methods/') || req.path === '/api/health' || req.path === '/') return next();
  try {
    const { rows } = await pool.query("select value from settings where key = 'maintenance_mode'");
    if (rows[0]?.value === 'true') {
      const authHeader = req.headers.authorization;
      if (authHeader?.startsWith('Bearer ')) {
        try {
          const decoded = jwt.verify(authHeader.slice(7), process.env.JWT_SECRET);
          const { rows: userRows } = await pool.query('select role from users where id=$1', [decoded.id]);
          if (userRows[0]?.role === 'admin') return next();
        } catch {}
      }
      return res.status(503).json({ error: 'Platform is currently undergoing maintenance. Please check back later.', maintenance: true });
    }
  } catch {}
  next();
});

app.use('/api/auth',            require('../server/src/routes/auth'));
app.use('/api/events',          require('../server/src/routes/events'));
app.use('/api/orders',          require('../server/src/routes/orders'));
app.use('/api/upload',          require('../server/src/routes/upload'));
app.use('/api/admin',           require('../server/src/routes/admin'));
app.use('/api/discounts',       require('../server/src/routes/discounts'));
app.use('/api/team',            require('../server/src/routes/team'));
app.use('/api/announcements',   require('../server/src/routes/announcements'));
app.use('/api/hero-slides',     require('../server/src/routes/hero-slides'));
app.use('/api/chat',            require('../server/src/routes/chat'));
app.use('/api/settings',        require('../server/src/routes/settings'));
app.use('/api/payment-methods', require('../server/src/routes/payment-methods'));

app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date() }));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

module.exports = app;
