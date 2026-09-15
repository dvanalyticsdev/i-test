import { useEffect, useState, useRef, useCallback } from 'react';
import { createIncidentCoordinator } from '../utils/proctorEvents.js';
import { detectExtendedDisplay } from '../utils/displayDetection.js';
const reloadEvents = new Map();
let restoredSessionId;
try { restoredSessionId = JSON.parse(localStorage.getItem('i_test_active_session'))?.sessionId; } catch {}
const navigationKey = id => 'i_test_departure_' + id;
const CAMERA_CHECK_INTERVAL_MS = 800;
const BLANK_CAMERA_WARNING_FRAMES = 2;
const BLANK_CAMERA_ESCALATION_MS = 7000;
const FACE_MISSING_WARNING_FRAMES = 3;
const FACE_MISSING_ESCALATION_MS = 9000;
const NOT_READY_WARNING_FRAMES = 5;

function hasVisibleCameraFrame(video) {
  if (!video || video.readyState < 2 || !video.videoWidth || !video.videoHeight) return null;
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 80;
    canvas.height = 60;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return null;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    let total = 0;
    let totalSquares = 0;
    let darkPixels = 0;
    let flatPixels = 0;
    for (let i = 0; i < pixels.length; i += 4) {
      const luminance = (pixels[i] + pixels[i + 1] + pixels[i + 2]) / 3;
      total += luminance;
      totalSquares += luminance * luminance;
      if (luminance < 30) darkPixels += 1;
      if (Math.abs(pixels[i] - pixels[i + 1]) < 3 && Math.abs(pixels[i + 1] - pixels[i + 2]) < 3) flatPixels += 1;
    }
    const count = pixels.length / 4;
    const average = total / count;
    const variance = totalSquares / count - average * average;
    const darkRatio = darkPixels / count;
    const flatRatio = flatPixels / count;
    if (darkRatio > 0.72 || average < 38 || (average < 62 && variance < 9) || (flatRatio > 0.94 && variance < 12)) {
      return false;
    }
    return true;
  } catch {
    return null;
  }
}

