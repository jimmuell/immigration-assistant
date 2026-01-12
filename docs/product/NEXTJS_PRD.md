# Immigration Assistant - Next.js Product Requirements Document

## Executive Summary

A multi-tenant SaaS platform for immigration screening and attorney matching, built with **Next.js 16 (App Router)**, **Supabase (local)**, and **Google Gemini AI**. The platform connects clients seeking immigration assistance with qualified attorneys through AI-powered screening flows, providing role-based dashboards for clients, attorneys, staff, organization admins, and super admins.

---

## Technology Stack

### Core Framework
- **Frontend**: Next.js 16 (App Router) with React 19, TypeScript
- **Backend**: Next.js Server Actions + API Routes
- **Database**: Supabase (PostgreSQL) running locally
- **ORM**: Drizzle ORM
- **Authentication**: NextAuth v5 (beta) with JWT sessions
- **AI**: Google Gemini 2.5 Flash via AI SDK
- **UI Components**: Radix UI + TailwindCSS 4
- **State Management**: Zustand + React hooks
- **Form Validation**: Zod schemas

### Development Environment
```bash
Terminal 1: Supabase (Local PostgreSQL)
Terminal 2: Next.js Dev Server (Node)
Terminal 3: ngrok (Public URL tunneling)
```

### Deployment Targets
- Production: Vercel (Next.js) + Supabase Cloud
- Development: Local with ngrok for testing webhooks/external access

---

## Multi-Tenant Architecture

### Organization Model
```typescript
// Each organization has:
- id: uuid
- name: string (internal)
- displayName: string (user-facing)
- type: 'law_firm' | 'solo_attorney' | 'non_legal' | 'other'
- website: string
- domainKey: string (for email-based matching)
- requireStaffPreScreening: boolean
```

### Data Isolation Strategy
- **Organization Context**: All queries filtered by `organizationId`
- **Client Exception**: Clients have `organizationId = null` until they accept a quote
- **Attorney Assignment**: When quote accepted, client joins attorney's organization
- **Permissions**: Role-based access control (RBAC) enforced at middleware + server action level

---

## User Roles & Permissions

### 1. Client (`role: 'client'`)
**Access Pattern**: Public + authenticated client pages

**Dashboard Route**: `/` (home) → Redirects based on screening state
- `/landing` - Marketing page for new visitors
- `/saved` - Draft screenings (resumable)
- `/completed` - Submitted screenings awaiting attorney quotes
- `/released` - Screenings assigned to attorneys

**Capabilities**:
- ✅ Complete screening flows (`/flow/[id]`)
- ✅ View and resume draft screenings
- ✅ Receive and accept/decline attorney quotes
- ✅ Upload documents to assigned cases
- ✅ Message with assigned attorney
- ❌ Cannot see other clients' data
- ❌ No organization access until quote accepted

**Next.js Implementation**:
- Pages: Server Components with `getSession()` checks
- Actions: Server Actions with user ID validation
- Middleware: Public routes + authenticated client routes

---

### 2. Attorney (`role: 'attorney'`)
**Access Pattern**: Organization-scoped + attorney-specific routes

**Dashboard Route**: `/attorney`
- **Tabs**: New Screenings | Pending Quotes | Accepted Quotes | Cases

**Sub-routes**:
- `/attorney/new-screenings` - Submitted screenings ready for review
- `/attorney/pending-quotes` - Screenings where attorney sent quote, awaiting client decision
- `/attorney/accepted-quotes` - Screenings where client accepted quote (pre-case)
- `/attorney/cases` - Active cases with ongoing attorney-client work
- `/attorney/screenings/[id]` - Detailed screening view with tabs:
  - **Responses Tab**: Q&A from screening flow
  - **Quote Tab**: Send/edit quote
  - **Documents Tab**: View client-uploaded documents
  - **Messages Tab**: Attorney-client communication

**Capabilities**:
- ✅ View all screenings within organization
- ✅ Filter screenings by status (submitted, reviewed, quoted, accepted)
- ✅ Send quotes to clients
- ✅ Message clients after quote acceptance
- ✅ Download screening data
- ✅ Upload/view case documents
- ❌ Cannot see screenings from other organizations
- ❌ Cannot manage organization settings
- ❌ Cannot create/edit flows

**Next.js Implementation**:
- Pages: Server Components with `requireRole(['attorney', 'org_admin', 'super_admin'])`
- Data Fetching: Server-side queries filtered by `organizationId`
- Actions: Server Actions with organization validation
- Real-time: Optional polling or server-sent events for new screenings

---

### 3. Staff (`role: 'staff'`)
**Access Pattern**: Organization-scoped with pre-screening focus

**Dashboard Route**: `/attorney` (shares attorney dashboard with filtered permissions)

