export function handleCodeEditorKeyDown(event, value, onChange, indent = '    ') {
  if (event.key !== 'Tab') return;
  event.preventDefault();

  const target = event.currentTarget;
  const selectionStart = target.selectionStart;
  const selectionEnd = target.selectionEnd;

  if (selectionStart === selectionEnd) {
    if (event.shiftKey) {
      const lineStart = value.lastIndexOf('\n', selectionStart - 1) + 1;
      const beforeCursor = value.slice(lineStart, selectionStart);
      const removable = beforeCursor.endsWith(indent)
        ? indent.length
        : Math.min(beforeCursor.match(/ +$/)?.[0]?.length || 0, indent.length);
      if (removable === 0) return;
      const nextValue = value.slice(0, selectionStart - removable) + value.slice(selectionStart);
      onChange(nextValue);
      requestAnimationFrame(() => {
        target.selectionStart = selectionStart - removable;
        target.selectionEnd = selectionStart - removable;
      });
      return;
    }

    const nextValue = value.slice(0, selectionStart) + indent + value.slice(selectionEnd);
    onChange(nextValue);
    requestAnimationFrame(() => {
      target.selectionStart = selectionStart + indent.length;
      target.selectionEnd = selectionStart + indent.length;
    });
    return;
  }

  const lineStart = value.lastIndexOf('\n', selectionStart - 1) + 1;
  const selectedBlock = value.slice(lineStart, selectionEnd);
  const lines = selectedBlock.split('\n');

  if (event.shiftKey) {
    let removedBeforeSelection = 0;
    let removedTotal = 0;
    const outdented = lines.map((line, index) => {
      const removable = line.startsWith(indent)
        ? indent.length
        : Math.min(line.match(/^ +/)?.[0]?.length || 0, indent.length);
      if (index === 0) removedBeforeSelection = removable;
      removedTotal += removable;
      return line.slice(removable);
    }).join('\n');
    const nextValue = value.slice(0, lineStart) + outdented + value.slice(selectionEnd);
    onChange(nextValue);
    requestAnimationFrame(() => {
      target.selectionStart = Math.max(lineStart, selectionStart - removedBeforeSelection);
      target.selectionEnd = Math.max(target.selectionStart, selectionEnd - removedTotal);
    });
    return;
  }

  const indented = lines.map(line => indent + line).join('\n');
  const nextValue = value.slice(0, lineStart) + indented + value.slice(selectionEnd);
  onChange(nextValue);
  requestAnimationFrame(() => {
    target.selectionStart = selectionStart + indent.length;
    target.selectionEnd = selectionEnd + indent.length * lines.length;
  });
}
