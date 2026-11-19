const PrintJob = require('../models/PrintJob');

/**
 * Get pending print jobs for a theater (for print-agent polling)
 * GET /api/print/pending/:theaterId
 */
const getPendingPrintJobs = async (req, res, next) => {
  try {
    const { theaterId } = req.params;

    const jobs = await PrintJob.find({ theaterId, status: 'pending' })
      .populate({
        path: 'orderId',
        select: 'orderId screenNumber seatNumber items totalAmount customerName customerPhone createdAt',
      })
      .populate({
        path: 'theaterId',
        select: 'name settings.printerIp',
      })
      .sort({ createdAt: 1 })
      .lean();

    res.json({ count: jobs.length, jobs });
  } catch (error) {
    next(error);
  }
};

/**
 * Mark a print job as printed
 * PATCH /api/print/:jobId/complete
 */
const markPrinted = async (req, res, next) => {
  try {
    const { jobId } = req.params;

    const job = await PrintJob.findById(jobId);
    if (!job) {
      return res.status(404).json({ error: 'Print job not found.' });
    }

    job.status = 'printed';
    job.attempts += 1;
    await job.save();

    res.json({ message: 'Print job marked as printed.', job });
  } catch (error) {
    next(error);
  }
};

/**
 * Retry a failed print job (reset to pending)
 * POST /api/print/:jobId/retry
 */
const retryPrint = async (req, res, next) => {
  try {
    const { jobId } = req.params;

    const job = await PrintJob.findById(jobId);
    if (!job) {
      return res.status(404).json({ error: 'Print job not found.' });
    }

    job.status = 'pending';
    job.lastError = '';
    await job.save();

    res.json({ message: 'Print job reset to pending.', job });
  } catch (error) {
    next(error);
  }
};

/**
 * Mark a print job as failed
 * PATCH /api/print/:jobId/fail
 */
const markFailed = async (req, res, next) => {
  try {
    const { jobId } = req.params;
    const { error: errorMessage } = req.body;

    const job = await PrintJob.findById(jobId);
    if (!job) {
      return res.status(404).json({ error: 'Print job not found.' });
    }

    job.status = 'failed';
    job.attempts += 1;
    job.lastError = errorMessage || 'Unknown error';
    await job.save();

    res.json({ message: 'Print job marked as failed.', job });
  } catch (error) {
    next(error);
  }
};

module.exports = { getPendingPrintJobs, markPrinted, retryPrint, markFailed };
