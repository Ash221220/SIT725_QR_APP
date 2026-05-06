function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  const statusCode = err.statusCode && Number.isInteger(err.statusCode) ? err.statusCode : 500;
  const body = {
    success: false,
    message: statusCode === 500 ? 'Internal server error' : err.message,
  };

  if (err.code) {
    body.code = err.code;
  }

  if (statusCode >= 500) {
    console.error(err);
  }

  return res.status(statusCode).json(body);
}

module.exports = { errorHandler };
