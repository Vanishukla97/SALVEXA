function checkAgeRestrictions(medicine, age) {
  if (!medicine || age == null) return [];
  const warnings = [];
  if (medicine.min_age && age < medicine.min_age) {
    warnings.push(`${medicine.name} is not recommended below age ${medicine.min_age}.`);
  }
  if (medicine.max_age && age > medicine.max_age) {
    warnings.push(`${medicine.name} should be used with caution above age ${medicine.max_age}.`);
  }
  return warnings;
}

function checkAllergy(allergies, medicine) {
  if (!medicine || !allergies?.length) return [];
  const normalizedAllergies = allergies.map((a) => a.toLowerCase());
  const tags = (medicine.allergy_tags || '')
    .split(',')
    .map((v) => v.trim().toLowerCase())
    .filter(Boolean);

  const matched = tags.filter((tag) => normalizedAllergies.includes(tag));
  if (!matched.length) return [];
  return [`Allergy risk detected: matched tags (${matched.join(', ')}).`];
}

function checkDrugInteractions(currentMedicines, medicine) {
  if (!medicine || !currentMedicines?.length) return [];
  let interactionsMap = {};
  if (medicine.interactions) {
    if (typeof medicine.interactions === 'string') {
      try {
        interactionsMap = JSON.parse(medicine.interactions);
      } catch (error) {
        interactionsMap = {};
      }
    } else if (typeof medicine.interactions === 'object') {
      interactionsMap = medicine.interactions;
    }
  }

  const warnings = [];
  for (const currentMedicine of currentMedicines) {
    const key = String(currentMedicine).toLowerCase();
    if (interactionsMap[key]) {
      warnings.push(`Interaction with ${currentMedicine}: ${interactionsMap[key]}`);
    }
  }
  return warnings;
}

function runSafetyChecks({ medicine, profile }) {
  const allergies = profile?.allergies || [];
  const currentMedicines = profile?.current_medicines || [];
  const age = profile?.age ?? null;

  const warnings = [
    ...checkAgeRestrictions(medicine, age),
    ...checkAllergy(allergies, medicine),
    ...checkDrugInteractions(currentMedicines, medicine),
  ];

  return {
    isSafe: warnings.length === 0,
    warnings,
  };
}

module.exports = { runSafetyChecks };
