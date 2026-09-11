import { MongoClient } from 'mongodb';

const DEFAULT_DB_NAME = 'i_test';
const DEFAULT_SOURCE_STUDENTS_COLLECTION = 'students';

let defaultClientPromise = null;
const clientPromises = new Map();

export function isMongoConfigured() {
  return Boolean(process.env.MONGODB_URI);
}

async function getClient(uri = process.env.MONGODB_URI) {
  if (!uri) return null;
  if (uri === process.env.MONGODB_URI) {
    if (!defaultClientPromise) defaultClientPromise = new MongoClient(uri).connect();
    return defaultClientPromise;
  }
  if (!clientPromises.has(uri)) clientPromises.set(uri, new MongoClient(uri).connect());
  return clientPromises.get(uri);
}

export async function getItestDb() {
  const client = await getClient();
  if (!client) return null;
  return client.db(process.env.I_TEST_DB_NAME || DEFAULT_DB_NAME);
}

async function getCmsDb() {
  const uri = process.env.CMS_MONGODB_URI || process.env.MONGODB_URI;
  const dbName = process.env.CMS_DB_NAME;
  if (!uri || !dbName) return null;
  const client = await getClient(uri);
  return client.db(dbName);
}

export async function loadAppState() {
  const db = await getItestDb();
  if (!db) return null;

  const [sessions, submissions, scheduledTests] = await Promise.all([
    db.collection('sessions').find({}).toArray(),
    db.collection('submissions').find({}).sort({ createdAt: -1, submittedAt: -1 }).toArray(),
    db.collection('scheduled_tests').find({}).sort({ createdAt: -1, scheduledStartIso: -1 }).toArray()
  ]);

  return {
    sessions: Object.fromEntries(sessions.map(({ _id, ...session }) => [session.sessionId, session])),
    submissions: submissions.map(({ _id, ...submission }) => submission),
    scheduledTests: scheduledTests.map(({ _id, ...test }) => test)
  };
}

export async function saveAppState(state) {
  const db = await getItestDb();
  if (!db) return false;

  const sessions = Object.values(state.sessions || {});
  const submissions = state.submissions || [];

  await Promise.all([
    replaceCollection(db.collection('sessions'), sessions, 'sessionId'),
    replaceCollection(db.collection('submissions'), submissions, 'id')
  ]);

  return true;
}

export async function upsertScheduledTest(test) {
  const db = await getItestDb();
  if (!db) return null;
  const now = new Date().toISOString();
  const document = {
    ...test,
    createdAt: test.createdAt || now,
    updatedAt: now
  };
  await db.collection('scheduled_tests').replaceOne(
    { id: document.id },
    document,
    { upsert: true }
  );
  return document;
}

export async function deleteScheduledTestById(testId) {
  const db = await getItestDb();
  if (!db) return null;
  const result = await db.collection('scheduled_tests').deleteOne({ id: testId });
  return result.deletedCount > 0;
}

async function replaceCollection(collection, documents, key) {
  if (documents.length === 0) {
    await collection.deleteMany({});
    return;
  }

  const keys = documents.map(item => item[key]).filter(Boolean);
  await collection.deleteMany({ [key]: { $nin: keys } });
  await Promise.all(documents.map(item => collection.replaceOne(
    { [key]: item[key] },
    { ...item, updatedAt: new Date() },
    { upsert: true }
  )));
}

export async function findStudentByLmsId(lmsId) {
  const db = await getItestDb();
  if (!db || !lmsId) return null;
  const student = await db.collection('students').findOne({ lmsId });
  if (!student) return null;
  const { _id, ...cleanStudent } = student;
  return cleanStudent;
}

export async function listStudents() {
  const db = await getItestDb();
  if (!db) return [];
  const students = await db.collection('students').find({}).sort({ name: 1 }).toArray();
  return students.map(({ _id, ...student }) => student);
}

export async function syncStudentsFromCms() {
  const targetDb = await getItestDb();
  const sourceDb = await getCmsDb();
  if (!targetDb) throw new Error('MONGODB_URI is not configured for i-test.');
  if (!sourceDb) throw new Error('CMS_DB_NAME is not configured for the CMS source database.');

  const sourceCollectionName = process.env.CMS_STUDENTS_COLLECTION || DEFAULT_SOURCE_STUDENTS_COLLECTION;
  const sourceStudents = await sourceDb.collection(sourceCollectionName).find({}).toArray();
  const normalized = sourceStudents.map(normalizeCmsStudent).filter(student => student.lmsId && student.name);

  if (normalized.length > 0) {
    await Promise.all(normalized.map(student => targetDb.collection('students').updateOne(
      { lmsId: student.lmsId },
      { $set: { ...student, syncedAt: new Date() }, $setOnInsert: { createdAt: new Date() } },
      { upsert: true }
    )));
  }

  const result = {
    sourceDb: process.env.CMS_DB_NAME,
    sourceCollection: sourceCollectionName,
    scanned: sourceStudents.length,
    synced: normalized.length,
    skipped: sourceStudents.length - normalized.length,
    syncedAt: new Date().toISOString()
  };

  await targetDb.collection('sync_runs').insertOne(result);
  return result;
}

function normalizeCmsStudent(source) {
  const lmsId = pick(source, ['lmsId', 'lms_id', 'lmsID', 'lms', 'studentId', 'student_id', 'rollNo', 'roll_no']);
  const firstName = pick(source, ['firstName', 'first_name']);
  const lastName = pick(source, ['lastName', 'last_name']);
  const name = pick(source, ['name', 'fullName', 'full_name', 'studentName', 'student_name']) || [firstName, lastName].filter(Boolean).join(' ');
  const batches = normalizeList(pick(source, ['batches', 'batch', 'batchName', 'batch_name', 'batchId', 'batch_id']));
  const courses = normalizeList(pick(source, ['courses', 'course', 'courseName', 'course_name', 'program', 'programName']));

  return {
    lmsId: stringify(lmsId),
    name: stringify(name),
    email: stringify(pick(source, ['email', 'emailId', 'email_id', 'studentEmail', 'student_email'])),
    batch: batches.join(', '),
    batches,
    course: courses.join(', '),
    courses,
    sourceId: stringify(source._id)
  };
}

function pick(source, keys) {
  for (const key of keys) {
    const value = source?.[key];
    if (value !== undefined && value !== null && value !== '') return value;
  }
  return '';
}

function stringify(value) {
  if (value === undefined || value === null) return '';
  if (Array.isArray(value)) return value.map(stringify).filter(Boolean).join(', ');
  return String(value).trim();
}

function normalizeList(value) {
  if (value === undefined || value === null || value === '') return [];
  const rawItems = Array.isArray(value) ? value : String(value).split(',');
  return Array.from(new Set(rawItems.map(item => stringify(item)).filter(Boolean)));
}
