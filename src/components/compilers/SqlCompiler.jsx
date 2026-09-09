import { useCodeSave } from '../../hooks/useCodeSave';
import React, { useState, useEffect } from 'react';
import { Database, Play, Table, CheckCircle2, RotateCcw, Save, Check } from 'lucide-react';

export const SqlCompiler = ({ starterCode, onCodeChange, onSaveCode }) => {
  const [query, setQuery] = useState(starterCode || '');
  const [results, setResults] = useState(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const { isSaved, saveStatus, save } = useCodeSave(onCodeChange, onSaveCode);

  useEffect(() => {
    if (starterCode !== undefined) {
      setQuery(starterCode);
    }
  }, [starterCode]);

  const mockDatabaseData = [
    { id: 101, name: 'Sarah Jenkins', department: 'Engineering', salary: 115000, salary_rank: 1 },
    { id: 104, name: 'David Chen', department: 'Engineering', salary: 98000, salary_rank: 2 },
    { id: 108, name: 'Elena Rostova', department: 'Data Science', salary: 125000, salary_rank: 1 },
    { id: 112, name: 'Marcus Vance', department: 'Data Science', salary: 92000, salary_rank: 2 },
    { id: 115, name: 'Aria Montgomery', department: 'Product', salary: 105000, salary_rank: 1 }
  ];

  const handleQueryUpdate = (val) => {
    setQuery(val);
    save(val);
  };

  const handleSave = () => save(query, true);

  const runQuery = () => {
    setIsExecuting(true);
    setTimeout(() => {
      setResults(mockDatabaseData);
      setIsExecuting(false);
    }, 500);
  };

  return (
    <div className="flex flex-col bg-slate-900 rounded-xl overflow-hidden border border-slate-700 shadow-lg text-slate-100 h-full">
      {/* Header */}
      <div className="bg-slate-800 px-4 py-2.5 flex items-center justify-between border-b border-slate-700 shrink-0">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-cyan-400" />
          <span className="font-semibold text-xs text-cyan-300">PostgreSQL / SQL Sandbox Engine</span>
        </div>
        <span className="text-[10px] bg-cyan-950 text-cyan-400 border border-cyan-800 px-2 py-0.5 rounded font-mono font-medium">
          Postgres 16.2
        </span>
      </div>

      {/* Editor Area */}
      <div className="p-3 bg-slate-950 font-mono text-xs overflow-auto min-h-[200px] h-[260px] shrink-0 border-b border-slate-800">
        <textarea
          value={query}
          onChange={(e) => handleQueryUpdate(e.target.value)}
          className="w-full h-full bg-transparent text-cyan-300 resize-none outline-none font-mono leading-relaxed selection:bg-cyan-900 selection:text-white"
          spellCheck="false"
          placeholder="-- Write your SQL query here e.g. SELECT department, AVG(salary) FROM employees..."
        />
      </div>

      {/* Dedicated Action Bar Directly Below Editor */}
      <div className="bg-slate-800/95 px-4 py-2.5 border-b border-slate-700 flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleQueryUpdate(starterCode)}
            className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white px-2.5 py-1.5 rounded-lg bg-slate-700/60 hover:bg-slate-700 transition"
            title="Reset to starter query"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
          {saveStatus === 'saving' && <span role="status" className="text-xs text-sky-300">Saving…</span>}
          {saveStatus === 'failed' && <span role="status" className="text-xs text-amber-300">Save pending — retrying connection</span>}
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
            onClick={runQuery}
            disabled={isExecuting}
            className="flex items-center gap-1.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold px-4 py-1.5 rounded-lg text-xs shadow-md transition disabled:opacity-50 active:scale-95 shadow-cyan-950"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{isExecuting ? 'Executing...' : 'Run Code'}</span>
          </button>
        </div>
      </div>

      {/* Query Results Table */}
      <div className="bg-slate-900 p-3 overflow-y-auto font-sans text-xs flex-1 min-h-[180px]">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-[11px] mb-2 font-semibold text-slate-400">
          <div className="flex items-center gap-1.5">
            <Table className="w-3.5 h-3.5 text-cyan-400" />
            <span>Query Results Output Grid</span>
          </div>
          {results && (
            <span className="text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> {results.length} rows returned (0.018s)
            </span>
          )}
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
          <div className="p-4 text-center text-slate-500 italic bg-slate-950 rounded border border-slate-800 text-xs">
            Click "Run Code" to execute query against the employees database table.
          </div>
        )}
      </div>
    </div>
  );
};
