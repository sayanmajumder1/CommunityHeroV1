import React, { ErrorInfo, ReactNode } from 'react';
import { ShieldAlert, RefreshCw, Home } from 'lucide-react';

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    // Attempt to re-route or refresh the cache
    try {
      localStorage.removeItem('community_hero_session_id'); // Refresh session id to be safe
    } catch (_) {}
    window.location.reload();
  };

  private handleNavigateHome = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
          <div className="bg-white border border-slate-200 rounded-3xl p-8 max-w-lg w-full shadow-xl space-y-6 text-center">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto">
              <ShieldAlert className="w-8 h-8 text-red-600 animate-pulse" />
            </div>
            
            <div className="space-y-2">
              <h1 className="text-xl font-black text-slate-900 tracking-tight">
                An Unexpected Error Occred
              </h1>
              <p className="text-sm text-slate-500 font-semibold leading-relaxed">
                The application encountered a runtime error that would normally crash your screen. We caught it safely to protect your active session.
              </p>
            </div>

            {this.state.error && (
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-left max-h-40 overflow-y-auto">
                <p className="text-xs font-bold text-red-700 font-mono break-all">
                  Error: {this.state.error.message}
                </p>
                {this.state.error.stack && (
                  <pre className="text-[10px] text-slate-400 font-mono mt-2 overflow-x-auto whitespace-pre-wrap leading-relaxed">
                    {this.state.error.stack.split('\n').slice(0, 4).join('\n')}
                  </pre>
                )}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <button
                onClick={this.handleReset}
                className="flex-1 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-98"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Reload Application
              </button>
              <button
                onClick={this.handleNavigateHome}
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

    return this.props.children;
  }
}
