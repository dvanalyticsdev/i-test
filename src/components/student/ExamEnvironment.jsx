import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
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
import { 
  Clock, 
  CheckCircle2, 
  Code2, 
  FileText, 
  AlertCircle, 
  Database, 
  BarChart3, 
  Binary, 
  Terminal,
  Bookmark,
  Send
} from 'lucide-react';
import logo from '../../assets/DV-Logo.png';

const COMPILER_LAB_SPECS = {
  python: {
    id: 'python',
    key: 'coding-py-1',
    labNum: 'LAB 1',
    domain: 'Python 3.11',
    icon: Code2,
    badgeColor: 'sky',
    title: 'Enterprise Sales Revenue Aggregator & Deduplication',
    difficulty: 'Intermediate',
    score: '20 Pts',
    scenario: 'You are a data engineer at an e-commerce platform. During flash sales, high-concurrency order streams occasionally generate duplicate or negative transaction records.',
    instructions: [
      'Implement the function process_sales(transactions) to aggregate net sales revenue grouped by product item name.',
      'Input transactions is a list of dictionaries: [{"item": "Laptop", "price": 1200}, {"item": "Mouse", "price": 25}, ...].',
      'Ignore or filter out entries where price is 0 or negative.',
      'Return a summary dictionary mapping each item name to its total aggregated revenue sum.'
    ],
    sampleInput: `transactions = [
  {"item": "Laptop", "price": 1200},
  {"item": "Mouse", "price": 25},
  {"item": "Laptop", "price": 1200},
  {"item": "Keyboard", "price": 75}
]`,
    sampleOutput: `{"Laptop": 2400, "Mouse": 25, "Keyboard": 75}`,
    constraints: [
      'Time complexity should be O(N).',
      'Handle empty transaction lists cleanly, returning {}.',
      'Case-sensitive grouping for item keys.'
    ]
  },
  sql: {
    id: 'sql',
    key: 'coding-sql-1',
    labNum: 'LAB 2',
    domain: 'SQL / PostgreSQL',
    icon: Database,
    badgeColor: 'cyan',
    title: 'Department Salary Ranking & Window Aggregations',
    difficulty: 'Intermediate',
    score: '20 Pts',
    scenario: 'The HR Analytics department requires an authoritative payroll report ranking employees within their respective departments by total salary compensation.',
    instructions: [
      'Write a SELECT query querying the employees table.',
      'Compute salary_rank using DENSE_RANK() or RANK() OVER (PARTITION BY department ORDER BY salary DESC).',
      'Return columns: id, name, department, salary, and salary_rank ordered by department, salary_rank ASC.'
    ],
    sampleInput: `Table employees:
(id INT, name VARCHAR, department VARCHAR, salary NUMERIC)`,
    sampleOutput: `id  | name          | department    | salary | salary_rank
101 | Sarah Jenkins | Engineering   | 115000 | 1
104 | David Chen    | Engineering   | 98000  | 2
108 | Elena Rostova | Data Science  | 125000 | 1`,
    constraints: [
      'Partition strictly by department column.',
      'Rank 1 must correspond to highest salary within each department.',
      'Maintain exact output column aliases.'
    ]
  },
  power_bi: {
    id: 'power_bi',
    key: 'coding-pb-1',
    labNum: 'LAB 3',
    domain: 'Power BI DAX',
    icon: BarChart3,
    badgeColor: 'amber',
    title: 'Quarterly Year-over-Year (YoY) Revenue Growth Measure',
    difficulty: 'Advanced',
    score: '20 Pts',
    scenario: 'The executive financial dashboard requires a dynamic DAX calculated measure to evaluate quarterly YoY revenue growth against prior-year baselines.',
    instructions: [
      'Write a DAX measure computing YoY Growth %.',
      'Use DIVIDE() with error fallback 0 to compute: ([Total Revenue] - [PY Revenue]) / [PY Revenue].',
      'Format output as a percentage and bind to the quarterly sales visual canvas.'
    ],
    sampleInput: `Measures available: [Total Revenue], [PY Revenue]`,
    sampleOutput: `YoY Growth % = DIVIDE([Total Revenue] - [PY Revenue], [PY Revenue], 0)`,
    constraints: [
      'Must use DIVIDE() function to prevent divide-by-zero errors.',
      'Ensure compatibility with standard Power BI VertiPaq engine.'
    ]
  },
  sas: {
    id: 'sas',
    key: 'coding-sas-1',
    labNum: 'LAB 4',
    domain: 'SAS Studio',
    icon: Binary,
    badgeColor: 'purple',
    title: 'Regional Sales & Returns Summary Statistics (PROC MEANS)',
    difficulty: 'Intermediate',
    score: '20 Pts',
    scenario: 'The actuarial risk team requires descriptive summary statistics for regional wholesale transactions across continental markets.',
    instructions: [
      'Write a PROC MEANS procedure analyzing dataset WORK.SALES_SUMMARY.',
      'Calculate statistical moments: MEAN, STD, MIN, and MAX.',
      'Group by Region using the CLASS statement, analyzing variables Sales and Returns.',
      'Conclude procedure execution with RUN; statement.'
    ],
    sampleInput: `Dataset: WORK.SALES_SUMMARY
Variables: Region, Sales, Returns`,
    sampleOutput: `PROC MEANS DATA=WORK.SALES_SUMMARY MEAN STD MIN MAX;
  CLASS Region;
  VAR Sales Returns;
RUN;`,
    constraints: [
      'Standard SAS 9.4 syntax with semicolons terminating each statement.',
      'Include both Sales and Returns variables in VAR clause.'
    ]
  }
};

