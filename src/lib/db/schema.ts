import { pgTable, text, timestamp, boolean, uuid, jsonb, integer, real, index } from 'drizzle-orm/pg-core';

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
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  domainKeyIdx: index('organizations_domain_key_idx').on(table.domainKey),
}));

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  email: text('email').notNull().unique(),
  emailVerified: timestamp('email_verified'),
  name: text('name'),
  password: text('password').notNull(),
  image: text('image'),
  role: text('role', { enum: ['client', 'attorney', 'org_admin', 'staff', 'super_admin'] }).notNull().default('client'),
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
  organizationId: uuid('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description'),
  content: text('content').notNull(),
  isActive: boolean('is_active').default(false).notNull(),
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
  flowId: uuid('flow_id').references(() => flows.id, { onDelete: 'set null' }),
  flowName: text('flow_name').notNull(),
  submissionId: text('submission_id').notNull(),
  responses: text('responses').notNull(), // JSON string of Q&A
  currentStepId: text('current_step_id'), // Track which step user is on for resuming
  status: text('status', { enum: ['draft', 'submitted', 'reviewed', 'assigned', 'in_progress', 'awaiting_client', 'quoted', 'quote_accepted', 'quote_declined'] }).notNull().default('submitted'),
  isTestMode: boolean('is_test_mode').default(false).notNull(), // Flag for test/demo screenings
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
  amount: real('amount').notNull(), // Quote amount in USD
  currency: text('currency').default('USD').notNull(),
  description: text('description'), // Services included
  notes: text('notes'), // Internal attorney notes
  expiresAt: timestamp('expires_at'), // Quote expiration date
  status: text('status', { enum: ['pending', 'accepted', 'declined', 'expired'] }).notNull().default('pending'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  organizationIdx: index('quote_requests_organization_idx').on(table.organizationId),
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
export type AttorneyProfile = typeof attorneyProfiles.$inferSelect;
export type NewAttorneyProfile = typeof attorneyProfiles.$inferInsert;
export type AttorneyRating = typeof attorneyRatings.$inferSelect;
export type NewAttorneyRating = typeof attorneyRatings.$inferInsert;
