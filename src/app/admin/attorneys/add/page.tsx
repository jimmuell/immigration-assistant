"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

const SPECIALTIES = [
  "Family-Based Immigration",
  "Employment-Based Immigration",
  "Asylum & Refugee Law",
  "Deportation Defense",
  "Citizenship & Naturalization",
  "Student & Exchange Visas",
  "Business Immigration",
  "Investor Visas",
  "VAWA Cases",
  "Other"
];

export default function AddAttorneyPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    name: "",
    password: "",
    bio: "",
    specialties: [] as string[],
    yearsOfExperience: "",
    barNumber: "",
    barState: "",
  });

  const handleSpecialtyToggle = (specialty: string) => {
    setFormData(prev => ({
      ...prev,
      specialties: prev.specialties.includes(specialty)
        ? prev.specialties.filter(s => s !== specialty)
        : [...prev.specialties, specialty]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.email || !formData.name || !formData.password) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (formData.password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/admin/attorneys/onboard/api", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          yearsOfExperience: formData.yearsOfExperience ? parseInt(formData.yearsOfExperience) : undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create attorney");
      }

      toast.success("Attorney added successfully!");
      router.push("/admin/users?tab=attorneys");
    } catch (error) {
      console.error("Error creating attorney:", error);
      toast.error(error instanceof Error ? error.message : "Failed to create attorney");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <Link href="/admin/users?tab=attorneys">
          <Button variant="ghost" className="mb-6 text-gray-700 hover:text-gray-900">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Users
          </Button>
        </Link>

        <Card className="p-8 bg-white">
          <h1 className="text-3xl font-bold mb-2 text-gray-900">Add Attorney</h1>
          <p className="text-gray-600 mb-8">
            Add a new attorney to your organization
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900">Basic Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name" className="text-gray-900">Full Name *</Label>
                  <Input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="John Doe"
                    required
                    className="bg-white text-gray-900 border-gray-300"
                  />
                </div>

                <div>
                  <Label htmlFor="email" className="text-gray-900">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    placeholder="john@example.com"
                    required
                    className="bg-white text-gray-900 border-gray-300"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="password" className="text-gray-900">Password *</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  placeholder="Minimum 8 characters"
                  required
                  minLength={8}
                  className="bg-white text-gray-900 border-gray-300"
                />
                <p className="text-sm text-gray-600 mt-1">
                  The attorney will use this password to log in
                </p>
              </div>
            </div>

            {/* Professional Details */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900">Professional Details</h2>
              
              <div>
                <Label htmlFor="bio" className="text-gray-900">Bio</Label>
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => setFormData({...formData, bio: e.target.value})}
                  placeholder="Brief professional biography..."
                  rows={4}
                  className="bg-white text-gray-900 border-gray-300"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="yearsOfExperience" className="text-gray-900">Years of Experience</Label>
                  <Input
                    id="yearsOfExperience"
                    type="number"
                    min="0"
                    value={formData.yearsOfExperience}
                    onChange={(e) => setFormData({...formData, yearsOfExperience: e.target.value})}
                    placeholder="10"
                    className="bg-white text-gray-900 border-gray-300"
                  />
                </div>

                <div>
                  <Label htmlFor="barState" className="text-gray-900">Bar State</Label>
                  <Input
                    id="barState"
                    type="text"
                    value={formData.barState}
                    onChange={(e) => setFormData({...formData, barState: e.target.value})}
                    placeholder="CA"
                    className="bg-white text-gray-900 border-gray-300"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="barNumber" className="text-gray-900">Bar Number</Label>
                <Input
                  id="barNumber"
                  type="text"
                  value={formData.barNumber}
                  onChange={(e) => setFormData({...formData, barNumber: e.target.value})}
                  placeholder="123456"
                  className="bg-white text-gray-900 border-gray-300"
                />
              </div>

              <div>
                <Label className="text-gray-900 mb-3 block">Practice Areas</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {SPECIALTIES.map((specialty) => (
                    <label
                      key={specialty}
                      className="flex items-center gap-2 p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors bg-white"
                    >
                      <input
                        type="checkbox"
                        checked={formData.specialties.includes(specialty)}
                        onChange={() => handleSpecialtyToggle(specialty)}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm text-gray-900">{specialty}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <Button
                type="submit"
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
              >
                {loading ? "Adding Attorney..." : "Add Attorney"}
              </Button>
              <Link href="/admin/users?tab=attorneys" className="flex-1">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full bg-white text-gray-700 border-gray-300"
                >
                  Cancel
                </Button>
              </Link>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}

