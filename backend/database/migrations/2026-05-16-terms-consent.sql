USE salvexa;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS terms_accepted_at DATETIME NULL AFTER password_hash,
  ADD COLUMN IF NOT EXISTS terms_version VARCHAR(32) NULL AFTER terms_accepted_at;

