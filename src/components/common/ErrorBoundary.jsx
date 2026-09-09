import React from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[Application ErrorBoundary Caught Error]:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
          <div className="bg-white border border-rose-200 rounded-3xl p-8 max-w-lg w-full shadow-2xl text-center space-y-4">
            <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto border border-rose-200">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-extrabold text-slate-900">Assessment Interface Alert</h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              An unexpected display issue occurred while initializing the test workspace. The session recovery guard has protected your exam data.
            </p>
            {this.state.error && (
              <div className="bg-slate-900 text-rose-300 p-3 rounded-xl text-[11px] font-mono text-left max-h-32 overflow-y-auto">
                {this.state.error.toString()}
              </div>
            )}
            <button
              onClick={this.handleReset}
              className="w-full py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Recover & Reload Test Portal</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
