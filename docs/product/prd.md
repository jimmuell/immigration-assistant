# AI Immigration Information Assistant - Development Plan

## Overview
A public-facing, chat-based AI assistant that helps users understand U.S. immigration options (CBP One, parole, asylum, TPS, work authorization) through educational conversation. The app will have user accounts for persistent conversation history, a clean professional design, and important legal disclaimers.

---

## Phase 1: Foundation & Authentication

### User Accounts & Login
* Sign-up and login page with email/password authentication
* User profiles to store conversation history and saved intake information
* Clean, professional design with a trustworthy blue/gray color scheme

### Core Chat Interface
* Simple, focused chat window design
* Typing indicators and smooth message animations
* Mobile-responsive layout

---

## Phase 2: AI Integration & Disclaimers

### Legal Disclaimer System
* Welcome modal with clear disclaimer that appears on first use
* Shorter in-chat reminders periodically during conversations
* "This is not legal advice" footer visible at all times

### AI Chat Backend
* Integration with Lovable AI (using Gemini 2.5 Flash)
* System prompt implementing your detailed immigration assistant instructions
* Streaming responses for natural conversation flow
* Conversation context maintained throughout the session

---

## Phase 3: Smart Features

### Intake Information Capture
* The AI will ask structured intake questions (entry date, parole status, applications filed, etc.)
* Responses are saved to the user's profile for future reference
* Users can view/edit their saved intake information

### Deadline & Urgency Detection
* AI identifies potential deadlines (1-year asylum rule, parole expiration dates)
* Visual alerts/warnings when urgency is detected
* Clear callouts for time-sensitive situations

### Summary Generation
* "Generate Summary for Attorney" button
* Creates a concise, formatted summary of the user's situation
* Copyable text they can share with legal counsel
* Excludes overly sensitive details for privacy

### Resource Recommendations
* AI includes relevant official links (USCIS, DHS, CBP, DOJ/EOIR)
* Links displayed as clickable cards within the chat
* Situation-specific resources based on the user's circumstances

---

## Phase 4: Conversation Management

### Chat History
* Users can view past conversations in a sidebar
* Start new conversations while preserving old ones
* Search through conversation history

### Privacy Features
* Clear data/delete conversation options
* Reminder to users not to share highly sensitive information (A-numbers, full addresses)

---

## Design Approach
* **Color scheme:** Professional blues and grays with occasional warm accent colors
* **Typography:** Clear, readable fonts at accessible sizes
* **Tone:** Trustworthy, calm, and reassuring
* **Mobile-first:** Works well on phones (many users may access from mobile devices)

## Technical Summary
* **Frontend:** React with clean, accessible UI components (Next.js recommended)
* **Backend:** Lovable Cloud / Next.js Server Actions for auth, database, and AI
* **AI:** Gemini 1.5 Flash via AI SDK
* **Database:** User profiles, saved intake data, conversation history