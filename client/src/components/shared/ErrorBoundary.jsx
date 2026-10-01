import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[50vh] flex items-center justify-center p-6">
          <div className="bg-white rounded-3xl border border-rose-200/80 p-8 shadow-sm max-w-md w-full text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto ring-8 ring-rose-50/50">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold text-stone-900">Something went wrong</h3>
            <p className="text-sm text-stone-500 leading-relaxed">
              An unexpected interface error occurred. You can reload this view or return to your dashboard.
            </p>
            <div className="pt-2 flex justify-center gap-3">
              <button
                onClick={() => window.location.reload()}
                className="inline-flex items-center space-x-2 px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-sm font-semibold transition shadow-sm"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Reload Page</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
