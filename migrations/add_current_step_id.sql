-- Add currentStepId column to screenings table to track where user left off
ALTER TABLE screenings ADD COLUMN current_step_id TEXT;
