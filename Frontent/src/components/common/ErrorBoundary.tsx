import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, LayoutDashboard } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
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
    console.error('Invexa Application Component Catch:', error, errorInfo);
  }

  private handleReload = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    } else {
      window.location.reload();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[380px] w-full p-6 sm:p-8 flex flex-col items-center justify-center text-center bg-white rounded-2xl border border-rose-100 shadow-xl max-w-xl mx-auto my-8 animate-scale-up">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mb-4 shadow-sm">
            <AlertTriangle className="w-7 h-7" />
          </div>

          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            {this.props.fallbackTitle || 'Module Interface Restored'}
          </h2>

          <p className="text-xs text-slate-500 mt-2 max-w-md leading-relaxed">
            The workspace encountered an unexpected render condition. Your session and inventory ledger state are safely preserved.
          </p>

          {this.state.error && (
            <div className="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-200 text-left w-full overflow-hidden">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Diagnostic Log</span>
              <code className="text-[11px] font-mono text-rose-700 block truncate">
                {this.state.error.message || 'Render exception handled gracefully'}
              </code>
            </div>
          )}

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={this.handleReload}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-2 transition-all cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry Component</span>
            </button>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.href = '/';
              }}
              className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold rounded-xl shadow-2xs flex items-center gap-2 transition-all cursor-pointer"
            >
              <LayoutDashboard className="w-3.5 h-3.5 text-sky-600" />
              <span>Return to Dashboard</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
