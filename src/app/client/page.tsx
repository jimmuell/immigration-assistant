import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { flows } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, ArrowRight, Clock } from "lucide-react";
import { ClientMobileNav } from "@/components/client-mobile-nav";

export default async function ClientDashboard() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  // Get active flows
  const activeFlows = await db
    .select()
    .from(flows)
    .where(eq(flows.isActive, true))
    .orderBy(flows.createdAt);

  return (
    <div className="h-full flex flex-col bg-gray-50 pb-20 md:pb-0">
      <ClientMobileNav />
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-4xl px-4 py-6">
        {/* Welcome Section */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome, {session.user.name || "Client"}!
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Get started by selecting one of our immigration forms below
          </p>
        </div>

        {/* Available Forms */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Available Immigration Forms
          </h2>
          
          {activeFlows.length === 0 ? (
            <Card className="p-12 text-center">
              <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No Forms Available Yet
              </h3>
              <p className="text-sm text-gray-600">
                Our team is preparing immigration forms for you. Please check back soon!
              </p>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {activeFlows.map((flow) => (
                <Card 
                  key={flow.id} 
                  className="hover:border-blue-500 hover:shadow-md transition-all duration-200"
                >
                  <CardHeader>
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <FileText className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <CardTitle className="text-base text-gray-900 mb-1">
                          {flow.name}
                        </CardTitle>
                        {flow.description && (
                          <CardDescription className="text-xs text-gray-600">
                            {flow.description}
                          </CardDescription>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Link href={`/flow/${flow.id}`}>
                      <Button 
                        className="w-full"
                        size="sm"
                      >
                        Start Form
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Help Section */}
        <Card className="mt-6 bg-blue-50 p-4 border-blue-200">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-blue-100 p-2">
              <FileText className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-blue-900">Need Help?</h3>
              <p className="mt-1 text-sm text-blue-700">
                Complete any of the forms above to get started with your immigration process. 
                Once submitted, our attorneys will review your information and provide personalized guidance.
              </p>
            </div>
          </div>
        </Card>
        </div>
      </div>
    </div>
  );
}

