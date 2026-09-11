"use client";

import dynamic from "next/dynamic";
import { useState, useEffect, useCallback, useRef } from "react";
import { apiFetch, getToken } from "@/lib/api";
import { MapPin, AlertTriangle, Loader2, RefreshCw } from "lucide-react";

const MapView = dynamic(() => import("./MapView"), { ssr: false });

interface ScanInspection {
  _id: string;
  extracted_fields?: { commodity_name?: string; manufacturer_name?: string };
  overall_status: "compliant" | "non-compliant";
  violations_summary?: { critical?: number; major?: number; minor?: number; needs_review?: number };
  location?: { lat: number; lng: number } | null;
  address?: string | null;
  scanned_at: string;
}

interface MapInspection {
  id: string;
  product: string;
  manufacturer: string;
  lat: number;
  lng: number;
  status: "compliant" | "non-compliant";
  violations: number;
  maxSeverity: string;
  time: string;
  address: string | null;
}

const SEVERITY_COLORS: Record<string, string> = {
  critical: "#DC2626",
  major: "#EA580C",
  minor: "#CA8A04",
  needs_review: "#9333EA",
};

function getMaxSeverity(summary?: Record<string, number>): string {
  if (!summary) return "major";
  if ((summary.critical || 0) > 0) return "critical";
  if ((summary.major || 0) > 0) return "major";
  if ((summary.needs_review || 0) > 0) return "needs_review";
  return "minor";
}

function getTotalViolations(summary?: Record<string, number>): number {
  if (!summary) return 0;
  return (summary.critical || 0) + (summary.major || 0) + (summary.minor || 0) + (summary.needs_review || 0);
}

