import { pgTable, text, timestamp, boolean, uuid, jsonb, integer, real, index, unique } from 'drizzle-orm/pg-core';

// Organizations table for multi-tenancy
export const organizations = pgTable('organizations', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  displayName: text('display_name'), // User-friendly name for UI display
  type: text('type', { enum: ['law_firm', 'solo_attorney', 'non_legal', 'other'] }).notNull().default('other'),
  website: text('website'), // Firm's website URL
  domainKey: text('domain_key').unique(), // Normalized domain for matching (e.g., "smithlaw.com")
  alternativeDomains: text('alternative_domains').array(), // For firms with multiple domains
  contactEmail: text('contact_email'),
  contactPhone: text('contact_phone'),
  address: text('address'),
  requireStaffPreScreening: boolean('require_staff_prescreening').default(false).notNull(), // If true, staff must assign screenings before attorneys see them
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  domainKeyIdx: index('organizations_domain_key_idx').on(table.domainKey),
}));

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id').references(() => organizations.id, { onDelete: 'cascade' }), // Nullable: null for clients until quote acceptance
  email: text('email').notNull().unique(),
  emailVerified: timestamp('email_verified'),
  name: text('name'),
  password: text('password').notNull(),
  image: text('image'),
  role: text('role', { enum: ['client', 'attorney', 'org_admin', 'staff', 'super_admin'] }).notNull().default('client'),
  anonymizedDisplayName: text('anonymized_display_name'), // Anonymous identifier shown to attorneys before contact unlock (e.g., "Client #A7B3")
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  organizationIdx: index('users_organization_idx').on(table.organizationId),
  roleIdx: index('users_role_idx').on(table.role),
}));

export const conversations = pgTable('conversations', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: text('title').default('New Conversation').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  organizationIdx: index('conversations_organization_idx').on(table.organizationId),
}));

export const messages = pgTable('messages', {
  id: uuid('id').defaultRandom().primaryKey(),
  conversationId: uuid('conversation_id').notNull().references(() => conversations.id, { onDelete: 'cascade' }),
  role: text('role').notNull(), // 'user' or 'assistant'
  content: text('content').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const flows = pgTable('flows', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id').references(() => organizations.id, { onDelete: 'cascade' }), // Nullable: null = global flow (super admin), set = org-specific flow
  name: text('name').notNull(),
  description: text('description'),
  content: text('content').notNull(),
  isActive: boolean('is_active').default(false).notNull(),
  isDraft: boolean('is_draft').default(true).notNull(), // Draft flows can be edited, published flows are locked unless super admin
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  organizationIdx: index('flows_organization_idx').on(table.organizationId),
}));

export const screenings = pgTable('screenings', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  assignedAttorneyId: uuid('assigned_attorney_id').references(() => users.id, { onDelete: 'set null' }),
  reviewedForAttorneyId: uuid('reviewed_for_attorney_id').references(() => users.id, { onDelete: 'set null' }), // Staff gatekeeper assignment
  flowId: uuid('flow_id').references(() => flows.id, { onDelete: 'set null' }),
  flowName: text('flow_name').notNull(),
  submissionId: text('submission_id').notNull(),
  responses: text('responses').notNull(), // JSON string of Q&A
  currentStepId: text('current_step_id'), // Track which step user is on for resuming
  status: text('status', { enum: ['draft', 'submitted', 'reviewed', 'assigned', 'in_progress', 'awaiting_client', 'quoted', 'quote_accepted', 'quote_declined'] }).notNull().default('submitted'),
  isTestMode: boolean('is_test_mode').default(false).notNull(), // Flag for test/demo screenings
  isLocked: boolean('is_locked').default(false).notNull(), // Lock from editing after submission
  submittedForReviewAt: timestamp('submitted_for_review_at'), // Track when submitted for attorney review
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  organizationIdx: index('screenings_organization_idx').on(table.organizationId),
}));

