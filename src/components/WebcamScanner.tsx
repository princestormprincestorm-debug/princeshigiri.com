import React, { useState, useEffect, useRef } from 'react';
import {
  Camera,
  X,
  RefreshCw,
  SwitchCamera,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Scan,
  Maximize2,
  Video,
  Play,
  Pause
} from 'lucide-react';
import { CoinSvg } from '../utils/coinVisuals.tsx';

interface WebcamScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (imageDataUrl: string) => void;
  title?: string;
  subtitle?: string;
  isMultiCoin?: boolean;
}

export const WebcamScanner: React.FC<WebcamScannerProps> = ({
  isOpen,
  onClose,
  onCapture,
  title = 'Live Webcam Coin Scanner',
  subtitle = 'Position a Central African CFA Franc coin within the guide reticle',
  isMultiCoin = false,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [autoScan, setAutoScan] = useState<boolean>(false);
  const [flashEffect, setFlashEffect] = useState<boolean>(false);
  const [useDemoFallback, setUseDemoFallback] = useState<boolean>(false);
  const autoScanTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize camera stream
  const startCamera = async (mode: 'environment' | 'user') => {
    stopCamera();
    setCameraError(null);
    setUseDemoFallback(false);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera API (getUserMedia) not supported in this browser.');
      }

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: mode },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setIsStreaming(true);
      }
    } catch (err: any) {
      console.warn('Webcam access error:', err);
      let message = 'Unable to access camera.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        message = 'Camera permission was denied. Please allow camera access in your browser settings.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        message = 'No camera device found on this system.';
      } else {
        message = err.message || 'Camera initialization error.';
      }
      setCameraError(message);
      setIsStreaming(false);
      // Fallback option enabled
      setUseDemoFallback(true);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsStreaming(false);
    if (autoScanTimerRef.current) {
      clearInterval(autoScanTimerRef.current);
      autoScanTimerRef.current = null;
    }
  };

  useEffect(() => {
    if (isOpen) {
      startCamera(facingMode);
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, facingMode]);

  // Capture current video frame to Base64 image
  const captureFrame = () => {
    setFlashEffect(true);
    setTimeout(() => setFlashEffect(false), 200);

    const canvas = document.createElement('canvas');

    if (useDemoFallback || !videoRef.current || !isStreaming) {
      // Create a high-quality simulated camera snapshot of a 500 or 100 FCFA coin
      canvas.width = 640;
      canvas.height = 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(0, 0, 640, 480);
        // Table texture
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.arc(320, 240, 160, 0, Math.PI * 2);
        ctx.fill();

        // Outer coin ring (Silver for 500 FCFA)
        const grad = ctx.createRadialGradient(280, 200, 20, 320, 240, 140);
        grad.addColorStop(0, '#FFFFFF');
        grad.addColorStop(0.5, '#BDC4CF');
        grad.addColorStop(1, '#64748B');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(320, 240, 140, 0, Math.PI * 2);
        ctx.fill();

        // Inner core (Gold for 500 FCFA)
        const innerGrad = ctx.createRadialGradient(290, 210, 10, 320, 240, 95);
        innerGrad.addColorStop(0, '#FFE89E');
        innerGrad.addColorStop(0.6, '#C99726');
        innerGrad.addColorStop(1, '#7A5408');
        ctx.fillStyle = innerGrad;
        ctx.beginPath();
        ctx.arc(320, 240, 95, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#292524';
        ctx.font = 'bold 48px Georgia, serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('500', 320, 225);
        ctx.font = 'bold 22px sans-serif';
        ctx.fillText('FCFA', 320, 275);
      }
      const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
      onCapture(dataUrl);
      onClose();
      return;
    }

    const video = videoRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);

    onCapture(dataUrl);
    if (!autoScan) {
      onClose();
    }
  };

  // Auto-scan timer
  useEffect(() => {
    if (autoScan && isStreaming) {
      autoScanTimerRef.current = setInterval(() => {
        captureFrame();
      }, 3500);
    } else if (autoScanTimerRef.current) {
      clearInterval(autoScanTimerRef.current);
      autoScanTimerRef.current = null;
    }
    return () => {
      if (autoScanTimerRef.current) clearInterval(autoScanTimerRef.current);
    };
  }, [autoScan, isStreaming]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Modal Top Bar */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                {title}
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-mono">
                  LIVE VISION
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">{subtitle}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const nextMode = facingMode === 'environment' ? 'user' : 'environment';
                setFacingMode(nextMode);
              }}
              title="Flip camera"
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white cursor-pointer transition-colors border border-slate-700"
            >
              <SwitchCamera className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white cursor-pointer transition-colors border border-slate-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Video Viewport Area */}
        <div className="relative bg-slate-950 flex-1 min-h-[340px] sm:min-h-[420px] flex items-center justify-center overflow-hidden">
          {/* Shutter Flash Animation */}
          {flashEffect && <div className="absolute inset-0 bg-white z-40 animate-out fade-out duration-200" />}

          {/* Real Video Element */}
          <video
            ref={videoRef}
            playsInline
            muted
            className={`w-full h-full object-cover max-h-[440px] ${useDemoFallback ? 'hidden' : 'block'}`}
          />

          {/* Demo Fallback View if camera not available */}
          {useDemoFallback && (
            <div className="flex flex-col items-center justify-center p-8 text-center space-y-4">
              <div className="relative">
                <CoinSvg denominationKey="500_fcfa" size={170} angleDeg={25} />
                <div className="absolute inset-0 rounded-full border-2 border-dashed border-cyan-400 animate-spin [animation-duration:12s]" />
              </div>
              <div className="max-w-md">
                <div className="text-amber-400 font-semibold text-xs flex items-center justify-center gap-1.5">
                  <Video className="w-3.5 h-3.5" />
                  Simulated Video Stream
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  {cameraError || 'Camera unavailable. Test inference using simulated live video frame.'}
                </p>
              </div>
            </div>
          )}

          {/* Alignment Reticle HUD (Targeting Overlay for Coin) */}
          {!useDemoFallback && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              {isMultiCoin ? (
                // Multi-coin grid reticle
                <div className="w-[80%] h-[75%] border-2 border-dashed border-amber-400/60 rounded-2xl flex items-center justify-center relative">
                  <span className="absolute -top-3 bg-slate-900/90 text-amber-400 text-[10px] px-2 py-0.5 rounded font-mono border border-amber-500/30">
                    SCAN TRAY / MULTI-COIN ZONE
                  </span>
                  <div className="w-6 h-6 border-t-2 border-l-2 border-amber-400 absolute top-2 left-2" />
                  <div className="w-6 h-6 border-t-2 border-r-2 border-amber-400 absolute top-2 right-2" />
                  <div className="w-6 h-6 border-b-2 border-l-2 border-amber-400 absolute bottom-2 left-2" />
                  <div className="w-6 h-6 border-b-2 border-r-2 border-amber-400 absolute bottom-2 right-2" />
                </div>
              ) : (
                // Single-coin circular reticle
                <div className="relative flex items-center justify-center">
                  <div className="w-56 h-56 sm:w-64 sm:h-64 rounded-full border-2 border-dashed border-amber-400/80 shadow-[0_0_30px_rgba(245,158,11,0.25)] animate-pulse" />
                  <div className="w-40 h-40 rounded-full border border-cyan-400/40 absolute" />
                  <span className="absolute -bottom-6 bg-slate-900/90 text-amber-300 text-[10px] px-2.5 py-0.5 rounded-full font-mono border border-amber-500/30 whitespace-nowrap shadow">
                    Align CFA Coin inside circle
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Corner Guidance Pills */}
          <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-sm border border-slate-800 px-2.5 py-1 rounded-lg text-[10px] font-mono text-slate-300 flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-amber-400" />
            Bimetallic Contrast Seam Sensor
          </div>

          <div className="absolute top-3 right-3 bg-slate-900/80 backdrop-blur-sm border border-slate-800 px-2.5 py-1 rounded-lg text-[10px] font-mono text-slate-300">
            {facingMode === 'environment' ? 'Rear Camera' : 'Front Webcam'}
          </div>
        </div>

        {/* Bottom Control Bar */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setAutoScan(!autoScan)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium border flex items-center gap-1.5 cursor-pointer transition-all ${
                autoScan
                  ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {autoScan ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>Auto-Scan (3s)</span>
            </button>
          </div>

          {/* Big Snap Capture Button */}
          <button
            onClick={captureFrame}
            className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-extrabold text-sm shadow-xl shadow-amber-500/25 flex items-center gap-2 cursor-pointer transition-all active:scale-95"
          >
            <Camera className="w-4 h-4 fill-current" />
            <span>Snap & Identify Coin</span>
          </button>

          <div className="text-right">
            <button
              onClick={() => startCamera(facingMode)}
              title="Restart stream"
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900 border border-transparent hover:border-slate-800 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
