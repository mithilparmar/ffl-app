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

    // Get all players that appear in lineups for this week
    const lineups = await prisma.lineup.findMany({
      where: { weekId: week.id },
    });

    const playerIds = new Set<string>();
    lineups.forEach((lineup) => {
      playerIds.add(lineup.qbId);
      playerIds.add(lineup.rbId);
      playerIds.add(lineup.wrId);
      playerIds.add(lineup.teId);
      playerIds.add(lineup.flexId);
    });

    const players = await prisma.player.findMany({
      where: {
        id: {
          in: Array.from(playerIds),
        },
      },
      include: {
        team: true,
      },
      orderBy: [
        { team: { shortCode: 'asc' } },
        { position: 'asc' },
        { name: 'asc' },
      ],
    });

    return NextResponse.json(players);
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
