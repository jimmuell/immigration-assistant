"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Scale, ArrowRight, LogOut, User, Users, FileCheck } from "lucide-react";
import { useSession, signOut } from "next-auth/react";

export function HeroSection() {
  const router = useRouter();
  const { data: session } = useSession();

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0f1a] via-[#111827] to-[#0f172a]">
      {/* Navigation */}
      <nav className="border-b border-gray-800/50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center">
                <Scale className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">LinkToLawyers</span>
            </div>
            <div className="flex items-center gap-3">
              {session ? (
                <>
                  <div className="flex items-center gap-2 px-3 py-2 bg-gray-800/50 rounded-lg">
                    <User className="h-4 w-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-200">
                      {session.user?.name || session.user?.email}
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    onClick={handleSignOut}
                    className="text-gray-300 hover:text-white border-gray-700 hover:bg-gray-800"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="ghost"
                    onClick={() => router.push("/login")}
                    className="text-gray-300 hover:text-white hover:bg-gray-800/50"
                  >
                    Sign In
                  </Button>
                  <Button
                    onClick={() => router.push("/signup")}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Sign Up
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Content */}
      <div className="container mx-auto px-6 pt-24 pb-16">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-800/60 border border-gray-700/50 mb-8">
            <span className="w-2 h-2 rounded-full bg-green-500"></span>
            <span className="text-sm font-medium text-gray-300">
              Compare free quotes from top attorneys
            </span>
          </div>

          {/* Main Headline */}
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
            Find the Right Lawyer.{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-600">
              Get Free Quotes.
            </span>
          </h1>

          <p className="text-lg text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">
            Describe your legal needs once and receive personalized quotes from
            qualified attorneys. Compare options, read reviews, and choose the best fit
            — all for free.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            {session ? (
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
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-lg px-8 py-6 rounded-xl"
              >
                Go to Dashboard
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            ) : (
              <>
                <Button
                  size="lg"
                  onClick={() => router.push("/signup")}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-lg px-8 py-6 rounded-xl"
                >
                  Get Started Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => router.push("/admin/attorneys/onboard")}
                  className="bg-transparent text-white border-2 border-gray-600 hover:bg-gray-800 hover:border-gray-500 font-semibold text-lg px-8 py-6 rounded-xl"
                >
                  Join as Attorney
                </Button>
              </>
            )}
          </div>

          {/* Feature Cards */}
          <div className="grid md:grid-cols-3 gap-6 mb-16">
            <div className="bg-[#1a1f2e] p-8 rounded-2xl border border-gray-800/50 text-center">
              <div className="w-14 h-14 bg-blue-500/20 rounded-xl flex items-center justify-center mb-5 mx-auto">
                <Users className="h-7 w-7 text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">
                Qualified Attorneys
              </h3>
              <p className="text-gray-400 leading-relaxed">
                Connect with experienced immigration lawyers who are verified and ready to help with your case.
              </p>
            </div>

            <div className="bg-[#1a1f2e] p-8 rounded-2xl border border-gray-800/50 text-center">
              <div className="w-14 h-14 bg-green-500/20 rounded-xl flex items-center justify-center mb-5 mx-auto">
                <FileCheck className="h-7 w-7 text-green-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">
                Free Quotes
              </h3>
              <p className="text-gray-400 leading-relaxed">
                Get free initial consultations and quotes from multiple attorneys to find the best fit for your needs.
              </p>
            </div>

            <div className="bg-[#1a1f2e] p-8 rounded-2xl border border-gray-800/50 text-center">
              <div className="w-14 h-14 bg-indigo-500/20 rounded-xl flex items-center justify-center mb-5 mx-auto">
                <Scale className="h-7 w-7 text-indigo-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">
                Simple Process
              </h3>
              <p className="text-gray-400 leading-relaxed">
                Tell us about your case, receive quotes from attorneys, and choose the one that&apos;s right for you.
              </p>
            </div>
          </div>

          {/* Trust Stats */}
          <div className="pt-8 border-t border-gray-800/50">
            <p className="text-sm text-gray-500 mb-6">Trusted by thousands of clients nationwide</p>
            <div className="flex flex-wrap justify-center gap-8 md:gap-16">
              <div className="text-center">
                <div className="text-4xl font-bold text-white mb-1">10K+</div>
                <div className="text-sm text-gray-500">Cases Matched</div>
              </div>
              <div className="hidden md:block w-px bg-gray-800"></div>
              <div className="text-center">
                <div className="text-4xl font-bold text-white mb-1">2,500+</div>
                <div className="text-sm text-gray-500">Attorneys</div>
              </div>
              <div className="hidden md:block w-px bg-gray-800"></div>
              <div className="text-center">
                <div className="text-4xl font-bold text-white mb-1">4.9/5</div>
                <div className="text-sm text-gray-500">Client Rating</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
