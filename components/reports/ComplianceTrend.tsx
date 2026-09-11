import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface ComplianceTrendProps {
  data: {
    trends: Array<{
      date: string;
      total: number;
      compliant: number;
      non_compliant: number;
      compliance_rate: number;
    }>;
  };
}

export default function ComplianceTrend({ data }: ComplianceTrendProps) {
  if (!data.trends.length) {
    return (
      <p className="text-sm text-gray-500 text-center py-8">
        No trend data available
      </p>
    );
  }

  const chartData = data.trends.map((t) => ({
    date: new Date(t.date).toLocaleDateString("en-IN", { month: "short", day: "numeric" }),
    compliance: t.compliance_rate,
    scans: t.total,
  }));

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#d1d5db" />
          <YAxis
            domain={[0, 100]}
            tick={{ fontSize: 11 }}
            stroke="#d1d5db"
            tickFormatter={(v) => `${v}%`}
          />
          <Tooltip
            contentStyle={{
              borderRadius: "12px",
              border: "1px solid #fed7aa",
              boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
            }}
          />
          <Line
            type="monotone"
            dataKey="compliance"
            stroke="#ea580c"
            strokeWidth={2}
            dot={{ r: 3, fill: "#ea580c" }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