export default function MapsPage() {
  const [inspections, setInspections] = useState<MapInspection[]>([]);
  const [selectedInspection, setSelectedInspection] = useState<MapInspection | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchScans = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    try {
      const data = await apiFetch("/scan?limit=100");
      const scans: ScanInspection[] = data.scans || [];

      const withLocation = scans
        .filter((s) => s.location && s.location.lat && s.location.lng)
        .map((s) => ({
          id: s._id,
          product: s.extracted_fields?.commodity_name || "Unknown product",
          manufacturer: s.extracted_fields?.manufacturer_name || "Unknown",
          lat: s.location!.lat,
          lng: s.location!.lng,
          status: s.overall_status,
          violations: getTotalViolations(s.violations_summary),
          maxSeverity: getMaxSeverity(s.violations_summary),
          time: new Date(s.scanned_at).toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
          }),
          address: s.address || null,
        }));

      setInspections(withLocation);
      setLastUpdated(new Date());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load scans");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (!getToken()) {
      setError("Please log in to view the violation map");
      setLoading(false);
      return;
    }
    fetchScans();

    intervalRef.current = setInterval(() => {
      fetchScans();
    }, 30000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchScans]);

  const total = inspections.length;
  const nonCompliant = inspections.filter((i) => i.status === "non-compliant").length;
  const compliant = total - nonCompliant;

  return (
    <div className="cc-page">
      <style>{`
        .cc-page {
          padding: 0;
          box-sizing: border-box;
        }
        .cc-card {
          font-family: sans-serif;
          border: 1px solid #d1d5db;
          border-radius: 14px;
          overflow: hidden;
          box-shadow: 0 4px 16px rgba(0,0,0,0.08);
          max-width: 1100px;
          margin: 0 auto;
          background: white;
        }
        .cc-header {
          padding: 18px 22px;
          background: #1f2937;
          color: white;
        }
        .cc-title {
          margin: 0;
          font-size: 22px;
        }
        .cc-subtitle {
          margin: 4px 0 0;
          font-size: 13px;
          color: #cbd5e1;
        }
        .cc-stats {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-top: 14px;
        }
        .cc-stat-card {
          border-radius: 8px;
          padding: 8px 14px;
          min-width: 110px;
          flex: 1 1 110px;
          color: #1f2937;
        }
        .cc-stat-value {
          font-size: 18px;
          font-weight: 700;
        }
        .cc-stat-label {
          font-size: 11px;
        }
        .cc-legend {
          display: flex;
          flex-wrap: wrap;
          gap: 10px 18px;
          padding: 10px 22px;
          background: #f9fafb;
          border-bottom: 1px solid #e5e7eb;
          font-size: 13px;
        }
        .cc-legend-hint {
          color: #9ca3af;
        }
        .cc-body {
          display: flex;
          height: 520px;
        }
        .cc-map-container {
          flex: 1;
          position: relative;
        }
        .cc-side-panel {
          width: 280px;
          flex-shrink: 0;
          padding: 18px;
          border-left: 1px solid #e5e7eb;
          background: #fafafa;
          overflow-y: auto;
        }
        .cc-report-btn {
          margin-top: 14px;
          width: 100%;
          padding: 10px;
          background: #1f2937;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
        }
        @media (max-width: 900px) {
          .cc-body { height: 460px; }
          .cc-side-panel { width: 240px; }
        }
        @media (max-width: 640px) {
          .cc-card { border-radius: 10px; }
          .cc-header { padding: 14px 16px; }
          .cc-title { font-size: 18px; }
          .cc-subtitle { font-size: 12px; }
          .cc-stat-card { min-width: 0; flex: 1 1 calc(50% - 5px); padding: 8px 10px; }
          .cc-legend { padding: 8px 16px; font-size: 12px; }
          .cc-legend-hint { width: 100%; font-size: 11px; }
          .cc-body { flex-direction: column; height: auto; }
          .cc-map-container { flex: 0 0 340px; height: 340px; width: 100%; }
          .cc-side-panel { width: 100%; border-left: none; border-top: 1px solid #e5e7eb; }
        }
      `}</style>

      <div className="cc-card">
        {/* HEADER */}
        <div className="cc-header">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <h2 className="cc-title">Geographic Violation Map</h2>
              <p className="cc-subtitle">
                Inspections grouped by location — click a marker for details
                {lastUpdated && (
                  <span style={{ marginLeft: "8px", opacity: 0.7 }}>
                    Updated {Math.round((Date.now() - lastUpdated.getTime()) / 1000)}s ago
                  </span>
                )}
              </p>
            </div>
            <button
              onClick={() => fetchScans(true)}
              disabled={refreshing}
              style={{
                background: "rgba(255,255,255,0.15)",
                border: "none",
                borderRadius: "6px",
                padding: "6px 10px",
                color: "white",
                cursor: refreshing ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                gap: "4px",
                fontSize: "12px",
                opacity: refreshing ? 0.6 : 1,
              }}
            >
              <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
              Refresh
            </button>
          </div>
          <div className="cc-stats">
            <div className="cc-stat-card" style={{ background: "#e5e7eb" }}>
              <div className="cc-stat-value">{total}</div>
              <div className="cc-stat-label">Total Inspections</div>
            </div>
            <div className="cc-stat-card" style={{ background: "#86efac" }}>
              <div className="cc-stat-value">{compliant}</div>
              <div className="cc-stat-label">Compliant</div>
            </div>
            <div className="cc-stat-card" style={{ background: "#fca5a5" }}>
              <div className="cc-stat-value">{nonCompliant}</div>
              <div className="cc-stat-label">Non-Compliant</div>
            </div>
            <div className="cc-stat-card" style={{ background: "#fdba74" }}>
              <div className="cc-stat-value">{total ? `${Math.round((nonCompliant / total) * 100)}%` : "0%"}</div>
              <div className="cc-stat-label">Violation Rate</div>
            </div>
          </div>
        </div>

        {/* LEGEND */}
        <div className="cc-legend">
          <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#43a047", display: "inline-block" }} />
            Compliant
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: SEVERITY_COLORS.critical, display: "inline-block" }} />
            Critical
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: SEVERITY_COLORS.major, display: "inline-block" }} />
            Major
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: SEVERITY_COLORS.minor, display: "inline-block" }} />
            Minor
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: SEVERITY_COLORS.needs_review, display: "inline-block" }} />
            Needs Review
          </span>
          <span className="cc-legend-hint">Click a marker for details</span>
        </div>

        {/* MAP + SIDE PANEL */}
        <div className="cc-body">
          <div className="cc-map-container">
            {loading ? (
              <div className="flex items-center justify-center h-full bg-gray-50">
                <div className="flex items-center gap-2 text-gray-400">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="text-sm">Loading scans...</span>
                </div>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center h-full bg-gray-50">
                <div className="text-center text-gray-500">
                  <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-amber-400" />
                  <p className="text-sm">{error}</p>
                </div>
              </div>
            ) : inspections.length === 0 ? (
              <div className="flex items-center justify-center h-full bg-gray-50">
                <div className="text-center text-gray-500">
                  <MapPin className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm font-medium">No location data yet</p>
                  <p className="text-xs text-gray-400 mt-1">Scan labels with location enabled to see them on the map</p>
                </div>
              </div>
            ) : (
              <MapView
                inspections={inspections}
                onSelect={setSelectedInspection}
              />
            )}
          </div>

          {selectedInspection && (
            <div className="cc-side-panel">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3 style={{ margin: 0, fontSize: "14px" }}>{selectedInspection.product}</h3>
                <button
                  onClick={() => setSelectedInspection(null)}
                  style={{ border: "none", background: "none", cursor: "pointer", fontSize: 16 }}
                >
                  &#x2715;
                </button>
              </div>

              <p style={{ margin: "8px 0 4px", fontSize: "12px", color: "#6b7280" }}>
                {selectedInspection.manufacturer}
              </p>
              <p style={{ margin: "4px 0", fontSize: "12px", color: "#6b7280" }}>
                &#x1F550; {selectedInspection.time}
              </p>
              {selectedInspection.address && (
                <p style={{ margin: "4px 0", fontSize: "11px", color: "#9ca3af", lineHeight: "1.4" }}>
                  &#x1F4CD; {selectedInspection.address}
                </p>
              )}

              <p style={{ margin: "10px 0 4px" }}>
                {selectedInspection.status === "non-compliant" ? (
                  <strong style={{ color: SEVERITY_COLORS[selectedInspection.maxSeverity] || "#e53935" }}>
                    &#x1F534; Non-Compliant
                  </strong>
                ) : (
                  <strong style={{ color: "#43a047" }}>&#x1F7E2; Compliant</strong>
                )}
              </p>

              {selectedInspection.status === "non-compliant" && (
                <p style={{ margin: "4px 0", fontSize: "13px" }}>
                  {selectedInspection.violations} violation{selectedInspection.violations !== 1 ? "s" : ""} found
                </p>
              )}

              <button className="cc-report-btn" onClick={() => window.open(`/scan/${selectedInspection.id}`, "_blank")}>
                View Complete Report
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
