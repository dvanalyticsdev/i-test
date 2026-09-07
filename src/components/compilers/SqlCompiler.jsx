import React, { useState } from 'react';
import { Database, Play, Table, CheckCircle2, RotateCcw } from 'lucide-react';

export const SqlCompiler = ({ starterCode, onCodeChange }) => {
  const [query, setQuery] = useState(starterCode || '');
  const [results, setResults] = useState(null);
  const [isExecuting, setIsExecuting] = useState(false);

  const mockDatabaseData = [
    { id: 101, name: 'Sarah Jenkins', department: 'Engineering', salary: 115000, salary_rank: 1 },
    { id: 104, name: 'David Chen', department: 'Engineering', salary: 98000, salary_rank: 2 },
    { id: 108, name: 'Elena Rostova', department: 'Data Science', salary: 125000, salary_rank: 1 },
    { id: 112, name: 'Marcus Vance', department: 'Data Science', salary: 92000, salary_rank: 2 },
    { id: 115, name: 'Aria Montgomery', department: 'Product', salary: 105000, salary_rank: 1 }
  ];

  const handleQueryUpdate = (val) => {
    setQuery(val);
    if (onCodeChange) onCodeChange(val);
  };

  const runQuery = () => {
    setIsExecuting(true);
    setTimeout(() => {
      setResults(mockDatabaseData);
      setIsExecuting(false);
    }, 500);
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 rounded-xl overflow-hidden border border-slate-700 shadow-lg text-slate-100">
      {/* Header */}
      <div className="bg-slate-800 px-4 py-2.5 flex items-center justify-between border-b border-slate-700">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-cyan-400" />
          <span className="font-semibold text-xs text-cyan-300">PostgreSQL / SQL Sandbox Engine</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleQueryUpdate(starterCode)}
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-700/50"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset Query</span>
          </button>
          <button
            onClick={runQuery}
            disabled={isExecuting}
            className="flex items-center gap-1.5 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold px-3 py-1 rounded text-xs shadow-md transition disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{isExecuting ? 'Executing...' : 'Execute SQL'}</span>
          </button>
        </div>
      </div>

      {/* Editor & Output Grid */}
      <div className="grid grid-rows-2 h-96">
        <div className="p-3 bg-slate-950 font-mono text-xs overflow-auto">
          <textarea
            value={query}
            onChange={(e) => handleQueryUpdate(e.target.value)}
            className="w-full h-full bg-transparent text-cyan-300 resize-none outline-none font-mono leading-relaxed"
            spellCheck="false"
          />
        </div>

        {/* Query Results Table */}
        <div className="bg-slate-900 border-t border-slate-800 p-3 overflow-y-auto font-sans text-xs">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-[11px] mb-2 font-semibold text-slate-400">
            <div className="flex items-center gap-1.5">
              <Table className="w-3.5 h-3.5 text-cyan-400" />
              <span>Query Results Output Grid</span>
            </div>
            {results && <span className="text-emerald-400 flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> {results.length} rows returned (0.018s)</span>}
          </div>

          {results ? (
            <div className="overflow-x-auto border border-slate-800 rounded">
              <table className="w-full text-left font-mono text-[11px]">
                <thead className="bg-slate-800 text-slate-300 border-b border-slate-700">
                  <tr>
                    <th className="px-3 py-1.5">id</th>
                    <th className="px-3 py-1.5">name</th>
                    <th className="px-3 py-1.5">department</th>
                    <th className="px-3 py-1.5">salary</th>
                    <th className="px-3 py-1.5">salary_rank</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-200">
                  {results.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/50">
                      <td className="px-3 py-1.5 text-slate-400">{row.id}</td>
                      <td className="px-3 py-1.5 text-cyan-200 font-semibold">{row.name}</td>
                      <td className="px-3 py-1.5 text-emerald-300">{row.department}</td>
                      <td className="px-3 py-1.5 text-slate-300">${row.salary.toLocaleString()}</td>
                      <td className="px-3 py-1.5 text-amber-300 font-bold">{row.salary_rank}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-slate-500 text-xs italic">Click "Execute SQL" to run query against the employees database.</p>
          )}
        </div>
      </div>
    </div>
  );
};
