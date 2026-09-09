import React, { useState, useEffect } from 'react';
import { BarChart3, Play, Sparkles, CheckCircle2, RotateCcw, Save, Check } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export const PowerBICompiler = ({ starterCode, onCodeChange, onSaveCode }) => {
  const [daxCode, setDaxCode] = useState(starterCode || '');
  const [chartData, setChartData] = useState(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (starterCode !== undefined) {
      setDaxCode(starterCode);
    }
  }, [starterCode]);

  const sampleVizData = [
    { quarter: 'Q1 2025', revenue: 145000, pyRevenue: 120000, yoyGrowth: 20.8 },
    { quarter: 'Q2 2025', revenue: 189000, pyRevenue: 150000, yoyGrowth: 26.0 },
    { quarter: 'Q3 2025', revenue: 210000, pyRevenue: 175000, yoyGrowth: 20.0 },
    { quarter: 'Q4 2025', revenue: 265000, pyRevenue: 205000, yoyGrowth: 29.2 },
  ];

  const handleUpdate = (val) => {
    setDaxCode(val);
    setIsSaved(false);
    if (onCodeChange) onCodeChange(val);
  };

  const handleSave = () => {
    if (onSaveCode) {
      onSaveCode(daxCode);
    } else if (onCodeChange) {
      onCodeChange(daxCode);
    }
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  const evaluateDax = () => {
    setIsEvaluating(true);
    setTimeout(() => {
      setChartData(sampleVizData);
      setIsEvaluating(false);
    }, 500);
  };

  return (
    <div className="flex flex-col bg-slate-900 rounded-xl overflow-hidden border border-slate-700 shadow-lg text-slate-100 h-full">
      {/* Header */}
      <div className="bg-slate-800 px-4 py-2.5 flex items-center justify-between border-b border-slate-700 shrink-0">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-amber-400" />
          <span className="font-semibold text-xs text-amber-300">Power BI DAX & Report Visualizer Lab</span>
        </div>
        <span className="text-[10px] bg-amber-950 text-amber-400 border border-amber-800 px-2 py-0.5 rounded font-mono font-medium">
          DAX Engine v3.0
        </span>
      </div>

      {/* Editor Area */}
      <div className="p-3 bg-slate-950 font-mono text-xs overflow-auto min-h-[200px] h-[260px] shrink-0 border-b border-slate-800">
        <textarea
          value={daxCode}
          onChange={(e) => handleUpdate(e.target.value)}
          className="w-full h-full bg-transparent text-amber-300 resize-none outline-none leading-relaxed selection:bg-amber-950 selection:text-white"
          spellCheck="false"
          placeholder="// Enter DAX formula e.g. YoY Growth % = DIVIDE([Total Revenue] - [PY Revenue], [PY Revenue])"
        />
      </div>

      {/* Dedicated Action Bar Directly Below Editor */}
      <div className="bg-slate-800/95 px-4 py-2.5 border-b border-slate-700 flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleUpdate(starterCode)}
            className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white px-2.5 py-1.5 rounded-lg bg-slate-700/60 hover:bg-slate-700 transition"
            title="Reset to starter DAX"
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
            onClick={evaluateDax}
            disabled={isEvaluating}
            className="flex items-center gap-1.5 bg-amber-600 hover:bg-amber-500 text-white font-bold px-4 py-1.5 rounded-lg text-xs shadow-md transition disabled:opacity-50 active:scale-95 shadow-amber-950"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{isEvaluating ? 'Evaluating...' : 'Run Code'}</span>
          </button>
        </div>
      </div>

      {/* Live Visualizer Output */}
      <div className="bg-slate-900 p-3 flex-1 flex flex-col justify-between min-h-[180px] overflow-y-auto">
        <div className="flex items-center justify-between pb-1 border-b border-slate-800 text-[11px] font-semibold text-slate-400 mb-2">
          <span className="flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-400"/> Power BI Visual Output (Interactive Canvas)
          </span>
          {chartData && (
            <span className="text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3"/> VertiPaq Calculated
            </span>
          )}
        </div>

        {chartData ? (
          <div className="h-44 w-full pt-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="quarter" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={10} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }} />
                <Bar dataKey="revenue" fill="#f59e0b" name="Revenue ($)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="pyRevenue" fill="#0284c7" name="Prior Year ($)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="p-4 text-center text-slate-500 italic bg-slate-950 rounded border border-slate-800 text-xs">
            Click "Run Code" to compile DAX measure and render interactive report visual.
          </div>
        )}
      </div>
    </div>
  );
};
