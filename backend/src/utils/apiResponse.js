/**
 * Standard API Response Framework Utilities
 */

const successResponse = (res, data = {}, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    ...data,
  });
};

const errorResponse = (res, message = 'An error occurred', statusCode = 500, details = null) => {
  const payload = {
    success: false,
    error: message,
  };
  if (details) payload.details = details;
  return res.status(statusCode).json(payload);
};

module.exports = {
  successResponse,
  errorResponse,
};

