import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Calendar, ArrowRight, FileText } from "lucide-react";
import { getUserScreenings } from "./actions";
import Link from "next/link";
import { ScreeningsClient } from "./screenings-client";
import { ClientMobileNav } from "@/components/client-mobile-nav";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";

export default async function CompletedPage() {
  const screenings = await getUserScreenings();

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(new Date(date));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pb-24 md:pb-6">
      <ClientMobileNav />
      <div className="container mx-auto p-6 md:pt-8 space-y-6">
        <DashboardHeader title="Completed Screenings" />

        {screenings.length === 0 ? (
          <Card className="p-12 text-center">
            <CheckCircle className="mx-auto mb-4 h-12 w-12 text-gray-400" />
            <h3 className="mb-2 text-lg font-semibold text-gray-900">
              No completed screenings yet
            </h3>
            <p className="mb-6 text-sm text-gray-600">
              Your completed screenings will appear here
            </p>
            <Link href="/">
              <Button>Get Started</Button>
            </Link>
          </Card>
        ) : (
          <ScreeningsClient screenings={screenings} />
        )}

        <Card className="bg-blue-50 p-4 border-blue-200">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-blue-100 p-2">
              <CheckCircle className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-blue-900">Ready to Submit?</h3>
              <p className="mt-1 text-sm text-blue-700">
                Review your completed screenings carefully. When ready, click "Submit for Review"
                to release them to our attorneys. Once released, screenings will move to the "Released" tab.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
