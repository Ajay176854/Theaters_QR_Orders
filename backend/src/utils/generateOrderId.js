const crypto = require('crypto');

/**
 * Generate a short human-readable order ID like "GMM-A3X9K2"
 * Format: GMM- followed by 6 alphanumeric uppercase characters
 */
function generateOrderId() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed ambiguous: 0, O, I, 1
  const bytes = crypto.randomBytes(6);
  let result = 'GMM-';
  for (let i = 0; i < 6; i++) {
    result += chars[bytes[i] % chars.length];
  }
  return result;
}

module.exports = generateOrderId;