**Capabilities**:
- ✅ View all screenings within organization
- ✅ **Pre-screen** clients (review, categorize, assign to specific attorney)
- ✅ Mark screenings as "reviewed" (for organizations with `requireStaffPreScreening = true`)
- ✅ Assign screenings to specific attorneys
- ✅ View attorney profiles and workload
- ✅ Read-only access to flows
- ❌ Cannot send quotes (attorney-only)
- ❌ Cannot manage organization settings
- ❌ Cannot create/edit flows

**Pre-Screening Workflow** (when `requireStaffPreScreening = true`):
1. Client submits screening → `status = 'submitted'`
2. Staff reviews → Sets `reviewedForAttorneyId` + `status = 'reviewed'`
3. Assigned attorney sees screening in their queue
4. Attorney sends quote → `status = 'quoted'`

**Next.js Implementation**:
- Pages: Same routes as attorney, with conditional UI based on role
- Actions: Server Actions with staff-specific permissions
- Middleware: Same as attorney routes

---

### 4. Organization Admin (`role: 'org_admin'`)
**Access Pattern**: Organization-wide + admin panel

**Dashboard Route**: `/admin`
- **Tabs**: Overview | Screenings | Attorneys | Team | Settings

**Sub-routes**:
- `/admin` - Organization dashboard with analytics
- `/admin/intakes` - All screenings across organization (read-only for data)
- `/admin/attorneys` - Attorney management
  - `/admin/attorneys/add` - Add new attorney to organization
  - `/admin/attorneys/[id]` - View attorney details
  - `/admin/attorneys/onboard` - Attorney onboarding flow
- `/admin/team` - Team member management
- `/admin/users` - User list (clients, attorneys, staff in organization)
- `/admin/settings` - Organization settings
  - Name, display name, type
  - Contact info (email, phone, address)
  - Website and domain matching
  - Staff pre-screening toggle
- `/admin/flows` - **Read-only flow viewer** (cannot create/edit/delete)

**Capabilities**:
- ✅ View all organization data (screenings, users, attorneys)
- ✅ Invite/manage team members (attorneys, staff)
- ✅ Configure organization settings
- ✅ View analytics (screening volume, conversion rates)
- ✅ **Read flows** (preview, view structure)
- ❌ **Cannot create/edit/delete flows** (Super Admin only)
- ❌ Cannot see data from other organizations
- ❌ Cannot manage other organizations

**Next.js Implementation**:
- Pages: Server Components with `requireRole(['org_admin', 'super_admin'])`
- Layouts: `/admin/layout.tsx` with admin sidebar navigation
- Actions: Server Actions with organization context validation
- Analytics: Server-side aggregations with React Server Components

---

### 5. Super Admin (`role: 'super_admin'`)
**Access Pattern**: Platform-wide access + organization context switching

**Dashboard Route**: `/super-admin`
- **Tabs**: Organizations | Users | Flows | Platform Settings

**Sub-routes**:
- `/super-admin` - Platform dashboard with cross-organization metrics
- `/super-admin/organizations` - All organizations
  - `/super-admin/organizations/create` - Create new organization
  - `/super-admin/organizations/[id]` - View/edit organization
  - `/super-admin/organizations/[id]/edit` - Edit organization details
  - `/super-admin/organizations/[id]/assign-admin` - Assign org admin
  - Context switching: Work as if you're in that organization
- `/super-admin/users-list` - All users across platform
- `/admin/flows` - **Full flow management** (inherited from org admin routes)
  - View, create, edit, delete, activate/deactivate flows
- `/admin/flows-editor/[id]` - Visual flow editor (React Flow diagram)

**Capabilities**:
- ✅ Create/manage organizations
- ✅ Assign organization admins
- ✅ Switch organization context (see data from any org)
- ✅ **Full flow management** (create, edit, delete, publish flows)
- ✅ View platform-wide analytics
- ✅ Access all features from all roles
- ✅ Manage super admin accounts

**Organization Context Switching**:
- Super admin can "switch into" any organization
- Session stores current `contextOrganizationId`
- All queries respect context while in switched mode
- Button in UI to "clear context" and return to platform view

**Next.js Implementation**:
- Pages: Server Components with `requireRole(['super_admin'])`
- Context Management: Session-based organization switching
- API Routes: `/api/super-admin/*` for privileged operations
- Middleware: Super admin routes require exact role match

---

## Core Features by Next.js Pattern

### 1. Dynamic Screening Flows

**Feature**: Configurable multi-step questionnaires for immigration screening

**Data Model**:
```typescript
// flows table
{
  id: uuid
  organizationId: uuid | null  // null = platform-wide flow
  name: string
  description: string
  isActive: boolean
  jsonDefinition: jsonb  // Complete flow structure
}

// formNodes table (derived from jsonDefinition)
{
  id: uuid
  flowId: uuid
  nodeId: string
  type: 'question' | 'info' | 'decision' | 'end'
  data: jsonb
}
```

