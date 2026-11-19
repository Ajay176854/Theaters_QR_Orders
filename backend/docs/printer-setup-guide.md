# 🖨️ Theater Kitchen Thermal Printer Setup Guide

This guide describes how to configure auto-printing kitchen tickets for confirmed seat food orders using any standard ESC/POS 80mm thermal receipt printer.

---

## 1. System Architecture

```
Customer Pays (UPI/Card)
        │
        ▼
Backend API confirms payment & inserts PrintJob
        │
        ▼ (HTTP Polling every 3-5 sec)
print-agent (runs on local counter PC / mini PC)
        │
        ▼ (TCP Raw Socket port 9100)
Kitchen Thermal Printer (Epson / Posiflex / TVS / NGX)
        │
        ▼
🖨️ [Ticket Auto-Prints & Cuts Paper]
```

---

## 2. Supported Printers

Any standard thermal printer supporting **ESC/POS protocol over Ethernet (RJ-45) or Wi-Fi**:
- **Epson**: TM-T88VI, TM-T82III, TM-m30
- **Posiflex**: Aura-6900, Aura-7600
- **TVS Electronics**: RP 3200 Plus, RP 3150 Star
- **NGX / Retsol / Generic 80mm ESC/POS**

---

## 3. Printer Network Configuration

1. Connect the printer to the theater's Local Area Network (LAN) using an Ethernet cable.
2. Turn on the printer while holding down the **FEED** button to print a self-test slip.
3. Note the IP address printed on the slip (e.g. `192.168.1.100`).
4. Set a **static IP reservation** in the router for this MAC address so the IP never changes.

---

## 4. Setting Up the Print Agent

The `print-agent` runs as a background service on any Windows/Linux/Mac PC inside the theater connected to the same LAN.

### 4.1 Install Node.js
Ensure Node.js 18+ is installed on the local counter PC.

### 4.2 Configure Environment
```bash
cd print-agent
npm install
cp .env.example .env
```

Edit `.env`:
```ini
# Local Printer IP on theater LAN
PRINTER_IP=192.168.1.100
PRINTER_PORT=9100

# Server & Theater ID
THEATER_ID=66fa8912345bcdef12345678
SERVER_URL=https://api.theaterbites.in

# Polling frequency in milliseconds
POLL_INTERVAL=4000
```

### 4.3 Run the Agent
```bash
node agent.js
```

You should see:
```
===================================================
🖨️ Theater Kitchen Print Agent Started
===================================================
Theater ID   : 66fa8912345bcdef12345678
Printer IP   : 192.168.1.100:9100
Server URL   : https://api.theaterbites.in
Polling Every: 4000 ms
===================================================
```

---

## 5. Running as a Persistent Windows Service

To ensure the print agent automatically starts on boot:

Install PM2 globally:
```bash
npm install -g pm2
pm2 start agent.js --name "theater-printer"
pm2 save
pm2 startup
```

---

## 6. Testing the Printer

In the Admin Panel:
1. Navigate to **Printer Settings** (`/printer-settings`).
2. Verify the IP address matches your printer.
3. Click **"Send Test Ticket"**.
4. The printer will immediately buzz, print a test ticket, and cut the paper!

