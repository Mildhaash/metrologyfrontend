"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Search,
  ChevronDown,
  ChevronUp,
  MapPin,
  Calendar,
  CheckCircle2,
  Loader2,
  Save,
  Check,
} from "lucide-react";
import { apiFetch, getToken } from "@/lib/api";
import SeverityBadge from "@/components/ui/SeverityBadge";
import GradeBadge from "@/components/ui/GradeBadge";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

interface Violation {
  _id: string;
  scan_id: string;
  rule_id: string;
  rule_section: string;
  field: string;
  severity: "critical" | "major" | "minor" | "needs_review";
  status: string;
  message: string;
  suggestion: string;
  resolution_status: "pending" | "in_progress" | "resolved";
  assigned_to: string | null;
  due_date: string | null;
  resolution_notes: string | null;
  resolved_at: string | null;
  created_at: string;
}

interface Scan {
  _id: string;
  extracted_fields?: { commodity_name?: string; manufacturer_name?: string };
  overall_status: "compliant" | "non-compliant";
  violations_summary?: { critical?: number; major?: number; minor?: number; needs_review?: number };
  location?: { lat: number; lng: number } | null;
  violations: Violation[];
  scanned_at: string;
}

const STATUS_OPTIONS = ["pending", "in_progress", "resolved"] as const;

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800 border-amber-300",
  in_progress: "bg-blue-100 text-blue-800 border-blue-300",
  resolved: "bg-green-100 text-green-800 border-green-300",
};

const FILTER_OPTIONS = [
  { key: "all", label: "All" },
  { key: "compliant", label: "Compliant" },
  { key: "non-compliant", label: "Non-Compliant" },
  { key: "pending", label: "Pending" },
  { key: "resolved", label: "Resolved" },
] as const;

