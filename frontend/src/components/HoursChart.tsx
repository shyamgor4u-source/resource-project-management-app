import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

interface HoursChartProps {
  data: { project: string; hours: number }[];
  periodLabel?: string;
}

const COLORS = [
  '#d97706', '#b45309', '#f59e0b', '#92400e', '#fbbf24',
];

export default function HoursChart({ data, periodLabel }: HoursChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
        No hours logged{periodLabel ? ` in ${periodLabel}` : ' for this period'}
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.88 0.01 240 / 0.3)" vertical={false} />
        <XAxis
          dataKey="project"
          tick={{ fontSize: 11, fill: 'oklch(0.52 0.02 250)' }}
          axisLine={false}
          tickLine={false}
          interval={0}
          tickFormatter={(v: string) => v.length > 12 ? v.slice(0, 12) + '…' : v}
        />
        <YAxis
          tick={{ fontSize: 11, fill: 'oklch(0.52 0.02 250)' }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'oklch(0.19 0.025 250)',
            border: '1px solid oklch(0.28 0.03 250)',
            borderRadius: '8px',
            color: 'oklch(0.92 0.01 240)',
            fontSize: '12px',
          }}
          cursor={{ fill: 'oklch(0.72 0.18 55 / 0.08)' }}
          formatter={(value: number) => [`${value}h`, 'Hours']}
        />
        <Bar dataKey="hours" radius={[4, 4, 0, 0]}>
          {data.map((_, index) => (
            <Cell key={index} fill={COLORS[index % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
