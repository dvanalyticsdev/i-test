import React, { useState } from 'react';
import { useExam } from '../../context/ExamContext';
import { CodeEvaluatorModal } from './CodeEvaluatorModal';
import { ShieldAlert, Code2, CheckCircle2, Eye, UserCheck, AlertTriangle } from 'lucide-react';

export const StudentSubmissions = () => {
  const { submissions } = useExam();
  const [selectedSub, setSelectedSub] = useState(null);

  return (
    <div className="space-y-6 select-none">
      {/* Header */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-900">Student Submissions & Proctoring Monitor</h2>
          <p className="text-xs text-slate-500">Review student assessment scores, code implementations, and security infraction logs.</p>
        </div>
        <span className="bg-sky-100 text-sky-800 text-xs font-bold px-3 py-1 rounded-full">
          Total Attempts: {submissions.length}
        </span>
      </div>

      {/* Submissions Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <table className="w-full text-left text-xs font-sans">
          <thead className="bg-slate-100 text-slate-600 border-b border-slate-200 font-semibold">
            <tr>
              <th className="p-3">Student Name (LMS ID)</th>
              <th className="p-3">Assessment Title</th>
              <th className="p-3">Score</th>
              <th className="p-3">Proctoring Status</th>
              <th className="p-3">Code Status</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {submissions.map((sub) => (
              <tr key={sub.id} className="hover:bg-slate-50">
                <td className="p-3">
                  <div className="font-bold text-slate-900">{sub.studentName}</div>
                  <span className="font-mono text-[11px] text-slate-500">{sub.studentId}</span>
                </td>
                <td className="p-3 text-slate-700 font-medium">{sub.testTitle}</td>
                <td className="p-3 font-bold text-slate-900">{sub.score}</td>
                <td className="p-3">
                  <span
                    className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-bold ${
                      sub.cheatingStatus.includes('DISQUALIFIED')
                        ? 'bg-rose-100 text-rose-800 border border-rose-300'
                        : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    }`}
                  >
                    {sub.cheatingStatus}
                  </span>
                </td>
                <td className="p-3 text-slate-600 font-mono text-[11px]">{sub.compilerStatus}</td>
                <td className="p-3 text-right">
                  <button
                    onClick={() => setSelectedSub(sub)}
                    className="inline-flex items-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-800 px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-300 transition"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Evaluate Code & Logs</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Code Evaluator Modal */}
      <CodeEvaluatorModal
        submission={selectedSub}
        onClose={() => setSelectedSub(null)}
      />
    </div>
  );
};
