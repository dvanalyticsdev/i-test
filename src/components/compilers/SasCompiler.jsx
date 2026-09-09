import React, { useState, useEffect } from 'react';
import { Binary, Play, Terminal, CheckCircle2, RotateCcw, Save, Check } from 'lucide-react';

export const SasCompiler = ({ starterCode, onCodeChange, onSaveCode }) => {
  const [sasCode, setSasCode] = useState(starterCode || '');
  const [output, setOutput] = useState(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (starterCode !== undefined) {
      setSasCode(starterCode);
    }
  }, [starterCode]);

  const handleUpdate = (val) => {
    setSasCode(val);
    setIsSaved(false);
    if (onCodeChange) onCodeChange(val);
  };

  const handleSave = () => {
    if (onSaveCode) {
      onSaveCode(sasCode);
    } else if (onCodeChange) {
      onCodeChange(sasCode);
    }
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  const runSas = () => {
    setIsExecuting(true);
    setTimeout(() => {
      setOutput(`=== SAS System Output (PROC MEANS Procedure) ===

The MEANS Procedure
Data Set: WORK.SALES_SUMMARY

Region        N Obs    Variable      N           Mean        Std Dev        Minimum        Maximum
--------------------------------------------------------------------------------------------------
Africa           14    Sales        14      94,821.50      38,412.10      51,200.00     184,500.00
                       Returns      14       3,120.40       1,450.80       1,020.00       6,800.00
--------------------------------------------------------------------------------------------------
Asia             22    Sales        22     142,650.00      45,900.00      52,800.00     240,000.00
                       Returns      22       4,850.10       2,100.30       1,400.00       9,500.00
--------------------------------------------------------------------------------------------------
NOTE: There were 36 observations read from the data set WORK.SALES_SUMMARY.
NOTE: PROCEDURE MEANS used (Total process time): 0.08 seconds.`);
      setIsExecuting(false);
    }, 550);
  };

  return (
    <div className="flex flex-col bg-slate-900 rounded-xl overflow-hidden border border-slate-700 shadow-lg text-slate-100 h-full">
      {/* Header */}
      <div className="bg-slate-800 px-4 py-2.5 flex items-center justify-between border-b border-slate-700 shrink-0">
        <div className="flex items-center gap-2">
          <Binary className="w-4 h-4 text-purple-400" />
          <span className="font-semibold text-xs text-purple-300">SAS Studio / Analytics Lab Engine</span>
        </div>
        <span className="text-[10px] bg-purple-950 text-purple-400 border border-purple-800 px-2 py-0.5 rounded font-mono font-medium">
          SAS 9.4 TS1M7
        </span>
      </div>

      {/* Editor Area */}
      <div className="p-3 bg-slate-950 font-mono text-xs overflow-auto min-h-[200px] h-[260px] shrink-0 border-b border-slate-800">
        <textarea
          value={sasCode}
          onChange={(e) => handleUpdate(e.target.value)}
          className="w-full h-full bg-transparent text-purple-300 resize-none outline-none leading-relaxed selection:bg-purple-950 selection:text-white"
          spellCheck="false"
          placeholder="/* Write SAS statements e.g. PROC MEANS DATA=sales; RUN; */"
        />
      </div>

      {/* Dedicated Action Bar Directly Below Editor */}
      <div className="bg-slate-800/95 px-4 py-2.5 border-b border-slate-700 flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleUpdate(starterCode)}
            className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white px-2.5 py-1.5 rounded-lg bg-slate-700/60 hover:bg-slate-700 transition"
            title="Reset to starter SAS code"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
          {isSaved && (
            <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-semibold bg-emerald-950/60 border border-emerald-800 px-2 py-0.5 rounded">
              <Check className="w-3.5 h-3.5" /> Code Saved
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 bg-sky-600 hover:bg-sky-500 text-white font-bold px-3.5 py-1.5 rounded-lg text-xs shadow-md transition active:scale-95 shadow-sky-950"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Code</span>
          </button>
          <button
            onClick={runSas}
            disabled={isExecuting}
            className="flex items-center gap-1.5 bg-purple-600 hover:bg-purple-500 text-white font-bold px-4 py-1.5 rounded-lg text-xs shadow-md transition disabled:opacity-50 active:scale-95 shadow-purple-950"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{isExecuting ? 'Submitting...' : 'Run Code'}</span>
          </button>
        </div>
      </div>

      {/* Output Console */}
      <div className="bg-slate-900 p-3 overflow-y-auto font-mono text-xs flex-1 min-h-[180px]">
        <div className="flex items-center justify-between pb-1 border-b border-slate-800 text-[11px] font-semibold text-slate-400 mb-2">
          <div className="flex items-center gap-1.5">
            <Terminal className="w-3.5 h-3.5 text-purple-400" />
            <span>SAS System Output & Log</span>
          </div>
          {output && (
            <span className="text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3"/> PROC Success
            </span>
          )}
        </div>
        {output ? (
          <pre className="text-slate-300 text-[11px] whitespace-pre-wrap font-mono leading-relaxed bg-slate-950 p-2.5 rounded border border-slate-800">
            {output}
          </pre>
        ) : (
          <div className="p-4 text-center text-slate-500 italic bg-slate-950 rounded border border-slate-800 text-xs">
            Click "Run Code" to submit SAS procedure and view generated analytics output.
          </div>
        )}
      </div>
    </div>
  );
};
