'use client';

import { useState, useEffect } from 'react';

interface Player {
  id: string;
  name: string;
  position: string;
  team: {
    shortCode: string;
  };
}

interface PlayerScore {
  playerId: string;
  points: number;
}

interface Week {
  id: string;
  number: number;
  label: string;
  isLocked: boolean;
  deadline: string | null;
}

export default function ScoresPage({
  params,
}: {
  params: Promise<{ weekNumber: string }>;
}) {
  const [weekNumber, setWeekNumber] = useState<number | null>(null);
  const [week, setWeek] = useState<Week | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [scores, setScores] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    params.then(({ weekNumber: wn }) => {
      setWeekNumber(parseInt(wn));
    });
  }, [params]);

  useEffect(() => {
    if (weekNumber) {
      fetchData();
    }
  }, [weekNumber]);

  const fetchData = async () => {
    try {
      const [weekRes, playersRes, scoresRes] = await Promise.all([
        fetch(`/api/admin/scores/${weekNumber}/week`),
        fetch(`/api/admin/scores/${weekNumber}/players`),
        fetch(`/api/admin/scores/${weekNumber}`),
      ]);

      const weekData = await weekRes.json();
      const playersData = await playersRes.json();
      const scoresData = await scoresRes.json();

      setWeek(weekData);
      setPlayers(playersData);

      const scoresMap: Record<string, string> = {};
      scoresData.forEach((score: PlayerScore) => {
        scoresMap[score.playerId] = score.points.toString();
      });
      setScores(scoresMap);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleScoreChange = (playerId: string, value: string) => {
    setScores({ ...scores, [playerId]: value });
  };

  const handleFetchStats = async () => {
    setFetching(true);
    setMessage('');

    try {
      const response = await fetch(`/api/admin/fetch-stats/${weekNumber}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch stats');
      }

      // Update scores with fetched data
      const newScores: Record<string, string> = { ...scores };
      data.scores.forEach((score: { playerId: string; points: number }) => {
        newScores[score.playerId] = score.points.toString();
      });
      setScores(newScores);

      if (data.unmappedPlayers && data.unmappedPlayers.length > 0) {
        setMessage(
          `Stats fetched! ${data.scores.length} players updated. ${data.unmappedPlayers.length} players need Sleeper ID mapping.`
        );
      } else {
        setMessage(`Stats fetched successfully! ${data.scores.length} players updated.`);
      }

      setTimeout(() => setMessage(''), 5000);
    } catch (error) {
      console.error('Error fetching stats:', error);
      setMessage('Error fetching stats. Please try again.');
    } finally {
      setFetching(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');

    try {
      const scoresArray = Object.entries(scores)
        .filter(([_, points]) => points !== '')
        .map(([playerId, points]) => ({
          playerId,
          points: parseFloat(points) || 0,
        }));

      await fetch(`/api/admin/scores/${weekNumber}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scores: scoresArray }),
      });

      setMessage('Scores saved successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error saving scores:', error);
      setMessage('Error saving scores. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-slate-300">Loading...</div>;
  if (!week) return <div className="text-slate-300">Week not found</div>;

  const isLocked = week.isLocked || (week.deadline && new Date() > new Date(week.deadline));

  if (!isLocked) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-gradient-to-br from-yellow-900/40 to-orange-900/40 border border-yellow-500/30 rounded-lg p-6 shadow-lg">
          <h2 className="text-xl font-semibold mb-2 text-slate-100">Week Not Locked</h2>
          <p className="text-slate-300 mb-4">
            You can only enter scores for locked weeks.
          </p>
          <a href="/admin/weeks" className="text-blue-400 hover:text-blue-300 hover:underline">
            ← Back to Weeks Management
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
        Enter Scores - Week {week.number}
      </h1>
      <p className="text-slate-400 mb-8">{week.label}</p>

      {message && (
        <div
          className={`mb-6 p-4 rounded-lg ${
            message.includes('Error')
              ? 'bg-red-50 text-red-800 border border-red-200'
              : 'bg-green-50 text-green-800 border border-green-200'
          }`}
        >
          {message}
        </div>
      )}

      <div className="mb-6 flex gap-4">
        <button
          type="button"
          onClick={handleFetchStats}
          disabled={fetching}
          className="px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-lg hover:from-purple-700 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-lg shadow-purple-500/20 transition-all transform hover:scale-[1.02]"
        >
          {fetching ? 'Fetching Stats...' : '🔄 Auto-Fetch Stats from API'}
        </button>
        <div className="text-sm text-slate-400 flex items-center">
          <span>Automatically fetch and calculate scores from Sleeper API</span>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="bg-slate-800 border border-slate-700 shadow-xl rounded-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {players.map((player) => (
              <div key={player.id} className="p-3 bg-slate-700/50 hover:bg-slate-700 rounded border border-slate-600/50 transition-colors">
                <div className="font-medium text-slate-100">{player.name}</div>
                <div className="text-sm text-slate-400 mb-2">
                  {player.position} - {player.team.shortCode}
                </div>
                <input
                  type="number"
                  step="0.1"
                  value={scores[player.id] || ''}
                  onChange={(e) => handleScoreChange(player.id, e.target.value)}
                  placeholder="0.0"
                  className="w-full px-3 py-2 bg-slate-600 border border-slate-500 text-slate-100 placeholder-slate-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg hover:from-blue-700 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-lg shadow-blue-500/20 transition-all transform hover:scale-[1.02]"
          >
            {saving ? 'Saving...' : 'Save Scores'}
          </button>
          <a
            href="/admin/weeks"
            className="px-6 py-3 border border-gray-300 rounded-md hover:bg-gray-50 inline-block"
          >
            Back to Weeks
          </a>
        </div>
      </form>
    </div>
  );
}
