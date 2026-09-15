import test from 'node:test';
import assert from 'node:assert/strict';
import { handleCodeEditorKeyDown } from './codeEditorUtils.js';

globalThis.requestAnimationFrame = (callback) => callback();

function createTabEvent({ value, start, end = start, shiftKey = false }) {
  return {
    key: 'Tab',
    shiftKey,
    prevented: false,
    preventDefault() {
      this.prevented = true;
    },
    currentTarget: {
      selectionStart: start,
      selectionEnd: end
    }
  };
}

test('Tab indents at cursor', () => {
  let value = 'if ok:\npass';
  const event = createTabEvent({ value, start: 7 });
  handleCodeEditorKeyDown(event, value, next => { value = next; });
  assert.equal(event.prevented, true);
  assert.equal(value, 'if ok:\n    pass');
  assert.equal(event.currentTarget.selectionStart, 11);
});

test('Shift+Tab outdents current line', () => {
  let value = 'if ok:\n    pass';
  const event = createTabEvent({ value, start: 11, shiftKey: true });
  handleCodeEditorKeyDown(event, value, next => { value = next; });
  assert.equal(value, 'if ok:\npass');
  assert.equal(event.currentTarget.selectionStart, 7);
});

test('Tab indents selected lines', () => {
  let value = 'one\ntwo';
  const event = createTabEvent({ value, start: 0, end: value.length });
  handleCodeEditorKeyDown(event, value, next => { value = next; });
  assert.equal(value, '    one\n    two');
});
