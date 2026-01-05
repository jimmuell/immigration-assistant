"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function ClearContextButton() {
  const router = useRouter();

  const handleReturn = async () => {
    try {
      const response = await fetch("/super-admin/organizations/clear-context", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to clear organization context");
      }

      toast.success("Returned to Super Admin view");
      router.push("/super-admin");
    } catch (error) {
      console.error("Error clearing context:", error);
      toast.error("Failed to return to Super Admin view");
    }
  };

  return (
    <Button onClick={handleReturn} variant="secondary" size="sm">
      <ArrowLeft className="mr-2 h-4 w-4" />
      Return to Super Admin
    </Button>
  );
}

