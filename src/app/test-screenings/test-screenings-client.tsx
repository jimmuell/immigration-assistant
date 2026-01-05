"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FlaskConical, Calendar, ArrowRight, FileText, Trash2, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { deleteTestScreening } from "./actions";
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

interface TestScreeningsClientProps {
  screenings: Screening[];
}

export function TestScreeningsClient({ screenings: initialScreenings }: TestScreeningsClientProps) {
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
    }).format(new Date(date));
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
      await deleteTestScreening(selectedScreening.id);
      setScreenings(screenings.filter(s => s.id !== selectedScreening.id));
      toast.success('Test screening deleted successfully');
      router.refresh();
    } catch (error) {
      console.error('Error deleting test screening:', error);
      toast.error('Failed to delete test screening', {
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
        {screenings.map((screening) => (
          <Card key={screening.id} className="p-4 border-2 border-amber-300 bg-amber-50 hover:shadow-md transition-shadow">
            <div className="flex items-start gap-4">
              <div className="rounded-full bg-amber-200 p-2">
                <FlaskConical className="h-5 w-5 text-amber-700" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-gray-900">{screening.flowName}</h3>
                  <span className="rounded-full bg-amber-200 px-2 py-0.5 text-xs font-bold text-amber-900 uppercase">
                    TEST
                  </span>
                  <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs font-medium text-gray-700 capitalize">
                    {screening.status}
                  </span>
                </div>
                <p className="mt-1 text-xs text-amber-800 font-medium flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  This is a test screening and should be deleted once testing is complete
                </p>
                <div className="mt-2 flex items-center gap-3 text-xs text-gray-600">
                  <div className="flex items-center gap-1">
                    <FileText className="h-3 w-3" />
                    <span>ID: {screening.submissionId}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>{formatDate(screening.createdAt)}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Link href={`/completed/${screening.id}`}>
                  <Button variant="ghost" size="sm" className="hover:bg-amber-100">
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
            <AlertDialogTitle>Delete Test Screening?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this test screening "{selectedScreening?.flowName}"? This action cannot be undone.
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

