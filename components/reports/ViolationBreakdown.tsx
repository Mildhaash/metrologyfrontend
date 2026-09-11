interface ViolationBreakdownProps {
  data: {
    violations: Array<{
      rule_id: string;
      count: number;
      affected_products: number;
      products: string[];
    }>;
  };
}

const RULE_NAMES: Record<string, string> = {
  rule_1: "Manufacturer Name",
  rule_2: "Commodity Name",
  rule_3: "Net Quantity",
  rule_4: "MRP",
  rule_5: "Consumer Care",
  rule_6: "Manufacturing Date",
  rule_7: "Best Before",
  rule_8: "Country of Origin",
  rule_9: "Gender",
};

export default function ViolationBreakdown({ data }: ViolationBreakdownProps) {
  if (!data.violations.length) {
    return (
      <p className="text-sm text-gray-500 text-center py-8">
        No violations in this period
      </p>
    );
  }

  const maxCount = Math.max(...data.violations.map((v) => v.count));

  return (
    <div className="space-y-3">
      {data.violations.map((v) => (
        <div key={v.rule_id} className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">
              {RULE_NAMES[v.rule_id] || v.rule_id}
            </span>
            <span className="text-xs text-gray-500">
              {v.count} violation{v.count !== 1 ? "s" : ""} · {v.affected_products} product{v.affected_products !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="w-full h-2 bg-orange-50 rounded-full overflow-hidden">
            <div
              className="h-full bg-orange-500 rounded-full transition-all"
              style={{ width: `${(v.count / maxCount) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
