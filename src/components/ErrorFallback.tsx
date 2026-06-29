import React from 'react';
import { ShieldAlert, RefreshCw, Home } from 'lucide-react';

interface ErrorFallbackProps {
  error?: Error | null;
  resetErrorBoundary?: () => void;
}

export default function ErrorFallback({ error, resetErrorBoundary }: ErrorFallbackProps) {
  const handleReset = () => {
    if (resetErrorBoundary) {
      resetErrorBoundary();
    } else {
      try {
        localStorage.removeItem('community_hero_session_id');
      } catch (_) {}
      window.location.reload();
    }
  };

  const handleNavigateHome = () => {
    window.location.href = '/';
  };

  return (
    <div className="min-h-[400px] bg-slate-50 flex items-center justify-center p-6 font-sans">
      <div className="bg-white border border-slate-200 rounded-3xl p-8 max-w-lg w-full shadow-xl space-y-6 text-center">
        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto">
          <ShieldAlert className="w-8 h-8 text-red-600 animate-pulse" />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-xl font-black text-slate-900 tracking-tight">
            Something went wrong
          </h1>
          <p className="text-sm text-slate-500 font-semibold leading-relaxed">
            The component encountered a runtime error. We isolated it safely to protect your active session.
          </p>
        </div>

        {error && (
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-left max-h-40 overflow-y-auto">
            <p className="text-xs font-bold text-red-700 font-mono break-all">
              Error: {error.message}
            </p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-2 pt-2">
          <button
            onClick={handleReset}
            className="flex-1 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-98"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Reload Component
          </button>
          <button
            onClick={handleNavigateHome}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <Home className="w-3.5 h-3.5" />
            Go to Landing
          </button>
        </div>
      </div>
    </div>
  );
}
