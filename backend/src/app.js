const express = require('express');
const cors = require('cors');
const requestLogger = require('./middleware/requestLogger');
const errorHandler = require('./middleware/errorHandler');

// Route imports
const authRoutes = require('./routes/auth');
const menuRoutes = require('./routes/menu');
const orderRoutes = require('./routes/orders');
const paymentRoutes = require('./routes/payment');
const printRoutes = require('./routes/print');
const qrRoutes = require('./routes/qr');
const reportRoutes = require('./routes/reports');
const theaterRoutes = require('./routes/theater');
const whatsappRoutes = require('./routes/whatsapp');
const voiceRoutes = require('./routes/voice');

const app = express();

// Global Middleware Stack
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-theater-id'],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

// Mount Application Routes
app.use('/api/auth', authRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/print', printRoutes);
app.use('/api/qr', qrRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/theaters', theaterRoutes);
app.use('/api/whatsapp', whatsappRoutes);
app.use('/api/voice', voiceRoutes);

// 404 Handler for undefined API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    error: `API route '${req.originalUrl}' not found.`,
  });
});

// Centralized Error Handling Middleware
app.use(errorHandler);

module.exports = app;

