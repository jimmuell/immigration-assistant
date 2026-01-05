-- Add is_test_mode column to screenings table
ALTER TABLE screenings 
ADD COLUMN IF NOT EXISTS is_test_mode BOOLEAN DEFAULT FALSE NOT NULL;

-- Add index for test mode filtering
CREATE INDEX IF NOT EXISTS idx_screenings_is_test_mode ON screenings(is_test_mode);

-- Add comment to explain the column
COMMENT ON COLUMN screenings.is_test_mode IS 'Flag to indicate if this screening is a test/demo submission (for admin/staff testing purposes)';

