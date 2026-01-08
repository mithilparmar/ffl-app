'use client';

import { useState, useEffect } from 'react';
import { calculatePlayerScore, PlayerStats } from '@/lib/scoring';

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
  const [stats, setStats] = useState<Record<string, PlayerStats>>({});
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

  const updatePlayerStat = (playerId: string, field: keyof PlayerStats, value: string) => {
    const current = stats[playerId] || {};
    const num = value === '' ? undefined : parseFloat(value);
    const next: PlayerStats = { ...current, [field]: isNaN(num as number) ? undefined : (num as number) };
    const computed = calculatePlayerScore(next);
    setStats({ ...stats, [playerId]: next });
    setScores({ ...scores, [playerId]: computed.toString() });
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
      <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
        Enter Player Stats - Week {week.number}
      </h1>
      <p className="text-slate-300 mb-8">{week.label}</p>

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
        <div className="bg-slate-800 border border-slate-700 shadow-xl rounded-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
            {players.map((player) => (
              <div key={player.id} className="p-4 bg-slate-700/50 rounded border border-slate-600/50">
                <div className="font-medium text-slate-100">{player.name}</div>
                <div className="text-sm text-slate-400 mb-3">
                  {player.position} - {player.team.shortCode}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-xs font-semibold text-slate-300 mb-1">Passing</div>
                    <div className="space-y-2">
                      <input type="number" step="0.1" placeholder="Yds"
                        value={stats[player.id]?.pass_yd ?? ''}
                        onChange={(e) => updatePlayerStat(player.id, 'pass_yd', e.target.value)}
                        className="w-full px-3 py-2 bg-slate-700 border border-slate-600 text-slate-100 rounded-md" />
                      <input type="number" placeholder="TD"
                        value={stats[player.id]?.pass_td ?? ''}
                        onChange={(e) => updatePlayerStat(player.id, 'pass_td', e.target.value)}
                        className="w-full px-3 py-2 bg-slate-700 border border-slate-600 text-slate-100 rounded-md" />
                      <input type="number" placeholder="INT"
                        value={stats[player.id]?.pass_int ?? ''}
                        onChange={(e) => updatePlayerStat(player.id, 'pass_int', e.target.value)}
                        className="w-full px-3 py-2 bg-slate-700 border border-slate-600 text-slate-100 rounded-md" />
                      <input type="number" step="1" placeholder="Sacks"
                        value={stats[player.id]?.pass_sack ?? ''}
                        onChange={(e) => updatePlayerStat(player.id, 'pass_sack', e.target.value)}
                        className="w-full px-3 py-2 bg-slate-700 border border-slate-600 text-slate-100 rounded-md" />
                      <div className="grid grid-cols-2 gap-2">
                        <input type="number" placeholder="40+ TD"
                          value={stats[player.id]?.pass_td_40p ?? ''}
                          onChange={(e) => updatePlayerStat(player.id, 'pass_td_40p', e.target.value)}
                          className="w-full px-3 py-2 bg-slate-700 border border-slate-600 text-slate-100 rounded-md" />
                        <input type="number" placeholder="50+ TD"
                          value={stats[player.id]?.pass_td_50p ?? ''}
                          onChange={(e) => updatePlayerStat(player.id, 'pass_td_50p', e.target.value)}
                          className="w-full px-3 py-2 bg-slate-700 border border-slate-600 text-slate-100 rounded-md" />
                      </div>
                      <input type="number" placeholder="2pt (QB)"
                        value={stats[player.id]?.pass_2pt ?? ''}
                        onChange={(e) => updatePlayerStat(player.id, 'pass_2pt', e.target.value)}
                        className="w-full px-3 py-2 bg-slate-700 border border-slate-600 text-slate-100 rounded-md" />
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-300 mb-1">Rushing</div>
                    <div className="space-y-2">
                      <input type="number" step="0.1" placeholder="Yds"
                        value={stats[player.id]?.rush_yd ?? ''}
                        onChange={(e) => updatePlayerStat(player.id, 'rush_yd', e.target.value)}
                        className="w-full px-3 py-2 bg-slate-700 border border-slate-600 text-slate-100 rounded-md" />
                      <input type="number" placeholder="TD"
                        value={stats[player.id]?.rush_td ?? ''}
                        onChange={(e) => updatePlayerStat(player.id, 'rush_td', e.target.value)}
                        className="w-full px-3 py-2 bg-slate-700 border border-slate-600 text-slate-100 rounded-md" />
                      <div className="grid grid-cols-2 gap-2">
                        <input type="number" placeholder="40+ TD"
                          value={stats[player.id]?.rush_td_40p ?? ''}
                          onChange={(e) => updatePlayerStat(player.id, 'rush_td_40p', e.target.value)}
                          className="w-full px-3 py-2 bg-slate-700 border border-slate-600 text-slate-100 rounded-md" />
                        <input type="number" placeholder="50+ TD"
                          value={stats[player.id]?.rush_td_50p ?? ''}
                          onChange={(e) => updatePlayerStat(player.id, 'rush_td_50p', e.target.value)}
                          className="w-full px-3 py-2 bg-slate-700 border border-slate-600 text-slate-100 rounded-md" />
                      </div>
                      <input type="number" placeholder="2pt (Run)"
                        value={stats[player.id]?.rush_2pt ?? ''}
                        onChange={(e) => updatePlayerStat(player.id, 'rush_2pt', e.target.value)}
                        className="w-full px-3 py-2 bg-slate-700 border border-slate-600 text-slate-100 rounded-md" />
                    </div>
                  </div>

                  <div>
                    <div className="text-xs font-semibold text-slate-300 mb-1">Receiving</div>
                    <div className="space-y-2">
                      <input type="number" step="0.1" placeholder="Yds"
                        value={stats[player.id]?.rec_yd ?? ''}
                        onChange={(e) => updatePlayerStat(player.id, 'rec_yd', e.target.value)}
                        className="w-full px-3 py-2 bg-slate-700 border border-slate-600 text-slate-100 rounded-md" />
                      <input type="number" placeholder="TD"
                        value={stats[player.id]?.rec_td ?? ''}
                        onChange={(e) => updatePlayerStat(player.id, 'rec_td', e.target.value)}
                        className="w-full px-3 py-2 bg-slate-700 border border-slate-600 text-slate-100 rounded-md" />
                      <input type="number" step="0.1" placeholder="REC"
                        value={stats[player.id]?.rec ?? ''}
                        onChange={(e) => updatePlayerStat(player.id, 'rec', e.target.value)}
                        className="w-full px-3 py-2 bg-slate-700 border border-slate-600 text-slate-100 rounded-md" />
                      <div className="grid grid-cols-2 gap-2">
                        <input type="number" placeholder="40+ TD"
                          value={stats[player.id]?.rec_td_40p ?? ''}
                          onChange={(e) => updatePlayerStat(player.id, 'rec_td_40p', e.target.value)}
                          className="w-full px-3 py-2 bg-slate-700 border border-slate-600 text-slate-100 rounded-md" />
                        <input type="number" placeholder="50+ TD"
                          value={stats[player.id]?.rec_td_50p ?? ''}
                          onChange={(e) => updatePlayerStat(player.id, 'rec_td_50p', e.target.value)}
                          className="w-full px-3 py-2 bg-slate-700 border border-slate-600 text-slate-100 rounded-md" />
                      </div>
                      <input type="number" placeholder="2pt (Rec)"
                        value={stats[player.id]?.rec_2pt ?? ''}
                        onChange={(e) => updatePlayerStat(player.id, 'rec_2pt', e.target.value)}
                        className="w-full px-3 py-2 bg-slate-700 border border-slate-600 text-slate-100 rounded-md" />
                    </div>
                  </div>

                  <div>
                    <div className="text-xs font-semibold text-slate-300 mb-1">Misc</div>
                    <div className="space-y-2">
                      <input type="number" placeholder="Fumbles"
                        value={stats[player.id]?.fum ?? ''}
                        onChange={(e) => updatePlayerStat(player.id, 'fum', e.target.value)}
                        className="w-full px-3 py-2 bg-slate-700 border border-slate-600 text-slate-100 rounded-md" />
                      <input type="number" placeholder="Fumbles Lost"
                        value={stats[player.id]?.fum_lost ?? ''}
                        onChange={(e) => updatePlayerStat(player.id, 'fum_lost', e.target.value)}
                        className="w-full px-3 py-2 bg-slate-700 border border-slate-600 text-slate-100 rounded-md" />
                      <input type="number" placeholder="Fumble Rec TD"
                        value={stats[player.id]?.fum_rec_td ?? ''}
                        onChange={(e) => updatePlayerStat(player.id, 'fum_rec_td', e.target.value)}
                        className="w-full px-3 py-2 bg-slate-700 border border-slate-600 text-slate-100 rounded-md" />
                    </div>
                  </div>
                </div>

                <div className="mt-3 text-sm text-slate-300">Calculated: <span className="font-semibold text-slate-100">{scores[player.id] ?? '0.0'}</span> pts</div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-md hover:from-blue-700 hover:to-blue-600 disabled:bg-slate-600 disabled:cursor-not-allowed font-medium shadow-lg shadow-blue-500/20"
          >
            {saving ? 'Saving...' : 'Save Calculated Scores'}
          </button>
          <a
            href="/admin/weeks"
            className="px-6 py-3 border border-slate-600 text-slate-200 rounded-md hover:bg-slate-700 inline-block"
          >
            Back to Weeks
          </a>
        </div>
      </form>
    </div>
  );
}
