-- Add assignedAttorneyId column to screenings table
ALTER TABLE screenings 
ADD COLUMN assigned_attorney_id UUID REFERENCES users(id) ON DELETE SET NULL;

-- Extend status enum to include new statuses
ALTER TABLE screenings 
ALTER COLUMN status TYPE TEXT;

-- Drop the old enum constraint if it exists
ALTER TABLE screenings 
DROP CONSTRAINT IF EXISTS screenings_status_check;

-- Add new constraint with extended statuses
ALTER TABLE screenings 
ADD CONSTRAINT screenings_status_check 
CHECK (status IN ('draft', 'submitted', 'reviewed', 'assigned', 'in_progress', 'awaiting_client', 'quoted', 'quote_accepted', 'quote_declined'));

-- Add index for faster queries on assigned attorney
CREATE INDEX idx_screenings_assigned_attorney ON screenings(assigned_attorney_id);
