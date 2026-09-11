"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Search,
  Calendar,
  ChevronRight,
  MapPin,
  RefreshCw,
} from "lucide-react";
import { apiFetch, getToken } from "@/lib/api";
import GradeBadge from "@/components/ui/GradeBadge";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

interface Scan {
  _id: string;
  extracted_fields?: { commodity_name?: string; manufacturer_name?: string };
  overall_status: "compliant" | "non-compliant";
  violations_summary?: { total?: number; critical?: number; major?: number; minor?: number };
  location?: { lat: number; lng: number } | null;
  scanned_at: string;
}

const DATE_RANGES = [
  { label: "7 days", days: 7 },
  { label: "30 days", days: 30 },
  { label: "90 days", days: 90 },
  { label: "All time", days: 3650 },
];

export default function HistoryPage() {
  const router = useRouter();
  const [scans, setScans] = useState<Scan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState(30);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!getToken()) {
      router.replace("/?auth=login");
      return;
    }
    fetchScans();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router, dateRange]);

  const fetchScans = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    setLoading(true);
    setError(null);
    try {
      const statusParam = statusFilter !== "all" ? `&status=${statusFilter}` : "";
      const data = await apiFetch(`/scan?limit=200${statusParam}`);
      const rawScans = data.scans || [];
      const since = new Date();
      since.setDate(since.getDate() - dateRange);
      const parsed: Scan[] = rawScans
        .filter((s: Record<string, unknown>) => {
          const scannedAt = s.scanned_at ? new Date(s.scanned_at as string) : null;
          return scannedAt && scannedAt >= since;
        })
        .map((s: Record<string, unknown>) => ({
          _id: s._id as string,
          extracted_fields: s.extracted_fields as Scan["extracted_fields"],
          overall_status: s.overall_status as Scan["overall_status"],
          violations_summary: s.violations_summary as Scan["violations_summary"],
          location: s.location as Scan["location"],
          scanned_at: s.scanned_at as string,
        }));
      setScans(parsed);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load history");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [statusFilter, dateRange]);

  const filteredScans = useMemo(() => scans.filter((scan) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      scan.extracted_fields?.commodity_name?.toLowerCase().includes(q) ||
      scan.extracted_fields?.manufacturer_name?.toLowerCase().includes(q) ||
      scan._id.toLowerCase().includes(q)
    );
  }), [scans, search]);

  return (
    <div className="bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-10 py-6 sm:py-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link
              href="/dashboard"
              className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Dashboard
            </Link>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              Scan History
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Chronological record of all compliance scans
            </p>
          </div>
          <button
            onClick={() => fetchScans(true)}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 mt-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by product, manufacturer, or ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {["all", "compliant", "non-compliant"].map((f) => (
                <button
                  key={f}
                  onClick={() => setStatusFilter(f)}
                  className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    statusFilter === f
                      ? "bg-orange-600 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {f === "all" ? "All" : f === "compliant" ? "Compliant" : "Non-Compliant"}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            {DATE_RANGES.map((dr) => (
              <button
                key={dr.days}
                onClick={() => setDateRange(dr.days)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  dateRange === dr.days
                    ? "bg-slate-800 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {dr.label}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <LoadingSpinner text="Loading history..." />
        ) : filteredScans.length === 0 ? (
          <div className="text-center py-20">
            <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-lg font-semibold text-slate-700">No scans found</p>
            <p className="text-sm text-slate-500 mt-1">
              {search ? "Try a different search term" : "No scans in the selected time range"}
            </p>
          </div>
        ) : (
          <div className="mt-6 space-y-2">
            {filteredScans.map((scan) => (
              <Link
                key={scan._id}
                href={`/scan/${scan._id}`}
                className="block bg-white border border-slate-200 rounded-xl px-4 sm:px-6 py-4 hover:border-orange-300 hover:shadow-sm transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 min-w-0 flex-1">
                    <GradeBadge
                      percent={
                        scan.overall_status === "compliant" ? 100 :
                        Math.round(((scan.violations_summary?.total || 1) - (scan.violations_summary?.critical || 0)) /
                          Math.max(scan.violations_summary?.total || 1, 1) * 100)
                      }
                      size={36}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-slate-900 text-sm truncate">
                        {scan.extracted_fields?.commodity_name || "Unknown Product"}
                      </p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                        <span className="truncate max-w-[150px]">
                          {scan.extracted_fields?.manufacturer_name || "—"}
                        </span>
                        <span className="hidden sm:inline">·</span>
                        <span>
                          {new Date(scan.scanned_at).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        {scan.location && (
                          <>
                            <span className="hidden sm:inline">·</span>
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              Located
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        scan.overall_status === "compliant"
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {scan.overall_status}
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
