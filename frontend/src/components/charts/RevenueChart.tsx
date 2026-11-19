import { Button } from '@astryxdesign/core/Button';
import { Card } from '@astryxdesign/core/Card';
import { Heading } from '@astryxdesign/core/Heading';
import { Stack } from '@astryxdesign/core/Stack';
import { Text } from '@astryxdesign/core/Text';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type {
  RevenueCategoryBreakdown,
  RevenueCreatorBreakdown,
  RevenueGranularity,
  RevenueTimeSeriesPoint,
} from '../../types/api.types';
import {
  formatCompactCurrency,
  formatCurrency,
  formatPercentage,
} from '../../utils/formatters';
import { EmptyState } from '../ui/EmptyState';

const CHART_COLORS = [
  '#2563eb',
  '#10b981',
  '#8b5cf6',
  '#f59e0b',
  '#ec4899',
  '#06b6d4',
  '#64748b',
];

interface RevenueTrendChartProps {
  title?: string;
  subtitle?: string;
  data: RevenueTimeSeriesPoint[];
  granularity?: RevenueGranularity;
  onGranularityChange?: (g: RevenueGranularity) => void;
  isFetching?: boolean;
  currency?: string;
}

export function RevenueChart({
  title = 'Revenue Over Time',
  subtitle = 'Gross vs. Net earnings across all connected OnlyFans creators',
  data,
  granularity = 'daily',
  onGranularityChange,
  isFetching = false,
  currency = 'USD',
}: RevenueTrendChartProps) {
  return (
    <Card padding={4} width="100%">
      <Stack direction="vertical" gap={3}>
        <Stack
          direction="horizontal"
          justify="between"
          align="center"
          wrap="wrap"
          gap={2}
        >
          <Stack direction="vertical" gap={0.5}>
            <Heading level={3}>{title}</Heading>
            <Text type="supporting">{subtitle}</Text>
          </Stack>

          {onGranularityChange && (
            <Stack direction="horizontal" gap={1}>
              {(['daily', 'weekly', 'monthly'] as RevenueGranularity[]).map(
                (g) => (
                  <Button
                    key={g}
                    label={g.charAt(0).toUpperCase() + g.slice(1)}
                    size="sm"
                    variant={granularity === g ? 'primary' : 'secondary'}
                    isLoading={isFetching && granularity === g}
                    isDisabled={isFetching}
                    onClick={() => onGranularityChange(g)}
                  />
                ),
              )}
            </Stack>
          )}
        </Stack>

        {data.length === 0 ? (
          <EmptyState
            title="No revenue transactions in selected date range"
            description="Try expanding the date filter or selecting a different range."
          />
        ) : (
          <div style={{ width: '100%', height: 320 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={data}
                margin={{ top: 10, right: 20, left: 10, bottom: 5 }}
              >
                <defs>
                  <linearGradient id="colorGross" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.28} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorNet" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.28} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--dashboard-border)"
                />
                <XAxis
                  dataKey="period"
                  tick={{ fontSize: 12, fill: 'var(--dashboard-muted)' }}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: 'var(--dashboard-muted)' }}
                  tickFormatter={(v: number) =>
                    formatCompactCurrency(v, currency, '$0')
                  }
                />
                <Tooltip
                  formatter={(val: unknown, name: unknown) => [
                    formatCurrency(Number(val ?? 0), currency),
                    String(name),
                  ]}
                  contentStyle={{
                    backgroundColor: 'var(--dashboard-surface)',
                    borderColor: 'var(--dashboard-border)',
                    borderRadius: 10,
                    fontSize: 13,
                  }}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="gross"
                  name="Gross Revenue"
                  stroke="#2563eb"
                  strokeWidth={2.2}
                  fillOpacity={1}
                  fill="url(#colorGross)"
                />
                <Area
                  type="monotone"
                  dataKey="net"
                  name="Net Revenue (After OF Fee)"
                  stroke="#10b981"
                  strokeWidth={2.2}
                  fillOpacity={1}
                  fill="url(#colorNet)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </Stack>
    </Card>
  );
}

export function RevenueByCreatorChart({
  data,
  currency = 'USD',
}: {
  data: RevenueCreatorBreakdown[];
  currency?: string;
}) {
  const topSlice = data.slice(0, 10);

  return (
    <Card padding={4} width="100%">
      <Stack direction="vertical" gap={3}>
        <Stack direction="vertical" gap={0.5}>
          <Heading level={3}>Revenue Breakdown by Creator</Heading>
          <Text type="supporting">
            Gross vs. Net earnings across top performing creators
          </Text>
        </Stack>

        {topSlice.length === 0 ? (
          <EmptyState
            title="No creator revenue records"
            description="No creator revenue was recorded during this date range."
          />
        ) : (
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={topSlice}
                margin={{ top: 10, right: 20, left: 10, bottom: 5 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--dashboard-border)"
                />
                <XAxis
                  dataKey="creatorName"
                  tick={{ fontSize: 12, fill: 'var(--dashboard-muted)' }}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: 'var(--dashboard-muted)' }}
                  tickFormatter={(v: number) =>
                    formatCompactCurrency(v, currency, '$0')
                  }
                />
                <Tooltip
                  formatter={(val: unknown, name: unknown) => [
                    formatCurrency(Number(val ?? 0), currency),
                    String(name),
                  ]}
                  contentStyle={{
                    backgroundColor: 'var(--dashboard-surface)',
                    borderColor: 'var(--dashboard-border)',
                    borderRadius: 10,
                    fontSize: 13,
                  }}
                />
                <Legend />
                <Bar
                  dataKey="gross"
                  name="Gross Revenue"
                  fill="#2563eb"
                  radius={[6, 6, 0, 0]}
                />
                <Bar
                  dataKey="net"
                  name="Net Revenue"
                  fill="#10b981"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </Stack>
    </Card>
  );
}

export function RevenueCategoryPieChart({
  data,
  currency = 'USD',
}: {
  data: RevenueCategoryBreakdown[];
  currency?: string;
}) {
  return (
    <Card padding={4} width="100%">
      <Stack direction="vertical" gap={3}>
        <Stack direction="vertical" gap={0.5}>
          <Heading level={3}>Revenue Distribution by Category</Heading>
          <Text type="supporting">
            Share of gross revenue by Infloww transaction type
          </Text>
        </Stack>

        {data.length === 0 ? (
          <EmptyState
            title="No category distribution data"
            description="No categorized transactions found in the selected period."
          />
        ) : (
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  dataKey="gross"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  innerRadius={62}
                  outerRadius={98}
                  paddingAngle={3}
                >
                  {data.map((entry, idx) => (
                    <Cell
                      key={entry.category}
                      fill={CHART_COLORS[idx % CHART_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: unknown, name: unknown, item: unknown) => {
                    const pct = (
                      item as { payload?: RevenueCategoryBreakdown }
                    )?.payload?.percentageOfGross;
                    return [
                      `${formatCurrency(Number(val ?? 0), currency)} (${formatPercentage(pct, 1)})`,
                      String(name),
                    ];
                  }}
                  contentStyle={{
                    backgroundColor: 'var(--dashboard-surface)',
                    borderColor: 'var(--dashboard-border)',
                    borderRadius: 10,
                    fontSize: 13,
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </Stack>
    </Card>
  );
}
