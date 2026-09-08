import React, { useState, useEffect } from 'react';
import { useExam } from '../../context/ExamContext';
import { useAuth } from '../../context/AuthContext';
import { useProctoring } from '../../hooks/useProctoring';
import { AntiCheatGuard } from '../proctoring/AntiCheatGuard';
import { DisqualifiedModal } from '../proctoring/DisqualifiedModal';
import { McqQuestionCard } from './McqQuestionCard';
import { QuestionNavPanel } from './QuestionNavPanel';
import { PythonCompiler } from '../compilers/PythonCompiler';
import { SqlCompiler } from '../compilers/SqlCompiler';
import { PowerBICompiler } from '../compilers/PowerBICompiler';
import { SasCompiler } from '../compilers/SasCompiler';
import { ExcelAiCompiler } from '../compilers/ExcelAiCompiler';
import { Clock, ShieldAlert, CheckCircle2, Code2, FileText, AlertCircle, LogOut, Sparkles } from 'lucide-react';
import logo from '../../assets/DV-Logo.png';

export const ExamEnvironment = () => {
  const { user } = useAuth();
  const {
    activeSession,
    selectMcqAnswer,
    toggleMarkForReview,
    updateCompilerCode,
    setCurrentQuestionIndex,
    setActiveSection,
    registerProctorViolation,
    submitExam,
    exitExam
  } = useExam();

  const [confirmSubmitOpen, setConfirmSubmitOpen] = useState(false);
  const [activeCompilerDomain, setActiveCompilerDomain] = useState('python'); // 'python' | 'sql' | 'power_bi' | 'sas' | 'excel_ai'

  // Hook up Proctoring Guard with grace period, cooldown, and 2-strike auto-submission
  const handleViolation = (reason, count) => {
    registerProctorViolation(reason, count);
  };

  const { 
    isFullscreen, 
    requestFullscreen, 
    mediaStream, 
    cameraStatus, 
    microphoneStatus, 
    deviceErrorDetails, 
    retryMediaDevices 
  } = useProctoring({
    onViolation: handleViolation,
    onAutoSubmitDisqualified: (reason) => {
      registerProctorViolation(reason, 2);
    },
    isExamActive: activeSession && !activeSession.isFinished,
    initialWarningCount: activeSession?.warningCount || 0
  });

  // Timer countdown effect
  const [secondsLeft, setSecondsLeft] = useState(activeSession?.timeRemainingSeconds || 2700);

  useEffect(() => {
    if (!activeSession || activeSession.isFinished) return;
    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          submitExam();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [activeSession, submitExam]);

  if (!activeSession) return null;

  // Format Timer
  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const formattedTime = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  // If student was disqualified after exceeding 2 warnings
  if (activeSession.isFinished && activeSession.disqualifiedReason) {
    return (
      <DisqualifiedModal
        reason={activeSession.disqualifiedReason}
        onReturnToDashboard={exitExam}
      />
    );
  }

  // If student submitted normally
  if (activeSession.isFinished) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 select-none">
        <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-8 shadow-xl text-center">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-300">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-2">Assessment Completed</h2>
          <p className="text-xs text-slate-600 mb-6 leading-relaxed">
            Your responses and hands-on compiler code have been securely formatted and routed to the Administrator Dashboard for final evaluation.
          </p>

          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 mb-6 text-left text-xs space-y-2">
            <div className="flex justify-between border-b border-slate-200 pb-2">
              <span className="text-slate-500">Total MCQs Answered:</span>
              <span className="font-bold text-slate-800">{Object.keys(activeSession.userAnswers).length} / 30</span>
            </div>
            <div className="flex justify-between border-b border-slate-200 pb-2">
              <span className="text-slate-500">Compiler Labs Code:</span>
              <span className="font-bold text-emerald-600">5 Domain Solutions Saved</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Proctoring Status:</span>
              <span className="font-bold text-emerald-600">
                {activeSession.warningCount === 0 ? 'Clean (0 Infractions)' : `${activeSession.warningCount} Warning(s)`}
              </span>
            </div>
          </div>

          <button
            onClick={exitExam}
            className="w-full py-3 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl shadow-lg shadow-sky-100 transition flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            <span>Return to Student Portal</span>
          </button>
        </div>
      </div>
    );
  }

  const currentMcq = activeSession.mcqs[activeSession.currentQuestionIndex];

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans select-none">
      {/* Top Navbar */}
      <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-4">
          <img src={logo} alt="DV Logo" className="h-8 object-contain" />
          <div className="h-5 w-px bg-slate-200"></div>
          <div>
            <h1 className="text-sm font-bold text-slate-900">{activeSession.testTitle}</h1>
            <span className="text-[11px] text-slate-500">LMS ID: <strong className="text-slate-700">{activeSession.studentId}</strong></span>
          </div>
        </div>

        {/* Section Switcher Tabs & Timer */}
        <div className="flex items-center gap-4">
          {/* Main Section Switcher */}
          <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 border border-slate-200 text-xs font-semibold">
            {activeSession.mcqs && activeSession.mcqs.length > 0 && (
              <button
                onClick={() => setActiveSection('mcq')}
                className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                  activeSession.activeSection === 'mcq'
                    ? 'bg-white text-sky-700 shadow-xs border border-slate-200 font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>MCQ Assessment ({activeSession.mcqs.length} Qs)</span>
              </button>
            )}

            {activeSession.compilers && activeSession.compilers.length > 0 && (
              <button
                onClick={() => setActiveSection('compiler')}
                className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                  activeSession.activeSection === 'compiler'
                    ? 'bg-white text-sky-700 shadow-xs border border-slate-200 font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Code2 className="w-3.5 h-3.5" />
                <span>Compiler Assessment (5 Labs)</span>
                <span className="bg-amber-100 text-amber-800 text-[10px] px-1.5 py-0.5 rounded-full font-bold">LIVE</span>
              </button>
            )}
          </div>

          {/* Countdown Timer */}
          <div className="flex items-center gap-2 bg-slate-900 text-white px-3.5 py-1.5 rounded-xl font-mono text-xs font-bold shadow-xs">
            <Clock className="w-3.5 h-3.5 text-sky-400 animate-pulse" />
            <span>{formattedTime}</span>
          </div>
        </div>
      </header>

      {/* Anti-Cheat Guard Banner */}
      <AntiCheatGuard
        warningCount={activeSession.warningCount}
        requestFullscreen={requestFullscreen}
        isFullscreen={isFullscreen}
        proctorLogs={activeSession.proctorLogs}
        mediaStream={mediaStream}
        cameraStatus={cameraStatus}
        microphoneStatus={microphoneStatus}
        deviceErrorDetails={deviceErrorDetails}
        onRetryMediaDevices={retryMediaDevices}
      />

      {/* Main Workspace Layout */}
      <main className="flex-1 p-6 grid grid-cols-1 lg:grid-cols-4 gap-6 max-w-7xl mx-auto w-full">
        {/* Left 3 Columns: Active Section Content */}
        <div className="lg:col-span-3 flex flex-col h-full">
          {activeSession.activeSection === 'mcq' ? (
            <McqQuestionCard
              question={currentMcq}
              questionNumber={activeSession.currentQuestionIndex + 1}
              totalQuestions={activeSession.mcqs.length}
              selectedAnswer={activeSession.userAnswers[activeSession.currentQuestionIndex]}
              isMarkedForReview={activeSession.markedForReview[activeSession.currentQuestionIndex]}
              onSelectOption={(optIdx) => selectMcqAnswer(activeSession.currentQuestionIndex, optIdx)}
              onToggleReview={() => toggleMarkForReview(activeSession.currentQuestionIndex)}
              onNext={() => setCurrentQuestionIndex(Math.min(activeSession.mcqs.length - 1, activeSession.currentQuestionIndex + 1))}
              onPrev={() => setCurrentQuestionIndex(Math.max(0, activeSession.currentQuestionIndex - 1))}
            />
          ) : (
            /* Section 2: Hands-On Compiler Workspace */
            <div className="space-y-4 flex-1 flex flex-col">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Code2 className="w-4 h-4 text-sky-600" />
                    <span>Hands-On Compiler Challenge Workspace</span>
                  </h3>
                  <span className="bg-sky-50 text-sky-700 text-xs px-2.5 py-0.5 rounded-full font-bold border border-sky-200">
                    5 Specialized Domain Labs
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Select any domain compiler lab below to execute queries, algorithms, DAX formulas, SAS procedures, or Excel AI dynamic tables. All solutions are saved automatically.
                </p>
              </div>

              {/* Domain Compiler Selector Tabs */}
              <div className="grid grid-cols-5 gap-2 text-xs font-semibold">
                <button
                  onClick={() => setActiveCompilerDomain('python')}
                  className={`p-2.5 rounded-xl text-center border transition flex flex-col items-center gap-1 ${
                    activeCompilerDomain === 'python'
                      ? 'bg-slate-900 text-sky-300 border-sky-500 font-bold shadow-md ring-1 ring-sky-400'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <span className="text-[10px] font-mono bg-sky-950 px-1.5 py-0.5 rounded text-sky-400">LAB 1</span>
                  <span>Python 3.11</span>
                </button>

                <button
                  onClick={() => setActiveCompilerDomain('sql')}
                  className={`p-2.5 rounded-xl text-center border transition flex flex-col items-center gap-1 ${
                    activeCompilerDomain === 'sql'
                      ? 'bg-slate-900 text-cyan-300 border-cyan-500 font-bold shadow-md ring-1 ring-cyan-400'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <span className="text-[10px] font-mono bg-cyan-950 px-1.5 py-0.5 rounded text-cyan-400">LAB 2</span>
                  <span>SQL Playground</span>
                </button>

                <button
                  onClick={() => setActiveCompilerDomain('power_bi')}
                  className={`p-2.5 rounded-xl text-center border transition flex flex-col items-center gap-1 ${
                    activeCompilerDomain === 'power_bi'
                      ? 'bg-slate-900 text-amber-300 border-amber-500 font-bold shadow-md ring-1 ring-amber-400'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <span className="text-[10px] font-mono bg-amber-950 px-1.5 py-0.5 rounded text-amber-400">LAB 3</span>
                  <span>Power BI DAX</span>
                </button>

                <button
                  onClick={() => setActiveCompilerDomain('sas')}
                  className={`p-2.5 rounded-xl text-center border transition flex flex-col items-center gap-1 ${
                    activeCompilerDomain === 'sas'
                      ? 'bg-slate-900 text-purple-300 border-purple-500 font-bold shadow-md ring-1 ring-purple-400'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <span className="text-[10px] font-mono bg-purple-950 px-1.5 py-0.5 rounded text-purple-400">LAB 4</span>
                  <span>SAS Studio</span>
                </button>

                <button
                  onClick={() => setActiveCompilerDomain('excel_ai')}
                  className={`p-2.5 rounded-xl text-center border transition flex flex-col items-center gap-1 ${
                    activeCompilerDomain === 'excel_ai'
                      ? 'bg-emerald-900 text-white border-emerald-500 font-bold shadow-md ring-1 ring-emerald-400'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <span className="text-[10px] font-mono bg-emerald-950 px-1.5 py-0.5 rounded text-emerald-300">LAB 5</span>
                  <span>Excel AI Grid</span>
                </button>
              </div>

              {/* Active Compiler Lab Component */}
              <div className="flex-1 min-h-[440px]">
                {activeCompilerDomain === 'python' && (
                  <PythonCompiler
                    starterCode={activeSession.compilerCode['coding-py-1']}
                    onCodeChange={(code) => updateCompilerCode('coding-py-1', code)}
                  />
                )}
                {activeCompilerDomain === 'sql' && (
                  <SqlCompiler
                    starterCode={activeSession.compilerCode['coding-sql-1']}
                    onCodeChange={(code) => updateCompilerCode('coding-sql-1', code)}
                  />
                )}
                {activeCompilerDomain === 'power_bi' && (
                  <PowerBICompiler
                    starterCode={activeSession.compilerCode['coding-pb-1']}
                    onCodeChange={(code) => updateCompilerCode('coding-pb-1', code)}
                  />
                )}
                {activeCompilerDomain === 'sas' && (
                  <SasCompiler
                    starterCode={activeSession.compilerCode['coding-sas-1']}
                    onCodeChange={(code) => updateCompilerCode('coding-sas-1', code)}
                  />
                )}
                {activeCompilerDomain === 'excel_ai' && (
                  <ExcelAiCompiler
                    starterCode={activeSession.compilerCode['coding-excel-1']}
                    onCodeChange={(code) => updateCompilerCode('coding-excel-1', code)}
                  />
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right 1 Column: Navigation Side Panel */}
        <div className="lg:col-span-1">
          <QuestionNavPanel
            totalQuestions={activeSession.mcqs.length}
            currentIndex={activeSession.currentQuestionIndex}
            userAnswers={activeSession.userAnswers}
            markedForReview={activeSession.markedForReview}
            activeSection={activeSession.activeSection}
            activeCompilerDomain={activeCompilerDomain}
            onSelectQuestion={(idx) => {
              setActiveSection('mcq');
              setCurrentQuestionIndex(idx);
            }}
            onSelectCompiler={(domainId) => {
              setActiveSection('compiler');
              setActiveCompilerDomain(domainId);
            }}
            onSubmitTest={() => setConfirmSubmitOpen(true)}
          />
        </div>
      </main>

      {/* Confirmation Modal */}
      {confirmSubmitOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl text-center">
            <AlertCircle className="w-12 h-12 text-sky-600 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-900 mb-1">Submit Assessment?</h3>
            <p className="text-xs text-slate-500 mb-5">
              You have answered {Object.keys(activeSession.userAnswers).length} of 30 questions and saved 5 compiler lab solutions. Once submitted, you cannot re-enter the test.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmSubmitOpen(false)}
                className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl"
              >
                Continue Test
              </button>
              <button
                onClick={() => {
                  setConfirmSubmitOpen(false);
                  submitExam();
                }}
                className="flex-1 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl shadow-md"
              >
                Confirm Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
