import test from 'node:test';
import assert from 'node:assert/strict';
import { queueExamRequest, flushExamRequests, pendingViolations, pendingDrafts } from './examTransport.js';
test('offline retries retain IDs and saves arrive before a subsequent violation', async () => {
  const values = new Map();
  globalThis.localStorage = { getItem: key => values.get(key), setItem: (key, value) => values.set(key, value) };
  const calls = [];
  globalThis.fetch = async () => { throw Error('offline'); };
  assert.equal(await queueExamRequest('test', 'compiler', { compilerId: 'python', code: 'latest' }), false);
  assert.equal(pendingDrafts('test').compilerCode.python, 'latest');
  assert.equal(await queueExamRequest('test', 'violation', { eventId: 'one' }), false);
  await queueExamRequest('test', 'violation', { eventId: 'one' });
  assert.equal(pendingViolations('test').length, 1);
  globalThis.fetch = async (url, args) => {
    calls.push([url, JSON.parse(args.body)]);
    return { ok: true, json: async () => ({ success: true }) };
  };
  assert.equal(await flushExamRequests(), true);
  assert.match(calls[0][0], /compiler$/);
  assert.equal(calls[1][1].eventId, 'one');
  assert.equal(calls.length, 2);
  assert.equal(pendingViolations('test').length, 0);
  assert.deepEqual(pendingDrafts('test'), { userAnswers: {}, compilerCode: {} });
});
