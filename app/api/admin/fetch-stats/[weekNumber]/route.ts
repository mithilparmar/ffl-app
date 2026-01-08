import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { calculatePlayerScore } from '@/lib/scoring';
import { fetchAllPlayersStatsESPN } from '@/lib/espn-api';

// Sleeper API base URL
const SLEEPER_API = 'https://api.sleeper.app/v1';

// Map NFL week numbers to Sleeper week format (playoffs)
// Sleeper uses week numbers: 18 (Wild Card), 19 (Divisional), 20 (Conference), 21 (Super Bowl)
const NFL_WEEK_MAP: Record<number, number> = {
  1: 18, // Wild Card
  2: 19, // Divisional
  3: 20, // Conference Championship
  4: 21, // Super Bowl
};

interface SleeperStats {
  gp?: number;
  pass_yd?: number;
  pass_td?: number;
  pass_int?: number;
  pass_sack?: number;
  pass_td_40p?: number;
  pass_td_50p?: number;
  rush_yd?: number;
  rush_td?: number;
  rush_td_40p?: number;
  rush_td_50p?: number;
  rec_yd?: number;
  rec_td?: number;
  rec?: number;
  rec_td_40p?: number;
  rec_td_50p?: number;
  fum?: number;
  fum_lost?: number;
  fum_rec_td?: number;
  pass_2pt?: number;
  rec_2pt?: number;
  rush_2pt?: number;
}

export async function GET(
  request: NextRequest,
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
      include: {
        lineups: {
          include: {
            user: true,
            lineup: {
              include: {
                qb: { include: { team: true } },
                rb: { include: { team: true } },
                wr: { include: { team: true } },
                te: { include: { team: true } },
                flex: { include: { team: true } },
              },
            },
          },
        },
      },
    });

    if (!week) {
      return NextResponse.json({ error: 'Week not found' }, { status: 404 });
    }

    // Get all unique players from lineups
    const playerIds = new Set<string>();
    week.lineups.forEach((lineup) => {
      if (lineup.lineup) {
        playerIds.add(lineup.lineup.qbId);
        playerIds.add(lineup.lineup.rbId);
        playerIds.add(lineup.lineup.wrId);
        playerIds.add(lineup.lineup.teId);
        playerIds.add(lineup.lineup.flexId);
      }
    });

    // Fetch players with their Sleeper IDs
    const players = await prisma.player.findMany({
      where: { id: { in: Array.from(playerIds) } },
    });

    // Map NFL week numbers to playoff weeks
    const weekNum = parseInt(weekNumber);
    if (weekNum < 1 || weekNum > 4) {
      return NextResponse.json(
        { error: 'Invalid week number. Must be 1-4 (playoff weeks)' },
        { status: 400 }
      );
    }

    // Fetch stats from ESPN API
    const playerList = players.map((p) => ({
      name: p.name,
      teamCode: p.team.shortCode,
      id: p.id,
    }));

    console.log(`Fetching ESPN stats for ${playerList.length} players...`);
    const statsByPlayerId = await fetchAllPlayersStatsESPN(weekNum, playerList);

    // Calculate scores for each player
    const calculatedScores = players.map((player) => {
      const playerStats = statsByPlayerId[player.id] || {};
      const score = calculatePlayerScore(playerStats);

      return {
        playerId: player.id,
        playerName: player.name,
        points: score,
        stats: playerStats,
      };
    });

    const fetchedCount = Object.keys(statsByPlayerId).length;
    const notFoundCount = players.length - fetchedCount;

    return NextResponse.json({
      week: weekNum,
      source: 'ESPN API',
      scores: calculatedScores,
      fetchedCount,
      notFoundCount,
      message: `Fetched stats for ${fetchedCount} players${notFoundCount > 0 ? `, ${notFoundCount} not found` : ''}`,
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch player stats' },
      { status: 500 }
    );
  }
}
