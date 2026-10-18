'use client';

/**
 * ClippedAreaChart — ported from the advanced-stats project, adapted from the
 * hard-coded revenue sample to the dashboard's live 7-day attendance data
 * ({ label, pct }[]), rendered in the teal design palette.
 */
import * as React from 'react';
import { Area, AreaChart, CartesianGrid, XAxis } from 'recharts';
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';

type TrendPoint = { label: string; pct: number };

const chartConfig = {
  present: { label: 'Present %', color: 'var(--chart-1)' },
  absent: { label: 'Absent %', color: 'var(--chart-2)' },
} satisfies ChartConfig;

export function ClippedAreaChart({ data }: { data: TrendPoint[] }) {
  const [revealed, setRevealed] = React.useState(false);
  const gradientId = React.useId().replace(/:/g, '');

  React.useEffect(() => {
    const timeout = setTimeout(() => setRevealed(true), 200);
    return () => clearTimeout(timeout);
  }, []);

  const points = data.length ? data : [{ label: '', pct: 0 }];
  // Absent % is the complement of the live present % (100 - present)
  const rows = points.map((p) => ({ label: p.label, present: p.pct, absent: 100 - p.pct }));
  const avg = rows.length
    ? Math.round(rows.reduce((sum, p) => sum + p.present, 0) / rows.length)
    : 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-muted mb-2">
            Attendance — Last 7 Days
          </p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-3xl font-bold tracking-tight text-slate-900">
              {avg}%
            </h3>
            <span className="text-sm font-medium text-muted">
              7-day average
            </span>
          </div>
        </div>
      </div>
      <div
        className="w-full"
        style={{
          clipPath: revealed ? 'inset(0 0% 0 0)' : 'inset(0 100% 0 0)',
          transition: 'clip-path 1500ms cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[280px] w-full"
        >
          <AreaChart data={rows} margin={{ left: 12, right: 12, top: 12 }}>
            <defs>
              <linearGradient id={`${gradientId}-present`} x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-present)"
                  stopOpacity={0.35}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-present)"
                  stopOpacity={0}
                />
              </linearGradient>
              <linearGradient id={`${gradientId}-absent`} x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-absent)"
                  stopOpacity={0.25}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-absent)"
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent formatter={(value) => `${Number(value)}%`} />}
            />
            <ChartLegend content={<ChartLegendContent />} />
            <Area
              dataKey="absent"
              name="absent"
              type="natural"
              fill={`url(#${gradientId}-absent)`}
              stroke="var(--color-absent)"
              strokeWidth={2}
              stackId="a"
              isAnimationActive={false}
            />
            <Area
              dataKey="present"
              name="present"
              type="natural"
              fill={`url(#${gradientId}-present)`}
              stroke="var(--color-present)"
              strokeWidth={2.5}
              stackId="a"
              isAnimationActive={false}
            />
          </AreaChart>
        </ChartContainer>
      </div>
    </div>
  );
}
