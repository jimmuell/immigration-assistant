"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { UserMinus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface UnassignAdminButtonProps {
  organizationId: string;
  adminId: string;
  adminName: string;
  adminEmail: string;
}

export function UnassignAdminButton({
  organizationId,
  adminId,
  adminName,
  adminEmail,
}: UnassignAdminButtonProps) {
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const handleUnassign = async () => {
    setLoading(true);

    try {
      const response = await fetch(
        `/super-admin/organizations/${organizationId}/unassign-admin/api?adminId=${adminId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to unassign admin");
      }

      toast.success("Admin unassigned successfully");
      setOpen(false);
      router.refresh();
    } catch (error) {
      console.error("Error unassigning admin:", error);
      toast.error(error instanceof Error ? error.message : "Failed to unassign admin");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="bg-white text-red-600 hover:bg-red-50 hover:text-red-700 border-red-200"
        >
          <UserMinus className="h-4 w-4 mr-1" />
          Unassign
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="bg-white">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-gray-900">Unassign Admin</AlertDialogTitle>
          <AlertDialogDescription className="text-gray-600">
            Are you sure you want to unassign <strong>{adminName || adminEmail}</strong> as an admin? 
            This will permanently delete their account and they will lose access to the organization.
            This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel 
            disabled={loading}
            className="bg-white text-gray-900 hover:bg-gray-100"
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleUnassign}
            disabled={loading}
            className="bg-red-600 text-white hover:bg-red-700"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Unassigning...
              </>
            ) : (
              "Unassign Admin"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

