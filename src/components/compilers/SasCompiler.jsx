import React, { useState } from 'react';
import { Binary, Play, Terminal, CheckCircle2 } from 'lucide-react';

export const SasCompiler = ({ starterCode, onCodeChange }) => {
  const [sasCode, setSasCode] = useState(starterCode || '');
  const [output, setOutput] = useState(null);
  const [isExecuting, setIsExecuting] = useState(false);

  const handleUpdate = (val) => {
    setSasCode(val);
    if (onCodeChange) onCodeChange(val);
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
    <div className="flex flex-col h-full bg-slate-900 rounded-xl overflow-hidden border border-slate-700 shadow-lg text-slate-100">
      <div className="bg-slate-800 px-4 py-2.5 flex items-center justify-between border-b border-slate-700">
        <div className="flex items-center gap-2">
          <Binary className="w-4 h-4 text-purple-400" />
          <span className="font-semibold text-xs text-purple-300">SAS Studio / Analytics Lab Engine</span>
        </div>
        <button
          onClick={runSas}
          disabled={isExecuting}
          className="flex items-center gap-1.5 bg-purple-600 hover:bg-purple-500 text-white font-semibold px-3 py-1 rounded text-xs transition disabled:opacity-50"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>{isExecuting ? 'Submitting SAS Job...' : 'Submit SAS Code'}</span>
        </button>
      </div>

      <div className="grid grid-rows-2 h-96">
        <div className="p-3 bg-slate-950 font-mono text-xs overflow-auto">
          <textarea
            value={sasCode}
            onChange={(e) => handleUpdate(e.target.value)}
            className="w-full h-full bg-transparent text-purple-300 resize-none outline-none leading-relaxed"
            spellCheck="false"
          />
        </div>

        <div className="bg-slate-900 border-t border-slate-800 p-3 overflow-y-auto font-mono text-xs">
          <div className="flex items-center justify-between pb-1 border-b border-slate-800 text-[11px] font-sans font-semibold text-slate-400 mb-2">
            <span className="flex items-center gap-1"><Terminal className="w-3.5 h-3.5 text-purple-400"/> SAS Procedure Output Window</span>
            {output && <span className="text-emerald-400 flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> PROC Executed cleanly</span>}
          </div>
          <pre className="text-slate-300 text-[11px] whitespace-pre-wrap">{output || 'Click "Submit SAS Code" to execute SAS DATA step and statistical procedures.'}</pre>
        </div>
      </div>
    </div>
  );
};
