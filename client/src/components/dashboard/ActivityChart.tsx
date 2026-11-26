import { useMemo } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Activity } from 'lucide-react';

export interface ActivityDataPoint {
  date?: string;
  label?: string;
  day?: string;
  week?: string;
  name?: string;
  submissions?: number;
  accepted?: number;
  solved?: number;
  count?: number;
  xp?: number;
  [key: string]: string | number | undefined;
}

export interface ActivityChartProps {
  data: ActivityDataPoint[];
  type?: 'bar' | 'line' | 'area';
  title?: string;
  subtitle?: string;
  height?: number;
  dataKey?: string;
  secondaryDataKey?: string;
  primaryLabel?: string;
  secondaryLabel?: string;
  primaryColor?: string;
  secondaryColor?: string;
  emptyMessage?: string;
  className?: string;
}

interface CustomTooltipPayloadItem {
  name?: string;
  value?: number | string;
  color?: string;
  dataKey?: string | number;
  payload?: ActivityDataPoint;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: CustomTooltipPayloadItem[];
  label?: string | number;
}

function CustomActivityTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  const point = payload[0]?.payload;
  const headerLabel = point?.date && point.date !== label ? `${label} (${point.date})` : String(label ?? '');

  return (
    <div className="rounded-lg border border-[#30363D] bg-[#161B22] px-3.5 py-2.5 shadow-xl">
      {headerLabel ? (
        <p className="mb-1.5 text-xs font-semibold text-[#F0F6FC]">{headerLabel}</p>
      ) : null}
      <div className="space-y-1">
        {payload.map((entry, idx) => (
          <div key={`${String(entry.dataKey ?? idx)}`} className="flex items-center justify-between gap-4 text-xs">
            <span className="flex items-center gap-1.5 text-[#8B949E]">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: entry.color || '#22C55E' }}
              />
              {entry.name}
            </span>
            <span className="font-mono font-semibold text-[#F0F6FC]">
              {typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value ?? 0}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function formatAxisLabel(point: ActivityDataPoint): string {
  if (point.label) return point.label;
  if (point.day) return point.day;
  if (point.week) return point.week;
  if (point.name) return point.name;
  if (point.date) {
    const parsed = new Date(point.date);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toLocaleDateString(undefined, { weekday: 'short' });
    }
    return point.date;
  }
  return '';
}

export default function ActivityChart({
  data,
  type = 'bar',
  title,
  subtitle,
  height = 260,
  dataKey,
  secondaryDataKey,
  primaryLabel = 'Submissions',
  secondaryLabel = 'Accepted',
  primaryColor = '#22C55E',
  secondaryColor = '#38BDF8',
  emptyMessage = 'No activity recorded for this period yet.',
  className = '',
}: ActivityChartProps) {
  const resolvedPrimaryKey = useMemo(() => {
    if (dataKey) return dataKey;
    const sample = data[0];
    if (!sample) return 'submissions';
    if (typeof sample.submissions === 'number') return 'submissions';
    if (typeof sample.count === 'number') return 'count';
    if (typeof sample.solved === 'number') return 'solved';
    if (typeof sample.accepted === 'number') return 'accepted';
    return 'submissions';
  }, [data, dataKey]);

  const resolvedSecondaryKey = useMemo(() => {
    if (secondaryDataKey) return secondaryDataKey;
    const sample = data[0];
    if (!sample) return undefined;
    if (resolvedPrimaryKey === 'submissions' && typeof sample.accepted === 'number') {
      return 'accepted';
    }
    if (resolvedPrimaryKey === 'submissions' && typeof sample.solved === 'number') {
      return 'solved';
    }
    return undefined;
  }, [data, secondaryDataKey, resolvedPrimaryKey]);

  const chartData = useMemo(
    () =>
      data.map((item) => ({
        ...item,
        displayLabel: formatAxisLabel(item),
      })),
    [data]
  );

  const hasHeader = Boolean(title || subtitle);

  return (
    <div
      className={`rounded-xl border border-[#30363D] bg-[#1C2128] p-5 ${className}`}
    >
      {hasHeader ? (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            {title ? (
              <h3 className="text-base font-semibold text-[#F0F6FC]">{title}</h3>
            ) : null}
            {subtitle ? (
              <p className="mt-0.5 text-xs text-[#8B949E]">{subtitle}</p>
            ) : null}
          </div>
          {chartData.length > 0 ? (
            <div className="flex items-center gap-4 text-xs text-[#8B949E]">
              <span className="flex items-center gap-1.5">
                <span
                  className="h-2.5 w-2.5 rounded-sm"
                  style={{ backgroundColor: primaryColor }}
                />
                {primaryLabel}
              </span>
              {resolvedSecondaryKey ? (
                <span className="flex items-center gap-1.5">
                  <span
                    className="h-2.5 w-2.5 rounded-sm"
                    style={{ backgroundColor: secondaryColor }}
                  />
                  {secondaryLabel}
                </span>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}

      {chartData.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center rounded-lg border border-dashed border-[#30363D] bg-[#0D1117]/60 px-4 text-center"
          style={{ height }}
        >
          <Activity className="mb-2 h-8 w-8 text-[#8B949E]/60" />
          <p className="text-sm font-medium text-[#8B949E]">{emptyMessage}</p>
        </div>
      ) : (
        <div className="w-full" style={{ height }}>
          <ResponsiveContainer width="100%" height="100%">
            {type === 'bar' ? (
              <BarChart
                data={chartData}
                margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
              >
                <CartesianGrid
                  stroke="#30363D"
                  strokeDasharray="3 3"
                  vertical={false}
                />
                <XAxis
                  dataKey="displayLabel"
                  stroke="#8B949E"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#8B949E"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  content={<CustomActivityTooltip />}
                  cursor={{ fill: 'rgba(240, 246, 252, 0.04)' }}
                />
                <Bar
                  dataKey={resolvedPrimaryKey}
                  name={primaryLabel}
                  fill={primaryColor}
                  radius={[6, 6, 0, 0]}
                  maxBarSize={38}
                />
                {resolvedSecondaryKey ? (
                  <Bar
                    dataKey={resolvedSecondaryKey}
                    name={secondaryLabel}
                    fill={secondaryColor}
                    radius={[6, 6, 0, 0]}
                    maxBarSize={38}
                  />
                ) : null}
              </BarChart>
            ) : type === 'area' ? (
              <AreaChart
                data={chartData}
                margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="activityPrimaryGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={primaryColor} stopOpacity={0.35} />
                    <stop offset="95%" stopColor={primaryColor} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  stroke="#30363D"
                  strokeDasharray="3 3"
                  vertical={false}
                />
                <XAxis
                  dataKey="displayLabel"
                  stroke="#8B949E"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#8B949E"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <Tooltip content={<CustomActivityTooltip />} />
                <Area
                  type="monotone"
                  dataKey={resolvedPrimaryKey}
                  name={primaryLabel}
                  stroke={primaryColor}
                  strokeWidth={2}
                  fill="url(#activityPrimaryGradient)"
                  activeDot={{ r: 5, fill: primaryColor, stroke: '#0D1117', strokeWidth: 2 }}
                />
                {resolvedSecondaryKey ? (
                  <Area
                    type="monotone"
                    dataKey={resolvedSecondaryKey}
                    name={secondaryLabel}
                    stroke={secondaryColor}
                    strokeWidth={2}
                    fillOpacity={0.12}
                    fill={secondaryColor}
                    activeDot={{ r: 5, fill: secondaryColor, stroke: '#0D1117', strokeWidth: 2 }}
                  />
                ) : null}
              </AreaChart>
            ) : (
              <LineChart
                data={chartData}
                margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
              >
                <CartesianGrid
                  stroke="#30363D"
                  strokeDasharray="3 3"
                  vertical={false}
                />
                <XAxis
                  dataKey="displayLabel"
                  stroke="#8B949E"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#8B949E"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <Tooltip content={<CustomActivityTooltip />} />
                <Line
                  type="monotone"
                  dataKey={resolvedPrimaryKey}
                  name={primaryLabel}
                  stroke={primaryColor}
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: primaryColor, strokeWidth: 0 }}
                  activeDot={{ r: 5, fill: primaryColor, stroke: '#0D1117', strokeWidth: 2 }}
                />
                {resolvedSecondaryKey ? (
                  <Line
                    type="monotone"
                    dataKey={resolvedSecondaryKey}
                    name={secondaryLabel}
                    stroke={secondaryColor}
                    strokeWidth={2}
                    dot={{ r: 3, fill: secondaryColor, strokeWidth: 0 }}
                    activeDot={{ r: 5, fill: secondaryColor, stroke: '#0D1117', strokeWidth: 2 }}
                  />
                ) : null}
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
