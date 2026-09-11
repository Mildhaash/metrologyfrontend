"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import {
  AlertCircle,
  ArrowRight,
  Camera,
  Upload,
  ScanLine,
  CheckCircle2,
  MapPin,
  Loader2,
} from "lucide-react";
const CameraScanner = dynamic(() => import("@/components/scanner/cameraScanner"), { ssr: false });
import FileUploader from "@/components/scanner/fileUploader";
import { apiFetch, getToken } from "@/lib/api";
import useGeolocation from "@/hooks/useGeolocation";

type Tab = "camera" | "upload";

// Downscale the uploaded label to a small JPEG data URL so it can be stored
// alongside the scan JSON in localStorage and shown on the result page.
function fileToDataUrl(
  file: File,
  maxDim = 900,
  quality = 0.72
): Promise<string | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      try {
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const w = Math.max(1, Math.round(img.width * scale));
        const h = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          URL.revokeObjectURL(url);
          resolve(null);
          return;
        }
        ctx.drawImage(img, 0, 0, w, h);
        URL.revokeObjectURL(url);
        resolve(canvas.toDataURL("image/jpeg", quality));
      } catch {
        URL.revokeObjectURL(url);
        resolve(null);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };
    img.src = url;
  });
}

function saveScan(id: string, apiData: unknown, imageDataUrl: string | null) {
  const payload = {
    ...(apiData as Record<string, unknown>),
    image_data_url: imageDataUrl,
    scanned_at: new Date().toISOString(),
  };
  try {
    localStorage.setItem(`scan_${id}`, JSON.stringify(payload));
  } catch {
    // Quota exceeded — retry without the image so results still open.
    try {
      localStorage.setItem(`scan_${id}`, JSON.stringify(apiData));
    } catch {
      /* storage unavailable; result page will show "not found" */
    }
  }
}

export default function ScanPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("camera");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { status: geoStatus, waitForLocation, request } = useGeolocation();

  const handleScan = async () => {
    if (!selectedFile) return;

    setLoading(true);
    setError(null);

    const loc = await waitForLocation();

    const formData = new FormData();
    formData.append("file", selectedFile);

    if (loc) {
      formData.append("lat", loc.lat.toString());
      formData.append("lng", loc.lng.toString());
    }

    try {
      const imageDataUrl = await fileToDataUrl(selectedFile);
      if (getToken()) {
        const token = getToken();
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/scan/upload`,
          {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
            body: formData,
          }
        );
        if (!res.ok) throw new Error("Scan failed");
        const uploadData = await res.json();

        const fullScan = await apiFetch(`/scan/${uploadData.scan_id}`);
        const id = uploadData.scan_id;
        saveScan(id, fullScan, imageDataUrl);
        router.push(`/scan/${id}`);
      } else {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/test/scan`,
          { method: "POST", body: formData }
        );
        if (!res.ok) throw new Error("Scan failed");
        const data = await res.json();
        const id = Date.now().toString();
        saveScan(id, data, imageDataUrl);
        router.push(`/scan/${id}`);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Scan Label</h1>
        <p className="text-sm text-gray-500 mt-1">
          Capture or upload a label to check compliance
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-orange-100 shadow-[0_4px_30px_rgba(234,88,12,0.06)] overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-orange-100">
          <button
            onClick={() => {
              setActiveTab("camera");
              setSelectedFile(null);
              setError(null);
            }}
            className={`flex-1 flex items-center justify-center gap-2.5 py-4 text-sm font-semibold transition-all relative ${
              activeTab === "camera"
                ? "text-orange-600"
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            <Camera className="w-4 h-4" />
            Camera
            {activeTab === "camera" && (
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-0.5 bg-orange-600 rounded-full" />
            )}
          </button>
          <div className="w-px bg-orange-100 my-3" />
          <button
            onClick={() => {
              setActiveTab("upload");
              setSelectedFile(null);
              setError(null);
            }}
            className={`flex-1 flex items-center justify-center gap-2.5 py-4 text-sm font-semibold transition-all relative ${
              activeTab === "upload"
                ? "text-orange-600"
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            <Upload className="w-4 h-4" />
            Upload
            {activeTab === "upload" && (
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-0.5 bg-orange-600 rounded-full" />
            )}
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <div className="relative">
                <div className="w-14 h-14 rounded-full border-4 border-orange-100 border-t-orange-600 animate-spin" />
                <ScanLine className="w-5 h-5 text-orange-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
              </div>
              <div className="text-center space-y-1">
                <p className="text-sm font-semibold text-gray-800">
                  Analyzing label...
                </p>
                <p className="text-xs text-gray-400">
                  This may take a few seconds
                </p>
              </div>
            </div>
          ) : activeTab === "camera" ? (
            <CameraScanner onCapture={setSelectedFile} />
          ) : (
            <FileUploader onFileSelect={setSelectedFile} />
          )}
        </div>

        {/* File selected indicator */}
        {selectedFile && !loading && (
          <div className="mx-6 mb-4 flex items-center gap-2 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-xl">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span className="text-xs font-medium text-emerald-700 truncate">
              {selectedFile.name}
            </span>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mx-6 mb-4">
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <p className="text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Tips */}
        <div className="mx-6 mb-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-100 rounded-2xl p-4">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-xs">💡</span>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-semibold text-amber-800">
                Scanning Tips
              </p>
              <ul className="text-[11px] text-amber-700/80 space-y-0.5">
                <li>• Ensure label is flat and well-lit</li>
                <li>• MRP, date &amp; quantity must be visible</li>
                <li>• Avoid glare and shadows on the label</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Location Status — always visible */}
        <div className="mx-6 mb-4">
          <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium ${
            geoStatus === "granted"
              ? "bg-emerald-50 border border-emerald-200 text-emerald-700"
              : geoStatus === "loading"
              ? "bg-blue-50 border border-blue-200 text-blue-700"
              : geoStatus === "denied" || geoStatus === "unavailable"
              ? "bg-red-50 border border-red-200 text-red-700"
              : "bg-amber-50 border border-amber-200 text-amber-700"
          }`}>
            {geoStatus === "granted" ? (
              <MapPin className="w-3.5 h-3.5" />
            ) : geoStatus === "loading" ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <MapPin className="w-3.5 h-3.5" />
            )}
            {geoStatus === "granted"
              ? "Location captured for violation mapping"
              : geoStatus === "loading"
              ? "Requesting location permission..."
              : geoStatus === "denied"
              ? "Location access denied — scans won't appear on map"
              : geoStatus === "unavailable"
              ? "Location unavailable — scans won't appear on map"
              : "Enable location to see scans on the map"}
            {geoStatus !== "granted" && geoStatus !== "loading" && (
              <button
                onClick={request}
                className="ml-2 underline font-bold hover:text-orange-600"
              >
                Enable
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Analyze Button */}
      <div className="flex justify-center">
        <button
          onClick={handleScan}
          disabled={!selectedFile || loading}
          className="group flex items-center gap-3 px-8 py-3.5 text-sm font-bold text-white bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 disabled:from-gray-200 disabled:to-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed rounded-2xl transition-all shadow-lg shadow-orange-200/50 disabled:shadow-none active:scale-[0.98]"
        >
          <ScanLine className="w-4 h-4" />
          {loading ? "Scanning..." : "Analyze Product"}
          {!loading && (
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          )}
        </button>
      </div>
    </div>
  );
}
