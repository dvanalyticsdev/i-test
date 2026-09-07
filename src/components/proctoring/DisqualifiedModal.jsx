import React from 'react';
import { AlertOctagon, ShieldAlert, LogOut } from 'lucide-react';

export const DisqualifiedModal = ({ reason, onReturnToDashboard }) => {
  return (
    <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border-2 border-rose-500 text-center animate-in fade-in zoom-in duration-200">
        <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-rose-300">
          <ShieldAlert className="w-9 h-9" />
        </div>

        <span className="inline-block bg-rose-100 text-rose-800 text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider mb-2">
          Assessment Terminated
        </span>

        <h2 className="text-2xl font-extrabold text-slate-900 mb-2">
          Test Locked & Disqualified
        </h2>

        <p className="text-sm text-slate-600 mb-6 leading-relaxed">
          {reason || 'You exceeded the maximum limit of 2 anti-cheating warnings. Your session has been forcibly terminated and logged out.'}
        </p>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6 text-left text-xs text-slate-700 space-y-2">
          <div className="flex justify-between border-b border-slate-200 pb-2 font-semibold">
            <span className="text-slate-500">Security Action:</span>
            <span className="text-rose-600 font-bold">FORCED LOGOUT</span>
          </div>
          <div className="flex justify-between border-b border-slate-200 pb-2 font-semibold">
            <span className="text-slate-500">Recorded Status:</span>
            <span className="text-rose-600 font-bold">DISQUALIFIED (CHEATING DETECTED)</span>
          </div>
          <div className="flex justify-between font-semibold">
            <span className="text-slate-500">Admin Notification:</span>
            <span className="text-slate-900 font-semibold">Audit Logs Sent to Evaluation Dashboard</span>
          </div>
        </div>

        <button
          onClick={onReturnToDashboard}
          className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-lg shadow-rose-200 transition flex items-center justify-center gap-2"
        >
          <LogOut className="w-4 h-4" />
          <span>Exit Test & Return to Portal</span>
        </button>
      </div>
    </div>
  );
};
