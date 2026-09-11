"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { apiFetch } from "@/lib/api";
import type { FieldBox, ScanValidation } from "@/components/scanner/ScanResultView";

const ScanResultView = dynamic(() => import("@/components/scanner/ScanResultView"), {
  loading: () => (
    <div className="min-h-screen flex items-center justify-center bg-[#F5F1E8]">
      <div className="w-10 h-10 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin" />
    </div>
  ),
});

interface NormalizedScan {
  extractedFields: Record<string, string | null>;
  validation: ScanValidation;
  ocrText: string;
  confidence: number;
  engineUsed: string;
  imageUrl: string | null;
  scannedAt: string | null;
  fieldBoxes: Record<string, FieldBox | null> | null;
}

// Rule ids in canonical order (must match backend rules/rules.json)
const RULE_IDS = [
  "LM-PC-2011-R6-1a",
  "LM-PC-2011-R6-1b",
  "LM-PC-2011-R6-1c",
  "LM-PC-2011-R6-1d",
  "LM-PC-2011-R6-1e",
  "LM-PC-2011-R6-1f",
  "LM-PC-2011-R6-1g",
  "LM-PC-2011-R6-1h",
  "LM-PC-2011-R6-2",
  "LM-PC-2011-R5",
  "LM-PC-2011-R7-LetterHeight",
  "LM-PC-2011-R8",
  "LM-PC-2011-R9-4",
  "LM-PC-2011-R12-6",
];

const RULE_FIELDS: Record<string, string> = {
  "LM-PC-2011-R6-1a": "manufacturer_name",
  "LM-PC-2011-R6-1b": "commodity_name",
  "LM-PC-2011-R6-1c": "net_quantity",
  "LM-PC-2011-R6-1d": "manufacture_date",
  "LM-PC-2011-R6-1e": "mrp",
  "LM-PC-2011-R6-1f": "manufacturer_address",
  "LM-PC-2011-R6-1g": "country_of_origin",
  "LM-PC-2011-R6-1h": "best_before",
  "LM-PC-2011-R6-2": "consumer_care",
  "LM-PC-2011-R5": "batch_number",
  "LM-PC-2011-R7-LetterHeight": "letter_height_mm",
  "LM-PC-2011-R8": "importer_details",
  "LM-PC-2011-R9-4": "language",
  "LM-PC-2011-R12-6": "quantity_exaggeration",
};

function formatScannedAt(raw: unknown): string | null {
  if (!raw || typeof raw !== "string") return null;
  const d = new Date(raw);
  if (isNaN(d.getTime())) return raw;
  return d.toLocaleString();
}

