import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ weekNumber: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { weekNumber } = await params;
    const week = await prisma.week.findUnique({
      where: { number: parseInt(weekNumber) },
    });

    if (!week) {
      return NextResponse.json({ error: 'Week not found' }, { status: 404 });
    }

    const scores = await prisma.playerScore.findMany({
      where: { weekId: week.id },
    });

    return NextResponse.json(scores);
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ weekNumber: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { weekNumber } = await params;
    type ScoreInput = { playerId: string; points: number };

    const body = await request.json();
    const scores = (body?.scores ?? []) as ScoreInput[];

    const week = await prisma.week.findUnique({
      where: { number: parseInt(weekNumber) },
    });

    if (!week) {
      return NextResponse.json({ error: 'Week not found' }, { status: 404 });
    }

    // Upsert scores
    for (const score of scores) {
      await prisma.playerScore.upsert({
        where: {
          weekId_playerId: {
            weekId: week.id,
            playerId: score.playerId,
          },
        },
        update: {
          points: score.points,
        },
        create: {
          weekId: week.id,
          playerId: score.playerId,
          points: score.points,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving scores:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
