"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Calendar, Trash2, UserCheck, FileText, AlertCircle } from "lucide-react";
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
  reviewedForAttorneyId: string | null;
}

interface Attorney {
  id: string;
  name: string | null;
  email: string;
}

interface ScreeningsClientProps {
  screenings: Screening[];
  attorneys: Attorney[];
  requireStaffPreScreening: boolean;
}

export function ScreeningsClient({ screenings, attorneys, requireStaffPreScreening }: ScreeningsClientProps) {
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
        attorneyId === 'unassigned' ? null : attorneyId
      );
      
      if (result.success) {
        toast.success(attorneyId === 'unassigned' ? 'Attorney unassigned' : 'Attorney assigned successfully');
      } else {
        toast.error(result.error || 'Failed to assign attorney');
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
    } finally {
      setAssigningScreeningId(null);
    }
  };

  // In gatekeeper mode, we care about reviewedForAttorneyId (staff assignment for review)
  // In marketplace mode, this doesn't matter as all screenings are visible
  const unassignedCount = screenings.filter(s => !s.reviewedForAttorneyId).length;
  const assignedCount = screenings.filter(s => s.reviewedForAttorneyId).length;

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
      {/* Contextual Banner */}
      {requireStaffPreScreening ? (
        <Card className="p-4 bg-purple-50 border-purple-200">
          <div className="flex items-start gap-3">
            <UserCheck className="h-5 w-5 text-purple-600 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-purple-900 mb-1">
                Staff Pre-Screening Mode Active
              </h3>
              <p className="text-sm text-purple-700 mb-3">
                <strong>Important:</strong> Attorneys can only see screenings you assign to them. 
                Unassigned screenings are completely hidden. Review and assign each screening to 
                make it visible to the appropriate attorney.
              </p>
              {/* Quick Stats */}
              <div className="flex gap-4 text-sm">
                {unassignedCount > 0 && (
                  <div className="px-3 py-1.5 bg-yellow-100 rounded flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-yellow-700" />
                    <span className="font-semibold text-yellow-900">{unassignedCount}</span>
                    <span className="text-yellow-700">Hidden (Unassigned)</span>
                  </div>
                )}
                {assignedCount > 0 && (
                  <div className="px-3 py-1.5 bg-green-100 rounded flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-700" />
                    <span className="font-semibold text-green-900">{assignedCount}</span>
                    <span className="text-green-700">Visible (Assigned)</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>
      ) : (
        <Card className="p-4 bg-blue-50 border-blue-200">
          <div className="flex items-start gap-3">
            <FileText className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-900 mb-1">Marketplace Mode</h3>
              <p className="text-sm text-blue-700">
                All screenings are visible to attorneys immediately. You can optionally assign 
                screenings to specific attorneys for organization and tracking purposes.
              </p>
            </div>
          </div>
        </Card>
      )}

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
          // In gatekeeper mode, we use reviewedForAttorneyId; in marketplace mode it doesn't matter
          const reviewedForAttorney = attorneys.find(a => a.id === screening.reviewedForAttorneyId);

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
                {requireStaffPreScreening ? (
                  /* Gatekeeper Mode - Required Assignment */
                  <div className={`flex items-center gap-3 p-3 rounded border-2 ${
                    screening.reviewedForAttorneyId 
                      ? 'bg-green-50 border-green-300' 
                      : 'bg-yellow-50 border-yellow-300'
                  }`}>
                    <UserCheck className={`h-5 w-5 ${
                      screening.reviewedForAttorneyId ? 'text-green-600' : 'text-yellow-600'
                    }`} />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-700 mb-1">
                        Assign to Attorney <span className="text-red-600">*Required</span>
                      </p>
                      {!screening.reviewedForAttorneyId && (
                        <p className="text-xs text-yellow-800 mb-2 font-medium flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          Hidden from all attorneys until assigned
                        </p>
                      )}
                      {screening.reviewedForAttorneyId && (
                        <p className="text-xs text-green-700 mb-2 font-medium flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" />
                          Visible to assigned attorney
                        </p>
                      )}
                      <Select
                        value={screening.reviewedForAttorneyId || 'unassigned'}
                        onValueChange={(value) => handleAssignAttorney(screening.id, value)}
                        disabled={assigningScreeningId === screening.id}
                      >
                        <SelectTrigger className="w-full bg-white">
                          <SelectValue placeholder="Select an attorney">
                            {screening.reviewedForAttorneyId 
                              ? attorneys.find(a => a.id === screening.reviewedForAttorneyId)?.name || 
                                attorneys.find(a => a.id === screening.reviewedForAttorneyId)?.email
                              : "Not assigned"}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="unassigned">
                            <span className="font-medium text-gray-900">Unassign Attorney</span>
                          </SelectItem>
                          {attorneys.map((attorney) => (
                            <SelectItem key={attorney.id} value={attorney.id}>
                              {attorney.name || attorney.email}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ) : (
                  /* Marketplace Mode - Info Only */
                  <div className="flex items-center gap-3 bg-blue-50 p-3 rounded border border-blue-200">
                    <FileText className="h-5 w-5 text-blue-600" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-blue-900 mb-1">
                        Marketplace Mode Active
                      </p>
                      <p className="text-xs text-blue-700">
                        This screening is visible to all attorneys. Assignment happens when they accept a quote.
                      </p>
                    </div>
                  </div>
                )}

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
