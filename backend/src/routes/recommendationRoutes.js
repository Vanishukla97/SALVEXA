const express = require('express');
const { body } = require('express-validator');
const {
  generateRecommendations,
  listRecommendationHistory,
  getRecommendationById,
} = require('../controllers/recommendationController');
const { authenticate } = require('../middleware/authMiddleware');
const { validateRequest } = require('../middleware/validateRequest');

const router = express.Router();
router.use(authenticate);

router.get('/', listRecommendationHistory);
router.get('/:id', getRecommendationById);

router.post(
  '/generate',
  [body('symptomRecordId').isInt({ min: 1 }).withMessage('Valid symptomRecordId is required')],
  validateRequest,
  generateRecommendations
);

module.exports = router;
