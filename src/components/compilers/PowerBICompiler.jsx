import React, { useState } from 'react';
import { BarChart3, Play, Sparkles, CheckCircle2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export const PowerBICompiler = ({ starterCode, onCodeChange }) => {
  const [daxCode, setDaxCode] = useState(starterCode || '');
  const [chartData, setChartData] = useState(null);
  const [isEvaluating, setIsEvaluating] = useState(false);

  const sampleVizData = [
    { quarter: 'Q1 2025', revenue: 145000, pyRevenue: 120000, yoyGrowth: 20.8 },
    { quarter: 'Q2 2025', revenue: 189000, pyRevenue: 150000, yoyGrowth: 26.0 },
    { quarter: 'Q3 2025', revenue: 210000, pyRevenue: 175000, yoyGrowth: 20.0 },
    { quarter: 'Q4 2025', revenue: 265000, pyRevenue: 205000, yoyGrowth: 29.2 },
  ];

  const handleUpdate = (val) => {
    setDaxCode(val);
    if (onCodeChange) onCodeChange(val);
  };

  const evaluateDax = () => {
    setIsEvaluating(true);
    setTimeout(() => {
      setChartData(sampleVizData);
      setIsEvaluating(false);
    }, 500);
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 rounded-xl overflow-hidden border border-slate-700 shadow-lg text-slate-100">
      <div className="bg-slate-800 px-4 py-2.5 flex items-center justify-between border-b border-slate-700">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-amber-400" />
          <span className="font-semibold text-xs text-amber-300">Power BI DAX & Report Visualizer Lab</span>
        </div>
        <button
          onClick={evaluateDax}
          disabled={isEvaluating}
          className="flex items-center gap-1.5 bg-amber-600 hover:bg-amber-500 text-white font-semibold px-3 py-1 rounded text-xs transition disabled:opacity-50"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>{isEvaluating ? 'Evaluating DAX...' : 'Evaluate Measure'}</span>
        </button>
      </div>

      <div className="grid grid-rows-2 h-96">
        <div className="p-3 bg-slate-950 font-mono text-xs overflow-auto">
          <textarea
            value={daxCode}
            onChange={(e) => handleUpdate(e.target.value)}
            className="w-full h-full bg-transparent text-amber-300 resize-none outline-none leading-relaxed"
            spellCheck="false"
          />
        </div>

        {/* Live Visualizer Output */}
        <div className="bg-slate-900 border-t border-slate-800 p-3 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-1 border-b border-slate-800 text-[11px] font-semibold text-slate-400 mb-2">
            <span className="flex items-center gap-1"><Sparkles className="w-3.5 h-3.5 text-amber-400"/> Power BI Report Visual Output</span>
            {chartData && <span className="text-emerald-400 flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> VertiPaq Context Compiled</span>}
          </div>

          {chartData ? (
            <div className="h-40 w-full pt-1">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="quarter" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={10} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }} />
                  <Bar dataKey="revenue" fill="#f59e0b" name="Total Sales ($)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="pyRevenue" fill="#0284c7" name="PY Sales ($)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-slate-500 text-xs italic">Click "Evaluate Measure" to compile DAX code and render interactive dashboard chart visual.</p>
          )}
        </div>
      </div>
    </div>
  );
};
