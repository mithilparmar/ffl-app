/**
 * ESPN API integration for fetching NFL player stats
 * ESPN provides complete stats including interceptions, fumbles, and more
 */

const ESPN_API = 'https://site.api.espn.com/apis/site/v2/sports/football/nfl';

interface ESPNPlayerStats {
  // Passing
  passingYards?: number;
  passingTouchdowns?: number;
  interceptions?: number;
  sacks?: number;
  
  // Rushing
  rushingYards?: number;
  rushingTouchdowns?: number;
  
  // Receiving
  receivingYards?: number;
  receivingTouchdowns?: number;
  receivingReceptions?: number;
  
  // Misc
  fumblesRecovered?: number;
  fumblesLost?: number;
  defensiveTouchdowns?: number;
}

/**
 * Maps ESPN stat keys to our internal format
 */
function mapESPNStats(espnStats: Record<string, any>): ESPNPlayerStats {
  return {
    passingYards: espnStats.passingYards || 0,
    passingTouchdowns: espnStats.passingTouchdowns || 0,
    interceptions: espnStats.interceptions || 0,
    sacks: espnStats.sacks || 0,
    rushingYards: espnStats.rushingYards || 0,
    rushingTouchdowns: espnStats.rushingTouchdowns || 0,
    receivingYards: espnStats.receivingYards || 0,
    receivingTouchdowns: espnStats.receivingTouchdowns || 0,
    receivingReceptions: espnStats.receivingReceptions || 0,
    fumblesRecovered: espnStats.fumblesRecovered || 0,
    fumblesLost: espnStats.fumblesLost || 0,
    defensiveTouchdowns: espnStats.defensiveTouchdowns || 0,
  };
}

/**
 * Fetch player stats from ESPN API
 */
export async function fetchESPNStats(
  week: number,
  playerName: string,
  teamCode: string
): Promise<ESPNPlayerStats | null> {
  try {
    // Get scoreboard for the week (week 1-4 maps to specific dates during playoffs)
    const scoreboardUrl = `${ESPN_API}/scoreboard?week=${week}`;
    const scoreboardRes = await fetch(scoreboardUrl);
    
    if (!scoreboardRes.ok) {
      console.error('Failed to fetch scoreboard:', scoreboardRes.statusText);
      return null;
    }

    const scoreboardData = await scoreboardRes.json();
    
    // Search through all events (games) for the week
    for (const event of scoreboardData.events || []) {
      const boxscoreUrl = event.links?.find(
        (link: any) => link.rel.includes('boxscore')
      )?.href;

      if (boxscoreUrl) {
        const boxscoreRes = await fetch(boxscoreUrl);
        if (!boxscoreRes.ok) continue;

        const boxscoreData = await boxscoreRes.json();
        
        // Search in both teams for the player
        for (const team of boxscoreData.teams || []) {
          if (team.displayName.includes(teamCode) || team.abbreviation === teamCode) {
            const player = team.players?.find(
              (p: any) =>
                p.displayName.toLowerCase().includes(playerName.toLowerCase()) ||
                `${p.firstName} ${p.lastName}`.toLowerCase() === playerName.toLowerCase()
            );

            if (player?.stats) {
              return mapESPNStats(player.stats);
            }
          }
        }
      }
    }

    console.log(`Player not found in ESPN data: ${playerName} (${teamCode})`);
    return null;
  } catch (error) {
    console.error('Error fetching from ESPN API:', error);
    return null;
  }
}

/**
 * Fetch all players' stats for a specific week
 */
export async function fetchAllPlayersStatsESPN(
  week: number,
  players: Array<{ name: string; teamCode: string; id: string }>
): Promise<Record<string, ESPNPlayerStats>> {
  const results: Record<string, ESPNPlayerStats> = {};

  console.log(`Fetching stats from ESPN for week ${week}...`);

  for (const player of players) {
    const stats = await fetchESPNStats(week, player.name, player.teamCode);
    if (stats) {
      results[player.id] = stats;
      console.log(`✓ ${player.name}: Fetched from ESPN`);
    } else {
      console.log(`✗ ${player.name}: Not found in ESPN data`);
    }
  }

  return results;
}
