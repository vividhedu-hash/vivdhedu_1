"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from "recharts";

interface TrajectoryData {
  year: number;
  conservative: number;
  base: number;
  optimistic: number;
}

interface SalaryTrajectoryProps {
  data?: TrajectoryData[];
  /** Each horizon is null when there is no measured salary to project from. */
  salaryByYear?: {
    year1: { p25: number; p50: number; p75: number } | null;
    year5: { p25: number; p50: number; p75: number } | null;
    year10: { p25: number; p50: number; p75: number } | null;
    year20: { p25: number; p50: number; p75: number } | null;
  };
}

function formatSalary(value: number): string {
  if (value >= 10000000) return `₹${(value / 10000000).toFixed(1)}Cr`;
  if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
  return `₹${(value / 1000).toFixed(0)}K`;
}

const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: number;
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: "#FFFFFF",
        border: "1px solid #E2E8F0",
        borderRadius: 12,
        padding: "12px 16px",
        boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
      }}
    >
      <p
        style={{
          color: "#64748B",
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          marginBottom: 8,
        }}
      >
        Year {label}
      </p>
      {payload.map((entry) => (
        <div
          key={entry.name}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 4,
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: entry.color,
              display: "inline-block",
            }}
          />
          <span style={{ color: "#64748B", fontSize: 12, minWidth: 90 }}>
            {entry.name}
          </span>
          <span
            style={{
              color: "#09090B",
              fontSize: 13,
              fontWeight: 700,
              fontFamily: "JetBrains Mono, monospace",
            }}
          >
            {formatSalary(entry.value)}
          </span>
        </div>
      ))}
    </div>
  );
};

export function SalaryTrajectory({ data, salaryByYear }: SalaryTrajectoryProps) {
  // Build chart data from salaryByYear if data not provided directly.
  // Horizons with no measured value are omitted from the series rather than
  // plotted as 0, which would read as "this program pays nothing".
  const chartData: TrajectoryData[] =
    data ||
    (salaryByYear
      ? (
          [
            { year: 1, band: salaryByYear.year1 },
            { year: 5, band: salaryByYear.year5 },
            { year: 10, band: salaryByYear.year10 },
            { year: 20, band: salaryByYear.year20 },
          ] as { year: number; band: { p25: number; p50: number; p75: number } | null }[]
        )
          .filter((row) => row.band != null)
          .map((row) => ({
            year: row.year,
            conservative: row.band!.p25,
            base: row.band!.p50,
            optimistic: row.band!.p75,
          }))
      : []);

  return (
    <div style={{ width: "100%", height: 260 }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData}
          margin={{ top: 8, right: 16, left: 8, bottom: 8 }}
        >
          <defs>
            <linearGradient id="optimisticGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#10B981" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="2 6"
            stroke="#E2E8F0"
            vertical={false}
          />
          <XAxis
            dataKey="year"
            tick={{ fill: "#64748B", fontSize: 11, fontFamily: "JetBrains Mono" }}
            tickLine={false}
            axisLine={false}
            label={{
              value: "Year",
              position: "insideBottomRight",
              fill: "#64748B",
              fontSize: 11,
              offset: -4,
            }}
          />
          <YAxis
            tickFormatter={formatSalary}
            tick={{ fill: "#64748B", fontSize: 11, fontFamily: "JetBrains Mono" }}
            tickLine={false}
            axisLine={false}
            width={64}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{
              paddingTop: 12,
              fontSize: 12,
              color: "#64748B",
            }}
          />
          {/* Area between conservative and optimistic */}
          <Line
            type="monotone"
            dataKey="optimistic"
            name="Optimistic"
            stroke="#22C55E"
            strokeWidth={2}
            dot={{ fill: "#22C55E", strokeWidth: 0, r: 3 }}
            activeDot={{ r: 5, strokeWidth: 0 }}
            strokeDasharray="6 3"
          />
          <Line
            type="monotone"
            dataKey="base"
            name="Base Case"
            stroke="#4F6EF7"
            strokeWidth={2.5}
            dot={{ fill: "#4F6EF7", strokeWidth: 0, r: 3 }}
            activeDot={{ r: 5, strokeWidth: 0 }}
          />
          <Line
            type="monotone"
            dataKey="conservative"
            name="Conservative"
            stroke="#F59E0B"
            strokeWidth={2}
            dot={{ fill: "#F59E0B", strokeWidth: 0, r: 3 }}
            activeDot={{ r: 5, strokeWidth: 0 }}
            strokeDasharray="4 4"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
