import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  Cell,
} from 'recharts';
import type { useStats } from '../../hooks/useStats';

type Last7Days = ReturnType<typeof useStats>['last7Days'];

const COLORS = ['rgb(var(--accent))', 'rgba(var(--accent), 0.7)', 'rgba(var(--accent), 0.5)'];

export function TrendChart({ data }: { data: Last7Days }) {
  return (
    <div className="h-[200px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11 }}
            tickFormatter={(_, i) => data[i]?.dayLabel ?? ''}
          />
          <YAxis allowDecimals={false} tick={{ fontSize: 11 }} width={24} />
          <Tooltip
            content={({ active, payload }) =>
              active && payload?.[0] ? (
                <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm shadow dark:border-gray-700 dark:bg-gray-800">
                  {payload[0].payload.date} 完成 {payload[0].value} 项
                </div>
              ) : null
            }
          />
          <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={32}>
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
