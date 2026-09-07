import React, { useState } from 'react';
import { UploadCloud, FileCode2, CheckCircle2, AlertCircle, X } from 'lucide-react';

export const BulkUploadModal = ({ isOpen, onClose, onUploadSuccess }) => {
  const [jsonText, setJsonText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null);

  if (!isOpen) return null;

  const sampleTemplate = `[
  {
    "id": "bulk-q101",
    "domain": "gen_ai",
    "type": "mcq",
    "question": "What function evaluates semantic distance between vector embeddings?",
    "options": ["Cosine Distance", "Euclidean Matrix", "B-Tree Depth", "Regex Match"],
    "correctAnswer": 0
  }
]`;

  const handleSimulateUpload = () => {
    setIsProcessing(true);
    setUploadStatus(null);

    setTimeout(() => {
      try {
        let parsed = [];
        if (jsonText.trim()) {
          parsed = JSON.parse(jsonText);
        } else {
          // Generate 20 additional mock questions automatically
          parsed = Array.from({ length: 20 }).map((_, i) => ({
            id: `bulk-gen-${Date.now()}-${i}`,
            domain: ['python', 'sql', 'power_bi', 'excel_ai', 'gen_ai'][i % 5],
            type: 'mcq',
            question: `Bulk Import Question #${i + 101}: What is the primary optimization step in data processing?`,
            options: ['Option A', 'Option B', 'Option C', 'Option D'],
            correctAnswer: 0
          }));
        }

        onUploadSuccess(parsed);
        setUploadStatus({ success: true, count: parsed.length });
        setIsProcessing(false);
      } catch (err) {
        setUploadStatus({ success: false, message: 'Invalid JSON format. Please format as valid JSON array.' });
        setIsProcessing(false);
      }
    }, 600);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
          <div className="flex items-center gap-2">
            <UploadCloud className="w-5 h-5 text-sky-600" />
            <h3 className="text-base font-bold text-slate-900">Bulk Question Bank Importer</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-600 mb-4">
          Upload large question datasets (e.g. 100 questions CSV/JSON). The platform will automatically serve a randomized subset of 30 unique questions per student session.
        </p>

        {/* Drag and Drop Zone Simulator */}
        <div className="border-2 border-dashed border-sky-200 bg-sky-50/50 hover:bg-sky-50 rounded-xl p-6 text-center cursor-pointer transition mb-4">
          <FileCode2 className="w-8 h-8 text-sky-600 mx-auto mb-2" />
          <span className="text-xs font-bold text-sky-900 block mb-1">Click or drag question dataset file (.json / .csv)</span>
          <span className="text-[11px] text-slate-500">Supports question pools of up to 500 items</span>
        </div>

        {/* JSON Textarea paste option */}
        <div className="mb-4">
          <label className="text-xs font-semibold text-slate-700 block mb-1">Or paste JSON array string directly:</label>
          <textarea
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
            placeholder={sampleTemplate}
            className="w-full h-28 bg-slate-900 text-emerald-300 font-mono text-xs p-3 rounded-xl border border-slate-700 outline-none"
          />
        </div>

        {/* Status Alerts */}
        {uploadStatus && (
          <div className={`p-3 rounded-xl text-xs font-medium mb-4 ${uploadStatus.success ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'}`}>
            {uploadStatus.success
              ? `Successfully imported ${uploadStatus.count} questions into the active question bank!`
              : uploadStatus.message}
          </div>
        )}

        <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl"
          >
            Cancel
          </button>
          <button
            onClick={handleSimulateUpload}
            disabled={isProcessing}
            className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl shadow-md transition disabled:opacity-50"
          >
            {isProcessing ? 'Processing Upload...' : 'Process Bulk Import'}
          </button>
        </div>
      </div>
    </div>
  );
};
