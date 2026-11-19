const express = require('express');
const router = express.Router();
const PrintJob = require('../models/PrintJob');
const {
  getPendingPrintJobs,
  markPrinted,
  retryPrint,
  markFailed,
} = require('../controllers/printController');

// GET /api/print/pending/:theaterId - print agent polls this
router.get('/pending/:theaterId', getPendingPrintJobs);

// GET /api/print/history/:theaterId - recent print jobs for admin
router.get('/history/:theaterId', async (req, res, next) => {
  try {
    const { theaterId } = req.params;
    const jobs = await PrintJob.find({ theaterId })
      .populate('orderId', 'orderId screenNumber seatNumber totalAmount createdAt')
      .sort({ createdAt: -1 })
      .limit(30)
      .lean();
    res.json({ jobs });
  } catch (error) {
    next(error);
  }
});

// POST /api/print/test - send a test print job for a theater
router.post('/test', async (req, res, next) => {
  try {
    const { theaterId } = req.body;
    if (!theaterId) {
      return res.status(400).json({ error: 'theaterId is required' });
    }
    const job = await PrintJob.create({
      theaterId,
      status: 'pending',
      attempts: 0,
      isTest: true,
    });
    res.json({ message: 'Test print job queued', job });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/print/:jobId/complete - mark as printed
router.patch('/:jobId/complete', markPrinted);

// POST /api/print/:jobId/retry - reset to pending
router.post('/:jobId/retry', retryPrint);

// PATCH /api/print/:jobId/fail - mark as failed
router.patch('/:jobId/fail', markFailed);

module.exports = router;
