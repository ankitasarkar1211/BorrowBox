const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/authRoutes');
const itemRoutes = require('./routes/itemRoutes');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();

// --- Core middleware ---
const clientOrigins = (process.env.CLIENT_ORIGIN || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: clientOrigins.length > 0 ? clientOrigins : true, // allow all if not configured (dev convenience)
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- Health check ---
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'BorrowBox API is healthy.',
    timestamp: new Date().toISOString(),
  });
});

// --- Feature routes ---
app.use('/api/auth', authRoutes);
app.use('/api/items', itemRoutes);

// --- 404 + centralized error handling (must be last) ---
app.use(notFound);
app.use(errorHandler);

module.exports = app;
