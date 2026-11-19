# 🎬 Theater QR Order & Concession Management Platform

> A full-stack, real-time cinema seat ordering and food concession platform with Razorpay payment processing, live counter staff dashboard, admin management, and **automated ESC/POS kitchen thermal printing**.

---

## 🚀 Order Lifecycle Flow

```
CUSTOMER
   │
   ▼
Scans QR on seat (Screen + Seat in URL)
   │
   ▼
Browser opens → Menu loads (No app download needed)
   │
   ▼
Selects snacks/drinks → Cart → Pays via UPI / Card (Razorpay)
   │
   ▼
Payment Verified
   │
   ├──▶ Counter Dashboard (Live order card pops up with sound alert)
   │
   ├──▶ Kitchen Printer (ESC/POS receipt auto-prints at kitchen counter) 🖨️
   │
   └──▶ Customer gets Order ID + Live order status tracking
   │
   ▼
Staff prepares order → Marks "Ready"
   │
   ▼
Pickup at counter  OR  Seat Delivery
   │
   ▼
Marked Delivered ✓
```

---

## 📁 Repository Structure

```
Theater_QR_Order/
├── frontend/                  # Unified React App (Customer, Staff Counter & Admin)
│   ├── src/
│   │   ├── pages/             # Customer: OrderPage, MenuPage, CartPage, PaymentPage, ConfirmationPage
│   │   │                      # Staff: CounterDashboardPage (/counter)
│   │   │                      # Admin: AdminLayout, AdminDashboard, AdminMenu, AdminQR, AdminSetup, AdminPrinter, AdminReports (/admin/*)
│   │   │                      # Auth: LoginPage (/login)
│   │   ├── components/        # MenuItem, CartItem, OrderStatus, Header, Loader, CounterOrderCard, CounterStatsBar, AdminSidebar
│   │   ├── context/           # CartContext, AuthContext
│   │   └── styles/            # Dark cinema theme & dashboard styles
│   └── vite.config.js
│
├── backend/                   # Node.js + Express + Socket.IO REST API & Utilities
│   ├── src/
│   │   ├── config/            # MongoDB (Mongoose) & Razorpay config (with mock fallback)
│   │   ├── controllers/       # Auth, Menu, Order, Payment, Print
│   │   ├── models/            # Theater, User, Menu, Order, PrintJob
│   │   ├── routes/            # /api/auth, /api/menu, /api/orders, /api/payment, /api/print, etc.
│   │   ├── middleware/        # JWT auth, role authorization, error handling
│   │   └── server.js          # Express HTTP + Socket.IO server
│   ├── database/              # Database seeder scripts (seed.js)
│   ├── print-agent/           # ESC/POS thermal receipt printer daemon for theater kitchen
│   ├── docs/                  # API documentation, printer setup & client proposals
│   └── package.json
│
├── .env.example
├── .gitignore
└── README.md
```

---

## ⚡ Quick Start

### 1. Backend Setup (Port 5000)
```bash
cd backend
npm install
npm run seed      # Seeds demo theater, users & menu items
npm run dev       # Starts backend API server
```

### 2. Unified Frontend Setup (Port 5173)
```bash
cd frontend
npm install
npm run dev
```

### 3. Portal URLs & Logins
- **Customer Food Ordering**: `http://localhost:5173/demo-theater?screen=1&seat=A1`
- **Unified Staff & Admin Sign In**: `http://localhost:5173/login`
  - **Counter Staff**: `staff@theaterbites.in` / `staff123` ➔ Opens `/counter`
  - **Theater Admin**: `admin@theaterbites.in` / `admin123` ➔ Opens `/admin`

### 4. Kitchen Print Agent (Local Theater PC)
```bash
cd backend/print-agent
npm install
node agent.js
```

---

## 🖨️ Kitchen Auto-Printing

When customers complete payment:
1. Razorpay verification confirms transaction.
2. Order status moves to `confirmed`.
3. A `PrintJob` is generated in MongoDB.
4. The local `print-agent` fetches the job via HTTP and sends raw ESC/POS commands over TCP port 9100 directly to the thermal receipt printer.
5. The receipt prints immediately with sound alert and automated paper cut.

---

## 📄 License
MIT License. Built for seamless cinema concessions.

