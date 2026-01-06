"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Calendar, ArrowRight, FileText, Trash2, Edit, Lock, Send, User } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { deleteScreening, submitForReview } from "./actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
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

interface ExtendedScreening {
  id: string;
  flowId: string | null;
  flowName: string;
  submissionId: string;
  responses: string;
  status: string;
  isLocked: boolean;
  submittedForReviewAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  assignedAttorneyId: string | null;
  attorneyName: string | null;
  attorneyEmail: string | null;
}

interface ScreeningsClientProps {
  screenings: ExtendedScreening[];
}

export function ScreeningsClient({ screenings: initialScreenings }: ScreeningsClientProps) {
  const [screenings, setScreenings] = useState(initialScreenings);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [selectedScreening, setSelectedScreening] = useState<ExtendedScreening | null>(null);
  const router = useRouter();

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(new Date(date));
  };

  const canEdit = (screening: ExtendedScreening) => {
    return !screening.isLocked && ['draft', 'awaiting_client'].includes(screening.status);
  };

  const canSubmitForReview = (screening: ExtendedScreening) => {
    // Show "Release to Attorneys" button for any unlocked screening in the Completed tab
    // Since we filter to only unlocked screenings, this button should show for all of them
    return !screening.isLocked;
  };

  const handleDeleteClick = (screening: ExtendedScreening) => {
    setSelectedScreening(screening);
    setShowDeleteDialog(true);
  };

  const handleSubmitClick = (screening: ExtendedScreening) => {
    setSelectedScreening(screening);
    setShowSubmitDialog(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedScreening) return;
    
    setDeletingId(selectedScreening.id);
    setShowDeleteDialog(false);
    
    try {
      await deleteScreening(selectedScreening.id);
      setScreenings(screenings.filter(s => s.id !== selectedScreening.id));
      toast.success('Screening deleted successfully');
      router.refresh();
    } catch (error) {
      console.error('Error deleting screening:', error);
      toast.error('Failed to delete screening', {
        description: 'Please try again later.',
      });
    } finally {
      setDeletingId(null);
      setSelectedScreening(null);
    }
  };

  const handleSubmitConfirm = async () => {
    if (!selectedScreening) return;
    
    setSubmittingId(selectedScreening.id);
    setShowSubmitDialog(false);
    
    try {
      const result = await submitForReview(selectedScreening.id);
      
      if (result.success) {
        setScreenings(screenings.map((s) => 
          s.id === selectedScreening.id 
            ? { ...s, status: 'submitted', isLocked: true, submittedForReviewAt: new Date() }
            : s
        ));
        toast.success('Screening released to attorneys for review');
        router.refresh();
      } else {
        toast.error(result.error || 'Failed to release screening');
      }
    } catch (error) {
      console.error('Error submitting for review:', error);
      toast.error('Failed to submit for review', {
        description: 'Please try again later.',
      });
    } finally {
      setSubmittingId(null);
      setSelectedScreening(null);
    }
  };

  return (
    <>
      <div className="space-y-4">
        {screenings.map((screening) => (
          <Card key={screening.id} className="p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start gap-4">
              <div className="rounded-full bg-green-100 p-2">
                {screening.isLocked ? (
                  <Lock className="h-5 w-5 text-gray-600" />
                ) : (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-gray-900">{screening.flowName}</h3>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
                    screening.status === 'submitted' ? 'bg-blue-100 text-blue-700' :
                    screening.status === 'quoted' ? 'bg-purple-100 text-purple-700' :
                    screening.status === 'awaiting_client' ? 'bg-orange-100 text-orange-700' :
                    screening.status === 'draft' ? 'bg-gray-100 text-gray-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {screening.status.replace('_', ' ')}
                  </span>
                  {screening.isLocked && (
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                      <Lock className="h-3 w-3 inline mr-1" />
                      Locked
                    </span>
                  )}
                </div>
                <div className="mt-1 flex items-center gap-3 text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <FileText className="h-3 w-3" />
                    <span>ID: {screening.submissionId}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>{formatDate(screening.createdAt)}</span>
                  </div>
                  {screening.responses && (() => {
                    try {
                      const parsed = JSON.parse(screening.responses);
                      const count = Array.isArray(parsed) ? parsed.length : 0;
                      return (
                        <div className="flex items-center gap-1">
                          <span className="font-medium">{count} questions answered</span>
                        </div>
                      );
                    } catch {
                      return null;
                    }
                  })()}
                </div>
                {screening.assignedAttorneyId && screening.attorneyName && (
                  <div className="mt-2 p-2 bg-purple-50 border border-purple-200 rounded text-xs text-purple-700">
                    <strong>👨‍⚖️ Assigned to:</strong> {screening.attorneyName}
                  </div>
                )}
                {screening.status === 'awaiting_client' && (
                  <div className="mt-2 p-2 bg-orange-50 border border-orange-200 rounded text-xs text-orange-700">
                    <strong>Action Required:</strong> Your attorney has requested additional information or changes.
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                {canSubmitForReview(screening) && (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => handleSubmitClick(screening)}
                    disabled={submittingId === screening.id}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Send className="h-4 w-4 mr-1" />
                    Release to Attorneys
                  </Button>
                )}
                {canEdit(screening) && (
                  <Link href={`/flow/${screening.flowId}`}>
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                  </Link>
                )}
                <Link href={`/completed/${screening.id}`}>
                  <Button variant="ghost" size="sm">
                    <span>View</span>
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteClick(screening)}
                  disabled={deletingId === screening.id}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Screening?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedScreening?.flowName}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Release to Attorneys?</AlertDialogTitle>
            <AlertDialogDescription>
              Once released, you will not be able to edit your responses. Your screening will be locked 
              and sent to our attorneys for review. Make sure all your information is correct before proceeding.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submittingId !== null}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSubmitConfirm}
              disabled={submittingId !== null}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {submittingId ? 'Releasing...' : 'Release to Attorneys'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
