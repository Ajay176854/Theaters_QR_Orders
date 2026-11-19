/**
 * Professional Request Logging Middleware
 * Tracks Method, URL, Status Code, and Latency
 */

const requestLogger = (req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const { method, originalUrl } = req;
    const { statusCode } = res;

    let statusColor = '\x1b[32m'; // Green
    if (statusCode >= 400 && statusCode < 500) statusColor = '\x1b[33m'; // Yellow
    if (statusCode >= 500) statusColor = '\x1b[31m'; // Red

    const resetColor = '\x1b[0m';
    const dimColor = '\x1b[2m';

    console.log(
      `${dimColor}[${new Date().toLocaleTimeString()}]${resetColor} ${method} ${originalUrl} ${statusColor}${statusCode}${resetColor} ${dimColor}(${duration}ms)${resetColor}`
    );
  });

  next();
};

module.exports = requestLogger;

