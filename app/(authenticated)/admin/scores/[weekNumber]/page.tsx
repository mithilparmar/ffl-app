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

  if (loading) return <div>Loading...</div>;
  if (!week) return <div>Week not found</div>;

  const isLocked = week.isLocked || (week.deadline && new Date() > new Date(week.deadline));

  if (!isLocked) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-2">Week Not Locked</h2>
          <p className="text-gray-700 mb-4">
            You can only enter scores for locked weeks.
          </p>
          <a href="/admin/weeks" className="text-blue-600 hover:underline">
            ← Back to Weeks Management
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">
        Enter Scores - Week {week.number}
      </h1>
      <p className="text-gray-600 mb-8">{week.label}</p>

      {message && (
        <div
          className={`mb-6 p-4 rounded-lg ${
            message.includes('Error')
              ? 'bg-red-50 text-red-800'
              : 'bg-green-50 text-green-800'
          }`}
        >
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {players.map((player) => (
              <div key={player.id} className="p-3 bg-gray-50 rounded">
                <div className="font-medium">{player.name}</div>
                <div className="text-sm text-gray-600 mb-2">
                  {player.position} - {player.team.shortCode}
                </div>
                <input
                  type="number"
                  step="0.1"
                  value={scores[player.id] || ''}
                  onChange={(e) => handleScoreChange(player.id, e.target.value)}
                  placeholder="0.0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
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
