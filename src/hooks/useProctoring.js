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

  // Violation tracker & timing references
  const violationCountRef = useRef(initialWarningCount);
  const examStartTimeRef = useRef(Date.now());
  const lastViolationTimeRef = useRef(0);
  const userEnteredFullscreenRef = useRef(false);

  // Sync ref whenever initialWarningCount updates
  useEffect(() => {
    violationCountRef.current = initialWarningCount;
  }, [initialWarningCount]);

  // Trigger violation with precise 1st & 2nd warning, and immediate auto-submit upon 2nd violation
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

    if (onViolation) {
      onViolation(reason, currentCount);
    }

    // After the second violation, immediately trigger automatic submission and lock assessment
    if (currentCount >= 2 && onAutoSubmitDisqualified) {
      onAutoSubmitDisqualified(reason);
    }
  }, [onViolation, onAutoSubmitDisqualified]);

  // Request & Monitor Camera and Microphone Permissions via getUserMedia
  const initMediaDevices = useCallback(async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraStatus('unavailable');
      setMicrophoneStatus('unavailable');
      setDeviceErrorDetails('Browser does not support camera/microphone access');
      return;
    }

    try {
      setCameraStatus('requesting');
      setMicrophoneStatus('requesting');

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
        audio: true
      });

      setMediaStream(stream);
      setCameraStatus('granted');
      setMicrophoneStatus('granted');
      setDeviceErrorDetails('');

      // Listen for hardware disconnects on tracks
      stream.getVideoTracks().forEach(track => {
        track.onended = () => {
          setCameraStatus('disconnected');
          triggerViolation('Webcam disconnected or disabled during active assessment');
        };
      });

      stream.getAudioTracks().forEach(track => {
        track.onended = () => {
          setMicrophoneStatus('disconnected');
          triggerViolation('Microphone disconnected or disabled during active assessment');
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
  }, [triggerViolation]);

  useEffect(() => {
    if (!isExamActive) {
      // Clean up media streams if exam finishes or leaves
      if (mediaStream) {
        mediaStream.getTracks().forEach(t => t.stop());
        setMediaStream(null);
      }
      return;
    }

    examStartTimeRef.current = Date.now();
    violationCountRef.current = initialWarningCount;

    // 1. Initialize AV devices on assessment start
    initMediaDevices();

    // 2. Hardware device changes listener (e.g. plugging in/unplugging webcam)
    const handleDeviceChange = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const hasVideo = devices.some(d => d.kind === 'videoinput');
        const hasAudio = devices.some(d => d.kind === 'audioinput');
        if (!hasVideo && cameraStatus === 'granted') {
          setCameraStatus('disconnected');
          triggerViolation('Camera device unplugged or lost during test');
        }
        if (!hasAudio && microphoneStatus === 'granted') {
          setMicrophoneStatus('disconnected');
          triggerViolation('Audio input device unplugged or lost during test');
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
        triggerViolation('Tab switch / background window transition detected');
      } else {
        setIsTabFocused(true);
      }
    };

    // 5. Window Blur (Leaving application, switching window, Alt+Tab)
    const handleWindowBlur = () => {
      setIsTabFocused(false);
      triggerViolation('Window focus lost / switched away from assessment screen');
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
          triggerViolation('Exited forced fullscreen examination mode');
        }
      }
    };

    // 7. Clipboard and Context Restrictions
    const handleCopy = (e) => {
      e.preventDefault();
      triggerViolation('Restricted action: Copying exam content is blocked');
    };

    const handleCut = (e) => {
      e.preventDefault();
      triggerViolation('Restricted action: Cutting content is blocked');
    };

    const handlePaste = (e) => {
      e.preventDefault();
      triggerViolation('Restricted action: Pasting external content is blocked');
    };

    const handleContextMenu = (e) => {
      e.preventDefault();
      triggerViolation('Restricted action: Right-click context menu is disabled');
    };

    // 8. Keyboard DevTools / Source / Screenshot blocks
    const handleKeyDown = (e) => {
      const isCtrlOrCmd = e.ctrlKey || e.metaKey;

      if (e.key === 'PrintScreen') {
        e.preventDefault();
        triggerViolation('Restricted action: Screen capture (PrintScreen) attempted');
        return;
      }

      if (e.key === 'F12') {
        e.preventDefault();
        triggerViolation('Restricted action: Developer tools (F12) attempted');
        return;
      }

      if (isCtrlOrCmd && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.key === 'J' || e.key === 'j' || e.key === 'C' || e.key === 'c')) {
        e.preventDefault();
        triggerViolation('Restricted action: Developer inspection shortcut attempted');
        return;
      }

      if (isCtrlOrCmd && (e.key === 'u' || e.key === 'U')) {
        e.preventDefault();
        triggerViolation('Restricted action: View page source (Ctrl+U) attempted');
        return;
      }

      if (isCtrlOrCmd && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        triggerViolation('Restricted action: Save page (Ctrl+S) attempted');
        return;
      }

      if (isCtrlOrCmd && (e.key === 'c' || e.key === 'C' || e.key === 'v' || e.key === 'V' || e.key === 'x' || e.key === 'X')) {
        e.preventDefault();
        triggerViolation(`Restricted action: Clipboard shortcut (Ctrl+${e.key.toUpperCase()}) blocked`);
      }
    };

    // Prevent navigation / tab closing confirmation
    const handleBeforeUnload = (e) => {
      triggerViolation('Attempted to refresh or close examination window');
      e.preventDefault();
      e.returnValue = '';
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

      if (mediaStream) {
        mediaStream.getTracks().forEach(t => t.stop());
      }
    };
  }, [isExamActive, triggerViolation, initMediaDevices]);

  const requestFullscreen = useCallback(() => {
    const elem = document.documentElement;
    const requestMethod =
      elem.requestFullscreen ||
      elem.webkitRequestFullscreen ||
      elem.mozRequestFullScreen ||
      elem.msRequestFullscreen;

    if (requestMethod) {
      requestMethod.call(elem).then(() => {
        setIsFullscreen(true);
        userEnteredFullscreenRef.current = true;
      }).catch((err) => {
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
    retryMediaDevices: initMediaDevices
  };
}


