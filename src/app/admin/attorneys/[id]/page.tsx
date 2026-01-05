import { requireRole } from "@/lib/role-middleware";
import { requireOrganizationContext } from "@/lib/organization-context";
import { db } from "@/lib/db";
import { users, attorneyProfiles, attorneyRatings, screenings } from "@/lib/db/schema";
import { eq, and, count } from "drizzle-orm";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Mail, Briefcase, Star } from "lucide-react";
import { notFound } from "next/navigation";
import { RatingDisplay } from "@/components/attorney/rating-display";

export default async function AttorneyProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole(['org_admin', 'staff', 'super_admin']);
  const organizationId = await requireOrganizationContext();
  
  const { id } = await params;

  // Get attorney user
  const [attorney] = await db
    .select()
    .from(users)
    .where(and(
      eq(users.id, id),
      eq(users.organizationId, organizationId),
      eq(users.role, 'attorney')
    ))
    .limit(1);

  if (!attorney) {
    notFound();
  }

  // Get attorney profile
  const [profile] = await db
    .select()
    .from(attorneyProfiles)
    .where(eq(attorneyProfiles.userId, id))
    .limit(1);

  // Get screening stats
  const [assignedScreenings] = await db
    .select({ count: count() })
    .from(screenings)
    .where(and(
      eq(screenings.assignedAttorneyId, id),
      eq(screenings.organizationId, organizationId)
    ));

  // Get ratings
  const ratings = await db
    .select()
    .from(attorneyRatings)
    .where(eq(attorneyRatings.attorneyId, id))
    .limit(5);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto p-6 max-w-6xl">
        <div className="mb-6">
          <Link href="/admin/users">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Users
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Profile Info */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="p-6 bg-white">
              <div className="text-center mb-6">
                <div className="h-24 w-24 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white text-3xl font-bold mx-auto mb-4">
                  {attorney.name?.charAt(0) || attorney.email.charAt(0).toUpperCase()}
                </div>
                <h2 className="text-2xl font-bold text-gray-900">{attorney.name || 'No name'}</h2>
                <p className="text-gray-600 flex items-center justify-center gap-2 mt-2">
                  <Mail className="h-4 w-4" />
                  {attorney.email}
                </p>
              </div>

              <div className="space-y-4">
                {profile?.yearsOfExperience && (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Briefcase className="h-5 w-5 text-gray-600" />
                    <div>
                      <p className="text-sm text-gray-600">Experience</p>
                      <p className="font-medium">{profile.yearsOfExperience} years</p>
                    </div>
                  </div>
                )}

                {profile?.barNumber && (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">Bar Information</p>
                    <p className="font-medium">
                      {profile.barNumber} {profile.barState && `(${profile.barState})`}
                    </p>
                  </div>
                )}

                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Assigned Cases</p>
                  <p className="font-medium">{assignedScreenings?.count || 0} screenings</p>
                </div>
              </div>
            </Card>

            {/* Rating */}
            <Card className="p-6 bg-white">
              <h3 className="text-lg font-semibold mb-4">Attorney Rating</h3>
              {profile && (
                <div className="mb-4">
                  <RatingDisplay
                    rating={profile.rating}
                    ratingCount={profile.ratingCount}
                    size="lg"
                  />
                </div>
              )}
              <p className="text-sm text-gray-600">
                Based on {profile?.ratingCount || 0} client review{profile?.ratingCount !== 1 ? 's' : ''}
              </p>
            </Card>
          </div>

          {/* Right Column - Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Biography */}
            <Card className="p-6 bg-white">
              <h3 className="text-lg font-semibold mb-4">Professional Biography</h3>
              {profile?.bio ? (
                <p className="text-gray-700 whitespace-pre-wrap">{profile.bio}</p>
              ) : (
                <p className="text-gray-500 italic">No biography provided</p>
              )}
            </Card>

            {/* Specialties */}
            <Card className="p-6 bg-white">
              <h3 className="text-lg font-semibold mb-4">Practice Areas</h3>
              {profile?.specialties && profile.specialties.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {profile.specialties.map((specialty) => (
                    <span
                      key={specialty}
                      className="px-4 py-2 bg-blue-100 text-blue-800 text-sm font-medium rounded-full"
                    >
                      {specialty}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 italic">No specialties listed</p>
              )}
            </Card>

            {/* Recent Reviews */}
            {ratings.length > 0 && (
              <Card className="p-6 bg-white">
                <h3 className="text-lg font-semibold mb-4">Recent Reviews</h3>
                <div className="space-y-4">
                  {ratings.map((rating) => (
                    <div key={rating.id} className="border-b pb-4 last:border-b-0">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`h-4 w-4 ${
                                star <= rating.rating
                                  ? "fill-yellow-400 text-yellow-400"
                                  : "fill-gray-200 text-gray-200"
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-sm text-gray-600" suppressHydrationWarning>
                          {new Date(rating.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      {rating.reviewText && (
                        <p className="text-gray-700">{rating.reviewText}</p>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

