"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Check,
  X,
  AlertTriangle,
  Download,
  RotateCw,
  ChevronDown,
  ScanLine,
} from "lucide-react";
import GradeBadge from "@/components/ui/GradeBadge";
import { SeverityDot, type Severity } from "@/components/ui/SeverityBadge";

// ── Types (normalized — page.tsx converts both backend shapes into this) ──
export interface ScanViolation {
  rule_id?: string;
  rule_section?: string;
  section?: string;
  field: string;
  message: string;
  severity?: string;
  suggestion?: string;
}

export interface ScanPassed {
  rule_id?: string;
  rule_section?: string;
  section?: string;
  field: string;
  message?: string;
}

export interface ScanValidation {
  overall_status: string;
  violations: ScanViolation[];
  passed: ScanPassed[];
  summary: { total_checks: number; passed: number; failed: number };
}

// Bounding box in 0-1000 normalized coords (x=left, y=top), from backend `field_boxes`
export interface FieldBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface ScanResultViewProps {
  scanId?: string | null;
  extractedFields: Record<string, string | null>;
  validation: ScanValidation;
  ocrText: string;
  confidence: number;
  engineUsed: string;
  imageUrl?: string | null;
  scannedAt?: string | null;
  fieldBoxes?: Record<string, FieldBox | null> | null;
  onBack?: () => void;
  onRescan?: () => void;
}

// Canonical rule order + human labels (matches rules/rules.json, 9 rules)
const RULE_ORDER: Array<{ rule_id: string; label: string; section: string }> = [
  { rule_id: "LM-PC-2011-R6-1a", label: "Manufacturer name & address", section: "Rule 6(1)(a)" },
  { rule_id: "LM-PC-2011-R6-1b", label: "Commodity name", section: "Rule 6(1)(b)" },
  { rule_id: "LM-PC-2011-R6-1c", label: "Net quantity declaration", section: "Rule 6(1)(c)" },
  { rule_id: "LM-PC-2011-R6-1d", label: "Manufacture date", section: "Rule 6(1)(d)" },
  { rule_id: "LM-PC-2011-R6-1e", label: "MRP declaration", section: "Rule 6(1)(e)" },
  { rule_id: "LM-PC-2011-R6-1f", label: "Manufacturer postal address", section: "Rule 6(1)(f)" },
  { rule_id: "LM-PC-2011-R6-1g", label: "Country of origin", section: "Rule 6(1)(g)" },
  { rule_id: "LM-PC-2011-R6-1h", label: "Best before / use by date", section: "Rule 6(1)(h)" },
  { rule_id: "LM-PC-2011-R6-2", label: "Consumer care details", section: "Rule 6(2)" },
  { rule_id: "LM-PC-2011-R5", label: "Batch / lot / serial number", section: "Rule 5" },
  { rule_id: "LM-PC-2011-R7-LetterHeight", label: "Letter height", section: "Rule 7(3)" },
  { rule_id: "LM-PC-2011-R8", label: "Importer details (imports)", section: "Rule 8" },
  { rule_id: "LM-PC-2011-R9-4", label: "Language (Hindi/English)", section: "Rule 9(4)" },
  { rule_id: "LM-PC-2011-R12-6", label: "No misleading quantity words", section: "Rule 12(6)" },
];

const FIELD_LABELS: Record<string, string> = {
  commodity_name: "Commodity Name",
  net_quantity: "Net Quantity",
  mrp: "MRP",
  manufacture_date: "Manufacture Date",
  manufacturer_name: "Manufacturer Name",
  manufacturer_address: "Manufacturer Address",
  consumer_care_phone: "Consumer Care Phone",
  consumer_care_email: "Consumer Care Email",
  country_of_origin: "Country of Origin",
  language: "Language",
  best_before: "Best Before",
};

const SEVERITY_COLORS: Record<string, { border: string; bg: string; text: string; box: string }> = {
  critical: { border: "#DC2626", bg: "#FEE2E2", text: "#991B1B", box: "#EF4444" },
  major: { border: "#EA580C", bg: "#FFF7ED", text: "#9A3412", box: "#F97316" },
  minor: { border: "#CA8A04", bg: "#FEFCE8", text: "#854D0E", box: "#EAB308" },
  needs_review: { border: "#9333EA", bg: "#FAF5FF", text: "#6B21A8", box: "#A855F7" },
};