**User Flow**:
1. Client clicks "Start Screening" on landing page
2. System shows active flows (filtered by organization if assigned)
3. Client selects flow → Redirects to `/flow/[flowId]`
4. Flow renderer loads `jsonDefinition` and displays first node
5. User answers questions → Client-side state + optimistic updates
6. "Save & Continue Later" → Server Action saves draft screening
7. "Submit" → Server Action marks as submitted, locks for editing

**Next.js Implementation**:

**Route**: `/flow/[id]/page.tsx`
```typescript
// Server Component - loads flow definition
export default async function FlowPage({ params }) {
  const flow = await getFlow(params.id);
  return <FlowClient flow={flow} />;
}
```

**Client Component**: `/flow/[id]/flow-client.tsx`
```typescript
'use client';
// Manages flow state with useReducer or Zustand
// Renders nodes dynamically based on type
// Handles branching logic (conditional routing)
// Auto-saves progress (debounced)
```

**Server Actions**: `/flow/[id]/actions.ts`
```typescript
export async function saveScreeningProgress(data) {
  // Update screenings table with current responses + currentStepId
}

export async function submitScreening(data) {
  // Set status = 'submitted', isLocked = true
  // Assign to organization if flow has organizationId
}
```

**Flow Editor** (Super Admin only): `/admin/flows-editor/[id]`
- Built with React Flow (@xyflow/react)
- Visual node-based editor
- Drag-and-drop nodes (question, decision, info, end)
- Connect nodes to define flow logic
- Save as JSON to `flows.jsonDefinition`

---

### 2. Attorney Matching & Quote System

**Feature**: Connect clients with attorneys through screening submissions and quotes

**Workflow**:
1. Client submits screening → `status = 'submitted'`
2. Screening assigned to organization (based on flow or manual assignment)
3. Attorneys in organization see screening in `/attorney/new-screenings`
4. (Optional) Staff pre-screens → `reviewedForAttorneyId` assigned
5. Attorney reviews → Sends quote with pricing/details
6. Client receives notification → Views quote in `/completed/[id]`
7. Client accepts quote → `status = 'quote_accepted'`, client joins organization
8. Attorney sees in `/attorney/accepted-quotes` → Case begins

**Next.js Implementation**:

**Quote Sending** (Attorney Dashboard):
```typescript
// /attorney/screenings/[id]/tabs/quote-tab.tsx
'use client';
export function QuoteTab({ screening }) {
  return (
    <form action={sendQuote}>
      <Input name="hourlyRate" />
      <Textarea name="message" />
      <Button type="submit">Send Quote</Button>
    </form>
  );
}

// actions.ts
export async function sendQuote(screeningId, quoteData) {
  // Insert into quoteRequests table
  // Update screening status to 'quoted'
  // Send notification to client
}
```

**Quote Acceptance** (Client View):
```typescript
// /completed/[id]/screening-detail-client.tsx
export function ScreeningDetailClient({ screening, quote }) {
  const handleAccept = async () => {
    await acceptQuote(quote.id);
    // Update screening status to 'quote_accepted'
    // Update client user record: set organizationId
    // Send notification to attorney
    router.push('/released');
  };
}
```

---

### 3. Document Management

**Feature**: Upload, store, and manage documents related to screenings

**Data Model**:
```typescript
// screeningDocuments table
{
  id: uuid
  screeningId: uuid
  uploadedBy: uuid
  fileName: string
  fileType: string  // MIME type
  fileSize: number
  fileUrl: string  // Supabase Storage URL
  documentType: 'passport' | 'birth_certificate' | 'other'
  description: string
}
```

**User Flows**:
- **Client**: Upload documents to their completed/assigned screenings
- **Attorney**: View all documents, upload case files
- **Staff**: View documents for review purposes

**Next.js Implementation**:

**File Upload** (Client Component):
```typescript
// /attorney/screenings/[id]/tabs/documents-tab.tsx
'use client';
export function DocumentsTab({ documents }) {
  const handleUpload = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    
    await fetch('/api/upload-document', {
      method: 'POST',
      body: formData,
    });
  };
}
```

**API Route**: `/api/upload-document/route.ts`
```typescript
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get('file') as File;
  
  // Upload to Supabase Storage
  const { data, error } = await supabase.storage
    .from('screening-documents')
    .upload(`${userId}/${fileName}`, file);
  
  // Save metadata to screeningDocuments table
  await db.insert(screeningDocuments).values({
    screeningId,
    fileUrl: data.path,
    fileName: file.name,
    fileType: file.type,
    fileSize: file.size,
  });
}
```

**Storage Setup**:
- Supabase Storage bucket: `screening-documents`
- RLS policies: Users can only access their own documents + attorneys in same org
- File types: PDF, JPG, PNG, DOCX (validated on upload)

---

### 4. AI Chat Integration

**Feature**: Gemini-powered chat for immigration guidance (currently less prominent, but available)

**Current State**: Legacy feature from initial design, now supplemented by structured flows

