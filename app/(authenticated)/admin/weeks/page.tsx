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
      await fetch('/api/admin/weeks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: weekId,
          deadline: deadline || null,
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

  if (loading) return <div>Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Manage Weeks</h1>

      <div className="bg-white shadow rounded-lg p-6">
        <div className="space-y-6">
          {weeks.map((week) => {
            const locked = isWeekLocked(week);
            
            return (
              <div
                key={week.id}
                className="border border-gray-200 rounded-lg p-4"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold">Week {week.number}</h3>
                    <p className="text-gray-600">{week.label}</p>
                    
                    {editingWeek === week.id ? (
                      <div className="mt-3">
                        <label className="block text-sm font-medium mb-1">
                          Set Deadline:
                        </label>
                        <input
                          type="datetime-local"
                          value={deadlineInput}
                          onChange={(e) => setDeadlineInput(e.target.value)}
                          className="border border-gray-300 rounded px-3 py-2 text-sm"
                        />
                        <div className="mt-2 flex gap-2">
                          <button
                            onClick={() => updateDeadline(week.id, deadlineInput)}
                            className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => {
                              setEditingWeek(null);
                              setDeadlineInput('');
                            }}
                            className="px-3 py-1 bg-gray-300 rounded text-sm hover:bg-gray-400"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-2">
                        <p className="text-sm text-gray-700">
                          <strong>Deadline:</strong> {formatDateTime(week.deadline)}
                        </p>
                        <button
                          onClick={() => {
                            setEditingWeek(week.id);
                            setDeadlineInput(
                              week.deadline 
                                ? new Date(week.deadline).toISOString().slice(0, 16)
                                : ''
                            );
                          }}
                          className="mt-2 text-sm text-blue-600 hover:underline"
                        >
                          Edit Deadline
                        </button>
                      </div>
                    )}
                  </div>

                  <span
                    className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ml-4 ${
                      locked
                        ? 'bg-red-100 text-red-800'
                        : 'bg-green-100 text-green-800'
                    }`}
                  >
                    {locked ? 'Locked' : 'Open'}
                  </span>
                </div>

                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => toggleLock(week.id, week.isLocked)}
                    className={`px-4 py-2 rounded-md font-medium text-sm ${
                      week.isLocked
                        ? 'bg-green-600 hover:bg-green-700 text-white'
                        : 'bg-red-600 hover:bg-red-700 text-white'
                    }`}
                  >
                    {week.isLocked ? 'Manual Unlock' : 'Manual Lock'}
                  </button>

                  {locked && (
                    <a
                      href={`/admin/scores/${week.number}`}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                    >
                      Enter Scores
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-semibold mb-2">Instructions:</h4>
          <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
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
