/**
 * printer.js
 * ESC/POS thermal printer driver via TCP socket (net module).
 * Connects to the printer over the network and sends raw ESC/POS commands.
 */

const net = require('net');
const config = require('./config');

// ESC/POS Command Constants
const ESC = '\x1B';
const GS = '\x1D';

const COMMANDS = {
  INIT: `${ESC}\x40`,               // Initialize printer
  ALIGN_LEFT: `${ESC}\x61\x00`,     // Left align
  ALIGN_CENTER: `${ESC}\x61\x01`,   // Center align
  ALIGN_RIGHT: `${ESC}\x61\x02`,    // Right align
  BOLD_ON: `${ESC}\x45\x01`,        // Bold on
  BOLD_OFF: `${ESC}\x45\x00`,       // Bold off
  DOUBLE_HEIGHT: `${ESC}\x21\x10`,  // Double height text
  NORMAL_SIZE: `${ESC}\x21\x00`,    // Normal size text
  DOUBLE_WIDTH: `${ESC}\x21\x20`,   // Double width text
  DOUBLE_BOTH: `${ESC}\x21\x30`,    // Double width + height
  UNDERLINE_ON: `${ESC}\x2D\x01`,   // Underline on
  UNDERLINE_OFF: `${ESC}\x2D\x00`,  // Underline off
  FEED_LINES: `${ESC}\x64\x03`,     // Feed 3 lines
  FEED_ONE: `${ESC}\x64\x01`,       // Feed 1 line
  CUT_PAPER: `${GS}\x56\x00`,       // Full cut
  PARTIAL_CUT: `${GS}\x56\x01`,     // Partial cut
  LINE_SPACING_DEFAULT: `${ESC}\x32`, // Default line spacing
};

/**
 * Sends raw data to the thermal printer via TCP socket
 * @param {Buffer|string} data - Data to send
 * @param {number} [retries=3] - Number of retry attempts
 * @returns {Promise<void>}
 */
async function sendToPrinter(data, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await new Promise((resolve, reject) => {
        const socket = new net.Socket();
        const timeout = setTimeout(() => {
          socket.destroy();
          reject(new Error('Printer connection timed out after 10 seconds'));
        }, 10000);

        socket.connect(config.printerPort, config.printerIp, () => {
          clearTimeout(timeout);
          socket.write(data, (err) => {
            if (err) {
              socket.destroy();
              reject(new Error(`Failed to write to printer: ${err.message}`));
              return;
            }
            // Small delay to ensure data is flushed
            setTimeout(() => {
              socket.end();
              resolve();
            }, 500);
          });
        });

        socket.on('error', (err) => {
          clearTimeout(timeout);
          socket.destroy();
          reject(new Error(`Printer socket error: ${err.message}`));
        });

        socket.on('close', () => {
          clearTimeout(timeout);
        });
      });

      // Success — exit retry loop
      return;
    } catch (err) {
      console.error(`[Printer] Attempt ${attempt}/${retries} failed: ${err.message}`);
      if (attempt === retries) {
        throw new Error(`Printer unreachable after ${retries} attempts: ${err.message}`);
      }
      // Wait before retry (exponential backoff)
      await new Promise((r) => setTimeout(r, 1000 * attempt));
    }
  }
}

/**
 * Builds ESC/POS formatted receipt buffer from formatted ticket text
 * @param {string} ticketText - Pre-formatted text from ticket-template.js
 * @returns {Buffer}
 */
