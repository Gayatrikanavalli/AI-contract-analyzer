import React from 'react';
import { Shield, LayoutDashboard, FileText, Search, RefreshCw, LogOut } from 'lucide-react';

interface SidebarProps {
  activePath: string;
  onNavigate: (path: string) => void;
  onRefresh: () => void;
  isLoading: boolean;
  email: string;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activePath,
  onNavigate,
  onRefresh,
  isLoading,
  email,
  onLogout,
}) => {
  const isDashboard = activePath === '/' || activePath === '';
  const isContracts = activePath.startsWith('/contracts');
  const isSearch = activePath === '/search' || activePath.startsWith('/search');

  return (
    <aside
      id="dashboard-sidebar"
      className="w-64 bg-[#1E1B4B] border-r border-[#2E2870] flex flex-col shrink-0 min-h-screen sticky top-0 h-screen z-20 text-slate-200"
    >
      {/* Brand Header */}
      <div className="h-16 px-5 border-b border-[#2E2870]/80 flex items-center justify-between">
        <button
          onClick={() => onNavigate('/')}
          className="flex items-center gap-2.5 text-left focus:outline-none group"
        >
          <div className="w-8 h-8 bg-[#6D5FE8] rounded-xl flex items-center justify-center text-white shadow-md group-hover:bg-[#5B4DE0] transition-colors">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-white text-sm tracking-tight block">
              Contract Analyzer
            </span>
            <span className="text-[10px] text-indigo-300 font-medium block -mt-0.5">
              Legal AI Platform
            </span>
          </div>
        </button>
      </div>

      {/* Navigation Items */}
      <div className="flex-1 py-5 px-3 space-y-1.5 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-indigo-300/70">
          Navigation
        </div>

        {/* Dashboard Link */}
        <button
          id="nav-dashboard-link"
          onClick={() => onNavigate('/')}
          className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 text-left ${
            isDashboard
              ? 'bg-[#6D5FE8] text-white font-bold shadow-md shadow-indigo-950/50'
              : 'text-indigo-200/80 hover:text-white hover:bg-white/10'
          }`}
        >
          <LayoutDashboard
            className={`w-4 h-4 shrink-0 ${
              isDashboard ? 'text-white' : 'text-indigo-300 group-hover:text-white'
            }`}
          />
          <span>Dashboard</span>
        </button>

        {/* Contracts Link */}
        <button
          id="nav-contracts-link"
          onClick={() => onNavigate('/contracts')}
          className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 text-left ${
            isContracts
              ? 'bg-[#6D5FE8] text-white font-bold shadow-md shadow-indigo-950/50'
              : 'text-indigo-200/80 hover:text-white hover:bg-white/10'
          }`}
        >
          <FileText
            className={`w-4 h-4 shrink-0 ${
              isContracts ? 'text-white' : 'text-indigo-300 group-hover:text-white'
            }`}
          />
          <span>Contracts</span>
        </button>

        {/* Search Link */}
        <button
          id="nav-search-link"
          onClick={() => onNavigate('/search')}
          className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 text-left ${
            isSearch
              ? 'bg-[#6D5FE8] text-white font-bold shadow-md shadow-indigo-950/50'
              : 'text-indigo-200/80 hover:text-white hover:bg-white/10'
          }`}
        >
          <Search
            className={`w-4 h-4 shrink-0 ${
              isSearch ? 'text-white' : 'text-indigo-300 group-hover:text-white'
            }`}
          />
          <span>Search</span>
        </button>
      </div>

      {/* Sidebar Footer with Sync and Account Actions */}
      <div className="p-3 border-t border-[#2E2870]/80 bg-[#17143D] space-y-2">
        <div className="px-2 py-1 text-[10px] text-indigo-200/80 truncate" title={email}>{email}</div>
        <button
          id="sidebar-sync-btn"
          onClick={onRefresh}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 text-xs font-semibold text-indigo-100 bg-white/10 hover:bg-white/15 border border-indigo-400/20 rounded-xl shadow-xs focus:outline-none focus:ring-2 focus:ring-[#6D5FE8] transition-colors disabled:opacity-50 cursor-pointer"
          title="Refresh repository"
        >
          <RefreshCw
            className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-[#6D5FE8]' : 'text-indigo-300'}`}
          />
          <span>Sync Repository</span>
        </button>
        <button
          id="sidebar-logout-btn"
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 text-xs font-semibold text-indigo-100 hover:text-white hover:bg-white/10 border border-indigo-400/20 rounded-xl transition-colors"
        >
          <LogOut className="w-3.5 h-3.5 text-indigo-300" />
          <span>Log out</span>
        </button>
      </div>
    </aside>
  );
};
