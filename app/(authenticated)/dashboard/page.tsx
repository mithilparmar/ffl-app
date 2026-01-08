import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { getCurrentWeek, isWeekLocked } from '@/lib/week-utils';
import Link from 'next/link';
import { redirect } from 'next/navigation';

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

  return (
    <div>
      <h1 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8">Dashboard</h1>

      <div className="bg-white shadow rounded-lg p-4 sm:p-6 mb-6 sm:mb-8">
        <h2 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-4">Welcome, {session.user.name}!</h2>
        <p className="text-sm sm:text-base text-gray-600">
          {locked 
            ? "The current week's deadline has passed. View the submitted lineups below."
            : "Submit your lineup for the current week before the deadline."}
        </p>
      </div>

      <div className="max-w-2xl mx-auto">
        <div className="bg-white shadow rounded-lg p-4 sm:p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-base sm:text-lg font-semibold">Week {currentWeek.number}</h3>
              <p className="text-sm sm:text-base text-gray-600">{currentWeek.label}</p>
              {currentWeek.deadline && (
                <p className="text-xs sm:text-sm text-gray-500 mt-1">
                  Deadline: {new Date(currentWeek.deadline).toLocaleString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                    timeZoneName: 'short'
                  })}
                </p>
              )}
            </div>
            <span
              className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap ${
                locked
                  ? 'bg-red-100 text-red-800'
                  : 'bg-green-100 text-green-800'
              }`}
            >
              {locked ? 'Locked' : 'Open'}
            </span>
          </div>

          <div className="space-y-2">
            {!locked && (
              <Link
                href={`/weeks/${currentWeek.number}/submit`}
                className="block w-full text-center px-4 py-2 sm:py-3 text-sm sm:text-base bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Submit Lineup
              </Link>
            )}
            {locked && (
              <Link
                href={`/weeks/${currentWeek.number}/lineups`}
                className="block w-full text-center px-4 py-2 sm:py-3 text-sm sm:text-base bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                View Lineups
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 sm:mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-semibold mb-2">Game Rules</h3>
        <ul className="list-disc list-inside space-y-1 text-xs sm:text-sm text-gray-700">
          <li>Submit a 5-player lineup each week (QB, RB, WR, TE, FLEX)</li>
          <li><strong>Burn Rule:</strong> Once you use a player, you cannot use them again</li>
          <li><strong>Week 1 & 2:</strong> Max 1 player per team</li>
          <li><strong>Week 3:</strong> 2-1-1-1 split (4 teams)</li>
          <li><strong>Week 4:</strong> 3-2 split (2 teams)</li>
        </ul>
      </div>
    </div>
  );
}
