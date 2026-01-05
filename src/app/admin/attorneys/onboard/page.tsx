"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
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

export default function OnboardAttorneyPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [checkingDomain, setCheckingDomain] = useState(false);
  const [existingOrg, setExistingOrg] = useState<{name: string; website: string} | null>(null);
  const [confirmJoin, setConfirmJoin] = useState(false);
  const [formData, setFormData] = useState({
    // Step 1: Basic Info
    email: "",
    name: "",
    password: "",
    firmType: "solo" as "solo" | "part_of_firm",
    firmWebsite: "",
    firmName: "",
    // Step 2: Professional Details
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

  const checkFirmDomain = async (website: string) => {
    if (!website || formData.firmType !== 'part_of_firm') return;
    
    setCheckingDomain(true);
    setExistingOrg(null);
    setConfirmJoin(false);

    try {
      const response = await fetch('/api/auth/check-firm-domain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ website }),
      });

      const data = await response.json();

      if (data.exists) {
        setExistingOrg({
          name: data.organization.name,
          website: data.organization.website,
        });
        toast.info(`Found existing organization: ${data.organization.name}`);
      } else {
        setExistingOrg(null);
        toast.success('No existing organization found - you\'ll create a new one');
      }
    } catch (error) {
      console.error('Error checking domain:', error);
      toast.error('Could not verify domain');
    } finally {
      setCheckingDomain(false);
    }
  };

  const handleWebsiteBlur = () => {
    if (formData.firmWebsite && formData.firmType === 'part_of_firm') {
      checkFirmDomain(formData.firmWebsite);
    }
  };

  const handleNext = () => {
    if (step === 1) {
      if (!formData.email || !formData.name || !formData.password) {
        toast.error("Please fill in all required fields");
        return;
      }
      if (formData.password.length < 8) {
        toast.error("Password must be at least 8 characters");
        return;
      }
      if (formData.firmType === 'part_of_firm') {
        if (!formData.firmWebsite) {
          toast.error("Please enter your law firm's website");
          return;
        }
        // If existing org found, require confirmation
        if (existingOrg && !confirmJoin) {
          toast.error("Please confirm you want to join the existing organization");
          return;
        }
        // If no existing org, require firm name
        if (!existingOrg && !formData.firmName) {
          toast.error("Please enter your law firm's name");
          return;
        }
      }
    }
    setStep(step + 1);
  };

  const handleBack = () => {
    setStep(step - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Create attorney account
      const response = await fetch("/api/auth/attorney-signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          yearsOfExperience: formData.yearsOfExperience ? parseInt(formData.yearsOfExperience) : undefined,
          confirmJoinExisting: existingOrg ? confirmJoin : undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create attorney account");
      }

      const data = await response.json();
      
      if (data.isNewOrganization) {
        toast.success("Attorney account and organization created successfully!");
      } else {
        toast.success(`Successfully joined ${existingOrg?.name}!`);
      }
      
      // Redirect to login page
      router.push("/login");
    } catch (error) {
      console.error("Error creating attorney:", error);
      toast.error(error instanceof Error ? error.message : "Failed to create attorney account");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto p-6 max-w-3xl">
        <div className="mb-6">
          <Link href="/landing">
            <Button variant="ghost" className="mb-4 bg-white text-gray-700 hover:text-gray-900 hover:bg-gray-50">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Join LinkToLawyers as an Attorney</h1>
          <p className="text-gray-600 mt-2">Create your attorney account and start connecting with clients seeking immigration services</p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center gap-4">
            <div className={`flex items-center gap-2 ${step >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${
                step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
              }`}>
                {step > 1 ? <Check className="h-5 w-5" /> : '1'}
              </div>
              <span className="font-medium">Basic Info</span>
            </div>
            <div className="w-16 h-0.5 bg-gray-300" />
            <div className={`flex items-center gap-2 ${step >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${
                step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
              }`}>
                {step > 2 ? <Check className="h-5 w-5" /> : '2'}
              </div>
              <span className="font-medium">Professional Details</span>
            </div>
            <div className="w-16 h-0.5 bg-gray-300" />
            <div className={`flex items-center gap-2 ${step >= 3 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${
                step >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
              }`}>
                3
              </div>
              <span className="font-medium">Review</span>
            </div>
          </div>
        </div>

        <Card className="p-8 bg-white">
          <form onSubmit={handleSubmit}>
            {/* Step 1: Basic Info */}
            {step === 1 && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold mb-4 text-gray-900">Basic Information</h2>
                
                <div>
                  <Label htmlFor="email" className="text-gray-900">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="attorney@lawfirm.com"
                    required
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="name" className="text-gray-900">Full Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="John Doe"
                    required
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="password" className="text-gray-900">Password *</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Minimum 8 characters"
                    required
                    minLength={8}
                    className="mt-2"
                  />
                  <p className="text-sm text-gray-600 mt-1">Minimum 8 characters</p>
                </div>

                {/* Firm Type Selection */}
                <div>
                  <Label className="text-gray-900 mb-3 block">Practice Type *</Label>
                  <div className="space-y-3">
                    <label
                      className={`flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition-all ${
                        formData.firmType === 'solo'
                          ? 'bg-blue-50 border-blue-500 ring-2 ring-blue-200'
                          : 'bg-white border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="firmType"
                        value="solo"
                        checked={formData.firmType === 'solo'}
                        onChange={(e) => setFormData({ ...formData, firmType: 'solo', firmWebsite: '', firmName: '' })}
                        className="mt-1"
                      />
                      <div>
                        <div className="font-medium text-gray-900">Solo Attorney / Independent Practice</div>
                        <div className="text-sm text-gray-600 mt-1">
                          I practice independently and manage my own practice
                        </div>
                      </div>
                    </label>

                    <label
                      className={`flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition-all ${
                        formData.firmType === 'part_of_firm'
                          ? 'bg-blue-50 border-blue-500 ring-2 ring-blue-200'
                          : 'bg-white border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="firmType"
                        value="part_of_firm"
                        checked={formData.firmType === 'part_of_firm'}
                        onChange={(e) => setFormData({ ...formData, firmType: 'part_of_firm' })}
                        className="mt-1"
                      />
                      <div>
                        <div className="font-medium text-gray-900">Part of a Law Firm</div>
                        <div className="text-sm text-gray-600 mt-1">
                          I work at or own a law firm with multiple attorneys
                        </div>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Firm Details (shown only if part_of_firm) */}
                {formData.firmType === 'part_of_firm' && (
                  <div className="space-y-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div>
                      <Label htmlFor="firmWebsite" className="text-gray-900">
                        Law Firm Website *
                      </Label>
                      <Input
                        id="firmWebsite"
                        type="url"
                        value={formData.firmWebsite}
                        onChange={(e) => {
                          setFormData({ ...formData, firmWebsite: e.target.value });
                          setExistingOrg(null);
                          setConfirmJoin(false);
                        }}
                        onBlur={handleWebsiteBlur}
                        placeholder="https://yourfirm.com or yourfirm.com"
                        required={formData.firmType === 'part_of_firm'}
                        disabled={checkingDomain}
                        className="mt-2 bg-white"
                      />
                      {checkingDomain && (
                        <p className="text-sm text-blue-600 mt-2 flex items-center gap-2">
                          <span className="animate-spin">⏳</span>
                          Checking if this organization already exists...
                        </p>
                      )}
                      {!checkingDomain && !existingOrg && (
                        <p className="text-sm text-gray-700 mt-2">
                          Enter your firm's website to check if it's already registered
                        </p>
                      )}
                    </div>

                    {/* Confirmation UI for existing organization */}
                    {existingOrg && (
                      <div className="p-4 bg-green-50 border-2 border-green-500 rounded-lg space-y-3">
                        <div className="flex items-start gap-3">
                          <div className="text-green-600 text-2xl">✓</div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-green-900">
                              Organization Found!
                            </h3>
                            <p className="text-sm text-green-800 mt-1">
                              We found <strong>{existingOrg.name}</strong> with this website domain.
                            </p>
                            <p className="text-sm text-green-700 mt-2">
                              By joining, you'll be added to this organization and can collaborate with other attorneys from your firm.
                            </p>
                          </div>
                        </div>
                        
                        <label className="flex items-center gap-3 p-3 bg-white border border-green-300 rounded cursor-pointer hover:bg-green-50">
                          <input
                            type="checkbox"
                            checked={confirmJoin}
                            onChange={(e) => setConfirmJoin(e.target.checked)}
                            className="w-4 h-4 text-green-600 border-gray-300 rounded"
                          />
                          <span className="text-sm font-medium text-gray-900">
                            Yes, I confirm I want to join <strong>{existingOrg.name}</strong>
                          </span>
                        </label>
                      </div>
                    )}

                    {/* Firm name field - required only when creating new org */}
                    {!existingOrg && formData.firmWebsite && !checkingDomain && (
                      <div className="p-4 bg-yellow-50 border-2 border-yellow-400 rounded-lg space-y-3">
                        <div className="flex items-start gap-2">
                          <div className="text-yellow-600 text-xl">ℹ️</div>
                          <div>
                            <h3 className="font-semibold text-yellow-900">
                              New Organization
                            </h3>
                            <p className="text-sm text-yellow-800 mt-1">
                              You'll be creating a new organization. Please enter your firm's name.
                            </p>
                          </div>
                        </div>
                        
                        <div>
                          <Label htmlFor="firmName" className="text-gray-900">
                            Law Firm Name *
                          </Label>
                          <Input
                            id="firmName"
                            value={formData.firmName}
                            onChange={(e) => setFormData({ ...formData, firmName: e.target.value })}
                            placeholder="Smith & Associates Law Firm"
                            required
                            className="mt-2 bg-white"
                          />
                          <p className="text-sm text-gray-600 mt-1">
                            This name will be used to identify your organization
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex justify-end pt-4">
                  <Button 
                    type="button" 
                    onClick={handleNext}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Next
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 2: Professional Details */}
            {step === 2 && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold mb-4 text-gray-900">Professional Details</h2>

                <div>
                  <Label htmlFor="bio">Professional Biography</Label>
                  <Textarea
                    id="bio"
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    placeholder="Brief professional background and experience..."
                    rows={4}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label>Practice Areas / Specialties</Label>
                  <div className="mt-2 grid grid-cols-2 gap-3">
                    {SPECIALTIES.map((specialty) => (
                      <label
                        key={specialty}
                        className={`flex items-center gap-2 p-3 border rounded-lg cursor-pointer transition-colors ${
                          formData.specialties.includes(specialty)
                            ? 'bg-blue-50 border-blue-500 text-gray-900'
                            : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={formData.specialties.includes(specialty)}
                          onChange={() => handleSpecialtyToggle(specialty)}
                          className="rounded text-blue-600 border-gray-300"
                        />
                        <span className="text-sm font-medium">{specialty}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <Label htmlFor="yearsOfExperience">Years of Experience</Label>
                  <Input
                    id="yearsOfExperience"
                    type="number"
                    min="0"
                    max="70"
                    value={formData.yearsOfExperience}
                    onChange={(e) => setFormData({ ...formData, yearsOfExperience: e.target.value })}
                    placeholder="5"
                    className="mt-2"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="barNumber">Bar Number</Label>
                    <Input
                      id="barNumber"
                      value={formData.barNumber}
                      onChange={(e) => setFormData({ ...formData, barNumber: e.target.value })}
                      placeholder="123456"
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="barState">Bar State</Label>
                    <Input
                      id="barState"
                      value={formData.barState}
                      onChange={(e) => setFormData({ ...formData, barState: e.target.value })}
                      placeholder="CA"
                      className="mt-2"
                    />
                  </div>
                </div>

                <div className="flex justify-between pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={handleBack}
                    className="bg-white text-gray-700 border-gray-300"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                  <Button 
                    type="button" 
                    onClick={handleNext}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Next
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Review */}
            {step === 3 && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold mb-4 text-gray-900">Review & Confirm</h2>

                <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                  <div>
                    <p className="text-sm text-gray-600 font-medium">Name</p>
                    <p className="text-gray-900 font-semibold">{formData.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 font-medium">Email</p>
                    <p className="text-gray-900 font-semibold">{formData.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 font-medium">Practice Type</p>
                    <p className="text-gray-900 font-semibold">
                      {formData.firmType === 'solo' ? 'Solo Attorney / Independent Practice' : 'Part of a Law Firm'}
                    </p>
                  </div>
                  {formData.firmType === 'part_of_firm' && formData.firmWebsite && (
                    <>
                      <div>
                        <p className="text-sm text-gray-600 font-medium">Law Firm Website</p>
                        <p className="text-gray-900 font-semibold">{formData.firmWebsite}</p>
                      </div>
                      {formData.firmName && (
                        <div>
                          <p className="text-sm text-gray-600 font-medium">Law Firm Name</p>
                          <p className="text-gray-900 font-semibold">{formData.firmName}</p>
                        </div>
                      )}
                    </>
                  )}
                  {formData.bio && (
                    <div>
                      <p className="text-sm text-gray-600 font-medium">Biography</p>
                      <p className="text-gray-900">{formData.bio}</p>
                    </div>
                  )}
                  {formData.specialties.length > 0 && (
                    <div>
                      <p className="text-sm text-gray-600 font-medium mb-2">Specialties</p>
                      <div className="flex flex-wrap gap-2">
                        {formData.specialties.map((specialty) => (
                          <span
                            key={specialty}
                            className="px-3 py-1 bg-blue-600 text-white text-xs font-semibold rounded-full"
                          >
                            {specialty}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {formData.yearsOfExperience && (
                    <div>
                      <p className="text-sm text-gray-600 font-medium">Years of Experience</p>
                      <p className="text-gray-900 font-semibold">{formData.yearsOfExperience} years</p>
                    </div>
                  )}
                  {formData.barNumber && (
                    <div>
                      <p className="text-sm text-gray-600 font-medium">Bar Information</p>
                      <p className="text-gray-900 font-semibold">
                        {formData.barNumber} {formData.barState && `(${formData.barState})`}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex justify-between pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={handleBack}
                    className="bg-white text-gray-700 border-gray-300"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                  >
                    {loading ? "Creating Account..." : "Create Attorney Account"}
                    <Check className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </form>
        </Card>
      </div>
    </div>
  );
}

