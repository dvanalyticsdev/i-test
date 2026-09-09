import { useCallback, useEffect, useRef, useState } from 'react';

export function useCodeSave(onCodeChange, onSaveCode) {
  const [saveStatus, setSaveStatus] = useState('idle');
  const version = useRef(0);
  useEffect(() => () => { version.current += 1; }, []);
  const save = useCallback(async (code, explicit = false) => {
    const revision = ++version.current;
    setSaveStatus('saving');
    try {
      const ok = await (explicit ? onSaveCode || onCodeChange : onCodeChange)?.(code);
      if (revision === version.current) setSaveStatus(ok === true ? 'saved' : 'failed');
    } catch {
      if (revision === version.current) setSaveStatus('failed');
    }
  }, [onCodeChange, onSaveCode]);
  return { isSaved: saveStatus === 'saved', saveStatus, save };
}
