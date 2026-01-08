import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculatePlayerScore } from '@/lib/scoring';

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

    // Map Sleeper week
    const sleeperWeek = NFL_WEEK_MAP[parseInt(weekNumber)];
    if (!sleeperWeek) {
      return NextResponse.json(
        { error: 'Invalid week number' },
        { status: 400 }
      );
    }

    // Fetch stats from Sleeper API for the current season (2024 season)
    const season = '2024'; // Sleeper uses season year
    const statsUrl = `${SLEEPER_API}/stats/nfl/regular/${season}/${sleeperWeek}`;
    
    const response = await fetch(statsUrl);
    if (!response.ok) {
      throw new Error('Failed to fetch stats from Sleeper API');
    }

    const allStats: Record<string, SleeperStats> = await response.json();

    // Calculate scores for each player
    const calculatedScores = players
      .filter((player) => player.sleeperId) // Only players with Sleeper ID
      .map((player) => {
        const playerStats = allStats[player.sleeperId!] || {};
        const score = calculatePlayerScore(playerStats);

        return {
          playerId: player.id,
          playerName: player.name,
          sleeperId: player.sleeperId,
          points: score,
          stats: playerStats,
        };
      });

    return NextResponse.json({
      week: parseInt(weekNumber),
      sleeperWeek,
      scores: calculatedScores,
      unmappedPlayers: players
        .filter((player) => !player.sleeperId)
        .map((p) => ({ id: p.id, name: p.name })),
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch player stats' },
      { status: 500 }
    );
  }
}
