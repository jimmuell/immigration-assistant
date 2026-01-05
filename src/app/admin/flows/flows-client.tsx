"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Upload, Edit, Trash2, Workflow, AlertCircle, Eye } from "lucide-react";
import { useState, useRef, useTransition } from "react";
import { createFlow, updateFlow, deleteFlow, toggleFlowActive } from "./actions";
import type { Flow } from "@/lib/db/schema";
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
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { AdminMobileNav } from "@/components/admin-mobile-nav";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface FlowsClientProps {
  initialFlows: Flow[];
  userRole?: string;
}

export default function FlowsClient({ initialFlows, userRole }: FlowsClientProps) {
  const router = useRouter();
  const [flows, setFlows] = useState<Flow[]>(initialFlows);
  const [isPending, startTransition] = useTransition();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [flowToDelete, setFlowToDelete] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Check if user is super admin
  const isSuperAdmin = userRole === 'super_admin';
  const isOrgAdmin = userRole === 'org_admin';
  const isStaff = userRole === 'staff';

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.md')) {
      toast.error("Invalid file type", {
        description: "Please upload a .md (Markdown) file",
      });
      return;
    }

    try {
      const content = await file.text();
      
      startTransition(async () => {
        try {
          const newFlow = await createFlow({
            name: file.name.replace('.md', ''),
            description: 'Imported from ' + file.name,
            content: content,
          });
          
          setFlows([...flows, newFlow]);
          
          toast.success("Flow imported successfully", {
            description: `${newFlow.name} has been added to your flows`,
          });
          
          // Reset file input
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        } catch (error) {
          toast.error("Import failed", {
            description: "There was an error importing the flow",
          });
        }
      });
    } catch (error) {
      console.error('Error reading file:', error);
      toast.error("Error reading file", {
        description: "Could not read the uploaded file",
      });
    }
  };

  const handleCreateFlow = () => {
    startTransition(async () => {
      try {
        const newFlow = await createFlow({
          name: 'New Flow',
          description: 'A new workflow',
          content: '# New Flow\n\nAdd your flow content here.',
        });
        
        setFlows([...flows, newFlow]);
        
        toast.success("Flow created", {
          description: "A new flow has been created",
        });
      } catch (error) {
        toast.error("Creation failed", {
          description: "There was an error creating the flow",
        });
      }
    });
  };

  const handleEditFlow = (flowId: string) => {
    router.push(`/admin/flows/${flowId}`);
  };

  const handleVisualEditor = (flowId: string) => {
    router.push(`/admin/flows-editor/${flowId}`);
  };

  const handlePreview = (flowId: string, flowName: string) => {
    router.push(`/flow/${flowId}`);
  };

  const confirmDelete = (flowId: string) => {
    setFlowToDelete(flowId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteFlow = () => {
    if (!flowToDelete) return;

    startTransition(async () => {
      try {
        await deleteFlow(flowToDelete);
        setFlows(flows.filter(flow => flow.id !== flowToDelete));
        
        toast.success("Flow deleted", {
          description: "The flow has been removed",
        });
      } catch (error) {
        toast.error("Deletion failed", {
          description: "There was an error deleting the flow",
        });
      } finally {
        setDeleteDialogOpen(false);
        setFlowToDelete(null);
      }
    });
  };

  const handleToggleActive = (flowId: string) => {
    startTransition(async () => {
      try {
        const updatedFlow = await toggleFlowActive(flowId);
        setFlows(flows.map(flow => 
          flow.id === flowId ? updatedFlow : flow
        ));
        
        toast.success(
          updatedFlow.isActive ? "Flow activated" : "Flow deactivated",
          {
            description: `${updatedFlow.name} is now ${updatedFlow.isActive ? "active" : "inactive"}`,
          }
        );
      } catch (error) {
        toast.error("Update failed", {
          description: "There was an error updating the flow status",
        });
      }
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <AdminMobileNav />
      <div className="container mx-auto p-6 pb-24 md:pb-6 md:pt-8 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Flows</h1>
        {isSuperAdmin && (
          <div className="flex gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".md"
              onChange={handleFileUpload}
              className="hidden"
            />
            <Button 
              variant="outline" 
              onClick={handleImportClick}
              disabled={isPending}
            >
              <Upload className="mr-2 h-4 w-4" />
              Import Flow
            </Button>
            <Button 
              onClick={handleCreateFlow}
              disabled={isPending}
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Flow
            </Button>
          </div>
        )}
      </div>
      
      {/* Informational message for non-super-admins */}
      {(isOrgAdmin || isStaff) && (
        <Alert className="bg-blue-50 border-blue-200">
          <AlertCircle className="h-4 w-4 text-blue-600" />
          <AlertTitle className="text-blue-900">Flow Management Restricted</AlertTitle>
          <AlertDescription className="text-blue-800">
            {isOrgAdmin && (
              <>
                Flow creation, editing, and management are restricted to Super Administrators to ensure platform consistency and quality.
                <br /><br />
                <strong>Need to create or modify a flow?</strong>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Contact your Super Admin</li>
                  <li>Email support@immigration-assistant.com</li>
                  <li>Describe your screening requirements</li>
                </ul>
                <br />
                <strong>You can still:</strong>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>View flows assigned to your organization (you're viewing them now)</li>
                  <li>Preview flows to test user experience (click "Preview" button below)</li>
                  <li>Use existing flows for client screenings (via Screenings section)</li>
                </ul>
              </>
            )}
            {isStaff && (
              <>
                You do not have permission to manage flows.
                <br /><br />
                <strong>For flow-related questions:</strong>
                <ol className="list-decimal list-inside mt-2 space-y-1">
                  <li>Contact your Organization Admin</li>
                  <li>Your admin will coordinate with the Super Admin or Support team</li>
                </ol>
                <br />
                <strong>You can still:</strong>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>View flows (you're viewing them now)</li>
                  <li>Preview flows (click "Preview" button below)</li>
                </ul>
              </>
            )}
          </AlertDescription>
        </Alert>
      )}

      {flows.length === 0 ? (
        <Card className="p-6">
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-lg mb-2">No flows created yet</p>
            <p className="text-sm">Create your first flow or import one to manage immigration workflows</p>
          </div>
        </Card>
      ) : (
        <Card className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Name</th>
                  <th className="text-left py-3 px-4">Description</th>
                  <th className="text-left py-3 px-4">Status</th>
                  <th className="text-left py-3 px-4">Last Updated</th>
                  <th className="text-left py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {flows.map((flow) => (
                  <tr key={flow.id} className="border-b hover:bg-muted/50">
                    <td className="py-3 px-4 font-medium">{flow.name}</td>
                    <td className="py-3 px-4 text-sm text-muted-foreground">
                      {flow.description || 'No description'}
                    </td>
                    <td className="py-3 px-4">
                      {isSuperAdmin ? (
                        <Button
                          size="sm"
                          variant={flow.isActive ? "default" : "outline"}
                          onClick={() => handleToggleActive(flow.id)}
                          disabled={isPending}
                          className="min-w-[90px]"
                        >
                          {flow.isActive ? "Active" : "Inactive"}
                        </Button>
                      ) : (
                        <span className={`inline-flex items-center px-3 py-1 rounded-md text-sm font-medium ${
                          flow.isActive 
                            ? "bg-green-100 text-green-800" 
                            : "bg-gray-100 text-gray-800"
                        }`}>
                          {flow.isActive ? "Active" : "Inactive"}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-sm" suppressHydrationWarning>
                      {new Date(flow.updatedAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        {isSuperAdmin && (
                          <>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleVisualEditor(flow.id)}
                              disabled={isPending}
                              title="Visual Editor"
                            >
                              <Workflow className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEditFlow(flow.id)}
                              disabled={isPending}
                              title="Edit Content"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => confirmDelete(flow.id)}
                              disabled={isPending}
                              className="text-destructive hover:text-destructive"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        {!isSuperAdmin && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handlePreview(flow.id, flow.name)}
                            disabled={isPending}
                            title="Preview Flow"
                            className="gap-2"
                          >
                            <Eye className="h-4 w-4" />
                            Preview
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Flow</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this flow? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteFlow}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </div>
    </div>
  );
}
