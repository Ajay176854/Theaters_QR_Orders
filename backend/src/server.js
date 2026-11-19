require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');
const connectDB = require('./config/db');
const { initBaileysBot } = require('./services/baileysBot');
const { initEscalationMonitor } = require('./services/escalationService');

const server = http.createServer(app);

// Initialize MongoDB Atlas connection
connectDB();

// Initialize Socket.IO with CORS
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
  },
  pingTimeout: 30000,
  pingInterval: 10000,
});

// Expose Socket.IO instance to Express controllers via req.app.get('io')
app.set('io', io);

// Socket.IO Room Management
io.on('connection', (socket) => {
  socket.on('join-theater', (theaterId) => {
    if (theaterId) {
      socket.join(`theater-${theaterId}`);
    }
  });

  socket.on('leave-theater', (theaterId) => {
    if (theaterId) {
      socket.leave(`theater-${theaterId}`);
    }
  });
});

const PORT = process.env.PORT || 5000;
const HOST = '0.0.0.0';

server.listen(PORT, HOST, () => {
  console.log(`===============================================`);
  console.log(`🎬 Grandé Muthuram Multiplex QR Order Backend`);
  console.log(`📡 Listening on http://${HOST}:${PORT}`);
  console.log(`⚡ WebSocket / Socket.IO Live Status Ready`);
  console.log(`💬 WhatsApp QR Setup: http://localhost:${PORT}/api/whatsapp/qr`);
  console.log(`===============================================`);

  // Start Autonomous WhatsApp Bot (Baileys)
  setTimeout(() => {
    initBaileysBot().catch((err) => console.warn('[WhatsApp Bot Auto-Start]', err.message));
    initEscalationMonitor(io);
  }, 1000);
});

// Process-level Graceful Shutdown Handlers
const handleShutdown = (signal) => {
  console.log(`\n[Server] Received ${signal}. Closing HTTP and WebSocket servers gracefully...`);
  server.close(() => {
    console.log('[Server] HTTP and Socket.IO servers closed cleanly.');
    process.exit(0);
  });
  // Force shutdown if cleanup hangs
  setTimeout(() => {
    console.error('[Server] Forced shutdown after timeout.');
    process.exit(1);
  }, 5000);
};

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));

process.on('unhandledRejection', (reason) => {
  console.error('[Unhandled Rejection]', reason);
});

module.exports = { app, server, io };
