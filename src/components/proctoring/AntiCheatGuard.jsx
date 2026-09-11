import React, { useState, useEffect, useRef } from 'react';
import { 
  Shield, 
  AlertTriangle, 
  Maximize2, 
  Monitor, 
  Lock, 
  Eye, 
  CheckCircle2, 
  X,
  Camera,
  CameraOff,
  Mic,
  MicOff,
  RotateCw,
  Video
} from 'lucide-react';

export const AntiCheatGuard = ({ 
  warningCount, 
  requestFullscreen, 
  isFullscreen, 
  proctorLogs,
  mediaStream,
  cameraStatus,
  microphoneStatus,
  faceStatus,
  deviceErrorDetails,
  onRetryMediaDevices,
  isMultiMonitorDetected = false
}) => {
  const [showLogs, setShowLogs] = useState(false);
  const [activeAlert, setActiveAlert] = useState(null);
  const videoRef = useRef(null);
  const displayedWarningRef = useRef(null);

  // Attach live video feed safely without resetting stream
  useEffect(() => {
    if (videoRef.current && mediaStream) {
      if (videoRef.current.srcObject !== mediaStream) {
        videoRef.current.srcObject = mediaStream;
      }
    }
  }, [mediaStream]);

  // When a new warning log is registered, trigger a prominent visual alert banner
  useEffect(() => {
    if (proctorLogs && proctorLogs.length > 0) {
      const latestLog = proctorLogs[proctorLogs.length - 1];
      const id = latestLog.eventId || latestLog.timestamp + latestLog.message;
      if ((latestLog.type === 'WARNING' || latestLog.type === 'CRITICAL') && displayedWarningRef.current !== id) {
        displayedWarningRef.current = id;
        setActiveAlert(latestLog);
        
        // Auto-dismiss alert toast after 6 seconds
        const timer = setTimeout(() => {
          setActiveAlert(null);
        }, 6000);
        return () => clearTimeout(timer);
      }
    }
  }, [proctorLogs?.at(-1)?.eventId, proctorLogs?.at(-1)?.timestamp, proctorLogs?.at(-1)?.message]);

  return (
    <>
      {/* Real-Time Warning Alert Toast Banner */}
      {activeAlert && (
        <div className="bg-rose-600 text-white px-4 py-2.5 shadow-lg border-b border-rose-700 flex items-center justify-between text-xs font-bold z-50 transition-all duration-300">
          <div className="flex items-center gap-2 max-w-4xl">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-300" />
            <span>
              SECURITY INFRACTION: {activeAlert.message}.{' '}
              <span className="underline font-extrabold text-amber-200">
                Warning {warningCount} of 2. (2nd violation triggers automatic test submission).
              </span>
            </span>
          </div>
          <button 
            onClick={() => setActiveAlert(null)}
            className="p-1 hover:bg-rose-700 rounded-md transition text-white/80 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Automatic Fullscreen Enforcement Modal */}
      {!isFullscreen && (
        <div 
          onClick={requestFullscreen}
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs z-50 flex items-center justify-center p-4 cursor-pointer"
        >
          <div 
            className="bg-white rounded-2xl p-7 max-w-md w-full shadow-2xl border border-sky-200 text-center select-none transform transition hover:scale-[1.01]"
            onClick={(e) => {
              e.stopPropagation();
              requestFullscreen();
            }}
          >
            <div className="w-16 h-16 bg-sky-100 text-sky-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
              <Maximize2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Fullscreen Examination Required</h3>
            <p className="text-xs text-slate-600 mb-6 leading-relaxed">
              To ensure assessment integrity and activate secure proctoring, this test must be conducted in full screen mode. Click below or anywhere on this screen to automatically convert to full screen.
            </p>
            <button
              onClick={(e) => { e.stopPropagation(); requestFullscreen(); }}
              className="w-full py-3.5 bg-sky-600 hover:bg-sky-700 text-white font-bold text-sm rounded-xl shadow-lg transition flex items-center justify-center gap-2 shadow-sky-100"
            >
              <Maximize2 className="w-4 h-4" />
              <span>Convert To Fullscreen Mode</span>
            </button>
            <p className="text-[11px] text-slate-400 mt-3 font-medium">Click anywhere to activate fullscreen</p>
          </div>
        </div>
      )}

      <div className="bg-white border-b border-slate-200 px-4 py-2 flex flex-wrap items-center justify-between text-xs font-medium text-slate-700 shadow-sm select-none">
        {/* Left: Security status & Devices */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-full font-semibold">
            <Shield className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
            <span>PROCTOR ACTIVE</span>
          </div>

          {/* Fullscreen Prompt */}
          {!isFullscreen ? (
            <button
              onClick={requestFullscreen}
              className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-white px-3 py-1 rounded-md transition font-semibold shadow-xs"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>Enter Fullscreen</span>
            </button>
          ) : (
            <div className="flex items-center gap-1 text-slate-500 bg-slate-100 px-2 py-1 rounded">
              <Lock className="w-3 h-3 text-slate-400" />
              <span>Fullscreen Locked</span>
            </div>
          )}

          {/* Camera Status Badge */}
          <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full border text-[11px] font-semibold ${
            cameraStatus === 'granted'
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : cameraStatus === 'denied' || cameraStatus === 'blocked' || cameraStatus === 'disconnected'
              ? 'bg-rose-50 text-rose-700 border-rose-300'
              : 'bg-amber-50 text-amber-700 border-amber-200'
          }`}>
            {cameraStatus === 'granted' ? (
              <Camera className="w-3 h-3 text-emerald-600" />
            ) : (
              <CameraOff className="w-3 h-3 text-rose-600" />
            )}
            <span>Camera: {(cameraStatus || 'requesting').toUpperCase()}</span>
          </div>

          {/* Microphone Status Badge */}
          <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full border text-[11px] font-semibold ${
            microphoneStatus === 'granted'
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : microphoneStatus === 'denied'
              ? 'bg-rose-50 text-rose-700 border-rose-300'
              : 'bg-amber-50 text-amber-700 border-amber-200'
          }`}>
            {microphoneStatus === 'granted' ? (
              <Mic className="w-3 h-3 text-emerald-600" />
            ) : (
              <MicOff className="w-3 h-3 text-rose-600" />
            )}
            <span>Mic: {(microphoneStatus || 'requesting').toUpperCase()}</span>
          </div>

          {/* Retry media button if permission denied or unavailable */}
          {(cameraStatus !== 'granted' || microphoneStatus !== 'granted') && onRetryMediaDevices && (
            <button
              onClick={onRetryMediaDevices}
              className="flex items-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 rounded-full border border-slate-300 text-[11px] font-semibold transition"
              title="Request camera & microphone permissions again"
            >
              <RotateCw className="w-3 h-3 text-slate-500" />
              <span>Retry Permissions</span>
            </button>
          )}

          <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full border text-[11px] font-semibold ${
            faceStatus === 'visible'
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : faceStatus === 'missing' || faceStatus === 'multiple'
              ? 'bg-rose-50 text-rose-700 border-rose-300'
              : 'bg-amber-50 text-amber-700 border-amber-200'
          }`}>
            <Eye className="w-3 h-3" />
            <span>Face: {(faceStatus || 'checking').toUpperCase()}</span>
          </div>

          {/* Display Status */}
          <div className={`hidden lg:flex items-center gap-1 px-2 py-1 rounded border ${
            isMultiMonitorDetected
              ? 'bg-rose-50 text-rose-700 border-rose-200'
              : 'bg-slate-100 text-slate-500 border-slate-200'
          }`}>
            <Monitor className={`w-3.5 h-3.5 ${isMultiMonitorDetected ? 'text-rose-600' : 'text-slate-400'}`} />
            <span>{isMultiMonitorDetected ? 'Extended Display Detected' : 'Single Display Verified'}</span>
          </div>
        </div>

        {/* Right: Warning Counter & Audit Log */}
        <div className="flex items-center gap-3 mt-2 sm:mt-0">
          {/* Warning Indicator (Strict 2-Strike Limit) */}
          <div
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full font-semibold border ${
              warningCount === 0
                ? 'bg-slate-100 text-slate-600 border-slate-200'
                : warningCount === 1
                ? 'bg-amber-100 text-amber-800 border-amber-300 animate-pulse'
                : 'bg-rose-100 text-rose-800 border-rose-300 animate-pulse font-extrabold'
            }`}
          >
            <AlertTriangle className={`w-3.5 h-3.5 ${warningCount > 0 ? 'text-rose-600' : 'text-slate-400'}`} />
            <span>Warnings: {warningCount} / 2</span>
          </div>

          {/* Log Viewer Toggle */}
          <button
            onClick={() => setShowLogs(!showLogs)}
            className="flex items-center gap-1 text-slate-600 hover:text-slate-900 underline font-medium"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Audit Log ({(proctorLogs || []).length})</span>
          </button>
        </div>

        {/* Floating live camera feed preview bubble */}
        {cameraStatus === 'granted' && mediaStream && (
          <div className="fixed bottom-4 right-4 z-40 bg-slate-900/90 p-1 rounded-2xl shadow-2xl border-2 border-emerald-500/80 backdrop-blur-xs flex flex-col items-center">
            <div className="relative w-32 h-24 rounded-xl overflow-hidden bg-slate-800">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover mirror scale-x-[-1]"
              />
              <div className="absolute top-1 left-1.5 flex items-center gap-1 bg-black/60 px-1.5 py-0.5 rounded-full text-[9px] text-emerald-400 font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                <span>REC</span>
              </div>
            </div>
            <span className="text-[10px] text-slate-300 font-semibold mt-1">Live Proctor Stream</span>
          </div>
        )}

        {/* Slide-down Proctor Audit Log Modal */}
        {showLogs && (
          <div className="w-full mt-3 bg-slate-900 text-slate-200 p-3 rounded-lg border border-slate-700 font-mono text-[11px] max-h-40 overflow-y-auto">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800 mb-2 font-sans font-semibold text-slate-300">
              <span>Live Security Audit Trail</span>
              <button onClick={() => setShowLogs(false)} className="text-slate-400 hover:text-white">✕ Close</button>
            </div>
            <div className="space-y-1">
              {(proctorLogs || []).map((log, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <span className="text-slate-500">[{log.timestamp}]</span>
                  <span
                    className={
                      log.type === 'CRITICAL'
                        ? 'text-rose-400 font-bold'
                        : log.type === 'WARNING'
                        ? 'text-amber-300 font-semibold'
                        : 'text-emerald-400'
                    }
                  >
                    {log.message}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
};
