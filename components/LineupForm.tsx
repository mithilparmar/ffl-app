'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import SearchablePlayerSelect from './SearchablePlayerSelect';

interface Player {
  id: string;
  name: string;
  position: string;
  team: {
    id: string;
    name: string;
    shortCode: string;
  };
}

interface Week {
  id: string;
  number: number;
  label: string;
}

interface LineupFormProps {
  week: Week;
  qbs: Player[];
  rbs: Player[];
  wrs: Player[];
  tes: Player[];
  flexPlayers: Player[];
  existingLineup?: {
    qbId: string;
    rbId: string;
    wrId: string;
    teId: string;
    flexId: string;
  } | null;
  usedPlayerIds: string[];
}

export default function LineupForm({
  week,
  qbs,
  rbs,
  wrs,
  tes,
  flexPlayers,
  existingLineup,
  usedPlayerIds,
}: LineupFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    qbId: existingLineup?.qbId || '',
    rbId: existingLineup?.rbId || '',
    wrId: existingLineup?.wrId || '',
    teId: existingLineup?.teId || '',
    flexId: existingLineup?.flexId || '',
  });
  const [errors, setErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);
    setLoading(true);

    try {
      const response = await fetch('/api/lineups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          weekNumber: week.number,
          ...formData,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrors(data.errors || [data.error || 'Failed to submit lineup']);
      } else {
        router.push('/dashboard');
        router.refresh();
      }
    } catch (error) {
      setErrors(['An error occurred. Please try again.']);
    } finally {
      setLoading(false);
    }
  };

  const renderPlayerSelect = (
    id: string,
    label: string,
    value: string,
    players: Player[]
  ) => {
    return (
      <SearchablePlayerSelect
        id={id}
        label={label}
        value={value}
        players={players}
        usedPlayerIds={usedPlayerIds}
        onChange={(newValue) =>
          setFormData({ ...formData, [id]: newValue })
        }
      />
    );
  };

  return (
    <div className="bg-slate-800 border border-slate-700 shadow-xl rounded-xl p-6">
      {errors.length > 0 && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
          <h4 className="font-semibold text-red-400 mb-2">Validation Errors:</h4>
          <ul className="list-disc list-inside space-y-1 text-red-300">
            {errors.map((error, i) => (
              <li key={i}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {renderPlayerSelect('qbId', 'Quarterback (QB)', formData.qbId, qbs)}
        {renderPlayerSelect('rbId', 'Running Back (RB)', formData.rbId, rbs)}
        {renderPlayerSelect('wrId', 'Wide Receiver (WR)', formData.wrId, wrs)}
        {renderPlayerSelect('teId', 'Tight End (TE)', formData.teId, tes)}
        {renderPlayerSelect('flexId', 'FLEX (RB/WR/TE)', formData.flexId, flexPlayers)}

        <div className="bg-gradient-to-br from-blue-900/30 to-purple-900/30 border border-blue-600/50 p-4 rounded-xl backdrop-blur-sm">
          <h4 className="font-semibold mb-2 text-blue-400">Week {week.number} Rules:</h4>
          <p className="text-sm text-slate-300">
            {week.number === 1 || week.number === 2
              ? 'Max 1 player per NFL team (5 different teams required)'
              : week.number === 3
              ? '2-1-1-1 split: One team with 2 players, three teams with 1 player each (4 teams total)'
              : '3-2 split: Players from exactly 2 teams, with a 3-2 distribution'}
          </p>
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-gradient-to-r from-blue-600 to-blue-500 text-white py-3 px-4 rounded-lg hover:from-blue-700 hover:to-blue-600 disabled:from-slate-600 disabled:to-slate-600 disabled:cursor-not-allowed font-medium transition-all transform hover:scale-[1.02] shadow-lg shadow-blue-500/20"
          >
            {loading ? 'Submitting...' : existingLineup ? 'Update Lineup' : 'Submit Lineup'}
          </button>
          <button
            type="button"
            onClick={() => router.push('/dashboard')}
            className="px-6 py-3 border border-slate-600 bg-slate-700 hover:bg-slate-600 rounded-lg text-slate-200 transition-all"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
