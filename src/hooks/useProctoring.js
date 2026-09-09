import { useEffect, useState, useRef, useCallback } from 'react';

export function useProctoring({ onViolation, onAutoSubmitDisqualified, isExamActive, initialWarningCount = 0 }) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isTabFocused, setIsTabFocused] = useState(true);
  const [isMultiMonitorDetected, setIsMultiMonitorDetected] = useState(false);
  const [lastWarningMessage, setLastWarningMessage] = useState(null);

  // AV Device States
  const [mediaStream, setMediaStream] = useState(null);
  const [cameraStatus, setCameraStatus] = useState('requesting'); // 'requesting' | 'granted' | 'denied' | 'unavailable' | 'disconnected'
  const [microphoneStatus, setMicrophoneStatus] = useState('requesting'); // 'requesting' | 'granted' | 'denied' | 'unavailable' | 'disconnected'
  const [deviceErrorDetails, setDeviceErrorDetails] = useState('');

  // Stable references to prevent unnecessary re-render cascades
  const onViolationRef = useRef(onViolation);
  const onAutoSubmitDisqualifiedRef = useRef(onAutoSubmitDisqualified);
  const mediaStreamRef = useRef(null);
  const hasRequestedMediaRef = useRef(false);

  const violationCountRef = useRef(initialWarningCount);
  const examStartTimeRef = useRef(Date.now());
  const lastViolationTimeRef = useRef(0);
  const userEnteredFullscreenRef = useRef(false);
  const isSubmittingRef = useRef(false);
  const initMediaDevicesRef = useRef(null);

  // Keep callback refs up to date without triggering effects
  useEffect(() => {
    onViolationRef.current = onViolation;
  }, [onViolation]);

  useEffect(() => {
    onAutoSubmitDisqualifiedRef.current = onAutoSubmitDisqualified;
  }, [onAutoSubmitDisqualified]);

  useEffect(() => {
    violationCountRef.current = initialWarningCount;
  }, [initialWarningCount]);

  // Stable triggerViolation: Does not re-create on every render
  const triggerViolation = useCallback((reason) => {
    const now = Date.now();

    // 1. Initial 3-second grace period on exam launch to allow UI and browser rendering to settle
    if (now - examStartTimeRef.current < 3000) {
      console.log(`[Proctor Guard] Grace period active (ignored: ${reason})`);
      return;
    }

    // 2. Cooldown of 2.5 seconds between events to prevent double counting from linked browser events
    if (now - lastViolationTimeRef.current < 2500) {
      console.log(`[Proctor Guard] Cooldown active (throttled: ${reason})`);
      return;
    }

    lastViolationTimeRef.current = now;
    violationCountRef.current += 1;
    const currentCount = violationCountRef.current;

    setLastWarningMessage(reason);

    if (onViolationRef.current) {
      onViolationRef.current(reason, currentCount);
    }

    // After the second violation, immediately trigger automatic submission and lock assessment
    if (currentCount >= 2 && onAutoSubmitDisqualifiedRef.current) {
      onAutoSubmitDisqualifiedRef.current(reason);
    }
  }, []);

  const triggerViolationRef = useRef(triggerViolation);
  useEffect(() => {
    triggerViolationRef.current = triggerViolation;
  }, [triggerViolation]);

  // Request & Monitor Camera and Microphone Permissions via getUserMedia (executed ONCE)
  const initMediaDevices = useCallback(async (forceRetry = false) => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraStatus('unavailable');
      setMicrophoneStatus('unavailable');
      setDeviceErrorDetails('Browser does not support camera/microphone access');
      return;
    }

    // If stream already active and not a forced retry, skip
    if (mediaStreamRef.current && !forceRetry) {
      return;
    }

    // If tracks are still active, stop them before retrying
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }

    try {
      setCameraStatus('requesting');
      setMicrophoneStatus('requesting');

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
        audio: true
      });

      mediaStreamRef.current = stream;
      setMediaStream(stream);
      setCameraStatus('granted');
      setMicrophoneStatus('granted');
      setDeviceErrorDetails('');

      // Listen for hardware disconnects on tracks
      stream.getVideoTracks().forEach((track) => {
        track.onended = () => {
          setCameraStatus('disconnected');
          triggerViolationRef.current('Webcam disconnected or disabled during active assessment');
        };
      });

      stream.getAudioTracks().forEach((track) => {
        track.onended = () => {
          setMicrophoneStatus('disconnected');
          triggerViolationRef.current('Microphone disconnected or disabled during active assessment');
        };
      });
    } catch (err) {
      console.warn('Proctor Media Stream Permission Issue:', err.name, err.message);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraStatus('denied');
        setMicrophoneStatus('denied');
        setDeviceErrorDetails('Camera or Microphone access was denied in browser permission dialog.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setCameraStatus('unavailable');
        setMicrophoneStatus('unavailable');
        setDeviceErrorDetails('No physical camera or microphone detected on this system.');
      } else {
        setCameraStatus('unavailable');
        setMicrophoneStatus('unavailable');
        setDeviceErrorDetails(err.message || 'Media hardware unavailable');
      }
    }
  }, []);

  useEffect(() => {
    initMediaDevicesRef.current = initMediaDevices;
  }, [initMediaDevices]);

  // Main lifecycle: Runs ONLY when exam session starts or finishes, NEVER on timer ticks!
  useEffect(() => {
    if (!isExamActive) {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
        mediaStreamRef.current = null;
        setMediaStream(null);
      }
      hasRequestedMediaRef.current = false;
      return;
    }

    examStartTimeRef.current = Date.now();
    violationCountRef.current = initialWarningCount;

    // 1. Initialize AV devices on assessment start once
    let mediaTimer = null;
    if (!hasRequestedMediaRef.current) {
      hasRequestedMediaRef.current = true;
      // Slight delay so the initial user gesture completes fullscreen animation before getUserMedia prompt
      mediaTimer = setTimeout(() => {
        if (initMediaDevicesRef.current) {
          initMediaDevicesRef.current();
        }
      }, 300);
    }

    // 2. Hardware device changes listener
    const handleDeviceChange = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const hasVideo = devices.some((d) => d.kind === 'videoinput');
        const hasAudio = devices.some((d) => d.kind === 'audioinput');
        if (!hasVideo && cameraStatus === 'granted') {
          setCameraStatus('disconnected');
          triggerViolationRef.current('Camera device unplugged or lost during test');
        }
        if (!hasAudio && microphoneStatus === 'granted') {
          setMicrophoneStatus('disconnected');
          triggerViolationRef.current('Audio input device unplugged or lost during test');
        }
      } catch (e) {
        // Safe fallback
      }
    };

    if (navigator.mediaDevices && navigator.mediaDevices.addEventListener) {
      navigator.mediaDevices.addEventListener('devicechange', handleDeviceChange);
    }

    // 3. Fullscreen check
    const isCurrentlyFullscreen = !!(
      document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.mozFullScreenElement ||
      document.msFullscreenElement
    );
    setIsFullscreen(isCurrentlyFullscreen);
    if (isCurrentlyFullscreen) {
      userEnteredFullscreenRef.current = true;
    }

    // Multi-Monitor check
    const checkDisplaySetup = () => {
      try {
        if ('getScreenDetails' in window || 'isExtended' in window.screen) {
          if (window.screen.isExtended) {
            setIsMultiMonitorDetected(true);
          }
        }
        if (window.screen && window.screen.availWidth > window.screen.width * 1.5) {
          setIsMultiMonitorDetected(true);
        }
      } catch (e) {
        // Safe fallback
      }
    };
    checkDisplaySetup();

    // 4. Tab Visibility Switch Monitor (1st & 2nd warning -> auto submit)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsTabFocused(false);
        triggerViolationRef.current('Tab switch / background window transition detected');
      } else {
        setIsTabFocused(true);
      }
    };

    // 5. Window Blur (Leaving application, switching window, Alt+Tab)
    const handleWindowBlur = () => {
      // Do not log violation if the candidate is legitimately submitting or test is inactive
      if (isSubmittingRef.current || !isExamActive) return;
      setIsTabFocused(false);
      triggerViolationRef.current('Window focus lost / switched away from assessment screen');
    };

    const handleWindowFocus = () => {
      setIsTabFocused(true);
    };

    // 6. Fullscreen Change Monitor
    const handleFullscreenChange = () => {
      const isFull = !!(
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement
      );
      setIsFullscreen(isFull);

      if (isFull) {
        userEnteredFullscreenRef.current = true;
      } else {
        if (userEnteredFullscreenRef.current) {
          triggerViolationRef.current('Exited forced fullscreen examination mode');
        }
      }
    };

    // 7. Clipboard and Context Restrictions
    const handleCopy = (e) => {
      e.preventDefault();
      triggerViolationRef.current('Restricted action: Copying exam content is blocked');
    };

    const handleCut = (e) => {
      e.preventDefault();
      triggerViolationRef.current('Restricted action: Cutting content is blocked');
    };

    const handlePaste = (e) => {
      e.preventDefault();
      triggerViolationRef.current('Restricted action: Pasting external content is blocked');
    };

    const handleContextMenu = (e) => {
      e.preventDefault();
      triggerViolationRef.current('Restricted action: Right-click context menu is disabled');
    };

    // 8. Keyboard DevTools / Source / Screenshot / Reload blocks
    const handleKeyDown = (e) => {
      const isCtrlOrCmd = e.ctrlKey || e.metaKey;

      // Prevent page reload keystrokes (F5, Ctrl+R, Cmd+R, Ctrl+Shift+R) and closing shortcut (Ctrl+W)
      if (
        e.key === 'F5' ||
        (isCtrlOrCmd && (e.key === 'r' || e.key === 'R')) ||
        (isCtrlOrCmd && (e.key === 'w' || e.key === 'W'))
      ) {
        e.preventDefault();
        e.stopPropagation();
        triggerViolationRef.current('Restricted action: Page refresh / window close shortcut attempted');
        return;
      }

      if (e.key === 'PrintScreen') {
        e.preventDefault();
        triggerViolationRef.current('Restricted action: Screen capture (PrintScreen) attempted');
        return;
      }

      if (e.key === 'F12') {
        e.preventDefault();
        triggerViolationRef.current('Restricted action: Developer tools (F12) attempted');
        return;
      }

      if (
        isCtrlOrCmd &&
        e.shiftKey &&
        (e.key === 'I' || e.key === 'i' || e.key === 'J' || e.key === 'j' || e.key === 'C' || e.key === 'c')
      ) {
        e.preventDefault();
        triggerViolationRef.current('Restricted action: Developer inspection shortcut attempted');
        return;
      }

      if (isCtrlOrCmd && (e.key === 'u' || e.key === 'U')) {
        e.preventDefault();
        triggerViolationRef.current('Restricted action: View page source (Ctrl+U) attempted');
        return;
      }

      if (isCtrlOrCmd && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        triggerViolationRef.current('Restricted action: Save page (Ctrl+S) attempted');
        return;
      }

      if (isCtrlOrCmd && (e.key === 'c' || e.key === 'C' || e.key === 'v' || e.key === 'V' || e.key === 'x' || e.key === 'X')) {
        e.preventDefault();
        triggerViolationRef.current(`Restricted action: Clipboard shortcut (Ctrl+${e.key.toUpperCase()}) blocked`);
      }
    };

    // Prevent navigation / tab closing confirmation
    const handleBeforeUnload = (e) => {
      // If candidate is legitimately submitting or exam is finished, do not prompt
      if (isSubmittingRef.current || !isExamActive) {
        return;
      }

      // Standard beforeunload pattern: set returnValue and prompt cleanly
      e.preventDefault();
      e.returnValue = 'You have an active examination session in progress. Leaving or reloading will forfeit your progress.';
      return e.returnValue;
    };

    // Attach listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('focus', handleWindowFocus);
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);
    document.addEventListener('copy', handleCopy);
    document.addEventListener('cut', handleCut);
    document.addEventListener('paste', handlePaste);
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('focus', handleWindowFocus);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('cut', handleCut);
      document.removeEventListener('paste', handlePaste);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);

      if (navigator.mediaDevices && navigator.mediaDevices.removeEventListener) {
        navigator.mediaDevices.removeEventListener('devicechange', handleDeviceChange);
      }

      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
        mediaStreamRef.current = null;
        setMediaStream(null);
      }
      if (mediaTimer) clearTimeout(mediaTimer);
      hasRequestedMediaRef.current = false;
    };
  }, [isExamActive]);

  const markSubmitting = useCallback(() => {
    isSubmittingRef.current = true;
  }, []);

  const requestFullscreen = useCallback(() => {
    const elem = document.documentElement;
    const requestMethod =
      elem.requestFullscreen ||
      elem.webkitRequestFullscreen ||
      elem.mozRequestFullScreen ||
      elem.msRequestFullscreen;

    if (requestMethod) {
      requestMethod
        .call(elem)
        .then(() => {
          setIsFullscreen(true);
          userEnteredFullscreenRef.current = true;
        })
        .catch((err) => {
          console.warn('Fullscreen request declined:', err);
        });
    }
  }, []);

  return {
    isFullscreen,
    isTabFocused,
    isMultiMonitorDetected,
    requestFullscreen,
    lastWarningMessage,
    mediaStream,
    cameraStatus,
    microphoneStatus,
    deviceErrorDetails,
    markSubmitting,
    retryMediaDevices: () => initMediaDevices(true)
  };
}
