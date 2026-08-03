-- Run this file only when upgrading an existing RoomEase database.
ALTER TABLE public.app_users
    ADD COLUMN IF NOT EXISTS google_subject VARCHAR(255);

ALTER TABLE public.app_users
    ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT FALSE;

CREATE UNIQUE INDEX IF NOT EXISTS uk_app_users_google_subject
    ON public.app_users (google_subject)
    WHERE google_subject IS NOT NULL;

-- Existing password accounts remain valid. Demo accounts can be marked verified.
UPDATE public.app_users
SET email_verified = TRUE
WHERE email IN ('admin@roomease.vn', 'manager@roomease.vn', 'user@roomease.vn');
