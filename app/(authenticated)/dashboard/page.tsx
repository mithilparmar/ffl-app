import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { getCurrentWeek, isWeekLocked } from '@/lib/week-utils';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { DeadlineDisplay } from '@/components/DeadlineDisplay';

export default async function DashboardPage() {
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  const currentWeek = await getCurrentWeek();

  if (!currentWeek) {
    return (
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8">Dashboard</h1>
        <div className="bg-gray-50 rounded-lg p-6 text-center text-gray-600">
          No active week found. Please contact an admin to set up weeks.
        </div>
      </div>
    );
  }

  const locked = isWeekLocked(currentWeek);

  // Get all past weeks (locked weeks before the current week)
  const pastWeeks = await prisma.week.findMany({
    where: {
      number: { lt: currentWeek.number },
      OR: [
        { isLocked: true },
        { deadline: { lt: new Date() } }
      ]
    },
    orderBy: { number: 'desc' },
  });

  // Get user's lineups and scores for past weeks
  const pastWeeksData = await Promise.all(
    pastWeeks.map(async (week) => {
      const lineup = await prisma.lineup.findUnique({
        where: {
          weekId_userId: {
            weekId: week.id,
            userId: session.user.id,
          },
        },
        include: {
          qb: { include: { team: true } },
          rb: { include: { team: true } },
          wr: { include: { team: true } },
          te: { include: { team: true } },
          flex: { include: { team: true } },
        },
      });

      let totalScore = 0;
      if (lineup) {
        const playerIds = [lineup.qbId, lineup.rbId, lineup.wrId, lineup.teId, lineup.flexId];
        const scores = await prisma.playerScore.findMany({
          where: {
            weekId: week.id,
            playerId: { in: playerIds },
          },
        });
        totalScore = scores.reduce((sum, score) => sum + score.points, 0);
      }

      return {
        week,
        lineup,
        totalScore,
      };
    })
  );

  return (
    <div>
      <h1 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">Dashboard</h1>

      <div className="bg-gradient-to-br from-slate-800 to-slate-900 shadow-xl border border-slate-700 rounded-xl p-4 sm:p-6 mb-6 sm:mb-8">
        <h2 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-4 text-slate-100">Welcome, {session.user.name}!</h2>
        <p className="text-sm sm:text-base text-slate-300">
          {locked 
            ? "The current week's deadline has passed. View the submitted lineups below."
            : "Submit your lineup for the current week before the deadline."}
        </p>
      </div>

      <div className="max-w-2xl mx-auto">
        <div className="bg-slate-800 border border-slate-700 shadow-xl rounded-xl p-4 sm:p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-slate-100">Week {currentWeek.number}</h3>
              <p className="text-sm sm:text-base text-slate-300">{currentWeek.label}</p>
              {currentWeek.deadline && (
                <DeadlineDisplay deadline={currentWeek.deadline} />
              )}
            </div>
            <span
              className={`px-2 sm:px-3 py-1 rounded-lg text-xs sm:text-sm font-semibold whitespace-nowrap shadow-lg ${
                locked
                  ? 'bg-gradient-to-r from-red-600 to-red-500 text-white shadow-red-500/30'
                  : 'bg-gradient-to-r from-green-600 to-green-500 text-white shadow-green-500/30'
              }`}
            >
              {locked ? 'Locked' : 'Open'}
            </span>
          </div>

          <div className="space-y-2">
            {!locked && (
              <Link
                href={`/weeks/${currentWeek.number}/submit`}
                className="block w-full text-center px-4 py-2 sm:py-3 text-sm sm:text-base bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg hover:from-blue-700 hover:to-blue-600 transition-all transform hover:scale-[1.02] shadow-lg shadow-blue-500/20 font-medium"
              >
                Submit Lineup
              </Link>
            )}
            {locked && (
              <Link
                href={`/weeks/${currentWeek.number}/lineups`}
                className="block w-full text-center px-4 py-2 sm:py-3 text-sm sm:text-base bg-gradient-to-r from-slate-600 to-slate-700 text-white rounded-lg hover:from-slate-700 hover:to-slate-800 transition-all transform hover:scale-[1.02] shadow-lg font-medium"
              >
                View Lineups
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 sm:mt-8 bg-gradient-to-br from-blue-900/30 to-purple-900/30 border border-blue-800/50 rounded-xl p-4 sm:p-6 backdrop-blur-sm">
        <h3 className="text-base sm:text-lg font-semibold mb-2 text-slate-100">Game Rules</h3>
        <ul className="list-disc list-inside space-y-1 text-xs sm:text-sm text-slate-300">
          <li>Submit a 5-player lineup each week (QB, RB, WR, TE, FLEX)</li>
          <li><strong className="text-blue-400">Burn Rule:</strong> Once you use a player, you cannot use them again</li>
          <li><strong className="text-blue-400">Week 1 & 2:</strong> Max 1 player per team</li>
          <li><strong className="text-blue-400">Week 3:</strong> 2-1-1-1 split (4 teams)</li>
          <li><strong className="text-blue-400">Week 4:</strong> 3-2 split (2 teams)</li>
        </ul>
      </div>

      {/* Past Weeks Section */}
      {pastWeeksData.length > 0 && (
        <div className="mt-6 sm:mt-8">
          <h2 className="text-xl sm:text-2xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            Previous Weeks
          </h2>
          <div className="space-y-4">
            {pastWeeksData.map(({ week, lineup, totalScore }) => (
              <div
                key={week.id}
                className="bg-slate-800 border border-slate-700 shadow-xl rounded-xl p-4 sm:p-6"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-base sm:text-lg font-semibold text-slate-100">
                      Week {week.number}
                    </h3>
                    <p className="text-sm text-slate-300">{week.label}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-slate-400">Your Score</div>
                    <div className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                      {totalScore.toFixed(2)}
                    </div>
                  </div>
                </div>

                {lineup ? (
                  <div className="space-y-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                      <div className="bg-slate-700/50 rounded p-2">
                        <span className="text-slate-400 text-xs">QB:</span>{' '}
                        <span className="text-slate-100 font-medium">{lineup.qb.name}</span>
                        <span className="text-slate-400 text-xs ml-1">({lineup.qb.team.shortCode})</span>
                      </div>
                      <div className="bg-slate-700/50 rounded p-2">
                        <span className="text-slate-400 text-xs">RB:</span>{' '}
                        <span className="text-slate-100 font-medium">{lineup.rb.name}</span>
                        <span className="text-slate-400 text-xs ml-1">({lineup.rb.team.shortCode})</span>
                      </div>
                      <div className="bg-slate-700/50 rounded p-2">
                        <span className="text-slate-400 text-xs">WR:</span>{' '}
                        <span className="text-slate-100 font-medium">{lineup.wr.name}</span>
                        <span className="text-slate-400 text-xs ml-1">({lineup.wr.team.shortCode})</span>
                      </div>
                      <div className="bg-slate-700/50 rounded p-2">
                        <span className="text-slate-400 text-xs">TE:</span>{' '}
                        <span className="text-slate-100 font-medium">{lineup.te.name}</span>
                        <span className="text-slate-400 text-xs ml-1">({lineup.te.team.shortCode})</span>
                      </div>
                      <div className="bg-slate-700/50 rounded p-2 sm:col-span-2">
                        <span className="text-slate-400 text-xs">FLEX:</span>{' '}
                        <span className="text-slate-100 font-medium">{lineup.flex.name}</span>
                        <span className="text-slate-400 text-xs ml-1">({lineup.flex.team.shortCode})</span>
                      </div>
                    </div>
                    <Link
                      href={`/weeks/${week.number}/lineups`}
                      className="block w-full text-center px-4 py-2 text-sm bg-slate-700 text-slate-200 rounded-lg hover:bg-slate-600 transition-colors mt-3"
                    >
                      View All Lineups
                    </Link>
                  </div>
                ) : (
                  <p className="text-sm text-slate-400 italic">No lineup submitted</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
