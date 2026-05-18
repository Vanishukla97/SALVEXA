const { validationResult } = require('express-validator');

function validateRequest(req, _res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next({
      statusCode: 400,
      message: 'Validation failed',
      details: errors.array(),
    });
  }
  return next();
}

module.exports = { validateRequest };
