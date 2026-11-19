/**
 * Global error handler middleware
 */
const errorHandler = (err, req, res, _next) => {
  console.error('Error:', err.message);
  if (process.env.NODE_ENV !== 'production') {
    console.error(err.stack);
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ error: 'Validation Error', details: messages });
  }

  // Mongoose cast error (bad ObjectId)
  if (err.name === 'CastError') {
    return res.status(400).json({ error: `Invalid ${err.path}: ${err.value}` });
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(409).json({ error: `Duplicate value for ${field}. This ${field} already exists.` });
  }

  // Custom operational error
  if (err.statusCode) {
    return res.status(err.statusCode).json({ error: err.message });
  }

  // Default server error
  res.status(500).json({ error: 'Internal server error' });
};

module.exports = errorHandler;
