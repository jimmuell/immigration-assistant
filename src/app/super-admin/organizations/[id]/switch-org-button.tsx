"use client";

import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function SwitchOrgButton({ 
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
      router.push("/admin");
    } catch (error) {
      console.error("Error switching context:", error);
      toast.error("Failed to switch organization context");
    }
  };

  return (
    <Button onClick={handleSwitch} size="lg" className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white">
      <Eye className="mr-2 h-5 w-5" />
      View as Admin
    </Button>
  );
}

