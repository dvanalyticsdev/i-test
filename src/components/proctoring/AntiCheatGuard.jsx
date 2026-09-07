import React, { useState } from 'react';
import { Shield, AlertTriangle, Maximize2, Monitor, Lock, Eye, CheckCircle2 } from 'lucide-react';

export const AntiCheatGuard = ({ warningCount, requestFullscreen, isFullscreen, proctorLogs }) => {
  const [showLogs, setShowLogs] = useState(false);

  return (
    <div className="bg-white border-b border-slate-200 px-4 py-2 flex flex-wrap items-center justify-between text-xs font-medium text-slate-700 shadow-sm select-none">
      {/* Integrity Badge */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-full font-semibold">
          <Shield className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
          <span>PROCTOR GUARD ACTIVE</span>
        </div>

        {/* Fullscreen Prompt */}
        {!isFullscreen ? (
          <button
            onClick={requestFullscreen}
            className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-white px-3 py-1 rounded-md transition font-semibold animate-bounce shadow-sm"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span>Enable Fullscreen Mode</span>
          </button>
        ) : (
          <div className="flex items-center gap-1 text-slate-500 bg-slate-100 px-2 py-1 rounded">
            <Lock className="w-3 h-3 text-slate-400" />
            <span>Fullscreen Locked</span>
          </div>
        )}

        {/* Display Status */}
        <div className="hidden sm:flex items-center gap-1 text-slate-500 bg-slate-100 px-2 py-1 rounded">
          <Monitor className="w-3.5 h-3.5 text-slate-400" />
          <span>Single Screen Verified</span>
        </div>
      </div>

      {/* Warning Counter & Log Toggle */}
      <div className="flex items-center gap-3 mt-2 sm:mt-0">
        {/* Warning Indicator */}
        <div
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full font-semibold border ${
            warningCount === 0
              ? 'bg-slate-100 text-slate-600 border-slate-200'
              : warningCount === 1
              ? 'bg-amber-100 text-amber-800 border-amber-300'
              : 'bg-rose-100 text-rose-800 border-rose-300 animate-pulse'
          }`}
        >
          <AlertTriangle className={`w-3.5 h-3.5 ${warningCount > 0 ? 'text-rose-600' : 'text-slate-400'}`} />
          <span>Warnings: {warningCount} / 2</span>
        </div>

        {/* Log Viewer Toggle */}
        <button
          onClick={() => setShowLogs(!showLogs)}
          className="flex items-center gap-1 text-slate-600 hover:text-slate-900 underline"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>Audit Log ({proctorLogs.length})</span>
        </button>
      </div>

      {/* Slide-down Proctor Audit Log Modal */}
      {showLogs && (
        <div className="w-full mt-3 bg-slate-900 text-slate-200 p-3 rounded-lg border border-slate-700 font-mono text-[11px] max-h-40 overflow-y-auto">
          <div className="flex justify-between items-center pb-2 border-b border-slate-800 mb-2 font-sans font-semibold text-slate-300">
            <span>Live Security Audit Trail</span>
            <button onClick={() => setShowLogs(false)} className="text-slate-400 hover:text-white">✕ Close</button>
          </div>
          <div className="space-y-1">
            {proctorLogs.map((log, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <span className="text-slate-500">[{log.timestamp}]</span>
                <span
                  className={
                    log.type === 'CRITICAL'
                      ? 'text-rose-400 font-bold'
                      : log.type === 'WARNING'
                      ? 'text-amber-300 font-semibold'
                      : 'text-emerald-400'
                  }
                >
                  {log.message}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
