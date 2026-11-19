require('dotenv').config();

module.exports = {
  printerIp: process.env.PRINTER_IP || '192.168.1.100',
  printerPort: parseInt(process.env.PRINTER_PORT) || 9100,
  theaterId: process.env.THEATER_ID,
  serverUrl: process.env.SERVER_URL || 'http://localhost:5000',
  pollInterval: parseInt(process.env.POLL_INTERVAL) || 5000,
};
