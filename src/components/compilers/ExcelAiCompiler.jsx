import React, { useState } from 'react';
import { FileSpreadsheet, Sparkles, Play, CheckCircle2 } from 'lucide-react';

export const ExcelAiCompiler = ({ starterCode, onCodeChange }) => {
  const [formula, setFormula] = useState(starterCode || '=XLOOKUP(A2, Products[ID], Products[Price]) * B2');
  const [copilotPrompt, setCopilotPrompt] = useState('Calculate discounted revenue if order quantity exceeds 100 units');
  const [evalResult, setEvalResult] = useState('$1,450.00');

  // Spreadsheet Grid Matrix
  const [gridData, setGridData] = useState([
    { row: 1, A: 'Product ID', B: 'Quantity', C: 'Unit Price', D: 'Calculated Revenue' },
    { row: 2, A: 'P-102', B: '10', C: '$145.00', D: '$1,450.00' },
    { row: 3, A: 'P-105', B: '5', C: '$85.00', D: '$425.00' },
    { row: 4, A: 'P-201', B: '25', C: '$310.00', D: '$7,750.00' },
  ]);

  const handleFormulaUpdate = (val) => {
    setFormula(val);
    if (onCodeChange) onCodeChange(val);
  };

  const evaluateFormula = () => {
    setEvalResult('$1,450.00');
  };

  const generateAiFormula = () => {
    const aiGenerated = `=IF(B2>100, (XLOOKUP(A2, Products[ID], Products[Price]) * B2) * 0.85, XLOOKUP(A2, Products[ID], Products[Price]) * B2)`;
    setFormula(aiGenerated);
    if (onCodeChange) onCodeChange(aiGenerated);
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-xl overflow-hidden border border-slate-300 shadow-md text-slate-800 font-sans">
      {/* Header */}
      <div className="bg-emerald-700 text-white px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
          <span className="font-semibold text-xs">Excel AI & Spreadsheet Automation Lab</span>
        </div>
        <span className="text-[11px] bg-emerald-800 px-2 py-0.5 rounded font-mono">Copilot AI Engine Active</span>
      </div>

      {/* Formula Bar & Copilot Bar */}
      <div className="bg-slate-100 p-3 border-b border-slate-200 space-y-2">
        <div className="flex items-center gap-2">
          <span className="font-mono font-bold text-slate-500 text-xs px-2 py-1 bg-white border border-slate-300 rounded">fx</span>
          <input
            type="text"
            value={formula}
            onChange={(e) => handleFormulaUpdate(e.target.value)}
            className="flex-1 bg-white border border-slate-300 px-3 py-1 text-xs font-mono text-emerald-800 rounded outline-none focus:border-emerald-500"
            placeholder="Enter Excel formula e.g. =XLOOKUP(...) or =LET(...)"
          />
          <button
            onClick={evaluateFormula}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1 rounded text-xs font-semibold flex items-center gap-1"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Apply</span>
          </button>
        </div>

        {/* AI Copilot Prompt */}
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 p-2 rounded-lg text-xs">
          <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
          <input
            type="text"
            value={copilotPrompt}
            onChange={(e) => setCopilotPrompt(e.target.value)}
            className="flex-1 bg-transparent text-emerald-900 outline-none text-xs"
            placeholder="Ask Copilot AI to generate formula..."
          />
          <button
            onClick={generateAiFormula}
            className="bg-emerald-700 hover:bg-emerald-800 text-white px-2.5 py-1 rounded text-[11px] font-semibold transition shrink-0"
          >
            Generate AI Formula
          </button>
        </div>
      </div>

      {/* Interactive Spreadsheet Grid */}
      <div className="p-3 overflow-x-auto bg-slate-50 flex-1">
        <span className="text-[11px] font-semibold text-slate-500 block mb-2">Live Grid Evaluation Matrix:</span>
        <table className="w-full border-collapse border border-slate-300 text-xs font-mono">
          <thead>
            <tr className="bg-slate-200 text-slate-600">
              <th className="border border-slate-300 px-2 py-1 text-center w-10">#</th>
              <th className="border border-slate-300 px-3 py-1">A</th>
              <th className="border border-slate-300 px-3 py-1">B</th>
              <th className="border border-slate-300 px-3 py-1">C</th>
              <th className="border border-slate-300 px-3 py-1 bg-emerald-100 text-emerald-900">D (Calculated)</th>
            </tr>
          </thead>
          <tbody>
            {gridData.map((row) => (
              <tr key={row.row} className={row.row === 1 ? 'font-bold bg-slate-100' : 'bg-white hover:bg-slate-50'}>
                <td className="border border-slate-300 px-2 py-1.5 text-center bg-slate-100 text-slate-500">{row.row}</td>
                <td className="border border-slate-300 px-3 py-1.5">{row.A}</td>
                <td className="border border-slate-300 px-3 py-1.5">{row.B}</td>
                <td className="border border-slate-300 px-3 py-1.5">{row.C}</td>
                <td className="border border-slate-300 px-3 py-1.5 font-bold text-emerald-700 bg-emerald-50/50">{row.D}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