function getSeverityColor(severity?: string) {
  return SEVERITY_COLORS[severity || "major"] || SEVERITY_COLORS.major;
}

interface Check {
  rule_id: string;
  section: string;
  field: string;
  label: string;
  status: "pass" | "fail";
  message?: string;
  suggestion?: string;
  severity?: string;
  value: string | null;
  box: FieldBox | null;
}

// Rule field -> key in backend `field_boxes`. Rules without a physical
// location on the label (letter height, language, misleading words) map to null.
function boxKeyForField(field: string): string | null {
  switch (field) {
    case "manufacturer_name":
      return "manufacturer_name";
    case "commodity_name":
      return "commodity_name";
    case "net_quantity":
      return "net_quantity";
    case "manufacture_date":
      return "manufacture_date";
    case "mrp":
      return "mrp";
    case "consumer_care":
      return "consumer_care";
    case "best_before":
      return "best_before";
    case "country_of_origin":
      return "country_of_origin";
    default:
      return null;
  }
}

interface PillPos {
  x: number; // 0-1000 units, left edge in image space
  y: number; // 0-1000 units, top edge in image space
}

// Place label pills so they never cover each other: default is above the
// box, but a pill that would collide is moved below its box (or stacked).
function layoutPills(
  items: Array<{ label: string; box: FieldBox }>,
  wrapW: number,
  wrapH: number
): PillPos[] {
  const W = wrapW > 0 ? wrapW : 700;
  const H = wrapH > 0 ? wrapH : 800;
  const pillH = (20 / H) * 1000;
  const gap = 6;
  const pad = 4;

  const order = items
    .map((item, i) => ({ item, i }))
    .sort((a, b) => a.item.box.y - b.item.box.y || a.item.box.x - b.item.box.x);

  const placed: Array<{ x0: number; x1: number; y0: number; y1: number }> = [];
  const out: PillPos[] = new Array(items.length);

  const collides = (x: number, y: number, w: number) =>
    placed.some(
      (r) => x - pad < r.x1 && x + w + pad > r.x0 && y - 2 < r.y1 && y + pillH + 2 > r.y0
    );

  for (const { item, i } of order) {
    const estW = ((item.label.length * 5.4 + 25) / W) * 1000;
    let x = item.box.x + 8;
    if (x + estW > 1000) x = Math.max(0, 1000 - estW);

    const above = item.box.y - pillH - gap;
    const below = item.box.y + item.box.height + gap;
    let y = above < 0 ? below : above;

    if (collides(x, y, estW)) {
      if (!collides(x, below, estW)) {
        y = below;
      } else {
        let yy = above;
        for (let k = 0; k < 2 && collides(x, yy, estW); k++) yy -= pillH + gap;
        y = yy;
        if (y < 0 || collides(x, y, estW)) {
          let yb = below;
          for (let k = 0; k < 2 && collides(x, yb, estW); k++) yb += pillH + gap;
          y = yb;
        }
      }
    }
    y = Math.max(0, Math.min(1000 - pillH, y));
    placed.push({ x0: x, x1: x + estW, y0: y, y1: y + pillH });
    out[i] = { x, y };
  }
  return out;
}

function resolveValue(
  field: string,
  extracted: Record<string, string | null>
): string | null {
  if (field === "consumer_care") {
    const phone = extracted["consumer_care_phone"];
    const email = extracted["consumer_care_email"];
    const parts = [phone, email].filter(Boolean);
    return parts.length ? parts.join(" · ") : null;
  }
  if (field === "manufacturer_name") {
    const name = extracted["manufacturer_name"];
    const addr = extracted["manufacturer_address"];
    if (name && addr) return `${name}, ${addr}`;
    return name || addr || null;
  }
  return extracted[field] ?? null;
}

