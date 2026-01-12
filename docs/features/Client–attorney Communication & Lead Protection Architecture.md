# Client–Attorney Communication & Lead Protection Architecture

This document outlines a **proven, marketplace-tested communication and negotiation architecture** designed to:

* Enable clients to receive and compare attorney quotes
* Allow limited negotiation and clarification
* Prevent attorneys from bypassing the platform to avoid lead fees
* Preserve LinkToLawyers’ revenue and trust

This approach is based on **established patterns used by two-sided service marketplaces** such as Upwork, Thumbtack, Avvo, and LegalZoom.

---

## Core Principle

> **Never allow direct, identifiable contact between client and attorney until a paid commitment exists.**

Marketplaces that violate this principle experience rapid off-platform leakage and revenue loss.

---

## Phase 1: Screening Submission (Client)

**Goal:** Collect enough information to allow accurate quoting without exposing personally identifiable information (PII).

### Process

* Client completes a guided **Screening**
* Screening is stored internally
* Screening is visible to qualified attorneys

### Attorney Visibility

* Legal category
* Jurisdiction
* Timeline
* Complexity indicators

### Restrictions

* No client name
* No email
* No phone number
* No identifying documents

This phase is low-risk and fully compliant with industry standards.

---

## Phase 2: Anonymized Quote + Clarification (Critical Layer)

**Goal:** Allow attorneys to submit accurate quotes and request clarification without exposing contact information.

### Attorney Capabilities

* Submit quote (flat fee, hourly, or range)
* Define scope assumptions
* Ask clarification questions

### Client Capabilities

* Respond to attorney questions
* Request quote revisions
* Submit counteroffers

### Mandatory Technical Controls

1. **Platform-Only Messaging**

   * No email forwarding
   * No phone numbers
   * No external links

2. **Automatic PII Scrubbing**

   * Detect and block:

     * Phone numbers
     * Email addresses
     * URLs
     * Phrases such as “call me,” “text me,” or “email me”
   * Replace blocked content with a system warning:

     > “Contact information is shared only after a quote is accepted.”

3. **Rate-Limited Messaging**

   * Example: 3 clarification questions per quote round
   * Prevents lead fishing

4. **Thread-Bound Conversations**

   * Messages are tied to a specific quote
   * No open-ended chat

This structure mirrors the messaging systems used by major freelance and legal marketplaces.

---

## Phase 3: Quote Selection & Commitment Gate (Revenue Lock)

**Goal:** Ensure LinkToLawyers is compensated before direct communication occurs.

Once a client selects a quote, one of the following commitment models is required.

### Option A: Attorney-Paid Lead Unlock (Recommended)

* Attorney pays:

  * Flat lead fee **or**
  * Percentage of quoted amount (e.g., 10–20%)

After payment:

* Client contact info is unlocked
* Documents are unlocked
* Scheduling is enabled

### Option B: Client Deposit / Escrow

* Client places a refundable or creditable deposit
* Funds are held until engagement begins
* Attorney gains access to contact information after deposit

**Escrow-based models reduce attorney resistance** and are widely used in legal referral platforms.

---

## Phase 4: Full Communication Unlocked

**Only after commitment:**

* Names revealed
* Secure document uploads enabled
* Phone and video scheduling enabled
* External communication permitted

At this stage, the platform has already captured its value.

---

## Negotiation Without Off-Platform Leakage

**Problem:** Attorneys often request phone calls to negotiate.

**Solution:** Structured, in-platform negotiation.

### Structured Negotiation Tools

* Counteroffer button
* Editable price
* Editable scope
* Editable timeline
* Optional free-text field (PII-scrubbed)

### Benefits

* Prevents off-platform contact
* Creates an audit trail
* Feels professional and controlled

This approach is used successfully by Upwork and Thumbtack.

---

## Attorney Requests for Additional Information (Safely)

### Allowed (Before Commitment)

* Multiple-choice follow-up questions
* Short-answer text fields
* Yes/No branching logic
* Redacted document uploads

### Not Allowed (Until Commitment)

* Phone calls
* Emails
* Screenshots with metadata
* External document links

This mirrors intake workflows used in tele-law and HIPAA-conscious platforms.

---

## Enforcement Layers (All Are Required)

### 1. Technical Enforcement

* PII detection and blocking
* URL filtering
* Metadata stripping
* Message rate limits

### 2. Economic Enforcement

* Contact info locked behind payment or escrow
* No free lead unlocks

### 3. Policy Enforcement

* Clear Terms of Service
* Explicit prohibition on off-platform solicitation
* Permanent bans for violations
* Visible warnings in the messaging UI

**Platforms that rely on policy alone fail.**

---

## Why This Architecture Works

| Risk                       | Control                      |
| -------------------------- | ---------------------------- |
| Attorney steals lead       | Contact gated behind payment |
| Client shares contact info | PII blocking and scrubbing   |
| Attorney needs clarity     | Structured Q&A               |
| Negotiation required       | Counteroffer system          |
| Attorney resistance        | Escrow or delayed fee        |

This model is proven across legal, freelance, and healthcare marketplaces.

---

## Recommended Implementation Summary

### Required

* Anonymized messaging
* Structured clarification workflow
* Paid unlock or escrow gate
* Automatic PII blocking

### Optional Enhancements

* AI-assisted question suggestions
* Quote comparison UI
* Negotiation round limits

---

## Next Steps (Optional)

This document can be extended to include:

* Database schema (Screening → Quote → Thread → Unlock)
* UI wireframe logic
* Terms of Service language
* Attorney pricing strategy recommendations

---

**Document Type:** Internal architecture / product design
**Platform:** LinkToLawyers
