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

      // Initialize blank stats for each player
      const initialStats: Record<string, PlayerStats> = {};
      playersData.forEach((p: Player) => {
        initialStats[p.id] = {};
      });
      setStats(initialStats);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatChange = (playerId: string, field: keyof PlayerStats, value: string) => {
    const num = value === '' ? undefined : Number(value);
    setStats((prev) => ({
      ...prev,
      [playerId]: {
        ...prev[playerId],
        [field]: num,
      },
    }));
  };

  // No external fetch; manual stats entry only

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');

    try {
      const scoresArray = players.map((p) => ({
        playerId: p.id,
        points: calculatePlayerScore(stats[p.id] || {}),
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

      {/* Manual stats entry only; no API fetching */}

      <form onSubmit={handleSubmit}>
        <div className="bg-slate-800 border border-slate-700 shadow-xl rounded-lg p-6 mb-6">
          <div className="space-y-4">
            {players.map((player) => {
              const s = stats[player.id] || {};
              const computed = calculatePlayerScore(s);
              return (
                <div key={player.id} className="p-4 bg-slate-700/40 rounded border border-slate-600/50">
                  <div className="flex items-baseline justify-between mb-2">
                    <div className="font-medium text-slate-100">
                      {player.name}
                      <span className="ml-2 text-slate-400 text-sm">{player.position} - {player.team.shortCode}</span>
                    </div>
                    <div className="text-blue-400 font-semibold">{computed.toFixed(2)} pts</div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                    {/* Passing */}
                    <div className="bg-slate-800/60 p-3 rounded border border-slate-700">
                      <div className="text-slate-200 font-semibold mb-2">Passing</div>
                      <div className="grid grid-cols-2 gap-2">
                        <input type="number" step="0.1" placeholder="Yds"
                          value={s.pass_yd ?? ''}
                          onChange={(e) => handleStatChange(player.id, 'pass_yd', e.target.value)}
                          className="px-2 py-1 bg-slate-700 border border-slate-600 text-slate-100 rounded" />
                        <input type="number" placeholder="TD"
                          value={s.pass_td ?? ''}
                          onChange={(e) => handleStatChange(player.id, 'pass_td', e.target.value)}
                          className="px-2 py-1 bg-slate-700 border border-slate-600 text-slate-100 rounded" />
                        <input type="number" placeholder="INT"
                          value={s.pass_int ?? ''}
                          onChange={(e) => handleStatChange(player.id, 'pass_int', e.target.value)}
                          className="px-2 py-1 bg-slate-700 border border-slate-600 text-slate-100 rounded" />
                        <input type="number" step="0.1" placeholder="Sacks"
                          value={s.pass_sack ?? ''}
                          onChange={(e) => handleStatChange(player.id, 'pass_sack', e.target.value)}
                          className="px-2 py-1 bg-slate-700 border border-slate-600 text-slate-100 rounded" />
                        <input type="number" placeholder="TD 40+"
                          value={s.pass_td_40p ?? ''}
                          onChange={(e) => handleStatChange(player.id, 'pass_td_40p', e.target.value)}
                          className="px-2 py-1 bg-slate-700 border border-slate-600 text-slate-100 rounded" />
                        <input type="number" placeholder="TD 50+"
                          value={s.pass_td_50p ?? ''}
                          onChange={(e) => handleStatChange(player.id, 'pass_td_50p', e.target.value)}
                          className="px-2 py-1 bg-slate-700 border border-slate-600 text-slate-100 rounded" />
                      </div>
                    </div>
                    {/* Rushing */}
                    <div className="bg-slate-800/60 p-3 rounded border border-slate-700">
                      <div className="text-slate-200 font-semibold mb-2">Rushing</div>
                      <div className="grid grid-cols-2 gap-2">
                        <input type="number" step="0.1" placeholder="Yds"
                          value={s.rush_yd ?? ''}
                          onChange={(e) => handleStatChange(player.id, 'rush_yd', e.target.value)}
                          className="px-2 py-1 bg-slate-700 border border-slate-600 text-slate-100 rounded" />
                        <input type="number" placeholder="TD"
                          value={s.rush_td ?? ''}
                          onChange={(e) => handleStatChange(player.id, 'rush_td', e.target.value)}
                          className="px-2 py-1 bg-slate-700 border border-slate-600 text-slate-100 rounded" />
                        <input type="number" placeholder="TD 40+"
                          value={s.rush_td_40p ?? ''}
                          onChange={(e) => handleStatChange(player.id, 'rush_td_40p', e.target.value)}
                          className="px-2 py-1 bg-slate-700 border border-slate-600 text-slate-100 rounded" />
                        <input type="number" placeholder="TD 50+"
                          value={s.rush_td_50p ?? ''}
                          onChange={(e) => handleStatChange(player.id, 'rush_td_50p', e.target.value)}
                          className="px-2 py-1 bg-slate-700 border border-slate-600 text-slate-100 rounded" />
                      </div>
                    </div>
                    {/* Receiving */}
                    <div className="bg-slate-800/60 p-3 rounded border border-slate-700">
                      <div className="text-slate-200 font-semibold mb-2">Receiving</div>
                      <div className="grid grid-cols-2 gap-2">
                        <input type="number" step="0.1" placeholder="Yds"
                          value={s.rec_yd ?? ''}
                          onChange={(e) => handleStatChange(player.id, 'rec_yd', e.target.value)}
                          className="px-2 py-1 bg-slate-700 border border-slate-600 text-slate-100 rounded" />
                        <input type="number" placeholder="TD"
                          value={s.rec_td ?? ''}
                          onChange={(e) => handleStatChange(player.id, 'rec_td', e.target.value)}
                          className="px-2 py-1 bg-slate-700 border border-slate-600 text-slate-100 rounded" />
                        <input type="number" step="0.1" placeholder="Rec"
                          value={s.rec ?? ''}
                          onChange={(e) => handleStatChange(player.id, 'rec', e.target.value)}
                          className="px-2 py-1 bg-slate-700 border border-slate-600 text-slate-100 rounded" />
                        <input type="number" placeholder="TD 40+"
                          value={s.rec_td_40p ?? ''}
                          onChange={(e) => handleStatChange(player.id, 'rec_td_40p', e.target.value)}
                          className="px-2 py-1 bg-slate-700 border border-slate-600 text-slate-100 rounded" />
                        <input type="number" placeholder="TD 50+"
                          value={s.rec_td_50p ?? ''}
                          onChange={(e) => handleStatChange(player.id, 'rec_td_50p', e.target.value)}
                          className="px-2 py-1 bg-slate-700 border border-slate-600 text-slate-100 rounded" />
                      </div>
                    </div>
                    {/* Misc */}
                    <div className="bg-slate-800/60 p-3 rounded border border-slate-700">
                      <div className="text-slate-200 font-semibold mb-2">Misc</div>
                      <div className="grid grid-cols-2 gap-2">
                        <input type="number" placeholder="Fum"
                          value={s.fum ?? ''}
                          onChange={(e) => handleStatChange(player.id, 'fum', e.target.value)}
                          className="px-2 py-1 bg-slate-700 border border-slate-600 text-slate-100 rounded" />
                        <input type="number" placeholder="Fum Lost"
                          value={s.fum_lost ?? ''}
                          onChange={(e) => handleStatChange(player.id, 'fum_lost', e.target.value)}
                          className="px-2 py-1 bg-slate-700 border border-slate-600 text-slate-100 rounded" />
                        <input type="number" placeholder="Fum Rec TD"
                          value={s.fum_rec_td ?? ''}
                          onChange={(e) => handleStatChange(player.id, 'fum_rec_td', e.target.value)}
                          className="px-2 py-1 bg-slate-700 border border-slate-600 text-slate-100 rounded" />
                        <input type="number" placeholder="Pass 2pt"
                          value={s.pass_2pt ?? ''}
                          onChange={(e) => handleStatChange(player.id, 'pass_2pt', e.target.value)}
                          className="px-2 py-1 bg-slate-700 border border-slate-600 text-slate-100 rounded" />
                        <input type="number" placeholder="Rec 2pt"
                          value={s.rec_2pt ?? ''}
                          onChange={(e) => handleStatChange(player.id, 'rec_2pt', e.target.value)}
                          className="px-2 py-1 bg-slate-700 border border-slate-600 text-slate-100 rounded" />
                        <input type="number" placeholder="Rush 2pt"
                          value={s.rush_2pt ?? ''}
                          onChange={(e) => handleStatChange(player.id, 'rush_2pt', e.target.value)}
                          className="px-2 py-1 bg-slate-700 border border-slate-600 text-slate-100 rounded" />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
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
