type Severity = "critical" | "major" | "minor" | "needs_review";

const SEVERITY_CONFIG: Record<Severity, { label: string; color: string; bg: string; border: string }> = {
  critical: {
    label: "Critical",
    color: "text-red-800",
    bg: "bg-red-100",
    border: "border-red-300",
  },
  major: {
    label: "Major",
    color: "text-orange-800",
    bg: "bg-orange-100",
    border: "border-orange-300",
  },
  minor: {
    label: "Minor",
    color: "text-yellow-800",
    bg: "bg-yellow-100",
    border: "border-yellow-300",
  },
  needs_review: {
    label: "Needs Review",
    color: "text-purple-800",
    bg: "bg-purple-100",
    border: "border-purple-300",
  },
};

export default function SeverityBadge({ severity }: { severity: Severity }) {
  const config = SEVERITY_CONFIG[severity] || SEVERITY_CONFIG.major;

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${config.bg} ${config.color} ${config.border}`}
    >
      {config.label}
    </span>
  );
}

export function SeverityDot({ severity }: { severity: Severity }) {
  const dotColors: Record<Severity, string> = {
    critical: "bg-red-500",
    major: "bg-orange-500",
    minor: "bg-yellow-500",
    needs_review: "bg-purple-500",
  };

  return (
    <span className={`inline-block w-2 h-2 rounded-full ${dotColors[severity] || dotColors.major}`} />
  );
}

export { SEVERITY_CONFIG };
export type { Severity };
