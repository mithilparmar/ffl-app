'use client';

import { useState } from 'react';

export default function TestStatsPage() {
  const [weekNumber, setWeekNumber] = useState('1');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState('');

  const fetchStats = async () => {
    setLoading(true);
    setError('');
    setData(null);

    try {
      const response = await fetch(`/api/admin/fetch-stats/${weekNumber}`);
      const result = await response.json();

      if (!response.ok) {
        setError(JSON.stringify(result, null, 2));
      } else {
        setData(result);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-8 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
        Test Stats API
      </h1>

      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 mb-6">
        <div className="flex gap-4 items-end">
          <div>
            <label className="block text-sm font-medium mb-2 text-slate-200">
              Week Number:
            </label>
            <input
              type="number"
              min="1"
              max="4"
              value={weekNumber}
              onChange={(e) => setWeekNumber(e.target.value)}
              className="px-4 py-2 bg-slate-700 border border-slate-600 text-slate-100 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={fetchStats}
            disabled={loading}
            className="px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg hover:from-blue-700 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-lg shadow-blue-500/20 transition-all"
          >
            {loading ? 'Fetching...' : 'Fetch Stats'}
          </button>
        </div>

        <div className="mt-4 text-sm text-slate-400">
          <p>Direct API URL:</p>
          <code className="block mt-2 p-2 bg-slate-900 rounded text-blue-300">
            /api/admin/fetch-stats/{weekNumber}
          </code>
        </div>
      </div>

      {error && (
        <div className="bg-red-900/40 border border-red-500/30 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-red-300">Error</h2>
          <pre className="text-sm text-red-200 overflow-x-auto">
            {error}
          </pre>
        </div>
      )}

      {data && (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-slate-100">
            API Response
          </h2>
          <div className="mb-4 text-slate-300">
            <p><strong>Week:</strong> {data.week}</p>
            <p><strong>Sleeper Week:</strong> {data.sleeperWeek}</p>
            <p><strong>Scores Found:</strong> {data.scores?.length || 0}</p>
            {data.unmappedPlayers && data.unmappedPlayers.length > 0 && (
              <p className="text-yellow-400">
                <strong>Unmapped Players:</strong> {data.unmappedPlayers.length}
              </p>
            )}
          </div>

          <details className="mb-4">
            <summary className="cursor-pointer text-blue-400 hover:text-blue-300 font-medium mb-2">
              Show Scores ({data.scores?.length || 0} players)
            </summary>
            <div className="mt-2 space-y-2 max-h-96 overflow-y-auto">
              {data.scores?.map((score: any) => (
                <div key={score.playerId} className="p-3 bg-slate-700/50 rounded">
                  <div className="flex justify-between">
                    <span className="font-medium text-slate-100">{score.playerName}</span>
                    <span className="text-blue-400 font-bold">{score.points} pts</span>
                  </div>
                  <details className="mt-2">
                    <summary className="text-xs text-slate-400 cursor-pointer hover:text-slate-300">
                      View Stats
                    </summary>
                    <pre className="text-xs text-slate-400 mt-2 overflow-x-auto">
                      {JSON.stringify(score.stats, null, 2)}
                    </pre>
                  </details>
                </div>
              ))}
            </div>
          </details>

          {data.unmappedPlayers && data.unmappedPlayers.length > 0 && (
            <details>
              <summary className="cursor-pointer text-yellow-400 hover:text-yellow-300 font-medium mb-2">
                Unmapped Players ({data.unmappedPlayers.length})
              </summary>
              <div className="mt-2 space-y-2">
                {data.unmappedPlayers.map((player: any) => (
                  <div key={player.id} className="p-2 bg-slate-700/50 rounded text-slate-300 text-sm">
                    {player.name}
                  </div>
                ))}
              </div>
            </details>
          )}

          <details className="mt-4">
            <summary className="cursor-pointer text-slate-400 hover:text-slate-300 font-medium">
              View Raw JSON
            </summary>
            <pre className="mt-2 text-xs text-slate-300 bg-slate-900 p-4 rounded overflow-x-auto">
              {JSON.stringify(data, null, 2)}
            </pre>
          </details>
        </div>
      )}
    </div>
  );
}
