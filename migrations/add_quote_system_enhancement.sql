-- Migration: Quote System Enhancement for Lead Protection Architecture
-- Description: Adds tables for quote line items, quote-bound messaging threads,
--              counteroffers, and lead unlock tracking. Also modifies quote_requests
--              and users tables to support anonymized quoting and contact protection.

-- ============================================================================
-- 1. CREATE quote_line_items TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS quote_line_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_request_id UUID NOT NULL REFERENCES quote_requests(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  amount REAL NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  fee_type TEXT NOT NULL DEFAULT 'flat_fee'
    CHECK (fee_type IN ('flat_fee', 'hourly', 'government_fee', 'filing_fee', 'consultation', 'retainer', 'other')),
  is_optional BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS quote_line_items_quote_request_idx ON quote_line_items(quote_request_id);

COMMENT ON TABLE quote_line_items IS 'Itemized line items for quote requests supporting multiple fee types';

-- ============================================================================
-- 2. CREATE quote_threads TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS quote_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_request_id UUID NOT NULL REFERENCES quote_requests(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  state TEXT NOT NULL DEFAULT 'open' CHECK (state IN ('open', 'closed', 'archived')),
  clarification_round INTEGER NOT NULL DEFAULT 1,
  attorney_questions_count INTEGER NOT NULL DEFAULT 0,
  client_questions_count INTEGER NOT NULL DEFAULT 0,
  max_questions_per_round INTEGER NOT NULL DEFAULT 3,
  closed_at TIMESTAMP,
  closed_reason TEXT CHECK (closed_reason IN ('quote_accepted', 'quote_declined', 'quote_expired', 'manually_closed', 'contact_unlocked')),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS quote_threads_quote_request_idx ON quote_threads(quote_request_id);
CREATE INDEX IF NOT EXISTS quote_threads_organization_idx ON quote_threads(organization_id);
CREATE INDEX IF NOT EXISTS quote_threads_state_idx ON quote_threads(state);

COMMENT ON TABLE quote_threads IS 'Quote-bound conversation threads with rate limiting per negotiation round';

-- ============================================================================
-- 3. CREATE quote_thread_messages TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS quote_thread_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES quote_threads(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sender_role TEXT NOT NULL CHECK (sender_role IN ('client', 'attorney', 'staff', 'system')),
  message_type TEXT NOT NULL DEFAULT 'general'
    CHECK (message_type IN ('clarification_question', 'clarification_response', 'counteroffer_message', 'general', 'system_notification')),
  content TEXT NOT NULL,
  original_content TEXT,
  pii_scrubbed BOOLEAN NOT NULL DEFAULT FALSE,
  pii_scrub_details JSONB,
  related_counteroffer_id UUID,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  clarification_round INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS quote_thread_messages_thread_idx ON quote_thread_messages(thread_id);
CREATE INDEX IF NOT EXISTS quote_thread_messages_sender_idx ON quote_thread_messages(sender_id);
CREATE INDEX IF NOT EXISTS quote_thread_messages_type_idx ON quote_thread_messages(message_type);
CREATE INDEX IF NOT EXISTS quote_thread_messages_unread_idx ON quote_thread_messages(thread_id, is_read) WHERE is_read = FALSE;

COMMENT ON TABLE quote_thread_messages IS 'Messages within quote threads with PII scrubbing and type categorization';

-- ============================================================================
-- 4. CREATE quote_counteroffers TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS quote_counteroffers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_request_id UUID NOT NULL REFERENCES quote_requests(id) ON DELETE CASCADE,
  thread_id UUID REFERENCES quote_threads(id) ON DELETE SET NULL,
  initiator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  initiator_role TEXT NOT NULL CHECK (initiator_role IN ('client', 'attorney')),
  proposed_amount REAL,
  proposed_line_items JSONB,
  scope_changes TEXT,
  scope_additions TEXT[],
  scope_removals TEXT[],
  reason TEXT,
  negotiation_round INTEGER NOT NULL DEFAULT 1,
  expires_at TIMESTAMP,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'rejected', 'withdrawn', 'expired', 'superseded')),
  responded_at TIMESTAMP,
  responded_by UUID REFERENCES users(id) ON DELETE SET NULL,
  response_note TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS quote_counteroffers_quote_request_idx ON quote_counteroffers(quote_request_id);
CREATE INDEX IF NOT EXISTS quote_counteroffers_thread_idx ON quote_counteroffers(thread_id);
CREATE INDEX IF NOT EXISTS quote_counteroffers_initiator_idx ON quote_counteroffers(initiator_id);
CREATE INDEX IF NOT EXISTS quote_counteroffers_status_idx ON quote_counteroffers(status);
CREATE INDEX IF NOT EXISTS quote_counteroffers_pending_idx ON quote_counteroffers(quote_request_id) WHERE status = 'pending';

COMMENT ON TABLE quote_counteroffers IS 'Counteroffer history for quote negotiation with scope and price changes';

-- ============================================================================
-- 5. CREATE lead_unlock_records TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS lead_unlock_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_request_id UUID NOT NULL REFERENCES quote_requests(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  attorney_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  unlock_method TEXT NOT NULL CHECK (unlock_method IN ('attorney_lead_fee', 'client_escrow', 'quote_accepted', 'admin_override')),
  lead_fee_amount REAL,
  escrow_amount REAL,
  payment_intent_id TEXT,
  payment_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (payment_status IN ('pending', 'processing', 'paid', 'failed', 'refunded', 'partially_refunded')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'unlocked', 'revoked', 'refunded')),
  unlocked_at TIMESTAMP,
  revoked_at TIMESTAMP,
  revoked_reason TEXT,
  escrow_released_at TIMESTAMP,
  escrow_released_to TEXT CHECK (escrow_released_to IN ('attorney', 'client', 'split')),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS lead_unlock_records_quote_request_idx ON lead_unlock_records(quote_request_id);
CREATE INDEX IF NOT EXISTS lead_unlock_records_organization_idx ON lead_unlock_records(organization_id);
CREATE INDEX IF NOT EXISTS lead_unlock_records_attorney_idx ON lead_unlock_records(attorney_id);
CREATE INDEX IF NOT EXISTS lead_unlock_records_client_idx ON lead_unlock_records(client_id);
CREATE INDEX IF NOT EXISTS lead_unlock_records_status_idx ON lead_unlock_records(status);
CREATE INDEX IF NOT EXISTS lead_unlock_records_payment_status_idx ON lead_unlock_records(payment_status);

-- Unique constraint: one unlock record per quote-attorney pair
CREATE UNIQUE INDEX IF NOT EXISTS lead_unlock_records_quote_attorney_unique ON lead_unlock_records(quote_request_id, attorney_id);

COMMENT ON TABLE lead_unlock_records IS 'Tracks lead fee payments and contact information unlock status';

-- ============================================================================
-- 6. ALTER quote_requests - Add lead protection and negotiation fields
-- ============================================================================
ALTER TABLE quote_requests
ADD COLUMN IF NOT EXISTS is_contact_unlocked BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS unlock_method TEXT CHECK (unlock_method IN ('attorney_lead_fee', 'client_escrow', 'quote_accepted', 'admin_override')),
ADD COLUMN IF NOT EXISTS unlock_record_id UUID,
ADD COLUMN IF NOT EXISTS negotiation_round_count INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS current_counteroffer_id UUID,
ADD COLUMN IF NOT EXISTS total_amount REAL,
ADD COLUMN IF NOT EXISTS has_line_items BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS quote_requests_contact_unlocked_idx ON quote_requests(is_contact_unlocked);

COMMENT ON COLUMN quote_requests.is_contact_unlocked IS 'Whether client contact info has been revealed to attorney';
COMMENT ON COLUMN quote_requests.negotiation_round_count IS 'Number of counteroffer rounds for this quote';

-- ============================================================================
-- 7. ADD FK constraints (after all tables exist)
-- ============================================================================
-- FK from quote_thread_messages to quote_counteroffers
ALTER TABLE quote_thread_messages
DROP CONSTRAINT IF EXISTS quote_thread_messages_counteroffer_fk;

ALTER TABLE quote_thread_messages
ADD CONSTRAINT quote_thread_messages_counteroffer_fk
FOREIGN KEY (related_counteroffer_id) REFERENCES quote_counteroffers(id) ON DELETE SET NULL;

-- FK from quote_requests to lead_unlock_records
ALTER TABLE quote_requests
DROP CONSTRAINT IF EXISTS quote_requests_unlock_record_fk;

ALTER TABLE quote_requests
ADD CONSTRAINT quote_requests_unlock_record_fk
FOREIGN KEY (unlock_record_id) REFERENCES lead_unlock_records(id) ON DELETE SET NULL;

-- FK from quote_requests to quote_counteroffers
ALTER TABLE quote_requests
DROP CONSTRAINT IF EXISTS quote_requests_current_counteroffer_fk;

ALTER TABLE quote_requests
ADD CONSTRAINT quote_requests_current_counteroffer_fk
FOREIGN KEY (current_counteroffer_id) REFERENCES quote_counteroffers(id) ON DELETE SET NULL;

-- ============================================================================
-- 8. ALTER users - Add anonymized display name for client privacy
-- ============================================================================
ALTER TABLE users
ADD COLUMN IF NOT EXISTS anonymized_display_name TEXT;

COMMENT ON COLUMN users.anonymized_display_name IS 'Anonymous identifier shown to attorneys before contact unlock';

-- ============================================================================
-- 9. CREATE trigger for auto-generating anonymized names
-- ============================================================================
CREATE OR REPLACE FUNCTION generate_anonymized_name()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role = 'client' AND NEW.anonymized_display_name IS NULL THEN
    NEW.anonymized_display_name := 'Client #' || UPPER(SUBSTRING(NEW.id::text, 1, 4));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS users_anonymized_name_trigger ON users;
CREATE TRIGGER users_anonymized_name_trigger
BEFORE INSERT ON users
FOR EACH ROW
EXECUTE FUNCTION generate_anonymized_name();

-- ============================================================================
-- 10. DATA MIGRATION - Update existing data
-- ============================================================================
-- Generate anonymized names for existing clients
UPDATE users
SET anonymized_display_name = 'Client #' || UPPER(SUBSTRING(id::text, 1, 4))
WHERE role = 'client' AND anonymized_display_name IS NULL;

-- Set is_contact_unlocked = TRUE for existing accepted quotes
UPDATE quote_requests
SET is_contact_unlocked = TRUE, unlock_method = 'quote_accepted'
WHERE status = 'accepted' AND is_contact_unlocked = FALSE;
