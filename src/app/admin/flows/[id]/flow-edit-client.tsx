"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Save, Workflow } from "lucide-react";
import { useState, useTransition } from "react";
import { updateFlow } from "../actions";
import { useRouter } from "next/navigation";
import type { Flow } from "@/lib/db/schema";
import { toast } from "sonner";
import { FlowRenderer } from "@/components/flow-renderer";
import { AdminMobileNav } from "@/components/admin-mobile-nav";

interface FlowEditClientProps {
  flow: Flow;
}

export default function FlowEditClient({ flow }: FlowEditClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState(flow.name);
  const [description, setDescription] = useState(flow.description || "");
  const [content, setContent] = useState(flow.content);

  const handleSave = () => {
    startTransition(async () => {
      try {
        await updateFlow(flow.id, {
          name,
          description,
          content,
        });
        
        toast.success("Flow updated", {
          description: "Your changes have been saved",
        });
        
        router.push("/admin/flows");
      } catch (error) {
        toast.error("Update failed", {
          description: "There was an error saving your changes",
        });
      }
    });
  };

  const handleCancel = () => {
    router.push("/admin/flows");
  };

  const handleVisualBuilder = () => {
    router.push(`/admin/flows-editor/${flow.id}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminMobileNav />
      <div className="container mx-auto p-6 pb-24 md:pb-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCancel}
              disabled={isPending}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <h1 className="text-3xl font-bold">Edit Flow</h1>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={handleVisualBuilder}
              disabled={isPending}
            >
              <Workflow className="h-4 w-4 mr-2" />
              Visual Builder
            </Button>
            <Button onClick={handleSave} disabled={isPending}>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Form Section */}
          <Card className="p-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Flow Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter flow name"
                disabled={isPending}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter flow description"
                disabled={isPending}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Markdown Content</Label>
              <textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full min-h-[400px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 font-mono"
                placeholder="Enter markdown content"
                disabled={isPending}
              />
            </div>
          </Card>

          {/* Interactive Flow Preview */}
          <div className="space-y-4">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Interactive Flow Preview</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Test your flow as users will experience it
              </p>
            </Card>
            <FlowRenderer 
              markdown={content}
              flowId={flow.id}
              flowName={name}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
