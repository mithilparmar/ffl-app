'use client';

import { useState, useEffect } from 'react';
import { useCopyToClipboard } from '@/lib/use-copy-clipboard';

interface Invite {
  id: string;
  inviteCode: string;
  email: string;
  name: string;
  inviteUsed: boolean;
  createdAt: string;
}

export default function InviteCodesPage() {
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState('');
  const { copy, copied } = useCopyToClipboard();

  useEffect(() => {
    fetchInvites();
  }, []);

  const fetchInvites = async () => {
    try {
      const res = await fetch('/api/admin/invite-codes');
      const data = await res.json();
      setInvites(data);
    } catch (error) {
      console.error('Error fetching invites:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail || !newName) return;

    setCreating(true);
    try {
      const res = await fetch('/api/admin/invite-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newEmail, name: newName }),
      });

      if (res.ok) {
        setMessage('✓ Invite created successfully');
        setNewEmail('');
        setNewName('');
        setTimeout(() => setMessage(''), 3000);
        fetchInvites();
      } else {
        const error = await res.json();
        setMessage(`Error: ${error.error}`);
      }
    } catch (error) {
      setMessage('Error creating invite');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteInvite = async (id: string) => {
    if (!confirm('Delete this invite?')) return;

    try {
      const res = await fetch(`/api/admin/invite-codes?id=${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        fetchInvites();
      }
    } catch (error) {
      console.error('Error deleting invite:', error);
    }
  };

  if (loading) return <div className="text-slate-400">Loading...</div>;

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-8 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">Manage Invite Codes</h1>

      <div className="space-y-6">
        {/* Create Invite */}
        <div className="bg-slate-800 border border-slate-700 shadow-xl rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4 text-slate-100">Create New Invite</h2>
          <form onSubmit={handleCreateInvite} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-slate-300">
                  Manager Name
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g., John Doe"
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-slate-300">
                  Email Address
                </label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="john@example.com"
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  required
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={creating}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg hover:from-blue-700 hover:to-blue-600 disabled:from-slate-600 disabled:to-slate-600 transition-all transform hover:scale-[1.02] shadow-lg shadow-blue-500/20"
              >
                {creating ? 'Creating...' : 'Create Invite'}
              </button>
              {message && (
                <span
                  className={`px-4 py-2 rounded-lg ${
                    message.startsWith('✓')
                      ? 'bg-green-500/20 border border-green-500/30 text-green-400'
                      : 'bg-red-500/20 border border-red-500/30 text-red-400'
                  }`}
                >
                  {message}
                </span>
              )}
            </div>
          </form>
        </div>

        {/* Invites List */}
        <div className="bg-slate-800 border border-slate-700 shadow-xl rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4 text-slate-100">Active Invites</h2>
          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {invites.filter((i) => !i.inviteUsed).length === 0 ? (
              <p className="text-slate-400 text-center py-4">
                No active invites
              </p>
            ) : (
              invites
                .filter((i) => !i.inviteUsed)
                .map((invite) => (
                  <div
                    key={invite.id}
                    className="p-4 bg-gradient-to-br from-blue-900/30 to-purple-900/30 border border-blue-600/50 rounded-xl backdrop-blur-sm"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-semibold text-slate-100">{invite.name}</p>
                        <p className="text-sm text-slate-400">{invite.email}</p>
                      </div>
                      <span className="px-2 py-1 bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 text-xs rounded-lg">
                        Pending
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <code className="flex-1 px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg font-mono text-sm text-blue-400 break-all">
                        {invite.inviteCode}
                      </code>
                      <button
                        onClick={() => copy(invite.inviteCode)}
                        className="px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm text-slate-200 transition-colors"
                      >
                        {copied ? '✓ Copied' : 'Copy'}
                      </button>
                    </div>
                    <button
                      onClick={() => handleDeleteInvite(invite.id)}
                      className="text-sm text-red-400 hover:text-red-300 transition-colors"
                    >
                      Delete Invite
                    </button>
                  </div>
                ))
            )}
          </div>
        </div>

        {/* Used Invites */}
        <div className="bg-slate-800 border border-slate-700 shadow-xl rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4 text-slate-100">Used Invites</h2>
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {invites.filter((i) => i.inviteUsed).length === 0 ? (
              <p className="text-slate-400 text-center py-4">
                No used invites yet
              </p>
            ) : (
              invites
                .filter((i) => i.inviteUsed)
                .map((invite) => (
                  <div
                    key={invite.id}
                    className="flex justify-between items-center p-3 bg-green-500/10 border border-green-500/30 rounded-xl"
                  >
                    <div>
                      <p className="font-semibold text-slate-100">{invite.name}</p>
                      <p className="text-sm text-slate-400">{invite.email}</p>
                    </div>
                    <span className="px-2 py-1 bg-green-500/20 border border-green-500/30 text-green-400 text-xs rounded-lg">
                      Activated
                    </span>
                  </div>
                ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
