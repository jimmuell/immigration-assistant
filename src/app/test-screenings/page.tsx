import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FlaskConical, AlertTriangle } from "lucide-react";
import { getTestScreenings } from "./actions";
import Link from "next/link";
import { TestScreeningsClient } from "./test-screenings-client";
import { requireRole } from "@/lib/role-middleware";

export default async function TestScreeningsPage() {
  await requireRole(['org_admin', 'staff', 'super_admin']);
  const screenings = await getTestScreenings();

  return (
    <div className="h-full flex flex-col bg-gray-50 pb-20 md:pb-0">
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-4xl px-4 py-6">
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <FlaskConical className="h-7 w-7 text-amber-600" />
              <h1 className="text-2xl font-bold text-gray-900">Test Screenings</h1>
            </div>
            <p className="mt-1 text-sm text-gray-600">
              Test screenings created for flow testing and demonstrations
            </p>
          </div>

          {/* Warning Banner */}
          <Card className="mb-6 bg-amber-50 border-2 border-amber-300 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-amber-900">Test Mode Active</h3>
                <p className="mt-1 text-sm text-amber-800">
                  These screenings are marked as test submissions and are kept separate from client screenings. 
                  Please delete test screenings after you're done testing to keep the system clean.
                </p>
              </div>
            </div>
          </Card>

          {screenings.length === 0 ? (
            <Card className="p-12 text-center">
              <FlaskConical className="mx-auto mb-4 h-12 w-12 text-gray-400" />
              <h3 className="mb-2 text-lg font-semibold text-gray-900">
                No test screenings yet
              </h3>
              <p className="mb-6 text-sm text-gray-600">
                Test screenings will appear here when you complete a flow in test mode
              </p>
              <Link href="/admin/flows">
                <Button>Go to Flows</Button>
              </Link>
            </Card>
          ) : (
            <TestScreeningsClient screenings={screenings} />
          )}

          <Card className="mt-6 bg-blue-50 p-4 border-blue-200">
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-blue-100 p-2">
                <FlaskConical className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-blue-900">How to Create Test Screenings</h3>
                <p className="mt-1 text-sm text-blue-700">
                  When starting a flow as an admin or staff member, check the "Test Mode" box 
                  on the start screen. This will mark the screening as a test and keep it separate 
                  from real client submissions.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

