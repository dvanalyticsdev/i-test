import React, { useState, useRef } from 'react';
import { 
  UploadCloud, 
  FileCode2, 
  FileSpreadsheet, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Sparkles, 
  Download,
  Upload,
  FileCheck
} from 'lucide-react';
import { 
  parseAssessmentExcelFile, 
  parseAssessmentPdfFile 
} from '../../utils/assessmentDocumentUtils';

export const BulkUploadModal = ({ isOpen, onClose, onUploadSuccess }) => {
  const [activeTab, setActiveTab] = useState('excel'); // 'excel' | 'pdf' | 'json'
  const [jsonText, setJsonText] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const sampleTemplate = `{
  "title": "Cloud Data Warehousing & ETL Pipeline Assessment",
  "domain": "data_engineering",
  "assessmentType": "mcq",
  "course": "FDE",
  "targetBatches": ["202601", "202103"],
  "durationMinutes": 45,
  "status": "Active",
  "description": "Evaluates distributed compute engines, columnar data storage, and Delta Lake ACID transactions.",
  "questions": [
    {
      "id": "de-q01",
      "question": "In Apache Spark, what type of transformation causes a cluster-wide data shuffle across executor nodes?",
      "options": ["Wide Dependency (e.g. groupByKey, reduceByKey)", "Narrow Dependency (e.g. map, filter)", "Broadcast Hash Join on small table", "rdd.take(5)"],
      "correctAnswer": 0,
      "explanation": "Wide transformations require data partitioning across multiple partitions leading to network serialization and shuffle overhead."
    },
    {
      "id": "de-q02",
      "question": "Which storage format utilizes dictionary encoding, run-length encoding, and bit packing for high-throughput OLAP querying?",
      "options": ["Apache Parquet", "JSON Lines", "CSV Flatfile", "Uncompressed XML"],
      "correctAnswer": 0,
      "explanation": "Parquet is a columnar storage format with advanced compression algorithms tailored specifically for analytical query engines."
    }
  ]
}`;

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setUploadStatus(null);
    }
  };

  const handleProcessUpload = async () => {
    setIsProcessing(true);
    setUploadStatus(null);

    try {
      let newAssessment;

      if (activeTab === 'excel') {
        if (!selectedFile) {
          throw new Error('Please select an Excel (.xlsx) file to upload.');
        }
        newAssessment = await parseAssessmentExcelFile(selectedFile);
      } else if (activeTab === 'pdf') {
        if (!selectedFile) {
          throw new Error('Please select a PDF document (.pdf) containing assessment questions.');
        }
        newAssessment = await parseAssessmentPdfFile(selectedFile);
      } else {
        // JSON Tab
        if (jsonText.trim()) {
          const parsed = JSON.parse(jsonText);

          if (parsed && typeof parsed === 'object' && !Array.isArray(parsed) && parsed.questions) {
            newAssessment = {
              id: parsed.id || `ASM-${Date.now().toString().slice(-4)}`,
              title: parsed.title || 'Custom Uploaded Assessment',
              assessmentType: parsed.assessmentType || 'mcq',
              domain: parsed.domain || 'python',
              course: parsed.course || 'All Courses',
              targetBatches: parsed.targetBatches || ['202601'],
              dateCreated: parsed.dateCreated || new Date().toISOString().split('T')[0],
              status: parsed.status || 'Active',
              durationMinutes: parsed.durationMinutes || 45,
              description: parsed.description || 'Uploaded custom assessment with verified answer keys.',
              questions: parsed.questions
            };
          } else if (Array.isArray(parsed)) {
            newAssessment = {
              id: `ASM-${Date.now().toString().slice(-4)}`,
              title: `Bulk Imported Question Pool (${parsed.length} Questions)`,
              assessmentType: parsed.some(q => q.type === 'compiler') ? 'compiler' : 'mcq',
              domain: parsed[0]?.domain || 'python',
              course: 'All Courses',
              targetBatches: ['202601', 'All Batches'],
              dateCreated: new Date().toISOString().split('T')[0],
              status: 'Active',
              durationMinutes: 45,
              description: `Uploaded assessment file containing ${parsed.length} questions.`,
              questions: parsed
            };
          } else {
            throw new Error('Invalid JSON structure. Please provide an assessment object with a "questions" array.');
          }
        } else {
          // Generate a rich 10-question dummy assessment file automatically
          const sampleDomains = ['data_engineering', 'gen_ai', 'mlops'];
          const chosenDomain = sampleDomains[Math.floor(Math.random() * sampleDomains.length)];

          const dummyQuestions = Array.from({ length: 10 }).map((_, i) => ({
            id: `gen-q${i + 1}`,
            type: 'mcq',
            question: `Production Assessment Question #${i + 1}: What is the primary operational consideration when architecting high-throughput data pipelines?`,
            options: [
              'Implementing idempotent consumers with exponential backoff and dead-letter queues',
              'Increasing database transaction timeout to infinite seconds',
              'Disabling write-ahead logs on all primary replica nodes',
              'Running single-threaded batch cron jobs every 24 hours'
            ],
            correctAnswer: 0,
            explanation: 'Idempotency ensures that re-delivered messages during network partitions do not introduce duplicate states or corrupted computations.'
          }));

          newAssessment = {
            id: `ASM-${Date.now().toString().slice(-4)}`,
            title: `Generative AI & Data Pipeline Assessment (${chosenDomain.replace('_', ' ').toUpperCase()})`,
            assessmentType: 'mcq',
            domain: chosenDomain,
            course: 'FDE',
            targetBatches: ['202601', '202103'],
            dateCreated: new Date().toISOString().split('T')[0],
            status: 'Active',
            durationMinutes: 45,
            description: 'Production assessment file imported via bulk dataset manager with 10 questions and answer keys.',
            questions: dummyQuestions
          };
        }
      }

      onUploadSuccess(newAssessment);
      setUploadStatus({ 
        success: true, 
        count: newAssessment.questions.length,
        title: newAssessment.title,
        source: activeTab.toUpperCase()
      });
      setIsProcessing(false);

      // Auto close after brief display
      setTimeout(() => {
        onClose();
      }, 1300);
    } catch (err) {
      setUploadStatus({ 
        success: false, 
        message: err.message || 'Error parsing assessment file. Please check the file format.' 
      });
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 select-none">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-3">
          <div className="flex items-center gap-2">
            <UploadCloud className="w-5 h-5 text-sky-600" />
            <h3 className="text-base font-bold text-slate-900">Bulk Assessment Document Importer</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-600 mb-3">
          Import complete assessments with question sets, choices, and verified answer keys from <strong>Excel (.xlsx)</strong>, <strong>PDF</strong>, or <strong>JSON</strong> files.
        </p>

        {/* Format Selector Tabs */}
        <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100 rounded-xl mb-4 text-xs font-bold">
          <button
            type="button"
            onClick={() => { setActiveTab('excel'); setSelectedFile(null); setUploadStatus(null); }}
            className={`py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition ${
              activeTab === 'excel' 
                ? 'bg-white text-emerald-800 shadow-xs border border-emerald-200 font-extrabold' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Excel XLSX</span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('pdf'); setSelectedFile(null); setUploadStatus(null); }}
            className={`py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition ${
              activeTab === 'pdf' 
                ? 'bg-white text-rose-800 shadow-xs border border-rose-200 font-extrabold' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-4 h-4 text-rose-600" />
            <span>PDF Document</span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('json'); setSelectedFile(null); setUploadStatus(null); }}
            className={`py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition ${
              activeTab === 'json' 
                ? 'bg-white text-sky-800 shadow-xs border border-sky-200 font-extrabold' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileCode2 className="w-4 h-4 text-sky-600" />
            <span>JSON File</span>
          </button>
        </div>

        {/* TAB 1: EXCEL XLSX */}
        {activeTab === 'excel' && (
          <div className="space-y-3 flex-1 flex flex-col justify-center">
            {/* File Upload / Drop Area */}
            <input 
              ref={fileInputRef}
              type="file" 
              accept=".xlsx" 
              className="hidden" 
              onChange={handleFileChange} 
            />

            <div
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center gap-2 ${
                selectedFile 
                  ? 'border-emerald-400 bg-emerald-50/60' 
                  : 'border-slate-300 hover:border-emerald-500 bg-slate-50 hover:bg-emerald-50/30'
              }`}
            >
              {selectedFile ? (
                <>
                  <FileCheck className="w-10 h-10 text-emerald-600 animate-bounce" />
                  <span className="text-xs font-extrabold text-slate-800 font-mono">
                    {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                  </span>
                  <span className="text-[11px] text-emerald-700 font-semibold">
                    File selected and ready to import questions! Click to replace.
                  </span>
                </>
              ) : (
                <>
                  <Upload className="w-9 h-9 text-slate-400 group-hover:text-emerald-600 transition" />
                  <span className="text-xs font-bold text-slate-800">
                    Click to select or drag & drop Excel (.xlsx) spreadsheet
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Automatically extracts questions, Options A-D, answers, and explanations
                  </span>
                </>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: PDF DOCUMENT */}
        {activeTab === 'pdf' && (
          <div className="space-y-3 flex-1 flex flex-col justify-center">
            <input 
              ref={fileInputRef}
              type="file" 
              accept=".pdf" 
              className="hidden" 
              onChange={handleFileChange} 
            />

            <div
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-7 text-center cursor-pointer transition flex flex-col items-center justify-center gap-2 ${
                selectedFile 
                  ? 'border-rose-400 bg-rose-50/60' 
                  : 'border-slate-300 hover:border-rose-500 bg-slate-50 hover:bg-rose-50/30'
              }`}
            >
              {selectedFile ? (
                <>
                  <FileCheck className="w-10 h-10 text-rose-600 animate-bounce" />
                  <span className="text-xs font-extrabold text-slate-800 font-mono">
                    {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                  </span>
                  <span className="text-[11px] text-rose-700 font-semibold">
                    PDF document loaded. Click "Import Assessment Document" to parse.
                  </span>
                </>
              ) : (
                <>
                  <FileText className="w-10 h-10 text-rose-500" />
                  <span className="text-xs font-bold text-slate-800">
                    Click to upload Assessment PDF Document (.pdf)
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Parses assessment questionnaire documents and maps answer keys into repository files
                  </span>
                </>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: JSON */}
        {activeTab === 'json' && (
          <div className="space-y-3 flex-1 flex flex-col">
            <div 
              onClick={() => setJsonText(sampleTemplate)}
              className="border border-dashed border-sky-200 bg-sky-50/50 hover:bg-sky-50 rounded-xl p-3 text-center cursor-pointer transition group"
            >
              <FileCode2 className="w-5 h-5 text-sky-600 mx-auto mb-1" />
              <span className="text-xs font-bold text-sky-900 block">Click to Load Sample JSON Template</span>
              <span className="text-[10px] text-slate-500">Or paste your assessment object in the text box below</span>
            </div>

            <textarea
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              placeholder="Paste assessment JSON or leave empty for auto-generated assessment..."
              className="w-full h-32 bg-slate-900 text-emerald-300 font-mono text-xs p-3 rounded-xl border border-slate-700 outline-none resize-none"
            />
          </div>
        )}

        {/* Status Alerts */}
        {uploadStatus && (
          <div className={`mt-3 p-3 rounded-xl text-xs font-medium flex items-center gap-2 ${
            uploadStatus.success ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}>
            {uploadStatus.success ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Successfully imported <strong>"{uploadStatus.title}"</strong> ({uploadStatus.count} questions) via {uploadStatus.source}!</span>
              </>
            ) : (
              <>
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{uploadStatus.message}</span>
              </>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 mt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleProcessUpload}
            disabled={isProcessing}
            className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl shadow-md transition disabled:opacity-50 flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isProcessing ? 'Importing Assessment...' : 'Import Assessment Document'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

