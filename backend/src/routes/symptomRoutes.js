const express = require('express');
const { body } = require('express-validator');
const {
  createSymptom,
  listSymptoms,
  getSymptomById,
  updateSymptom,
  deleteSymptom,
} = require('../controllers/symptomController');
const { authenticate } = require('../middleware/authMiddleware');
const { validateRequest } = require('../middleware/validateRequest');

const router = express.Router();

router.use(authenticate);

router.get('/', listSymptoms);
router.get('/:id', getSymptomById);

router.post(
  '/',
  [
    body('symptoms').notEmpty().withMessage('symptoms are required'),
    body('symptom_text').optional({ nullable: true }).isString(),
    body('duration').optional({ nullable: true }).isString(),
    body('severity').optional({ nullable: true }).isInt({ min: 1, max: 10 }),
    body('frequency').optional({ nullable: true }).isString(),
  ],
  validateRequest,
  createSymptom
);

router.put(
  '/:id',
  [
    body('symptoms').notEmpty().withMessage('symptoms are required'),
    body('symptom_text').optional({ nullable: true }).isString(),
    body('duration').optional({ nullable: true }).isString(),
    body('severity').optional({ nullable: true }).isInt({ min: 1, max: 10 }),
    body('frequency').optional({ nullable: true }).isString(),
  ],
  validateRequest,
  updateSymptom
);

router.delete('/:id', deleteSymptom);

module.exports = router;
