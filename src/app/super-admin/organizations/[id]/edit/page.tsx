"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Trash2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface OrganizationData {
  id: string;
  name: string;
  type: "law_firm" | "solo_attorney" | "non_legal" | "other";
  contactEmail: string | null;
  contactPhone: string | null;
  address: string | null;
}

export default function EditOrganizationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [organizationId, setOrganizationId] = useState<string>("");
  const [formData, setFormData] = useState<OrganizationData>({
    id: "",
    name: "",
    type: "law_firm",
    contactEmail: "",
    contactPhone: "",
    address: "",
  });

  useEffect(() => {
    async function loadOrganization() {
      try {
        const resolvedParams = await params;
        setOrganizationId(resolvedParams.id);
        
        const response = await fetch(`/super-admin/organizations/api/${resolvedParams.id}`);
        if (!response.ok) {
          throw new Error("Failed to load organization");
        }

        const data = await response.json();
        setFormData({
          id: data.id,
          name: data.name,
          type: data.type,
          contactEmail: data.contactEmail || "",
          contactPhone: data.contactPhone || "",
          address: data.address || "",
        });
      } catch (error) {
        console.error("Error loading organization:", error);
        toast.error("Failed to load organization");
        router.push("/super-admin/organizations");
      } finally {
        setLoading(false);
      }
    }

    loadOrganization();
  }, [params, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await fetch(`/super-admin/organizations/api/${organizationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          type: formData.type,
          contactEmail: formData.contactEmail || null,
          contactPhone: formData.contactPhone || null,
          address: formData.address || null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update organization");
      }

      toast.success("Organization updated successfully!");
      router.push(`/super-admin/organizations/${organizationId}`);
    } catch (error) {
      console.error("Error updating organization:", error);
      toast.error(error instanceof Error ? error.message : "Failed to update organization");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);

    try {
      const response = await fetch(`/super-admin/organizations/api/${organizationId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || error.message || "Failed to delete organization");
      }

      toast.success("Organization deleted successfully!");
      
      // Refresh the router cache and navigate
      router.refresh();
      router.push("/super-admin/organizations");
      
      // Force a page reload after a short delay to ensure clean state
      setTimeout(() => {
        window.location.href = "/super-admin/organizations";
      }, 500);
    } catch (error) {
      console.error("Error deleting organization:", error);
      toast.error(error instanceof Error ? error.message : "Failed to delete organization");
      setDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading organization...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto p-6 max-w-3xl">
        <div className="mb-6">
          <Link href={`/super-admin/organizations/${organizationId}`}>
            <Button variant="ghost" className="mb-4 bg-transparent text-gray-700 hover:bg-gray-100 hover:text-gray-900">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Organization
            </Button>
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Edit Organization</h1>
              <p className="text-gray-600 mt-2">Update organization details</p>
            </div>
            <Button
              type="button"
              variant="destructive"
              onClick={() => setDeleteDialogOpen(true)}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </div>
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
                value={formData.contactEmail || ""}
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
                value={formData.contactPhone || ""}
                onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                placeholder="+1 (555) 123-4567"
                className="mt-2 bg-white text-gray-900"
              />
            </div>

            <div>
              <Label htmlFor="address" className="text-gray-900">Address</Label>
              <Input
                id="address"
                value={formData.address || ""}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="123 Main St, City, State 12345"
                className="mt-2 bg-white text-gray-900"
              />
            </div>

            <div className="flex gap-4 pt-4">
              <Button
                type="submit"
                disabled={saving}
                className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
              >
                {saving ? "Saving..." : "Save Changes"}
              </Button>
              <Link href={`/super-admin/organizations/${organizationId}`} className="flex-1">
                <Button type="button" variant="outline" className="w-full bg-white text-gray-900 hover:bg-gray-50">
                  Cancel
                </Button>
              </Link>
            </div>
          </form>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-gray-900">Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600">
              This will permanently delete <strong>{formData.name}</strong> and remove all associated data including users, screenings, and flows.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white text-gray-900 hover:bg-gray-50">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {deleting ? "Deleting..." : "Delete Organization"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

