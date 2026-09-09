import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { INITIAL_QUESTION_BANK, getRandomizedQuestions } from '../data/mockQuestionBank';
import { INITIAL_ASSESSMENTS } from '../data/mockAssessmentRepository';

import { queueExamRequest, flushExamRequests, pendingViolations, pendingDrafts, subscribeExamTransport } from '../utils/examTransport';

const ExamContext = createContext();

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
  const [scheduledTests, setScheduledTests] = useState(() => {
    const saved = localStorage.getItem('i_test_scheduled_tests');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.map(t => t.assessmentType === 'hybrid' ? { ...t, assessmentType: 'mcq' } : t);
      } catch (e) {
        // fallback
      }
    }
    return [
      {
        id: 'TEST-COMP-01',
        title: 'Hands-On Python & SQL Compiler Challenge (No MCQs)',
        domain: 'python',
        assessmentType: 'compiler', // 'compiler' | 'mcq'
        course: 'AIML',
        targetBatches: ['202601', '202101', '202102'],
        durationMinutes: 45,
        totalPoolSize: 100,
        servedMcqCount: 0,
        status: 'Active',
        scheduledFor: '2026-09-07 (Live)'
      },
      {
        id: 'TEST-PY-02',
        title: 'Python & Data Engineering MCQ Assessment',
        domain: 'python',
        assessmentType: 'mcq',
        course: 'FDE',
        targetBatches: ['202601', '202103'],
        durationMinutes: 45,
        totalPoolSize: 100,
        servedMcqCount: 30,
        status: 'Active',
        scheduledFor: '2026-09-07 (Live)'
      },
      {
        id: 'TEST-SQL-03',
        title: 'Advanced SQL Window Functions & Optimization MCQ Assessment',
        domain: 'sql',
        assessmentType: 'mcq',
        course: 'APIDA',
        targetBatches: ['202107', '202601'],
        durationMinutes: 30,
        totalPoolSize: 100,
        servedMcqCount: 30,
        status: 'Active',
        scheduledFor: '2026-09-07 (Live)'
      },
      {
        id: 'TEST-MULTI-04',
        title: 'Full Stack Data & Analytics Skills MCQ Assessment (9 Domains)',
        domain: 'excel_ai',
        assessmentType: 'mcq',
        course: 'All Courses',
        targetBatches: ['All Batches'],
        durationMinutes: 60,
        totalPoolSize: 100,
        servedMcqCount: 30,
        status: 'Active',
        scheduledFor: '2026-09-07 (Live)'
      }
    ];
  });

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
    localStorage.setItem('i_test_scheduled_tests', JSON.stringify(scheduledTests));
  }, [scheduledTests]);

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
    return () => { cancelled = true; unsubscribe(); clearInterval(timer); window.removeEventListener('online', restore); };
  }, []);

  const pendingCount = activeSession ? pendingViolations(activeSession.sessionId).length : 0;
  const assessmentLocked = !sessionReady || (activeSession?.warningCount || 0) + pendingCount >= 2;

  // Start Exam Session with Instant Activation & Server Sync
  const startExamSession = (testConfig, studentUser) => {
    const assessmentType = testConfig.assessmentType || 'compiler';
    const isCompilerOnly = assessmentType === 'compiler';
    const isMcqOnly = assessmentType === 'mcq';

    const servedMcqsCount = isCompilerOnly ? 0 : (testConfig.servedMcqCount || 30);
    const { mcqs, compilers } = getRandomizedQuestions(questionBank, servedMcqsCount);
    
    const initialCompilers = isMcqOnly ? [] : (compilers || []);
    const initialMcqs = isCompilerOnly ? [] : (mcqs || []);

    const sessionId = 'SESS-' + crypto.randomUUID();

    const newSession = {
      sessionId,
      testId: testConfig.id,
      testTitle: testConfig.title,
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

  const addScheduledTest = (testData) => {
    setScheduledTests(prev => [testData, ...prev]);
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
        addScheduledTest
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
