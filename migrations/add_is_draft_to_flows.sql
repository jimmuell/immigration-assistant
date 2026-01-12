-- Add isDraft column to flows table to support draft flows for organization admins
ALTER TABLE flows ADD COLUMN IF NOT EXISTS "is_draft" BOOLEAN DEFAULT true NOT NULL;

-- Set existing flows to not be drafts (they're already active/inactive)
UPDATE flows SET "is_draft" = false WHERE "is_draft" IS NULL;
