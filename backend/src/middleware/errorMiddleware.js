function errorHandler(err, req, res, _next) {
  if (process.env.NODE_ENV !== 'test') {
    console.error(err.stack);
  }

  const statusCode = err.statusCode || (err.status && Number.isInteger(err.status) ? err.status : 500);

  // Jangan bocorkan internal SQL/driver error ke klien pada production
  let message = err.message || 'Terjadi kesalahan pada server';
  if (process.env.NODE_ENV === 'production' && statusCode === 500) {
    message = 'Terjadi kesalahan internal pada server. Silakan hubungi admin.';
  }

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}

module.exports = { errorHandler };