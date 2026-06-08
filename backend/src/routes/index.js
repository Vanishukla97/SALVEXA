const express = require('express');
const authRoutes = require('./authRoutes');
const healthProfileRoutes = require('./healthProfileRoutes');
const symptomRoutes = require('./symptomRoutes');
const recommendationRoutes = require('./recommendationRoutes');
const prescriptionRoutes = require('./prescriptionRoutes');
const medicineRoutes = require('./medicineRoutes');
const notificationRoutes = require('./notificationRoutes');
const settingsRoutes = require('./settingsRoutes');

const router = express.Router();

router.get('/health', (_req, res) => {
  res.status(200).json({ success: true, message: 'Backend is running' });
});

router.use('/auth', authRoutes);
router.use('/profile', healthProfileRoutes);
router.use('/symptoms', symptomRoutes);
router.use('/recommendations', recommendationRoutes);
router.use('/prescriptions', prescriptionRoutes);
router.use('/medicines', medicineRoutes);
router.use('/notifications', notificationRoutes);
router.use('/settings', settingsRoutes);

module.exports = router;
