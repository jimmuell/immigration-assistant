import { Card } from "@/components/ui/card";
import { CheckCircle, Send } from "lucide-react";
import { getReleasedScreenings } from "../completed/actions";
import { ReleasedScreeningsClient } from "./released-screenings-client";
import { ClientMobileNav } from "@/components/client-mobile-nav";

export default async function ReleasedScreeningsPage() {
  const screenings = await getReleasedScreenings();

  return (
    <div className="h-full flex flex-col bg-gray-50 pb-20 md:pb-0">
      <ClientMobileNav />
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-4xl px-4 py-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Released Screenings</h1>
            <p className="mt-1 text-sm text-gray-600">
              Screenings you've released to attorneys for review
            </p>
          </div>

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

          <Card className="mt-6 bg-blue-50 p-4 border-blue-200">
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
    </div>
  );
}

