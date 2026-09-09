import test from 'node:test';
import assert from 'node:assert/strict';
import { createIncidentCoordinator } from './proctorEvents.js';
test('related departures and fullscreen transitions share an ID; independent actions do not', () => {
  const events = createIncidentCoordinator();
  const first = events.leave();
  assert.equal(events.leave(), first);
  assert.equal(events.exitFullscreen(), first);
  events.enteredFullscreen();
  events.returned(true);
  assert.notEqual(events.leave(), first);
  assert.notEqual(events.action(), events.action());
});
