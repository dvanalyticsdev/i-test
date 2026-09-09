import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { create, act } from 'react-test-renderer';

class TrackedTarget extends EventTarget {
  counts = new Map();
  addEventListener(type, callback, options) { super.addEventListener(type, callback, options); this.counts.set(type, (this.counts.get(type) || 0) + 1); }
  removeEventListener(type, callback, options) { super.removeEventListener(type, callback, options); this.counts.set(type, (this.counts.get(type) || 0) - 1); }
}
test('StrictMode, rerenders, departures, refresh, fullscreen and cleanup', async () => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  globalThis.window = new TrackedTarget();
  globalThis.document = new TrackedTarget();
  const storage = new Map([['i_test_active_session', JSON.stringify({ sessionId: 'restored' })]]);
  globalThis.localStorage = globalThis.sessionStorage = { getItem: k => storage.get(k), setItem: (k, v) => storage.set(k, v), removeItem: k => storage.delete(k) };
  document.hidden = false;
  document.hasFocus = () => !document.hidden;
  document.fullscreenElement = {};
  document.documentElement = { requestFullscreen: async () => { document.fullscreenElement = {}; } };
  Object.defineProperty(globalThis, 'navigator', { configurable: true, value: { mediaDevices: undefined } });
  Object.defineProperty(globalThis, 'performance', { configurable: true, value: { getEntriesByType: () => [{ type: 'reload' }] } });
  const { useProctoring } = await import('./useProctoring.js');
  const violations = [];
  let hook;
  const onViolation = (reason, id) => violations.push({ reason, id });
  function Harness(props) { hook = useProctoring({ ...props, onViolation }); return null; }
  let root;
  const render = (sessionId, isExamActive = true) => React.createElement(React.StrictMode, null, React.createElement(Harness, { sessionId, isExamActive }));
  await act(async () => { root = create(render('restored')); });
  assert.equal(violations.length, 1, 'reload is recorded once even with StrictMode');
  for (let i = 0; i < 5; i++) await act(async () => root.update(render('restored')));
  assert.equal(document.counts.get('visibilitychange'), 1);
  assert.equal(window.counts.get('blur'), 1);
  assert.equal(window.counts.get('beforeunload') || 0, 0);
  assert.equal(window.dispatchEvent(new Event('beforeunload', { cancelable: true })), true);
  await act(async () => {
    window.dispatchEvent(new Event('blur'));
    document.hidden = true;
    document.dispatchEvent(new Event('visibilitychange'));
    document.fullscreenElement = null;
    document.dispatchEvent(new Event('fullscreenchange'));
  });
  assert.equal(violations.length, 2, 'one departure produces one warning');
  await act(async () => {
    document.hidden = false;
    document.fullscreenElement = {};
    document.dispatchEvent(new Event('fullscreenchange'));
    window.dispatchEvent(new Event('focus'));
    window.dispatchEvent(new Event('blur'));
  });
  assert.equal(violations.length, 3, 'distinct departure is not throttled');
  await act(async () => {
    hook.markSubmitting();
    document.dispatchEvent(new Event('contextmenu', { cancelable: true }));
  });
  assert.equal(violations.length, 3);
  await act(async () => root.update(render('new-session')));
  assert.equal(violations.length, 3, 'new session on a previously reloaded document is not a refresh');
  const typing = new Event('keydown', { cancelable: true });
  Object.assign(typing, { key: 'a', repeat: true });
  document.dispatchEvent(typing);
  assert.equal(typing.defaultPrevented, false, 'ordinary repeated typing remains usable');
  await act(async () => root.update(render('new-session', false)));
  assert([...document.counts.values(), ...window.counts.values()].every(count => count === 0));
  let resolveMedia;
  let stops = 0;
  navigator.mediaDevices = new TrackedTarget();
  navigator.mediaDevices.getUserMedia = () => new Promise(resolve => { resolveMedia = resolve; });
  await act(async () => root.update(render('media-session')));
  let mediaRequest;
  await act(async () => { mediaRequest = hook.retryMediaDevices(); });
  await act(async () => root.unmount());
  const tracks = [{ stop: () => stops++ }];
  await act(async () => { resolveMedia({ getTracks: () => tracks }); await mediaRequest; });
  assert.equal(stops, 1, 'media acquired after unmount is immediately released');
  assert([...document.counts.values(), ...window.counts.values(), ...navigator.mediaDevices.counts.values()].every(count => count === 0));
});
