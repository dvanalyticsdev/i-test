import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';

test('persistent, idempotent two-strike enforcement under concurrent saves', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'proctor-test-'));
  process.env.PROCTOR_DB_FILE = path.join(dir, 'db.json');
  const { proctorApiMiddleware } = await import('./proctorBackend.js');
  const server = http.createServer((req, res) => proctorApiMiddleware(req, res, () => res.end()));
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}/api`;
  const request = async (url, body) => {
    const res = await fetch(base + url, body === undefined ? {} : { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    return { status: res.status, ...await res.json() };
  };
  const start = (id, title = 'Test') => request('/sessions/start', { sessionId: id, testConfig: { id: 'TEST', title, durationMinutes: 45 }, studentUser: { id: 'TEST-STUDENT', name: 'Test' }, mcqs: [], compilers: [] });
  try {
    await start('test');
    const responses = await Promise.all([
      request('/sessions/test/violation', { eventId: 'one', reason: 'Tab departure' }),
      ...Array.from({ length: 15 }, (_, i) => request('/sessions/test/compiler', { compilerId: String(i), code: 'saved-' + i })),
      request('/sessions/test/violation', { eventId: 'one', reason: 'Same departure fullscreen event' })
    ]);
    assert(responses.every(res => res.success));
    let state = (await request('/sessions/test')).session;
    assert.equal(state.warningCount, 1);
    assert.equal(Object.keys(state.compilerCode).length, 15);
    assert.equal(state.revision, 16);
    assert.equal((await start('test')).session.warningCount, 1);
    const [second] = await Promise.all([
      request('/sessions/test/violation', { eventId: 'two', reason: 'Distinct action immediately after first' }),
      request('/sessions/test/violation', { eventId: 'two', reason: 'Retry' })
    ]);
    assert.equal(second.warningCount, 2);
    assert.equal(second.isDisqualified, true);
    assert.equal((await request('/sessions/test/submit', {})).status, 403);
    state = JSON.parse(fs.readFileSync(process.env.PROCTOR_DB_FILE)).sessions.test;
    assert.equal(state.warningCount, 2);
    assert.equal(state.status, 'DISQUALIFIED');
    const submissions = (await request('/submissions')).submissions;
    assert.equal(submissions.filter(s => s.sessionId === 'test').length, 1);
    assert.match(submissions[0].score, /Disqualified/);
    await start('clean');
    await request('/sessions/clean/submit', {});
    const late = await request('/sessions/clean/violation', { eventId: 'late' });
    assert.equal(late.isDisqualified, false);
    assert.equal((await request('/sessions/clean/submit', {})).success, true);

    // Test single and bulk submission deletion
    const allSubs = (await request('/submissions')).submissions;
    assert(allSubs.length >= 2);
    const subToDelete = allSubs[0];
    const delRes = await fetch(base + `/submissions/${subToDelete.id}`, { method: 'DELETE' });
    const delJson = await delRes.json();
    assert.equal(delJson.success, true);
    let afterSingle = (await request('/submissions')).submissions;
    assert.equal(afterSingle.some(s => s.id === subToDelete.id), false);

    await start('report-one', 'Report Delete Target');
    await request('/sessions/report-one/submit', {});
    await start('report-two', 'Keep This Report');
    await request('/sessions/report-two/submit', {});
    const reportDeleteRes = await fetch(base + '/submissions/by-test', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ testTitle: 'Report Delete Target' })
    });
    const reportDeleteJson = await reportDeleteRes.json();
    assert.equal(reportDeleteJson.success, true);
    assert.equal(reportDeleteJson.deletedCount, 1);
    afterSingle = (await request('/submissions')).submissions;
    assert.equal(afterSingle.some(s => s.testTitle === 'Report Delete Target'), false);
    assert.equal(afterSingle.some(s => s.testTitle === 'Keep This Report'), true);
    
    // Test bulk deletion
    const bulkRes = await fetch(base + '/submissions/bulk-delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: afterSingle.map(s => s.id) })
    });
    const bulkJson = await bulkRes.json();
    assert.equal(bulkJson.success, true);
    const afterBulk = (await request('/submissions')).submissions;
    assert.equal(afterBulk.length, 0);
    await start('failure');
    fs.mkdirSync(process.env.PROCTOR_DB_FILE + '.tmp');
    const failed = await request('/sessions/failure/violation', { eventId: 'disk-fail' });
    assert.equal(failed.status, 500);
    assert.equal((await request('/sessions/failure')).session.warningCount, 0);
  } finally {
    await new Promise(resolve => server.close(resolve));
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
