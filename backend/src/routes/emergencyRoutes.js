const express = require('express');
const { body, query } = require('express-validator');
const {
  listNearbyHospitals,
  getEmergencyContext,
  triggerEmergency,
} = require('../controllers/emergencyController');
const { authenticate } = require('../middleware/authMiddleware');
const { validateRequest } = require('../middleware/validateRequest');

const router = express.Router();

router.use(authenticate);

router.get(
  '/hospitals',
  [query('lat').isFloat(), query('lng').isFloat()],
  validateRequest,
  listNearbyHospitals
);

router.get('/context', getEmergencyContext);

router.post(
  '/dispatch',
  [
    body('hospital').isObject().withMessage('hospital object is required'),
    body('hospital.name').optional({ nullable: true }).isString(),
    body('hospital.osm_id').optional({ nullable: true }).isString(),
    body('hospital.phone').optional({ nullable: true }).isString(),
    body('lat').optional({ nullable: true }).isFloat(),
    body('lng').optional({ nullable: true }).isFloat(),
  ],
  validateRequest,
  triggerEmergency
);

module.exports = router;
