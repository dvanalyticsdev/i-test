import { useEffect, useState, useRef } from 'react';

export function useProctoring({ onViolation, isExamActive }) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isTabFocused, setIsTabFocused] = useState(true);
  const [isMultiMonitorDetected, setIsMultiMonitorDetected] = useState(false);

  // Timestamp references to prevent immediate load triggers & rapid warning spam
  const examStartTimeRef = useRef(Date.now());
  const lastViolationTimeRef = useRef(0);

  useEffect(() => {
    if (!isExamActive) return;

    // Reset start time on exam session initialization
    examStartTimeRef.current = Date.now();

    // Helper to safely trigger violation with grace period & 5-second cooldown
    const safeTriggerViolation = (reason) => {
      const now = Date.now();
      // 1. Initial 5-second Grace Period on exam start
      if (now - examStartTimeRef.current < 5000) {
        console.log(`[Proctor Guard] Grace period active (ignored: ${reason})`);
        return;
      }
      // 2. Minimum 5-second Cooldown between registered warnings to avoid rapid spam lockouts
      if (now - lastViolationTimeRef.current < 5000) {
        console.log(`[Proctor Guard] Cooldown active (throttled: ${reason})`);
        return;
      }

      lastViolationTimeRef.current = now;
      onViolation(reason);
    };

    // Check Multi-Monitor / Extended Display API (soft warning flag, non-instant lock)
    const checkDisplaySetup = () => {
      if ('getScreenDetails' in window || 'isExtended' in window.screen) {
        if (window.screen.isExtended) {
          setIsMultiMonitorDetected(true);
        }
      }
      if (window.outerWidth - window.innerWidth > 300) {
        setIsMultiMonitorDetected(true);
      }
    };
    checkDisplaySetup();

    // 1. Tab Switch / Window Visibility Change Monitor
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsTabFocused(false);
        safeTriggerViolation('Tab switch / background window transition detected');
      } else {
        setIsTabFocused(true);
      }
    };

    const handleWindowBlur = () => {
      // Only register blur if page visibility is actually hidden or user moved to another app
      if (document.hidden) {
        setIsTabFocused(false);
        safeTriggerViolation('Window focus lost / application minimized');
      }
    };

    const handleWindowFocus = () => {
      setIsTabFocused(true);
    };

    // 2. Fullscreen Change Monitor
    const handleFullscreenChange = () => {
      const isFull = !!document.fullscreenElement;
      setIsFullscreen(isFull);
      if (!isFull) {
        safeTriggerViolation('Exited forced fullscreen testing mode');
      }
    };

    // 3. Block Copy-Paste & Right Click & DevTools shortcuts
    const handleCopy = (e) => {
      e.preventDefault();
      safeTriggerViolation('Copy attempt intercepted');
    };

    const handlePaste = (e) => {
      e.preventDefault();
      safeTriggerViolation('Paste attempt intercepted');
    };

    const handleContextMenu = (e) => {
      e.preventDefault();
      safeTriggerViolation('Right-click context menu attempt intercepted');
    };

    const handleKeyDown = (e) => {
      if (
        (e.ctrlKey && (e.key === 'c' || e.key === 'v' || e.key === 'u' || e.key === 's')) ||
        e.key === 'F12' ||
        e.key === 'PrintScreen'
      ) {
        e.preventDefault();
        safeTriggerViolation(`Restricted keyboard shortcut (${e.key}) attempted`);
      }
    };

    // Attach event listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('focus', handleWindowFocus);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('copy', handleCopy);
    document.addEventListener('paste', handlePaste);
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('focus', handleWindowFocus);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('paste', handlePaste);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isExamActive, onViolation]);

  const requestFullscreen = () => {
    const elem = document.documentElement;
    if (elem.requestFullscreen) {
      elem.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    }
  };

  return {
    isFullscreen,
    isTabFocused,
    isMultiMonitorDetected,
    requestFullscreen
  };
}
