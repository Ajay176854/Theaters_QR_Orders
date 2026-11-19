const os = require('os');

/**
 * Dynamically detect the current active Wi-Fi or LAN IPv4 address
 * so that mobile phones connected to the same Wi-Fi can immediately load the app.
 */
function getLanIp() {
  const ifaces = os.networkInterfaces();

  // 1. Check Wi-Fi / Wireless adapters first
  for (const name of Object.keys(ifaces)) {
    if (/wi-?fi|wireless|wlan/i.test(name)) {
      for (const details of ifaces[name]) {
        if (details.family === 'IPv4' && !details.internal && !details.address.startsWith('169.254.')) {
          return details.address;
        }
      }
    }
  }

  // 2. Check general LAN Ethernet / Network interfaces (exclude VPN/virtual)
  for (const name of Object.keys(ifaces)) {
    if (/tailscale|virtual|vbox|wsl|hyper-v|vethernet/i.test(name)) continue;
    for (const details of ifaces[name]) {
      if (details.family === 'IPv4' && !details.internal && !details.address.startsWith('169.254.')) {
        return details.address;
      }
    }
  }

  // 3. Fallback to 10.190.5.47 or localhost
  return '10.190.5.47';
}

module.exports = getLanIp;
