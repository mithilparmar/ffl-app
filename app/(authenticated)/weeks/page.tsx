import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { isWeekLocked } from '@/lib/week-utils';
import Link from 'next/link';
import { DeadlineDisplay } from '@/components/DeadlineDisplay';

export default async function WeeksPage() {
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  const weeks = await prisma.week.findMany({
    orderBy: { number: 'asc' },
  });

  // Find the first unlocked week (current week)
  let currentWeekNumber: number | null = null;
  for (const week of weeks) {
    if (!isWeekLocked(week)) {
      currentWeekNumber = week.number;
      break;
    }
  }

  const weeksWithStatus = weeks.map((week) => {
    const isLocked = isWeekLocked(week);
    const isCurrent = week.number === currentWeekNumber;
    const isFutureWeek = !isLocked && !isCurrent;

    return {
      ...week,
      locked: isLocked,
      isCurrent,
      isFutureWeek,
      displayAsLocked: isLocked || isFutureWeek, // Show as locked if truly locked or if it's a future week
    };
  });

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
        All Weeks
      </h1>

      <div className="space-y-4">
        {weeksWithStatus.map((week) => (
          <div
            key={week.id}
            className="bg-slate-800 border border-slate-700 shadow-xl rounded-xl p-6"
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-xl font-semibold text-slate-100">
                  Week {week.number}
                </h3>
                <p className="text-sm text-slate-300">{week.label}</p>
                {week.deadline && (
                  <div className="mt-1">
                    <DeadlineDisplay deadline={week.deadline} />
                  </div>
                )}
              </div>
              <span
                className={`px-3 py-1 rounded-lg text-sm font-semibold whitespace-nowrap shadow-lg ${
                  week.displayAsLocked
                    ? 'bg-gradient-to-r from-red-600 to-red-500 text-white shadow-red-500/30'
                    : 'bg-gradient-to-r from-green-600 to-green-500 text-white shadow-green-500/30'
                }`}
              >
                {week.displayAsLocked ? 'Locked' : 'Open'}
              </span>
            </div>

            <div className="mt-4 flex gap-2">
              {!week.locked && week.isCurrent && (
                <Link
                  href={`/weeks/${week.number}/submit`}
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg hover:from-blue-700 hover:to-blue-600 transition-all shadow-lg shadow-blue-500/20 font-medium text-sm"
                >
                  Submit Lineup
                </Link>
              )}
              {!week.locked && !week.isCurrent && (
                <button
                  disabled
                  className="px-4 py-2 bg-slate-700/50 text-slate-500 rounded-lg font-medium text-sm cursor-not-allowed opacity-50"
                >
                  Submit Lineup
                </button>
              )}
              {week.locked && (
                <Link
                  href={`/weeks/${week.number}/lineups`}
                  className="px-4 py-2 bg-slate-700 text-slate-200 rounded-lg hover:bg-slate-600 transition-colors font-medium text-sm"
                >
                  View Lineups
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
