import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { isWeekLocked } from '@/lib/week-utils';

export default async function WeekLineupsPage({
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

  if (!locked) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-2">
            Week {week.number} Lineups Not Yet Visible
          </h2>
          <p className="text-gray-700 mb-4">
            Lineups will be visible after the deadline passes or the week is locked by an admin.
          </p>
          <a
            href={`/weeks/${week.number}/submit`}
            className="text-blue-600 hover:underline"
          >
            ← Back to lineup submission
          </a>
        </div>
      </div>
    );
  }

  // Get all lineups for this week with player scores
  type LineupWithPlayers = {
    id: string;
    userId: string;
    weekId: string;
    qbId: string;
    rbId: string;
    wrId: string;
    teId: string;
    flexId: string;
    user: { id: string; name: string };
    qb: { name: string; team: { shortCode: string } };
    rb: { name: string; team: { shortCode: string } };
    wr: { name: string; team: { shortCode: string } };
    te: { name: string; team: { shortCode: string } };
    flex: { name: string; team: { shortCode: string } };
  };

  const lineups: LineupWithPlayers[] = await prisma.lineup.findMany({
    where: {
      weekId: week.id,
    },
    include: {
      user: true,
      qb: { include: { team: true } },
      rb: { include: { team: true } },
      wr: { include: { team: true } },
      te: { include: { team: true } },
      flex: { include: { team: true } },
    },
  });

  // Get scores for all players in these lineups
  const playerIds = new Set<string>();
  lineups.forEach((lineup: LineupWithPlayers) => {
    playerIds.add(lineup.qbId);
    playerIds.add(lineup.rbId);
    playerIds.add(lineup.wrId);
    playerIds.add(lineup.teId);
    playerIds.add(lineup.flexId);
  });

  const scores = await prisma.playerScore.findMany({
    where: {
      weekId: week.id,
      playerId: {
        in: Array.from(playerIds),
      },
    },
  });

  const scoreMap = new Map(scores.map((s) => [s.playerId, s.points]));

  // Calculate lineup scores
  const lineupsWithScores = lineups.map((lineup: LineupWithPlayers) => {
    const qbScore = scoreMap.get(lineup.qbId) || 0;
    const rbScore = scoreMap.get(lineup.rbId) || 0;
    const wrScore = scoreMap.get(lineup.wrId) || 0;
    const teScore = scoreMap.get(lineup.teId) || 0;
    const flexScore = scoreMap.get(lineup.flexId) || 0;
    const totalScore = qbScore + rbScore + wrScore + teScore + flexScore;

    return {
      ...lineup,
      scores: {
        qb: qbScore,
        rb: rbScore,
        wr: wrScore,
        te: teScore,
        flex: flexScore,
        total: totalScore,
      },
    };
  });

  // Sort by total score descending
  lineupsWithScores.sort((a, b) => b.scores.total - a.scores.total);

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">
        Week {week.number} Lineups
      </h1>
      <p className="text-gray-600 mb-8">{week.label}</p>

      {lineupsWithScores.length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-6 text-center text-gray-600">
          No lineups submitted for this week yet.
        </div>
      ) : (
        <div className="space-y-6">
          {lineupsWithScores.map((lineup: LineupWithPlayers & { scores: { qb: number; rb: number; wr: number; te: number; flex: number; total: number } }, index: number) => (
            <div key={lineup.id} className="bg-white shadow rounded-lg p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-semibold">
                    {lineup.user.name}
                    {lineup.userId === session.user.id && (
                      <span className="ml-2 text-sm text-blue-600">(You)</span>
                    )}
                  </h3>
                  {index === 0 && lineup.scores.total > 0 && (
                    <span className="inline-block mt-1 bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">
                      🏆 Top Score
                    </span>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-blue-600">
                    {lineup.scores.total.toFixed(2)}
                  </div>
                  <div className="text-sm text-gray-600">Total Points</div>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4">
                {[
                  { label: 'QB', player: lineup.qb, score: lineup.scores.qb },
                  { label: 'RB', player: lineup.rb, score: lineup.scores.rb },
                  { label: 'WR', player: lineup.wr, score: lineup.scores.wr },
                  { label: 'TE', player: lineup.te, score: lineup.scores.te },
                  { label: 'FLEX', player: lineup.flex, score: lineup.scores.flex },
                ].map(({ label, player, score }: { label: string; player: LineupWithPlayers['qb']; score: number }) => (
                  <div key={label} className="bg-gray-50 rounded p-3">
                    <div className="text-xs font-semibold text-gray-600 mb-1">
                      {label}
                    </div>
                    <div className="font-medium">{player.name}</div>
                    <div className="text-sm text-gray-600">{player.team.shortCode}</div>
                    <div className="mt-2 text-lg font-semibold text-blue-600">
                      {score.toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-8">
        <a
          href="/dashboard"
          className="text-blue-600 hover:underline"
        >
          ← Back to Dashboard
        </a>
      </div>
    </div>
  );
}
