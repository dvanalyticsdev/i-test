import React from 'react';
import { Flag, CheckCircle2, Circle, Code2, Send } from 'lucide-react';

export const QuestionNavPanel = ({
  totalQuestions,
  currentIndex,
  userAnswers,
  markedForReview,
  activeSection,
  activeCompilerDomain,
  compilerCode,
  onSelectQuestion,
  onSelectCompiler,
  onSubmitTest,
  showCompilerSection = true
}) => {
  const safeAnswers = userAnswers || {};
  const safeReviews = markedForReview || {};
  const safeTotal = Math.max(0, Number(totalQuestions) || 0);
  const answeredCount = Object.keys(safeAnswers).length;
  const markedCount = Object.values(safeReviews).filter(Boolean).length;
  const untouchedCount = Math.max(0, safeTotal - answeredCount);

  const labKeyMap = {
    python: 'coding-py-1',
    sql: 'coding-sql-1',
    power_bi: 'coding-pb-1',
    sas: 'coding-sas-1',
    excel_ai: 'coding-excel-1'
  };

  const compilerItems = [
    { id: 'python', label: 'Python 3.11', icon: 'PY', desc: 'Data Cleaning & Logic' },
    { id: 'sql', label: 'SQL Engine', icon: 'SQL', desc: 'Queries & Window Funcs' },
    { id: 'power_bi', label: 'Power BI DAX', icon: 'PBI', desc: 'DAX Measures & Charts' },
    { id: 'sas', label: 'SAS Studio', icon: 'SAS', desc: 'PROC MEANS & Output' },
    { id: 'excel_ai', label: 'Excel AI Grid', icon: 'XLS', desc: 'XLOOKUP & Copilot' },
  ];

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col justify-between select-none space-y-4">
      <div>
        {/* Section 1: MCQ Subset */}
        {safeTotal > 0 && (
          <div className="pb-3 border-b border-slate-200 mb-3">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
              Section 1: MCQ Subset ({safeTotal} Total)
            </h3>

            {/* Quick Metrics */}
            <div className="grid grid-cols-3 gap-2 text-[11px] text-center font-medium">
              <div className="bg-emerald-50 text-emerald-700 p-1.5 rounded-lg border border-emerald-200">
                <span className="block font-bold text-sm">{answeredCount}</span>
                <span>Answered</span>
              </div>
              <div className="bg-amber-50 text-amber-700 p-1.5 rounded-lg border border-amber-200">
                <span className="block font-bold text-sm">{markedCount}</span>
                <span>Review</span>
              </div>
              <div className="bg-slate-100 text-slate-600 p-1.5 rounded-lg border border-slate-200">
                <span className="block font-bold text-sm">{untouchedCount}</span>
                <span>Untouched</span>
              </div>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-2 text-[10px] text-slate-500 my-2.5">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Answered</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span> Review</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-slate-200 border border-slate-400"></span> Untouched</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-sky-500 border border-sky-600"></span> Active</span>
            </div>

            {/* Grid Buttons 1 to N */}
            <div className="grid grid-cols-5 gap-1.5 max-h-48 overflow-y-auto pr-1 mb-2">
              {Array.from({ length: safeTotal }).map((_, idx) => {
                const isCurrent = activeSection === 'mcq' && idx === currentIndex;
                const isAnswered = safeAnswers[idx] !== undefined;
                const isMarked = safeReviews[idx];

                let btnBg = 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200';
                if (isAnswered) btnBg = 'bg-emerald-500 text-white border-emerald-600 font-semibold';
                if (isMarked) btnBg = 'bg-amber-400 text-amber-950 border-amber-500 font-bold';
                if (isCurrent) btnBg += ' ring-2 ring-sky-500 ring-offset-1 font-extrabold';

                return (
                  <button
                    key={idx}
                    onClick={() => onSelectQuestion && onSelectQuestion(idx)}
                    className={`h-8 rounded-lg text-xs flex items-center justify-center transition border ${btnBg} relative`}
                  >
                    <span>{idx + 1}</span>
                    {isMarked && (
                      <Flag className="w-2.5 h-2.5 text-amber-900 absolute top-0.5 right-0.5 fill-current" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Section 2: Hands-On Compiler Labs (Only shown if enabled and compilers exist) */}
        {showCompilerSection && (
          <div className="pt-2 border-t border-slate-200">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Code2 className="w-3.5 h-3.5 text-sky-600" />
              <span>Section 2: Hands-On Compilers (5)</span>
            </h3>

            <div className="space-y-1.5">
              {compilerItems.map((item) => {
                const isActive = activeSection === 'compiler' && activeCompilerDomain === item.id;
                const key = labKeyMap[item.id];
                const isSaved = compilerCode && compilerCode[key] && compilerCode[key].trim().length > 0;

                return (
                  <button
                    key={item.id}
                    onClick={() => onSelectCompiler && onSelectCompiler(item.id)}
                    className={`w-full text-left px-3 py-2 rounded-xl border text-xs transition flex items-center justify-between ${
                      isActive
                        ? 'bg-sky-50 border-sky-500 text-sky-950 font-bold ring-1 ring-sky-400'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 font-medium'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-md bg-slate-900 text-sky-300 flex items-center justify-center text-[10px] font-mono font-bold">
                        {item.icon}
                      </span>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="block leading-tight font-bold">{item.label}</span>
                          {isSaved && (
                            <span className="text-[10px] text-emerald-600 flex items-center gap-0.5 font-bold">
                              <CheckCircle2 className="w-3 h-3" /> Saved
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-500">{item.desc}</span>
                      </div>
                    </div>
                    <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-mono">
                      LAB
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Submit Exam Button */}
      <div className="pt-3 border-t border-slate-200">
        <button
          onClick={onSubmitTest}
          className="w-full py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2 shadow-sky-100 active:scale-[0.99]"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Final Exam Submit</span>
        </button>
      </div>
    </div>
  );
};