**Implementation**:

**API Route**: `/api/chat/route.ts`
```typescript
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(request: Request) {
  const { messages, userId } = await request.json();
  
  const ai = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
  const model = ai.getGenerativeModel({ model: 'gemini-2.5-flash' });
  
  // Stream response
  const stream = await model.generateContentStream({
    contents: messages,
    systemInstruction: IMMIGRATION_ASSISTANT_PROMPT,
  });
  
  // Save conversation to database
  // Return streaming response
}
```

**System Prompt**: Configured for immigration law, disclaimers, and resource recommendations

**Future Enhancement**: Integrate chat into screening flows for clarification questions

---

### 5. Attorney-Client Messaging

**Feature**: Secure messaging between attorneys and clients after quote acceptance

**Data Model**:
```typescript
// attorneyClientMessages table
{
  id: uuid
  screeningId: uuid
  senderId: uuid  // User who sent
  recipientId: uuid  // User who receives
  message: text
  isRead: boolean
  createdAt: timestamp
}
```

**Access Control**:
- Only available after `status = 'quote_accepted'`
- Both parties must be in same organization
- Messages tied to specific screening/case

**Next.js Implementation**:

**Messages Tab** (Attorney/Client shared):
```typescript
// /attorney/screenings/[id]/tabs/messages-tab.tsx
export async function MessagesTab({ screeningId }) {
  const messages = await getMessages(screeningId);
  
  return (
    <div>
      <MessageList messages={messages} />
      <MessageForm screeningId={screeningId} />
    </div>
  );
}

// Server Action
export async function sendMessage(screeningId, recipientId, message) {
  await db.insert(attorneyClientMessages).values({
    screeningId,
    senderId: session.user.id,
    recipientId,
    message,
  });
  revalidatePath(`/attorney/screenings/${screeningId}`);
}
```

**Real-time Updates** (optional):
- Use Next.js Server-Sent Events (SSE) via API route
- Or simple polling every 5-10 seconds
- Or Supabase Realtime subscriptions (if using Supabase client-side)

---

### 6. Analytics & Dashboards

**Feature**: Role-specific dashboards with relevant metrics

#### Client Dashboard (`/`)
```typescript
// Metrics:
- Total screenings (draft, submitted, completed)
- Active cases with attorneys
- Recent activity

// Server Component
export default async function ClientDashboard() {
  const userId = session.user.id;
  const stats = await getClientStats(userId);
  
  return (
    <div>
      <StatCard label="Screenings" value={stats.totalScreenings} />
      <StatCard label="Active Cases" value={stats.activeCases} />
      <ScreeningsList screenings={stats.recentScreenings} />
    </div>
  );
}
```

#### Attorney Dashboard (`/attorney`)
```typescript
// Metrics:
- New screenings count
- Pending quotes count
- Accepted quotes count
- Active cases count
- Response rate (quotes sent vs accepted)

// Tabs with Server Components
export default async function AttorneyDashboard() {
  const stats = await getAttorneyStats(
    session.user.id,
    session.user.organizationId
  );
  
  return (
    <Tabs>
      <TabsList>
        <TabsTrigger>New ({stats.newScreenings})</TabsTrigger>
        <TabsTrigger>Pending ({stats.pendingQuotes})</TabsTrigger>
        <TabsTrigger>Accepted ({stats.acceptedQuotes})</TabsTrigger>
        <TabsTrigger>Cases ({stats.activeCases})</TabsTrigger>
      </TabsList>
      {/* Tab content... */}
    </Tabs>
  );
}
```

#### Organization Admin Dashboard (`/admin`)
```typescript
// Metrics:
- Total screenings (by status)
- Total attorneys
- Total clients
- Conversion rate (screenings → accepted quotes)
- Average response time
- Top performing attorneys

// Charts:
- Screenings over time (line chart)
- Screening status breakdown (pie chart)
- Attorney workload distribution (bar chart)

// Implementation: React Server Components + Chart library (Recharts)
```

#### Super Admin Dashboard (`/super-admin`)
```typescript
// Metrics:
- Total organizations
- Total users (by role)
- Total screenings (platform-wide)
- Active flows
- Organization growth (new orgs per month)

// Cross-organization insights
```

---

## Authentication Flow

### Sign Up

**Routes**:
- `/signup` - Client signup (public)
- `/api/auth/signup` - Signup API endpoint
- `/api/auth/attorney-signup` - Attorney signup with firm matching

**Client Signup Flow**:
1. User visits `/signup`
2. Form: email, password, name
3. Server Action validates → Creates user with `role = 'client'`, `organizationId = null`
4. Auto-login → Redirect to `/landing`

**Attorney Signup Flow**:
1. User visits `/signup?role=attorney`
2. Form: email, password, name, firm website
3. Server Action:
   - Extracts domain from email
   - Searches `organizations` table for matching `domainKey`
   - If match found → Sets `organizationId`, `role = 'attorney'`
   - If no match → Prompts to create new organization (solo attorney)
