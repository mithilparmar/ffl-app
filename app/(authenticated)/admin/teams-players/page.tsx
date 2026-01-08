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

  if (loading) return <div>Loading...</div>;

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Players</h1>

      <div className="space-y-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-gray-700">
            <strong>Note:</strong> Players are managed via the <code>players.csv</code> file. 
            Run <code>npx tsx prisma/seed.ts</code> to update the player list.
          </p>
        </div>

        {/* Filter by Team */}
        <div className="bg-white shadow rounded-lg p-6">
          <label className="block text-sm font-medium mb-2">Filter by Team:</label>
          <select
            value={selectedTeam}
            onChange={(e) => setSelectedTeam(e.target.value)}
            className="w-full md:w-64 px-3 py-2 border rounded-md"
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
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">
            {selectedTeam === 'all' ? `All Players (${filteredPlayers.length})` : `${teams.find(t => t.id === selectedTeam)?.shortCode} Players (${filteredPlayers.length})`}
          </h2>
          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {filteredPlayers.map((player) => (
              <div
                key={player.id}
                className="flex justify-between items-center p-3 bg-gray-50 rounded"
              >
                <div>
                  <span className="font-medium">{player.name}</span>
                  <span className="ml-2 text-gray-600">
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