export default function InspectionsPage() {
  const router = useRouter();
  const [scans, setScans] = useState<Scan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [expandedScan, setExpandedScan] = useState<string | null>(null);
  const [updatingViolation, setUpdatingViolation] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!getToken()) {
      router.replace("/?auth=login");
      return;
    }
    fetchScans();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  const fetchScans = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch("/scan?limit=100");
      const rawScans = data.scans || [];
      const parsed: Scan[] = rawScans.map((s: Record<string, unknown>) => ({
        _id: s._id as string,
        extracted_fields: s.extracted_fields as Scan["extracted_fields"],
        overall_status: s.overall_status as Scan["overall_status"],
        violations_summary: s.violations_summary as Scan["violations_summary"],
        location: s.location as Scan["location"],
        scanned_at: s.scanned_at as string,
        violations: Array.isArray(s.violations) ? (s.violations as Record<string, unknown>[]).map((v) => ({
          _id: (v._id as string) || "",
          scan_id: (v.scan_id as string) || "",
          rule_id: (v.rule_id as string) || "",
          rule_section: (v.rule_section as string) || "",
          field: (v.field as string) || "",
          severity: (v.severity as Violation["severity"]) || "major",
          status: (v.status as string) || "",
          message: (v.message as string) || "",
          suggestion: (v.suggestion as string) || "",
          resolution_status: (v.resolution_status as Violation["resolution_status"]) || "pending",
          assigned_to: (v.assigned_to as string) || null,
          due_date: (v.due_date as string) || null,
          resolution_notes: (v.resolution_notes as string) || null,
          resolved_at: (v.resolved_at as string) || null,
          created_at: (v.created_at as string) || "",
        })) : [],
      }));
      setScans(parsed);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load inspections");
    } finally {
      setLoading(false);
    }
  }, []);

  const updateViolation = async (
    scanId: string,
    violationId: string,
    updates: { resolution_status?: string; assigned_to?: string; due_date?: string; resolution_notes?: string }
  ) => {
    setUpdatingViolation(violationId);
    try {
      await apiFetch(`/scan/${scanId}/violations/${violationId}`, {
        method: "PATCH",
        body: JSON.stringify(updates),
      });

      setScans((prev) =>
        prev.map((scan) => {
          if (scan._id !== scanId) return scan;
          return {
            ...scan,
            violations: scan.violations.map((v) =>
              v._id === violationId ? { ...v, ...updates } : v
            ),
          };
        })
      );

      setSaveSuccess(violationId);
      setTimeout(() => setSaveSuccess(null), 2000);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to update violation");
      setTimeout(() => setError(null), 3000);
    } finally {
      setUpdatingViolation(null);
    }
  };

  const isSafeViolation = (v: unknown): v is Violation => {
    return typeof v === "object" && v !== null && "_id" in v && "resolution_status" in v;
  };

  const filteredScans = useMemo(() => scans.filter((scan) => {
    const matchesSearch =
      !search ||
      scan.extracted_fields?.commodity_name?.toLowerCase().includes(search.toLowerCase()) ||
      scan.extracted_fields?.manufacturer_name?.toLowerCase().includes(search.toLowerCase()) ||
      scan._id.toLowerCase().includes(search.toLowerCase());

    if (statusFilter === "all") return matchesSearch;
    if (statusFilter === "compliant") return matchesSearch && scan.overall_status === "compliant";
    if (statusFilter === "non-compliant") return matchesSearch && scan.overall_status === "non-compliant";

    const validViolations = scan.violations.filter(isSafeViolation);
    if (validViolations.length === 0) return false;

    if (statusFilter === "pending") {
      return matchesSearch && validViolations.some((v) => v.resolution_status === "pending");
    }
    if (statusFilter === "resolved") {
      return matchesSearch && validViolations.some((v) => v.resolution_status === "resolved");
    }
    return matchesSearch;
  }), [scans, search, statusFilter]);

  const totalViolations = scans.reduce(
    (sum, s) => sum + s.violations.filter(isSafeViolation).length,
    0
  );
  const pendingViolations = scans.reduce(
    (sum, s) => sum + s.violations.filter(isSafeViolation).filter((v) => v.resolution_status === "pending").length,
    0
  );

  return (
    <div className="bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-10 py-6 sm:py-10">
        {/* Header */}
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
              Inspections
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Manage and resolve compliance violations
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-white border border-slate-200 rounded-lg px-4 py-2 text-sm">
              <span className="text-slate-500">Pending: </span>
              <span className="font-bold text-amber-600">{pendingViolations}</span>
              <span className="text-slate-400 mx-1">/</span>
              <span className="text-slate-500">Total: </span>
              <span className="font-bold text-slate-700">{totalViolations}</span>
            </div>
            <button
              onClick={() => fetchScans()}
              className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Refresh
            </button>
          </div>
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
              {FILTER_OPTIONS.map((f) => (
                <button
                  key={f.key}
                  onClick={() => setStatusFilter(f.key)}
                  className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    statusFilter === f.key
                      ? "bg-orange-600 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Global Messages */}
        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm flex items-center gap-2">
            {error}
          </div>
        )}

        {/* Content */}
        {loading ? (
          <LoadingSpinner text="Loading inspections..." />
        ) : filteredScans.length === 0 ? (
          <div className="text-center py-20">
            <CheckCircle2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-lg font-semibold text-slate-700">No inspections found</p>
            <p className="text-sm text-slate-500 mt-1">
              {search ? "Try a different search term" : "Scan some labels to see inspections here"}
            </p>
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            {filteredScans.map((scan) => {
              const isExpanded = expandedScan === scan._id;
              const validViolations = scan.violations.filter(isSafeViolation);
              const pendingCount = validViolations.filter((v) => v.resolution_status === "pending").length;

              return (
                <div
                  key={scan._id}
                  className="bg-white border border-slate-200 rounded-xl overflow-hidden"
                >
                  {/* Scan Header Row */}
                  <button
                    onClick={() => setExpandedScan(isExpanded ? null : scan._id)}
                    className="w-full flex items-center justify-between px-4 sm:px-6 py-4 text-left hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-4 min-w-0 flex-1">
                      <div className="flex-shrink-0">
                        <GradeBadge
                          percent={
                            validViolations.length === 0
                              ? 100
                              : Math.round(
                                  ((validViolations.length - pendingCount) /
                                    Math.max(validViolations.length, 1)) *
                                    100
                                )
                          }
                          size={40}
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-bold text-slate-900 text-sm truncate">
                            {scan.extracted_fields?.commodity_name || "Unknown Product"}
                          </p>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              scan.overall_status === "compliant"
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {scan.overall_status}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                          <span className="truncate max-w-[150px]">{scan.extracted_fields?.manufacturer_name || "—"}</span>
                          <span className="hidden sm:inline">·</span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(scan.scanned_at).toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
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
                      {validViolations.length > 0 && (
                        <div className="text-right">
                          <p className="text-xs text-slate-500">
                            {validViolations.length} violation{validViolations.length !== 1 ? "s" : ""}
                          </p>
                          {pendingCount > 0 && (
                            <p className="text-[10px] text-amber-600 font-medium">
                              {pendingCount} pending
                            </p>
                          )}
                        </div>
                      )}
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-slate-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-slate-400" />
                      )}
                    </div>
                  </button>

                  {/* Expanded Violations */}
                  {isExpanded && (
                    <div className="border-t border-slate-100 px-4 sm:px-6 py-4 space-y-3">
                      {validViolations.length === 0 ? (
                        <p className="text-sm text-slate-500 text-center py-4">
                          No violations — this product is fully compliant.
                        </p>
                      ) : (
                        validViolations.map((violation) => (
                          <ViolationRow
                            key={violation._id}
                            violation={violation}
                            scanId={scan._id}
                            onUpdate={updateViolation}
                            isUpdating={updatingViolation === violation._id}
                            isSuccess={saveSuccess === violation._id}
                          />
                        ))
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function ViolationRow({
  violation,
  scanId,
  onUpdate,
  isUpdating,
  isSuccess,
}: {
  violation: Violation;
  scanId: string;
  onUpdate: (
    scanId: string,
    violationId: string,
    updates: { resolution_status?: string; assigned_to?: string; due_date?: string; resolution_notes?: string }
  ) => Promise<void>;
  isUpdating: boolean;
  isSuccess: boolean;
}) {
  const [status, setStatus] = useState(violation.resolution_status);
  const [assignedTo, setAssignedTo] = useState(violation.assigned_to || "");
  const [dueDate, setDueDate] = useState(violation.due_date || "");
  const [notes, setNotes] = useState(violation.resolution_notes || "");
  const [hasChanges, setHasChanges] = useState(false);

  const handleSave = async () => {
    await onUpdate(scanId, violation._id, {
      resolution_status: status,
      assigned_to: assignedTo || undefined,
      due_date: dueDate || undefined,
      resolution_notes: notes || undefined,
    });
    setHasChanges(false);
  };

  return (
    <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
      <div className="flex flex-col sm:flex-row sm:items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <SeverityBadge severity={violation.severity} />
            <span className="text-xs text-slate-500 font-mono">{violation.rule_id}</span>
          </div>
          <p className="text-sm font-medium text-slate-800">{violation.message}</p>
          {violation.suggestion && (
            <p className="text-xs text-slate-500 mt-1">Fix: {violation.suggestion}</p>
          )}
        </div>

        <div className="flex flex-col gap-2 sm:w-64 flex-shrink-0">
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as typeof status);
              setHasChanges(true);
            }}
            className={`px-2 py-1.5 rounded-lg text-xs font-medium border ${STATUS_COLORS[status]}`}
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt === "pending" ? "Pending" : opt === "in_progress" ? "In Progress" : "Resolved"}
              </option>
            ))}
          </select>

          <input
            type="text"
            placeholder="Assign to..."
            value={assignedTo}
            onChange={(e) => {
              setAssignedTo(e.target.value);
              setHasChanges(true);
            }}
            className="px-2 py-1.5 rounded-lg text-xs border border-slate-200 bg-white"
          />

          <input
            type="date"
            value={dueDate}
            onChange={(e) => {
              setDueDate(e.target.value);
              setHasChanges(true);
            }}
            className="px-2 py-1.5 rounded-lg text-xs border border-slate-200 bg-white"
          />

          <textarea
            placeholder="Resolution notes..."
            value={notes}
            onChange={(e) => {
              setNotes(e.target.value);
              setHasChanges(true);
            }}
            rows={2}
            className="px-2 py-1.5 rounded-lg text-xs border border-slate-200 bg-white resize-none"
          />

          {(hasChanges || isUpdating || isSuccess) && (
            <button
              onClick={handleSave}
              disabled={isUpdating || isSuccess}
              className={`flex items-center justify-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors disabled:opacity-50 ${
                isSuccess
                  ? "bg-green-600 text-white"
                  : "bg-orange-600 hover:bg-orange-700 text-white"
              }`}
          >
            {isUpdating ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : isSuccess ? (
              <Check className="w-3 h-3" />
            ) : (
              <Save className="w-3 h-3" />
            )}
            {isSuccess ? "Saved" : "Save"}
          </button>
          )}
        </div>
      </div>
    </div>
  );
}