4. Creates `attorneyProfiles` record
5. Auto-login → Redirect to `/attorney`

**Next.js Implementation**:
```typescript
// /signup/page.tsx
export default function SignupPage() {
  return (
    <form action={signup}>
      <Input name="email" />
      <Input name="password" type="password" />
      <Input name="name" />
      <Button type="submit">Sign Up</Button>
    </form>
  );
}

// /api/auth/signup/route.ts
export async function POST(request: Request) {
  const { email, password, name, role = 'client' } = await request.json();
  
  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);
  
  // Create user
  const user = await db.insert(users).values({
    email,
    password: hashedPassword,
    name,
    role,
  });
  
  return Response.json({ success: true });
}
```

### Login

**Route**: `/login`

**Flow**:
1. User enters email + password
2. NextAuth validates credentials
3. Session created with JWT containing `userId`, `role`, `organizationId`
4. Redirect based on role:
   - Client → `/`
   - Attorney → `/attorney`
   - Org Admin → `/admin`
   - Super Admin → `/super-admin`

**Next.js Implementation**:
```typescript
// /login/page.tsx
import { signIn } from 'next-auth/react';

export default function LoginPage() {
  const handleLogin = async (formData) => {
    await signIn('credentials', {
      email: formData.get('email'),
      password: formData.get('password'),
      callbackUrl: '/',
    });
  };
  
  return <form action={handleLogin}>...</form>;
}

// /api/auth/[...nextauth]/route.ts
import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

export const authOptions = {
  providers: [
    CredentialsProvider({
      async authorize(credentials) {
        const user = await db.query.users.findFirst({
          where: eq(users.email, credentials.email),
        });
        
        if (!user) return null;
        
        const valid = await bcrypt.compare(
          credentials.password,
          user.password
        );
        
        if (!valid) return null;
        
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          organizationId: user.organizationId,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.organizationId = user.organizationId;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.role = token.role;
      session.user.organizationId = token.organizationId;
      return session;
    },
  },
};

export const { handlers, auth } = NextAuth(authOptions);
```

### Middleware Protection

**File**: `/middleware.ts`

```typescript
import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const user = req.auth?.user;
  
  // Public routes
  if (['/login', '/signup', '/landing'].includes(pathname)) {
    return NextResponse.next();
  }
  
  // Require authentication
  if (!user) {
    return NextResponse.redirect(new URL('/login', req.url));
  }
  
  // Role-based protection
  if (pathname.startsWith('/attorney')) {
    if (!['attorney', 'org_admin', 'staff', 'super_admin'].includes(user.role)) {
      return NextResponse.redirect(new URL('/', req.url));
    }
  }
  
  if (pathname.startsWith('/admin')) {
    if (!['org_admin', 'super_admin'].includes(user.role)) {
      return NextResponse.redirect(new URL('/', req.url));
    }
  }
  
  if (pathname.startsWith('/super-admin')) {
    if (user.role !== 'super_admin') {
      return NextResponse.redirect(new URL('/', req.url));
    }
  }
  
  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
```

---

## Database Schema Summary

### Core Tables

**organizations** - Firms, solo attorneys, platform entities
- Multi-tenancy foundation
- Domain-based matching for attorney signup
- Pre-screening settings

**users** - All user accounts
- Role column: `'client' | 'attorney' | 'org_admin' | 'staff' | 'super_admin'`
- `organizationId` nullable (null for unassigned clients)

**flows** - Screening questionnaire definitions
- JSON-based structure
- Organization-specific or platform-wide
- Versioning via `isActive` flag

**screenings** - User submissions
- Stores responses as JSON
- Status tracking: draft → submitted → quoted → accepted
- Lock system prevents editing after submission

**quoteRequests** - Attorney quotes to clients
- Pricing, estimated timeline, message
- Status: pending → accepted/declined

**attorneyClientMessages** - Case communication
- Tied to specific screening
- Read/unread tracking

**screeningDocuments** - File uploads
- Metadata + Supabase Storage URLs
- Document type categorization

**attorneyProfiles** - Professional info
- Bio, specialties, bar number
- Rating system (0-5 stars)

**attorneyRatings** - Client feedback
- Rating + review text
- Linked to specific case

---

## Next.js-Specific Patterns

### 1. App Router Structure

