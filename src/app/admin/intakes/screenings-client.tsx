"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Calendar, Trash2, UserCheck } from "lucide-react";
import { useState } from "react";
import { deleteScreening, assignScreeningToAttorney } from "./actions";
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
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Screening {
  id: string;
  flowName: string;
  submissionId: string;
  responses: string;
  status: string;
  createdAt: Date;
  userName: string | null;
  userEmail: string | null;
  userId: string;
  assignedAttorneyId: string | null;
}

interface Attorney {
  id: string;
  name: string | null;
  email: string;
}

interface ScreeningsClientProps {
  screenings: Screening[];
  attorneys: Attorney[];
}

export function ScreeningsClient({ screenings, attorneys }: ScreeningsClientProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [assigningScreeningId, setAssigningScreeningId] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!deleteId) return;

    setIsDeleting(true);
    try {
      const result = await deleteScreening(deleteId);
      
      if (result.success) {
        toast.success('Screening deleted successfully');
        setDeleteId(null);
      } else {
        toast.error(result.error || 'Failed to delete screening');
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleAssignAttorney = async (screeningId: string, attorneyId: string) => {
    setAssigningScreeningId(screeningId);
    try {
      const result = await assignScreeningToAttorney(
        screeningId, 
        attorneyId === 'unassign' ? null : attorneyId
      );
      
      if (result.success) {
        toast.success(attorneyId === 'unassign' ? 'Attorney unassigned' : 'Attorney assigned successfully');
      } else {
        toast.error(result.error || 'Failed to assign attorney');
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
    } finally {
      setAssigningScreeningId(null);
    }
  };

  if (screenings.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center py-12 text-muted-foreground">
          <CheckCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <p className="text-lg mb-2">No screenings submitted yet</p>
          <p className="text-sm">Client screening submissions will appear here</p>
        </div>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {screenings.map((screening) => {
          const parsedResponses = JSON.parse(screening.responses) as Array<{
            question: string;
            answer: string;
          }>;
          const formattedDate = new Date(screening.createdAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          });
          const assignedAttorney = attorneys.find(a => a.id === screening.assignedAttorneyId);

          return (
            <Card key={screening.id} className="p-6">
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <h3 className="text-xl font-semibold">{screening.flowName}</h3>
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                        screening.status === 'assigned' || screening.status === 'in_progress'
                          ? 'bg-blue-100 text-blue-700'
                          : screening.status === 'quoted'
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-green-100 text-green-700'
                      }`}>
                        {screening.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>Completed {formattedDate}</span>
                      </div>
                      {screening.userEmail && (
                        <span>
                          by {screening.userName || screening.userEmail}
                        </span>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => setDeleteId(screening.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                {/* Attorney Assignment */}
                <div className="flex items-center gap-3 bg-blue-50 p-3 rounded">
                  <UserCheck className="h-5 w-5 text-blue-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-700 mb-1">Assign to Attorney</p>
                    <Select
                      value={screening.assignedAttorneyId || 'unassigned'}
                      onValueChange={(value) => handleAssignAttorney(screening.id, value)}
                      disabled={assigningScreeningId === screening.id}
                    >
                      <SelectTrigger className="w-full bg-white">
                        <SelectValue placeholder="Select an attorney" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unassigned">
                          <span className="text-gray-500">Not assigned</span>
                        </SelectItem>
                        {attorneys.map((attorney) => (
                          <SelectItem key={attorney.id} value={attorney.id}>
                            {attorney.name || attorney.email}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {assignedAttorney && (
                    <div className="text-sm text-green-600 font-medium">
                      ✓ Assigned
                    </div>
                  )}
                </div>

                {/* Metadata */}
                <div className="text-sm text-muted-foreground bg-gray-50 p-3 rounded">
                  <p>
                    <span className="font-medium">Questions answered:</span>{' '}
                    {parsedResponses.length}
                  </p>
                  <p className="mt-1">
                    <span className="font-medium">Submission ID:</span>{' '}
                    <code className="text-xs">{screening.submissionId}</code>
                  </p>
                </div>

                {/* Response Summary */}
                <details className="group">
                  <summary className="cursor-pointer text-sm font-medium text-blue-600 hover:text-blue-700 list-none flex items-center gap-2">
                    <span className="group-open:rotate-90 transition-transform">▶</span>
                    Response Summary
                  </summary>
                  <div className="mt-4 space-y-3 pl-4 border-l-2 border-gray-200">
                    {parsedResponses.map((response, idx) => (
                      <div key={idx} className="space-y-1">
                        <p className="text-sm font-medium text-gray-700">
                          Q{idx + 1}: {response.question}
                        </p>
                        <p className="text-sm text-gray-600 pl-4">{response.answer}</p>
                      </div>
                    ))}
                  </div>
                </details>
              </div>
            </Card>
          );
        })}
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the screening
              submission and all associated responses.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
