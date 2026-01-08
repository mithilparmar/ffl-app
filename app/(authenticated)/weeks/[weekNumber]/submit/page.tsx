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
        <div className="bg-gradient-to-br from-yellow-900/30 to-orange-900/30 border border-yellow-600/50 rounded-xl p-6 backdrop-blur-sm">
          <h2 className="text-xl font-semibold mb-2 text-yellow-400">Week {week.number} is Locked</h2>
          <p className="text-slate-300 mb-4">
            Lineup submissions for {week.label} are now closed.
          </p>
          <a
            href={`/weeks/${week.number}/lineups`}
            className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
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
      <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
        Submit Lineup - Week {week.number}
      </h1>
      <p className="text-slate-400 mb-8">{week.label}</p>

      {usedPlayers.length > 0 && (
        <div className="bg-gradient-to-br from-blue-900/30 to-purple-900/30 border border-blue-600/50 rounded-xl p-4 mb-6 backdrop-blur-sm">
          <h3 className="font-semibold mb-2 text-blue-400">Previously Used Players (Burn Rule):</h3>
          <div className="flex flex-wrap gap-2">
            {usedPlayers.map(({ player, week: w }) => (
              <span
                key={player.id}
                className="inline-block bg-blue-500/20 border border-blue-500/30 text-blue-300 text-sm px-3 py-1 rounded-lg"
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