```
src/app/
├── (public)/              # Public marketing pages
│   └── landing/
├── (auth)/                # Auth pages (login, signup)
│   ├── login/
│   └── signup/
├── (client)/              # Client-only pages
│   ├── page.tsx           # Client dashboard
│   ├── saved/             # Draft screenings
│   ├── completed/         # Submitted screenings
│   └── released/          # Assigned cases
├── flow/                  # Flow renderer (client-facing)
│   └── [id]/
├── attorney/              # Attorney dashboard
│   ├── page.tsx
│   ├── new-screenings/
│   ├── pending-quotes/
│   ├── accepted-quotes/
│   ├── cases/
│   └── screenings/[id]/
├── admin/                 # Org admin dashboard
│   ├── page.tsx
│   ├── intakes/
│   ├── attorneys/
│   ├── team/
│   ├── settings/
│   ├── flows/             # Read-only for org admins
│   └── flows-editor/      # Super admin only
├── super-admin/           # Platform admin
│   ├── page.tsx
│   ├── organizations/
│   └── users-list/
└── api/                   # API routes
    ├── auth/
    ├── chat/
    ├── screenings/
    └── upload-document/
```

### 2. Server Components (Default)

Use for:
- Pages with data fetching
- Dashboards
- Lists (screenings, organizations, users)
- Static content

```typescript
// Example: Attorney Dashboard
export default async function AttorneyDashboard() {
  const session = await getSession();
  const screenings = await getScreeningsForAttorney(
    session.user.id,
    session.user.organizationId
  );
  
  return (
    <div>
      <h1>New Screenings</h1>
      <ScreeningsList screenings={screenings} />
    </div>
  );
}
```

### 3. Client Components

Use for:
- Interactive forms
- Real-time updates
- Complex state management
- Third-party UI libraries (React Flow, charts)

Mark with `'use client'` directive:
```typescript
'use client';

import { useState } from 'react';

export function ScreeningForm() {
  const [answers, setAnswers] = useState({});
  
  return <form>...</form>;
}
```

### 4. Server Actions

Use for:
- Form submissions
- Data mutations
- Database writes
- Authentication

```typescript
'use server';

export async function saveScreening(formData: FormData) {
  const session = await getSession();
  
  if (!session) {
    throw new Error('Unauthorized');
  }
  
  await db.insert(screenings).values({
    userId: session.user.id,
    responses: formData.get('responses'),
    status: 'draft',
  });
  
  revalidatePath('/saved');
}
```

### 5. API Routes

Use for:
- External webhooks
- File uploads
- Streaming responses (AI chat)
- Third-party integrations

```typescript
// /api/upload-document/route.ts
export async function POST(request: Request) {
  // Handle multipart/form-data
  // Upload to Supabase Storage
  // Return JSON response
}
```

### 6. Route Groups

Organize routes without affecting URL structure:
```
(public)/          # No auth required
(auth)/            # Auth pages
(client-dashboard)/ # Client-specific
(attorney-dashboard)/ # Attorney-specific
```

### 7. Parallel Routes

For complex dashboards with multiple data sources:
```
/attorney/
├── @stats/        # Parallel slot for statistics
├── @screenings/   # Parallel slot for screening list
└── page.tsx       # Combines both slots
```

### 8. Layouts

Shared UI across routes:
```typescript
// /attorney/layout.tsx
export default function AttorneyLayout({ children }) {
  return (
    <div>
      <Sidebar />
      <main>{children}</main>
    </div>
  );
}
```

---

## Local Development Setup

### Prerequisites
- Node.js 20+ (LTS)
- pnpm (package manager)
- Docker (for Supabase)
- ngrok account (for public tunneling)

### Terminal Setup

**Terminal 1: Supabase**
```bash
# Start local Supabase (PostgreSQL + Studio)
npx supabase start

# Outputs:
# API URL: http://localhost:54321
# DB URL: postgresql://postgres:postgres@localhost:54322/postgres
# Studio URL: http://localhost:54323
```

**Terminal 2: Next.js Dev Server**
```bash
# Install dependencies
pnpm install

# Run migrations
pnpm db:migrate

# Seed super admin
pnpm db:seed

# Start dev server
pnpm dev

# Server running at http://localhost:3000
```

**Terminal 3: ngrok (Optional)**
```bash
# Create public URL for testing webhooks, external access
ngrok http 3000

# Outputs:
# Forwarding: https://abc123.ngrok.io → http://localhost:3000
```

### Environment Variables

Create `.env.local`:
```env
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:54322/postgres"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# Google AI
GOOGLE_API_KEY="your-gemini-api-key"

# Supabase (for Storage)
NEXT_PUBLIC_SUPABASE_URL="http://localhost:54321"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# ngrok (if using)
NEXT_PUBLIC_APP_URL="https://abc123.ngrok.io"
```

### Database Migrations

All migrations in `/migrations/` folder (SQL files):
- Run with: `pnpm db:migrate` (uses `scripts/run-migrations.ts`)
- Studio: Access at `http://localhost:54323` for visual DB management

### Scripts

```json
{
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "db:migrate": "tsx scripts/run-migrations.ts",
  "db:seed": "tsx scripts/seed-super-admin.ts",
  "db:studio": "drizzle-kit studio",
  "db:create-test-accounts": "tsx scripts/create-test-accounts.ts"
}
```

---

## Testing Strategy

### Test Accounts

