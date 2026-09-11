import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { INITIAL_QUESTION_BANK, getRandomizedQuestions } from '../data/mockQuestionBank';
import { INITIAL_ASSESSMENTS } from '../data/mockAssessmentRepository';

import { queueExamRequest, flushExamRequests, pendingViolations, pendingDrafts, subscribeExamTransport } from '../utils/examTransport';

const ExamContext = createContext();
const SUPPORTED_COMPILER_DOMAINS = ['python', 'sql', 'sas', 'power_bi'];

const DEFAULT_COMPILER_LABS = {
  python: {
    id: 'coding-py-1',
    domain: 'python',
    type: 'compiler',
    title: 'Python Coding Task: Data Cleaning & Aggregation',
    starterCode: `def process_sales(transactions):
    # Return total positive revenue grouped by item.
    result = {}
    return result`
  },
  sql: {
    id: 'coding-sql-1',
    domain: 'sql',
    type: 'compiler',
    title: 'SQL Challenge: Department Salary Ranking',
    starterCode: `SELECT
    id,
    name,
    department,
    salary,
    DENSE_RANK() OVER (PARTITION BY department ORDER BY salary DESC) AS salary_rank
FROM employees
ORDER BY department, salary_rank;`
  },
  sas: {
    id: 'coding-sas-1',
    domain: 'sas',
    type: 'compiler',
    title: 'SAS Challenge: PROC MEANS Summary Statistics',
    starterCode: `PROC MEANS DATA=WORK.SALES_SUMMARY MEAN STD MIN MAX;
  CLASS Region;
  VAR Sales Returns;
RUN;`
  },
  power_bi: {
    id: 'coding-pb-1',
    domain: 'power_bi',
    type: 'compiler',
    title: 'Power BI DAX Challenge: YoY Revenue Growth',
    starterCode: `YoY Growth % =
DIVIDE(
    [Total Revenue] - [PY Revenue],
    [PY Revenue],
    0
)`
  }
};

function normalizeCompilerDomains(testConfig = {}) {
  const rawDomains = testConfig.domains || (testConfig.domain ? [testConfig.domain] : []);
  const mapped = rawDomains.flatMap(domain => {
    const value = String(domain || '').toLowerCase().trim();
    if (!value) return [];
    if (value === 'all applications' || value === 'all') return SUPPORTED_COMPILER_DOMAINS;
    if (value.includes('python')) return ['python'];
    if (value.includes('sql') || value.includes('postgres')) return ['sql'];
    if (value.includes('sas')) return ['sas'];
    if (value.includes('power') || value.includes('pbi')) return ['power_bi'];
    return SUPPORTED_COMPILER_DOMAINS.includes(value) ? [value] : [];
  });

  const unique = Array.from(new Set(mapped));
  return unique.length > 0 ? [unique[0]] : ['python'];
}

function buildCompilerLabs(testConfig = {}, questionBank = []) {
  const selectedDomains = normalizeCompilerDomains(testConfig);
  const uploadedLabs = questionBank.filter(q => q.type === 'compiler' && selectedDomains.includes(q.domain));
  const uploadedByDomain = new Map(uploadedLabs.map(lab => [lab.domain, lab]));
  return selectedDomains.map(domain => uploadedByDomain.get(domain) || DEFAULT_COMPILER_LABS[domain]).filter(Boolean);
}

function normalizeEmbeddedMcqs(questions = []) {
  return questions
    .filter(q => q && (q.question || q.questionText || q.title))
    .map((q, index) => ({
      ...q,
      id: q.id || `scheduled-mcq-${index + 1}`,
      type: 'mcq',
      question: q.question || q.questionText || q.title,
      options: Array.isArray(q.options) ? q.options : [q.optionA, q.optionB, q.optionC, q.optionD].filter(Boolean),
      correctAnswer: q.correctAnswer ?? q.answer ?? 0,
      explanation: q.explanation || ''
    }))
    .filter(q => q.question && q.options.length >= 2);
}

