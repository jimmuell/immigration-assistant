# Organization Admin Flow Management - Quick Start Guide

## Welcome! 🎉

As an Organization Admin, you now have the power to create and manage custom screening flows for your organization. This guide will get you started in minutes.

## What You Can Do

✅ Create custom flows for your organization  
✅ Use the visual drag-and-drop editor  
✅ Test flows before going live  
✅ Activate flows for client screenings  
✅ Edit and improve flows over time  

## Your First Flow in 5 Steps

### Step 1: Create a Flow

1. Navigate to **Admin** → **Flows** in the sidebar
2. Click **Create Flow** button
3. Your new flow starts as a **Draft** (safe to experiment!)

### Step 2: Design Your Flow

Choose your preferred editor:

**Option A: Visual Editor** (Recommended)
1. Click the **Workflow icon** button on your flow
2. Drag and drop nodes to create your screening questions
3. Connect nodes to create the flow path
4. Click **Save** to save your changes

**Option B: Markdown Editor**
1. Click the **Edit icon** button on your flow
2. Write your flow in markdown format
3. Save your changes

### Step 3: Test Your Flow

**Critical**: Always test before activating!

1. Click **Preview** on your flow
2. ✅ **Check "Test Mode"** at the start screen
3. Complete the flow as a client would
4. Review your test submission at **Test Screenings** page
5. Delete test screenings when done testing

### Step 4: Publish Your Flow

When you're satisfied with testing:

1. Click the status button showing **"Draft → Publish as Inactive"**
2. Flow changes to **Inactive** status
3. Flow is published but not yet available to clients

### Step 5: Activate Your Flow

Make it available to clients:

1. Click the status button showing **"Inactive → Activate"**
2. Flow changes to **Active** status
3. Clients can now use this flow for screenings!

## Understanding Flow Status

Flows now use a **simple 3-state system** that follows a clear progression:

### The Three States

| Status | What It Means | Can Edit? | Visible to Clients? |
|--------|---------------|-----------|---------------------|
| **Draft** | Work in progress | ✅ Yes, freely | ❌ No |
| **Inactive** | Published but not live | ⚠️ Must return to draft first | ❌ No |
| **Active** | Published and live | ⚠️ Must return to draft first | ✅ Yes |

### State Progression

```
Draft → Inactive → Active
  ↑                   ↓
  └─ Return to Draft ←┘
```

**Tips**: 
- Always test in Draft mode before publishing
- Use Inactive state to prepare flows in advance
- Only activate when you're fully confident

## Flow Types You'll See

### 🌐 Global Flows
- Created by Super Admins
- Available to all organizations
- **Read-only** for you (can view/preview only)
- Example: "Basic Immigration Screening"

### 🏢 Organization Flows
- Created by you or your org admins
- Specific to your organization
- **Full control** (edit, delete, activate)
- Customized for your needs

## Testing Best Practices

### The Test Mode Workflow

```
1. Create Flow (Draft) ──────────────────┐
                                          │
2. Design Flow ──────────────────────────┤
                                          │
3. Test with Test Mode ──────────────────┤
   │                                      │
   ├─ Problems found? ───> Edit & Retest ┘
   │
   └─ Works perfectly? ──> Continue
                            │
4. Publish Flow ────────────┤
                            │
5. Activate Flow ───────────┤
                            │
6. Monitor Usage ───────────┘
```

### Test Mode Checklist

Before activating any flow:

- [ ] Test all question paths
- [ ] Verify conditional logic works
- [ ] Test required field validation
- [ ] Check data is collected correctly
- [ ] Test on both desktop and mobile
- [ ] Have a colleague test as well
- [ ] Delete test screenings

**Remember**: Test screenings are flagged separately and won't affect your real client data!

## Common Tasks

### Edit an Existing Flow

1. Find your flow in the Flows list
2. If not in **Draft** mode, click **"Return to Draft"**
3. Click the **Workflow** or **Edit** icon
4. Make your changes
5. Test again with Test Mode
6. Publish as Inactive, then Activate when ready

### Delete a Flow

1. Ensure no active screenings are using it
2. Click the **Trash** icon
3. Confirm deletion
4. Flow is permanently removed

### Preview Global Flows

1. Find a global flow (🌐 icon)
2. Click **Preview** button
3. Experience the flow as a client would
4. Note: You cannot edit global flows

## Tips for Success

### 🎯 Start Simple
- Begin with a basic flow
- Add complexity gradually
- Test each addition

### 🧪 Test, Test, Test
- Use Test Mode extensively
- Get feedback from staff
- Iterate based on results

### 📊 Monitor and Improve
- Check screening completion rates
- Gather client feedback
- Refine flows over time

### 🔒 Keep It Secure
- Don't collect unnecessary data
- Include privacy notices
- Follow legal compliance

### 🎨 Design for Users
- Clear, simple questions
- Logical flow progression
- Mobile-friendly design
- Helpful descriptions

## Visual Editor Quick Reference

### Node Types

- **Start**: Beginning of flow
- **Question**: Ask a question
  - Yes/No
  - Multiple Choice
  - Text Input
  - Date Input
- **Info**: Display information
- **Form**: Collect multiple fields
- **Success**: End with success message
- **End**: Generic end point

### Connecting Nodes

1. Click and drag from a node's handle
2. Drop on another node's handle
3. Label conditional paths (Yes/No, options)
4. Test the flow thoroughly

### Organizing Your Canvas

- Arrange nodes left-to-right for flow direction
- Use straight lines when possible
- Group related questions together
- Use the zoom controls to see overview

## Need Help?

### Self-Service Resources

- 📖 **Full Documentation**: `/docs/implementation/FLOW_MANAGEMENT_PERMISSIONS.md`
- 🎓 **Video Tutorials**: [Coming soon]
- ❓ **FAQ**: [Coming soon]

### Get Support

- **Technical Issues**: support@immigration-assistant.com
- **Best Practices**: Ask your Super Admin
- **Feature Requests**: Document and share with team

## Quick Troubleshooting

**Problem**: Can't activate a flow  
**Solution**: Flow must progress through states: Draft → Inactive → Active

**Problem**: Can't edit a flow  
**Solution**: Click "Return to Draft" first, or check if it's a Global flow (🌐) which are read-only

**Problem**: Test Mode not showing  
**Solution**: Ensure you're logged in as org_admin, not client

**Problem**: Changes not saving  
**Solution**: Check your internet connection and try again

**Problem**: Don't see Create Flow button  
**Solution**: Verify you're logged in as Organization Admin

## Next Steps

Now that you know the basics:

1. ✅ Create your first test flow
2. ✅ Experiment with the visual editor
3. ✅ Test thoroughly with Test Mode
4. ✅ Publish and activate when ready
5. ✅ Monitor client usage and feedback
6. ✅ Iterate and improve over time

## Examples to Try

### Simple Contact Intake

1. Start node
2. "What type of visa are you interested in?" (Multiple choice)
3. "Tell us about your situation" (Text input)
4. "When do you need to travel?" (Date input)
5. Success node with "We'll contact you soon!"

### Conditional Screening

1. Start node
2. "Do you currently have a visa?" (Yes/No)
   - **Yes** → "What type of visa?"
   - **No** → "Have you applied before?"
3. Continue based on responses
4. End with appropriate message

---

**Ready to get started?** Head to the **Flows** page and create your first flow! 🚀

---

*Last Updated: January 12, 2026*  
*Questions? Contact your Super Admin or support team*
