-- Migration: Add safeguard fields to quote_requests table
-- Purpose: Track quote acceptance/rejection and allow controlled undo process

ALTER TABLE quote_requests 
ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS declined_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS rejection_request_reason TEXT,
ADD COLUMN IF NOT EXISTS rejection_requested_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS rejection_approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS rejection_approved_at TIMESTAMP;

-- Add index for rejection requests to help admin/attorney find pending requests
CREATE INDEX IF NOT EXISTS quote_requests_rejection_requested_idx ON quote_requests(rejection_requested_at) WHERE rejection_requested_at IS NOT NULL;