export const formNodes = pgTable('form_nodes', {
  id: uuid('id').defaultRandom().primaryKey(),
  flowId: uuid('flow_id').notNull().references(() => flows.id, { onDelete: 'cascade' }),
  nodeId: text('node_id').notNull(), // ReactFlow node ID
  type: text('type').notNull(), // start, end, yes-no, multiple-choice, text, date, form, info, completion, success, subflow
  data: jsonb('data').notNull(), // Node-specific data (question, options, validations, etc.)
  position: jsonb('position').notNull(), // {x: number, y: number}
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const formEdges = pgTable('form_edges', {
  id: uuid('id').defaultRandom().primaryKey(),
  flowId: uuid('flow_id').notNull().references(() => flows.id, { onDelete: 'cascade' }),
  edgeId: text('edge_id').notNull(), // ReactFlow edge ID
  source: text('source').notNull(), // Source node ID
  target: text('target').notNull(), // Target node ID
  sourceHandle: text('source_handle'), // For conditional edges
  targetHandle: text('target_handle'),
  data: jsonb('data'), // Edge-specific data (conditions, labels, etc.)
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const attorneyClientMessages = pgTable('attorney_client_messages', {
  id: uuid('id').defaultRandom().primaryKey(),
  screeningId: uuid('screening_id').notNull().references(() => screenings.id, { onDelete: 'cascade' }),
  senderId: uuid('sender_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  receiverId: uuid('receiver_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  isRead: boolean('is_read').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const screeningDocuments = pgTable('screening_documents', {
  id: uuid('id').defaultRandom().primaryKey(),
  screeningId: uuid('screening_id').notNull().references(() => screenings.id, { onDelete: 'cascade' }),
  uploadedBy: uuid('uploaded_by').notNull().references(() => users.id, { onDelete: 'cascade' }),
  fileName: text('file_name').notNull(),
  fileType: text('file_type').notNull(), // MIME type
  fileSize: integer('file_size').notNull(), // bytes
  fileUrl: text('file_url').notNull(), // Storage URL
  documentType: text('document_type'), // e.g., 'passport', 'birth_certificate', 'other'
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const quoteRequests = pgTable('quote_requests', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  screeningId: uuid('screening_id').notNull().references(() => screenings.id, { onDelete: 'cascade' }),
  attorneyId: uuid('attorney_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  amount: real('amount').notNull(), // Quote amount in USD (legacy single-amount field)
  currency: text('currency').default('USD').notNull(),
  description: text('description'), // Services included
  notes: text('notes'), // Internal attorney notes
  expiresAt: timestamp('expires_at'), // Quote expiration date
  status: text('status', { enum: ['pending', 'accepted', 'declined', 'expired'] }).notNull().default('pending'),
  acceptedAt: timestamp('accepted_at'), // When quote was accepted
  declinedAt: timestamp('declined_at'), // When quote was declined
  rejectionRequestReason: text('rejection_request_reason'), // Client's reason for wanting to undo acceptance
  rejectionRequestedAt: timestamp('rejection_requested_at'), // When client requested to undo acceptance
  rejectionApprovedBy: uuid('rejection_approved_by').references(() => users.id, { onDelete: 'set null' }), // Attorney/admin who approved rejection
  rejectionApprovedAt: timestamp('rejection_approved_at'), // When rejection was approved
  // Lead protection fields
  isContactUnlocked: boolean('is_contact_unlocked').default(false).notNull(), // Whether client contact info has been revealed to attorney
  unlockMethod: text('unlock_method', { enum: ['attorney_lead_fee', 'client_escrow', 'quote_accepted', 'admin_override'] }), // How contact was unlocked
  unlockRecordId: uuid('unlock_record_id'), // FK to lead_unlock_records (added via migration)
  // Negotiation tracking
  negotiationRoundCount: integer('negotiation_round_count').default(0).notNull(), // Number of counteroffer rounds
  currentCounterofferId: uuid('current_counteroffer_id'), // Active counteroffer (added via migration)
  // Line items support
  totalAmount: real('total_amount'), // Computed from line items (denormalized for query performance)
  hasLineItems: boolean('has_line_items').default(false).notNull(), // Quick check for itemized vs single amount
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  organizationIdx: index('quote_requests_organization_idx').on(table.organizationId),
  contactUnlockedIdx: index('quote_requests_contact_unlocked_idx').on(table.isContactUnlocked),
}));

// Attorney profiles table - enhanced professional information
export const attorneyProfiles = pgTable('attorney_profiles', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().unique().references(() => users.id, { onDelete: 'cascade' }),
  organizationId: uuid('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  bio: text('bio'),
  specialties: text('specialties').array(), // Array of practice areas
  yearsOfExperience: integer('years_of_experience'),
  barNumber: text('bar_number'),
  barState: text('bar_state'),
  rating: real('rating').default(0).notNull(), // Average rating 0-5
  ratingCount: integer('rating_count').default(0).notNull(), // Number of ratings received
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  organizationIdx: index('attorney_profiles_organization_idx').on(table.organizationId),
  userIdx: index('attorney_profiles_user_idx').on(table.userId),
}));

// Attorney ratings table - client feedback
export const attorneyRatings = pgTable('attorney_ratings', {
  id: uuid('id').defaultRandom().primaryKey(),
  attorneyId: uuid('attorney_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  clientId: uuid('client_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  screeningId: uuid('screening_id').references(() => screenings.id, { onDelete: 'set null' }),
  rating: integer('rating').notNull(), // 1-5 stars
  reviewText: text('review_text'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  attorneyIdx: index('attorney_ratings_attorney_idx').on(table.attorneyId),
  clientIdx: index('attorney_ratings_client_idx').on(table.clientId),
}));

export const notificationStates = pgTable('notification_states', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  notificationId: text('notification_id').notNull(), // Composite ID like "quote-{screeningId}"
  isRead: boolean('is_read').notNull().default(false),
  isDismissed: boolean('is_dismissed').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  userIdx: index('notification_states_user_idx').on(table.userId),
  userDismissedIdx: index('notification_states_user_dismissed_idx').on(table.userId, table.isDismissed),
  uniqueUserNotification: index('notification_states_user_notification_unique').on(table.userId, table.notificationId),
}));

export const screeningViews = pgTable('screening_views', {
  id: uuid('id').defaultRandom().primaryKey(),
  screeningId: uuid('screening_id').notNull().references(() => screenings.id, { onDelete: 'cascade' }),
  attorneyId: uuid('attorney_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  viewedAt: timestamp('viewed_at').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  attorneyIdx: index('screening_views_attorney_idx').on(table.attorneyId),
  screeningIdx: index('screening_views_screening_idx').on(table.screeningId),
  uniqueScreeningAttorney: unique('screening_views_screening_attorney_unique').on(table.screeningId, table.attorneyId),
}));

// ============================================================================
// QUOTE SYSTEM ENHANCEMENT TABLES
// ============================================================================

// Quote Line Items - Itemized quote breakdown
export const quoteLineItems = pgTable('quote_line_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  quoteRequestId: uuid('quote_request_id').notNull().references(() => quoteRequests.id, { onDelete: 'cascade' }),
  description: text('description').notNull(),
  amount: real('amount').notNull(),
  quantity: integer('quantity').default(1).notNull(),
  feeType: text('fee_type', {
    enum: ['flat_fee', 'hourly', 'government_fee', 'filing_fee', 'consultation', 'retainer', 'other']
  }).notNull().default('flat_fee'),
  isOptional: boolean('is_optional').default(false).notNull(), // Client can opt-out of optional items
  sortOrder: integer('sort_order').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  quoteRequestIdx: index('quote_line_items_quote_request_idx').on(table.quoteRequestId),
}));

// Quote Threads - Quote-bound conversations with rate limiting
export const quoteThreads = pgTable('quote_threads', {
  id: uuid('id').defaultRandom().primaryKey(),
  quoteRequestId: uuid('quote_request_id').notNull().references(() => quoteRequests.id, { onDelete: 'cascade' }),
  organizationId: uuid('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  state: text('state', { enum: ['open', 'closed', 'archived'] }).notNull().default('open'),
  clarificationRound: integer('clarification_round').default(1).notNull(), // Current negotiation round
  attorneyQuestionsCount: integer('attorney_questions_count').default(0).notNull(), // Rate limit tracking
  clientQuestionsCount: integer('client_questions_count').default(0).notNull(), // Rate limit tracking
  maxQuestionsPerRound: integer('max_questions_per_round').default(3).notNull(), // Configurable limit
  closedAt: timestamp('closed_at'),
  closedReason: text('closed_reason', {
    enum: ['quote_accepted', 'quote_declined', 'quote_expired', 'manually_closed', 'contact_unlocked']
  }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  quoteRequestIdx: index('quote_threads_quote_request_idx').on(table.quoteRequestId),
  organizationIdx: index('quote_threads_organization_idx').on(table.organizationId),
  stateIdx: index('quote_threads_state_idx').on(table.state),
}));

// Quote Thread Messages - PII-scrubbed messages within threads
export const quoteThreadMessages = pgTable('quote_thread_messages', {
  id: uuid('id').defaultRandom().primaryKey(),
  threadId: uuid('thread_id').notNull().references(() => quoteThreads.id, { onDelete: 'cascade' }),
  senderId: uuid('sender_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  senderRole: text('sender_role', { enum: ['client', 'attorney', 'staff', 'system'] }).notNull(),
  messageType: text('message_type', {
    enum: ['clarification_question', 'clarification_response', 'counteroffer_message', 'general', 'system_notification']
  }).notNull().default('general'),
  content: text('content').notNull(), // Scrubbed message content
  originalContent: text('original_content'), // Pre-scrub content for audit/compliance
  piiScrubbed: boolean('pii_scrubbed').default(false).notNull(), // Was PII detected and removed
  piiScrubDetails: jsonb('pii_scrub_details'), // Details of what was scrubbed { detected: [...], replaced: [...] }
  relatedCounterofferId: uuid('related_counteroffer_id'), // Links to counteroffer if message type is counteroffer_message
  isRead: boolean('is_read').default(false).notNull(),
  clarificationRound: integer('clarification_round').default(1).notNull(), // Which round this message belongs to
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  threadIdx: index('quote_thread_messages_thread_idx').on(table.threadId),
  senderIdx: index('quote_thread_messages_sender_idx').on(table.senderId),
  typeIdx: index('quote_thread_messages_type_idx').on(table.messageType),
  unreadIdx: index('quote_thread_messages_unread_idx').on(table.threadId, table.isRead),
}));

// Quote Counteroffers - Negotiation tracking
export const quoteCounterOffers = pgTable('quote_counteroffers', {
  id: uuid('id').defaultRandom().primaryKey(),
  quoteRequestId: uuid('quote_request_id').notNull().references(() => quoteRequests.id, { onDelete: 'cascade' }),
  threadId: uuid('thread_id').references(() => quoteThreads.id, { onDelete: 'set null' }),
  initiatorId: uuid('initiator_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  initiatorRole: text('initiator_role', { enum: ['client', 'attorney'] }).notNull(),
  // Pricing changes
  proposedAmount: real('proposed_amount'), // New total (if changing amount)
  proposedLineItems: jsonb('proposed_line_items'), // Array of {description, amount, quantity, feeType} for detailed changes
  // Scope changes
  scopeChanges: text('scope_changes'), // Description of scope modifications
  scopeAdditions: text('scope_additions').array(), // Services to add
  scopeRemovals: text('scope_removals').array(), // Services to remove
  // Negotiation context
  reason: text('reason'), // Why this counteroffer is being made
  negotiationRound: integer('negotiation_round').default(1).notNull(),
  expiresAt: timestamp('expires_at'), // Counteroffer expiration
  // Status tracking
  status: text('status', {
    enum: ['pending', 'accepted', 'rejected', 'withdrawn', 'expired', 'superseded']
  }).notNull().default('pending'),
  respondedAt: timestamp('responded_at'),
  respondedBy: uuid('responded_by').references(() => users.id, { onDelete: 'set null' }),
  responseNote: text('response_note'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  quoteRequestIdx: index('quote_counteroffers_quote_request_idx').on(table.quoteRequestId),
  threadIdx: index('quote_counteroffers_thread_idx').on(table.threadId),
  initiatorIdx: index('quote_counteroffers_initiator_idx').on(table.initiatorId),
  statusIdx: index('quote_counteroffers_status_idx').on(table.status),
}));

// Lead Unlock Records - Lead fee and contact unlock tracking
export const leadUnlockRecords = pgTable('lead_unlock_records', {
  id: uuid('id').defaultRandom().primaryKey(),
  quoteRequestId: uuid('quote_request_id').notNull().references(() => quoteRequests.id, { onDelete: 'cascade' }),
  organizationId: uuid('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  attorneyId: uuid('attorney_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  clientId: uuid('client_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  // Unlock method
  unlockMethod: text('unlock_method', {
    enum: ['attorney_lead_fee', 'client_escrow', 'quote_accepted', 'admin_override']
  }).notNull(),
  // Payment tracking
  leadFeeAmount: real('lead_fee_amount'), // Amount paid for lead (if attorney_lead_fee)
  escrowAmount: real('escrow_amount'), // Amount held in escrow (if client_escrow)
  paymentIntentId: text('payment_intent_id'), // Stripe/payment provider ID for future integration
  paymentStatus: text('payment_status', {
    enum: ['pending', 'processing', 'paid', 'failed', 'refunded', 'partially_refunded']
  }).notNull().default('pending'),
  // Unlock state
  status: text('status', {
    enum: ['pending', 'unlocked', 'revoked', 'refunded']
  }).notNull().default('pending'),
  unlockedAt: timestamp('unlocked_at'),
  revokedAt: timestamp('revoked_at'),
  revokedReason: text('revoked_reason'),
  // Escrow management
  escrowReleasedAt: timestamp('escrow_released_at'),
  escrowReleasedTo: text('escrow_released_to', { enum: ['attorney', 'client', 'split'] }),
  // Audit
  createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  quoteRequestIdx: index('lead_unlock_records_quote_request_idx').on(table.quoteRequestId),
  organizationIdx: index('lead_unlock_records_organization_idx').on(table.organizationId),
  attorneyIdx: index('lead_unlock_records_attorney_idx').on(table.attorneyId),
  clientIdx: index('lead_unlock_records_client_idx').on(table.clientId),
  statusIdx: index('lead_unlock_records_status_idx').on(table.status),
  paymentStatusIdx: index('lead_unlock_records_payment_status_idx').on(table.paymentStatus),
  uniqueQuoteAttorney: unique('lead_unlock_records_quote_attorney_unique').on(table.quoteRequestId, table.attorneyId),
}));

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type Organization = typeof organizations.$inferSelect;
export type NewOrganization = typeof organizations.$inferInsert;
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Conversation = typeof conversations.$inferSelect;
export type NewConversation = typeof conversations.$inferInsert;
export type Message = typeof messages.$inferSelect;
export type NewMessage = typeof messages.$inferInsert;
export type Flow = typeof flows.$inferSelect;
export type NewFlow = typeof flows.$inferInsert;
export type Screening = typeof screenings.$inferSelect;
export type NewScreening = typeof screenings.$inferInsert;
export type FormNode = typeof formNodes.$inferSelect;
export type NewFormNode = typeof formNodes.$inferInsert;
export type FormEdge = typeof formEdges.$inferSelect;
export type NewFormEdge = typeof formEdges.$inferInsert;
export type AttorneyClientMessage = typeof attorneyClientMessages.$inferSelect;
export type NewAttorneyClientMessage = typeof attorneyClientMessages.$inferInsert;
export type ScreeningDocument = typeof screeningDocuments.$inferSelect;
export type NewScreeningDocument = typeof screeningDocuments.$inferInsert;
export type QuoteRequest = typeof quoteRequests.$inferSelect;
export type NewQuoteRequest = typeof quoteRequests.$inferInsert;
export type NotificationState = typeof notificationStates.$inferSelect;
export type NewNotificationState = typeof notificationStates.$inferInsert;
export type AttorneyProfile = typeof attorneyProfiles.$inferSelect;
export type NewAttorneyProfile = typeof attorneyProfiles.$inferInsert;
export type AttorneyRating = typeof attorneyRatings.$inferSelect;
export type NewAttorneyRating = typeof attorneyRatings.$inferInsert;
export type ScreeningView = typeof screeningViews.$inferSelect;
export type NewScreeningView = typeof screeningViews.$inferInsert;

// Quote System Enhancement Types
export type QuoteLineItem = typeof quoteLineItems.$inferSelect;
export type NewQuoteLineItem = typeof quoteLineItems.$inferInsert;
export type QuoteThread = typeof quoteThreads.$inferSelect;
export type NewQuoteThread = typeof quoteThreads.$inferInsert;
export type QuoteThreadMessage = typeof quoteThreadMessages.$inferSelect;
export type NewQuoteThreadMessage = typeof quoteThreadMessages.$inferInsert;
export type QuoteCounterOffer = typeof quoteCounterOffers.$inferSelect;
export type NewQuoteCounterOffer = typeof quoteCounterOffers.$inferInsert;
export type LeadUnlockRecord = typeof leadUnlockRecords.$inferSelect;
export type NewLeadUnlockRecord = typeof leadUnlockRecords.$inferInsert;