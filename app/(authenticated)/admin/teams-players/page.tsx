'use client';

import { useState, useEffect } from 'react';

interface NflTeam {
  id: string;
  name: string;
  shortCode: string;
}

interface Player {
  id: string;
  name: string;
  position: string;
  teamId: string;
  team: NflTeam;
}

export default function PlayersPage() {
  const [teams, setTeams] = useState<NflTeam[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTeam, setSelectedTeam] = useState<string>('all');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [teamsRes, playersRes] = await Promise.all([
        fetch('/api/admin/teams'),
        fetch('/api/admin/players'),
      ]);
      const teamsData = await teamsRes.json();
      const playersData = await playersRes.json();
      setTeams(teamsData);
      setPlayers(playersData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPlayers = selectedTeam === 'all' 
    ? players 
    : players.filter(p => p.teamId === selectedTeam);

  if (loading) return <div className="text-slate-300">Loading...</div>;

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-8 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">Players</h1>

      <div className="space-y-6">
        <div className="bg-gradient-to-br from-blue-900/40 to-purple-900/40 border border-blue-500/30 rounded-lg p-4 shadow-lg">
          <p className="text-sm text-slate-300">
            <strong className="text-slate-100">Note:</strong> Players are managed via the <code className="bg-slate-700 px-2 py-1 rounded text-blue-300">players.csv</code> file. 
            Run <code className="bg-slate-700 px-2 py-1 rounded text-blue-300">npx tsx prisma/seed.ts</code> to update the player list.
          </p>
        </div>

        {/* Filter by Team */}
        <div className="bg-slate-800 border border-slate-700 shadow-xl rounded-lg p-6">
          <label className="block text-sm font-medium mb-2 text-slate-200">Filter by Team:</label>
          <select
            value={selectedTeam}
            onChange={(e) => setSelectedTeam(e.target.value)}
            className="w-full md:w-64 px-3 py-2 bg-slate-700 border border-slate-600 text-slate-100 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Teams ({players.length})</option>
            {teams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.shortCode} - {team.name} ({players.filter(p => p.teamId === team.id).length})
              </option>
            ))}
          </select>
        </div>

        {/* Players List */}
        <div className="bg-slate-800 border border-slate-700 shadow-xl rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-slate-100">
            {selectedTeam === 'all' ? `All Players (${filteredPlayers.length})` : `${teams.find(t => t.id === selectedTeam)?.shortCode} Players (${filteredPlayers.length})`}
          </h2>
          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {filteredPlayers.map((player) => (
              <div
                key={player.id}
                className="flex justify-between items-center p-3 bg-slate-700/50 hover:bg-slate-700 rounded transition-colors border border-slate-600/50"
              >
                <div>
                  <span className="font-medium text-slate-100">{player.name}</span>
                  <span className="ml-2 text-slate-400">
                    {player.position} - {player.team.shortCode}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
