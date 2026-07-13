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

app.use('/api/auth',            require('../server/src/routes/auth'));

app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date() }));

module.exports = app;
