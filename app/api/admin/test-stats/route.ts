import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculatePlayerScore } from '@/lib/scoring';

const SLEEPER_API = 'https://api.sleeper.app/v1';

export async function GET(request: NextRequest) {
  try {
    // Get a sample player with Sleeper ID
    const player = await prisma.player.findFirst({
      where: {
        sleeperId: { not: null },
      },
      include: { team: true },
    });

    if (!player || !player.sleeperId) {
      return NextResponse.json(
        { error: 'No players with Sleeper ID found' },
        { status: 404 }
      );
    }

    // Fetch stats from Sleeper API
    const statsUrl = `${SLEEPER_API}/stats/nfl/regular/2025/18`; // Week 18 (Wild Card)
    const response = await fetch(statsUrl);

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch from Sleeper: ${response.statusText}` },
        { status: response.status }
      );
    }

    const allStats = await response.json();
    const playerStats = allStats[player.sleeperId] || {};

    // Calculate score
    const score = calculatePlayerScore(playerStats);

    return NextResponse.json({
      success: true,
      player: {
        id: player.id,
        name: player.name,
        position: player.position,
        team: player.team.shortCode,
        sleeperId: player.sleeperId,
      },
      rawStats: playerStats,
      scoringBreakdown: {
        pass_yd: playerStats.pass_yd ? `${playerStats.pass_yd} ÷ 25 = ${Math.floor(playerStats.pass_yd / 25)} pts` : 'N/A',
        pass_td: playerStats.pass_td ? `${playerStats.pass_td} × 4 = ${playerStats.pass_td * 4} pts` : 'N/A',
        pass_int: playerStats.pass_int ? `${playerStats.pass_int} × -2 = ${playerStats.pass_int * -2} pts` : 'N/A (no pass_int field)',
        pass_sack: playerStats.pass_sack ? `${playerStats.pass_sack} × -0.5 = ${playerStats.pass_sack * -0.5} pts` : 'N/A',
        pass_sack_yds: playerStats.pass_sack_yds ? `${playerStats.pass_sack_yds} sack yards` : 'N/A',
        rush_yd: playerStats.rush_yd ? `${playerStats.rush_yd} ÷ 10 = ${Math.floor(playerStats.rush_yd / 10)} pts` : 'N/A',
        rec_yd: playerStats.rec_yd ? `${playerStats.rec_yd} ÷ 10 = ${Math.floor(playerStats.rec_yd / 10)} pts` : 'N/A',
        rec: playerStats.rec ? `${playerStats.rec} × 0.5 = ${playerStats.rec * 0.5} pts` : 'N/A',
      },
      calculatedScore: score,
      message: `Successfully fetched stats for ${player.name}!`,
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Failed to test stats fetching' },
      { status: 500 }
    );
  }
}
