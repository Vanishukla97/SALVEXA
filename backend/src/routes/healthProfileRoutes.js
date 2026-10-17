const express = require('express');
const { body } = require('express-validator');
const {
  upsertProfile,
  getProfile,
  deleteProfile,
  uploadAvatar,
  clearMedicalHistory,
} = require('../controllers/healthProfileController');
const { authenticate } = require('../middleware/authMiddleware');
const { validateRequest } = require('../middleware/validateRequest');
const { upload } = require('../middleware/uploadMiddleware');

const router = express.Router();

const profileValidators = [
  body('age').optional({ nullable: true }).isInt({ min: 0, max: 130 }),
  body('weight').optional({ nullable: true }).isFloat({ min: 1 }),
  body('height').optional({ nullable: true }).isFloat({ min: 1 }),
  body('gender').optional({ nullable: true }).isIn(['male', 'female', 'other']),
  body('blood_group').optional({ nullable: true }).isString().isLength({ max: 8 }),
  body('medical_history').optional({ nullable: true }).isString(),
  body('past_surgeries').optional({ nullable: true }).isString(),
  body('guardian_name').optional({ nullable: true }).isString().isLength({ max: 120 }),
  body('guardian_relation').optional({ nullable: true }).isString().isLength({ max: 60 }),
  body('guardian_phone').optional({ nullable: true }).isString().isLength({ max: 32 }),
  body('preferred_hospitals').optional({ nullable: true }).isArray(),
];

router.use(authenticate);

router.get('/', getProfile);

router.post('/', profileValidators, validateRequest, upsertProfile);

router.put('/', profileValidators, validateRequest, upsertProfile);

router.delete('/', deleteProfile);

router.post('/avatar', upload.single('avatar'), uploadAvatar);

router.delete('/medical-history', clearMedicalHistory);

module.exports = router;
