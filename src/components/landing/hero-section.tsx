"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Scale, Users, FileCheck, ArrowRight, LogOut, User } from "lucide-react";
import { useSession, signOut } from "next-auth/react";

export function HeroSection() {
  const router = useRouter();
  const { data: session } = useSession();

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Scale className="h-8 w-8 text-blue-600" />
              <span className="text-2xl font-bold text-gray-900">LinkToLawyers</span>
            </div>
            <div className="flex items-center gap-3">
              {session ? (
                // Show user info and sign out when authenticated
                <>
                  <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg">
                    <User className="h-4 w-4 text-gray-600" />
                    <span className="text-sm font-medium text-gray-900">
                      {session.user?.name || session.user?.email}
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    onClick={handleSignOut}
                    className="text-gray-700 hover:text-gray-900 border-gray-300"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </Button>
                </>
              ) : (
                // Show sign in button when not authenticated
                <Button
                  variant="ghost"
                  onClick={() => router.push("/login")}
                  className="text-gray-700 hover:text-gray-900 hover:bg-gray-100"
                >
                  Sign In
                </Button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Content */}
      <div className="container mx-auto px-6 pt-20 pb-24">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 border border-blue-200 mb-8">
            <span className="text-sm font-medium text-blue-800">
              Connect with qualified attorneys for free quotes
            </span>
          </div>

          {/* Main Headline */}
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Find Your Perfect <span className="text-blue-600">Legal Match</span>
          </h1>
          
          <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
            Connect with experienced immigration attorneys who understand your needs. 
            Get free quotes and find the right lawyer to guide you through your journey.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            {session ? (
              // Show dashboard button for authenticated users
              <Button
                size="lg"
                onClick={() => {
                  const role = session.user.role;
                  if (role === 'super_admin') {
                    router.push("/super-admin");
                  } else if (role === 'org_admin') {
                    router.push("/admin");
                  } else if (role === 'attorney') {
                    router.push("/attorney");
                  } else {
                    router.push("/client");
                  }
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-lg px-8 py-6 shadow-lg shadow-blue-600/30"
              >
                Go to Dashboard
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            ) : (
              // Show sign up buttons for unauthenticated users
              <>
                <Button
                  size="lg"
                  onClick={() => router.push("/signup")}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-lg px-8 py-6 shadow-lg shadow-blue-600/30"
                >
                  Get Started Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => router.push("/admin/attorneys/onboard")}
                  className="bg-white text-gray-700 border-2 border-gray-300 hover:bg-gray-50 font-semibold text-lg px-8 py-6"
                >
                  Join as Attorney
                </Button>
              </>
            )}
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-8 mt-20">
            <div className="bg-white p-8 rounded-2xl shadow-md border border-gray-100">
              <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center mb-4 mx-auto">
                <Users className="h-7 w-7 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Qualified Attorneys
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Connect with experienced immigration lawyers who are verified and ready to help with your case.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-md border border-gray-100">
              <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center mb-4 mx-auto">
                <FileCheck className="h-7 w-7 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Free Quotes
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Get free initial consultations and quotes from multiple attorneys to find the best fit for your needs.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-md border border-gray-100">
              <div className="w-14 h-14 bg-indigo-100 rounded-xl flex items-center justify-center mb-4 mx-auto">
                <Scale className="h-7 w-7 text-indigo-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Simple Process
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Tell us about your case, receive quotes from attorneys, and choose the one that's right for you.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="container mx-auto px-6 text-center">
          <p className="text-gray-400">
            © {new Date().getFullYear()} LinkToLawyers. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