export function useProctoring({ onViolation, isExamActive, sessionId }) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isTabFocused, setIsTabFocused] = useState(true);
  const [isMultiMonitorDetected, setIsMultiMonitorDetected] = useState(false);
  const [lastWarningMessage, setLastWarningMessage] = useState(null);

  // AV Device States
  const [mediaStream, setMediaStream] = useState(null);
  const [cameraStatus, setCameraStatus] = useState('requesting'); // 'requesting' | 'granted' | 'denied' | 'unavailable' | 'disconnected' | 'blocked'
  const [microphoneStatus, setMicrophoneStatus] = useState('requesting'); // 'requesting' | 'granted' | 'denied' | 'unavailable' | 'disconnected'
  const [faceStatus, setFaceStatus] = useState('checking'); // 'checking' | 'visible' | 'missing' | 'multiple' | 'unsupported'
  const [deviceErrorDetails, setDeviceErrorDetails] = useState('');

  // Stable references to prevent unnecessary re-render cascades
  const onViolationRef = useRef(onViolation);
  const activeRef = useRef(isExamActive);
  activeRef.current = isExamActive;
  const generationRef = useRef(0);
  const permissionPendingRef = useRef(false);
  const fullscreenPendingRef = useRef(false);
  const incidentsRef = useRef(createIncidentCoordinator());
  const emittedRef = useRef(new Set());
  const mediaStreamRef = useRef(null);
  const mediaIncidentRef = useRef(null);
  const hasRequestedMediaRef = useRef(false);
  const faceVideoRef = useRef(null);
  const faceTimerRef = useRef(null);
  const faceIncidentRef = useRef(null);
  const blankCameraIncidentRef = useRef(null);
  const cameraNotReadyIncidentRef = useRef(null);
  const blankFrameCountRef = useRef(0);
  const visibleFrameCountRef = useRef(0);
  const notReadyFrameCountRef = useRef(0);
  const missingFaceCountRef = useRef(0);
  const blankCameraSinceRef = useRef(null);
  const missingFaceSinceRef = useRef(null);
  const blankCameraEscalatedRef = useRef(false);
  const missingFaceEscalatedRef = useRef(false);

  const userEnteredFullscreenRef = useRef(false);
  const isSubmittingRef = useRef(false);
  const initMediaDevicesRef = useRef(null);

  // Keep callback refs up to date without triggering effects
  useEffect(() => {
    onViolationRef.current = onViolation;
  }, [onViolation]);



  const triggerViolation = useCallback((reason, eventId = incidentsRef.current.action()) => {
    if (!activeRef.current || isSubmittingRef.current || emittedRef.current.has(eventId)) return;
    emittedRef.current.add(eventId);
    setLastWarningMessage(reason);
    onViolationRef.current?.(reason, eventId);
  }, []);

  const triggerViolationRef = useRef(triggerViolation);
  useEffect(() => {
    triggerViolationRef.current = triggerViolation;
  }, [triggerViolation]);

  const stopFaceMonitoring = useCallback(() => {
    if (faceTimerRef.current) {
      clearInterval(faceTimerRef.current);
      faceTimerRef.current = null;
    }
    if (faceVideoRef.current) {
      faceVideoRef.current.pause();
      faceVideoRef.current.srcObject = null;
      faceVideoRef.current = null;
    }
    faceIncidentRef.current = null;
    blankCameraIncidentRef.current = null;
    cameraNotReadyIncidentRef.current = null;
    blankFrameCountRef.current = 0;
    visibleFrameCountRef.current = 0;
    notReadyFrameCountRef.current = 0;
    missingFaceCountRef.current = 0;
    blankCameraSinceRef.current = null;
    missingFaceSinceRef.current = null;
    blankCameraEscalatedRef.current = false;
    missingFaceEscalatedRef.current = false;
  }, []);

  const startFaceMonitoring = useCallback((stream, generation) => {
    stopFaceMonitoring();

    const video = document.createElement('video');
    video.muted = true;
    video.playsInline = true;
    video.srcObject = stream;
    faceVideoRef.current = video;

    const detector = 'FaceDetector' in window
      ? new window.FaceDetector({ fastMode: true, maxDetectedFaces: 3 })
      : null;
    if (!detector) {
      setFaceStatus('missing');
      triggerViolationRef.current('Face detection is unavailable in this browser during active assessment');
    }

    const inspect = async () => {
      if (!activeRef.current || generationRef.current !== generation || !faceVideoRef.current) return;
      try {
        if (video.readyState < 2) {
          notReadyFrameCountRef.current += 1;
          if (notReadyFrameCountRef.current >= NOT_READY_WARNING_FRAMES) {
            setCameraStatus('blocked');
            setFaceStatus('missing');
            if (!cameraNotReadyIncidentRef.current) {
              cameraNotReadyIncidentRef.current = crypto.randomUUID();
              triggerViolationRef.current('Camera stream is not producing readable video frames during active assessment', cameraNotReadyIncidentRef.current);
            }
          } else {
            setFaceStatus('checking');
          }
          return;
        }
        notReadyFrameCountRef.current = 0;
        const visibleFrame = hasVisibleCameraFrame(video);
        if (visibleFrame === false) {
          blankFrameCountRef.current += 1;
          visibleFrameCountRef.current = 0;
          if (blankFrameCountRef.current < BLANK_CAMERA_WARNING_FRAMES) return;
          setCameraStatus('blocked');
          setFaceStatus('missing');
          blankCameraSinceRef.current ||= Date.now();
          if (!blankCameraIncidentRef.current) {
            blankCameraIncidentRef.current = crypto.randomUUID();
            triggerViolationRef.current('Camera video feed is blank or covered during active assessment', blankCameraIncidentRef.current);
          }
          if (!blankCameraEscalatedRef.current && Date.now() - blankCameraSinceRef.current >= BLANK_CAMERA_ESCALATION_MS) {
            blankCameraEscalatedRef.current = true;
            triggerViolationRef.current('Camera remained blank or covered after warning during active assessment', crypto.randomUUID());
          }
          return;
        }
        if (visibleFrame === true) {
          visibleFrameCountRef.current += 1;
          blankFrameCountRef.current = 0;
          if (visibleFrameCountRef.current >= 2) {
            setCameraStatus('granted');
            blankCameraIncidentRef.current = null;
            cameraNotReadyIncidentRef.current = null;
            blankCameraSinceRef.current = null;
            blankCameraEscalatedRef.current = false;
          }
        }
        if (!detector) {
          return;
        }
        const faces = await detector.detect(video);
        if (!activeRef.current || generationRef.current !== generation) return;
        if (faces.length === 1) {
          setFaceStatus('visible');
          faceIncidentRef.current = null;
          missingFaceCountRef.current = 0;
          missingFaceSinceRef.current = null;
          missingFaceEscalatedRef.current = false;
        } else if (faces.length === 0) {
          missingFaceCountRef.current += 1;
          setFaceStatus('missing');
          if (missingFaceCountRef.current >= FACE_MISSING_WARNING_FRAMES && !faceIncidentRef.current) {
            faceIncidentRef.current = crypto.randomUUID();
            missingFaceSinceRef.current = Date.now();
            triggerViolationRef.current('Candidate face not visible in camera frame', faceIncidentRef.current);
          }
          if (missingFaceSinceRef.current && !missingFaceEscalatedRef.current && Date.now() - missingFaceSinceRef.current >= FACE_MISSING_ESCALATION_MS) {
            missingFaceEscalatedRef.current = true;
            triggerViolationRef.current('Candidate face remained missing after warning during active assessment', crypto.randomUUID());
          }
        } else {
          setFaceStatus('multiple');
          missingFaceCountRef.current = 0;
          missingFaceSinceRef.current = null;
          if (!faceIncidentRef.current) {
            faceIncidentRef.current = crypto.randomUUID();
            triggerViolationRef.current('Multiple faces detected in camera frame', faceIncidentRef.current);
          }
        }
      } catch {
        setFaceStatus('unsupported');
      }
    };

    video.play().catch(() => {});
    faceTimerRef.current = setInterval(inspect, CAMERA_CHECK_INTERVAL_MS);
    setTimeout(inspect, 500);
  }, [stopFaceMonitoring]);

  // Request & Monitor Camera and Microphone Permissions via getUserMedia (executed ONCE)
  const initMediaDevices = useCallback(async (forceRetry = false) => {
    if (!activeRef.current || permissionPendingRef.current) return;
    const generation = generationRef.current;
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
      mediaStreamRef.current.getTracks().forEach((t) => { t.onended = null; t.onmute = null; t.onunmute = null; t.stop(); });
      mediaStreamRef.current = null;
    }

    permissionPendingRef.current = true;
    try {
      setCameraStatus('requesting');
      setMicrophoneStatus('requesting');

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
        audio: true
      });

      if (!activeRef.current || generation !== generationRef.current) {
        stream.getTracks().forEach(t => { t.onended = null; t.onmute = null; t.onunmute = null; t.stop(); });
        return;
      }
      mediaStreamRef.current = stream;
      mediaIncidentRef.current = crypto.randomUUID();
      setMediaStream(stream);
      setCameraStatus('granted');
      setMicrophoneStatus('granted');
      startFaceMonitoring(stream, generation);
      setDeviceErrorDetails('');

      // Listen for hardware disconnects on tracks
      stream.getVideoTracks().forEach((track) => {
        track.onended = () => {
          if (!activeRef.current || generation !== generationRef.current) return;
          setCameraStatus('disconnected');
          triggerViolationRef.current('Webcam disconnected or disabled during active assessment', mediaIncidentRef.current);
        };
        track.onmute = () => {
          if (!activeRef.current || generation !== generationRef.current) return;
          setCameraStatus('blocked');
          setFaceStatus('missing');
          triggerViolationRef.current('Webcam video stream muted or privacy shutter enabled during active assessment', mediaIncidentRef.current);
        };
        track.onunmute = () => {
          if (!activeRef.current || generation !== generationRef.current) return;
          notReadyFrameCountRef.current = 0;
          blankFrameCountRef.current = 0;
          setCameraStatus('granted');
          setFaceStatus(prev => prev === 'missing' ? 'checking' : prev);
        };
      });

      stream.getAudioTracks().forEach((track) => {
        track.onended = () => {
          if (!activeRef.current || generation !== generationRef.current) return;
          setMicrophoneStatus('disconnected');
          triggerViolationRef.current('Microphone disconnected or disabled during active assessment', mediaIncidentRef.current);
        };
      });
    } catch (err) {
      if (!activeRef.current || generation !== generationRef.current) return;
      console.warn('Proctor Media Stream Permission Issue:', err.name, err.message);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraStatus('denied');
        setMicrophoneStatus('denied');
        setFaceStatus('unsupported');
        setDeviceErrorDetails('Camera or Microphone access was denied in browser permission dialog.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setCameraStatus('unavailable');
        setMicrophoneStatus('unavailable');
        setFaceStatus('unsupported');
        setDeviceErrorDetails('No physical camera or microphone detected on this system.');
      } else {
        setCameraStatus('unavailable');
        setMicrophoneStatus('unavailable');
        setFaceStatus('unsupported');
        setDeviceErrorDetails(err.message || 'Media hardware unavailable');
      }
    } finally {
      if (generation === generationRef.current) permissionPendingRef.current = false;
    }
  }, [startFaceMonitoring]);

  useEffect(() => {
    initMediaDevicesRef.current = initMediaDevices;
  }, [initMediaDevices]);

  // Main lifecycle: Runs ONLY when exam session starts or finishes, NEVER on timer ticks!
  useEffect(() => {
    if (!isExamActive) {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => { t.onended = null; t.onmute = null; t.onunmute = null; t.stop(); });
        mediaStreamRef.current = null;
        setMediaStream(null);
        stopFaceMonitoring();
      }
      hasRequestedMediaRef.current = false;
      return;
    }

    generationRef.current += 1;
    isSubmittingRef.current = false;
    permissionPendingRef.current = false;
    fullscreenPendingRef.current = false;
    userEnteredFullscreenRef.current = false;
    incidentsRef.current = createIncidentCoordinator();
    emittedRef.current = new Set();
    if (sessionId === restoredSessionId && performance.getEntriesByType('navigation')[0]?.type === 'reload' && !reloadEvents.has(sessionId)) {
      const eventId = sessionStorage.getItem(navigationKey(sessionId)) || crypto.randomUUID();
      sessionStorage.removeItem(navigationKey(sessionId));
      reloadEvents.set(sessionId, eventId);
      triggerViolationRef.current('Page refresh detected during active assessment', eventId);
    }

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
    const deviceGeneration = generationRef.current;
    const handleDeviceChange = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        if (!activeRef.current || generationRef.current !== deviceGeneration) return;
        const hasVideo = devices.some((d) => d.kind === 'videoinput');
        const hasAudio = devices.some((d) => d.kind === 'audioinput');
        if (!hasVideo && mediaStreamRef.current?.getVideoTracks().some(t => t.readyState === 'live')) {
          setCameraStatus('disconnected');
          triggerViolationRef.current('Camera device unplugged or lost during test', mediaIncidentRef.current);
        }
        if (!hasAudio && mediaStreamRef.current?.getAudioTracks().some(t => t.readyState === 'live')) {
          setMicrophoneStatus('disconnected');
          triggerViolationRef.current('Audio input device unplugged or lost during test', mediaIncidentRef.current);
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

    // Multi-monitor / HDMI / casting display check
    let screenDetailsRef = null;
    const displayIncidentRef = { current: null };
    const checkDisplaySetup = async () => {
      try {
        const result = await detectExtendedDisplay();
        if (!activeRef.current || generationRef.current !== deviceGeneration) return;
        setIsMultiMonitorDetected(result.extended);
        if (result.extended) {
          if (!displayIncidentRef.current) displayIncidentRef.current = crypto.randomUUID();
          triggerViolationRef.current(`Extended display / HDMI / casting setup detected (${result.reason})`, displayIncidentRef.current);
        } else {
          displayIncidentRef.current = null;
        }
      } catch (e) {
        // Safe fallback: keep current display status.
      }
    };
    checkDisplaySetup();
    const displayTimer = setInterval(checkDisplaySetup, 2000);
    const attachScreenDetailsListener = async () => {
      if (typeof window.getScreenDetails !== 'function') return;
      try {
        const details = await window.getScreenDetails();
        if (!activeRef.current || generationRef.current !== deviceGeneration) return;
        screenDetailsRef = details;
        details.addEventListener?.('screenschange', checkDisplaySetup);
        details.addEventListener?.('currentscreenchange', checkDisplaySetup);
      } catch {
        // Permission may be unavailable; polling fallback still runs.
      }
    };
    attachScreenDetailsListener();

    const departureId = () => {
      const id = incidentsRef.current.leave();
      sessionStorage.setItem(navigationKey(sessionId), id);
      return id;
    };
    const returned = () => {
      incidentsRef.current.returned(!!document.fullscreenElement);
      sessionStorage.removeItem(navigationKey(sessionId));
    };
    // 4. Tab Visibility Switch Monitor (1st & 2nd warning -> auto submit)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsTabFocused(false);
        triggerViolationRef.current('Tab switch / background window transition detected', departureId());
      } else if (document.hasFocus()) {
        setIsTabFocused(true);
        returned();
      }
    };

    // 5. Window Blur (Leaving application, switching window, Alt+Tab)
    const handleWindowBlur = () => {
      // Do not log violation if the candidate is legitimately submitting or test is inactive
      if (isSubmittingRef.current || !activeRef.current || permissionPendingRef.current || fullscreenPendingRef.current) return;
      setIsTabFocused(false);
      triggerViolationRef.current('Window focus lost / switched away from assessment screen', departureId());
    };

    const handleWindowFocus = () => {
      if (!document.hidden) returned();
      setIsTabFocused(!document.hidden);
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
        incidentsRef.current.enteredFullscreen();
        userEnteredFullscreenRef.current = true;
      } else {
        if (userEnteredFullscreenRef.current && !permissionPendingRef.current && !fullscreenPendingRef.current) {
          triggerViolationRef.current('Exited forced fullscreen examination mode', incidentsRef.current.exitFullscreen());
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
      if (e.repeat) {
        if (['F5', 'F12', 'PrintScreen'].includes(e.key) || (isCtrlOrCmd && /^[rwuscvxij]$/i.test(e.key))) e.preventDefault();
        return;
      }

      // Prevent page reload keystrokes (F5, Ctrl+R, Cmd+R, Ctrl+Shift+R) and closing shortcut (Ctrl+W)
      if (
        e.key === 'F5' ||
        (isCtrlOrCmd && (e.key === 'r' || e.key === 'R')) ||
        (isCtrlOrCmd && (e.key === 'w' || e.key === 'W'))
      ) {
        e.preventDefault();
        e.stopPropagation();
        const id = incidentsRef.current.action();
        sessionStorage.setItem(navigationKey(sessionId), id);
        triggerViolationRef.current('Restricted action: Page refresh / window close shortcut attempted', id);
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

    // Reload detection happens after navigation. Never cancel beforeunload.

    const handleKeyUp = () => { if (!document.hidden && document.hasFocus()) sessionStorage.removeItem(navigationKey(sessionId)); };

    // Attach listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('focus', handleWindowFocus);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);
    document.addEventListener('copy', handleCopy);
    document.addEventListener('cut', handleCut);
    document.addEventListener('paste', handlePaste);
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);

    return () => {
      generationRef.current += 1;
      permissionPendingRef.current = false;
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('focus', handleWindowFocus);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('cut', handleCut);
      document.removeEventListener('paste', handlePaste);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
      clearInterval(displayTimer);
      screenDetailsRef?.removeEventListener?.('screenschange', checkDisplaySetup);
      screenDetailsRef?.removeEventListener?.('currentscreenchange', checkDisplaySetup);

      if (navigator.mediaDevices && navigator.mediaDevices.removeEventListener) {
        navigator.mediaDevices.removeEventListener('devicechange', handleDeviceChange);
      }

      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => { t.onended = null; t.onmute = null; t.onunmute = null; t.stop(); });
        mediaStreamRef.current = null;
        setMediaStream(null);
        stopFaceMonitoring();
      }
      if (mediaTimer) clearTimeout(mediaTimer);
      hasRequestedMediaRef.current = false;
    };
  }, [isExamActive, sessionId, stopFaceMonitoring]);

  const markSubmitting = useCallback(() => {
    isSubmittingRef.current = true;
  }, []);

  const requestFullscreen = useCallback(() => {
    if (!activeRef.current || fullscreenPendingRef.current || document.fullscreenElement) return;
    const elem = document.documentElement;
    const requestMethod =
      elem.requestFullscreen ||
      elem.webkitRequestFullscreen ||
      elem.mozRequestFullScreen ||
      elem.msRequestFullscreen;

    if (requestMethod) {
      const generation = generationRef.current;
      fullscreenPendingRef.current = true;
      Promise.resolve().then(() => requestMethod.call(elem))
        .then(() => {
          if (!activeRef.current || generationRef.current !== generation) return;
          setIsFullscreen(true);
          userEnteredFullscreenRef.current = true;
        })
        .catch((err) => {
          console.warn('Fullscreen request declined:', err);
        }).finally(() => { if (generationRef.current === generation) fullscreenPendingRef.current = false; });
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
    faceStatus,
    deviceErrorDetails,
    markSubmitting,
    resumeProctoring: () => { isSubmittingRef.current = false; },
    retryMediaDevices: () => initMediaDevices(true)
  };
}
