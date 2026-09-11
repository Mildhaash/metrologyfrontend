"use client";

import { useEffect, useState } from "react";
import {
  Download,
  Calendar,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";
import { apiFetch, getApiBaseUrl, getToken } from "@/lib/api";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import ReportSummary from "@/components/reports/ReportSummary";
import ViolationBreakdown from "@/components/reports/ViolationBreakdown";
import ComplianceTrend from "@/components/reports/ComplianceTrend";

export default function ReportsPage() {
  const [days, setDays] = useState(30);
  const [summary, setSummary] = useState(null);
  const [violations, setViolations] = useState(null);
  const [trends, setTrends] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<"csv" | "pdf" | "xlsx">("csv");

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days]);

  const fetchAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const [s, v, t] = await Promise.all([
        apiFetch(`/reports/summary?days=${days}`),
        apiFetch(`/reports/violations?days=${days}`),
        apiFetch(`/reports/trends?days=${days}`),
      ]);
      setSummary(s);
      setViolations(v);
      setTrends(t);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load reports");
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      const token = getToken();
      const res = await fetch(
        `${getApiBaseUrl()}/reports/export?days=${days}&format=${exportFormat}`,
        {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        }
      );
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        let detail = text;
        try {
          detail = JSON.parse(text)?.detail || text;
        } catch {
          /* keep raw text */
        }
        throw new Error(detail || `Export failed (${res.status})`);
      }
      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      const ext = exportFormat === "xlsx" ? "xlsx" : exportFormat === "pdf" ? "pdf" : "csv";
      a.download = `report_${days}d.${ext}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Export failed");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="text-sm text-gray-500 mt-1">
            Compliance analytics and violation reports
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={exportFormat}
            onChange={(e) => setExportFormat(e.target.value as "csv" | "pdf" | "xlsx")}
            className="px-3 py-2 rounded-xl text-sm font-medium border border-gray-200 bg-white"
          >
            <option value="csv">CSV</option>
            <option value="pdf">PDF</option>
            <option value="xlsx">Excel</option>
          </select>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="flex items-center gap-2 px-5 py-2.5 bg-orange-600 hover:bg-orange-700 disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition-all"
          >
            <Download className="w-4 h-4" />
            {exporting ? "Exporting..." : "Export"}
          </button>
        </div>
      </div>

      {/* Period selector */}
      <div className="bg-white rounded-2xl border border-orange-100 shadow-sm p-4 flex items-center gap-3">
        <Calendar className="w-4 h-4 text-orange-500" />
        <span className="text-sm font-medium text-gray-700">Period:</span>
        {[7, 30, 90, 365].map((d) => (
          <button
            key={d}
            onClick={() => setDays(d)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              days === d
                ? "bg-orange-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-orange-50"
            }`}
          >
            {d}d
          </button>
        ))}
      </div>

      {loading ? (
        <LoadingSpinner text="Loading reports..." />
      ) : error ? (
        <div className="bg-amber-50 border border-amber-200 text-amber-700 rounded-xl p-4 text-sm space-y-3">
          <p>{error}</p>
          <p className="text-xs text-amber-600">
            Make sure the backend is running (e.g. `uvicorn main:app --port
            8000` in `backend/`) and MongoDB is connected (MONGODB_URI in
            `backend/.env`).
          </p>
          <button
            onClick={fetchAll}
            className="px-4 py-1.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold rounded-lg transition-all"
          >
            Retry
          </button>
        </div>
      ) : (
        <>
          {summary && <ReportSummary summary={summary} />}

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-orange-100 shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-500" />
                Violation Breakdown
              </h2>
              {violations && <ViolationBreakdown data={violations} />}
            </div>

            <div className="bg-white rounded-2xl border border-orange-100 shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-orange-500" />
                Compliance Trend
              </h2>
              {trends && <ComplianceTrend data={trends} />}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
