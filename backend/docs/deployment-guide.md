# 🚀 Deployment Guide - Theater QR Order System

This guide outlines how to deploy all modules of the Theater QR Order platform into production.

---

## Architecture Overview

| Module | Purpose | Recommended Host |
|--------|---------|------------------|
| `backend/` | Express API, Socket.IO, DB | Railway / Render / AWS EC2 |
| `frontend/` | Customer mobile-first app | Vercel / Netlify / Cloudflare Pages |
| `dashboard/` | Counter staff live orders | Vercel / Netlify / Cloudflare Pages |
| `admin/` | Management panel | Vercel / Netlify / Cloudflare Pages |
| `print-agent/` | Local kitchen printer bridge | Local Theater Counter PC (LAN) |
| Database | MongoDB Atlas | MongoDB Atlas (M0 / Dedicated) |

---

## 1. MongoDB Atlas Setup

1. Create a free cluster on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Create a database user with read/write permissions.
3. Whitelist Network Access (`0.0.0.0/0` for cloud deployment or specific IPs).
4. Copy the connection URI:
   ```
   mongodb+srv://user:password@cluster.mongodb.net/theater-qr-order?retryWrites=true&w=majority
   ```

---

## 2. Backend Deployment (Render or Railway)

### Environment Variables
Configure the following in your host settings:
```ini
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://...
JWT_SECRET=production_strong_jwt_secret_92813
RAZORPAY_KEY_ID=rzp_live_xxxxxxxx
RAZORPAY_KEY_SECRET=your_razorpay_live_secret
FRONTEND_URL=https://order.theaterbites.in
```

### Build & Start Commands
- **Build**: `cd backend && npm install`
- **Start**: `cd backend && npm start`

---

## 3. Frontend Deployment (Customer App)

### Vercel / Netlify Setup
- **Root Directory**: `frontend`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`

### Environment Variables
```ini
VITE_API_URL=https://api.theaterbites.in
VITE_RAZORPAY_KEY=rzp_live_xxxxxxxx
```

---

## 4. Counter Dashboard Deployment

- **Root Directory**: `dashboard`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`

### Environment Variables
```ini
VITE_API_URL=https://api.theaterbites.in
```

---

## 5. Admin Panel Deployment

- **Root Directory**: `admin`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`

### Environment Variables
```ini
VITE_API_URL=https://api.theaterbites.in
```

---

## 6. Seed Initial Theater Data

Run once against your production MongoDB URI:
```bash
MONGODB_URI=mongodb+srv://... node database/seed.js
```