Run `pnpm db:create-test-accounts` to generate:
- Super Admin: `superadmin@platform.com`
- Org Admin: `admin@lawfirm.com`
- Attorney: `attorney@lawfirm.com`
- Staff: `staff@lawfirm.com`
- Client: `client@example.com`

(All passwords: `password123`)

### Manual Testing Checklist

See `/docs/testing/` for comprehensive test plans:
- `01_AUTHENTICATION_TESTING.md`
- `02_CLIENT_ROLE_TESTING.md`
- `03_ATTORNEY_ROLE_TESTING.md`
- `04_ORG_ADMIN_ROLE_TESTING.md`
- `05_STAFF_ROLE_TESTING.md`
- `06_SUPER_ADMIN_ROLE_TESTING.md`
- `07_CROSS_ROLE_INTEGRATION_TESTING.md`

### Key Test Scenarios

1. **Client Screening Journey**
   - Signup → Start flow → Answer questions → Save progress → Resume → Submit → Receive quote → Accept/decline

2. **Attorney Quote Workflow**
   - Login → View new screening → Review responses → Send quote → Client accepts → Message client

3. **Staff Pre-screening**
   - Enable pre-screening in org settings → Staff reviews submission → Assigns to attorney → Attorney receives

4. **Organization Context Switching** (Super Admin)
   - Switch to Org A → View screenings → Switch to Org B → Different data

5. **Flow Management** (Super Admin)
   - Create flow → Add nodes → Connect edges → Activate → Test as client

---

## Performance Considerations

### 1. Server Components by Default
- Reduce client-side JavaScript
- Fetch data on server (closer to database)
- No hydration needed for static content

### 2. Streaming & Suspense
```typescript
import { Suspense } from 'react';

export default function Dashboard() {
  return (
    <div>
      <Suspense fallback={<Skeleton />}>
        <ScreeningsCount />
      </Suspense>
      <Suspense fallback={<Skeleton />}>
        <RecentActivity />
      </Suspense>
    </div>
  );
}
```

### 3. Database Indexes
All foreign keys indexed:
- `users.organizationId`
- `screenings.organizationId`
- `screenings.userId`
- `flows.organizationId`

### 4. Query Optimization
- Use Drizzle ORM with typed queries
- Avoid N+1 queries (use joins)
- Paginate large lists (screenings, users)

### 5. Caching
```typescript
import { unstable_cache } from 'next/cache';

const getOrganizations = unstable_cache(
  async () => db.query.organizations.findMany(),
  ['organizations'],
  { revalidate: 3600 } // 1 hour
);
```

### 6. Image Optimization
Use Next.js `<Image>` component:
```typescript
import Image from 'next/image';

<Image
  src="/logo.png"
  alt="Logo"
  width={200}
  height={50}
  priority
/>
```

---

## Security Best Practices

### 1. Authentication
- ✅ Passwords hashed with bcrypt (10 rounds)
- ✅ JWT tokens signed with secret
- ✅ Session expiration (30 days)
- ✅ CSRF protection via NextAuth

### 2. Authorization
- ✅ Middleware blocks unauthorized routes
- ✅ Server Actions validate user role
- ✅ Database queries filtered by organizationId
- ✅ Row-level security (RLS) in Supabase

### 3. Data Validation
- ✅ Zod schemas for all inputs
- ✅ Server-side validation (never trust client)
- ✅ SQL injection protection (Drizzle ORM parameterized queries)

### 4. File Uploads
- ✅ Validate file types (whitelist: PDF, JPG, PNG, DOCX)
- ✅ Limit file size (max 10MB)
- ✅ Scan for malware (future: integrate ClamAV)
- ✅ Store in Supabase Storage (isolated by user)

### 5. API Routes
- ✅ Rate limiting (future: implement middleware)
- ✅ Input sanitization
- ✅ CORS headers (restrict origins)

### 6. Environment Variables
- ✅ Never commit `.env` files
- ✅ Use `.env.local` for local dev
- ✅ Vercel Environment Variables for production

---

## Deployment Checklist

### Pre-Deployment

- [ ] Run production build locally: `pnpm build`
- [ ] Fix all TypeScript errors
- [ ] Fix all ESLint warnings
- [ ] Test all user flows manually
- [ ] Run database migrations on production DB
- [ ] Set environment variables in Vercel
- [ ] Configure Supabase Storage buckets & RLS policies
- [ ] Set up custom domain in Vercel (if applicable)

### Vercel Configuration

**`vercel.json`** (optional):
```json
{
  "buildCommand": "pnpm build",
  "devCommand": "pnpm dev",
  "installCommand": "pnpm install",
  "framework": "nextjs",
  "env": {
    "DATABASE_URL": "@database_url",
    "NEXTAUTH_SECRET": "@nextauth_secret",
    "GOOGLE_API_KEY": "@google_api_key"
  }
}
```

### Supabase Cloud Setup

