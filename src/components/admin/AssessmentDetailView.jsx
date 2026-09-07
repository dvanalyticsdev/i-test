import React, { useState } from 'react';
import { useExam } from '../../context/ExamContext';
import { 
  ArrowLeft, 
  Search, 
  CheckCircle2, 
  FileText, 
  Code2, 
  Calendar, 
  GraduationCap, 
  Clock, 
  Users, 
  HelpCircle, 
  Sparkles, 
  Layers, 
  Download,
  AlertCircle,
  FileSpreadsheet
} from 'lucide-react';
import { exportAssessmentToExcel, exportAssessmentToPdf } from '../../utils/assessmentDocumentUtils';

export const AssessmentDetailView = ({ assessmentId, onBack }) => {
  const { getAssessmentById } = useExam();
  const assessment = getAssessmentById(assessmentId);
  const [questionSearch, setQuestionSearch] = useState('');

  if (!assessment) {
    return (
      <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-amber-500 mx-auto" />
        <h3 className="text-base font-bold text-slate-800">Assessment File Not Found</h3>
        <p className="text-xs text-slate-500">The requested assessment could not be located in the repository.</p>
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-sky-600 text-white text-xs font-bold rounded-xl"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Repository</span>
        </button>
      </div>
    );
  }

  const questions = assessment.questions || [];
  const filteredQuestions = questions.filter(q => {
    const term = questionSearch.toLowerCase();
    const matchesPrompt = (q.question || q.title || '').toLowerCase().includes(term);
    const matchesOptions = q.options?.some(opt => opt.toLowerCase().includes(term));
    const matchesExplanation = q.explanation?.toLowerCase().includes(term);
    return matchesPrompt || matchesOptions || matchesExplanation;
  });

  const handleExportJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(assessment, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `${assessment.id}_${assessment.title.replace(/\s+/g, '_')}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const optionLetters = ['A', 'B', 'C', 'D', 'E', 'F'];

  return (
    <div className="space-y-6 select-none animate-fadeIn">
      {/* Navigation Breadcrumb Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition border border-slate-300"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Repository</span>
          </button>
          <div className="h-5 w-px bg-slate-200 hidden sm:block"></div>
          <div className="text-xs">
            <span className="text-slate-400">Assessments Repository</span>
            <span className="text-slate-400 mx-1.5">/</span>
            <span className="font-bold text-slate-800">{assessment.title}</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Export to Excel */}
          <button
            onClick={() => exportAssessmentToExcel(assessment)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold transition border border-emerald-200"
            title="Export full question bank and answer key to Excel spreadsheet"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Export Excel</span>
          </button>

          {/* Export to PDF */}
          <button
            onClick={() => exportAssessmentToPdf(assessment)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-800 rounded-xl text-xs font-bold transition border border-rose-200"
            title="Download printable PDF question paper with answer keys"
          >
            <FileText className="w-3.5 h-3.5 text-rose-600" />
            <span>Export PDF</span>
          </button>

          {/* Export JSON */}
          <button
            onClick={handleExportJson}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-800 rounded-xl text-xs font-bold transition border border-sky-200"
          >
            <Download className="w-3.5 h-3.5" />
            <span>JSON</span>
          </button>

          <span
            className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase border ${
              assessment.status === 'Active'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                : assessment.status === 'Published'
                ? 'bg-sky-50 text-sky-800 border-sky-300'
                : 'bg-amber-50 text-amber-800 border-amber-300'
            }`}
          >
            {assessment.status}
          </span>
        </div>
      </div>

      {/* Assessment Document Overview Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1 max-w-3xl">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-sky-700 bg-sky-50 px-2.5 py-0.5 rounded border border-sky-200">
                {assessment.id}
              </span>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                Document Record
              </span>
            </div>
            <h1 className="text-xl font-extrabold text-slate-900 leading-tight">
              {assessment.title}
            </h1>
            <p className="text-xs text-slate-600 leading-relaxed pt-0.5">
              {assessment.description || 'Comprehensive evaluation assessment with defined answer keys and testing parameters.'}
            </p>
          </div>

          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-right min-w-[140px]">
            <span className="text-[11px] font-bold text-slate-400 block uppercase">Question Bank Pool</span>
            <span className="text-2xl font-extrabold text-slate-900">{questions.length}</span>
            <span className="text-[11px] font-semibold text-slate-500 block">Total Questions</span>
          </div>
        </div>

        {/* Metadata Key-Value Matrix */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-2 border-t border-slate-100">
          <div className="bg-slate-50/80 p-2.5 rounded-xl border border-slate-100">
            <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Assessment Type</span>
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
              {assessment.assessmentType === 'compiler' ? (
                <Code2 className="w-3.5 h-3.5 text-purple-600 shrink-0" />
              ) : (
                <FileText className="w-3.5 h-3.5 text-sky-600 shrink-0" />
              )}
              <span>{assessment.assessmentType === 'compiler' ? 'Compiler Assessment' : 'MCQ Assessment'}</span>
            </div>
          </div>

          <div className="bg-slate-50/80 p-2.5 rounded-xl border border-slate-100">
            <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Domain</span>
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 capitalize">
              <Layers className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              <span>{assessment.domain?.replace('_', ' ')}</span>
            </div>
          </div>

          <div className="bg-slate-50/80 p-2.5 rounded-xl border border-slate-100">
            <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Course</span>
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
              <GraduationCap className="w-3.5 h-3.5 text-sky-600 shrink-0" />
              <span>{assessment.course || 'All Courses'}</span>
            </div>
          </div>

          <div className="bg-slate-50/80 p-2.5 rounded-xl border border-slate-100">
            <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Target Batches</span>
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
              <Users className="w-3.5 h-3.5 text-teal-600 shrink-0" />
              <span className="truncate">{assessment.targetBatches?.join(', ') || 'All Batches'}</span>
            </div>
          </div>

          <div className="bg-slate-50/80 p-2.5 rounded-xl border border-slate-100">
            <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Date Created</span>
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
              <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span>{assessment.dateCreated}</span>
            </div>
          </div>

          <div className="bg-slate-50/80 p-2.5 rounded-xl border border-slate-100">
            <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Duration</span>
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
              <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>{assessment.durationMinutes || 45} Mins</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar within Assessment */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={questionSearch}
            onChange={(e) => setQuestionSearch(e.target.value)}
            placeholder="Search questions in this assessment by keyword, option, or answer..."
            className="w-full pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-sky-500 focus:bg-white transition"
          />
        </div>

        <div className="flex items-center gap-2 text-xs font-bold text-slate-600 shrink-0 px-2">
          <span>Showing {filteredQuestions.length} of {questions.length} questions</span>
        </div>
      </div>

      {/* Questions List */}
      <div className="space-y-4">
        {filteredQuestions.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-500 text-xs">
            No questions matching your search keyword "{questionSearch}".
          </div>
        ) : (
          filteredQuestions.map((q, idx) => {
            const isCompiler = q.type === 'compiler' || assessment.assessmentType === 'compiler';

            return (
              <div
                key={q.id || idx}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 space-y-4 transition hover:border-slate-300"
              >
                {/* Question Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className="w-7 h-7 rounded-lg bg-sky-600 text-white font-extrabold text-xs flex items-center justify-center shadow-xs">
                      {idx + 1}
                    </span>
                    <div>
                      <span className="font-mono text-[11px] font-bold text-slate-400">
                        {q.id || `Q-${idx + 1}`}
                      </span>
                      <span className="mx-1.5 text-slate-300">•</span>
                      <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded ${
                        isCompiler ? 'bg-purple-100 text-purple-900 border border-purple-200' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {isCompiler ? 'Compiler Challenge' : 'MCQ Question'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Answer Key Verified</span>
                  </div>
                </div>

                {/* Question Prompt */}
                <div className="text-sm font-bold text-slate-900 leading-relaxed">
                  {q.question || q.title}
                </div>

                {/* MCQ Options Rendering */}
                {!isCompiler && q.options && q.options.length > 0 && (
                  <div className="space-y-2 pt-1">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide block">
                      Options & Verified Correct Answer
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {q.options.map((opt, optIdx) => {
                        const isCorrect = optIdx === q.correctAnswer;

                        return (
                          <div
                            key={optIdx}
                            className={`p-3 rounded-xl border text-xs flex items-center justify-between gap-2.5 transition ${
                              isCorrect
                                ? 'bg-emerald-50/90 border-emerald-500 text-emerald-950 font-bold ring-1 ring-emerald-400 shadow-xs'
                                : 'bg-slate-50/60 border-slate-200 text-slate-700 font-medium'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <span
                                className={`w-5 h-5 rounded-md text-[10px] font-extrabold flex items-center justify-center shrink-0 ${
                                  isCorrect
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-slate-200 text-slate-700'
                                }`}
                              >
                                {optionLetters[optIdx]}
                              </span>
                              <span>{opt}</span>
                            </div>

                            {isCorrect && (
                              <span className="inline-flex items-center gap-1 bg-emerald-600 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-2xs shrink-0">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Correct Answer</span>
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Compiler Code Challenge Details */}
                {isCompiler && (
                  <div className="space-y-3 pt-1">
                    {q.description && (
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {q.description}
                      </p>
                    )}

                    {q.starterCode && (
                      <div>
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide block mb-1">
                          Starter Code & Template
                        </span>
                        <pre className="bg-slate-950 text-emerald-300 font-mono text-xs p-3.5 rounded-xl border border-slate-800 overflow-x-auto whitespace-pre-wrap">
                          {q.starterCode}
                        </pre>
                      </div>
                    )}

                    {q.testCases && q.testCases.length > 0 && (
                      <div>
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide block mb-1.5">
                          Verification Test Cases
                        </span>
                        <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden text-xs">
                          <table className="w-full text-left font-mono">
                            <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200 text-[11px]">
                              <tr>
                                <th className="p-2.5">Test Case Input</th>
                                <th className="p-2.5">Expected Output</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                              {q.testCases.map((tc, tcIdx) => (
                                <tr key={tcIdx}>
                                  <td className="p-2.5 text-slate-700">{tc.input}</td>
                                  <td className="p-2.5 text-emerald-700 font-bold">{tc.expected}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Explanation Rationale Box */}
                {q.explanation && (
                  <div className="bg-sky-50/70 border border-sky-200 rounded-xl p-3 flex items-start gap-2 text-xs">
                    <Sparkles className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-sky-900 block mb-0.5">Answer Rationale & Concept:</span>
                      <p className="text-sky-800 leading-relaxed">{q.explanation}</p>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
