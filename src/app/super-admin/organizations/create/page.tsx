"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function CreateOrganizationPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    type: "law_firm" as "law_firm" | "solo_attorney" | "non_legal" | "other",
    contactEmail: "",
    contactPhone: "",
    address: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/super-admin/organizations/api", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create organization");
      }

      const data = await response.json();
      toast.success("Organization created successfully!");
      router.push(`/super-admin/organizations/${data.id}`);
    } catch (error) {
      console.error("Error creating organization:", error);
      toast.error(error instanceof Error ? error.message : "Failed to create organization");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto p-6 max-w-3xl">
        <div className="mb-6">
          <Link href="/super-admin">
            <Button variant="ghost" className="mb-4 bg-transparent text-gray-700 hover:bg-gray-100 hover:text-gray-900">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Create New Organization</h1>
          <p className="text-gray-600 mt-2">Add a new organization to the platform</p>
        </div>

        <Card className="p-8 bg-white">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="name" className="text-gray-900">Organization Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Acme Law Firm"
                required
                className="mt-2 bg-white text-gray-900"
              />
            </div>

            <div>
              <Label htmlFor="type" className="text-gray-900">Organization Type *</Label>
              <select
                id="type"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                required
                className="mt-2 w-full rounded-md border border-gray-300 bg-white text-gray-900 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="law_firm">Law Firm</option>
                <option value="solo_attorney">Solo Attorney</option>
                <option value="non_legal">Non-Legal Entity</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <Label htmlFor="contactEmail" className="text-gray-900">Contact Email</Label>
              <Input
                id="contactEmail"
                type="email"
                value={formData.contactEmail}
                onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                placeholder="contact@acmelawfirm.com"
                className="mt-2 bg-white text-gray-900"
              />
            </div>

            <div>
              <Label htmlFor="contactPhone" className="text-gray-900">Contact Phone</Label>
              <Input
                id="contactPhone"
                type="tel"
                value={formData.contactPhone}
                onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                placeholder="+1 (555) 123-4567"
                className="mt-2 bg-white text-gray-900"
              />
            </div>

            <div>
              <Label htmlFor="address" className="text-gray-900">Address</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="123 Main St, City, State 12345"
                className="mt-2 bg-white text-gray-900"
              />
            </div>

            <div className="flex gap-4 pt-4">
              <Button
                type="submit"
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
              >
                {loading ? "Creating..." : "Create Organization"}
              </Button>
              <Link href="/super-admin" className="flex-1">
                <Button type="button" variant="outline" className="w-full bg-white text-gray-900 hover:bg-gray-50">
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

