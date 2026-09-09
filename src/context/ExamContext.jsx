import React, { createContext, useContext, useState, useEffect } from 'react';
import { INITIAL_QUESTION_BANK, getRandomizedQuestions } from '../data/mockQuestionBank';
import { INITIAL_ASSESSMENTS } from '../data/mockAssessmentRepository';

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

  // Re-hydrate authoritative active session and submissions from backend on mount/refresh
  useEffect(() => {
    // 1. Sync submissions from backend
    fetch('/api/submissions')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.submissions && data.submissions.length > 0) {
          setSubmissions(prev => {
            const map = new Map();
            data.submissions.forEach(s => map.set(s.id, s));
            prev.forEach(s => {
              if (!map.has(s.id)) map.set(s.id, s);
            });
            return Array.from(map.values());
          });
        }
      })
      .catch(() => {});

    // 2. Sync authoritative activeSession if one is currently stored
    if (activeSession && activeSession.sessionId) {
      fetch(`/api/sessions/${activeSession.sessionId}`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.session) {
            console.log('[ExamContext] Authoritative session synced from server:', data.session.status);
            setActiveSession(data.session);
            localStorage.setItem('i_test_active_session', JSON.stringify(data.session));
          }
        })
        .catch(err => {
          console.warn('[ExamContext] Could not sync active session with backend:', err);
        });
    }
  }, []);

  // Start Exam Session with Instant Activation & Server Sync
  const startExamSession = (testConfig, studentUser) => {
    const assessmentType = testConfig.assessmentType || 'compiler';
    const isCompilerOnly = assessmentType === 'compiler';
    const isMcqOnly = assessmentType === 'mcq';

    const servedMcqsCount = isCompilerOnly ? 0 : (testConfig.servedMcqCount || 30);
    const { mcqs, compilers } = getRandomizedQuestions(questionBank, servedMcqsCount);
    
    const initialCompilers = isMcqOnly ? [] : (compilers || []);
    const initialMcqs = isCompilerOnly ? [] : (mcqs || []);

    const sessionId = `SESS-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;

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

    // 2. Sync to authoritative backend in the background
    fetch('/api/sessions/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        testConfig,
        studentUser,
        mcqs: initialMcqs,
        compilers: initialCompilers
      })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.session) {
          console.log('[ExamContext] Registered session with server:', data.session.sessionId);
          setActiveSession(prev => {
            if (!prev) return data.session;
            return {
              ...prev,
              sessionId: data.session.sessionId,
              userAnswers: { ...data.session.userAnswers, ...prev.userAnswers },
              compilerCode: { ...data.session.compilerCode, ...prev.compilerCode }
            };
          });
        }
      })
      .catch(err => {
        console.warn('[ExamContext] Backend start session registration deferred:', err);
      });

    return newSession;
  };

  const selectMcqAnswer = (questionId, optionIndex) => {
    if (!activeSession || activeSession.isFinished) return;
    setActiveSession(prev => ({
      ...prev,
      userAnswers: { ...prev.userAnswers, [questionId]: optionIndex }
    }));

    if (activeSession.sessionId) {
      fetch(`/api/sessions/${activeSession.sessionId}/answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId, optionIndex })
      }).catch(() => {});
    }
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

    if (activeSession.sessionId) {
      fetch(`/api/sessions/${activeSession.sessionId}/compiler`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ compilerId, code })
      }).catch(() => {});
    }
  };

  const setCurrentQuestionIndex = (index) => {
    if (!activeSession) return;
    setActiveSession(prev => ({ ...prev, currentQuestionIndex: index }));
  };

  const setActiveSection = (section) => {
    if (!activeSession) return;
    setActiveSession(prev => ({ ...prev, activeSection: section, currentQuestionIndex: 0 }));
  };

  const registerProctorViolation = async (reason, customCount) => {
    if (!activeSession || activeSession.isFinished) return;

    // Send violation to authoritative backend
    try {
      if (activeSession.sessionId) {
        const res = await fetch(`/api/sessions/${activeSession.sessionId}/violation`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reason })
        });
        const data = await res.json();

        if (data.success && data.session) {
          // Authoritative server state update
          setActiveSession(data.session);
          localStorage.setItem('i_test_active_session', JSON.stringify(data.session));

          if (data.isDisqualified && data.submission) {
            setSubmissions(prev => {
              const updated = [data.submission, ...prev.filter(s => s.id !== data.submission.id)];
              localStorage.setItem('i_test_submissions', JSON.stringify(updated));
              return updated;
            });
          }
          return;
        }
      }
    } catch (err) {
      console.warn('[ExamContext] Backend violation sync error, applying client fallback:', err);
    }

    // Client fallback enforcement
    const timestamp = new Date().toLocaleTimeString();
    const newWarningCount = customCount !== undefined ? customCount : (activeSession.warningCount + 1);

    let logType = 'WARNING';
    let message = `Warning ${newWarningCount}/2: ${reason}`;

    if (newWarningCount >= 2) {
      logType = 'CRITICAL';
      message = `Violation ${newWarningCount}/2: Second violation detected (${reason}). Test automatically submitted and terminated with score marked as DISQUALIFIED (CHEATING DETECTED).`;
    }

    const updatedLogs = [
      ...activeSession.proctorLogs,
      { timestamp, type: logType, message, warningNum: newWarningCount }
    ];

    if (newWarningCount >= 2) {
      const disqualifiedSubmission = {
        id: 'SUB-' + Math.floor(1000 + Math.random() * 9000),
        sessionId: activeSession.sessionId,
        studentId: activeSession.studentId,
        studentName: activeSession.studentName,
        testId: activeSession.testId,
        testTitle: activeSession.testTitle,
        submittedAt: new Date().toLocaleString(),
        score: '0 (Disqualified - 2 Violations)',
        compilerStatus: 'Terminated on Second Strike',
        cheatingStatus: 'DISQUALIFIED (CHEATING DETECTED - 2 STRIKES)',
        proctorLogs: updatedLogs,
        codeSubmitted: Object.values(activeSession.compilerCode || {}).join('\n\n---\n\n'),
        status: 'DISQUALIFIED (CHEATING DETECTED)'
      };

      setSubmissions(prev => {
        const next = [disqualifiedSubmission, ...prev.filter(s => s.id !== disqualifiedSubmission.id)];
        localStorage.setItem('i_test_submissions', JSON.stringify(next));
        return next;
      });

      const updatedSession = {
        ...activeSession,
        warningCount: newWarningCount,
        proctorLogs: updatedLogs,
        isFinished: true,
        isDisqualified: true,
        status: 'DISQUALIFIED',
        submissionReason: 'AUTO_SUBMITTED_CHEATING',
        disqualifiedReason: `Test Automatically Terminated: You triggered 2 anti-cheating violations (${reason}). As per exam policy, your assessment has been automatically submitted and recorded as DISQUALIFIED (CHEATING DETECTED). Further answering is disabled.`
      };

      setActiveSession(updatedSession);
      localStorage.setItem('i_test_active_session', JSON.stringify(updatedSession));
    } else {
      const updatedSession = {
        ...activeSession,
        warningCount: newWarningCount,
        proctorLogs: updatedLogs
      };

      setActiveSession(updatedSession);
      localStorage.setItem('i_test_active_session', JSON.stringify(updatedSession));
    }
  };

  const submitExam = async () => {
    if (!activeSession) return;

    // Never submit normally if the session is disqualified or terminated for cheating
    if (
      activeSession.isDisqualified ||
      activeSession.status === 'DISQUALIFIED' ||
      activeSession.disqualifiedReason ||
      (activeSession.warningCount && activeSession.warningCount >= 2)
    ) {
      console.warn('[ExamContext] Blocked normal submission because session is disqualified.');
      return;
    }

    try {
      if (activeSession.sessionId) {
        const res = await fetch(`/api/sessions/${activeSession.sessionId}/submit`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
        const data = await res.json();
        if (data.success && data.submission) {
          setSubmissions(prev => {
            const next = [data.submission, ...prev.filter(s => s.id !== data.submission.id)];
            localStorage.setItem('i_test_submissions', JSON.stringify(next));
            return next;
          });
          const finishedSession = { ...data.session, isFinished: true };
          setActiveSession(finishedSession);
          localStorage.setItem('i_test_active_session', JSON.stringify(finishedSession));
          return;
        }
      }
    } catch (err) {
      console.warn('[ExamContext] Backend submit failed, using client grading fallback:', err);
    }

    // Client grading fallback
    let scoreText = 'Compiler Assessment Submitted';
    if (activeSession.mcqs && activeSession.mcqs.length > 0) {
      let correctCount = 0;
      activeSession.mcqs.forEach(q => {
        if (activeSession.userAnswers[q.id] === q.correctAnswer) correctCount++;
      });
      const percent = Math.round((correctCount / activeSession.mcqs.length) * 100);
      scoreText = `${correctCount}/${activeSession.mcqs.length} (${percent}%)`;
    }

    const finalSubmission = {
      id: 'SUB-' + Math.floor(1000 + Math.random() * 9000),
      sessionId: activeSession.sessionId,
      studentId: activeSession.studentId,
      studentName: activeSession.studentName,
      testId: activeSession.testId,
      testTitle: activeSession.testTitle,
      submittedAt: new Date().toLocaleString(),
      score: scoreText,
      compilerStatus: activeSession.compilers && activeSession.compilers.length > 0 ? '5 Labs Saved' : 'N/A',
      cheatingStatus: activeSession.warningCount === 0 ? 'Clean (0 Warnings)' : `${activeSession.warningCount} Warning(s) Logged`,
      proctorLogs: activeSession.proctorLogs,
      codeSubmitted: Object.values(activeSession.compilerCode || {}).join('\n\n---\n\n'),
      status: 'SUBMITTED'
    };

    setSubmissions(prev => {
      const next = [finalSubmission, ...prev.filter(s => s.id !== finalSubmission.id)];
      localStorage.setItem('i_test_submissions', JSON.stringify(next));
      return next;
    });

    const finishedSession = { ...activeSession, isFinished: true };
    setActiveSession(finishedSession);
    localStorage.setItem('i_test_active_session', JSON.stringify(finishedSession));
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
