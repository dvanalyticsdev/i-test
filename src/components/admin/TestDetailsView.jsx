import React, { useState, useMemo } from 'react';
import { useExam } from '../../context/ExamContext';
import { INITIAL_QUESTION_BANK } from '../../data/mockQuestionBank';
import logo from '../../assets/DV-Logo.png';
import { ArrowLeft, Printer, Download, FileText, Code2, CheckCircle2, HelpCircle, Calendar, Clock } from 'lucide-react';

const APPLICATIONS_MAP = {
  excel_ai: 'EXCEL AI',
  sql: 'SQL',
  power_bi: 'POWER BI',
  python: 'PYTHON',
  sas: 'SAS',
  ml: 'ML',
  gen_ai: 'GEN AI & AGENTIC AI',
  data_engineering: 'DATA ENGINEERING',
  mlops: 'MLOPS & LLMOPS'
};

export const TestDetailsView = ({ testId: propTestId, testTitle: propTestTitle }) => {
  const { scheduledTests, assessments, questionBank } = useExam();

  // Extract test identifiers from props or URL query params
  const { testId, testTitle } = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return {
      testId: propTestId || params.get('id') || params.get('testId') || '',
      testTitle: propTestTitle || params.get('test') || ''
    };
  }, [propTestId, propTestTitle]);

  // Locate matching test object
  const testMeta = useMemo(() => {
    if (testId) {
      const found = scheduledTests.find(t => t.id === testId);
      if (found) return found;
    }
    if (testTitle) {
      const found = scheduledTests.find(t => t.title === testTitle || t.title?.toLowerCase() === testTitle.toLowerCase());
      if (found) return found;
    }
    // Fallback default test if not found
    return scheduledTests[0] || {
      id: 'TEST-DEFAULT',
      title: testTitle || 'Assessment Question Paper & Answer Key',
      domain: 'python',
      domains: ['python'],
      course: 'AIML',
      courses: ['AIML'],
      targetBatches: ['202601'],
      assessmentType: 'mcq',
      durationMinutes: 45,
      scheduledStartFormatted: '2026-09-07 10:00'
    };
  }, [scheduledTests, testId, testTitle]);

  // Strict Evaluation of Test Type
  const normType = (testMeta.assessmentType || 'mcq').toLowerCase();
  const isPracticalOnly = normType === 'compiler' || normType === 'practical';
  const isHybrid = normType === 'hybrid';
  const isMcqOnly = normType === 'mcq' || (!isPracticalOnly && !isHybrid);

  // Extract MCQ Questions for this test
  const mcqQuestions = useMemo(() => {
    // If practical only, STRICTLY return NO MCQs
    if (isPracticalOnly) return [];

    // Check attached MCQ File
    if (testMeta.mcqFileId) {
      const attachedFile = (assessments || []).find(a => a.id === testMeta.mcqFileId);
      if (attachedFile && attachedFile.questions && attachedFile.questions.length > 0) {
        return attachedFile.questions;
      }
    }

    // Filter from Question Bank by domain(s)
    const targetDomains = testMeta.domains || [testMeta.domain || 'python'];
    const bankPool = (questionBank || INITIAL_QUESTION_BANK).filter(q => 
      q.type === 'mcq' && (targetDomains.includes('All Applications') || targetDomains.includes(q.domain))
    );

    if (bankPool.length > 0) {
      return bankPool.slice(0, 15);
    }

    return (questionBank || INITIAL_QUESTION_BANK).filter(q => q.type === 'mcq').slice(0, 12);
  }, [testMeta, assessments, questionBank, isPracticalOnly]);

  // Extract Practical / Compiler Coding Challenges for this test
  const compilerChallenges = useMemo(() => {
    // If MCQ ONLY, STRICTLY return NO compiler challenges!
    if (isMcqOnly) return [];

    // Check attached Practical File
    if (testMeta.practicalFileId) {
      const attachedFile = (assessments || []).find(a => a.id === testMeta.practicalFileId);
      if (attachedFile && attachedFile.questions && attachedFile.questions.length > 0) {
        return attachedFile.questions;
      }
    }

    // Filter compiler challenges from Question Bank
    const targetDomains = testMeta.domains || [testMeta.domain || 'python'];
    const bankCompilers = (questionBank || INITIAL_QUESTION_BANK).filter(q => 
      q.type === 'compiler' && (targetDomains.includes('All Applications') || targetDomains.includes(q.domain))
    );

    if (bankCompilers.length > 0) {
      return bankCompilers;
    }

    return (questionBank || INITIAL_QUESTION_BANK).filter(q => q.type === 'compiler');
  }, [testMeta, assessments, questionBank, isMcqOnly]);

  // Tab State: 'mcq' | 'practical'
  const [activeTab, setActiveTab] = useState(() => {
    if (isPracticalOnly) return 'practical';
    return 'mcq';
  });

  const showMcqTab = mcqQuestions.length > 0 && !isPracticalOnly;
  const showPracticalTab = compilerChallenges.length > 0 && !isMcqOnly;

  // Application names
  const applicationNames = useMemo(() => {
    const rawApps = testMeta.domains || (testMeta.domain ? [testMeta.domain] : ['python']);
    return rawApps.map(dId => APPLICATIONS_MAP[dId] || dId.toUpperCase());
  }, [testMeta]);

  // Course names
  const courseNames = useMemo(() => {
    if (testMeta.courses && testMeta.courses.length > 0) return testMeta.courses;
    if (testMeta.course) return Array.isArray(testMeta.course) ? testMeta.course : [testMeta.course];
    return ['AIML'];
  }, [testMeta]);

  // Batch names
  const batchNames = useMemo(() => {
    if (testMeta.targetBatches && testMeta.targetBatches.length > 0) return testMeta.targetBatches;
    if (testMeta.batch) return [testMeta.batch];
    return ['202601'];
  }, [testMeta]);

  const handlePrint = () => {
    window.print();
  };

  const handleExportJSON = () => {
    const exportData = {
      testInfo: testMeta,
      mcqQuestions: mcqQuestions,
      compilerChallenges: compilerChallenges
    };
    const jsonStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Test_Details_${(testMeta.title || 'Paper').replace(/\s+/g, '_')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans p-4 sm:p-8 select-none print:p-0 print:bg-white">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Top Control Bar (Hidden on Print) */}
        <div className="flex items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs print:hidden">
          <div className="flex items-center gap-3">
            <button
              onClick={() => window.close()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-semibold transition cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Close Tab</span>
            </button>
            <div className="h-4 w-px bg-slate-200" />
            <span className="text-xs font-bold text-slate-700">Assessment Question Paper & Master Answer Key</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportJSON}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold shadow-xs transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Paper</span>
            </button>
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#051f40] hover:bg-[#1b2a60] text-white text-xs font-bold shadow-sm transition cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Question Paper</span>
            </button>
          </div>
        </div>

        {/* Master Test Header Document Box */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
          {/* Header Branding */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
            <div className="flex items-center gap-4">
              <img src={logo} alt="DV Analytics" className="h-12 w-auto object-contain shrink-0" />
              <div>
                <h1 className="text-xl font-extrabold text-[#051f40] leading-tight">{testMeta.title}</h1>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Official Master Question Paper & Verified Solution Scheme • ID: <strong className="font-mono text-slate-700">{testMeta.id}</strong>
                </p>
              </div>
            </div>

            <div className="flex flex-col items-end gap-1.5 shrink-0">
              <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase border ${
                isHybrid
                  ? 'bg-purple-50 text-purple-700 border-purple-200'
                  : isPracticalOnly
                  ? 'bg-slate-100 text-slate-700 border-slate-200'
                  : 'bg-orange-50 text-[#ef5323] border-orange-200'
              }`}>
                {isHybrid ? 'MCQ + Practical (Hybrid)' : isPracticalOnly ? 'Practical Only (Compiler)' : 'MCQ Assessment Only'}
              </span>
              <span className="text-[11px] text-slate-400 font-medium">
                DV Elite Testing Console
              </span>
            </div>
          </div>

          {/* Test Metadata Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200/80 text-xs">
            <div>
              <span className="text-slate-400 font-medium block">Target Applications</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {applicationNames.map((app, idx) => (
                  <span key={idx} className="bg-white border border-slate-200 text-slate-800 font-bold px-2 py-0.5 rounded text-[11px]">
                    {app}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <span className="text-slate-400 font-medium block">Target Courses</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {courseNames.map((c, idx) => (
                  <span key={idx} className="bg-white border border-slate-200 text-[#051f40] font-bold px-2 py-0.5 rounded text-[11px]">
                    {c}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <span className="text-slate-400 font-medium block">Target Batches</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {batchNames.map((b, idx) => (
                  <span key={idx} className="bg-white border border-slate-200 text-slate-700 font-mono text-[11px] px-2 py-0.5 rounded">
                    {b}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <span className="text-slate-400 font-medium block">Schedule & Duration</span>
              <div className="space-y-0.5 mt-1 text-slate-800 font-semibold">
                <p className="flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-[#ef5323]" />
                  <span>Start: {testMeta.scheduledStartFormatted || testMeta.scheduledFor || 'Live'}</span>
                </p>
                <p className="flex items-center gap-1 text-slate-600">
                  <Clock className="w-3 h-3 text-slate-400" />
                  <span>Duration: {testMeta.durationMinutes} mins</span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Section Navigation Tabs (Only rendered if test has multiple sections or for switching) */}
        {(showMcqTab && showPracticalTab) && (
          <div className="flex items-center gap-2 border-b border-slate-200 pb-2 print:hidden">
            <button
              onClick={() => setActiveTab('mcq')}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 cursor-pointer transition ${
                activeTab === 'mcq'
                  ? 'bg-[#051f40] text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <FileText className={`w-4 h-4 ${activeTab === 'mcq' ? 'text-orange-400' : 'text-[#ef5323]'}`} />
              <span>MCQ Questions ({mcqQuestions.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('practical')}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 cursor-pointer transition ${
                activeTab === 'practical'
                  ? 'bg-[#051f40] text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Code2 className={`w-4 h-4 ${activeTab === 'practical' ? 'text-purple-400' : 'text-purple-600'}`} />
              <span>Practical / Compiler Labs ({compilerChallenges.length})</span>
            </button>
          </div>
        )}

        {/* SECTION 1: Multiple Choice Questions (MCQs) */}
        {showMcqTab && (activeTab === 'mcq' || isMcqOnly) && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h2 className="text-base font-bold text-[#051f40] flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#ef5323]" />
                <span>Multiple Choice Questions ({mcqQuestions.length} Questions)</span>
              </h2>
              <span className="text-xs font-semibold text-slate-500">
                1 Mark Each • Single Selection
              </span>
            </div>

            <div className="space-y-6">
              {mcqQuestions.map((q, qIdx) => {
                const correctIdx = q.correctAnswer;
                return (
                  <div key={q.id || qIdx} className="bg-slate-50/70 p-5 rounded-2xl border border-slate-200/80 space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-[#051f40] text-white font-bold text-xs flex items-center justify-center shrink-0">
                          {qIdx + 1}
                        </span>
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                          Question {qIdx + 1}
                        </span>
                      </div>

                      {q.domain && (
                        <span className="text-[10px] bg-slate-200 text-slate-700 font-bold px-2.5 py-0.5 rounded-full uppercase">
                          {APPLICATIONS_MAP[q.domain] || q.domain}
                        </span>
                      )}
                    </div>

                    {/* Question Text */}
                    <p className="text-sm font-bold text-slate-900 leading-relaxed pl-8">
                      {q.question}
                    </p>

                    {/* Options Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pl-8 pt-1">
                      {q.options && q.options.map((opt, oIdx) => {
                        const isCorrect = oIdx === correctIdx;
                        return (
                          <div
                            key={oIdx}
                            className={`p-3 rounded-xl border text-xs font-medium flex items-center justify-between transition ${
                              isCorrect
                                ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-bold shadow-2xs'
                                : 'bg-white border-slate-200 text-slate-700'
                            }`}
                          >
                            <div className="flex items-center gap-2 truncate">
                              <span className={`w-5 h-5 rounded-full font-bold text-[11px] flex items-center justify-center shrink-0 ${
                                isCorrect ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'
                              }`}>
                                {String.fromCharCode(65 + oIdx)}
                              </span>
                              <span className="truncate">{opt}</span>
                            </div>

                            {isCorrect && (
                              <span className="text-[10px] bg-emerald-600 text-white font-bold px-2 py-0.5 rounded-full shrink-0 flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" />
                                Correct Answer
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Answer Explanation Box */}
                    {q.explanation && (
                      <div className="ml-8 bg-emerald-50/60 border border-emerald-200/80 p-3 rounded-xl text-xs space-y-1">
                        <span className="text-emerald-800 font-bold flex items-center gap-1">
                          <HelpCircle className="w-3.5 h-3.5 text-emerald-600" />
                          Solution & Explanation Key:
                        </span>
                        <p className="text-emerald-900 font-medium leading-relaxed">
                          {q.explanation}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* SECTION 2: Practical / Compiler Coding Challenges */}
        {showPracticalTab && (activeTab === 'practical' || isPracticalOnly) && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h2 className="text-base font-bold text-[#051f40] flex items-center gap-2">
                <Code2 className="w-5 h-5 text-purple-600" />
                <span>Practical Compiler Coding Challenges ({compilerChallenges.length} Labs)</span>
              </h2>
              <span className="text-xs font-semibold text-slate-500">
                Hands-On Code / Query / Formula Evaluation
              </span>
            </div>

            <div className="space-y-8">
              {compilerChallenges.map((lab, lIdx) => (
                <div key={lab.id || lIdx} className="bg-slate-50/80 p-6 rounded-2xl border border-slate-200 space-y-4">
                  <div className="flex items-center justify-between gap-2 border-b border-slate-200 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-purple-700 text-white font-bold text-xs flex items-center justify-center shrink-0">
                        {lIdx + 1}
                      </span>
                      <h3 className="text-sm font-bold text-slate-900">
                        {lab.title || `Practical Challenge #${lIdx + 1}`}
                      </h3>
                    </div>

                    <span className="text-xs bg-purple-100 text-purple-800 font-bold px-3 py-0.5 rounded-full uppercase">
                      Compiler Lab
                    </span>
                  </div>

                  {/* Problem Description */}
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Problem Statement</span>
                    <p className="text-xs font-medium text-slate-800 leading-relaxed bg-white p-3.5 rounded-xl border border-slate-200">
                      {lab.description}
                    </p>
                  </div>

                  {/* Test Cases / Sample Input & Expected Output */}
                  {lab.testCases && lab.testCases.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Test Cases & Verification Specifications</span>
                      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden text-xs">
                        <table className="w-full text-left">
                          <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                            <tr>
                              <th className="p-2.5">Input Specification</th>
                              <th className="p-2.5">Expected Output</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 font-mono text-[11px] text-slate-800">
                            {lab.testCases.map((tc, tcIdx) => (
                              <tr key={tcIdx} className="hover:bg-slate-50/50">
                                <td className="p-2.5 font-semibold text-slate-700">{tc.input}</td>
                                <td className="p-2.5 text-emerald-700 font-bold">{tc.expected}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Starter Code vs Solution Code */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                    {/* Starter Template */}
                    <div className="space-y-1.5 min-w-0">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                        <Code2 className="w-3.5 h-3.5 text-slate-400" />
                        Candidate Starter Template:
                      </span>
                      <div className="bg-slate-900 text-slate-100 p-4 rounded-xl border border-slate-800 overflow-x-auto max-w-full">
                        <pre className="whitespace-pre font-mono text-xs leading-relaxed">
                          {lab.starterCode || '// Candidate writes solution here'}
                        </pre>
                      </div>
                    </div>

                    {/* Verified Model Solution */}
                    <div className="space-y-1.5 min-w-0">
                      <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Verified Model Solution Code:
                      </span>
                      <div className="bg-[#051f40] text-emerald-300 p-4 rounded-xl border border-emerald-900 overflow-x-auto max-w-full">
                        <pre className="whitespace-pre font-mono text-xs leading-relaxed">
                          {lab.solutionCode || lab.starterCode || '# Master Compiler Verified Code'}
                        </pre>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
