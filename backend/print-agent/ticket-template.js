/**
 * ticket-template.js
 * Formats order data into a thermal printer receipt layout (40 char width).
 */

const RECEIPT_WIDTH = 40;

/**
 * Centers text within the receipt width
 * @param {string} text
 * @returns {string}
 */
function centerText(text) {
  const padding = Math.max(0, Math.floor((RECEIPT_WIDTH - text.length) / 2));
  return ' '.repeat(padding) + text;
}

/**
 * Creates a divider line
 * @param {string} char
 * @returns {string}
 */
function divider(char = '-') {
  return char.repeat(RECEIPT_WIDTH);
}

/**
 * Right-aligns a value within a given total width
 * @param {string} label
 * @param {string} value
 * @param {number} width
 * @returns {string}
 */
function rightAlign(label, value, width = RECEIPT_WIDTH) {
  const spacer = width - label.length - value.length;
  return label + ' '.repeat(Math.max(1, spacer)) + value;
}

/**
 * Formats a currency value in INR
 * @param {number} amount
 * @returns {string}
 */
function formatCurrency(amount) {
  return `Rs.${amount.toFixed(0)}`;
}

/**
 * Formats a date object or ISO string to readable format
 * @param {Date|string} date
 * @returns {string}
 */
function formatDate(date) {
  const d = new Date(date);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const day = String(d.getDate()).padStart(2, '0');
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  const timeStr = `${String(hours).padStart(2, '0')}:${minutes} ${ampm}`;
  return `${day}-${month}-${year}  ${timeStr}`;
}

/**
 * Formats an item line with name, qty, and amount columns
 * @param {string} name
 * @param {number} qty
 * @param {number} amount
 * @returns {string}
 */
function formatItemLine(name, qty, amount) {
  const qtyStr = String(qty);
  const amountStr = formatCurrency(amount);
  // Name takes up to 24 chars, qty 3 chars, amount right-aligned
  const maxNameLen = RECEIPT_WIDTH - 12;
  const truncatedName = name.length > maxNameLen
    ? name.substring(0, maxNameLen - 2) + '..'
    : name;

  const nameCol = truncatedName.padEnd(maxNameLen);
  const qtyCol = qtyStr.padStart(3);
  const amtCol = amountStr.padStart(9);
  return `${nameCol}${qtyCol}${amtCol}`;
}

/**
 * Builds the full receipt text from an order object
 * @param {Object} order
 * @param {string} order.orderNumber - e.g., "TH-A3X9"
 * @param {number|string} order.screen - Screen number
 * @param {string} order.seat - Seat identifier, e.g., "A5"
 * @param {Date|string} order.createdAt - Order timestamp
 * @param {Array} order.items - Array of { name, quantity, price, total }
 * @param {number} order.totalAmount - Order total
 * @param {string} order.paymentMethod - "online" | "counter"
 * @param {string} order.paymentStatus - "paid" | "pending"
 * @param {string} [order.theaterName] - Theater name
 * @returns {string}
 */
function formatTicket(order) {
  const lines = [];

  // Header
  lines.push(divider('='));
  lines.push(centerText('THEATER BITES'));
  if (order.theaterName) {
    lines.push(centerText(order.theaterName));
  }
  lines.push(divider('='));

  // Order info
  lines.push(`Order: ${order.orderNumber || 'N/A'}`);
  lines.push(`Screen: ${order.screen || '-'}  |  Seat: ${order.seat || '-'}`);
  lines.push(`Date: ${formatDate(order.createdAt || new Date())}`);
  lines.push(divider('-'));

  // Column headers
  const headerName = 'Item'.padEnd(RECEIPT_WIDTH - 12);
  const headerQty = 'Qty'.padStart(3);
  const headerAmt = 'Amount'.padStart(9);
  lines.push(`${headerName}${headerQty}${headerAmt}`);
  lines.push(divider('-'));

  // Items
  if (order.items && order.items.length > 0) {
    for (const item of order.items) {
      const itemTotal = item.total || (item.price * item.quantity);
      lines.push(formatItemLine(item.name, item.quantity, itemTotal));
    }
  } else {
    lines.push(centerText('No items'));
  }

  lines.push(divider('-'));

  // Total
  const totalLabel = 'TOTAL:';
  const totalValue = formatCurrency(order.totalAmount || 0);
  lines.push(rightAlign('', `${totalLabel}  ${totalValue}`));

  lines.push(divider('-'));

  // Payment info
  const payMethod = order.paymentMethod === 'online' ? 'Online' : 'Counter';
  const payStatus = order.paymentStatus === 'paid' ? 'Paid' : 'Pending';
  lines.push(centerText(`Payment: ${payMethod} (${payStatus})`));

  lines.push(divider('='));

  // Footer
  lines.push(centerText('Please collect at counter'));
  lines.push(centerText('or wait for delivery'));

  lines.push(divider('='));

  // Add trailing newlines for printer feed
  lines.push('');
  lines.push('');

  return lines.join('\n');
}

module.exports = { formatTicket, centerText, divider, formatCurrency, formatDate };
