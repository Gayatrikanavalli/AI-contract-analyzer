import React from 'react';
import { Shield, RefreshCw } from 'lucide-react';

interface HeaderProps {
  onRefresh: () => void;
  isLoading: boolean;
  activePath: string;
  onNavigate: (path: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  onRefresh,
  isLoading,
  activePath,
  onNavigate,
}) => {
  const isDashboard = activePath === '/' || activePath === '';
  const isContracts = activePath.startsWith('/contracts');
  const isSearch = activePath === '/search' || activePath.startsWith('/search');

  return (
    <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-30 flex items-center justify-between px-4 sm:px-8 shrink-0">
      {/* Brand & Simple Navigation */}
      <div className="flex items-center gap-6 sm:gap-8">
        {/* Brand */}
        <button
          onClick={() => onNavigate('/')}
          className="flex items-center gap-2.5 text-left focus:outline-none"
        >
          <div className="w-7 h-7 bg-indigo-600 rounded flex items-center justify-center text-white shadow-2xs">
            <Shield className="w-4 h-4" />
          </div>
          <span className="font-bold text-slate-900 text-base tracking-tight">
            Contract Analyzer
          </span>
        </button>

        {/* Simple Navigation Links */}
        <nav className="flex items-center space-x-1 pl-4 sm:pl-6 border-l border-slate-200">
          <button
            onClick={() => onNavigate('/')}
            className={`px-3 py-1.5 rounded text-xs font-semibold transition-all duration-200 ${
              isDashboard
                ? 'bg-slate-100 text-indigo-600 font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => onNavigate('/contracts')}
            className={`px-3 py-1.5 rounded text-xs font-semibold transition-all duration-200 ${
              isContracts
                ? 'bg-slate-100 text-indigo-600 font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            Contracts
          </button>
          <button
            onClick={() => onNavigate('/search')}
            className={`px-3 py-1.5 rounded text-xs font-semibold transition-all duration-200 ${
              isSearch
                ? 'bg-slate-100 text-indigo-600 font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            Search
          </button>
        </nav>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Sync / Refresh Button */}
        <button
          id="refresh-contracts-btn"
          onClick={onRefresh}
          disabled={isLoading}
          className="inline-flex items-center px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded shadow-2xs hover:bg-slate-50 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors disabled:opacity-50"
          title="Refresh repository"
        >
          <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isLoading ? 'animate-spin text-indigo-600' : 'text-slate-500'}`} />
          Sync
        </button>
      </div>
    </header>
  );
};
