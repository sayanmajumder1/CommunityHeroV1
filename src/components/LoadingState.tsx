import React from 'react';

interface LoadingStateProps {
  message?: string;
}

export default function LoadingState({ message = 'Loading application state...' }: LoadingStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center bg-white border border-slate-200 rounded-3xl shadow-sm max-w-lg mx-auto my-12 font-sans" id="applet-loading-state">
      <div className="relative w-16 h-16 flex items-center justify-center mb-6">
        <div className="absolute w-16 h-16 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin" />
        <div className="w-8 h-8 rounded-full bg-emerald-500 animate-pulse" />
      </div>
      
      <h3 className="text-lg font-black text-slate-900 tracking-tight">
        {message}
      </h3>
      <p className="text-xs text-slate-400 mt-2 max-w-xs font-semibold leading-relaxed">
        We are preparing your environment, syncing data modules, and securing your local connection. Please stand by.
      </p>
    </div>
  );
}
