import React, { useState, useEffect } from 'react';
import { FileSpreadsheet, Sparkles, Play, CheckCircle2, RotateCcw, Save, Check } from 'lucide-react';

export const ExcelAiCompiler = ({ starterCode, onCodeChange, onSaveCode }) => {
  const [formula, setFormula] = useState(starterCode || '=XLOOKUP(A2, Products[ID], Products[Price]) * B2');
  const [evalResult, setEvalResult] = useState('$1,450.00');
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (starterCode !== undefined) {
      setFormula(starterCode);
    }
  }, [starterCode]);

  // Spreadsheet Grid Matrix
  const [gridData, setGridData] = useState([
    { row: 1, A: 'Product ID', B: 'Quantity', C: 'Unit Price', D: 'Calculated Revenue' },
    { row: 2, A: 'P-102', B: '10', C: '$145.00', D: '$1,450.00' },
    { row: 3, A: 'P-105', B: '5', C: '$85.00', D: '$425.00' },
    { row: 4, A: 'P-201', B: '25', C: '$310.00', D: '$7,750.00' },
  ]);

  const handleFormulaUpdate = (val) => {
    setFormula(val);
    setIsSaved(false);
    if (onCodeChange) onCodeChange(val);
  };

  const handleSave = () => {
    if (onSaveCode) {
      onSaveCode(formula);
    } else if (onCodeChange) {
      onCodeChange(formula);
    }
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  const evaluateFormula = () => {
    setIsEvaluating(true);
    setTimeout(() => {
      setEvalResult('$1,450.00');
      setIsEvaluating(false);
    }, 450);
  };

  const generateAiFormula = () => {
    const aiGenerated = `=IF(B2>100, (XLOOKUP(A2, Products[ID], Products[Price]) * B2) * 0.85, XLOOKUP(A2, Products[ID], Products[Price]) * B2)`;
    handleFormulaUpdate(aiGenerated);
  };

  return (
    <div className="flex flex-col bg-slate-900 rounded-xl overflow-hidden border border-slate-700 shadow-lg text-slate-100 h-full">
      {/* Header */}
      <div className="bg-slate-800 px-4 py-2.5 flex items-center justify-between border-b border-slate-700 shrink-0">
        <div className="flex items-center gap-2">
          <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
          <span className="font-semibold text-xs text-emerald-300">Excel AI & Spreadsheet Automation Lab</span>
        </div>
        <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded font-mono font-medium">
          Office 365 Dynamic Arrays
        </span>
      </div>

      {/* Formula Bar & Prompt */}
      <div className="p-3 bg-slate-950 border-b border-slate-800 space-y-2.5 shrink-0">
        <div className="flex items-center gap-2">
          <span className="font-mono font-bold text-slate-400 text-xs px-2 py-1 bg-slate-800 border border-slate-700 rounded">
            fx
          </span>
          <input
            type="text"
            value={formula}
            onChange={(e) => handleFormulaUpdate(e.target.value)}
            className="flex-1 bg-slate-900 border border-slate-700 px-3 py-1.5 text-xs font-mono text-emerald-300 rounded-lg outline-none focus:border-emerald-500 selection:bg-emerald-950"
            placeholder="Enter formula e.g. =XLOOKUP(A2, Products[ID], Products[Price]) * B2"
          />
        </div>

        <div className="flex items-center justify-between text-xs bg-slate-900/80 p-2 rounded-lg border border-slate-800">
          <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" /> Need intelligent formula generation?
          </span>
          <button
            onClick={generateAiFormula}
            className="text-[11px] text-emerald-400 hover:text-emerald-300 font-semibold underline decoration-dotted cursor-pointer"
          >
            Insert Copilot AI Formula
          </button>
        </div>
      </div>

      {/* Dedicated Action Bar Directly Below Editor */}
      <div className="bg-slate-800/95 px-4 py-2.5 border-b border-slate-700 flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleFormulaUpdate(starterCode || '=XLOOKUP(A2, Products[ID], Products[Price]) * B2')}
            className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white px-2.5 py-1.5 rounded-lg bg-slate-700/60 hover:bg-slate-700 transition"
            title="Reset formula"
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
            onClick={evaluateFormula}
            disabled={isEvaluating}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-1.5 rounded-lg text-xs shadow-md transition disabled:opacity-50 active:scale-95 shadow-emerald-950"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{isEvaluating ? 'Evaluating...' : 'Run Code'}</span>
          </button>
        </div>
      </div>

      {/* Live Spreadsheet Grid Output */}
      <div className="bg-slate-900 p-3 overflow-y-auto font-sans text-xs flex-1 min-h-[180px]">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-[11px] mb-2 font-semibold text-slate-400">
          <span>Excel Dynamic Calculation Matrix</span>
          <span className="text-emerald-400 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Formula Output: {evalResult}
          </span>
        </div>

        <div className="overflow-x-auto border border-slate-800 rounded bg-slate-950">
          <table className="w-full text-left font-mono text-[11px]">
            <tbody className="divide-y divide-slate-800 text-slate-200">
              {gridData.map((row, idx) => (
                <tr key={idx} className={idx === 0 ? 'bg-slate-800 font-bold text-slate-300' : 'hover:bg-slate-800/40'}>
                  <td className="px-3 py-1.5 text-slate-500 w-8 border-r border-slate-800">{row.row}</td>
                  <td className="px-3 py-1.5 border-r border-slate-800/60 text-slate-300">{row.A}</td>
                  <td className="px-3 py-1.5 border-r border-slate-800/60 text-slate-300">{row.B}</td>
                  <td className="px-3 py-1.5 border-r border-slate-800/60 text-slate-300">{row.C}</td>
                  <td className={`px-3 py-1.5 font-bold ${idx === 0 ? 'text-slate-300' : 'text-emerald-400'}`}>{row.D}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
