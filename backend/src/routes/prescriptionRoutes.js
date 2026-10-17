const express = require('express');
const { authenticate } = require('../middleware/authMiddleware');
const { upload } = require('../middleware/uploadMiddleware');
const {
  scanPrescription,
  listPrescriptions,
  getPrescriptionById,
} = require('../controllers/prescriptionController');

const router = express.Router();
router.use(authenticate);

router.get('/', listPrescriptions);
router.get('/:id', getPrescriptionById);
router.post('/scan', upload.single('image'), scanPrescription);

module.exports = router;
