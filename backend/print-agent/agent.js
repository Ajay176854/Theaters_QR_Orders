/**
 * agent.js
 * Main entry point for the Theater QR Order Print Agent.
 * Polls the server for pending print jobs and sends them to the thermal printer.
 */

const axios = require('axios');
const config = require('./config');
const { printTicket, printTestPage } = require('./printer');
const { formatTicket } = require('./ticket-template');

// Validate required config
if (!config.theaterId) {
  console.error('[Agent] ERROR: THEATER_ID is required. Set it in .env file.');
  process.exit(1);
}

const api = axios.create({
  baseURL: config.serverUrl,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

let isPolling = false;
let pollTimer = null;
let isShuttingDown = false;
let activeJobs = 0;

/**
 * Fetches pending print jobs from the server
 * @returns {Promise<Array>} Array of pending print job objects
 */
async function fetchPendingJobs() {
  try {
    const response = await api.get(`/api/print/pending/${config.theaterId}`);
    return response.data.jobs || response.data || [];
  } catch (err) {
    if (err.response) {
      console.error(`[Agent] Server error ${err.response.status}: ${err.response.data?.message || 'Unknown'}`);
    } else if (err.code === 'ECONNREFUSED') {
      console.error(`[Agent] Cannot connect to server at ${config.serverUrl}. Is it running?`);
    } else {
      console.error(`[Agent] Fetch error: ${err.message}`);
    }
    return [];
  }
}

/**
 * Marks a print job as completed on the server
 * @param {string} jobId
 */
async function markJobComplete(jobId) {
  try {
    await api.patch(`/api/print/${jobId}/complete`);
    console.log(`[Agent] Job ${jobId} marked as complete on server.`);
  } catch (err) {
    console.error(`[Agent] Failed to mark job ${jobId} complete: ${err.message}`);
  }
}

/**
 * Reports a print job failure to the server for retry
 * @param {string} jobId
 * @param {string} errorMessage
 */
async function reportJobFailure(jobId, errorMessage) {
  try {
    await api.post(`/api/print/${jobId}/retry`, { error: errorMessage });
    console.log(`[Agent] Job ${jobId} marked for retry on server.`);
  } catch (err) {
    console.error(`[Agent] Failed to report retry for job ${jobId}: ${err.message}`);
  }
}

/**
 * Processes a single print job
 * @param {Object} job - The print job object containing order data
 */
async function processJob(job) {
  const jobId = job._id || job.id;
  const order = job.order || job.orderData || job;

  console.log(`[Agent] Processing job ${jobId} — Order: ${order.orderNumber || 'N/A'}`);
  activeJobs++;

  try {
    const ticketText = formatTicket(order);
    await printTicket(ticketText);
    console.log(`[Agent] Successfully printed job ${jobId}`);
    await markJobComplete(jobId);
  } catch (err) {
    console.error(`[Agent] Print failed for job ${jobId}: ${err.message}`);
    await reportJobFailure(jobId, err.message);
  } finally {
    activeJobs--;
  }
}

/**
 * Main poll cycle — fetches and processes all pending jobs
 */
async function poll() {
  if (isPolling || isShuttingDown) return;
  isPolling = true;

  try {
    const jobs = await fetchPendingJobs();

    if (jobs.length > 0) {
      console.log(`[Agent] Found ${jobs.length} pending print job(s).`);
      // Process jobs sequentially to avoid printer conflicts
      for (const job of jobs) {
        if (isShuttingDown) break;
        await processJob(job);
      }
    }
  } catch (err) {
    console.error(`[Agent] Poll cycle error: ${err.message}`);
  } finally {
    isPolling = false;
  }
}

/**
 * Starts the polling loop
 */
function startPolling() {
  console.log('========================================');
  console.log('   Theater Bites — Print Agent');
  console.log('========================================');
  console.log(`[Agent] Print Agent started for Theater: ${config.theaterId}`);
  console.log(`[Agent] Server URL: ${config.serverUrl}`);
  console.log(`[Agent] Printer: ${config.printerIp}:${config.printerPort}`);
  console.log(`[Agent] Poll interval: ${config.pollInterval}ms`);
  console.log('----------------------------------------');
  console.log('[Agent] Polling for print jobs...');
  console.log('');

  // Initial poll immediately
  poll();

  // Then poll at configured interval
  pollTimer = setInterval(poll, config.pollInterval);
}

/**
 * Graceful shutdown handler
 */
async function shutdown(signal) {
  if (isShuttingDown) return;
  isShuttingDown = true;

  console.log('');
  console.log(`[Agent] Received ${signal}. Shutting down gracefully...`);

  // Stop polling
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }

  // Wait for active jobs to finish (max 15 seconds)
  const maxWait = 15000;
  const startTime = Date.now();

  while (activeJobs > 0 && (Date.now() - startTime) < maxWait) {
    console.log(`[Agent] Waiting for ${activeJobs} active job(s) to complete...`);
    await new Promise((r) => setTimeout(r, 1000));
  }

  if (activeJobs > 0) {
    console.log(`[Agent] Warning: ${activeJobs} job(s) still active after timeout.`);
  }

  console.log('[Agent] Print Agent stopped.');
  process.exit(0);
}

// Register signal handlers for graceful shutdown
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

// Handle uncaught errors
process.on('uncaughtException', (err) => {
  console.error(`[Agent] Uncaught exception: ${err.message}`);
  console.error(err.stack);
});

process.on('unhandledRejection', (reason) => {
  console.error(`[Agent] Unhandled rejection: ${reason}`);
});

// CLI argument to print test page
if (process.argv.includes('--test')) {
  console.log('[Agent] Printing test page...');
  printTestPage()
    .then(() => {
      console.log('[Agent] Test page printed successfully!');
      process.exit(0);
    })
    .catch((err) => {
      console.error(`[Agent] Test print failed: ${err.message}`);
      process.exit(1);
    });
} else {
  // Start the agent
  startPolling();
}
