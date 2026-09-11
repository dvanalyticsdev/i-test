import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  findStudentByLmsId,
  isMongoConfigured,
  deleteScheduledTestById,
  listStudents,
  loadAppState,
  saveAppState,
  syncStudentsFromCms,
  upsertScheduledTest
} from './mongoStore.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE = process.env.PROCTOR_DB_FILE || path.join(__dirname, 'proctor_db.json');

// Initialize DB file if not present
function initDb() {
  if (!fs.existsSync(DB_FILE)) {
    const initialData = {
      sessions: {},
      submissions: [],
      scheduledTests: []
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
  }
}

async function readDb() {
  const mongoState = await loadAppState();
  if (mongoState) return mongoState;

  initDb();
  try {
    const content = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(content);
  } catch (err) {
    console.error('[Proctor Backend] Error reading DB:', err);
    throw err;
  }
}

async function writeDb(data) {
  if (await saveAppState(data)) return;

  try {
    const tempFile = `${DB_FILE}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tempFile, DB_FILE);
  } catch (err) {
    console.error('[Proctor Backend] Error writing DB:', err);
    throw err;
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
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
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
  // Finish asynchronous input before reading state. All mutations below are
  // synchronous read/modify/atomic-rename transactions in this server process.
  const body = (method === 'POST' || method === 'DELETE') ? await parseJsonBody(req) : {};
  const db = await readDb();

  // 1. Health check
  if (url === '/api/health' && method === 'GET') {
    return sendJson(res, 200, { status: 'healthy', storage: isMongoConfigured() ? 'mongo' : 'file', timestamp: new Date().toISOString() });
  }

  if (url === '/api/scheduled-tests' && method === 'GET') {
    return sendJson(res, 200, { success: true, tests: db.scheduledTests || [] });
  }

  if (url === '/api/scheduled-tests' && method === 'POST') {
    if (!body.id || !body.title) {
      return sendJson(res, 400, { success: false, error: 'Test id and title are required.' });
    }
    const now = new Date().toISOString();
    const test = {
      ...body,
      createdAt: body.createdAt || now,
      updatedAt: now
    };
    const mongoTest = await upsertScheduledTest(test);
    if (mongoTest) {
      return sendJson(res, 200, { success: true, test: mongoTest });
    }
    db.scheduledTests = [
      test,
      ...(db.scheduledTests || []).filter(item => item.id !== test.id)
    ];
    await writeDb(db);
    return sendJson(res, 200, { success: true, test });
  }

  const deleteScheduledTestMatch = url.match(/^\/api\/scheduled-tests\/([^/?]+)$/);
  if (deleteScheduledTestMatch && method === 'DELETE') {
    const testId = decodeURIComponent(deleteScheduledTestMatch[1]);
    const mongoDeleted = await deleteScheduledTestById(testId);
    if (mongoDeleted !== null) {
      return sendJson(res, 200, { success: true, deleted: mongoDeleted, deletedId: testId });
    }
    const beforeCount = (db.scheduledTests || []).length;
    db.scheduledTests = (db.scheduledTests || []).filter(test => test.id !== testId);
    await writeDb(db);
    return sendJson(res, 200, { success: true, deleted: beforeCount > db.scheduledTests.length, deletedId: testId });
  }

  if (url === '/api/students' && method === 'GET') {
    const students = await listStudents();
    return sendJson(res, 200, { success: true, students });
  }

  if (url === '/api/admin/login' && method === 'POST') {
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;
    if (!adminEmail || !adminPassword) {
      return sendJson(res, 500, { success: false, error: 'Admin login is not configured.' });
    }
    if (body.email === adminEmail && body.password === adminPassword) {
      return sendJson(res, 200, {
        success: true,
        admin: { id: adminEmail, email: adminEmail, name: adminEmail.split('@')[0] },
        syncToken: process.env.ADMIN_SYNC_TOKEN || ''
      });
    }
    return sendJson(res, 401, { success: false, error: 'Invalid admin credentials.' });
  }

  const studentMatch = url.match(/^\/api\/students\/([^/?]+)$/);
  if (studentMatch && method === 'GET') {
    const lmsId = decodeURIComponent(studentMatch[1]);
    const student = await findStudentByLmsId(lmsId);
    if (!student) return sendJson(res, 404, { success: false, error: 'Student not found' });
    return sendJson(res, 200, { success: true, student });
  }

  if (url === '/api/admin/sync-students' && method === 'POST') {
    const configuredToken = process.env.ADMIN_SYNC_TOKEN;
    if (configuredToken && req.headers.authorization !== `Bearer ${configuredToken}`) {
      return sendJson(res, 403, { success: false, error: 'Unauthorized sync request' });
    }
    const result = await syncStudentsFromCms();
    return sendJson(res, 200, { success: true, ...result });
  }

  // 2. Start new session: POST /api/sessions/start
  if (url === '/api/sessions/start' && method === 'POST') {
    const { testConfig, studentUser, mcqs, compilers } = body;

    if (!testConfig || !studentUser) {
      return sendJson(res, 400, { success: false, error: 'testConfig and studentUser required' });
    }

    const sessionId = body.sessionId || `SESS-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
    if (db.sessions[sessionId]) return sendJson(res, 200, { success: true, session: db.sessions[sessionId] });
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
      revision: 0,
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
    await writeDb(db);

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
        session.revision = (session.revision || 0) + 1;
        session.isFinished = true;
        session.status = 'COMPLETED_TIMER_EXPIRED';
        finalizeSubmission(db, session, 'Timer Expired Auto-Submit');
        await writeDb(db);
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
        isDisqualified: session.status === 'DISQUALIFIED',
        warningCount: session.warningCount || 0,
        submission: db.submissions.find(item => item.sessionId === sessionId),
        message: session.disqualifiedReason || 'Session already terminated'
      });
    }

    const reason = body.reason || 'Restricted examination activity detected';
    const now = Date.now();

    // Stable IDs deduplicate retries without suppressing distinct actions.
    if (!body.eventId || typeof body.eventId !== 'string' || body.eventId.length > 200) {
      return sendJson(res, 400, { success: false, error: 'A stable eventId is required' });
    }
    session.processedViolationIds ||= [];
    if (session.processedViolationIds.includes(body.eventId)) {
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
    session.revision = (session.revision || 0) + 1;
    session.processedViolationIds.push(body.eventId);
    session.warningCount = (session.warningCount || 0) + 1;
    const currentCount = session.warningCount;
    const timestamp = new Date().toLocaleTimeString();

    if (currentCount >= 2) {
      // Strike 2: Disqualify immediately
      const logType = 'CRITICAL';
      const message = `Violation 2/2: Second violation detected (${reason}). Test automatically submitted and terminated with score marked as DISQUALIFIED (CHEATING DETECTED).`;

      session.proctorLogs.push({ eventId: body.eventId, timestamp, type: logType, message, warningNum: currentCount });
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
      await writeDb(db);

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
      session.proctorLogs.push({ eventId: body.eventId, timestamp, type: logType, message, warningNum: currentCount });
      await writeDb(db);

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
      return sendJson(res, 400, { success: false, error: 'Session not active', session });
    }

    const { questionId, optionIndex } = body;
    session.userAnswers[questionId] = optionIndex;
    session.revision = (session.revision || 0) + 1;
    await writeDb(db);

    return sendJson(res, 200, { success: true, userAnswers: session.userAnswers, revision: session.revision });
  }

  // 6. Save compiler code: POST /api/sessions/:sessionId/compiler
  const compilerMatch = url.match(/^\/api\/sessions\/([^/?]+)\/compiler$/);
  if (compilerMatch && method === 'POST') {
    const sessionId = compilerMatch[1];
    const session = db.sessions[sessionId];

    if (!session || session.isFinished) {
      return sendJson(res, 400, { success: false, error: 'Session not active', session });
    }

    const { compilerId, code } = body;
    session.compilerCode[compilerId] = code;
    session.revision = (session.revision || 0) + 1;
    await writeDb(db);

    return sendJson(res, 200, { success: true, revision: session.revision });
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
    session.revision = (session.revision || 0) + 1;
    const submission = finalizeSubmission(db, session, 'Candidate Manual Submission');
    await writeDb(db);

    return sendJson(res, 200, { success: true, session, submission });
  }

  // 8. Submissions list: GET /api/submissions
  if (url.startsWith('/api/submissions') && method === 'GET') {
    return sendJson(res, 200, { success: true, submissions: db.submissions || [] });
  }

  // 9. Bulk delete submissions: POST /api/submissions/bulk-delete or DELETE /api/submissions
  if ((url === '/api/submissions/bulk-delete' && method === 'POST') || (url === '/api/submissions' && method === 'DELETE')) {
    const ids = Array.isArray(body.ids) ? body.ids : [];
    const idSet = new Set(ids);
    const beforeCount = (db.submissions || []).length;
    db.submissions = (db.submissions || []).filter(s => !idSet.has(s.id) && !idSet.has(s.sessionId));
    await writeDb(db);
    return sendJson(res, 200, { success: true, deletedCount: beforeCount - db.submissions.length });
  }

  // 10. Delete single submission: DELETE /api/submissions/:id
  const deleteSubMatch = url.match(/^\/api\/submissions\/([^/?]+)$/);
  if (deleteSubMatch && method === 'DELETE') {
    const subId = decodeURIComponent(deleteSubMatch[1]);
    const beforeCount = (db.submissions || []).length;
    db.submissions = (db.submissions || []).filter(s => s.id !== subId && s.sessionId !== subId);
    await writeDb(db);
    return sendJson(res, 200, { success: true, deleted: beforeCount > db.submissions.length, deletedId: subId });
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
