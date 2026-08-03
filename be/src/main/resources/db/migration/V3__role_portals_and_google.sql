ALTER TABLE app_users
    ADD COLUMN IF NOT EXISTS google_subject VARCHAR(255);

ALTER TABLE app_users
    ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT FALSE;

CREATE UNIQUE INDEX IF NOT EXISTS uk_app_users_google_subject
    ON app_users (google_subject)
    WHERE google_subject IS NOT NULL;

UPDATE app_users
SET email_verified = TRUE
WHERE email IN ('admin@roomease.vn', 'manager@roomease.vn', 'user@roomease.vn');
