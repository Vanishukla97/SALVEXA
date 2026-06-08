const express = require('express');
const { body } = require('express-validator');
const {
  register,
  login,
  logout,
  logoutAll,
  me,
  acceptTerms,
} = require('../controllers/authController');
const { authenticate } = require('../middleware/authMiddleware');
const { validateRequest } = require('../middleware/validateRequest');

const router = express.Router();

router.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>_])/)
      .withMessage('Password must include uppercase, lowercase, number & special character'),
    body('acceptTerms')
      .custom((value) => value === true)
      .withMessage('Accept Terms & Conditions and Medical Disclaimer to continue'),
  ],
  validateRequest,
  register
);

router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
    body('rememberMe').optional().isBoolean().withMessage('rememberMe must be boolean'),
  ],
  validateRequest,
  login
);

router.get('/me', authenticate, me);
router.post(
  '/accept-terms',
  authenticate,
  [
    body('termsVersion').trim().notEmpty().withMessage('termsVersion is required'),
  ],
  validateRequest,
  acceptTerms
);
router.post('/logout', authenticate, logout);
router.post('/logout-all', authenticate, logoutAll);

module.exports = router;
