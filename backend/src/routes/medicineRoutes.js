const express = require('express');
const { listMedicines } = require('../controllers/medicineController');

const router = express.Router();
router.get('/', listMedicines);

module.exports = router;
