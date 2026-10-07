import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-slate-100">
          <div className="glass-panel max-w-md w-full p-8 rounded-2xl text-center space-y-6 border border-rose-500/30">
            <div className="w-16 h-16 rounded-2xl bg-rose-500/10 text-rose-400 mx-auto flex items-center justify-center">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div>
              <h2 className="text-xl font-bold text-white">Application Exception</h2>
              <p className="text-slate-400 text-sm mt-2">
                A client runtime error occurred. You can attempt to refresh the page or return to the dashboard.
              </p>
              {this.state.error && (
                <div className="mt-4 p-3 bg-slate-900/80 rounded-lg text-xs font-mono text-rose-300 text-left overflow-auto max-h-32">
                  {this.state.error.message}
                </div>
              )}
            </div>

            <button
              onClick={() => window.location.reload()}
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition shadow-lg shadow-indigo-600/25"
            >
              <RefreshCw className="w-4 h-4" />
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
