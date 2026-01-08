/**
 * Script to map players to Sleeper API IDs
 * Run with: npx tsx scripts/map-sleeper-ids.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface SleeperPlayer {
  player_id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  team: string;
  position: string;
  fantasy_positions: string[];
}

async function mapSleeperIds() {
  console.log('Fetching all NFL players from Sleeper API...');
  
  const response = await fetch('https://api.sleeper.app/v1/players/nfl');
  if (!response.ok) {
    throw new Error('Failed to fetch Sleeper players');
  }

  const sleeperPlayers: Record<string, SleeperPlayer> = await response.json();
  console.log(`Fetched ${Object.keys(sleeperPlayers).length} players from Sleeper`);

  // Get all players from database
  const dbPlayers = await prisma.player.findMany({
    include: { team: true },
  });

  console.log(`Found ${dbPlayers.length} players in database`);
  console.log('\nMapping players...\n');

  let mapped = 0;
  let unmapped = 0;

  for (const dbPlayer of dbPlayers) {
    // Try to find matching Sleeper player
    const sleeperPlayer = Object.values(sleeperPlayers).find((sp) => {
      // Normalize names for comparison
      const spName = sp.full_name?.toLowerCase().trim();
      const dbName = dbPlayer.name.toLowerCase().trim();
      
      // Match by name and team
      const nameMatch = spName === dbName;
      const teamMatch = sp.team?.toUpperCase() === dbPlayer.team.shortCode.toUpperCase();
      
      return nameMatch && teamMatch;
    });

    if (sleeperPlayer) {
      // Update player with Sleeper ID
      await prisma.player.update({
        where: { id: dbPlayer.id },
        data: { sleeperId: sleeperPlayer.player_id },
      });
      
      console.log(`✓ Mapped: ${dbPlayer.name} (${dbPlayer.team.shortCode}) -> ${sleeperPlayer.player_id}`);
      mapped++;
    } else {
      console.log(`✗ Not found: ${dbPlayer.name} (${dbPlayer.team.shortCode})`);
      unmapped++;
    }
  }

  console.log(`\n=== Summary ===`);
  console.log(`Mapped: ${mapped}`);
  console.log(`Unmapped: ${unmapped}`);
  console.log(`Total: ${dbPlayers.length}`);
}

mapSleeperIds()
  .then(() => {
    console.log('\nDone!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