// Accepts both backend shapes:
//  1. /api/test/scan -> { ocr_text, confidence, engine_used, extracted_fields, validation }
//  2. /api/scan/{id}  -> scan doc { ocr_raw_text, extracted_fields, overall_status,
//                         violations[], ocr_engine, confidence, scanned_at, ... }
// plus an optional `image_data_url` key added by the upload page.
function normalize(stored: Record<string, unknown>): NormalizedScan {
  const imageUrl =
    typeof stored["image_data_url"] === "string"
      ? (stored["image_data_url"] as string)
      : null;

  // Shape 1: test-scan response (has nested `validation`)
  if (stored["validation"] && typeof stored["validation"] === "object") {
    const v = stored["validation"] as ScanValidation;
    const extracted =
      (stored["extracted_fields"] as Record<string, string | null>) || {};
    return {
      extractedFields: extracted,
      validation: {
        overall_status: v.overall_status || "non-compliant",
        violations: v.violations || [],
        passed: v.passed || [],
        summary: v.summary || {
          total_checks: RULE_IDS.length,
          passed: (v.passed || []).length,
          failed: (v.violations || []).length,
        },
      },
      ocrText: (stored["ocr_text"] as string) || "",
      confidence:
        typeof stored["confidence"] === "number"
          ? (stored["confidence"] as number)
          : 0,
      engineUsed: (stored["engine_used"] as string) || "unknown",
      imageUrl,
      scannedAt:
        formatScannedAt(stored["scanned_at"]) || "Just now",
      fieldBoxes:
        (stored["field_boxes"] as Record<string, FieldBox | null>) || null,
    };
  }

  // Shape 2: authenticated scan document (violations flat, no `passed` list)
  const violations = Array.isArray(stored["violations"])
    ? (stored["violations"] as Array<Record<string, unknown>>).map((x) => ({
        rule_id: x["rule_id"] as string,
        rule_section: (x["rule_section"] as string) || "",
        field:
          (x["field"] as string) ||
          RULE_FIELDS[x["rule_id"] as string] ||
          "",
        message: (x["message"] as string) || "",
        severity: (x["severity"] as string) || "medium",
        suggestion: (x["suggestion"] as string) || "",
      }))
    : [];
  const violated = new Set(violations.map((v) => v.rule_id));
  const passed = RULE_IDS.filter((id) => !violated.has(id)).map((id) => ({
    rule_id: id,
    field: RULE_FIELDS[id],
  }));
  const extracted =
    (stored["extracted_fields"] as Record<string, string | null>) || {};
  return {
    extractedFields: extracted,
    validation: {
      overall_status:
        (stored["overall_status"] as string) ||
        (stored["status"] as string) ||
        (violations.length ? "non-compliant" : "compliant"),
      violations,
      passed,
      summary: {
        total_checks: RULE_IDS.length,
        passed: passed.length,
        failed: violations.length,
      },
    },
    ocrText:
      (stored["ocr_raw_text"] as string) ||
      (stored["ocr_text"] as string) ||
      "",
    confidence:
      typeof stored["confidence"] === "number"
        ? (stored["confidence"] as number)
        : 0,
    engineUsed:
      (stored["ocr_engine"] as string) ||
      (stored["engine_used"] as string) ||
      "unknown",
    imageUrl,
    scannedAt: formatScannedAt(stored["scanned_at"]) || "Just now",
    fieldBoxes:
      (stored["field_boxes"] as Record<string, FieldBox | null>) || null,
  };
}

export default function ScanResultPage() {
  const params = useParams();
  const router = useRouter();
  const [data, setData] = useState<NormalizedScan | null>(null);

  useEffect(() => {
    const id = params.id as string;
    if (!id) return;

    // 1) Try localStorage first (fast, works for fresh scans)
    try {
      const stored = localStorage.getItem(`scan_${id}`);
      if (stored) {
        setData(normalize(JSON.parse(stored)));
        return;
      }
    } catch {
      // corrupt entry — fall through to API
    }

    // 2) Fallback: fetch from backend API (history / maps / batch links)
    let cancelled = false;
    (async () => {
      try {
        const scan = await apiFetch(`/scan/${id}`);
        if (cancelled) return;
        // Persist to localStorage so subsequent visits are fast
        try {
          localStorage.setItem(`scan_${id}`, JSON.stringify(scan));
        } catch { /* quota exceeded — ignore */ }
        setData(normalize(scan));
      } catch {
        if (!cancelled) setData(null);
      }
    })();

    return () => { cancelled = true; };
  }, [params.id]);

  if (!data) {
    return (
      <div className="min-h-screen bg-[#F5F1E8] flex items-center justify-center">
        <p className="text-gray-500">Scan result not found.</p>
      </div>
    );
  }

  return (
    <ScanResultView
      scanId={params.id as string}
      extractedFields={data.extractedFields}
      validation={data.validation}
      ocrText={data.ocrText}
      confidence={data.confidence}
      engineUsed={data.engineUsed}
      imageUrl={data.imageUrl}
      scannedAt={data.scannedAt}
      fieldBoxes={data.fieldBoxes}
      onBack={() => router.back()}
      onRescan={() => router.push("/dashboard/scan")}
    />
  );
}