1. Create project on supabase.com
2. Run migrations: `supabase db push`
3. Set up Storage buckets:
   - `screening-documents`
   - Configure RLS policies
4. Copy connection string to Vercel env vars

### Post-Deployment

- [ ] Test login/signup on production
- [ ] Verify database connections
- [ ] Test file uploads to Supabase Storage
- [ ] Check AI chat functionality (Gemini API)
- [ ] Monitor Vercel logs for errors
- [ ] Set up error tracking (Sentry recommended)

---

## Future Enhancements

### Phase 1 (Immediate)
- [ ] Real-time notifications (SSE or Supabase Realtime)
- [ ] Email notifications (Resend or SendGrid)
- [ ] PDF export of screening summaries
- [ ] Attorney calendar integration (Google Calendar API)

### Phase 2 (Medium-term)
- [ ] Advanced analytics dashboards (Recharts)
- [ ] Client ratings/reviews for attorneys
- [ ] Payment integration (Stripe) for quote acceptance
- [ ] Mobile app (React Native with shared API)

### Phase 3 (Long-term)
- [ ] AI-powered attorney matching (based on screening content)
- [ ] Multi-language support (i18n)
- [ ] Video consultation scheduling (Zoom API)
- [ ] Case management CRM features
- [ ] Referral system for attorneys

---

## API Documentation

### Internal APIs (Server Actions)

Most data mutations use Server Actions (no REST API needed):
- `saveScreening()`
- `submitScreening()`
- `sendQuote()`
- `acceptQuote()`
- `sendMessage()`
- `updateOrganizationSettings()`

### External APIs (Route Handlers)

**POST /api/auth/signup**
```typescript
Request: { email: string, password: string, name: string, role?: string }
Response: { success: boolean, userId: string }
```

**POST /api/auth/attorney-signup**
```typescript
Request: { email: string, password: string, name: string, firmWebsite: string }
Response: { success: boolean, organizationId: string }
```

**POST /api/chat**
```typescript
Request: { messages: Message[], userId: string }
Response: Stream (SSE) of AI responses
```

**POST /api/upload-document**
```typescript
Request: FormData (file: File, screeningId: string)
Response: { success: boolean, documentId: string, fileUrl: string }
```

**POST /api/screenings**
```typescript
Request: { flowId: string, responses: object, status: string }
Response: { success: boolean, screeningId: string }
```

---

## Glossary

- **Screening**: A completed or in-progress questionnaire (formerly "intake")
- **Flow**: A configurable questionnaire template
- **Organization**: A law firm, solo attorney, or platform entity
- **Quote**: An attorney's offer to take a client's case (with pricing)
- **Case**: An active attorney-client engagement (after quote accepted)
- **Pre-screening**: Staff review of submissions before attorney sees them
- **Context Switching**: Super admin ability to view data from any organization
- **Draft**: A saved but unsubmitted screening
- **Submission ID**: Unique identifier for each screening instance

---

## Support & Documentation

### Documentation Structure
```
/docs/
├── product/               # This PRD, UX guides
├── technical/             # Architecture, schemas, auth
├── implementation/        # Feature implementation notes
├── testing/               # Test plans and results
└── setup/                 # Development setup guides
```

### Key Technical Docs
- **NEXTJS_PRD.md** (this file) - Complete product requirements
- **ROLE_AUTH.md** - Authentication and authorization
- **FLOW_JSON_SPECIFICATION.md** - How flows are structured
- **SETUP.md** - Local development setup

### Getting Help
- Check `/docs/` folder for detailed guides
- Review test accounts in `/docs/testing/TEST_ACCOUNTS.md`
- Run `pnpm db:studio` to inspect database visually
- Use Supabase Studio at `http://localhost:54323`

---

## Version History

- **v1.0** (Current) - Initial Next.js 16 implementation with multi-tenancy, roles, flows, quotes
- **v0.9** - Beta testing with test accounts
- **v0.5** - Prototype with basic chat + auth

---

## Appendix: Next.js 16 Features Used

### App Router
- File-based routing with layouts
- Server Components by default
- Client Components with `'use client'`
- Route groups for organization

### Server Actions
- Form submissions without API routes
- Data mutations with type safety
- Automatic revalidation

### Middleware
- Edge runtime for fast auth checks
- Role-based route protection

### Image Optimization
- Automatic WebP conversion
- Lazy loading
- Responsive images

### Font Optimization
- Local font loading (Geist)
- Automatic subsetting

### Streaming
- Suspense boundaries for progressive rendering
- Loading states

### Caching
- Automatic request memoization
- Data Cache (fetch)
- Full Route Cache

---

## Contact & Maintenance

**Repository**: https://github.com/jimmuell/immigration-assistant
**Primary Developer**: James Mueller
**Framework**: Next.js 16.1.1
**Last Updated**: January 2026

---

*This PRD is a living document. Update as features are added or architecture changes.*

