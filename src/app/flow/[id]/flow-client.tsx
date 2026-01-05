"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import type { Flow, Screening } from "@/lib/db/schema";
import { FlowRenderer } from "@/components/flow-renderer";

interface FlowClientProps {
  flow: Flow;
  savedScreening: Screening | null;
  userRole: string;
}

export default function FlowClient({ flow, savedScreening, userRole }: FlowClientProps) {
  const router = useRouter();

  const handleBack = () => {
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-6 max-w-3xl">
        <FlowRenderer 
          markdown={flow.content} 
          flowId={flow.id}
          flowName={flow.name}
          savedScreening={savedScreening}
          userRole={userRole}
        />
      </div>
    </div>
  );
}
