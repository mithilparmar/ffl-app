import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { validateLineup } from '@/lib/validation';
import { isWeekLocked } from '@/lib/week-utils';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { weekNumber, qbId, rbId, wrId, teId, flexId } = body;

    // Validate week exists and is not locked
    const week = await prisma.week.findUnique({
      where: { number: weekNumber },
    });

    if (!week) {
      return NextResponse.json({ error: 'Week not found' }, { status: 404 });
    }

    if (isWeekLocked(week)) {
      return NextResponse.json(
        { error: 'This week is locked. No more submissions allowed.' },
        { status: 400 }
      );
    }

    // Validate lineup
    const validationErrors = await validateLineup(session.user.id, weekNumber, {
      qbId,
      rbId,
      wrId,
      teId,
      flexId,
    });

    if (validationErrors.length > 0) {
      return NextResponse.json(
        { errors: validationErrors.map((e) => e.message) },
        { status: 400 }
      );
    }

    // Create or update lineup
    const lineup = await prisma.lineup.upsert({
      where: {
        weekId_userId: {
          weekId: week.id,
          userId: session.user.id,
        },
      },
      update: {
        qbId,
        rbId,
        wrId,
        teId,
        flexId,
      },
      create: {
        weekId: week.id,
        userId: session.user.id,
        qbId,
        rbId,
        wrId,
        teId,
        flexId,
      },
    });

    return NextResponse.json({
      success: true,
      lineup,
    });
  } catch (error) {
    console.error('Error submitting lineup:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
