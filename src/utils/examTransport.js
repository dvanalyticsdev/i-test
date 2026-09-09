// Durable, ordered delivery: retries use the original session and event IDs.
const KEY = 'i_test_pending_requests';
const subscribers = new Set();
let running = null;
const read = () => JSON.parse(localStorage.getItem(KEY) || '[]');
const write = (queue) => localStorage.setItem(KEY, JSON.stringify(queue));
export const pendingViolations = (sessionId) => read().filter(x => x.sessionId === sessionId && x.kind === 'violation');
export function pendingDrafts(sessionId) {
  const drafts = { userAnswers: {}, compilerCode: {} };
  for (const item of read().filter(x => x.sessionId === sessionId)) {
    if (item.kind === 'answer') drafts.userAnswers[item.body.questionId] = item.body.optionIndex;
    if (item.kind === 'compiler') drafts.compilerCode[item.body.compilerId] = item.body.code;
  }
  return drafts;
}
export const subscribeExamTransport = (callback) => { subscribers.add(callback); return () => subscribers.delete(callback); };
const notify = (entry, data) => subscribers.forEach(callback => callback(entry, data));

export function queueExamRequest(sessionId, kind, body = {}) {
  const queue = read();
  const id = kind === 'violation' ? body.eventId : crypto.randomUUID();
  if (!queue.some(item => item.id === id)) {
    queue.push({ id, sessionId, kind, body });
    write(queue);
    notify(null, null);
  }
  return flushExamRequests();
}

export function flushExamRequests() {
  if (running) return running;
  running = (async () => {
    while (read().length) {
      const entry = read()[0];
      const url = entry.kind === 'start' ? '/api/sessions/start' : `/api/sessions/${entry.sessionId}/${entry.kind}`;
      let data;
      try {
        const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(entry.body) });
        data = await res.json();
        // A finalized session is authoritative, including rejected manual submit.
        if (!res.ok || !data.success) {
          if (!data.session?.isFinished) return false;
        }
      } catch { return false; }
      write(read().filter(item => item.id !== entry.id));
      if (data.session?.isFinished) {
        write(read().filter(item => item.sessionId !== entry.sessionId));
      }
      notify(entry, data);
    }
    return true;
  })().finally(() => { running = null; });
  return running;
}
