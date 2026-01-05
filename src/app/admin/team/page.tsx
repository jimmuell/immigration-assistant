"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus, Trash2, Users, Mail, Shield, Briefcase } from "lucide-react";
import { toast } from "sonner";

type TeamMember = {
  id: string;
  email: string;
  name: string | null;
  role: string;
  createdAt: string;
};

export default function TeamPage() {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    email: "",
    name: "",
    role: "staff" as "staff" | "attorney",
  });
  const [inviting, setInviting] = useState(false);
  const [tempPassword, setTempPassword] = useState<string | null>(null);

  useEffect(() => {
    fetchTeamMembers();
  }, []);

  const fetchTeamMembers = async () => {
    try {
      const response = await fetch("/api/admin/team");
      const data = await response.json();

      if (response.ok) {
        setTeamMembers(data.teamMembers);
      } else {
        toast.error(data.error || "Failed to fetch team members");
      }
    } catch (error) {
      console.error("Error fetching team members:", error);
      toast.error("An error occurred while fetching team members");
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviting(true);
    setTempPassword(null);

    try {
      const response = await fetch("/api/admin/team/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(inviteForm),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Team member invited successfully!");
        setTempPassword(data.tempPassword); // Show temporary password
        setInviteForm({ email: "", name: "", role: "staff" });
        fetchTeamMembers(); // Refresh the list
      } else {
        toast.error(data.error || "Failed to invite team member");
      }
    } catch (error) {
      console.error("Error inviting team member:", error);
      toast.error("An error occurred while inviting the team member");
    } finally {
      setInviting(false);
    }
  };

  const handleRemove = async (userId: string, userName: string) => {
    if (!confirm(`Are you sure you want to remove ${userName} from your team?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/team?userId=${userId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Team member removed successfully");
        fetchTeamMembers(); // Refresh the list
      } else {
        toast.error(data.error || "Failed to remove team member");
      }
    } catch (error) {
      console.error("Error removing team member:", error);
      toast.error("An error occurred while removing the team member");
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "org_admin":
        return <Shield className="h-4 w-4 text-purple-600" />;
      case "attorney":
        return <Briefcase className="h-4 w-4 text-blue-600" />;
      case "staff":
        return <Users className="h-4 w-4 text-green-600" />;
      default:
        return null;
    }
  };

  const getRoleBadgeClass = (role: string) => {
    switch (role) {
      case "org_admin":
        return "bg-purple-100 text-purple-800 border-purple-300";
      case "attorney":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "staff":
        return "bg-green-100 text-green-800 border-green-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "org_admin":
        return "Admin";
      case "attorney":
        return "Attorney";
      case "staff":
        return "Admin"; // Staff have admin access, display as Admin
      default:
        return role;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Users className="h-8 w-8 text-blue-600" />
            Team Management
          </h1>
          <p className="text-gray-600 mt-2">
            Manage your team members, invite paralegals and staff to help run your practice
          </p>
        </div>

        {/* Invite Button */}
        <div className="mb-6">
          <Button
            onClick={() => setShowInviteModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Invite Team Member
          </Button>
        </div>

        {/* Team Members List */}
        <Card className="p-6 bg-white">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Team Members</h2>

          {loading ? (
            <p className="text-gray-600">Loading team members...</p>
          ) : teamMembers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">No team members yet</p>
              <p className="text-sm text-gray-500">
                Invite paralegals, secretaries, or other attorneys to help manage your practice
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Name</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Email</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Role</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Joined</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {teamMembers.map((member) => (
                    <tr key={member.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-4 px-4">
                        <div className="font-medium text-gray-900">{member.name || "—"}</div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2 text-gray-700">
                          <Mail className="h-4 w-4 text-gray-400" />
                          {member.email}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium border ${getRoleBadgeClass(
                            member.role
                          )}`}
                        >
                          {getRoleIcon(member.role)}
                          {getRoleLabel(member.role)}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-gray-600">
                        {new Date(member.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-4 text-right">
                        {member.role !== "org_admin" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRemove(member.id, member.name || member.email)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Remove
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Invite Modal */}
        {showInviteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <Card className="p-6 bg-white max-w-md w-full">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Invite Team Member</h2>

              {tempPassword ? (
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <h3 className="font-semibold text-green-900 mb-2">Team Member Invited!</h3>
                    <p className="text-sm text-green-800 mb-3">
                      Send these credentials to {inviteForm.email}:
                    </p>
                    <div className="bg-white p-3 rounded border border-green-300">
                      <p className="text-sm text-gray-700">
                        <strong>Email:</strong> {inviteForm.email}
                      </p>
                      <p className="text-sm text-gray-700 mt-1">
                        <strong>Temporary Password:</strong>{" "}
                        <code className="bg-gray-100 px-2 py-1 rounded">{tempPassword}</code>
                      </p>
                    </div>
                    <p className="text-xs text-green-700 mt-2">
                      ⚠️ Save this password now! It won't be shown again.
                    </p>
                  </div>
                  <Button
                    onClick={() => {
                      setShowInviteModal(false);
                      setTempPassword(null);
                    }}
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                  >
                    Done
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleInvite} className="space-y-4">
                  <div>
                    <Label htmlFor="name" className="text-gray-900">
                      Full Name *
                    </Label>
                    <Input
                      id="name"
                      value={inviteForm.name}
                      onChange={(e) => setInviteForm({ ...inviteForm, name: e.target.value })}
                      placeholder="John Doe"
                      required
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label htmlFor="email" className="text-gray-900">
                      Email Address *
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={inviteForm.email}
                      onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                      placeholder="john@example.com"
                      required
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label className="text-gray-900 mb-2 block">Role *</Label>
                    <div className="space-y-2">
                      <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                        <input
                          type="radio"
                          name="role"
                          value="staff"
                          checked={inviteForm.role === "staff"}
                          onChange={(e) =>
                            setInviteForm({ ...inviteForm, role: "staff" })
                          }
                        />
                        <div>
                          <div className="font-medium text-gray-900">Staff (Paralegal/Secretary)</div>
                          <div className="text-sm text-gray-600">
                            Full admin access to help manage the practice
                          </div>
                        </div>
                      </label>

                      <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                        <input
                          type="radio"
                          name="role"
                          value="attorney"
                          checked={inviteForm.role === "attorney"}
                          onChange={(e) =>
                            setInviteForm({ ...inviteForm, role: "attorney" })
                          }
                        />
                        <div>
                          <div className="font-medium text-gray-900">Attorney</div>
                          <div className="text-sm text-gray-600">
                            Another attorney to help with cases
                          </div>
                        </div>
                      </label>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowInviteModal(false);
                        setInviteForm({ email: "", name: "", role: "staff" });
                      }}
                      className="flex-1 bg-white text-gray-700"
                      disabled={inviting}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                      disabled={inviting}
                    >
                      {inviting ? "Inviting..." : "Send Invitation"}
                    </Button>
                  </div>
                </form>
              )}
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

