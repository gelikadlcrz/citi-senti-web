-- Apply to both CITI-Senti databases after the initial schema migration.
CREATE TYPE public.feedback_source AS ENUM (
    'citizen_submission',
    'research_corpus'
);

ALTER TABLE public.feedback_submissions
    ADD COLUMN source public.feedback_source NOT NULL DEFAULT 'citizen_submission',
    ALTER COLUMN storage_consent_at DROP NOT NULL,
    ALTER COLUMN consent_notice_version DROP NOT NULL,
    ALTER COLUMN access_code_hash DROP NOT NULL,
    ADD CONSTRAINT chk_feedback_source_credentials CHECK (
        (
            source = 'citizen_submission'
            AND storage_consent_at IS NOT NULL
            AND consent_notice_version IS NOT NULL
            AND access_code_hash IS NOT NULL
        ) OR (
            source = 'research_corpus'
            AND storage_consent_at IS NULL
            AND consent_notice_version IS NULL
            AND access_code_hash IS NULL
        )
    );
