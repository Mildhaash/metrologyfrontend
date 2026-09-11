import { CheckCircle2, XCircle, BarChart3, TrendingUp } from "lucide-react";

interface ReportSummaryProps {
  summary: {
    period_days: number;
    total_scans: number;
    compliant: number;
    non_compliant: number;
    compliance_rate: number;
    top_violations: Array<{ rule_id: string; count: number }>;
  };
}

export default function ReportSummary({ summary }: ReportSummaryProps) {
  const cards = [
    {
      label: "Total Scans",
      value: summary.total_scans,
      icon: BarChart3,
      color: "bg-orange-50 text-orange-600",
    },
    {
      label: "Compliant",
      value: summary.compliant,
      icon: CheckCircle2,
      color: "bg-green-50 text-green-600",
    },
    {
      label: "Non-Compliant",
      value: summary.non_compliant,
      icon: XCircle,
      color: "bg-red-50 text-red-600",
    },
    {
      label: "Compliance Rate",
      value: `${summary.compliance_rate}%`,
      icon: TrendingUp,
      color: "bg-blue-50 text-blue-600",
    },
  ];

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((c) => (
        <div
          key={c.label}
          className="bg-white rounded-2xl border border-orange-100 shadow-sm p-5"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${c.color}`}>
              <c.icon className="w-5 h-5" />
            </div>
            <span className="text-xs font-medium text-gray-500">{c.label}</span>
          </div>
          <p className="text-2xl font-extrabold text-gray-900">{c.value}</p>
        </div>
      ))}
    </div>
  );
}
