'use client';

import { useState, useEffect } from 'react';

interface Week {
  id: string;
  number: number;
  label: string;
  isLocked: boolean;
  deadline: string | null;
}

export default function WeeksPage() {
  const [weeks, setWeeks] = useState<Week[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingWeek, setEditingWeek] = useState<string | null>(null);
  const [deadlineInput, setDeadlineInput] = useState('');

  useEffect(() => {
    fetchWeeks();
  }, []);

  const fetchWeeks = async () => {
    try {
      const res = await fetch('/api/admin/weeks');
      const data = await res.json();
      setWeeks(data);
    } catch (error) {
      console.error('Error fetching weeks:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateDeadline = async (weekId: string, deadline: string) => {
    try {
      // Convert local datetime-local input to ISO string preserving the local time
      const deadlineToSend = deadline ? new Date(deadline).toISOString() : null;
      
      await fetch('/api/admin/weeks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: weekId,
          deadline: deadlineToSend,
        }),
      });
      setEditingWeek(null);
      setDeadlineInput('');
      fetchWeeks();
    } catch (error) {
      console.error('Error updating deadline:', error);
    }
  };

  const toggleLock = async (weekId: string, currentLockState: boolean) => {
    try {
      await fetch('/api/admin/weeks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: weekId,
          isLocked: !currentLockState,
        }),
      });
      fetchWeeks();
    } catch (error) {
      console.error('Error updating week:', error);
    }
  };

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return 'Not set';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short'
    });
  };

  const isWeekLocked = (week: Week) => {
    if (week.isLocked) return true;
    if (!week.deadline) return false;
    return new Date() > new Date(week.deadline);
  };

  if (loading) return <div className="text-slate-400">Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">Manage Weeks</h1>

      <div className="bg-slate-800 border border-slate-700 shadow-xl rounded-xl p-6">
        <div className="space-y-6">
          {weeks.map((week) => {
            const locked = isWeekLocked(week);
            
            return (
              <div
                key={week.id}
                className="border border-slate-700 bg-slate-900/50 rounded-xl p-4"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-slate-100">Week {week.number}</h3>
                    <p className="text-slate-400">{week.label}</p>
                    
                    {editingWeek === week.id ? (
                      <div className="mt-3">
                        <label className="block text-sm font-medium mb-2 text-slate-300">
                          Set Deadline:
                        </label>
                        <input
                          type="datetime-local"
                          value={deadlineInput}
                          onChange={(e) => setDeadlineInput(e.target.value)}
                          className="bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <div className="mt-2 flex gap-2">
                          <button
                            onClick={() => updateDeadline(week.id, deadlineInput)}
                            className="px-3 py-1 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg text-sm hover:from-blue-700 hover:to-blue-600 transition-all"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => {
                              setEditingWeek(null);
                              setDeadlineInput('');
                            }}
                            className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-sm transition-all"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-2">
                        <p className="text-sm text-slate-300">
                          <strong>Deadline:</strong> {formatDateTime(week.deadline)}
                        </p>
                        <button
                          onClick={() => {
                            setEditingWeek(week.id);
                            // Convert UTC time to local timezone for datetime-local input
                            if (week.deadline) {
                              const date = new Date(week.deadline);
                              // Format as YYYY-MM-DDTHH:MM for datetime-local
                              const year = date.getFullYear();
                              const month = String(date.getMonth() + 1).padStart(2, '0');
                              const day = String(date.getDate()).padStart(2, '0');
                              const hours = String(date.getHours()).padStart(2, '0');
                              const minutes = String(date.getMinutes()).padStart(2, '0');
                              setDeadlineInput(`${year}-${month}-${day}T${hours}:${minutes}`);
                            } else {
                              setDeadlineInput('');
                            }
                          }}
                          className="mt-2 text-sm text-blue-400 hover:text-blue-300 transition-colors"
                        >
                          Edit Deadline
                        </button>
                      </div>
                    )}
                  </div>

                  <span
                    className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap ml-4 shadow-lg ${
                      locked
                        ? 'bg-gradient-to-r from-red-600 to-red-500 text-white shadow-red-500/30'
                        : 'bg-gradient-to-r from-green-600 to-green-500 text-white shadow-green-500/30'
                    }`}
                  >
                    {locked ? 'Locked' : 'Open'}
                  </span>
                </div>

                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => toggleLock(week.id, week.isLocked)}
                    className={`px-4 py-2 rounded-lg font-medium text-sm transition-all shadow-lg ${
                      week.isLocked
                        ? 'bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white shadow-green-500/20'
                        : 'bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white shadow-red-500/20'
                    }`}
                  >
                    {week.isLocked ? 'Manual Unlock' : 'Manual Lock'}
                  </button>

                  {locked && (
                    <a
                      href={`/admin/scores/${week.number}`}
                      className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg hover:from-blue-700 hover:to-blue-600 text-sm transition-all shadow-lg shadow-blue-500/20"
                    >
                      Enter Scores
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 p-4 bg-gradient-to-br from-blue-900/30 to-purple-900/30 border border-blue-600/50 rounded-xl backdrop-blur-sm">
          <h4 className="font-semibold mb-2 text-blue-400">Instructions:</h4>
          <ul className="list-disc list-inside space-y-1 text-sm text-slate-300">
            <li>
              <strong>Deadline:</strong> Set a date/time when lineups close automatically.
            </li>
            <li>
              <strong>Open:</strong> Deadline not reached - managers can submit/edit lineups.
            </li>
            <li>
              <strong>Locked:</strong> Deadline passed or manually locked - all lineups visible, can enter scores.
            </li>
            <li>
              Use <strong>Manual Lock/Unlock</strong> to override automatic deadline behavior.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
