const asyncHandler = require('../utils/asyncHandler');
const MedicineModel = require('../models/MedicineModel');

const listMedicines = asyncHandler(async (_req, res) => {
  const medicines = await MedicineModel.listMedicines();
  return res.status(200).json({
    success: true,
    data: medicines,
  });
});

module.exports = { listMedicines };
