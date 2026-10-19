const { validationResult } = require('express-validator');

/**
 * Middleware que verifica los resultados de express-validator.
 * Si hay errores, responde con 422 y la lista de errores.
 */
function validate(req, res, next) {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(422).json({
      error: true,
      message: 'Error de validación',
      errors: errors.array().map((e) => ({
        field: e.path,
        message: e.msg,
      })),
    });
  }

  next();
}

module.exports = { validate };
