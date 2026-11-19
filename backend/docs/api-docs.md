# 🎬 Theater QR Order System - API Documentation

Base URL: `http://localhost:5000/api` (or your deployed backend domain)

All protected routes require a Bearer JWT token in the `Authorization` header:
```
Authorization: Bearer <your_jwt_token>
```

---

## 1. Authentication (`/api/auth`)

### 1.1 Register User
- **Method**: `POST`
- **Endpoint**: `/api/auth/register`
- **Access**: Public / Superadmin
- **Body**:
  ```json
  {
    "name": "Jane Staff",
    "email": "jane@theaterbites.in",
    "password": "securepassword123",
    "role": "staff",
    "theaterId": "66fa8912345bcdef12345678"
  }
  ```
- **Response `201`**:
  ```json
  {
    "message": "User registered successfully",
    "token": "eyJhbGciOiJIUzI1NiIsIn...",
    "user": { "id": "...", "name": "Jane Staff", "email": "...", "role": "staff" }
  }
  ```

### 1.2 Login
- **Method**: `POST`
- **Endpoint**: `/api/auth/login`
- **Access**: Public
- **Body**:
  ```json
  {
    "email": "admin@theaterbites.in",
    "password": "admin123"
  }
  ```

### 1.3 Get Current Profile
- **Method**: `GET`
- **Endpoint**: `/api/auth/me`
- **Access**: Authenticated (`admin` or `staff`)

---

## 2. Concessions Menu (`/api/menu`)

### 2.1 Get Menu for Theater
- **Method**: `GET`
- **Endpoint**: `/api/menu/:theaterId` (or `/api/menu?theaterId=X&category=Snacks`)
- **Access**: Public (Customer ordering app)
- **Response `200`**:
  ```json
  {
    "items": [
      {
        "_id": "6724...",
        "name": "Butter Popcorn (Large)",
        "description": "Warm fresh cinema popcorn",
        "price": 290,
        "category": "Snacks",
        "isVeg": true,
        "available": true,
        "image": "https://..."
      }
    ]
  }
  ```

### 2.2 Create Menu Item
- **Method**: `POST`
- **Endpoint**: `/api/menu`
- **Access**: Admin only

### 2.3 Update Menu Item
- **Method**: `PUT`
- **Endpoint**: `/api/menu/:id`
- **Access**: Admin only

### 2.4 Delete Menu Item
- **Method**: `DELETE`
- **Endpoint**: `/api/menu/:id`
- **Access**: Admin only

---

## 3. Orders (`/api/orders`)

### 3.1 Create Order (Customer Initiates)
- **Method**: `POST`
- **Endpoint**: `/api/orders`
- **Access**: Public
- **Body**:
  ```json
  {
    "theaterId": "66fa8912345bcdef12345678",
    "screenNumber": 1,
    "seatNumber": "A5",
    "customerPhone": "9876543210",
    "customerName": "Rohan",
    "items": [
      { "menuItemId": "6724...", "quantity": 2 }
    ]
  }
  ```

### 3.2 List Active Orders
- **Method**: `GET`
- **Endpoint**: `/api/orders?theaterId=X&status=confirmed,preparing,ready`
- **Access**: Counter Staff / Admin

### 3.3 Get Order by ID
- **Method**: `GET`
- **Endpoint**: `/api/orders/:id`
- **Access**: Public / Counter Staff

### 3.4 Update Order Status
- **Method**: `PATCH`
- **Endpoint**: `/api/orders/:id/status`
- **Access**: Counter Staff / Admin
- **Body**:
  ```json
  { "status": "preparing" }
  ```
  *(Valid: `pending`, `confirmed`, `preparing`, `ready`, `delivered`, `cancelled`)*
- **Socket Broadcast**: Emits `order-status-update` to room `theater-{theaterId}`

---

## 4. Payments (`/api/payment`)

### 4.1 Create Razorpay Order
- **Method**: `POST`
- **Endpoint**: `/api/payment/create-order`
- **Body**:
  ```json
  { "orderId": "6724..." }
  ```
- **Response `200`**:
  ```json
  {
    "razorpayOrderId": "order_OG9183jfd8",
    "amount": 30450,
    "currency": "INR",
    "keyId": "rzp_test_..."
  }
  ```

### 4.2 Verify Payment Signature
- **Method**: `POST`
- **Endpoint**: `/api/payment/verify`
- **Body**:
  ```json
  {
    "razorpay_order_id": "order_OG9183jfd8",
    "razorpay_payment_id": "pay_OG91bds73",
    "razorpay_signature": "592bcde..."
  }
  ```
- **Actions triggered automatically upon verification**:
  1. Sets order status to `confirmed` and paymentStatus to `paid`
  2. Queues a `PrintJob` for the kitchen thermal printer
  3. Emits `new-order` socket event with sound alert trigger to counter dashboard

---

## 5. Kitchen Printing (`/api/print`)

### 5.1 Poll Pending Print Jobs (Print Agent)
- **Method**: `GET`
- **Endpoint**: `/api/print/pending/:theaterId`
- **Access**: Print Agent (Local LAN)
- **Response**: List of pending print jobs with populated order details.

### 5.2 Mark Print Job Complete
- **Method**: `PATCH`
- **Endpoint**: `/api/print/:jobId/complete`

### 5.3 Retry Failed Print Job
- **Method**: `POST`
- **Endpoint**: `/api/print/:jobId/retry`

---

## 6. Real-Time Socket.IO Events

Connect to backend via WebSocket:
```javascript
const socket = io('http://localhost:5000');
socket.emit('join-theater', theaterId);
```

| Event | Direction | Payload | Description |
|-------|-----------|---------|-------------|
| `join-theater` | Client ➔ Server | `theaterId` string | Joins theater room |
| `new-order` | Server ➔ Client | `{ orderId, screenNumber, seatNumber, items, totalAmount }` | Live sound alert & new card |
| `order-status-update` | Server ➔ Client | `{ orderId, status, screenNumber, seatNumber }` | Step status update |