export const ExamProvider = ({ children }) => {
  // Assessments Repository (File/Document based assessment files)
  const [assessments, setAssessments] = useState(() => {
    try {
      const saved = localStorage.getItem('i_test_assessments_repo');
      return saved ? JSON.parse(saved) : INITIAL_ASSESSMENTS;
    } catch (e) {
      return INITIAL_ASSESSMENTS;
    }
  });

  // Master Question Bank
  const [questionBank, setQuestionBank] = useState(() => {
    try {
      const saved = localStorage.getItem('i_test_question_bank');
      return saved ? JSON.parse(saved) : INITIAL_QUESTION_BANK;
    } catch (e) {
      return INITIAL_QUESTION_BANK;
    }
  });

  // Scheduled Tests list (Admin manageable with type, course, and targetBatches)
  const [scheduledTests, setScheduledTests] = useState([]);

  // Admin Submissions Repository
  const [submissions, setSubmissions] = useState(() => {
    try {
      const saved = localStorage.getItem('i_test_submissions');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  // Active Exam Session State with localStorage persistence across refresh
  const [activeSession, setActiveSession] = useState(() => {
    try {
      const saved = localStorage.getItem('i_test_active_session');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  useEffect(() => {
    if (activeSession) {
      localStorage.setItem('i_test_active_session', JSON.stringify(activeSession));
    } else {
      localStorage.removeItem('i_test_active_session');
    }
  }, [activeSession]);

  useEffect(() => {
    localStorage.setItem('i_test_assessments_repo', JSON.stringify(assessments));
  }, [assessments]);

  useEffect(() => {
    localStorage.setItem('i_test_question_bank', JSON.stringify(questionBank));
  }, [questionBank]);

  useEffect(() => {
    localStorage.setItem('i_test_submissions', JSON.stringify(submissions));
  }, [submissions]);

  const activeSessionRef = useRef(activeSession);
  activeSessionRef.current = activeSession;
  const [sessionReady, setSessionReady] = useState(!activeSession);
  const [, setTransportVersion] = useState(0);
  const submittingRef = useRef(false);

  const mergeServerSession = (session) => {
    setActiveSession(prev => {
      if (!prev || prev.sessionId !== session.sessionId) return prev;
      if ((prev.isFinished && !session.isFinished) || (prev.warningCount || 0) > (session.warningCount || 0)) return prev;
      if ((session.revision || 0) < (prev.revision || 0)) return prev;
      const drafts = pendingDrafts(session.sessionId);
      return { ...prev, ...session,
        userAnswers: { ...session.userAnswers, ...drafts.userAnswers },
        compilerCode: { ...session.compilerCode, ...drafts.compilerCode },
        currentQuestionIndex: prev.currentQuestionIndex,
        activeSection: prev.activeSection,
        markedForReview: prev.markedForReview
      };
    });
  };

  useEffect(() => {
    let cancelled = false;
    localStorage.removeItem('i_test_scheduled_tests');
    const loadScheduledTests = async () => {
      try {
        const res = await fetch('/api/scheduled-tests', { cache: 'no-store' });
        const data = await res.json();
        if (!cancelled && data.success) setScheduledTests(data.tests || []);
      } catch (e) {
        if (!cancelled) setScheduledTests([]);
      }
    };
    loadScheduledTests();
    const scheduledTestsTimer = setInterval(loadScheduledTests, 15000);
    window.addEventListener('focus', loadScheduledTests);
    fetch('/api/submissions').then(res => res.json()).then(data => {
      if (!cancelled && data.success) setSubmissions(data.submissions || []);
    }).catch(() => {});
    const unsubscribe = subscribeExamTransport((entry, data) => {
      if (cancelled) return;
      setTransportVersion(v => v + 1);
      if (data?.session) mergeServerSession(data.session);
      else if (data?.revision !== undefined) setActiveSession(prev => prev?.sessionId === entry.sessionId ? { ...prev, revision: Math.max(prev.revision || 0, data.revision) } : prev);
      if (data?.submission) setSubmissions(prev => [data.submission, ...prev.filter(s => s.sessionId !== data.submission.sessionId)]);
    });
    const restore = async () => {
      const delivered = await flushExamRequests();
      if (cancelled) return;
      const session = activeSessionRef.current;
      if (!session) return;
      try {
        const res = await fetch('/api/sessions/' + session.sessionId);
        const data = await res.json();
        if (cancelled || activeSessionRef.current?.sessionId !== session.sessionId) return;
        if (res.ok && data.success) {
          mergeServerSession(data.session);
          setSessionReady(delivered);
        }
      } catch { /* Keep restored sessions locked until reconciliation succeeds. */ }
    };
    restore();
    const timer = setInterval(restore, 5000);
    window.addEventListener('online', restore);
    return () => {
      cancelled = true;
      unsubscribe();
      clearInterval(timer);
      clearInterval(scheduledTestsTimer);
      window.removeEventListener('online', restore);
      window.removeEventListener('focus', loadScheduledTests);
    };
  }, []);

  const pendingCount = activeSession ? pendingViolations(activeSession.sessionId).length : 0;
  const assessmentLocked = !sessionReady || (activeSession?.warningCount || 0) + pendingCount >= 2;

  // Start Exam Session with Instant Activation & Server Sync
  const startExamSession = (testConfig, studentUser) => {
    const assessmentType = testConfig.assessmentType || 'compiler';
    const isCompilerOnly = assessmentType === 'compiler';
    const isMcqOnly = assessmentType === 'mcq';

    const embeddedMcqs = normalizeEmbeddedMcqs(testConfig.mcqQuestions || testConfig.questions || []);
    const servedMcqsCount = isCompilerOnly ? 0 : (testConfig.servedMcqCount || embeddedMcqs.length || 30);
    const { mcqs } = embeddedMcqs.length > 0
      ? { mcqs: embeddedMcqs.slice(0, servedMcqsCount) }
      : getRandomizedQuestions(questionBank, servedMcqsCount);
    
    const testDomains = testConfig.domains || (testConfig.domain ? [testConfig.domain] : []);
    const sessionDomains = isMcqOnly ? testDomains.slice(0, 1) : normalizeCompilerDomains(testConfig);
    const initialCompilers = isMcqOnly ? [] : buildCompilerLabs({ ...testConfig, domains: sessionDomains }, questionBank);
    const initialMcqs = isCompilerOnly ? [] : (mcqs || []);

    const sessionId = 'SESS-' + crypto.randomUUID();

    const newSession = {
      sessionId,
      testId: testConfig.id,
      testTitle: testConfig.title,
      domains: sessionDomains,
      domain: sessionDomains[0] || testConfig.domain,
      course: testConfig.course,
      courses: testConfig.courses,
      targetBatches: testConfig.targetBatches,
      application: testConfig.application,
      applications: sessionDomains,
      assessmentType: assessmentType,
      studentId: studentUser.lmsId || studentUser.id,
      studentName: studentUser.name,
      mcqs: initialMcqs,
      compilers: initialCompilers,
      userAnswers: {},
      markedForReview: {},
      compilerCode: {},
      currentQuestionIndex: 0,
      activeSection: isCompilerOnly ? 'compiler' : 'mcq',
      timeRemainingSeconds: (testConfig.durationMinutes || 45) * 60,
      warningCount: 0,
      proctorLogs: [
        {
          timestamp: new Date().toLocaleTimeString(),
          type: 'INFO',
          message: `Exam session started (${assessmentType.toUpperCase()}). Anti-cheat guard active (Max 2 warnings).`
        }
      ],
      isFinished: false,
      disqualifiedReason: null,
      startedAt: new Date().toISOString()
    };

    initialCompilers.forEach(comp => {
      newSession.compilerCode[comp.id] = comp.starterCode || '';
    });

    // 1. Immediately activate session in state & localStorage with ZERO network delay
    setActiveSession(newSession);
    localStorage.setItem('i_test_active_session', JSON.stringify(newSession));

    setSessionReady(false);
    queueExamRequest(sessionId, 'start', { sessionId, testConfig, studentUser, mcqs: initialMcqs, compilers: initialCompilers })
      .then(ok => { if (activeSessionRef.current?.sessionId === sessionId) setSessionReady(ok); });

    return newSession;
  };

  const selectMcqAnswer = (questionId, optionIndex) => {
    if (!activeSession || activeSession.isFinished) return;
    setActiveSession(prev => ({
      ...prev,
      userAnswers: { ...prev.userAnswers, [questionId]: optionIndex }
    }));

    queueExamRequest(activeSession.sessionId, 'answer', { questionId, optionIndex });
  };

  const toggleMarkForReview = (questionId) => {
    if (!activeSession || activeSession.isFinished) return;
    setActiveSession(prev => ({
      ...prev,
      markedForReview: { ...prev.markedForReview, [questionId]: !prev.markedForReview[questionId] }
    }));
  };

  const updateCompilerCode = (compilerId, code) => {
    if (!activeSession || activeSession.isFinished) return;
    setActiveSession(prev => ({
      ...prev,
      compilerCode: { ...prev.compilerCode, [compilerId]: code }
    }));

    return queueExamRequest(activeSession.sessionId, 'compiler', { compilerId, code });
  };

  const setCurrentQuestionIndex = (index) => {
    if (!activeSession) return;
    setActiveSession(prev => ({ ...prev, currentQuestionIndex: index }));
  };

  const setActiveSection = (section) => {
    if (!activeSession) return;
    setActiveSession(prev => ({ ...prev, activeSection: section, currentQuestionIndex: 0 }));
  };

  const registerProctorViolation = (reason, eventId) => {
    const session = activeSessionRef.current;
    if (!session || session.isFinished) return;
    return queueExamRequest(session.sessionId, 'violation', { reason, eventId });
  };

  const submitExam = async () => {
    const session = activeSessionRef.current;
    if (!session || session.isFinished || submittingRef.current || (session.warningCount || 0) + pendingViolations(session.sessionId).length >= 2) return false;
    submittingRef.current = true;
    try { return await queueExamRequest(session.sessionId, 'submit'); }
    finally { submittingRef.current = false; }
  };

  const exitExam = () => {
    localStorage.removeItem('i_test_active_session');
    setActiveSession(null);
  };

  const bulkUploadQuestions = (newList) => {
    setQuestionBank(prev => [...newList, ...prev]);
  };

  const persistScheduledTest = async (testData) => {
    const res = await fetch('/api/scheduled-tests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testData)
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error || 'Failed to save scheduled test');
    return data.test || testData;
  };

  const addScheduledTest = async (testData) => {
    const optimisticTest = { ...testData, createdAt: testData.createdAt || new Date().toISOString() };
    setScheduledTests(prev => [optimisticTest, ...prev.filter(test => test.id !== optimisticTest.id)]);
    try {
      const savedTest = await persistScheduledTest(optimisticTest);
      setScheduledTests(prev => [savedTest, ...prev.filter(test => test.id !== savedTest.id)]);
    } catch (e) {
      console.warn('[ExamContext] Failed to save scheduled test on server:', e);
    }
  };

  const deleteScheduledTest = async (testId) => {
    localStorage.removeItem('i_test_scheduled_tests');
    setScheduledTests(prev => prev.filter(test => test.id !== testId));
    try {
      const res = await fetch(`/api/scheduled-tests/${encodeURIComponent(testId)}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to delete scheduled test');
      setScheduledTests(prev => prev.filter(test => test.id !== testId));
    } catch (e) {
      console.warn('[ExamContext] Failed to delete scheduled test on server:', e);
      try {
        const res = await fetch('/api/scheduled-tests', { cache: 'no-store' });
        const data = await res.json();
        if (data.success) setScheduledTests(data.tests || []);
      } catch {
        // Keep the optimistic removal visible until the next successful refresh.
      }
    }
  };

  const addAssessment = (newAssessment) => {
    setAssessments(prev => [newAssessment, ...prev]);
    // Also inject its questions into the question pool if applicable
    if (newAssessment.questions && newAssessment.questions.length > 0) {
      setQuestionBank(prev => [...newAssessment.questions, ...prev]);
    }
  };

  const deleteAssessment = (assessmentId) => {
    setAssessments(prev => prev.filter(a => a.id !== assessmentId));
  };

  const updateAssessment = (assessmentId, updatedFields) => {
    setAssessments(prev => prev.map(a => a.id === assessmentId ? { ...a, ...updatedFields } : a));
  };

  const getAssessmentById = (assessmentId) => {
    return assessments.find(a => a.id === assessmentId);
  };

  const deleteSubmission = async (submissionId) => {
    setSubmissions(prev => prev.filter(s => s.id !== submissionId && s.sessionId !== submissionId));
    try {
      await fetch(`/api/submissions/${encodeURIComponent(submissionId)}`, { method: 'DELETE' });
    } catch (e) {
      console.warn('[ExamContext] Failed to delete submission on server:', e);
    }
  };

  const deleteSubmissions = async (submissionIds) => {
    if (!Array.isArray(submissionIds) || submissionIds.length === 0) return;
    const idSet = new Set(submissionIds);
    setSubmissions(prev => prev.filter(s => !idSet.has(s.id) && !idSet.has(s.sessionId)));
    try {
      await fetch('/api/submissions/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: submissionIds })
      });
    } catch (e) {
      console.warn('[ExamContext] Failed to bulk delete submissions on server:', e);
    }
  };

  return (
    <ExamContext.Provider
      value={{
        assessments,
        addAssessment,
        deleteAssessment,
        updateAssessment,
        getAssessmentById,
        questionBank,
        scheduledTests,
        submissions,
        deleteSubmission,
        deleteSubmissions,
        activeSession,
        sessionReady,
        assessmentLocked,
        startExamSession,
        selectMcqAnswer,
        toggleMarkForReview,
        updateCompilerCode,
        setCurrentQuestionIndex,
        setActiveSection,
        registerProctorViolation,
        submitExam,
        exitExam,
        bulkUploadQuestions,
        addScheduledTest,
        deleteScheduledTest
      }}
    >
      {children}
    </ExamContext.Provider>
  );
};

export const useExam = () => {
  const context = useContext(ExamContext);
  if (!context) throw new Error('useExam must be used within an ExamProvider');
  return context;
};
