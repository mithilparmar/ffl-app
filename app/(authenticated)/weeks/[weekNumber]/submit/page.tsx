import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import LineupForm from '@/components/LineupForm';
import { isWeekLocked } from '@/lib/week-utils';

export default async function SubmitLineupPage({
  params,
}: {
  params: Promise<{ weekNumber: string }>;
}) {
  const { weekNumber } = await params;
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  const weekNum = parseInt(weekNumber);
  const week = await prisma.week.findUnique({
    where: { number: weekNum },
  });

  if (!week) {
    return <div>Week not found</div>;
  }

  const locked = isWeekLocked(week);

  if (locked) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-2">Week {week.number} is Locked</h2>
          <p className="text-gray-700 mb-4">
            Lineup submissions for {week.label} are now closed.
          </p>
          <a
            href={`/weeks/${week.number}/lineups`}
            className="text-blue-600 hover:underline"
          >
            View submitted lineups →
          </a>
        </div>
      </div>
    );
  }

  // Get all players grouped by position
  type PlayerWithTeam = {
    id: string;
    name: string;
    position: 'QB' | 'RB' | 'WR' | 'TE' | 'K' | 'DST';
    team: { id: string; name: string; shortCode: string };
  };

  const players: PlayerWithTeam[] = await prisma.player.findMany({
    include: {
      team: true,
    },
    orderBy: [
      { team: { shortCode: 'asc' } },
      { name: 'asc' },
    ],
  });

  const qbs = players.filter((p: PlayerWithTeam) => p.position === 'QB');
  const rbs = players.filter((p: PlayerWithTeam) => p.position === 'RB');
  const wrs = players.filter((p: PlayerWithTeam) => p.position === 'WR');
  const tes = players.filter((p: PlayerWithTeam) => p.position === 'TE');
  const flexPlayers = [...rbs, ...wrs, ...tes];

  // Get previously used players for this user
  type PreviousLineup = {
    qb: PlayerWithTeam;
    rb: PlayerWithTeam;
    wr: PlayerWithTeam;
    te: PlayerWithTeam;
    flex: PlayerWithTeam;
    week: { number: number };
  };

  const previousLineups: PreviousLineup[] = await prisma.lineup.findMany({
    where: {
      userId: session.user.id,
      week: {
        number: {
          lt: weekNum,
        },
      },
    },
    include: {
      qb: { include: { team: true } },
      rb: { include: { team: true } },
      wr: { include: { team: true } },
      te: { include: { team: true } },
      flex: { include: { team: true } },
      week: true,
    },
  });

  const usedPlayerIds = new Set<string>();
  const usedPlayers: Array<{ player: PlayerWithTeam; week: number }> = [];

  previousLineups.forEach((lineup: PreviousLineup) => {
    [lineup.qb, lineup.rb, lineup.wr, lineup.te, lineup.flex].forEach((player: PlayerWithTeam) => {
      if (!usedPlayerIds.has(player.id)) {
        usedPlayerIds.add(player.id);
        usedPlayers.push({ player, week: lineup.week.number });
      }
    });
  });

  // Get existing lineup for this week
  const existingLineup = await prisma.lineup.findUnique({
    where: {
      weekId_userId: {
        weekId: week.id,
        userId: session.user.id,
      },
    },
  });

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">
        Submit Lineup - Week {week.number}
      </h1>
      <p className="text-gray-600 mb-8">{week.label}</p>

      {usedPlayers.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold mb-2">Previously Used Players (Burn Rule):</h3>
          <div className="flex flex-wrap gap-2">
            {usedPlayers.map(({ player, week: w }) => (
              <span
                key={player.id}
                className="inline-block bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded"
              >
                {player.name} ({player.team.shortCode}) - Week {w}
              </span>
            ))}
          </div>
        </div>
      )}

      <LineupForm
        week={week}
        qbs={qbs}
        rbs={rbs}
        wrs={wrs}
        tes={tes}
        flexPlayers={flexPlayers}
        existingLineup={existingLineup}
        usedPlayerIds={Array.from(usedPlayerIds)}
      />
    </div>
  );
}
