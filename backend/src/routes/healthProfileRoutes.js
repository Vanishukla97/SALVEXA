const express = require('express');
const { body } = require('express-validator');
const {
  upsertProfile,
  getProfile,
  deleteProfile,
} = require('../controllers/healthProfileController');
const { authenticate } = require('../middleware/authMiddleware');
const { validateRequest } = require('../middleware/validateRequest');

const router = express.Router();

router.use(authenticate);

router.get('/', getProfile);

router.post(
  '/',
  [
    body('age').optional({ nullable: true }).isInt({ min: 0, max: 130 }),
    body('weight').optional({ nullable: true }).isFloat({ min: 1 }),
    body('height').optional({ nullable: true }).isFloat({ min: 1 }),
    body('gender').optional({ nullable: true }).isIn(['male', 'female', 'other']),
    body('medical_history').optional({ nullable: true }).isString(),
  ],
  validateRequest,
  upsertProfile
);

router.put(
  '/',
  [
    body('age').optional({ nullable: true }).isInt({ min: 0, max: 130 }),
    body('weight').optional({ nullable: true }).isFloat({ min: 1 }),
    body('height').optional({ nullable: true }).isFloat({ min: 1 }),
    body('gender').optional({ nullable: true }).isIn(['male', 'female', 'other']),
    body('medical_history').optional({ nullable: true }).isString(),
  ],
  validateRequest,
  upsertProfile
);

router.delete('/', deleteProfile);

module.exports = router;
