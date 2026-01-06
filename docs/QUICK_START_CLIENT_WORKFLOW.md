# Quick Start: Client Workflow Guide

**Last Updated:** January 6, 2026

This guide explains the complete client journey through the Immigration Assistant platform.

## 📱 Client Dashboard Navigation

```
┌─────────────────────────────────────┐
│  Client Dashboard                   │
├─────────────────────────────────────┤
│  🏠 Home        → Main dashboard    │
│  🔖 Saved       → Draft screenings  │
│  ✅ Completed   → Ready to release  │
│  📤 Released    → In attorney review│
└─────────────────────────────────────┘
```

## 🔄 Complete Workflow

### Stage 1: Start Screening
**Location:** Home (`/`) or Available Screenings section

1. View available immigration screenings
2. Click "Start Screening" button
3. Begin answering questions

**Status:** `draft`  
**Locked:** ❌ No  
**Location:** Saved tab

---

### Stage 2: Save Progress
**Location:** Flow interface

- **Auto-save:** Progress saved automatically every 3 seconds
- **Manual save:** Click "Save & Exit" button
- **Resume:** Click "Continue" from Saved tab

**Status:** `draft`  
**Locked:** ❌ No  
**Location:** Saved tab

---

### Stage 3: Complete Screening
**Location:** Flow interface

1. Answer all required questions
2. Reach the end/success node
3. Click "Submit" button
4. Screening moves to Completed tab

**Status:** `draft` (completed but not released)  
**Locked:** ❌ No  
**Location:** Completed tab

---

### Stage 4: Review & Release
**Location:** Completed tab (`/completed`)

**What You See:**
- Your completed screening with all responses
- "Submit for Review" button (blue)
- "Edit" button (if you need to make changes)
- "View Details" link

**Actions:**
1. Review your responses carefully
2. Make any final edits if needed
3. Click **"Submit for Review"** button
4. Read confirmation dialog:
   ```
   "Once submitted, you will not be able to edit 
   your responses until an attorney reviews them."
   ```
5. Click "Submit for Review" to confirm

**Result:**
- ✅ Status changes to `submitted`
- ✅ Screening is locked (`isLocked = true`)
- ✅ Timestamp recorded (`submittedForReviewAt`)
- ✅ Moves to **Released** tab
- 🔒 Can no longer edit

**Status:** `submitted`  
**Locked:** ✅ Yes  
**Location:** Released tab

---

### Stage 5: In Attorney Review
**Location:** Released tab (`/released`)

**What You See:**
- Lock icon indicators
- Status badge (submitted, assigned, in_progress, quoted)
- Release date timestamp
- "View Details" button only (no edit)

**Attorney Actions (Backend):**
1. Admin assigns screening to attorney
   - Status → `assigned`
2. Attorney begins review
   - Status → `in_progress`
3. Attorney sends messages/requests documents
   - You can respond via Messages tab

**Status:** `assigned` or `in_progress`  
**Locked:** ✅ Yes  
**Location:** Released tab

---

### Stage 6a: Attorney Requests Changes
**Location:** Released tab → moves to Completed tab

**If attorney needs more information:**
1. Attorney unlocks your screening
2. You see "Action Required" alert
3. Screening moves back to Completed tab
4. You can now edit and make changes
5. Re-submit when ready

**Status:** `awaiting_client`  
**Locked:** ❌ No (unlocked for editing)  
**Location:** Completed tab (temporarily)

---

### Stage 6b: Attorney Sends Quote
**Location:** Released tab (`/released`)

**What You See:**
- Quote card with amount and description
- Two buttons: "Accept Quote" | "Decline"

**Actions:**
1. Review quote details carefully
2. Click "Accept Quote" to proceed
   - 💰 You'll be assigned to attorney's organization
   - 📝 Creates formal attorney-client relationship
3. Or click "Decline" to reject

**Status:** `quoted` → `quote_accepted` or `quote_declined`  
**Locked:** ✅ Yes  
**Location:** Released tab

---

### Stage 7: Active Case
**Location:** Released tab (`/released`)

**After Accepting Quote:**
- Attorney begins working on your case
- You can communicate via Messages tab
- Upload documents via Documents tab
- Track case progress
- You're now a client of that attorney's organization

**Status:** `quote_accepted`  
**Locked:** ✅ Yes  
**Location:** Released tab

---

## 🎯 Quick Reference

### Can I Edit?

| Location | Status | Locked? | Can Edit? |
|----------|--------|---------|-----------|
| Saved | `draft` | ❌ | ✅ Yes |
| Completed | `draft` | ❌ | ✅ Yes |
| Completed | `awaiting_client` | ❌ | ✅ Yes |
| Released | `submitted` | ✅ | ❌ No |
| Released | `assigned` | ✅ | ❌ No |
| Released | `in_progress` | ✅ | ❌ No |
| Released | `quoted` | ✅ | ❌ No |
| Released | `quote_accepted` | ✅ | ❌ No |

### Status Meanings

- **draft** - You're still working on it
- **submitted** - Released to attorneys, awaiting assignment
- **assigned** - An attorney has been assigned to review
- **in_progress** - Attorney is actively reviewing
- **awaiting_client** - Attorney needs more info (unlocked for you)
- **quoted** - Attorney has sent a price quote
- **quote_accepted** - You accepted the quote, case is active
- **quote_declined** - You declined the quote

### Visual Indicators

- 🟢 **Green Circle** - Completed, editable
- 🔒 **Gray Lock** - Locked, in review
- 🔵 **Blue Badge** - In attorney review
- 🟠 **Orange Alert** - Action required from you
- 🟣 **Purple Badge** - Assigned to attorney
- 💚 **Green Badge** - Quote received/accepted

---

## 💡 Pro Tips

1. **Take Your Time** - Review carefully before releasing
2. **Use Save Often** - Your progress auto-saves, but you can also manually save
3. **Edit Freely** - Make changes anytime before releasing
4. **Check Messages** - Attorneys may ask questions during review
5. **Upload Documents** - Provide supporting documents when requested
6. **Review Quotes** - Compare quotes if you get multiple options
7. **Ask Questions** - Use the Messages tab to communicate with your attorney

---

## 📞 Need Help?

- View all your screenings in respective tabs
- Check Messages tab for attorney communications
- Review Documents tab for uploaded files
- Contact support if you have technical issues

---

**Related Documentation:**
- [Screening Submission & Lock System](./implementation/SCREENING_SUBMISSION_AND_LOCK_SYSTEM.md)
- [Client Role Testing](./testing/02_CLIENT_ROLE_TESTING.md)
- [Technical Architecture](./technical/)

