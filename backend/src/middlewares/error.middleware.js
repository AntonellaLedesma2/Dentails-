/**
 * Middleware global de manejo de errores.
 * Debe registrarse al final de todos los middlewares y rutas.
 */
function errorHandler(err, req, res, next) {
  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Error interno del servidor';

  console.error(`[ERROR] ${req.method} ${req.originalUrl} - ${status}: ${message}`);

  res.status(status).json({
    error: true,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}

/**
 * Middleware para rutas no encontradas (404).
 */
function notFound(req, res) {
  res.status(404).json({
    error: true,
    message: `Endpoint no encontrado: ${req.method} ${req.originalUrl}`,
  });
}

module.exports = { errorHandler, notFound };
