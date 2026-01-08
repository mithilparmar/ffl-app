'use client';

import { useState, useRef, useEffect } from 'react';

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

interface SearchablePlayerSelectProps {
  id: string;
  label: string;
  value: string;
  players: Player[];
  usedPlayerIds: string[];
  onChange: (value: string) => void;
}

export default function SearchablePlayerSelect({
  id,
  label,
  value,
  players,
  usedPlayerIds,
  onChange,
}: SearchablePlayerSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredPlayers, setFilteredPlayers] = useState<Player[]>(players);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const filtered = players.filter((player) => {
      const searchLower = searchTerm.toLowerCase();
      return (
        player.name.toLowerCase().includes(searchLower) ||
        player.team.shortCode.toLowerCase().includes(searchLower)
      );
    });
    setFilteredPlayers(filtered);
  }, [searchTerm, players]);

  const selectedPlayer = players.find((p) => p.id === value);

  const handleSelect = (playerId: string) => {
    onChange(playerId);
    setIsOpen(false);
    setSearchTerm('');
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <label htmlFor={id} className="block text-sm font-medium mb-2 text-slate-300">
        {label}
      </label>

      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 text-left flex items-center justify-between hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
      >
        <span>
          {selectedPlayer
            ? `${selectedPlayer.name} (${selectedPlayer.team.shortCode})`
            : 'Select a player'}
        </span>
        <svg
          className={`w-5 h-5 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 14l-7 7m0 0l-7-7m7 7V3"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-slate-900 border border-slate-600 rounded-lg shadow-xl overflow-hidden">
          {/* Search Input */}
          <div className="p-3 border-b border-slate-700 sticky top-0 bg-slate-900">
            <input
              ref={inputRef}
              type="text"
              placeholder="Search by name or team..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              autoFocus
            />
          </div>

          {/* Players List */}
          <div className="max-h-60 overflow-y-auto">
            {filteredPlayers.length === 0 ? (
              <div className="px-4 py-6 text-center text-slate-400">
                No players found
              </div>
            ) : (
              <ul className="py-1">
                {filteredPlayers.map((player) => {
                  const isUsed = usedPlayerIds.includes(player.id);
                  const isSelected = value === player.id;

                  return (
                    <li key={player.id}>
                      <button
                        type="button"
                        disabled={isUsed}
                        onClick={() => handleSelect(player.id)}
                        className={`w-full px-4 py-3 text-left text-sm transition-colors flex items-center justify-between ${
                          isSelected
                            ? 'bg-blue-600 text-white'
                            : isUsed
                            ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                            : 'text-slate-200 hover:bg-slate-800'
                        }`}
                      >
                        <span>
                          <div className="font-medium">{player.name}</div>
                          <div className="text-xs opacity-75">
                            {player.team.name} ({player.team.shortCode}) • {player.position}
                          </div>
                        </span>
                        {isUsed && (
                          <span className="text-xs bg-red-500/30 text-red-300 px-2 py-1 rounded">
                            Used
                          </span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}

      {!isOpen && value && usedPlayerIds.includes(value) && (
        <p className="mt-1 text-xs text-red-400">
          ⚠ This player has already been used
        </p>
      )}
    </div>
  );
}
