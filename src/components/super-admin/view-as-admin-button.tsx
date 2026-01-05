"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function ViewAsAdminButton({ 
  organizationId, 
  organizationName 
}: { 
  organizationId: string;
  organizationName: string;
}) {
  const router = useRouter();

  const handleSwitch = async () => {
    try {
      const response = await fetch("/super-admin/organizations/switch-context", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizationId }),
      });

      if (!response.ok) {
        throw new Error("Failed to switch organization context");
      }

      toast.success(`Viewing as ${organizationName}`);
      // Refresh to ensure server components re-render with new cookie context
      router.refresh();
      router.push("/admin");
    } catch (error) {
      console.error("Error switching context:", error);
      toast.error("Failed to switch organization context");
    }
  };

  return (
    <Button 
      onClick={handleSwitch} 
      variant="default" 
      size="sm" 
      className="bg-blue-600 text-white hover:bg-blue-700"
    >
      View as Admin
    </Button>
  );
}

