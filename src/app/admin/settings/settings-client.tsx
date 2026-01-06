"use client";

import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useState } from "react";
import { updateOrganizationSettings } from "./actions";
import { toast } from "sonner";
import { UserCheck, AlertCircle } from "lucide-react";

interface Organization {
  id: string;
  name: string;
  displayName: string | null;
  type: string;
  requireStaffPreScreening: boolean;
}

interface SettingsClientProps {
  organization: Organization;
}

export function SettingsClient({ organization }: SettingsClientProps) {
  const [requireStaffPreScreening, setRequireStaffPreScreening] = useState(
    organization.requireStaffPreScreening
  );
  const [isSaving, setIsSaving] = useState(false);

  const handleToggle = async (checked: boolean) => {
    setIsSaving(true);
    setRequireStaffPreScreening(checked);

    try {
      const result = await updateOrganizationSettings(organization.id, {
        requireStaffPreScreening: checked,
      });

      if (result.success) {
        toast.success(
          checked
            ? 'Staff pre-screening enabled'
            : 'Staff pre-screening disabled'
        );
      } else {
        // Revert on error
        setRequireStaffPreScreening(!checked);
        toast.error(result.error || 'Failed to update settings');
      }
    } catch (error) {
      // Revert on error
      setRequireStaffPreScreening(!checked);
      toast.error('An unexpected error occurred');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Screening Workflow Settings */}
      <Card className="p-6">
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-1">Screening Workflow</h2>
            <p className="text-sm text-muted-foreground">
              Configure how client screenings are handled in your organization
            </p>
          </div>

          <div className="space-y-4">
            {/* Staff Pre-Screening Toggle */}
            <div className="flex items-start justify-between gap-4 p-4 rounded-lg border bg-card">
              <div className="flex items-start gap-3 flex-1">
                <UserCheck className="h-5 w-5 text-purple-600 mt-1" />
                <div className="space-y-2">
                  <div>
                    <Label htmlFor="staff-prescreening" className="text-base font-semibold cursor-pointer">
                      Require Staff Pre-Screening
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      When enabled, attorneys only see screenings that have been reviewed and assigned by staff. 
                      This is useful for solo attorneys with staff who want to act as gatekeepers.
                    </p>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex items-start gap-2">
                      <span className="font-medium">When Disabled (Default):</span>
                      <span className="text-muted-foreground">
                        Attorneys see all unassigned client screenings (marketplace model)
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="font-medium">When Enabled:</span>
                      <span className="text-muted-foreground">
                        Attorneys only see screenings assigned to them by staff (gatekeeper model)
                      </span>
                    </div>
                  </div>

                  {requireStaffPreScreening && (
                    <div className="flex items-start gap-2 p-2 bg-purple-50 border border-purple-200 rounded text-xs text-purple-700">
                      <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                      <div>
                        <strong>Active:</strong> Your attorneys will only see screenings assigned by staff. 
                        Unassigned screenings will remain visible only to staff/admins.
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <Switch
                id="staff-prescreening"
                checked={requireStaffPreScreening}
                onCheckedChange={handleToggle}
                disabled={isSaving}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Organization Info */}
      <Card className="p-6">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Organization Information</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700">Name:</span>
              <p className="text-gray-900">{organization.displayName || organization.name}</p>
            </div>
            <div>
              <span className="font-medium text-gray-700">Type:</span>
              <p className="text-gray-900 capitalize">{organization.type.replace('_', ' ')}</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

