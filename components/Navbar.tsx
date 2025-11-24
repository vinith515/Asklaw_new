import React from 'react';
import { View, User } from '../types';

interface NavbarProps {
  user: User | null;
  currentView: View;
  onNavigate: (view: View) => void;
  onLogout: () => void;
  onLoginClick: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ 
  user, 
  currentView, 
  onNavigate, 
  onLogout,
  onLoginClick
}) => {
  return (
    <nav className="sticky top-0 z-40 w-full bg-slate-900/80 backdrop-blur-md border-b border-white/10 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => onNavigate(View.DASHBOARD)}>
            <div className="bg-amber-500/10 border border-amber-500/50 p-2 rounded-lg group-hover:bg-amber-500/20 transition-colors">
              <svg className="w-6 h-6 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
            </div>
            <span className="font-serif font-bold text-2xl text-white tracking-wide">AskLaw</span>
          </div>

          <div className="hidden md:flex items-center space-x-2">
            {user ? (
              <>
                <button 
                  onClick={() => onNavigate(View.DASHBOARD)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${currentView === View.DASHBOARD ? 'bg-white/10 text-white shadow-inner' : 'text-slate-300 hover:text-white hover:bg-white/5'}`}
                >
                  Dashboard
                </button>
                <button 
                  onClick={() => onNavigate(View.HISTORY)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${currentView === View.HISTORY ? 'bg-white/10 text-white shadow-inner' : 'text-slate-300 hover:text-white hover:bg-white/5'}`}
                >
                  History
                </button>
                <button 
                  onClick={() => onNavigate(View.PROFILE)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${currentView === View.PROFILE ? 'bg-white/10 text-white shadow-inner' : 'text-slate-300 hover:text-white hover:bg-white/5'}`}
                >
                  Profile
                </button>
                <div className="h-6 w-px bg-white/20 mx-3"></div>
                <button 
                  onClick={onLogout}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  Logout
                </button>
              </>
            ) : (
              <button 
                onClick={onLoginClick}
                className="px-5 py-2.5 bg-amber-600 text-white rounded-lg text-sm font-semibold hover:bg-amber-500 transition-all shadow-lg hover:shadow-amber-500/30"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};