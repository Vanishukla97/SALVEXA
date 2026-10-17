USE salvexa;

ALTER TABLE hospitals
  ADD COLUMN IF NOT EXISTS speciality VARCHAR(255) NULL AFTER phone;

ALTER TABLE preferred_hospitals
  ADD COLUMN IF NOT EXISTS speciality VARCHAR(255) NULL AFTER phone;
