import { Card } from "@/components/ui/card";
import { CheckCircle, Send } from "lucide-react";
import { getReleasedScreenings } from "../screenings/actions";
import { ReleasedScreeningsClient } from "./released-screenings-client";
import { ClientMobileNav } from "@/components/client-mobile-nav";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";

export default async function ReleasedScreeningsPage() {
  const screenings = await getReleasedScreenings();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pb-24 md:pb-6">
      <ClientMobileNav />
      <div className="container mx-auto p-6 md:pt-8 space-y-6">
        <DashboardHeader title="Released Screenings" />

        {screenings.length === 0 ? (
          <Card className="p-12 text-center">
            <Send className="mx-auto mb-4 h-12 w-12 text-gray-400" />
            <h3 className="mb-2 text-lg font-semibold text-gray-900">
              No released screenings yet
            </h3>
            <p className="text-sm text-gray-600">
              When you release a screening for attorney review, it will appear here
            </p>
          </Card>
        ) : (
          <ReleasedScreeningsClient screenings={screenings} />
        )}

        <Card className="bg-blue-50 p-4 border-blue-200">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-blue-100 p-2">
              <CheckCircle className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-blue-900">In Attorney Review</h3>
              <p className="mt-1 text-sm text-blue-700">
                Once released, your screenings are locked and being reviewed by attorneys.
                You'll be notified when an attorney has been assigned to your case.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
