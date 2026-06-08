const jwt = require('jsonwebtoken');
const env = require('../config/env');

function signAccessToken(payload, rememberMe = false) {
  return jwt.sign(payload, env.jwt.secret, {
    expiresIn: rememberMe ? env.jwt.rememberExpiresIn : env.jwt.expiresIn,
  });
}

function verifyAccessToken(token) {
  return jwt.verify(token, env.jwt.secret);
}

module.exports = {
  signAccessToken,
  verifyAccessToken,
};
