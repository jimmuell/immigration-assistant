import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bookmark, Calendar } from "lucide-react";
import { getUserDraftScreenings } from "./actions";
import Link from "next/link";
import { SavedScreeningsClient } from "./saved-screenings-client";
import { ClientMobileNav } from "@/components/client-mobile-nav";

export default async function SavedPage() {
  const draftScreenings = await getUserDraftScreenings();

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(new Date(date));
  };

  return (
    <div className="h-full flex flex-col bg-gray-50 pb-20 md:pb-0">
      <ClientMobileNav />
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-4xl px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Saved Screenings</h1>
          <p className="mt-1 text-sm text-gray-600">
            Resume your in-progress screenings from where you left off
          </p>
        </div>

        {draftScreenings.length === 0 ? (
          <Card className="p-12 text-center">
            <Bookmark className="mx-auto mb-4 h-12 w-12 text-gray-400" />
            <h3 className="mb-2 text-lg font-semibold text-gray-900">
              No saved screenings yet
            </h3>
            <p className="mb-6 text-sm text-gray-600">
              Your in-progress screenings will appear here when you save them
            </p>
            <Link href="/">
              <Button>Start a New Screening</Button>
            </Link>
          </Card>
        ) : (
          <SavedScreeningsClient screenings={draftScreenings} />
        )}

        <Card className="mt-6 bg-blue-50 p-4 border-blue-200">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-blue-100 p-2">
              <Bookmark className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-blue-900">Save Your Progress</h3>
              <p className="mt-1 text-sm text-blue-700">
                You can save your screening progress at any time and resume later. Your answers will be kept safe.
              </p>
            </div>
          </div>
        </Card>
        </div>
      </div>
    </div>
  );
}
