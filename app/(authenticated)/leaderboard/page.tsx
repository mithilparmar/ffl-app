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

  // Get all scores
  const scores = await prisma.playerScore.findMany();
  const scoreMap = new Map<string, Map<string, number>>();

  scores.forEach((score) => {
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

  const userScores: UserScore[] = users.map((user) => {
    const weekScores = weeks.map((week) => {
      const lineup = lineups.find(
        (l) => l.userId === user.id && l.weekId === week.id
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

    const total = weekScores.reduce((sum, score) => sum + score, 0);

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
      <h1 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8">Leaderboard</h1>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {userScores.map((userScore, index) => (
          <div
            key={userScore.userId}
            className={`bg-white shadow rounded-lg p-4 ${
              userScore.userId === session.user.id
                ? 'ring-2 ring-blue-500'
                : index === 0
                ? 'ring-2 ring-yellow-500'
                : ''
            }`}
          >
            <div className="flex justify-between items-start mb-3">
              <div>
                <div className="text-sm text-gray-600">
                  {index === 0 && userScore.total > 0 && (
                    <span className="mr-2">🏆</span>
                  )}
                  Rank #{index + 1}
                </div>
                <div className="font-semibold text-lg">
                  {userScore.name}
                  {userScore.userId === session.user.id && (
                    <span className="ml-2 text-blue-600 text-xs">(You)</span>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-600">Total</div>
                <div className="text-2xl font-bold text-blue-600">
                  {userScore.total.toFixed(2)}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-2 pt-3 border-t">
              {userScore.weekScores.map((score, weekIndex) => (
                <div key={weekIndex} className="text-center">
                  <div className="text-xs text-gray-600">W{weekIndex + 1}</div>
                  <div className="text-sm font-semibold">
                    {score > 0 ? score.toFixed(1) : '-'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rank
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Manager
                </th>
                {weeks.map((week) => (
                  <th
                    key={week.id}
                    className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Week {week.number}
                  </th>
                ))}
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider bg-blue-50">
                  Total
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {userScores.map((userScore, index) => (
                <tr
                  key={userScore.userId}
                  className={
                    userScore.userId === session.user.id
                      ? 'bg-blue-50'
                      : index === 0
                      ? 'bg-yellow-50'
                      : ''
                  }
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {index === 0 && userScore.total > 0 && (
                      <span className="mr-2">🏆</span>
                    )}
                    #{index + 1}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {userScore.name}
                    {userScore.userId === session.user.id && (
                      <span className="ml-2 text-blue-600 text-xs">(You)</span>
                    )}
                  </td>
                  {userScore.weekScores.map((score, weekIndex) => (
                    <td
                      key={weekIndex}
                      className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900"
                    >
                      {score > 0 ? score.toFixed(2) : '-'}
                    </td>
                  ))}
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-center text-blue-600 bg-blue-50">
                    {userScore.total.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {userScores.every((u) => u.total === 0) && (
        <div className="mt-4 bg-gray-50 rounded-lg p-6 text-center text-gray-600">
          <p>No scores have been entered yet. Scores will appear once the admin enters player scores.</p>
        </div>
      )}

      <div className="mt-8">
        <a href="/dashboard" className="text-blue-600 hover:underline">
          ← Back to Dashboard
        </a>
      </div>
    </div>
  );
}
