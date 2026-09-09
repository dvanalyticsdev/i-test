import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE = path.join(__dirname, 'proctor_db.json');

// Initialize DB file if not present
function initDb() {
  if (!fs.existsSync(DB_FILE)) {
    const initialData = {
      sessions: {},
      submissions: []
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
  }
}

function readDb() {
  initDb();
  try {
    const content = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(content);
  } catch (err) {
    console.error('[Proctor Backend] Error reading DB:', err);
    return { sessions: {}, submissions: [] };
  }
}

function writeDb(data) {
  try {
    const tempFile = `${DB_FILE}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tempFile, DB_FILE);
  } catch (err) {
    console.error('[Proctor Backend] Error writing DB:', err);
  }
}

// Helper to parse JSON request body from stream
function parseJsonBody(req) {
  return new Promise((resolve) => {
    if (req.body && typeof req.body === 'object') {
      return resolve(req.body);
    }
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        resolve({});
      }
    });
    req.on('error', () => {
      resolve({});
    });
  });
}

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  });
  res.end(JSON.stringify(data));
}

export function proctorApiMiddleware(req, res, next) {
  const url = req.url || '';

  // Only handle /api/ routes
  if (!url.startsWith('/api/')) {
    return next();
  }

  // Handle CORS Preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
    return res.end();
  }

  // Handle API Endpoints
  handleApiRoute(req, res).catch((err) => {
    console.error('[Proctor Backend] Route error:', err);
    sendJson(res, 500, { success: false, error: err.message });
  });
}

async function handleApiRoute(req, res) {
  const url = req.url || '';
  const method = req.method;
  const db = readDb();

  // 1. Health check
  if (url === '/api/health' && method === 'GET') {
    return sendJson(res, 200, { status: 'healthy', timestamp: new Date().toISOString() });
  }

  // 2. Start new session: POST /api/sessions/start
  if (url === '/api/sessions/start' && method === 'POST') {
    const body = await parseJsonBody(req);
    const { testConfig, studentUser, mcqs, compilers } = body;

    if (!testConfig || !studentUser) {
      return sendJson(res, 400, { success: false, error: 'testConfig and studentUser required' });
    }

    const sessionId = `SESS-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
    const assessmentType = testConfig.assessmentType || 'compiler';

    const newSession = {
      sessionId,
      testId: testConfig.id,
      testTitle: testConfig.title,
      assessmentType,
      studentId: studentUser.lmsId || studentUser.id,
      studentName: studentUser.name,
      status: 'ACTIVE',
      warningCount: 0,
      startedAt: new Date().toISOString(),
      durationMinutes: testConfig.durationMinutes || 45,
      timeRemainingSeconds: (testConfig.durationMinutes || 45) * 60,
      proctorLogs: [
        {
          timestamp: new Date().toLocaleTimeString(),
          type: 'INFO',
          message: `Exam session initialized on server (${assessmentType.toUpperCase()}). Proctor enforcement active (Maximum 2 strikes).`
        }
      ],
      userAnswers: {},
      compilerCode: {},
      markedForReview: {},
      currentQuestionIndex: 0,
      activeSection: assessmentType === 'compiler' ? 'compiler' : 'mcq',
      mcqs: mcqs || [],
      compilers: compilers || [],
      isFinished: false,
      disqualifiedReason: null,
      lastViolationAt: 0
    };

    if (compilers && Array.isArray(compilers)) {
      compilers.forEach((c) => {
        newSession.compilerCode[c.id] = c.starterCode || '';
      });
    }

    db.sessions[sessionId] = newSession;
    writeDb(db);

    return sendJson(res, 200, { success: true, session: newSession });
  }

  // 3. Get session by ID: GET /api/sessions/:sessionId
  const sessionGetMatch = url.match(/^\/api\/sessions\/([^/?]+)$/);
  if (sessionGetMatch && method === 'GET') {
    const sessionId = sessionGetMatch[1];
    const session = db.sessions[sessionId];

    if (!session) {
      return sendJson(res, 404, { success: false, error: 'Session not found' });
    }

    // Calculate server-side remaining time
    if (!session.isFinished && session.startedAt) {
      const elapsedSeconds = Math.floor((Date.now() - new Date(session.startedAt).getTime()) / 1000);
      const totalAllowedSeconds = session.durationMinutes * 60;
      const remaining = Math.max(0, totalAllowedSeconds - elapsedSeconds);
      session.timeRemainingSeconds = remaining;

      // Auto-submit if timer expired
      if (remaining === 0) {
        session.isFinished = true;
        session.status = 'COMPLETED_TIMER_EXPIRED';
        finalizeSubmission(db, session, 'Timer Expired Auto-Submit');
        writeDb(db);
      }
    }

    return sendJson(res, 200, { success: true, session });
  }

  // 4. Register Proctor Violation: POST /api/sessions/:sessionId/violation
  const violationMatch = url.match(/^\/api\/sessions\/([^/?]+)\/violation$/);
  if (violationMatch && method === 'POST') {
    const sessionId = violationMatch[1];
    const session = db.sessions[sessionId];

    if (!session) {
      return sendJson(res, 404, { success: false, error: 'Session not found' });
    }

    // If session is already finalized or disqualified, return persistent state
    if (session.isFinished || session.status === 'DISQUALIFIED') {
      return sendJson(res, 200, {
        success: true,
        session,
        isDisqualified: true,
        warningCount: session.warningCount || 2,
        message: session.disqualifiedReason || 'Session already terminated'
      });
    }

    const body = await parseJsonBody(req);
    const reason = body.reason || 'Restricted examination activity detected';
    const now = Date.now();

    // Deduplication window: Prevent duplicate warnings within 2.5 seconds (from clustered blur/visibility/fullscreen events)
    if (now - (session.lastViolationAt || 0) < 2500) {
      console.log(`[Proctor Server] Deduplicated duplicate violation (${reason}) for session ${sessionId}`);
      return sendJson(res, 200, {
        success: true,
        deduplicated: true,
        warningCount: session.warningCount,
        isDisqualified: false,
        session
      });
    }

    session.lastViolationAt = now;
    session.warningCount = (session.warningCount || 0) + 1;
    const currentCount = session.warningCount;
    const timestamp = new Date().toLocaleTimeString();

    if (currentCount >= 2) {
      // Strike 2: Disqualify immediately
      const logType = 'CRITICAL';
      const message = `Violation 2/2: Second violation detected (${reason}). Test automatically submitted and terminated with score marked as DISQUALIFIED (CHEATING DETECTED).`;

      session.proctorLogs.push({ timestamp, type: logType, message, warningNum: currentCount });
      session.status = 'DISQUALIFIED';
      session.isFinished = true;
      session.isDisqualified = true;
      session.submissionReason = 'AUTO_SUBMITTED_CHEATING';
      session.disqualifiedReason = `Test Automatically Terminated: You triggered 2 anti-cheating violations (${reason}). As per exam policy, your assessment has been automatically submitted and recorded as DISQUALIFIED (CHEATING DETECTED). Further answering is disabled.`;

      const disqualifiedSubmission = {
        id: `SUB-${Math.floor(1000 + Math.random() * 9000)}`,
        sessionId: session.sessionId,
        studentId: session.studentId,
        studentName: session.studentName,
        testId: session.testId,
        testTitle: session.testTitle,
        submittedAt: new Date().toLocaleString(),
        score: '0 (Disqualified - 2 Violations)',
        compilerStatus: 'Terminated on Second Strike',
        cheatingStatus: 'DISQUALIFIED (CHEATING DETECTED - 2 STRIKES)',
        proctorLogs: session.proctorLogs,
        codeSubmitted: Object.values(session.compilerCode || {}).join('\n\n---\n\n'),
        status: 'DISQUALIFIED (CHEATING DETECTED)'
      };

      db.submissions.unshift(disqualifiedSubmission);
      writeDb(db);

      return sendJson(res, 200, {
        success: true,
        warningCount: currentCount,
        isDisqualified: true,
        session,
        submission: disqualifiedSubmission
      });
    } else {
      // Strike 1: Warning
      const logType = 'WARNING';
      const message = `Warning 1/2: ${reason}`;
      session.proctorLogs.push({ timestamp, type: logType, message, warningNum: currentCount });
      writeDb(db);

      return sendJson(res, 200, {
        success: true,
        warningCount: currentCount,
        isDisqualified: false,
        session,
        message
      });
    }
  }

  // 5. Save MCQ answer: POST /api/sessions/:sessionId/answer
  const answerMatch = url.match(/^\/api\/sessions\/([^/?]+)\/answer$/);
  if (answerMatch && method === 'POST') {
    const sessionId = answerMatch[1];
    const session = db.sessions[sessionId];

    if (!session || session.isFinished) {
      return sendJson(res, 400, { success: false, error: 'Session not active' });
    }

    const body = await parseJsonBody(req);
    const { questionId, optionIndex } = body;
    session.userAnswers[questionId] = optionIndex;
    writeDb(db);

    return sendJson(res, 200, { success: true, userAnswers: session.userAnswers });
  }

  // 6. Save compiler code: POST /api/sessions/:sessionId/compiler
  const compilerMatch = url.match(/^\/api\/sessions\/([^/?]+)\/compiler$/);
  if (compilerMatch && method === 'POST') {
    const sessionId = compilerMatch[1];
    const session = db.sessions[sessionId];

    if (!session || session.isFinished) {
      return sendJson(res, 400, { success: false, error: 'Session not active' });
    }

    const body = await parseJsonBody(req);
    const { compilerId, code } = body;
    session.compilerCode[compilerId] = code;
    writeDb(db);

    return sendJson(res, 200, { success: true });
  }

  // 7. Submit test: POST /api/sessions/:sessionId/submit
  const submitMatch = url.match(/^\/api\/sessions\/([^/?]+)\/submit$/);
  if (submitMatch && method === 'POST') {
    const sessionId = submitMatch[1];
    const session = db.sessions[sessionId];

    if (!session) {
      return sendJson(res, 404, { success: false, error: 'Session not found' });
    }

    // Never allow normal submission if session is disqualified or submitted due to cheating
    if (session.status === 'DISQUALIFIED' || session.isDisqualified) {
      return sendJson(res, 403, {
        success: false,
        error: 'Assessment disqualified for proctoring violations. Cannot submit normally.',
        session
      });
    }

    if (session.isFinished) {
      return sendJson(res, 200, { success: true, session, message: 'Already submitted' });
    }

    session.isFinished = true;
    session.status = 'SUBMITTED';
    const submission = finalizeSubmission(db, session, 'Candidate Manual Submission');
    writeDb(db);

    return sendJson(res, 200, { success: true, session, submission });
  }

  // 8. Submissions list: GET /api/submissions
  if (url.startsWith('/api/submissions') && method === 'GET') {
    return sendJson(res, 200, { success: true, submissions: db.submissions || [] });
  }

  // Fallback for unhandled /api/
  return sendJson(res, 404, { success: false, error: 'Endpoint not found' });
}

function finalizeSubmission(db, session, reasonNote) {
  let scoreText = 'Compiler Assessment Submitted';
  if (session.mcqs && session.mcqs.length > 0) {
    let correctCount = 0;
    session.mcqs.forEach((q) => {
      if (session.userAnswers[q.id] === q.correctAnswer) {
        correctCount++;
      }
    });
    const percent = Math.round((correctCount / session.mcqs.length) * 100);
    scoreText = `${correctCount}/${session.mcqs.length} (${percent}%)`;
  }

  const newSubmission = {
    id: `SUB-${Math.floor(1000 + Math.random() * 9000)}`,
    sessionId: session.sessionId,
    studentId: session.studentId,
    studentName: session.studentName,
    testId: session.testId,
    testTitle: session.testTitle,
    submittedAt: new Date().toLocaleString(),
    score: scoreText,
    compilerStatus: session.compilers && session.compilers.length > 0 ? '5 Labs Saved' : 'N/A',
    cheatingStatus: (session.warningCount || 0) === 0 ? 'Clean (0 Warnings)' : `${session.warningCount} Warning(s) Logged`,
    proctorLogs: [
      ...session.proctorLogs,
      { timestamp: new Date().toLocaleTimeString(), type: 'INFO', message: `Assessment successfully finalized: ${reasonNote}` }
    ],
    codeSubmitted: Object.values(session.compilerCode || {}).join('\n\n---\n\n'),
    status: 'SUBMITTED'
  };

  db.submissions.unshift(newSubmission);
  return newSubmission;
}
