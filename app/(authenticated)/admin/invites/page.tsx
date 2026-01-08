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

  if (loading) return <div>Loading...</div>;

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Manage Invite Codes</h1>

      <div className="space-y-6">
        {/* Create Invite */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Create New Invite</h2>
          <form onSubmit={handleCreateInvite} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Manager Name
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g., John Doe"
                  className="w-full px-3 py-2 border rounded-md"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="john@example.com"
                  className="w-full px-3 py-2 border rounded-md"
                  required
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={creating}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
              >
                {creating ? 'Creating...' : 'Create Invite'}
              </button>
              {message && (
                <span
                  className={`px-4 py-2 rounded-md ${
                    message.startsWith('✓')
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {message}
                </span>
              )}
            </div>
          </form>
        </div>

        {/* Invites List */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Active Invites</h2>
          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {invites.filter((i) => !i.inviteUsed).length === 0 ? (
              <p className="text-gray-500 text-center py-4">
                No active invites
              </p>
            ) : (
              invites
                .filter((i) => !i.inviteUsed)
                .map((invite) => (
                  <div
                    key={invite.id}
                    className="p-4 bg-blue-50 border border-blue-200 rounded-lg"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-semibold">{invite.name}</p>
                        <p className="text-sm text-gray-600">{invite.email}</p>
                      </div>
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">
                        Pending
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <code className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded font-mono text-sm break-all">
                        {invite.inviteCode}
                      </code>
                      <button
                        onClick={() => copy(invite.inviteCode)}
                        className="px-3 py-2 bg-gray-200 rounded hover:bg-gray-300 text-sm"
                      >
                        {copied ? '✓ Copied' : 'Copy'}
                      </button>
                    </div>
                    <button
                      onClick={() => handleDeleteInvite(invite.id)}
                      className="text-sm text-red-600 hover:underline"
                    >
                      Delete Invite
                    </button>
                  </div>
                ))
            )}
          </div>
        </div>

        {/* Used Invites */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Used Invites</h2>
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {invites.filter((i) => i.inviteUsed).length === 0 ? (
              <p className="text-gray-500 text-center py-4">
                No used invites yet
              </p>
            ) : (
              invites
                .filter((i) => i.inviteUsed)
                .map((invite) => (
                  <div
                    key={invite.id}
                    className="flex justify-between items-center p-3 bg-green-50 rounded border border-green-200"
                  >
                    <div>
                      <p className="font-semibold">{invite.name}</p>
                      <p className="text-sm text-gray-600">{invite.email}</p>
                    </div>
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
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
