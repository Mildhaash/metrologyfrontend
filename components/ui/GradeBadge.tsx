type Summary = {
  critical?: number;
  major?: number;
  minor?: number;
  needs_review?: number;
  failed?: number;
  high?: number;
  medium?: number;
  low?: number;
};

function computeCompliancePercent(summary: Summary): number {
  const failed =
    (summary.failed || 0) ||
    (summary.critical || 0) + (summary.major || 0) + (summary.minor || 0) + (summary.needs_review || 0) ||
    (summary.high || 0) + (summary.medium || 0) + (summary.low || 0);
  if (failed === 0) return 100;
  const total = failed + 5;
  return Math.round(((total - failed) / total) * 100);
}

interface CompliancePieChartProps {
  percent: number;
  size?: number;
}

function CompliancePieChart({ percent, size = 64 }: CompliancePieChartProps) {
  const strokeWidth = 5;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  const getColor = (p: number) => {
    if (p >= 90) return "#16A34A";
    if (p >= 70) return "#65A30D";
    if (p >= 50) return "#EA580C";
    return "#DC2626";
  };

  const color = getColor(percent);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#E5E7EB"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-500"
        />
      </svg>
      <div
        className="absolute inset-0 flex items-center justify-center"
      >
        <span
          className="font-extrabold"
          style={{ fontSize: size * 0.22, color }}
        >
          {percent}%
        </span>
      </div>
    </div>
  );
}

export default function GradeBadge({
  summary,
  percent,
  size = 64,
}: {
  summary?: Summary;
  percent?: number;
  size?: number;
}) {
  const compliancePercent =
    percent !== undefined ? percent : computeCompliancePercent(summary || {});

  return (
    <CompliancePieChart percent={compliancePercent} size={size} />
  );
}
