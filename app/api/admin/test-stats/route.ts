import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculatePlayerScore } from '@/lib/scoring';
import { fetchESPNStats } from '@/lib/espn-api';

const SLEEPER_API = 'https://api.sleeper.app/v1';

export async function GET(request: NextRequest) {
  try {
    // Get a sample player
    const player = await prisma.player.findFirst({
      include: { team: true },
    });

    if (!player) {
      return NextResponse.json(
        { error: 'No players found in database' },
        { status: 404 }
      );
    }

    // Fetch stats from ESPN API for week 1 (Wild Card)
    const stats = await fetchESPNStats(1, player.name, player.team.shortCode);

    if (!stats) {
      return NextResponse.json(
        {
          error: `Could not find stats for ${player.name} in ESPN API`,
          player: {
            name: player.name,
            team: player.team.shortCode,
            position: player.position,
          },
          note: 'This may occur if the game has not been played yet or stats are not available',
        },
        { status: 404 }
      );
    }

    // Calculate score
    const score = calculatePlayerScore(stats);

    return NextResponse.json({
      success: true,
      player: {
        id: player.id,
        name: player.name,
        position: player.position,
        team: player.team.shortCode,
      },
      stats,
      calculatedScore: score,
      message: `Successfully fetched stats for ${player.name} from ESPN API!`,
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to test stats fetching',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
