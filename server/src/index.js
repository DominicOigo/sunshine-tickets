require('dotenv').config();
const express = require('express');
const http    = require('http');
const cors    = require('cors');
const path    = require('path');
const jwt     = require('jsonwebtoken');

const app = express();
const server = http.createServer(app);
const pool  = require('./db/pool');

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:5173', 'http://localhost:4173'];

app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Maintenance mode middleware (skips /api/auth/*, /api/settings/*, /api/health)
app.use(async (req, res, next) => {
  if (req.path.startsWith('/api/auth/') || req.path.startsWith('/api/settings/') || req.path.startsWith('/api/payment-methods/') || req.path === '/api/health' || req.path === '/') return next();
  try {
    const { rows } = await pool.query("select value from settings where key = 'maintenance_mode'");
    if (rows[0]?.value === 'true') {
      // Allow admin users through
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

// Routes
app.use('/api/auth',   require('./routes/auth'));
app.use('/api/events', require('./routes/events'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/admin',  require('./routes/admin'));
app.use('/api/discounts', require('./routes/discounts'));
app.use('/api/team',      require('./routes/team'));
app.use('/api/announcements', require('./routes/announcements'));
app.use('/api/hero-slides',  require('./routes/hero-slides'));
app.use('/api/chat',         require('./routes/chat'));
app.use('/api/settings',     require('./routes/settings'));
app.use('/api/payment-methods', require('./routes/payment-methods'));

app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date() }));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

// Socket.io
const { setupSocket } = require('./socket');
setupSocket(server);

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`Sunshine Tickets API running on http://localhost:${PORT}`));
