import { auth } from "@/lib/auth";
import { isViewingAsOrganization } from "@/lib/organization-context";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  
  if (!session?.user || session.user.role !== 'super_admin') {
    return NextResponse.json({ isViewingOrg: false });
  }

  const viewing = await isViewingAsOrganization();
  
  return NextResponse.json({ isViewingOrg: viewing });
}
