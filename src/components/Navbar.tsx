import React from 'react';
import { LogIn, LogOut, ShieldCheck, User as UserIcon } from 'lucide-react';
import { User, loginWithGoogle, logout, isFirebaseConfigured } from '../firebase';

interface NavbarProps {
  user: User | null;
  onNavigateHome: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ user, onNavigateHome }) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <button
          onClick={onNavigateHome}
          className="flex items-center gap-2.5 font-bold text-slate-800 hover:text-indigo-600 transition-colors"
        >
          <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-black text-lg shadow-sm">
            F
          </div>
          <span className="text-lg tracking-tight">FamilyLink Logger</span>
        </button>

        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'User'}
                    className="w-7 h-7 rounded-full border border-slate-200"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                    <UserIcon className="w-4 h-4" />
                  </div>
                )}
                <span className="hidden sm:inline font-medium text-slate-700">
                  {user.displayName || user.email}
                </span>
              </div>
              <button
                onClick={logout}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                title="ログアウト"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>ログアウト</span>
              </button>
            </div>
          ) : isFirebaseConfigured ? (
            <button
              onClick={loginWithGoogle}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Googleでログイン</span>
            </button>
          ) : (
            <div className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-500 bg-slate-100 rounded-md">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>ローカル開発モード</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
