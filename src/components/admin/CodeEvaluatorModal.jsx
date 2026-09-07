import React from 'react';
import { ShieldAlert, Code2, CheckCircle2, X } from 'lucide-react';

export const CodeEvaluatorModal = ({ submission, onClose }) => {
  if (!submission) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full p-6 shadow-2xl border border-slate-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div>
            <span className="text-[11px] font-mono text-sky-700 font-bold">{submission.id}</span>
            <h3 className="text-base font-bold text-slate-900">{submission.studentName} ({submission.studentId})</h3>
            <span className="text-xs text-slate-500">{submission.testTitle}</span>
          </div>

          <button onClick={onClose} className="text-slate-400 hover:text-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-4 overflow-y-auto pr-1">
          {/* Submitted Code View */}
          <div className="space-y-2">
            <div className="flex items-center justify-between font-semibold text-xs text-slate-700">
              <span className="flex items-center gap-1.5"><Code2 className="w-4 h-4 text-sky-600"/> Student Submitted Code</span>
              <span className="text-[11px] bg-slate-100 px-2 py-0.5 rounded font-mono">{submission.compilerStatus}</span>
            </div>
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-emerald-300 font-mono text-xs overflow-auto max-h-72 whitespace-pre-wrap">
              {submission.codeSubmitted || '// No compiler code saved'}
            </div>
          </div>

          {/* Anti-Cheat Audit Trail Log */}
          <div className="space-y-2">
            <div className="flex items-center justify-between font-semibold text-xs text-slate-700">
              <span className="flex items-center gap-1.5"><ShieldAlert className="w-4 h-4 text-amber-600"/> Security Audit Log</span>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${submission.cheatingStatus.includes('DISQUALIFIED') ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'}`}>
                {submission.cheatingStatus}
              </span>
            </div>

            <div className="bg-slate-900 text-slate-200 p-3 rounded-xl border border-slate-800 font-mono text-[11px] max-h-72 overflow-y-auto space-y-2">
              {submission.proctorLogs && submission.proctorLogs.length > 0 ? (
                submission.proctorLogs.map((log, idx) => (
                  <div key={idx} className="pb-1 border-b border-slate-800">
                    <span className="text-slate-500">[{log.timestamp}] </span>
                    <span className={log.type === 'CRITICAL' ? 'text-rose-400 font-bold' : log.type === 'WARNING' ? 'text-amber-300' : 'text-emerald-400'}>
                      {log.message}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-slate-500">No anti-cheat infractions recorded.</p>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center pt-3 border-t border-slate-200">
          <div className="text-xs">
            <span className="text-slate-500">Evaluated Score: </span>
            <strong className="text-slate-900 font-bold">{submission.score}</strong>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-md"
          >
            Close Evaluator View
          </button>
        </div>
      </div>
    </div>
  );
};
