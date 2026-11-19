const express = require('express');
const router = express.Router();
const {
  createMenuItem,
  getMenuItems,
  getMenuItem,
  updateMenuItem,
  deleteMenuItem,
} = require('../controllers/menuController');
const { authenticate, authorize } = require('../middleware/auth');

// GET /api/menu - public (customers scan QR and see menu)
router.get('/', getMenuItems);

// GET /api/menu/:id - public
router.get('/:id', getMenuItem);

// POST /api/menu - admin only
router.post('/', authenticate, authorize('admin'), createMenuItem);

// PUT /api/menu/:id - admin only
router.put('/:id', authenticate, authorize('admin'), updateMenuItem);

// DELETE /api/menu/:id - admin only
router.delete('/:id', authenticate, authorize('admin'), deleteMenuItem);

module.exports = router;
