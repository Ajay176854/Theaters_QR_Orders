const express = require('express');
const router = express.Router();
const {
  createOrder,
  getOrders,
  getOrderById,
  updateOrderStatus,
  escalateOrder,
} = require('../controllers/orderController');
const { authenticate, authorize } = require('../middleware/auth');

// POST /api/orders - public (customer places order)
router.post('/', createOrder);

// GET /api/orders - staff/admin
router.get('/', authenticate, authorize('admin', 'staff'), getOrders);

// GET /api/orders/:id - staff/admin or by orderId
router.get('/:id', getOrderById);

// PATCH & PUT /api/orders/:id/status - staff/admin
router.patch('/:id/status', authenticate, authorize('admin', 'staff'), updateOrderStatus);
router.put('/:id/status', authenticate, authorize('admin', 'staff'), updateOrderStatus);

// POST /api/orders/:id/escalate - trigger or test call forward escalation to admin
router.post('/:id/escalate', escalateOrder);

module.exports = router;
