const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/apiError');
const UserModel = require('../models/UserModel');
const UserSessionModel = require('../models/UserSessionModel');
const HealthProfileModel = require('../models/HealthProfileModel');
const { hashPassword, comparePassword } = require('../utils/password');
const { signAccessToken } = require('../utils/jwt');
const { hashToken } = require('../utils/tokenHash');
const env = require('../config/env');
const {
  ensureProfileCompletionNotification,
  createWeeklyReportNotificationIfEnabled,
} = require('../services/notificationService');

function parseJsonList(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      return [];
    }
  }
  return [];
}

const register = asyncHandler(async (req, res) => {
  const { name, email, password, acceptTerms } = req.body;
  const existing = await UserModel.findByEmail(email);
  if (existing) {
    throw new ApiError(400, 'Email is already registered');
  }
  if (!acceptTerms) {
    throw new ApiError(400, 'You must accept Terms & Conditions and Medical Disclaimer');
  }

  const passwordHash = await hashPassword(password);
  const userId = await UserModel.createUser({
    name,
    email,
    passwordHash,
    termsAcceptedAt: new Date(),
    termsVersion: env.terms.currentVersion,
  });
  const user = await UserModel.findById(userId);

  return res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: user,
  });
});

const login = asyncHandler(async (req, res) => {
  const { email, password, rememberMe = false } = req.body;
  const user = await UserModel.findByEmail(email);
  if (!user) {
    throw new ApiError(401, 'Invalid email or password');
  }

  const isPasswordCorrect = await comparePassword(password, user.password_hash);
  if (!isPasswordCorrect) {
    throw new ApiError(401, 'Invalid email or password');
  }

  const requiresTermsConsent = user.terms_version !== env.terms.currentVersion;

  const profile = await HealthProfileModel.getByUserId(user.id);
  await ensureProfileCompletionNotification({
    userId: user.id,
    profile: profile
      ? {
          ...profile,
          allergies: parseJsonList(profile.allergies),
          current_medicines: parseJsonList(profile.current_medicines),
        }
      : null,
  });
  await createWeeklyReportNotificationIfEnabled({ userId: user.id });

  const token = signAccessToken({ userId: user.id, email: user.email }, rememberMe);
  const decodedPayload = JSON.parse(
    Buffer.from(token.split('.')[1], 'base64url').toString('utf8')
  );
  const expiresAt = new Date(decodedPayload.exp * 1000);
  await UserSessionModel.createSession({
    userId: user.id,
    tokenHash: hashToken(token),
    expiresAt,
  });

  res.cookie('token', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000,
  });

  return res.status(200).json({
    success: true,
    message: 'Login successful',
    data: {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      requiresTermsConsent,
      requiredTermsVersion: env.terms.currentVersion,
    },
  });
});

const logout = asyncHandler(async (req, res) => {
  const token = req.authToken || req.cookies?.token;
  if (token) {
    await UserSessionModel.deleteSession(hashToken(token));
  }
  res.clearCookie('token');
  return res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  });
});

const logoutAll = asyncHandler(async (req, res) => {
  await UserSessionModel.deleteSessionsByUserId(req.user.userId);
  res.clearCookie('token');
  return res.status(200).json({
    success: true,
    message: 'Logged out from all devices',
  });
});

const me = asyncHandler(async (req, res) => {
  const user = await UserModel.findById(req.user.userId);
  if (!user) throw new ApiError(404, 'User not found');
  return res.status(200).json({
    success: true,
    data: user,
  });
});

const acceptTerms = asyncHandler(async (req, res) => {
  const { termsVersion } = req.body;
  if (!termsVersion || String(termsVersion).trim() !== env.terms.currentVersion) {
    throw new ApiError(400, `Invalid terms version. Please accept latest version: ${env.terms.currentVersion}`);
  }

  await UserModel.updateTermsConsent({
    userId: req.user.userId,
    termsVersion: env.terms.currentVersion,
  });
  const user = await UserModel.findById(req.user.userId);

  return res.status(200).json({
    success: true,
    message: 'Terms accepted successfully',
    data: {
      user,
      currentTermsVersion: env.terms.currentVersion,
    },
  });
});

module.exports = { register, login, logout, logoutAll, me, acceptTerms };
