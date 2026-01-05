import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { screenings } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { flowId, flowName, responses, status = 'submitted', screeningId, currentStepId, deleteDraft, isTestMode = false } = body;

    if (!flowName || !responses) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // If completing a flow, delete any existing draft for this flow
    if (deleteDraft && flowId && status === 'submitted') {
      await db
        .delete(screenings)
        .where(
          and(
            eq(screenings.userId, session.user.id),
            eq(screenings.flowId, flowId),
            eq(screenings.status, 'draft')
          )
        );
    }

    // If updating existing draft
    if (screeningId) {
      const [updated] = await db
        .update(screenings)
        .set({
          responses: JSON.stringify(responses),
          currentStepId: currentStepId || null,
          status,
          isTestMode,
          updatedAt: new Date(),
        })
        .where(eq(screenings.id, screeningId))
        .returning();

      return NextResponse.json(updated, { status: 200 });
    }

    // Generate submission ID
    const submissionId = `${flowName.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;

    // Save to database
    const [screening] = await db
      .insert(screenings)
      .values({
        userId: session.user.id,
        organizationId: session.user.organizationId,
        flowId: flowId || null,
        flowName,
        submissionId,
        responses: JSON.stringify(responses),
        currentStepId: currentStepId || null,
        status,
        isTestMode,
      })
      .returning();

    return NextResponse.json(screening, { status: 201 });
  } catch (error) {
    console.error('Error saving screening:', error);
    return NextResponse.json(
      { error: 'Failed to save screening' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const screeningId = searchParams.get('id');

    if (!screeningId) {
      return NextResponse.json(
        { error: 'Missing screening ID' },
        { status: 400 }
      );
    }

    await db
      .delete(screenings)
      .where(eq(screenings.id, screeningId));

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error deleting screening:', error);
    return NextResponse.json(
      { error: 'Failed to delete screening' },
      { status: 500 }
    );
  }
}
