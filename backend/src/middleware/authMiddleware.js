const ApiError = require('../utils/apiError');
const { verifyAccessToken } = require('../utils/jwt');
const { hashToken } = require('../utils/tokenHash');
const UserSessionModel = require('../models/UserSessionModel');

async function authenticate(req, _res, next) {
  const authHeader = req.headers.authorization;
  const bearerToken = authHeader && authHeader.startsWith('Bearer ')
    ? authHeader.split(' ')[1]
    : null;
  const cookieToken = req.cookies?.token || null;
  const token = bearerToken || cookieToken;

  if (!token) {
    return next(new ApiError(401, 'Authentication token missing'));
  }

  try {
    const decoded = verifyAccessToken(token);
    const session = await UserSessionModel.findActiveSession(hashToken(token));
    if (!session || Number(session.user_id) !== Number(decoded.userId)) {
      return next(new ApiError(401, 'Session expired or invalid'));
    }
    req.user = decoded;
    req.authToken = token;
    return next();
  } catch (error) {
    return next(new ApiError(401, 'Invalid or expired token'));
  }
}

module.exports = { authenticate };
