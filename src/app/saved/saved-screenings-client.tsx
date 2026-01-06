"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bookmark, Calendar, ArrowRight, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { deleteScreening } from "./actions";
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
import type { Screening } from "@/lib/db/schema";

interface SavedScreeningsClientProps {
  screenings: Screening[];
}

export function SavedScreeningsClient({ screenings: initialScreenings }: SavedScreeningsClientProps) {
  const [screenings, setScreenings] = useState(initialScreenings);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedScreening, setSelectedScreening] = useState<Screening | null>(null);
  const router = useRouter();

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(new Date(date));
  };

  const getQuestionsAnswered = (responses: string) => {
    try {
      const parsed = JSON.parse(responses);
      return Array.isArray(parsed) ? parsed.length : 0;
    } catch {
      return 0;
    }
  };

  const handleDeleteClick = (screening: Screening) => {
    setSelectedScreening(screening);
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedScreening) return;
    
    setDeletingId(selectedScreening.id);
    setShowDeleteDialog(false);
    
    try {
      await deleteScreening(selectedScreening.id);
      setScreenings(screenings.filter(s => s.id !== selectedScreening.id));
      toast.success('Saved screening deleted');
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

  return (
    <>
      <div className="space-y-4">
        {screenings.map((screening) => {
          const questionsAnswered = getQuestionsAnswered(screening.responses);
          
          return (
            <Card key={screening.id} className="p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4">
                <div className="rounded-lg bg-blue-100 p-2">
                  <Bookmark className="h-5 w-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900">{screening.flowName}</h3>
                    <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                      In Progress
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-3 text-xs text-gray-500">
                    <span>{questionsAnswered} {questionsAnswered === 1 ? 'question' : 'questions'} answered</span>
                    <span>•</span>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>Saved {formatDate(screening.updatedAt)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {screening.flowId && (
                    <Link href={`/flow/${screening.flowId}`}>
                      <Button variant="default" size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                        <span>Resume</span>
                        <ArrowRight className="ml-1 h-4 w-4" />
                      </Button>
                    </Link>
                  )}
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
          );
        })}
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Saved Screening?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete your progress on &ldquo;{selectedScreening?.flowName}&rdquo;? This action cannot be undone and all your answers will be lost.
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
    </>
  );
}
