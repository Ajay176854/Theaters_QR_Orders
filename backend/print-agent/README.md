# Print Agent — Theater QR Order System

The Print Agent is a standalone Node.js application that runs on a local PC inside the theater. It connects to a networked thermal printer and automatically prints order receipts by polling the backend server for pending print jobs.

## Prerequisites

- **Node.js** v16+ installed on the local theater PC
- **Thermal Printer** connected to the same network (LAN/Wi-Fi)
  - Any ESC/POS compatible printer (80mm recommended)
  - Supported models: Epson TM-T88, TM-T20, TM-T82, or any generic 80mm thermal printer
  - Printer must be accessible via TCP/IP (not USB — use a print server if needed)
- **Backend Server** running and accessible from the local PC

## Installation

```bash
# Navigate to the print-agent directory
cd print-agent

# Install dependencies
npm install

# Copy and configure environment file
cp .env.example .env
```

## Configuration

Edit the `.env` file with your settings:

```env
# IP address of your thermal printer on the local network
PRINTER_IP=192.168.1.100

# TCP port (9100 is the standard for ESC/POS printers)
PRINTER_PORT=9100

# Your theater's unique ID from the admin panel
THEATER_ID=your-theater-id-here

# URL of the backend server
SERVER_URL=http://localhost:5000

# How often to check for new print jobs (in milliseconds)
POLL_INTERVAL=5000
```

### Finding Your Printer's IP

1. **Printer Menu**: Most thermal printers have a self-test button that prints network info. Hold the feed button while turning on the printer.
2. **Router Admin**: Check your router's admin panel at `192.168.1.1` for connected devices.
3. **Network Scan**: Use `nmap -sn 192.168.1.0/24` or the Advanced IP Scanner tool on Windows.

## Usage

### Start the Print Agent

```bash
npm start
```

Output:
```
========================================
   Theater Bites — Print Agent
========================================
[Agent] Print Agent started for Theater: your-theater-id
[Agent] Server URL: http://localhost:5000
[Agent] Printer: 192.168.1.100:9100
[Agent] Poll interval: 5000ms
----------------------------------------
[Agent] Polling for print jobs...
```

### Print a Test Page

```bash
node agent.js --test
```

This sends a test receipt to the printer to verify connectivity.

### Development Mode (auto-restart on changes)

```bash
npm run dev
```

## How It Works

1. **Polling**: The agent polls the server every 5 seconds (configurable) for pending print jobs
2. **Fetch**: Calls `GET /api/print/pending/{theaterId}` to get unprinted orders
3. **Format**: Converts order data into a formatted receipt using `ticket-template.js`
4. **Print**: Sends ESC/POS commands to the thermal printer via TCP socket
5. **Confirm**: Marks the job as complete via `PATCH /api/print/{jobId}/complete`
6. **Error Handling**: On print failure, reports to server via `POST /api/print/{jobId}/retry`

## Receipt Layout

```
========================================
         THEATER BITES
      PVR Cinemas - Demo
========================================
Order: TH-A3X9
Screen: 1  |  Seat: A5
Date: 03-Nov-2026  10:15 AM
----------------------------------------
Item                    Qty     Amount
----------------------------------------
Butter Popcorn (L)       1     Rs.250
Cold Coffee              2     Rs.300
Nachos Cheese            1     Rs.180
----------------------------------------
                TOTAL:  Rs.730
----------------------------------------
      Payment: Online (Paid)
========================================
      Please collect at counter
        or wait for delivery
========================================
```

## Troubleshooting

### Printer not found / Connection refused

- **Check IP**: Verify the printer's IP address matches your `.env` config
- **Ping test**: Run `ping 192.168.1.100` from the theater PC
- **Port check**: Run `telnet 192.168.1.100 9100` to verify the port is open
- **Firewall**: Ensure Windows Firewall allows outbound connections on port 9100
- **Same network**: Verify both the PC and printer are on the same LAN/subnet

### Printer prints garbage characters

- Verify the printer supports ESC/POS commands
- Check that the printer's character encoding is set to UTF-8 or compatible
- Try resetting the printer (turn off, wait 10 seconds, turn on)

### Server connection errors

- Verify `SERVER_URL` in `.env` is correct and the server is running
- Check network connectivity: `curl http://localhost:5000/api/health`
- If using HTTPS, ensure certificates are valid

### Agent stops unexpectedly

- Check the console output for error messages
- Run with `node agent.js 2>&1 | tee agent.log` to capture logs
- On Windows, consider using PM2 for process management:
  ```bash
  npm install -g pm2
  pm2 start agent.js --name print-agent
  pm2 logs print-agent
  ```

### Paper jam or printer offline

- Clear the paper jam manually
- The agent will automatically retry failed jobs on the next poll cycle
- Failed jobs are reported to the server for tracking

## Running as a Service (Production)

### Windows (using PM2)

```bash
npm install -g pm2
pm2 start agent.js --name print-agent
pm2 save
pm2 startup
```

### Linux (using systemd)

Create `/etc/systemd/system/print-agent.service`:

```ini
[Unit]
Description=Theater QR Print Agent
After=network.target

[Service]
Type=simple
User=theater
WorkingDirectory=/home/theater/print-agent
ExecStart=/usr/bin/node agent.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable print-agent
sudo systemctl start print-agent
```

## Supported Printers

| Printer Model | Width | Status |
|---|---|---|
| Epson TM-T88 series | 80mm | ✅ Tested |
| Epson TM-T20 series | 80mm | ✅ Tested |
| Epson TM-T82 series | 80mm | ✅ Tested |
| Star TSP100 series | 80mm | ✅ Compatible |
| Generic 80mm ESC/POS | 80mm | ✅ Compatible |
| Generic 58mm ESC/POS | 58mm | ⚠️ Layout may wrap |

> **Note**: 80mm printers are recommended for best receipt formatting. 58mm printers will work but items with long names may wrap to the next line.
