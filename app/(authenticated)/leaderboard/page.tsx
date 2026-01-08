'use client';

import { useState } from 'react';

interface Player {
  id: string;
  name: string;
  team: { shortCode: string };
}

interface Lineup {
  qb: Player;
  rb: Player;
  wr: Player;
  te: Player;
  flex: Player;
  scores: {
    qb: number;
    rb: number;
    wr: number;
    te: number;
    flex: number;
    total: number;
  };
}

interface ModalProps {
  userName: string;
  weekNumber: number;
  weekLabel: string;
  lineup: Lineup | null;
  onClose: () => void;
}

function LineupModal({ userName, weekNumber, weekLabel, lineup, onClose }: ModalProps) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 max-w-2xl w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-100">{userName}</h2>
            <p className="text-slate-400">Week {weekNumber} - {weekLabel}</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {lineup ? (
          <>
            <div className="mb-4 text-right">
              <div className="text-sm text-slate-400">Total Score</div>
              <div className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                {lineup.scores.total.toFixed(2)}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { label: 'QB', player: lineup.qb, score: lineup.scores.qb },
                { label: 'RB', player: lineup.rb, score: lineup.scores.rb },
                { label: 'WR', player: lineup.wr, score: lineup.scores.wr },
                { label: 'TE', player: lineup.te, score: lineup.scores.te },
                { label: 'FLEX', player: lineup.flex, score: lineup.scores.flex },
              ].map(({ label, player, score }) => (
                <div key={label} className="bg-slate-900/50 border border-slate-700 rounded-lg p-4">
                  <div className="text-xs font-semibold text-slate-400 mb-1">
                    {label}
                  </div>
                  <div className="font-medium text-slate-100">{player.name}</div>
                  <div className="text-sm text-slate-400">{player.team.shortCode}</div>
                  <div className="mt-2 text-xl font-semibold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                    {score.toFixed(2)} pts
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-8 text-slate-400">
            No lineup submitted for this week
          </div>
        )}

        <button
          onClick={onClose}
          className="mt-6 w-full px-4 py-2 bg-slate-700 text-slate-200 rounded-lg hover:bg-slate-600 transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
}

interface LeaderboardClientProps {
  userScores: Array<{
    userId: string;
    name: string;
    weekScores: number[];
    total: number;
  }>;
  weeks: Array<{
    id: string;
    number: number;
    label: string;
  }>;
  lineupData: Record<string, Record<string, Lineup | null>>;
  currentUserId: string;
}

export default function LeaderboardClient({ userScores, weeks, lineupData, currentUserId }: LeaderboardClientProps) {
  const [selectedModal, setSelectedModal] = useState<{ userId: string; weekId: string } | null>(null);

  const openModal = (userId: string, weekId: string) => {
    setSelectedModal({ userId, weekId });
  };

  const closeModal = () => {
    setSelectedModal(null);
  };

  const modalData = selectedModal
    ? {
        userName: userScores.find((u) => u.userId === selectedModal.userId)?.name || '',
        week: weeks.find((w) => w.id === selectedModal.weekId),
        lineup: lineupData[selectedModal.userId]?.[selectedModal.weekId] || null,
      }
    : null;

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

  // Build lineup data for modal
  const lineupData: Record<string, Record<string, Lineup | null>> = {};
  
  const allLineupsWithPlayers = await prisma.lineup.findMany({
    include: {
      qb: { include: { team: true } },
      rb: { include: { team: true } },
      wr: { include: { team: true } },
      te: { include: { team: true } },
      flex: { include: { team: true } },
    },
  });

  users.forEach((user: { id: string }) => {
    lineupData[user.id] = {};
    weeks.forEach((week: WeekRecord) => {
      const lineup = allLineupsWithPlayers.find(
        (l) => l.userId === user.id && l.weekId === week.id
      );

      if (lineup) {
        const weekScores = scoreMap.get(week.id);
        const qbScore = weekScores?.get(lineup.qbId) || 0;
        const rbScore = weekScores?.get(lineup.rbId) || 0;
        const wrScore = weekScores?.get(lineup.wrId) || 0;
        const teScore = weekScores?.get(lineup.teId) || 0;
        const flexScore = weekScores?.get(lineup.flexId) || 0;

        lineupData[user.id][week.id] = {
          qb: lineup.qb,
          rb: lineup.rb,
          wr: lineup.wr,
          te: lineup.te,
          flex: lineup.flex,
          scores: {
            qb: qbScore,
            rb: rbScore,
            wr: wrScore,
            te: teScore,
            flex: flexScore,
            total: qbScore + rbScore + wrScore + teScore + flexScore,
          },
        };
      } else {
        lineupData[user.id][week.id] = null;
      }
    });
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
      const lineup = lineupData[user.id][week.id];
      return lineup ? lineup.scores.total : 0;
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
    <LeaderboardClient
      userScores={userScores}
      weeks={weeks}
      lineupData={lineupData}
      currentUserId={session.user.id}
    />
  );
}

// Server component wrapper
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

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">Leaderboard</h1>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {userScores.map((userScore, index) => (
          <div
            key={userScore.userId}
            className={`bg-slate-800 border shadow-xl rounded-xl p-4 ${
              userScore.userId === currentUserId
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
                  {userScore.userId === currentUserId && (
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
              {userScore.weekScores.map((score, weekIndex) => (
                <button
                  key={weekIndex}
                  onClick={() => openModal(userScore.userId, weeks[weekIndex].id)}
                  className="text-center hover:bg-slate-700/50 rounded p-1 transition-colors"
                >
                  <div className="text-xs text-slate-400">W{weekIndex + 1}</div>
                  <div className="text-sm font-semibold text-slate-200">
                    {score > 0 ? score.toFixed(1) : '-'}
                  </div>
                </button>
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
                {weeks.map((week) => (
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
              {userScores.map((userScore, index) => (
                <tr
                  key={userScore.userId}
                  className={
                    userScore.userId === currentUserId
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
                    {userScore.userId === currentUserId && (
                      <span className="ml-2 text-blue-400 text-xs">(You)</span>
                    )}
                  </td>
                  {userScore.weekScores.map((score, weekIndex) => (
                    <td
                      key={weekIndex}
                      className="px-6 py-4 whitespace-nowrap text-sm text-center"
                    >
                      <button
                        onClick={() => openModal(userScore.userId, weeks[weekIndex].id)}
                        className="text-slate-200 hover:text-blue-400 transition-colors cursor-pointer"
                      >
                        {score > 0 ? score.toFixed(2) : '-'}
                      </button>
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

      {selectedModal && modalData && modalData.week && (
        <LineupModal
          userName={modalData.userName}
          weekNumber={modalData.week.number}
          weekLabel={modalData.week.label}
          lineup={modalData.lineup}
          onClose={closeModal}
        />
      )}
    </div>
  );
}
