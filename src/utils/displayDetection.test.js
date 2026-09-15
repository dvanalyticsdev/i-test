import test from 'node:test';
import assert from 'node:assert/strict';

test('detectExtendedDisplayFallback blocks browser-reported extended screens', async () => {
  globalThis.window = { screen: { isExtended: true, width: 1920, height: 1080, availWidth: 1920, availHeight: 1040 } };
  const { detectExtendedDisplayFallback } = await import('./displayDetection.js');
  const result = detectExtendedDisplayFallback();
  assert.equal(result.extended, true);
  assert.equal(result.method, 'screen.isExtended');
});

test('detectExtendedDisplayFallback blocks oversized desktop geometry', async () => {
  globalThis.window = { screen: { width: 1920, height: 1080, availWidth: 3840, availHeight: 1040 } };
  const { detectExtendedDisplayFallback } = await import('./displayDetection.js');
  const result = detectExtendedDisplayFallback();
  assert.equal(result.extended, true);
  assert.equal(result.method, 'screen-width');
});

test('detectExtendedDisplay uses Screen Details API when available', async () => {
  globalThis.window = {
    screen: { isExtended: false, width: 1920, height: 1080, availWidth: 1920, availHeight: 1040 },
    getScreenDetails: async () => ({ screens: [{}, {}], isExtended: true })
  };
  const { detectExtendedDisplay } = await import('./displayDetection.js');
  const result = await detectExtendedDisplay();
  assert.equal(result.extended, true);
  assert.equal(result.method, 'getScreenDetails');
  assert.equal(result.screenCount, 2);
});
