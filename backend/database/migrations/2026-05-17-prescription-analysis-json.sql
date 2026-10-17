ALTER TABLE prescriptions
  ADD COLUMN IF NOT EXISTS analysis_json JSON NULL AFTER extracted_medicines;
