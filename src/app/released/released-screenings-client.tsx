"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock, Calendar, ArrowRight, FileText, User } from "lucide-react";
import Link from "next/link";

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

interface ReleasedScreeningsClientProps {
  screenings: ExtendedScreening[];
}

export function ReleasedScreeningsClient({ screenings }: ReleasedScreeningsClientProps) {
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(new Date(date));
  };

  return (
    <div className="space-y-4">
      {screenings.map((screening) => (
        <Card key={screening.id} className="p-4 hover:shadow-md transition-shadow border-l-4 border-l-blue-600">
          <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4">
            <div className="hidden sm:block rounded-full bg-blue-100 p-2 shrink-0">
              <Lock className="h-5 w-5 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm font-semibold text-gray-900">{screening.flowName}</h3>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
                  screening.status === 'submitted' ? 'bg-blue-100 text-blue-700' :
                  screening.status === 'assigned' ? 'bg-purple-100 text-purple-700' :
                  screening.status === 'in_progress' ? 'bg-yellow-100 text-yellow-700' :
                  screening.status === 'quoted' ? 'bg-green-100 text-green-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {screening.status.replace('_', ' ')}
                </span>
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                  <Lock className="h-3 w-3 inline mr-1" />
                  Locked
                </span>
              </div>
              <div className="mt-1 flex items-center gap-3 text-xs text-gray-500 flex-wrap">
                <div className="flex items-center gap-1">
                  <FileText className="h-3 w-3" />
                  <span>ID: {screening.submissionId}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  <span>Released {formatDate(screening.submittedForReviewAt || screening.createdAt)}</span>
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
                <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-xs text-green-700">
                  <strong>✓ Attorney Assigned:</strong> {screening.attorneyName} is reviewing your case
                </div>
              )}
              {!screening.assignedAttorneyId && (
                <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700">
                  <strong>⏳ Awaiting Assignment:</strong> An attorney will be assigned to review your screening soon
                </div>
              )}
            </div>
            <div className="sm:shrink-0">
              <Link href={`/released/${screening.id}`}>
                <Button variant="outline" size="sm" className="w-full sm:w-auto">
                  <span>View Details</span>
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