function buildReceiptBuffer(ticketText) {
  const parts = [];

  // Initialize
  parts.push(Buffer.from(COMMANDS.INIT, 'binary'));
  parts.push(Buffer.from(COMMANDS.LINE_SPACING_DEFAULT, 'binary'));

  const lines = ticketText.split('\n');

  for (const line of lines) {
    // Detect dividers and headers for special formatting
    if (line.match(/^={10,}$/)) {
      // Double divider line — bold
      parts.push(Buffer.from(COMMANDS.BOLD_ON, 'binary'));
      parts.push(Buffer.from(line + '\n', 'utf8'));
      parts.push(Buffer.from(COMMANDS.BOLD_OFF, 'binary'));
    } else if (line.includes('THEATER BITES')) {
      // Store title — centered, double height, bold
      parts.push(Buffer.from(COMMANDS.ALIGN_CENTER, 'binary'));
      parts.push(Buffer.from(COMMANDS.DOUBLE_HEIGHT, 'binary'));
      parts.push(Buffer.from(COMMANDS.BOLD_ON, 'binary'));
      parts.push(Buffer.from(line.trim() + '\n', 'utf8'));
      parts.push(Buffer.from(COMMANDS.BOLD_OFF, 'binary'));
      parts.push(Buffer.from(COMMANDS.NORMAL_SIZE, 'binary'));
      parts.push(Buffer.from(COMMANDS.ALIGN_LEFT, 'binary'));
    } else if (line.includes('TOTAL:')) {
      // Total line — bold, right aligned
      parts.push(Buffer.from(COMMANDS.ALIGN_RIGHT, 'binary'));
      parts.push(Buffer.from(COMMANDS.BOLD_ON, 'binary'));
      parts.push(Buffer.from(COMMANDS.DOUBLE_HEIGHT, 'binary'));
      parts.push(Buffer.from(line.trim() + '\n', 'utf8'));
      parts.push(Buffer.from(COMMANDS.NORMAL_SIZE, 'binary'));
      parts.push(Buffer.from(COMMANDS.BOLD_OFF, 'binary'));
      parts.push(Buffer.from(COMMANDS.ALIGN_LEFT, 'binary'));
    } else if (line.includes('Payment:')) {
      // Payment info — centered
      parts.push(Buffer.from(COMMANDS.ALIGN_CENTER, 'binary'));
      parts.push(Buffer.from(line.trim() + '\n', 'utf8'));
      parts.push(Buffer.from(COMMANDS.ALIGN_LEFT, 'binary'));
    } else if (line.includes('collect at counter') || line.includes('wait for delivery')) {
      // Footer text — centered, smaller
      parts.push(Buffer.from(COMMANDS.ALIGN_CENTER, 'binary'));
      parts.push(Buffer.from(line.trim() + '\n', 'utf8'));
      parts.push(Buffer.from(COMMANDS.ALIGN_LEFT, 'binary'));
    } else if (line.trim().length > 0 && !line.match(/^-{5,}$/)) {
      // Theater name or regular line
      if (lines.indexOf(line) <= 3 && line.trim() !== '' && !line.startsWith('Order:')) {
        // Likely theater name in header — center it
        parts.push(Buffer.from(COMMANDS.ALIGN_CENTER, 'binary'));
        parts.push(Buffer.from(line.trim() + '\n', 'utf8'));
        parts.push(Buffer.from(COMMANDS.ALIGN_LEFT, 'binary'));
      } else {
        parts.push(Buffer.from(line + '\n', 'utf8'));
      }
    } else if (line.match(/^-{5,}$/)) {
      parts.push(Buffer.from(line + '\n', 'utf8'));
    } else {
      // Empty line
      parts.push(Buffer.from('\n', 'utf8'));
    }
  }

  // Feed and cut
  parts.push(Buffer.from(COMMANDS.FEED_LINES, 'binary'));
  parts.push(Buffer.from(COMMANDS.PARTIAL_CUT, 'binary'));

  return Buffer.concat(parts);
}

/**
 * Prints a formatted ticket
 * @param {string} ticketText - Pre-formatted receipt text
 * @returns {Promise<void>}
 */
async function printTicket(ticketText) {
  const buffer = buildReceiptBuffer(ticketText);
  await sendToPrinter(buffer);
}

/**
 * Prints a test page to verify printer connectivity
 * @returns {Promise<void>}
 */
async function printTestPage() {
  const parts = [];
  parts.push(Buffer.from(COMMANDS.INIT, 'binary'));
  parts.push(Buffer.from(COMMANDS.ALIGN_CENTER, 'binary'));
  parts.push(Buffer.from(COMMANDS.DOUBLE_HEIGHT, 'binary'));
  parts.push(Buffer.from(COMMANDS.BOLD_ON, 'binary'));
  parts.push(Buffer.from('PRINTER TEST\n', 'utf8'));
  parts.push(Buffer.from(COMMANDS.NORMAL_SIZE, 'binary'));
  parts.push(Buffer.from(COMMANDS.BOLD_OFF, 'binary'));
  parts.push(Buffer.from('========================================\n', 'utf8'));
  parts.push(Buffer.from(`Date: ${new Date().toLocaleString()}\n`, 'utf8'));
  parts.push(Buffer.from(`Printer: ${config.printerIp}:${config.printerPort}\n`, 'utf8'));
  parts.push(Buffer.from('========================================\n', 'utf8'));
  parts.push(Buffer.from('If you can read this, the\n', 'utf8'));
  parts.push(Buffer.from('printer is working correctly!\n', 'utf8'));
  parts.push(Buffer.from('========================================\n', 'utf8'));
  parts.push(Buffer.from(COMMANDS.ALIGN_LEFT, 'binary'));
  parts.push(Buffer.from(COMMANDS.FEED_LINES, 'binary'));
  parts.push(Buffer.from(COMMANDS.PARTIAL_CUT, 'binary'));

  const buffer = Buffer.concat(parts);
  await sendToPrinter(buffer);
}

module.exports = { printTicket, printTestPage, sendToPrinter, COMMANDS };
