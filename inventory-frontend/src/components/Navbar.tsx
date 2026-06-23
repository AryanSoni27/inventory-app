'use client';

import { useAuth } from '@/context/AuthContext';

interface NavbarProps {
  onMenuToggle?: () => void;
}

export default function Navbar({ onMenuToggle }: NavbarProps) {
  const { username, role, logout } = useAuth();

  return (
    <header className="h-14 sm:h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 sm:px-8 flex-shrink-0">
      <div className="flex items-center gap-3">
        {/* Hamburger menu — mobile only */}
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-2 -ml-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <div>
          <h2 className="text-xs sm:text-sm font-medium text-gray-500">Welcome back,</h2>
          <h1 className="text-sm sm:text-lg font-semibold text-gray-900 -mt-0.5">{username}</h1>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        {/* Role Badge */}
        <span
          className={`hidden sm:inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
            role === 'ADMIN'
              ? 'bg-purple-100 text-purple-700'
              : 'bg-blue-100 text-blue-700'
          }`}
        >
          {role}
        </span>

        {/* User Avatar */}
        <div className="w-8 h-8 sm:w-9 sm:h-9 bg-indigo-600 rounded-full flex items-center justify-center">
          <span className="text-white text-xs sm:text-sm font-semibold">
            {username?.charAt(0)?.toUpperCase()}
          </span>
        </div>

        {/* Logout Button */}
        <button
          onClick={logout}
          className="flex items-center gap-1.5 px-2.5 py-2 sm:px-3 text-sm font-medium text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
}
