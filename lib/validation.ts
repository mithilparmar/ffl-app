import { prisma } from '@/lib/prisma';

export interface LineupValidationError {
  field: string;
  message: string;
}

export interface LineupData {
  qbId: string;
  rbId: string;
  wrId: string;
  teId: string;
  flexId: string;
}

/**
 * Validates the burn rule: a manager cannot reuse a player they've used in earlier weeks
 */
export async function validateBurnRule(
  userId: string,
  weekNumber: number,
  lineupData: LineupData
): Promise<LineupValidationError[]> {
  const errors: LineupValidationError[] = [];

  // Get all lineups from earlier weeks for this user
  type PreviousLineupIds = {
    qbId: string;
    rbId: string;
    wrId: string;
    teId: string;
    flexId: string;
  };

  const previousLineups: PreviousLineupIds[] = await prisma.lineup.findMany({
    where: {
      userId,
      week: {
        number: {
          lt: weekNumber,
        },
      },
    },
    select: {
      qbId: true,
      rbId: true,
      wrId: true,
      teId: true,
      flexId: true,
    },
  });

  // Build set of previously used player IDs
  const usedPlayerIds = new Set<string>();
  previousLineups.forEach((lineup: PreviousLineupIds) => {
    usedPlayerIds.add(lineup.qbId);
    usedPlayerIds.add(lineup.rbId);
    usedPlayerIds.add(lineup.wrId);
    usedPlayerIds.add(lineup.teId);
    usedPlayerIds.add(lineup.flexId);
  });

  // Check each player in the current lineup
  const playerIds = [
    { id: lineupData.qbId, field: 'QB' },
    { id: lineupData.rbId, field: 'RB' },
    { id: lineupData.wrId, field: 'WR' },
    { id: lineupData.teId, field: 'TE' },
    { id: lineupData.flexId, field: 'FLEX' },
  ];

  for (const { id, field } of playerIds) {
    if (usedPlayerIds.has(id)) {
      const player = await prisma.player.findUnique({
        where: { id },
        include: { team: true },
      });
      errors.push({
        field,
        message: `You already used ${player?.name} (${player?.team.shortCode}) in a previous week - cannot use them again.`,
      });
    }
  }

  return errors;
}

/**
 * Validates team constraints based on the week number
 */
export async function validateTeamConstraints(
  weekNumber: number,
  lineupData: LineupData
): Promise<LineupValidationError[]> {
  const errors: LineupValidationError[] = [];

  // Get team IDs for all players
  const playerIds = [
    lineupData.qbId,
    lineupData.rbId,
    lineupData.wrId,
    lineupData.teId,
    lineupData.flexId,
  ];

  const players = await prisma.player.findMany({
    where: {
      id: {
        in: playerIds,
      },
    },
    include: {
      team: true,
    },
  });

  const teamCounts = new Map<string, number>();
  players.forEach((player) => {
    const count = teamCounts.get(player.teamId) || 0;
    teamCounts.set(player.teamId, count + 1);
  });

  const counts = Array.from(teamCounts.values()).sort((a, b) => b - a);

  switch (weekNumber) {
    case 1: // Wild Card - 12 teams, max 1 player per team
    case 2: // Divisional - 8 teams, max 1 player per team
      if (counts.length < 5 || counts[0] > 1) {
        errors.push({
          field: 'lineup',
          message: `For ${weekNumber === 1 ? 'Wild Card' : 'Divisional'} round, you must select players from 5 different teams (max 1 player per team).`,
        });
      }
      break;

    case 3: // Conference Championship - 4 teams, must be 2-1-1-1
      if (counts.length !== 4) {
        errors.push({
          field: 'lineup',
          message: 'Conference Championship lineup must include players from exactly 4 different teams.',
        });
      } else if (
        counts[0] !== 2 ||
        counts[1] !== 1 ||
        counts[2] !== 1 ||
        counts[3] !== 1
      ) {
        errors.push({
          field: 'lineup',
          message: 'Conference Championship lineup must be 2-1-1-1 (one team with 2 players, three teams with 1 player each).',
        });
      }
      break;

    case 4: // Super Bowl - 2 teams, must be 3-2
      if (counts.length !== 2) {
        errors.push({
          field: 'lineup',
          message: 'Super Bowl lineup must include players from exactly 2 different teams.',
        });
      } else if (
        !(
          (counts[0] === 3 && counts[1] === 2) ||
          (counts[0] === 2 && counts[1] === 3)
        )
      ) {
        errors.push({
          field: 'lineup',
          message: 'Super Bowl lineup must be a 3-2 split between the two teams.',
        });
      }
      break;

    default:
      errors.push({
        field: 'lineup',
        message: 'Invalid week number.',
      });
  }

  return errors;
}

/**
 * Validates position requirements (QB, RB, WR, TE, and FLEX must be RB/WR/TE)
 */
export async function validatePositions(
  lineupData: LineupData
): Promise<LineupValidationError[]> {
  const errors: LineupValidationError[] = [];

  const qb = await prisma.player.findUnique({ where: { id: lineupData.qbId } });
  const rb = await prisma.player.findUnique({ where: { id: lineupData.rbId } });
  const wr = await prisma.player.findUnique({ where: { id: lineupData.wrId } });
  const te = await prisma.player.findUnique({ where: { id: lineupData.teId } });
  const flex = await prisma.player.findUnique({
    where: { id: lineupData.flexId },
  });

  if (!qb || qb.position !== 'QB') {
    errors.push({ field: 'qbId', message: 'QB slot must have a QB.' });
  }
  if (!rb || rb.position !== 'RB') {
    errors.push({ field: 'rbId', message: 'RB slot must have a RB.' });
  }
  if (!wr || wr.position !== 'WR') {
    errors.push({ field: 'wrId', message: 'WR slot must have a WR.' });
  }
  if (!te || te.position !== 'TE') {
    errors.push({ field: 'teId', message: 'TE slot must have a TE.' });
  }
  if (!flex || !['RB', 'WR', 'TE'].includes(flex.position)) {
    errors.push({
      field: 'flexId',
      message: 'FLEX slot must have a RB, WR, or TE.',
    });
  }

  return errors;
}

/**
 * Validates a complete lineup submission
 */
export async function validateLineup(
  userId: string,
  weekNumber: number,
  lineupData: LineupData
): Promise<LineupValidationError[]> {
  const errors: LineupValidationError[] = [];

  // Validate all fields are present
  if (!lineupData.qbId || !lineupData.rbId || !lineupData.wrId || !lineupData.teId || !lineupData.flexId) {
    errors.push({
      field: 'lineup',
      message: 'All positions must be filled.',
    });
    return errors;
  }

  // Validate positions
  const positionErrors = await validatePositions(lineupData);
  errors.push(...positionErrors);

  if (positionErrors.length > 0) {
    return errors;
  }

  // Validate burn rule
  const burnErrors = await validateBurnRule(userId, weekNumber, lineupData);
  errors.push(...burnErrors);

  // Validate team constraints
  const teamErrors = await validateTeamConstraints(weekNumber, lineupData);
  errors.push(...teamErrors);

  return errors;
}
