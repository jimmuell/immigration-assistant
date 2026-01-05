"use client";

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Scale, ArrowLeft } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  const handleRoleLogin = async (role: 'client' | 'attorney' | 'super_admin') => {
    setError("");
    setIsLoading(true);

    // Prefill credentials based on role
    const credentials = 
      role === 'client' 
        ? { email: 'testclient@test.com', password: 'TestClient123!' }
        : role === 'attorney'
        ? { email: 'testattorney@test.com', password: '123456' }
        : { email: 'superadmin@immigration-assistant.com', password: 'SuperAdmin123!' };
    
    setFormData(credentials);

    try {
      const result = await signIn("credentials", {
        email: credentials.email,
        password: credentials.password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid email or password");
      } else {
        router.push("/");
        router.refresh();
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid email or password");
      } else {
        router.push("/");
        router.refresh();
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-6 py-4">
          <Link href="/landing" className="flex items-center gap-2 hover:opacity-80 transition-opacity w-fit">
            <ArrowLeft className="h-5 w-5 text-gray-600" />
            <Scale className="h-7 w-7 text-blue-600" />
            <span className="text-xl font-bold text-gray-900">LinkToLawyers</span>
          </Link>
        </div>
      </div>

      <div className="flex min-h-[calc(100vh-73px)] items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-lg border-2">
        <CardHeader className="space-y-1">
          <CardTitle className="text-3xl font-bold text-center text-gray-900">
            Welcome back
          </CardTitle>
          <CardDescription className="text-center text-base text-gray-600">
            Sign in to LinkToLawyers and connect with your attorney
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 text-sm font-medium text-red-700 bg-red-50 border-2 border-red-300 rounded-md">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-900 font-medium">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="Enter email"
                value={formData.email}
                onChange={handleChange}
                disabled={isLoading}
                required
                autoComplete="email"
                className="text-gray-900 placeholder:text-gray-400"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-900 font-medium">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Enter password"
                value={formData.password}
                onChange={handleChange}
                disabled={isLoading}
                required
                autoComplete="current-password"
                className="text-gray-900 placeholder:text-gray-400"
              />
            </div>
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold"
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <div className="w-full space-y-3">
              <p className="text-sm font-medium text-center text-gray-700">Quick sign in as:</p>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  type="button"
                  onClick={() => handleRoleLogin('client')}
                  disabled={isLoading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isLoading ? "..." : "Client"}
                </Button>
                <Button
                  type="button"
                  onClick={() => handleRoleLogin('attorney')}
                  disabled={isLoading}
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                >
                  {isLoading ? "..." : "Attorney"}
                </Button>
              </div>
              <Button
                type="button"
                onClick={() => handleRoleLogin('super_admin')}
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold"
              >
                {isLoading ? "..." : "🔐 Super Admin"}
              </Button>
            </div>
            <p className="text-sm text-center text-gray-600">
              Don&apos;t have an account?{" "}
              <Link href="/signup" className="text-blue-600 hover:underline font-semibold">
                Sign up
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
      </div>
    </div>
  );
}
