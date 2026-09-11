"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Upload,
  Loader2,
  CheckCircle2,
  XCircle,
  FileImage,
} from "lucide-react";
import { getToken } from "@/lib/api";

interface BatchResult {
  filename: string;
  scan_id: string | null;
  status: string;
  violations_count: number;
  product_name: string | null;
  error?: string;
}

interface BatchResponse {
  total: number;
  successful: number;
  compliant: number;
  non_compliant: number;
  results: BatchResult[];
}

export default function BatchScanPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<BatchResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    setFiles((prev) => [...prev, ...selected]);
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleBatchScan = async () => {
    if (files.length === 0) return;
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      files.forEach((f) => formData.append("files", f));

      const token = getToken();
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/scan/batch`,
        {
          method: "POST",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          body: formData,
        }
      );
      if (!res.ok) throw new Error("Batch scan failed");
      const data = await res.json();
      setResult(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Batch scan failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-10 py-6 sm:py-10">
        <Link
          href="/dashboard/scan"
          className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Scan
        </Link>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
          Batch Scan
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Upload multiple label images for compliance checking
        </p>

        {/* Upload Area */}
        <div className="mt-6 bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center cursor-pointer hover:border-orange-400 hover:bg-orange-50 transition-colors"
          >
            <Upload className="w-8 h-8 text-slate-400 mx-auto mb-3" />
            <p className="text-sm font-medium text-slate-700">
              Click to select images or drag and drop
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Supports JPG, PNG — up to 20 files at once
            </p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={handleFiles}
            className="hidden"
          />

          {/* File List */}
          {files.length > 0 && (
            <div className="mt-4 space-y-2">
              {files.map((f, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between px-3 py-2 bg-slate-50 rounded-lg"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <FileImage className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    <span className="text-sm text-slate-700 truncate">{f.name}</span>
                    <span className="text-xs text-slate-400">
                      {(f.size / 1024 / 1024).toFixed(1)} MB
                    </span>
                  </div>
                  <button
                    onClick={() => removeFile(i)}
                    className="text-slate-400 hover:text-red-500 text-xs ml-2"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}

          {files.length > 0 && (
            <button
              onClick={handleBatchScan}
              disabled={loading}
              className="mt-4 w-full flex items-center justify-center gap-2 px-5 py-3 bg-orange-600 hover:bg-orange-700 disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition-all"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
              {loading
                ? `Scanning ${files.length} files...`
                : `Scan ${files.length} Files`}
            </button>
          )}
        </div>

        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm">
            {error}
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="mt-6 bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Batch Results</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              <div className="bg-slate-50 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-slate-900">{result.total}</p>
                <p className="text-xs text-slate-500">Total</p>
              </div>
              <div className="bg-green-50 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-green-700">{result.compliant}</p>
                <p className="text-xs text-slate-500">Compliant</p>
              </div>
              <div className="bg-red-50 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-red-700">{result.non_compliant}</p>
                <p className="text-xs text-slate-500">Non-Compliant</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-slate-900">{result.successful}</p>
                <p className="text-xs text-slate-500">Processed</p>
              </div>
            </div>

            <div className="space-y-2">
              {result.results.map((r, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between px-4 py-3 bg-slate-50 rounded-lg"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {r.status === "error" ? (
                      <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                    ) : r.status === "compliant" ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                    ) : (
                      <XCircle className="w-5 h-5 text-orange-500 flex-shrink-0" />
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">
                        {r.product_name || r.filename}
                      </p>
                      <p className="text-xs text-slate-500">
                        {r.filename}
                        {r.violations_count > 0 && ` · ${r.violations_count} violations`}
                      </p>
                    </div>
                  </div>
                  {r.scan_id && (
                    <Link
                      href={`/scan/${r.scan_id}`}
                      className="text-xs text-orange-600 hover:text-orange-700 font-medium ml-2 flex-shrink-0"
                    >
                      View
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