const SUPPORTED_COMPILER_DOMAINS = ['python', 'sql', 'sas', 'power_bi'];

export const ExamEnvironment = () => {
  const { user } = useAuth();
  const {
    activeSession,
    sessionReady,
    assessmentLocked,
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
  const [activeCompilerDomain, setActiveCompilerDomain] = useState('python');

  // Hook up Proctoring Guard with stable memoized handlers
  const handleViolation = useCallback((reason, eventId) => {
    registerProctorViolation(reason, eventId);
  }, [registerProctorViolation]);


  const { 
    isFullscreen, 
    requestFullscreen, 
    isMultiMonitorDetected,
    mediaStream, 
    cameraStatus, 
    microphoneStatus, 
    faceStatus,
    deviceErrorDetails, 
    markSubmitting,
    resumeProctoring,
    retryMediaDevices 
  } = useProctoring({
    onViolation: handleViolation,
    isExamActive: Boolean(activeSession && !activeSession.isFinished && sessionReady && !assessmentLocked),
    sessionId: activeSession?.sessionId,
  });

  // Timer countdown effect
  const [secondsLeft, setSecondsLeft] = useState(activeSession?.timeRemainingSeconds || 2700);
  const [displayExitCountdown, setDisplayExitCountdown] = useState(null);

  const submitRef = useRef(null);
  const submitOnce = async () => {
    markSubmitting();
    const ok = await submitExam();
    if (!ok) resumeProctoring();
    return ok;
  };
  submitRef.current = submitOnce;
  useEffect(() => {
    if (!activeSession || activeSession.isFinished || !sessionReady || assessmentLocked) return;
    let submitting = false;
    const deadline = new Date(activeSession.startedAt).getTime() + (activeSession.durationMinutes || 45) * 60000;
    const tick = () => {
      const remaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      setSecondsLeft(remaining);
      if (!remaining && !submitting) {
        submitting = true;
        submitRef.current().then(ok => { if (!ok) submitting = false; });
      }
    };
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [activeSession?.sessionId, activeSession?.isFinished, activeSession?.startedAt, activeSession?.durationMinutes, sessionReady, assessmentLocked]);

  useEffect(() => {
    if (!activeSession || activeSession.isFinished || !sessionReady || assessmentLocked || !isMultiMonitorDetected) {
      setDisplayExitCountdown(null);
      return;
    }

    setDisplayExitCountdown(10);
    const tick = setInterval(() => {
      setDisplayExitCountdown(prev => (prev === null ? null : Math.max(0, prev - 1)));
    }, 1000);
    const terminate = setTimeout(() => {
      const baseId = crypto.randomUUID();
      registerProctorViolation('Extended display / HDMI monitor detected during active assessment', `${baseId}-display`);
      setTimeout(() => {
        registerProctorViolation('Assessment terminated because extended display remained connected after 10 seconds', `${baseId}-terminate`);
      }, 250);
    }, 10000);

    return () => {
      clearInterval(tick);
      clearTimeout(terminate);
    };
  }, [activeSession?.sessionId, activeSession?.isFinished, sessionReady, assessmentLocked, isMultiMonitorDetected, registerProctorViolation]);

  if (!activeSession) return null;

  // Safe fallback accessors to prevent runtime undefined access errors
  const mcqs = activeSession.mcqs || [];
  const compilers = activeSession.compilers || [];
  const userAnswers = activeSession.userAnswers || {};
  const markedForReview = activeSession.markedForReview || {};
  const compilerCode = activeSession.compilerCode || {};
  const proctorLogs = activeSession.proctorLogs || [];
  const currentQuestionIndex = activeSession.currentQuestionIndex || 0;
  const currentMcq = mcqs[currentQuestionIndex] || null;
  const activeSection = activeSession.activeSection || (compilers.length > 0 && mcqs.length === 0 ? 'compiler' : 'mcq');

  // Compute allowed test domains for compiler isolation
  const testDomains = useMemo(() => {
    let raw = activeSession?.domains || (activeSession?.domain ? [activeSession.domain] : []);
    if (!raw || raw.length === 0) {
      if (activeSession?.application) raw = [activeSession.application];
      else if (activeSession?.applications) raw = Array.isArray(activeSession.applications) ? activeSession.applications : [activeSession.applications];
    }
    if (!raw || raw.length === 0) return SUPPORTED_COMPILER_DOMAINS;

    const mapped = [];
    raw.forEach(d => {
      if (!d) return;
      const lower = String(d).toLowerCase().trim();
      if (lower === 'all applications' || lower === 'all') {
        mapped.push(...SUPPORTED_COMPILER_DOMAINS);
      } else if (lower.includes('python')) mapped.push('python');
      else if (lower.includes('sql') || lower.includes('postgres')) mapped.push('sql');
      else if (lower.includes('power') || lower.includes('pbi') || lower.includes('bi')) mapped.push('power_bi');
      else if (lower.includes('sas')) mapped.push('sas');
      else mapped.push(lower);
    });

    const unique = Array.from(new Set(mapped)).filter(domain => SUPPORTED_COMPILER_DOMAINS.includes(domain));
    return unique.length > 0 ? unique : ['python'];
  }, [activeSession]);

  useEffect(() => {
    if (testDomains.length > 0 && !testDomains.includes(activeCompilerDomain)) {
      setActiveCompilerDomain(testDomains[0]);
    }
  }, [testDomains, activeCompilerDomain]);

  // Format Timer
  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const formattedTime = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  const currentCompilerLab = compilers.find(lab => lab.domain === activeCompilerDomain) || compilers[0] || null;
  const fallbackLabSpec = COMPILER_LAB_SPECS[activeCompilerDomain] || COMPILER_LAB_SPECS[testDomains[0]] || COMPILER_LAB_SPECS.python;
  const currentLabSpec = currentCompilerLab ? {
    ...fallbackLabSpec,
    title: currentCompilerLab.title || fallbackLabSpec.title,
    scenario: currentCompilerLab.datasetInfo || currentCompilerLab.setupContent || fallbackLabSpec.scenario,
    instructions: currentCompilerLab.description
      ? currentCompilerLab.description.split(/\r?\n/).map(item => item.trim()).filter(Boolean)
      : fallbackLabSpec.instructions,
    sampleInput: currentCompilerLab.setupFileName
      ? `Setup/Data File: ${currentCompilerLab.setupFileName}${currentCompilerLab.setupContent ? `\n\n${currentCompilerLab.setupContent}` : ''}`
      : fallbackLabSpec.sampleInput,
    sampleOutput: currentCompilerLab.expectedOutput || fallbackLabSpec.sampleOutput,
    constraints: currentCompilerLab.constraints || fallbackLabSpec.constraints
  } : fallbackLabSpec;

  // If disqualified or finished
  const isDisqualifiedSession = Boolean(
    activeSession.isDisqualified ||
    activeSession.status === 'DISQUALIFIED' ||
    activeSession.submissionReason === 'AUTO_SUBMITTED_CHEATING' ||
    activeSession.disqualifiedReason ||
    (activeSession.warningCount && activeSession.warningCount >= 2)
  );

  if (isDisqualifiedSession) {
    return (
      <DisqualifiedModal
        isOpen={true}
        session={activeSession}
        user={user}
        reason={activeSession.disqualifiedReason || 'Security proctoring policy exceeded maximum allowed warnings.'}
        onAcknowledge={exitExam}
        onReturnToDashboard={exitExam}
      />
    );
  }

  if (activeSession.isFinished) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl max-w-md w-full p-8 text-center shadow-2xl">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Assessment Completed</h2>
          <p className="text-slate-600 text-sm mb-6">
            Your assessment answers and compiler solutions have been submitted securely to the examination portal.
          </p>
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6 text-left text-xs text-slate-700 space-y-1.5">
            <p><strong>Candidate:</strong> {activeSession.studentName || user?.name}</p>
            <p><strong>Test:</strong> {activeSession.testTitle}</p>
            <p><strong>Total Submissions:</strong> {Object.keys(userAnswers).length} MCQs answered, {Object.keys(compilerCode).length} Compiler labs saved.</p>
            <p><strong>Status:</strong> <span className="text-emerald-700 font-bold font-mono">SUBMITTED_SECURE</span></p>
          </div>
          <button
            onClick={exitExam}
            className="w-full py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl shadow-md transition"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (assessmentLocked) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-8 text-center">
      <div><h2 className="text-xl font-bold">Synchronizing assessment</h2>
      <p>Your answers and security events are being saved. Answering resumes after the server confirms the session status.</p></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans select-none overflow-x-hidden">
      {/* Top Navbar */}
      <header className="bg-white border-b border-slate-200 px-4 sm:px-6 py-2.5 flex items-center justify-between shadow-xs shrink-0 z-20">
        <div className="flex items-center gap-3 sm:gap-4">
          <img src={logo} alt="DV Logo" className="h-7 sm:h-8 object-contain" />
          <div className="h-5 w-px bg-slate-200 hidden sm:block"></div>
          <div>
            <h1 className="text-xs sm:text-sm md:text-base font-bold text-slate-900 leading-tight">
              {activeSession.testTitle}
            </h1>
            <p className="text-[11px] sm:text-xs text-slate-600 flex items-center gap-2 mt-0.5">
              <span>Candidate: <strong className="text-slate-900 font-bold">{activeSession.studentName || user?.name}</strong></span>
              <span className="text-slate-400">•</span>
              <span>LMS ID: <strong className="text-sky-700 font-mono font-bold">{activeSession.studentId}</strong></span>
            </p>
          </div>
        </div>

        {/* Section Switcher Tabs & Countdown Timer */}
        <div className="flex items-center gap-3">
          {/* Main Section Switcher (Only if both sections exist) */}
          {mcqs.length > 0 && compilers.length > 0 && (
            <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 border border-slate-200 text-xs font-semibold">
              <button
                onClick={() => setActiveSection('mcq')}
                className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                  activeSection === 'mcq'
                    ? 'bg-white text-sky-700 shadow-xs border border-slate-200 font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>MCQ Assessment ({mcqs.length} Qs)</span>
              </button>

              <button
                onClick={() => setActiveSection('compiler')}
                className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                  activeSection === 'compiler'
                    ? 'bg-white text-sky-700 shadow-xs border border-slate-200 font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Code2 className="w-3.5 h-3.5" />
                <span>Compiler Assessment ({compilers.length} Labs)</span>
                <span className="bg-amber-100 text-amber-800 text-[10px] px-1.5 py-0.5 rounded-full font-bold">LIVE</span>
              </button>
            </div>
          )}

          {/* Section Indicator Badge for compiler-only tests */}
          {mcqs.length === 0 && (
            <div className="hidden sm:flex items-center gap-1.5 bg-sky-50 text-sky-800 border border-sky-200 px-3 py-1 rounded-xl text-xs font-semibold">
              <Code2 className="w-3.5 h-3.5 text-sky-600" />
              <span>{testDomains.length} Specialized Compiler Lab{testDomains.length > 1 ? 's' : ''}</span>
              <span className="bg-amber-100 text-amber-800 text-[10px] px-1.5 py-0.2 rounded font-mono font-bold">LIVE</span>
            </div>
          )}

          {/* Countdown Timer */}
          <div className="flex items-center gap-2 bg-slate-900 text-white px-3.5 py-1.5 rounded-xl font-mono text-xs font-bold shadow-xs">
            <Clock className="w-3.5 h-3.5 text-sky-400 animate-pulse" />
            <span>{formattedTime}</span>
          </div>
        </div>
      </header>

      {/* Anti-Cheat Guard Banner & Enforcer */}
      <AntiCheatGuard
        warningCount={activeSession.warningCount || 0}
        requestFullscreen={requestFullscreen}
        isFullscreen={isFullscreen}
        proctorLogs={proctorLogs}
        mediaStream={mediaStream}
        cameraStatus={cameraStatus}
        microphoneStatus={microphoneStatus}
        faceStatus={faceStatus}
        deviceErrorDetails={deviceErrorDetails}
        onRetryMediaDevices={retryMediaDevices}
        isMultiMonitorDetected={isMultiMonitorDetected}
      />

      {displayExitCountdown !== null && (
        <div className="fixed inset-0 bg-rose-950/90 z-[60] flex items-center justify-center p-4 text-center">
          <div className="bg-white rounded-2xl max-w-md w-full p-7 shadow-2xl border border-rose-200">
            <AlertCircle className="w-12 h-12 text-rose-600 mx-auto mb-3" />
            <h3 className="text-lg font-extrabold text-rose-900 mb-2">Extended Display Detected</h3>
            <p className="text-sm text-slate-700 leading-relaxed">
              HDMI, screen extension, or another display was detected. Disconnect it now.
              The assessment will be terminated in <strong>{displayExitCountdown}</strong> seconds if the display remains connected.
            </p>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. MCQ ASSESSMENT VIEW: EXACT BEFORE LAYOUT (3:1 Columns)                */}
      {/* ========================================================================= */}
      {activeSection === 'mcq' ? (
        <main className="flex-1 p-6 grid grid-cols-1 lg:grid-cols-4 gap-6 max-w-7xl mx-auto w-full">
          {/* Left 3 Columns: MCQ Question Card */}
          <div className="lg:col-span-3 flex flex-col h-full">
            {currentMcq && (
              <McqQuestionCard
                question={currentMcq}
                questionNumber={currentQuestionIndex + 1}
                totalQuestions={mcqs.length}
                selectedAnswer={userAnswers[currentQuestionIndex]}
                isMarkedForReview={markedForReview[currentQuestionIndex]}
                onSelectOption={(optIdx) => selectMcqAnswer(currentQuestionIndex, optIdx)}
                onToggleReview={() => toggleMarkForReview(currentQuestionIndex)}
                onNext={() => setCurrentQuestionIndex(Math.min(mcqs.length - 1, currentQuestionIndex + 1))}
                onPrev={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
              />
            )}
          </div>

          {/* Right 1 Column: Question Navigation Side Panel */}
          <div className="lg:col-span-1">
            <QuestionNavPanel
              totalQuestions={mcqs.length}
              currentIndex={currentQuestionIndex}
              userAnswers={userAnswers}
              markedForReview={markedForReview}
              activeSection={activeSection}
              activeCompilerDomain={activeCompilerDomain}
              compilerCode={compilerCode}
              onSelectQuestion={(idx) => {
                setActiveSection('mcq');
                setCurrentQuestionIndex(idx);
              }}
              onSelectCompiler={(domainId) => {
                setActiveSection('compiler');
                setActiveCompilerDomain(domainId);
              }}
              onSubmitTest={() => setConfirmSubmitOpen(true)}
              showCompilerSection={compilers.length > 0}
              allowedDomains={testDomains}
            />
          </div>
        </main>
      ) : (
        /* ========================================================================= */
        /* 2. HANDS-ON COMPILER ASSESSMENT VIEW: 50:50 SPLIT-SCREEN LAYOUT          */
        /* ========================================================================= */
        <main className="flex-1 w-full max-w-[1720px] mx-auto p-3 sm:p-4 md:p-5 grid grid-cols-1 lg:grid-cols-2 gap-5 min-h-0 lg:h-[calc(100vh-130px)] overflow-x-hidden">
          
          {/* LEFT 50%: Domain Tabs, Problem Statement, & Submit */}
          <div className="flex flex-col h-full lg:overflow-y-auto pr-0 lg:pr-2 space-y-4">
            
            {/* Domain Compiler Selector Tabs */}
            <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between mb-2 px-1">
                <span className="text-[11px] font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Code2 className="w-3.5 h-3.5 text-slate-900" />
                  <span>Select Specialized Compiler Lab:</span>
                </span>
                <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-mono font-semibold border border-slate-200">
                  {testDomains.length} {testDomains.length === 1 ? 'Lab' : 'Labs'} Available
                </span>
              </div>

              <div className="flex flex-wrap gap-1.5 text-xs font-medium">
                {testDomains.map((domKey, idx) => {
                  const spec = COMPILER_LAB_SPECS[domKey] || COMPILER_LAB_SPECS.python;
                  const isSaved = compilerCode[spec.key] && compilerCode[spec.key].trim().length > 0;
                  const isActive = activeCompilerDomain === domKey;

                  return (
                    <button
                      key={domKey}
                      onClick={() => {
                        setActiveSection('compiler');
                        setActiveCompilerDomain(domKey);
                      }}
                      className={`flex-1 min-w-[110px] py-2 px-2 rounded-lg text-center transition flex flex-col items-center gap-1 cursor-pointer ${
                        isActive
                          ? 'bg-white border-2 border-slate-900 shadow-xs ring-1 ring-slate-900/5'
                          : 'bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50/80 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-center gap-1">
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-900 font-bold border border-slate-200">
                          LAB {idx + 1}
                        </span>
                        {isSaved && (
                          <span className="text-[10px] text-emerald-600 font-bold" title="Code solution saved">✓</span>
                        )}
                      </div>
                      <span className="truncate w-full text-[11px] text-slate-900 font-bold">{spec.domain || domKey}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Hands-On Challenge Problem Statement & Specification Card */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
              {/* Challenge Title Header */}
              <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-mono font-bold bg-sky-100 text-sky-800 px-2 py-0.5 rounded">
                      {currentLabSpec.labNum} • {currentLabSpec.domain}
                    </span>
                    <span className="text-[10px] font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                      {currentLabSpec.difficulty}
                    </span>
                  </div>
                  <h2 className="text-base font-bold text-slate-900 leading-snug">
                    {currentLabSpec.title}
                  </h2>
                </div>
                <span className="text-xs font-bold text-sky-700 bg-sky-50 border border-sky-200 px-2.5 py-1 rounded-lg">
                  {currentLabSpec.score}
                </span>
              </div>

              {/* Scenario Context */}
              <div className="bg-slate-50 border-l-4 border-sky-600 p-3 rounded-r-lg text-xs text-slate-700 leading-relaxed">
                <span className="font-bold text-slate-900 block mb-0.5">Problem Scenario:</span>
                {currentLabSpec.scenario}
              </div>

              {/* Requirements & Instructions */}
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Bookmark className="w-3.5 h-3.5 text-sky-600" />
                  <span>Task Instructions & Requirements:</span>
                </h3>
                <ul className="space-y-1.5 text-xs text-slate-600 list-disc list-inside leading-relaxed pl-1">
                  {currentLabSpec.instructions.map((item, idx) => (
                    <li key={idx} className="marker:text-sky-600">
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Sample Input / Expected Output */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-slate-500" />
                  <span>Input & Expected Output Specification:</span>
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs font-mono">
                  <div className="bg-slate-900 text-slate-200 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-[10px] uppercase font-sans font-bold text-slate-400 block mb-1">Input / Baseline:</span>
                    <pre className="text-[11px] whitespace-pre-wrap leading-tight text-sky-300 overflow-x-auto">
                      {currentLabSpec.sampleInput}
                    </pre>
                  </div>
                  <div className="bg-slate-900 text-slate-200 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-[10px] uppercase font-sans font-bold text-slate-400 block mb-1">Expected Output:</span>
                    <pre className="text-[11px] whitespace-pre-wrap leading-tight text-emerald-300 overflow-x-auto">
                      {currentLabSpec.sampleOutput}
                    </pre>
                  </div>
                </div>
              </div>

              {/* Constraints */}
              <div className="pt-2 border-t border-slate-100">
                <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Technical Constraints:
                </h4>
                <div className="flex flex-wrap gap-1.5 text-[11px] text-slate-600">
                  {currentLabSpec.constraints.map((c, idx) => (
                    <span key={idx} className="bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md">
                      • {c}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Clean Final Exam Submit Button */}
            <div className="pt-2 pb-4">
              <button
                onClick={() => setConfirmSubmitOpen(true)}
                className="w-full py-3 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2 shadow-sky-100 active:scale-[0.99]"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Final Exam Submit</span>
              </button>
            </div>
          </div>

          {/* RIGHT 50%: Selected Compiler Lab, Action Bar, & Output */}
          <div className="flex flex-col h-full lg:overflow-y-auto pl-0 lg:pl-1 space-y-4">
            <div className="h-full min-h-[560px] flex flex-col">
              {activeCompilerDomain === 'python' && (
                <PythonCompiler
                  starterCode={compilerCode[currentCompilerLab?.id || 'coding-py-1'] || currentCompilerLab?.starterCode || ''}
                  expectedAnswer={currentCompilerLab?.solutionCode}
                  onCodeChange={(code) => updateCompilerCode(currentCompilerLab?.id || 'coding-py-1', code)}
                  onSaveCode={(code) => updateCompilerCode(currentCompilerLab?.id || 'coding-py-1', code)}
                />
              )}
              {activeCompilerDomain === 'sql' && (
                <SqlCompiler
                  starterCode={compilerCode[currentCompilerLab?.id || 'coding-sql-1'] || currentCompilerLab?.starterCode || ''}
                  expectedAnswer={currentCompilerLab?.solutionCode}
                  onCodeChange={(code) => updateCompilerCode(currentCompilerLab?.id || 'coding-sql-1', code)}
                  onSaveCode={(code) => updateCompilerCode(currentCompilerLab?.id || 'coding-sql-1', code)}
                />
              )}
              {activeCompilerDomain === 'power_bi' && (
                <PowerBICompiler
                  starterCode={compilerCode[currentCompilerLab?.id || 'coding-pb-1'] || currentCompilerLab?.starterCode || ''}
                  expectedAnswer={currentCompilerLab?.solutionCode}
                  onCodeChange={(code) => updateCompilerCode(currentCompilerLab?.id || 'coding-pb-1', code)}
                  onSaveCode={(code) => updateCompilerCode(currentCompilerLab?.id || 'coding-pb-1', code)}
                />
              )}
              {activeCompilerDomain === 'sas' && (
                <SasCompiler
                  starterCode={compilerCode[currentCompilerLab?.id || 'coding-sas-1'] || currentCompilerLab?.starterCode || ''}
                  expectedAnswer={currentCompilerLab?.solutionCode}
                  onCodeChange={(code) => updateCompilerCode(currentCompilerLab?.id || 'coding-sas-1', code)}
                  onSaveCode={(code) => updateCompilerCode(currentCompilerLab?.id || 'coding-sas-1', code)}
                />
              )}
            </div>
          </div>

        </main>
      )}

      {/* Confirmation Modal */}
      {confirmSubmitOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl text-center">
            <AlertCircle className="w-12 h-12 text-sky-600 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-900 mb-1">Submit Assessment?</h3>
            <p className="text-xs text-slate-500 mb-5">
              You have answered {Object.keys(userAnswers).length} of {mcqs.length || 30} questions and saved {Object.keys(compilerCode).length} compiler lab solutions. Once submitted, you cannot re-enter the test.
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
                  submitOnce();
                }}
                className="flex-1 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl shadow-md"
              >
                Confirm & Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
