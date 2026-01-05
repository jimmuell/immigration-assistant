# UI/UX Guidelines for Immigration Assistant

## Custom Dialog Messages

**IMPORTANT: Never use default system messages (alert, confirm, prompt) in this application.**

### Use shadcn/ui Components for User Feedback

Always use the shadcn/ui components provided in the application:

#### 1. Sonner Toasts for Notifications
Use `toast` from `sonner` for success messages, errors, and general notifications:

```typescript
import { toast } from "sonner";

// Success notification
toast.success("Success", {
  description: "Your action completed successfully",
});

// Error notification
toast.error("Error", {
  description: "Something went wrong",
});

// Info notification
toast.info("Information", {
  description: "Here's some information",
});

// Warning notification
toast.warning("Warning", {
  description: "Please be careful",
});
```

#### 2. Alert Dialogs for Confirmations
Use `AlertDialog` component from shadcn/ui for confirmations and important decisions:

```typescript
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Example: Delete confirmation
<AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
      <AlertDialogDescription>
        This action cannot be undone.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction onClick={handleConfirm}>
        Confirm
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

### Required Setup

1. **Sonner Toaster Component**: Already added to root layout (`/src/app/layout.tsx`)
2. **shadcn/ui Components**: Available in `/src/components/ui/`
   - `alert-dialog.tsx` - For confirmations (shadcn/ui)
   - `sonner.tsx` - Toast notifications (Sonner)
   - Installed via `pnpm dlx shadcn@latest add [component-name]`

### DO NOT Use:
- ❌ `alert()`
- ❌ `confirm()`
- ❌ `prompt()`
- ❌ `window.alert()`
- ❌ `window.confirm()`
- ❌ Any browser default dialog methods

### DO Use:
- ✅ `toast.success()` / `toast.error()` / `toast.info()` / `toast.warning()` for notifications
- ✅ `<AlertDialog>` from shadcn/ui for confirmations
- ✅ Custom modal components for complex interactions

### Example Implementation

See `/src/app/admin/flows/flows-client.tsx` for a complete example of:
- Sonner toast notifications for success/error messages
- AlertDialog for delete confirmations
- Proper error handling with custom UI feedback

### Benefits
- Consistent user experience across the application
- Better styling and branding
- Accessibility support built-in (ARIA compliant)
- Mobile-friendly dialogs
- Better UX with animations and transitions
- Official shadcn/ui components
- Beautiful and customizable
