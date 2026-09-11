"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import {
  Camera,
  RotateCcw,
  Check,
  AlertTriangle,
} from "lucide-react";

interface CameraScannerProps {
  onCapture: (file: File) => void;
}

export default function CameraScanner({ onCapture }: CameraScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [useNativeCamera, setUseNativeCamera] = useState(false);
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    const hasMediaDevices = !!(
      navigator.mediaDevices && navigator.mediaDevices.getUserMedia
    );
    const isSecure =
      window.isSecureContext ||
      location.hostname === "localhost" ||
      location.hostname === "127.0.0.1";

    if (!hasMediaDevices || !isSecure) {
      setUseNativeCamera(true);
    }
  }, []);

  const stopCamera = useCallback(() => {
    setCameraReady(false);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  const startCamera = useCallback(async () => {
    try {
      stopCamera();
      setCameraError(null);
      setCameraReady(false);

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });
      streamRef.current = mediaStream;

      const video = videoRef.current;
      if (video) {
        video.srcObject = mediaStream;
        video.onloadedmetadata = () => {
          video
            .play()
            .then(() => setCameraReady(true))
            .catch(() => setCameraReady(true));
        };
        video.onerror = () => {
          setCameraError("Video playback error. Try the Upload tab.");
        };
      }
    } catch {
      setUseNativeCamera(true);
    }
  }, [stopCamera]);

  useEffect(() => {
    if (!useNativeCamera) {
      startCamera();
    }
    return () => stopCamera();
  }, [useNativeCamera, startCamera, stopCamera]);

  const handleNativeCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));
  };

  const capture = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const doCap = () => {
      setFlash(true);
      setTimeout(() => setFlash(false), 200);
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      stopCamera();
      setPreview(canvas.toDataURL("image/jpeg", 0.85));
    };

    if (!video.videoWidth || !video.videoHeight) {
      setTimeout(() => {
        if (video.videoWidth && video.videoHeight) doCap();
      }, 500);
      return;
    }
    doCap();
  }, [stopCamera]);

  const confirmCapture = () => {
    if (!preview) return;
    fetch(preview)
      .then((res) => res.blob())
      .then((blob) => {
        onCapture(new File([blob], "capture.jpg", { type: "image/jpeg" }));
      });
  };

  const retake = () => {
    if (preview && preview.startsWith("blob:")) URL.revokeObjectURL(preview);
    setPreview(null);
    if (useNativeCamera) {
      if (inputRef.current) inputRef.current.value = "";
    } else {
      startCamera();
    }
  };

  // ── Preview after capture ────────────────────────────────────────
  if (preview) {
    return (
      <div className="flex flex-col gap-5">
        <canvas ref={canvasRef} className="hidden" />

        {/* Image preview with shadow */}
        <div className="relative rounded-2xl overflow-hidden shadow-lg border border-gray-100">
          <img
            src={preview}
            alt="Captured"
            className="w-full max-h-[55vh] object-contain bg-gray-50"
          />
          <div className="absolute top-3 right-3 bg-black/50 backdrop-blur-sm text-white text-[10px] font-medium px-2 py-1 rounded-full">
            Captured
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 justify-center">
          <button
            onClick={retake}
            className="flex items-center gap-2.5 px-6 py-3 bg-white border-2 border-gray-200 hover:border-gray-400 hover:bg-gray-50 rounded-2xl text-sm font-semibold text-gray-700 transition-all active:scale-95"
          >
            <RotateCcw className="w-4 h-4" />
            Retake
          </button>
          <button
            onClick={confirmCapture}
            className="flex items-center gap-2.5 px-6 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white rounded-2xl text-sm font-semibold shadow-lg shadow-violet-200 transition-all active:scale-95"
          >
            <Check className="w-4 h-4" />
            Use This Photo
          </button>
        </div>
      </div>
    );
  }

  // ── Native camera fallback ───────────────────────────────────────
  if (useNativeCamera) {
    return (
      <div className="flex flex-col items-center gap-6 py-10">
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleNativeCapture}
          className="hidden"
        />

        {/* Animated camera icon */}
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-violet-100 animate-ping opacity-40" />
          <button
            onClick={() => inputRef.current?.click()}
            className="relative w-28 h-28 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white flex items-center justify-center transition-all shadow-xl shadow-violet-200 active:scale-95"
          >
            <Camera className="w-12 h-12" strokeWidth={1.5} />
          </button>
        </div>

        <div className="text-center space-y-1">
          <p className="text-sm font-semibold text-gray-800">
            Tap to open camera
          </p>
          <p className="text-xs text-gray-400 max-w-[220px]">
            If camera doesn&apos;t open, use the Upload tab instead
          </p>
        </div>
      </div>
    );
  }

  // ── Camera error ─────────────────────────────────────────────────
  if (cameraError) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-5">
        <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center">
          <AlertTriangle className="w-8 h-8 text-red-400" />
        </div>
        <div className="text-center space-y-1">
          <p className="text-sm font-semibold text-gray-800">
            Camera unavailable
          </p>
          <p className="text-xs text-gray-500 max-w-[260px]">{cameraError}</p>
        </div>
        <button
          onClick={startCamera}
          className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-sm font-medium transition-all active:scale-95"
        >
          <RotateCcw className="w-4 h-4" /> Try Again
        </button>
      </div>
    );
  }

  // ── Live camera ──────────────────────────────────────────────────
  return (
    <div className="flex flex-col items-center gap-5">
      <canvas ref={canvasRef} className="hidden" />

      {/* Camera feed */}
      <div className="relative w-full rounded-2xl overflow-hidden bg-gray-900 shadow-xl">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full max-h-[55vh] object-contain"
        />

        {/* Loading overlay */}
        {!cameraReady && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gray-900/80">
            <div className="w-10 h-10 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-gray-300 font-medium">
              Starting camera...
            </span>
          </div>
        )}

        {/* Flash effect */}
        {flash && (
          <div className="absolute inset-0 bg-white animate-[flash_0.2s_ease-out] pointer-events-none" />
        )}

        {/* Corner guides */}
        {cameraReady && (
          <>
            <div className="absolute top-4 left-4 w-10 h-10 border-t-2 border-l-2 border-white/70 rounded-tl-lg" />
            <div className="absolute top-4 right-4 w-10 h-10 border-t-2 border-r-2 border-white/70 rounded-tr-lg" />
            <div className="absolute bottom-4 left-4 w-10 h-10 border-b-2 border-l-2 border-white/70 rounded-bl-lg" />
            <div className="absolute bottom-4 right-4 w-10 h-10 border-b-2 border-r-2 border-white/70 rounded-br-lg" />
          </>
        )}
      </div>

      {/* Shutter button */}
      <div className="flex flex-col items-center gap-2">
        <button
          onClick={capture}
          disabled={!cameraReady}
          className="group relative w-[72px] h-[72px] rounded-full disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-90"
        >
          {/* Outer ring */}
          <div className="absolute inset-0 rounded-full border-[3px] border-gray-900 group-hover:border-violet-600 transition-colors" />
          {/* Inner circle */}
          <div className="absolute inset-[5px] rounded-full bg-gray-900 group-hover:bg-violet-600 transition-colors" />
          {/* Center dot */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-5 h-5 rounded-full bg-white/90" />
          </div>
        </button>
        <p className="text-[11px] text-gray-400 font-medium">
          {cameraReady ? "Tap to capture" : "Loading..."}
        </p>
      </div>
    </div>
  );
}