export default function ScanResultView({
  scanId,
  extractedFields,
  validation,
  ocrText,
  confidence,
  engineUsed,
  imageUrl,
  scannedAt,
  fieldBoxes,
  onBack,
  onRescan,
}: ScanResultViewProps) {
  const [openRow, setOpenRow] = useState<number | null>(null);
  const [showBoxes, setShowBoxes] = useState(true);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [wrapSize, setWrapSize] = useState({ w: 0, h: 0 });

  // Measure the displayed image so pill collision layout uses real pixels.
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const update = () =>
      setWrapSize({ w: el.clientWidth, h: el.clientHeight });
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [imageUrl]);

  const failedByRule = useMemo(
    () => new Map((validation.violations || []).map((v) => [v.rule_id, v])),
    [validation.violations]
  );
  const passedByRule = useMemo(
    () => new Map((validation.passed || []).map((p) => [p.rule_id, p])),
    [validation.passed]
  );

  // Build the 9-row checklist from real validation data, in canonical order.
  const checks: Check[] = useMemo(() => {
    const boxFor = (field: string): FieldBox | null => {
      if (!fieldBoxes) return null;
      const key = boxKeyForField(field);
      return (key ? fieldBoxes[key] : null) || null;
    };

    return RULE_ORDER.map((meta) => {
      const v = failedByRule.get(meta.rule_id);
      if (v) {
        return {
          rule_id: meta.rule_id,
          section: v.rule_section || v.section || meta.section,
          field: v.field,
          label: meta.label,
          status: "fail" as const,
          message: v.message,
          suggestion: v.suggestion,
          severity: v.severity,
          value: resolveValue(v.field, extractedFields),
          box: boxFor(v.field),
        };
      }
      const p = passedByRule.get(meta.rule_id);
      const fallbackField =
        meta.rule_id === "LM-PC-2011-R6-1a"
          ? "manufacturer_name"
          : meta.rule_id === "LM-PC-2011-R6-1b"
            ? "commodity_name"
            : meta.rule_id === "LM-PC-2011-R6-1c"
              ? "net_quantity"
              : meta.rule_id === "LM-PC-2011-R6-1d"
                ? "manufacture_date"
                : meta.rule_id === "LM-PC-2011-R6-1e"
                  ? "mrp"
                  : meta.rule_id === "LM-PC-2011-R6-2"
                    ? "consumer_care"
                    : meta.rule_id === "LM-PC-2011-R7-LetterHeight"
                      ? "letter_height_mm"
                      : meta.rule_id === "LM-PC-2011-R9-4"
                        ? "language"
                        : "quantity_exaggeration";
      const field = p?.field || fallbackField;
      return {
        rule_id: meta.rule_id,
        section: p?.rule_section || p?.section || meta.section,
        field,
        label: meta.label,
        status: "pass" as const,
        value: resolveValue(field, extractedFields),
        box: boxFor(field),
      };
    });
  }, [failedByRule, passedByRule, extractedFields, fieldBoxes]);

  const hasBoxes = checks.some((c) => c.box);

  // Boxes + collision-free pill positions (pills live in image space so a
  // pill can sit below its box when "above" is occupied).
  const pillTargets = useMemo(() => checks.flatMap((c, idx) =>
    c.box ? [{ label: c.label, box: c.box, status: c.status, idx, rule_id: c.rule_id, message: c.message, severity: c.severity }] : []
  ), [checks]);
  const pillPos = useMemo(() => layoutPills(pillTargets, wrapSize.w, wrapSize.h), [pillTargets, wrapSize]);

  const openCheck = (i: number, ruleId: string) => {
    setOpenRow(i);
    document
      .getElementById(`check-${ruleId}`)
      ?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  };

  const passedCount = checks.filter((c) => c.status === "pass").length;
  const isCompliant = validation.overall_status === "compliant";
  const compliancePercent = checks.length === 0 ? 0 : Math.round((passedCount / checks.length) * 100);

  const productName =
    extractedFields["commodity_name"] || "Unknown product";
  const brand =
    extractedFields["manufacturer_name"] || "Unknown brand";
  const netWeight = extractedFields["net_quantity"] || "—";

  const handleDownload = () => {
    const report = {
      product_name: productName,
      brand,
      net_weight: netWeight,
      scanned_at: scannedAt,
      engine: engineUsed,
      confidence,
      overall_status: isCompliant ? "compliant" : "non-compliant",
      score: `${compliancePercent}/100`,
      extracted_fields: extractedFields,
      checks: checks.map((c) => ({
        rule_id: c.rule_id,
        section: c.section,
        field: c.field,
        status: c.status,
        detected_value: c.value,
        message: c.message || null,
        suggestion: c.suggestion || null,
      })),
      ocr_text: ocrText,
    };
    const blob = new Blob([JSON.stringify(report, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `compliance-report-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadPdf = async () => {
    if (!scanId) return;
    try {
      const { getToken } = await import("@/lib/api");
      const token = getToken();
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/scan/${scanId}/report/pdf`,
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      if (!res.ok) throw new Error("PDF generation failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `compliance-report-${scanId}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // PDF download failed
    }
  };

  const handleDownloadDocx = async () => {
    if (!scanId) return;
    try {
      const { getToken } = await import("@/lib/api");
      const token = getToken();
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/scan/${scanId}/report/docx`,
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      if (!res.ok) throw new Error("DOCX generation failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `compliance-report-${scanId}.docx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // DOCX download failed
    }
  };

  return (
    <div
      className="min-h-screen w-full"
      style={{ background: "#F5F1E8", fontFamily: "system-ui, sans-serif" }}
    >
      {/* Top bar */}
      <div className="border-b" style={{ borderColor: "#E7E1D2" }}>
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-sm font-medium"
            style={{ color: "#1C1B19" }}
          >
            <ArrowLeft size={16} />
            Back to scans
          </button>
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-md flex items-center justify-center"
              style={{ background: "#E4622C" }}
            >
              <ScanLine size={16} color="white" />
            </div>
            <span className="font-bold text-sm" style={{ color: "#1C1B19" }}>
              Compliance Checker
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-10 grid md:grid-cols-5 gap-10">
        {/* LEFT: scanned label */}
        <div className="md:col-span-3">
          <div className="flex items-baseline justify-between mb-4">
            <div>
              <p
                className="text-xs font-semibold uppercase tracking-wide mb-1"
                style={{ color: "#B08A5A" }}
              >
                Scan result
              </p>
              <h1
                className="text-2xl font-extrabold"
                style={{ color: "#1C1B19" }}
              >
                {productName}
              </h1>
              <p className="text-sm" style={{ color: "#8A8578" }}>
                {brand} &middot; {netWeight}
                {scannedAt ? ` · scanned ${scannedAt}` : ""}
              </p>
            </div>
            {imageUrl && hasBoxes && (
              <label
                className="flex items-center gap-2 text-xs font-medium cursor-pointer select-none flex-shrink-0"
                style={{ color: "#1C1B19" }}
              >
                <input
                  type="checkbox"
                  checked={showBoxes}
                  onChange={(e) => setShowBoxes(e.target.checked)}
                  className="accent-orange-600"
                />
                Show detected fields
              </label>
            )}
          </div>

          {/* Image card with corner-bracket frame */}
          <div className="relative">
            <div
              className="absolute -top-2 -left-2 w-6 h-6 border-t-2 border-l-2 rounded-tl-md"
              style={{ borderColor: "#E4622C" }}
            />
            <div
              className="absolute -top-2 -right-2 w-6 h-6 border-t-2 border-r-2 rounded-tr-md"
              style={{ borderColor: "#E4622C" }}
            />
            <div
              className="absolute -bottom-2 -left-2 w-6 h-6 border-b-2 border-l-2 rounded-bl-md"
              style={{ borderColor: "#E4622C" }}
            />
            <div
              className="absolute -bottom-2 -right-2 w-6 h-6 border-b-2 border-r-2 rounded-br-md"
              style={{ borderColor: "#E4622C" }}
            />

            {/* status pill overlapping top edge */}
            <div className="absolute left-1/2 -translate-x-1/2 -top-4 z-10">
              <div
                className="flex items-center gap-2 px-3 py-1.5 rounded-full shadow-sm text-xs font-semibold"
                style={{
                  background: "white",
                  color: isCompliant ? "#1F9254" : "#C0392B",
                }}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ background: isCompliant ? "#1F9254" : "#C0392B" }}
                />
                {isCompliant ? "Compliant" : "Non-compliant"} &middot; {compliancePercent}/100
              </div>
            </div>

            {imageUrl ? (
              <div
                ref={wrapRef}
                className="relative rounded-xl overflow-hidden shadow-sm bg-black"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imageUrl}
                  alt={`Scanned label for ${productName}`}
                  className="w-full object-contain"
                  style={{ maxHeight: "640px", background: "#1C1B19" }}
                />
                {/* Violation overlay boxes: green = compliant, red = violation.
                    Coords are 0-1000 normalized, so % positioning scales with
                    the displayed image. Click a box to open its checklist row. */}
                {showBoxes &&
                  checks.map((c, i) =>
                    c.box ? (
                      <div
                        key={c.rule_id}
                        onClick={() => openCheck(i, c.rule_id)}
                        className="absolute rounded-sm cursor-pointer transition-opacity"
                        style={{
                          left: `${c.box.x / 10}%`,
                          top: `${c.box.y / 10}%`,
                          width: `${c.box.width / 10}%`,
                          height: `${c.box.height / 10}%`,
                          border: `2px solid ${
                            c.status === "pass" ? "#4ADE80" : getSeverityColor(c.severity).box
                          }`,
                          boxShadow:
                            c.status === "fail"
                              ? `0 0 0 3px ${getSeverityColor(c.severity).bg}`
                              : "none",
                          zIndex: c.status === "fail" ? 3 : 2,
                        }}
                        title={`${c.label} — ${c.status === "pass" ? "compliant" : c.message || "violation"}`}
                      />
                    ) : null
                  )}
                {/* Label pills in image space (collision-free layout) */}
                {showBoxes &&
                  pillTargets.map((t, k) => (
                    <div
                      key={t.rule_id}
                      onClick={() => openCheck(t.idx, t.rule_id)}
                      className="absolute flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold whitespace-nowrap shadow-sm cursor-pointer"
                      style={{
                        left: `${pillPos[k].x / 10}%`,
                        top: `${pillPos[k].y / 10}%`,
                        background: t.status === "pass" ? "#15803D" : getSeverityColor(t.severity).box,
                        color: "white",
                        width: "max-content",
                        maxWidth: "none",
                        flexShrink: 0,
                        zIndex: t.status === "fail" ? 13 : 12,
                      }}
                      title={`${t.label} — ${t.status === "pass" ? "compliant" : t.message || "violation"}`}
                    >
                      {t.status === "pass" ? (
                        <Check size={9} />
                      ) : (
                        <X size={9} />
                      )}
                      {t.label}
                    </div>
                  ))}
              </div>
            ) : (
              <div
                className="relative rounded-xl overflow-hidden shadow-sm"
                style={{ background: "#7A1F2B", aspectRatio: "4 / 5" }}
              >
                <div
                  className="absolute top-0 left-0 right-0 py-3 px-6 text-center"
                  style={{ background: "#2E4A34" }}
                >
                  <p className="text-white font-black text-lg tracking-tight uppercase">
                    {brand}
                  </p>
                </div>
                <div className="absolute" style={{ top: "18%", left: "8%", right: "8%" }}>
                  <p className="text-white font-extrabold text-2xl leading-tight">
                    {productName}
                  </p>
                  <p className="text-white text-xs opacity-80 mt-1">
                    {extractedFields["country_of_origin"]
                      ? `Origin: ${extractedFields["country_of_origin"]}`
                      : "Scanned product label"}
                  </p>
                </div>
                <div
                  className="absolute rounded-full opacity-20"
                  style={{
                    top: "30%",
                    left: "50%",
                    width: "220px",
                    height: "220px",
                    transform: "translate(-50%, -50%)",
                    background:
                      "radial-gradient(circle, rgba(255,180,120,1) 0%, rgba(255,180,120,0) 70%)",
                  }}
                />
                <div
                  className="absolute text-white text-[10px] leading-snug"
                  style={{ top: "56%", left: "8%", right: "8%" }}
                >
                  {extractedFields["manufacturer_name"] ||
                    extractedFields["manufacturer_address"] ? (
                    <>
                      Manufactured &amp; Packed by{" "}
                      {extractedFields["manufacturer_name"] || ""}
                      {extractedFields["manufacturer_address"]
                        ? `, ${extractedFields["manufacturer_address"]}`
                        : ""}
                    </>
                  ) : (
                    "Manufacturer details not detected on label"
                  )}
                </div>
                <div
                  className="absolute text-white text-[10px]"
                  style={{ top: "68%", left: "8%" }}
                >
                  {extractedFields["manufacture_date"]
                    ? `Mfg. Date: ${extractedFields["manufacture_date"]}`
                    : "Mfg. Date: not detected"}
                  {extractedFields["mrp"] ? ` · ${extractedFields["mrp"]}` : ""}
                </div>
                <div
                  className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-6 py-3"
                  style={{ background: "#1C1B19" }}
                >
                  <span className="text-white text-xs font-bold">{netWeight}</span>
                  <span className="text-white/50 text-[10px]">
                    {engineUsed} &middot; {(confidence * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            )}
          </div>

          <p className="text-xs mt-3" style={{ color: "#8A8578" }}>
            {imageUrl ? (
              hasBoxes ? (
                <>
                  Boxes mark where each declaration was found on the label.
                  Green = compliant, red = missing or non-compliant. Click a
                  box to see details.
                </>
              ) : (
                "Label photo with the compliance verdict above. Field locations were not detected for this scan — rescan to see overlay boxes."
              )
            ) : (
              "No label photo stored for this scan — showing detected values instead."
            )}{" "}
            Engine: {engineUsed} &middot; Confidence:{" "}
            {(confidence * 100).toFixed(1)}%
          </p>

          {/* Detected OCR values — real backend data */}
          <div
            className="rounded-xl shadow-sm overflow-hidden mt-6"
            style={{ background: "white" }}
          >
            <div className="px-5 pt-4 pb-2">
              <p
                className="text-xs font-semibold uppercase tracking-wide"
                style={{ color: "#B08A5A" }}
              >
                Detected values (OCR)
              </p>
            </div>
            <div>
              {Object.entries(FIELD_LABELS).map(([key, label]) => {
                const value = extractedFields[key];
                const check = checks.find(
                  (c) =>
                    c.field === key ||
                    (key.startsWith("consumer_care") && c.field === "consumer_care") ||
                    (key.startsWith("manufacturer") &&
                      c.field === "manufacturer_name")
                );
                const ok = check ? check.status === "pass" : !!value;
                return (
                  <div
                    key={key}
                    className="border-t flex items-start justify-between gap-3 px-5 py-3"
                    style={{ borderColor: "#F0ECE1" }}
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium" style={{ color: "#1C1B19" }}>
                        {label}
                      </p>
                      <p
                        className="text-sm break-words"
                        style={{ color: value ? "#1C1B19" : "#B0A98F" }}
                      >
                        {value || "Not detected"}
                      </p>
                    </div>
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{
                        background: ok ? "#E9F6EE" : "#FBEAE8",
                        color: ok ? "#1F9254" : "#C0392B",
                      }}
                    >
                      {ok ? <Check size={13} /> : <X size={13} />}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="px-5 py-4 border-t" style={{ borderColor: "#F0ECE1" }}>
              <details className="text-sm" style={{ color: "#8A8578" }}>
                <summary className="cursor-pointer font-medium text-xs">
                  Raw OCR text
                </summary>
                <pre className="mt-2 p-3 rounded-lg text-xs overflow-auto max-h-48 whitespace-pre-wrap" style={{ background: "#F5F1E8" }}>
                  {ocrText || "No OCR text available."}
                </pre>
              </details>
            </div>
          </div>
        </div>

        {/* RIGHT: verdict + checklist */}
        <div className="md:col-span-2">
          <div
            className="rounded-xl p-6 shadow-sm mb-5"
            style={{ background: "white" }}
          >
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0">
                <GradeBadge percent={compliancePercent} size={64} />
              </div>
              <div>
                <p className="font-extrabold text-lg" style={{ color: "#1C1B19" }}>
                  {isCompliant ? "Fully compliant" : "Not compliant"}
                </p>
                <p className="text-sm" style={{ color: "#8A8578" }}>
                  {passedCount} of {checks.length} checks passed
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl shadow-sm overflow-hidden" style={{ background: "white" }}>
            <div className="px-5 pt-4 pb-2">
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#B08A5A" }}>
                Legal Metrology (PC) Rules, 2011
              </p>
            </div>
            <div>
              {checks.map((c, i) => {
                const isOpen = openRow === i;
                return (
                  <div
                    key={c.rule_id}
                    id={`check-${c.rule_id}`}
                    className="border-t"
                    style={{ borderColor: "#F0ECE1" }}
                  >
                    <button
                      onClick={() => setOpenRow(isOpen ? null : i)}
                      className="w-full flex items-center justify-between px-5 py-3.5 text-left"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{
                            background:
                              c.status === "pass" ? "#E9F6EE" : getSeverityColor(c.severity).bg,
                            color: c.status === "pass" ? "#1F9254" : getSeverityColor(c.severity).text,
                          }}
                        >
                          {c.status === "pass" ? (
                            <Check size={13} />
                          ) : (
                            <AlertTriangle size={13} />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p
                              className="text-sm font-medium leading-tight"
                              style={{ color: "#1C1B19" }}
                            >
                              {c.label}
                            </p>
                            {c.status === "fail" && (
                              <SeverityDot severity={(c.severity || "major") as Severity} />
                            )}
                          </div>
                          <p
                            className="text-[11px] leading-tight"
                            style={{ color: "#B0A98F" }}
                          >
                            {c.section}
                          </p>
                        </div>
                      </div>
                      <ChevronDown
                        size={16}
                        style={{
                          color: "#8A8578",
                          transform: isOpen ? "rotate(180deg)" : "none",
                          transition: "transform 0.15s",
                        }}
                      />
                    </button>
                    {isOpen && (
                      <div className="px-5 pb-4 pl-14 -mt-1 space-y-1">
                        <p className="text-xs font-medium" style={{ color: "#1C1B19" }}>
                          Detected:{" "}
                          <span style={{ color: c.value ? "#1C1B19" : "#B0A98F" }}>
                            {c.value || "Not detected"}
                          </span>
                        </p>
                        {c.status === "fail" ? (
                          <>
                            <div className="flex items-center gap-2">
                              <p className="text-xs" style={{ color: getSeverityColor(c.severity).text }}>
                                {c.message}
                              </p>
                            </div>
                            {c.suggestion && (
                              <p className="text-xs" style={{ color: "#8A8578" }}>
                                Fix: {c.suggestion}
                              </p>
                            )}
                          </>
                        ) : (
                          <p className="text-xs" style={{ color: "#1F9254" }}>
                            Compliant — value detected in the required format.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-5">
            <button
              onClick={handleDownload}
              className="flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold text-white whitespace-nowrap"
              style={{ background: "#1C1B19" }}
            >
              <Download size={15} />
              Download JSON
            </button>
            {scanId && (
              <button
                onClick={handleDownloadPdf}
                className="flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold text-white whitespace-nowrap bg-orange-600 hover:bg-orange-700 transition-colors"
              >
                <Download size={15} />
                Download PDF
              </button>
            )}
            {scanId && (
              <button
                onClick={handleDownloadDocx}
                className="flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold text-white whitespace-nowrap bg-blue-600 hover:bg-blue-700 transition-colors"
              >
                <Download size={15} />
                Download DOCX
              </button>
            )}
            <button
              onClick={onRescan}
              className="flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold whitespace-nowrap"
              style={{ background: "white", color: "#1C1B19", border: "1px solid #E7E1D2" }}
            >
              <RotateCw size={15} />
              Rescan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
