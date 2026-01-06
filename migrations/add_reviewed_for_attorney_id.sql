-- Add reviewed_for_attorney_id field to screenings table
-- This field is used for staff pre-screening (gatekeeper mode)
-- When staff "assigns" a screening for review, it appears in that attorney's new screenings page
-- This is separate from assignedAttorneyId which is used when a quote is accepted

ALTER TABLE screenings 
ADD COLUMN reviewed_for_attorney_id UUID REFERENCES users(id) ON DELETE SET NULL;

-- Add index for performance
CREATE INDEX screenings_reviewed_for_attorney_idx ON screenings(reviewed_for_attorney_id);

-- Add comment to explain the field
COMMENT ON COLUMN screenings.reviewed_for_attorney_id IS 
'Staff gatekeeper assignment - makes screening visible to specific attorney for quote review. Different from assignedAttorneyId which is for accepted quotes/cases.';

