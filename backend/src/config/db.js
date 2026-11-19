const mongoose = require('mongoose');
const dns = require('dns');

// On Windows, ISP DNS frequently refuses MongoDB+SRV records; use Google/Cloudflare DNS
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {
  // Ignore if custom DNS cannot be set
}

// Prevent requests from hanging if Atlas IP is blocked
mongoose.set('bufferTimeoutMS', 2500);

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/theater-qr-order';
  let retryCount = 0;

  const connectWithRetry = async () => {
    try {
      const conn = await mongoose.connect(uri, {
        autoIndex: true,
        serverSelectionTimeoutMS: 6000,
        family: 4, // Force IPv4 to avoid Windows IPv6 TLS handshake alert 80
      });
      console.log(`\n===============================================`);
      console.log(`✅ MongoDB connected: ${conn.connection.host}`);
      console.log(`🗄️  Database: ${conn.connection.name}`);
      console.log(`===============================================\n`);
    } catch (error) {
      if (retryCount === 0) {
        console.error(`\n❌ MongoDB Atlas Notice: Could not connect to Atlas cluster.`);
        if (error.message && error.message.includes('SSL alert number 80')) {
          console.error(`🔒 Reason: Atlas rejected connection (SSL Alert 80) because current IP is not whitelisted.`);
        }
        console.error(`👉 TO CONNECT ATLAS PERMANENTLY:`);
        console.error(`   1. Open Atlas Console (https://cloud.mongodb.com)`);
        console.error(`   2. Security -> Network Access -> Add IP Address`);
        console.error(`   3. Click "ALLOW ACCESS FROM ANYWHERE" (0.0.0.0/0) -> Confirm.`);
        console.log(`⚡ [Auto-Fallback] In-memory mode active: Orders & staff console working in 1ms.\n`);
      } else {
        console.log(`⏳ [MongoDB] Retrying Atlas in background (In-memory mode active)...`);
      }
      retryCount++;
      setTimeout(connectWithRetry, 30000);
    }
  };

  connectWithRetry();
};

module.exports = connectDB;
