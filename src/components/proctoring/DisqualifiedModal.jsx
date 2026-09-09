import React from 'react';
import { ShieldAlert, AlertTriangle, LogOut, FileX, Info, ArrowRight } from 'lucide-react';

export const DisqualifiedModal = ({ 
  reason, 
  onReturnToDashboard, 
  onAcknowledge, 
  session, 
  user 
}) => {
  const handleExit = onReturnToDashboard || onAcknowledge;
  const candidateName = session?.studentName || user?.name || 'Candidate';
  const candidateId = session?.studentId || user?.lmsId || user?.id || 'N/A';
  const testTitle = session?.testTitle || 'Online Assessment';
  const warningCount = session?.warningCount || 2;
  const recordedStatus = session?.status || 'DISQUALIFIED (CHEATING DETECTED)';
  const submissionReason = session?.submissionReason || 'AUTO_SUBMITTED_CHEATING';

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border-2 border-rose-500 text-center animate-in fade-in zoom-in duration-200">
        {/* Shield Icon Alert */}
        <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-rose-200">
          <ShieldAlert className="w-9 h-9" />
        </div>

        {/* Status Pill */}
        <div className="inline-flex items-center gap-1.5 bg-rose-100 border border-rose-300 text-rose-800 text-[11px] px-3 py-1 rounded-full font-bold uppercase tracking-wider mb-2">
          <AlertTriangle className="w-3.5 h-3.5 text-rose-700" />
          <span>Automatic Submission / Disqualified</span>
        </div>

        <h2 className="text-2xl font-extrabold text-slate-900 mb-2">
          Assessment Automatically Terminated
        </h2>

        <p className="text-slate-600 text-xs sm:text-sm mb-6 leading-relaxed">
          This assessment was automatically submitted because an anti-cheating rule or proctoring policy violation was triggered during the examination.
        </p>

        {/* Detailed Audit & Submission Breakdown */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6 text-left text-xs text-slate-700 space-y-2.5">
          <div className="flex justify-between border-b border-slate-200 pb-2">
            <span className="text-slate-500">Candidate:</span>
            <span className="text-slate-900 font-semibold">{candidateName} ({candidateId})</span>
          </div>

          <div className="flex justify-between border-b border-slate-200 pb-2">
            <span className="text-slate-500">Test:</span>
            <span className="text-slate-900 font-semibold truncate max-w-[260px]" title={testTitle}>
              {testTitle}
            </span>
          </div>

          <div className="flex justify-between border-b border-slate-200 pb-2">
            <span className="text-slate-500">Warning Strikes:</span>
            <span className="text-rose-700 font-bold font-mono">
              {warningCount} / 2 (Threshold Exceeded)
            </span>
          </div>

          <div className="flex justify-between border-b border-slate-200 pb-2">
            <span className="text-slate-500">Trigger Reason:</span>
            <span className="text-rose-700 font-semibold text-right max-w-[260px] leading-tight">
              {reason || session?.disqualifiedReason || 'Maximum proctoring warnings exceeded.'}
            </span>
          </div>

          <div className="flex justify-between border-b border-slate-200 pb-2">
            <span className="text-slate-500">Submission Type:</span>
            <span className="text-rose-700 font-mono font-bold">{submissionReason}</span>
          </div>

          <div className="flex justify-between border-b border-slate-200 pb-2">
            <span className="text-slate-500">Final Recorded Status:</span>
            <span className="text-rose-700 font-mono font-bold">{recordedStatus}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-slate-500">Final Grade / Result:</span>
            <span className="text-rose-700 font-mono font-bold">0 Pts (Disqualified - Malpractice)</span>
          </div>
        </div>

        <p className="text-[11px] text-slate-400 mb-6 italic">
          All proctoring event logs, webcam snapshots, and violation timestamps have been recorded and sent to the examination administrator.
        </p>

        {/* Exit Button */}
        <button
          onClick={handleExit}
          className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-rose-200 hover:shadow-none transition flex items-center justify-center gap-2 cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Exit Assessment & Return to Dashboard</span>
        </button>
      </div>
    </div>
  );
};
