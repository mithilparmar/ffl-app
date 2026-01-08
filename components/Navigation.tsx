'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { useState } from 'react';

interface NavigationProps {
  user: {
    name?: string | null;
    email?: string | null;
    isAdmin: boolean;
  };
}

export default function Navigation({ user }: NavigationProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path: string) => {
    if (path === '/dashboard') {
      return pathname === '/dashboard' || pathname === '/' ? 'bg-blue-600 shadow-lg shadow-blue-500/30' : 'hover:bg-slate-700/50';
    }
    return pathname === path ? 'bg-blue-600 shadow-lg shadow-blue-500/30' : 'hover:bg-slate-700/50';
  };

  return (
    <nav className="bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800 text-white shadow-xl border-b border-slate-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center space-x-4">
            <Link href="/dashboard" className="text-lg sm:text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent truncate">
              NFL Playoff Fantasy
            </Link>
            
            <div className="hidden md:flex space-x-2">
              <Link
                href="/dashboard"
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${isActive('/dashboard')}`}
              >
                Dashboard
              </Link>
              <Link
                href="/leaderboard"
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${isActive('/leaderboard')}`}
              >
                Leaderboard
              </Link>
              {user.isAdmin && (
                <>
                  <Link
                    href="/admin/invites"
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${isActive('/admin/invites')}`}
                  >
                    Invites
                  </Link>
                  <Link
                    href="/admin/teams-players"
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${isActive('/admin/teams-players')}`}
                  >
                    Players
                  </Link>
                  <Link
                    href="/admin/weeks"
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${isActive('/admin/weeks')}`}
                  >
                    Weeks
                  </Link>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-4">
            <span className="hidden sm:inline text-sm text-slate-300">
              {user.name || user.email}
              {user.isAdmin && <span className="ml-2 text-xs bg-gradient-to-r from-yellow-400 to-orange-500 text-slate-900 px-2 py-1 rounded-md font-semibold">Admin</span>}
            </span>
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="hidden sm:block px-4 py-2 rounded-lg text-sm font-medium bg-red-600 hover:bg-red-700 transition-all transform hover:scale-105 shadow-lg shadow-red-500/20"
            >
              Logout
            </button>
            
            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-slate-700/50 focus:outline-none transition-colors"
              aria-label="Toggle menu"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {mobileMenuOpen ? (
                  <path d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
        
        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden pb-4 space-y-2">
            <Link
              href="/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-3 py-2 rounded-md text-sm font-medium ${isActive('/dashboard')}`}
            >
              Dashboard
            </Link>
            <Link
              href="/leaderboard"
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-3 py-2 rounded-md text-sm font-medium ${isActive('/leaderboard')}`}
            >
              Leaderboard
            </Link>
            {user.isAdmin && (
              <>
                <Link
                  href="/admin/invites"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-3 py-2 rounded-md text-sm font-medium ${isActive('/admin/invites')}`}
                >
                  Invites
                </Link>
                <Link
                  href="/admin/teams-players"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-3 py-2 rounded-md text-sm font-medium ${isActive('/admin/teams-players')}`}
                >
                  Players
                </Link>
                <Link
                  href="/admin/weeks"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-3 py-2 rounded-md text-sm font-medium ${isActive('/admin/weeks')}`}
                >
                  Weeks
                </Link>
              </>
            )}
            <div className="pt-2 border-t border-blue-700">
              <div className="px-3 py-2 text-sm text-blue-200">
                {user.name || user.email}
                {user.isAdmin && <span className="ml-2 text-xs bg-yellow-500 text-black px-2 py-1 rounded">Admin</span>}
              </div>
              <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="w-full text-left px-3 py-2 rounded-md text-sm font-medium bg-red-600 hover:bg-red-700"
              >
                Logout
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
