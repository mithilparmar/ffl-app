import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';

export default async function LeaderboardPage() {
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  // Get all users
  const users = await prisma.user.findMany({
    where: {
      isAdmin: false,
    },
    orderBy: {
      name: 'asc',
    },
  });

  // Get all weeks
  const weeks = await prisma.week.findMany({
    orderBy: {
      number: 'asc',
    },
  });

  // Get all lineups
  const lineups = await prisma.lineup.findMany({
    include: {
      week: true,
      user: true,
    },
  });

  type LineupRecord = {
    userId: string;
    weekId: string;
    qbId: string;
    rbId: string;
    wrId: string;
    teId: string;
    flexId: string;
  };

  type WeekRecord = {
    id: string;
    number: number;
  };

  // Get all scores
  const scores = await prisma.playerScore.findMany();
  const scoreMap = new Map<string, Map<string, number>>();

  scores.forEach((score: { weekId: string; playerId: string; points: number }) => {
    if (!scoreMap.has(score.weekId)) {
      scoreMap.set(score.weekId, new Map());
    }
    scoreMap.get(score.weekId)!.set(score.playerId, score.points);
  });

  // Calculate scores for each user/week combination
  interface UserScore {
    userId: string;
    name: string;
    weekScores: number[];
    total: number;
  }

  const userScores: UserScore[] = users.map((user: { id: string; name: string }) => {
    const weekScores = weeks.map((week: WeekRecord) => {
      const lineup = lineups.find(
        (l: LineupRecord) => l.userId === user.id && l.weekId === week.id
      );

      if (!lineup) return 0;

      const weekScores = scoreMap.get(week.id);
      if (!weekScores) return 0;

      const qbScore = weekScores.get(lineup.qbId) || 0;
      const rbScore = weekScores.get(lineup.rbId) || 0;
      const wrScore = weekScores.get(lineup.wrId) || 0;
      const teScore = weekScores.get(lineup.teId) || 0;
      const flexScore = weekScores.get(lineup.flexId) || 0;

      return qbScore + rbScore + wrScore + teScore + flexScore;
    });

    const total = weekScores.reduce((sum: number, score: number) => sum + score, 0);

    return {
      userId: user.id,
      name: user.name,
      weekScores,
      total,
    };
  });

  // Sort by total score descending
  userScores.sort((a, b) => b.total - a.total);

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">Leaderboard</h1>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {userScores.map((userScore: UserScore, index: number) => (
          <div
            key={userScore.userId}
            className={`bg-slate-800 border shadow-xl rounded-xl p-4 ${
              userScore.userId === session.user.id
                ? 'ring-2 ring-blue-500 border-blue-600 shadow-blue-500/30'
                : index === 0
                ? 'ring-2 ring-yellow-500 border-yellow-600 shadow-yellow-500/30'
                : 'border-slate-700'
            }`}
          >
            <div className="flex justify-between items-start mb-3">
              <div>
                <div className="text-sm text-slate-400">
                  {index === 0 && userScore.total > 0 && (
                    <span className="mr-2">🏆</span>
                  )}
                  Rank #{index + 1}
                </div>
                <div className="font-semibold text-lg text-slate-100">
                  {userScore.name}
                  {userScore.userId === session.user.id && (
                    <span className="ml-2 text-blue-400 text-xs">(You)</span>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-slate-400">Total</div>
                <div className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                  {userScore.total.toFixed(2)}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-2 pt-3 border-t border-slate-700">
              {userScore.weekScores.map((score: number, weekIndex: number) => (
                <div key={weekIndex} className="text-center">
                  <div className="text-xs text-slate-400">W{weekIndex + 1}</div>
                  <div className="text-sm font-semibold text-slate-200">
                    {score > 0 ? score.toFixed(1) : '-'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block bg-slate-800 border border-slate-700 shadow-xl rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-700">
            <thead className="bg-slate-900/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                  Rank
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                  Manager
                </th>
                {weeks.map((week: WeekRecord) => (
                  <th
                    key={week.id}
                    className="px-6 py-3 text-center text-xs font-medium text-slate-300 uppercase tracking-wider"
                  >
                    Week {week.number}
                  </th>
                ))}
                <th className="px-6 py-3 text-center text-xs font-medium text-slate-300 uppercase tracking-wider bg-gradient-to-r from-blue-900/50 to-purple-900/50">
                  Total
                </th>
              </tr>
            </thead>
            <tbody className="bg-slate-800 divide-y divide-slate-700">
              {userScores.map((userScore: UserScore, index: number) => (
                <tr
                  key={userScore.userId}
                  className={
                    userScore.userId === session.user.id
                      ? 'bg-blue-900/30'
                      : index === 0
                      ? 'bg-yellow-900/20'
                      : ''
                  }
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-200">
                    {index === 0 && userScore.total > 0 && (
                      <span className="mr-2">🏆</span>
                    )}
                    #{index + 1}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-100">
                    {userScore.name}
                    {userScore.userId === session.user.id && (
                      <span className="ml-2 text-blue-400 text-xs">(You)</span>
                    )}
                  </td>
                  {userScore.weekScores.map((score: number, weekIndex: number) => (
                    <td
                      key={weekIndex}
                      className="px-6 py-4 whitespace-nowrap text-sm text-center text-slate-200"
                    >
                      {score > 0 ? score.toFixed(2) : '-'}
                    </td>
                  ))}
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-center bg-gradient-to-r from-blue-900/50 to-purple-900/50">
                    <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                      {userScore.total.toFixed(2)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {userScores.every((u) => u.total === 0) && (
        <div className="mt-4 bg-slate-800 border border-slate-700 rounded-xl p-6 text-center text-slate-400">
          <p>No scores have been entered yet. Scores will appear once the admin enters player scores.</p>
        </div>
      )}

      <div className="mt-8">
        <a href="/dashboard" className="text-blue-400 hover:text-blue-300 transition-colors font-medium">
          ← Back to Dashboard
        </a>
      </div>
    </div>
  );
}
