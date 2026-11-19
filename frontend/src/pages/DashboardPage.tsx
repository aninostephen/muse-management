import { useState } from 'react';
import { Badge } from '@astryxdesign/core/Badge';
import { Button } from '@astryxdesign/core/Button';
import { Card } from '@astryxdesign/core/Card';
import { Heading } from '@astryxdesign/core/Heading';
import { Stack } from '@astryxdesign/core/Stack';
import { Text } from '@astryxdesign/core/Text';
import {
  Activity,
  ArrowRight,
  DollarSign,
  Link2,
  MessageSquare,
  Receipt,
  TrendingUp,
  UserCheck,
  Users,
} from 'lucide-react';
import {
  RevenueByCreatorChart,
  RevenueCategoryPieChart,
  RevenueChart,
} from '../components/charts/RevenueChart';
import { StatCard } from '../components/dashboard/StatCard';
import {
  DataTable,
  type DataTableColumn,
} from '../components/tables/DataTable';
import { ErrorState } from '../components/ui/ErrorState';
import { LoadingSkeleton } from '../components/ui/LoadingSkeleton';
import {
  useDashboardOverview,
  useDashboardPerformance,
  useDashboardRevenue,
} from '../hooks/useDashboard';
import type { NavTabId } from '../layouts/DashboardLayout';
import type {
  ChatterSummaryItem,
  CreatorSummaryItem,
  DateRangeFilter,
  RevenueGranularity,
} from '../types/api.types';
import {
  formatCurrency,
  formatNumber,
  formatPercentage,
} from '../utils/formatters';

interface DashboardPageProps {
  dateRange: DateRangeFilter;
  onNavigateTab: (tab: NavTabId) => void;
}

export function DashboardPage({
  dateRange,
  onNavigateTab,
}: DashboardPageProps) {
  const [granularity, setGranularity] = useState<RevenueGranularity>('daily');

  const overviewQuery = useDashboardOverview(dateRange);
  const revenueQuery = useDashboardRevenue({
    ...dateRange,
    granularity,
  });
  const performanceQuery = useDashboardPerformance(dateRange);

  const kpis = overviewQuery.data?.kpis;
  const currency = kpis?.currency || 'USD';

  const topCreatorColumns: DataTableColumn<CreatorSummaryItem>[] = [
    {
      key: 'creator',
      header: 'Creator',
      render: (c) => (
        <Stack direction="vertical" gap={0}>
          <Text weight="semibold">{c.name}</Text>
          {c.userName && <Text type="supporting">@{c.userName}</Text>}
        </Stack>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (c) => <Badge variant="success" label={c.status} />,
    },
    {
      key: 'gross',
      header: 'Gross Earnings',
      render: (c) => (
        <Text weight="semibold" hasTabularNumbers>
          {formatCurrency(c.totalEarningsGross, c.currency)}
        </Text>
      ),
    },
    {
      key: 'net',
      header: 'Net Earnings',
      render: (c) => (
        <Text hasTabularNumbers>
          {formatCurrency(c.totalEarningsNet, c.currency)}
        </Text>
      ),
    },
    {
      key: 'activeFans',
      header: 'Active Fans',
      render: (c) => (
        <Text hasTabularNumbers>
          {formatNumber(c.activeFans, 'Unavailable')}
        </Text>
      ),
    },
  ];

  const topChatterColumns: DataTableColumn<ChatterSummaryItem>[] = [
    {
      key: 'chatter',
      header: 'Chatter',
      render: (ch) => (
        <Stack direction="vertical" gap={0}>
          <Text weight="semibold">{ch.name}</Text>
          <Text type="supporting">#{ch.employeeId}</Text>
        </Stack>
      ),
    },
    {
      key: 'totalSales',
      header: 'Attributed Sales',
      render: (ch) => (
        <Text weight="semibold" hasTabularNumbers>
          {formatCurrency(ch.totalSales, ch.currency)}
        </Text>
      ),
    },
    {
      key: 'ppvSales',
      header: 'PPV Sales',
      render: (ch) => (
        <Text hasTabularNumbers>
          {formatCurrency(ch.ppvSales, ch.currency)}
        </Text>
      ),
    },
    {
      key: 'ppvsUnlocked',
      header: 'PPVs Unlocked',
      render: (ch) => (
        <Text hasTabularNumbers>{formatNumber(ch.ppvsUnlocked, '0')}</Text>
      ),
    },
    {
      key: 'unlockRate',
      header: 'Unlock Rate',
      render: (ch) => (
        <Badge
          variant="info"
          label={formatPercentage(ch.unlockRate, 1, 'N/A')}
        />
      ),
    },
  ];

  return (
    <Stack direction="vertical" gap={5}>
      {/* Error States */}
      {overviewQuery.isError && (
        <ErrorState
          title="Unable to load Agency Overview KPIs"
          error={overviewQuery.error}
          isRetrying={overviewQuery.isFetching}
          onRetry={() => void overviewQuery.refetch()}
        />
      )}

      {/* A. Main Dashboard Overview KPI Cards */}
      {overviewQuery.isLoading ? (
        <LoadingSkeleton variant="cards" count={6} />
      ) : kpis ? (
        <div className="kpi-grid">
          <StatCard
            title="Total Gross Revenue"
            value={formatCurrency(kpis.totalRevenueGross, currency)}
            subtitle={`Net: ${formatCurrency(kpis.totalRevenueNet, currency)} (Fees: ${formatCurrency(kpis.totalFees, currency)})`}
            icon={<DollarSign size={18} />}
            badgeLabel="Verified Transactions"
            badgeVariant="success"
          />

          <StatCard
            title="Connected Creators"
            value={formatNumber(kpis.totalCreators, '0')}
            subtitle={`Total Roster: ${formatNumber(kpis.totalCreatorsAllStatuses, '0')} creators`}
            icon={<Users size={18} />}
            badgeLabel="Active Sync"
            badgeVariant="info"
          />

          <StatCard
            title="Total Active Fans"
            value={formatNumber(kpis.totalFans, 'Unavailable')}
            isUnavailable={kpis.totalFans === null}
            subtitle={
              kpis.totalNewSubscribers !== null
                ? `+${formatNumber(kpis.totalNewSubscribers, '0')} new • ${formatNumber(kpis.totalSubscriberRenewals, '0')} renewals`
                : 'From /v1/creator-report/fans/count'
            }
            icon={<UserCheck size={18} />}
            badgeLabel={
              kpis.totalFans !== null ? 'Daily Report' : 'No Fan Report Rows'
            }
            badgeVariant={kpis.totalFans !== null ? 'purple' : 'neutral'}
          />

          <StatCard
            title="Active Chatters"
            value={formatNumber(kpis.activeChatters, '0')}
            subtitle={`Out of ${formatNumber(kpis.totalEmployees, '0')} total employees`}
            icon={<MessageSquare size={18} />}
            badgeLabel="Team Roster"
            badgeVariant="teal"
          />

          <StatCard
            title="Avg Revenue / Creator"
            value={formatCurrency(
              kpis.averageRevenuePerCreator,
              currency,
              'N/A',
            )}
            isUnavailable={kpis.averageRevenuePerCreator === null}
            subtitle="Gross revenue per connected creator"
            icon={<TrendingUp size={18} />}
          />

          <StatCard
            title="Total Transactions"
            value={formatNumber(kpis.totalTransactions, '0')}
            subtitle={`Refunds: ${formatCurrency(kpis.totalRefunds, currency)} (${kpis.refundCount} items)`}
            icon={<Receipt size={18} />}
            badgeLabel={kpis.refundCount > 0 ? 'Has Refunds' : '0 Refunds'}
            badgeVariant={kpis.refundCount > 0 ? 'warning' : 'neutral'}
          />
        </div>
      ) : null}

      {/* B. Revenue Analytics Charts */}
      {revenueQuery.isError && (
        <ErrorState
          title="Unable to load Revenue Analytics"
          error={revenueQuery.error}
          isRetrying={revenueQuery.isFetching}
          onRetry={() => void revenueQuery.refetch()}
        />
      )}

      {revenueQuery.isLoading ? (
        <LoadingSkeleton variant="chart" />
      ) : revenueQuery.data ? (
        <>
          <RevenueChart
            data={revenueQuery.data.timeSeries}
            granularity={granularity}
            onGranularityChange={setGranularity}
            isFetching={revenueQuery.isFetching}
            currency={revenueQuery.data.summary.currency}
          />

          <div className="charts-grid-2">
            <RevenueByCreatorChart
              data={revenueQuery.data.byCreator}
              currency={revenueQuery.data.summary.currency}
            />
            <RevenueCategoryPieChart
              data={revenueQuery.data.byCategory}
              currency={revenueQuery.data.summary.currency}
            />
          </div>
        </>
      ) : null}

      {/* C. Agency Performance Highlights (Top Creators, Top Chatters, Top Tracking Links) */}
      {performanceQuery.isError && (
        <ErrorState
          title="Unable to load Performance Highlights"
          error={performanceQuery.error}
          isRetrying={performanceQuery.isFetching}
          onRetry={() => void performanceQuery.refetch()}
        />
      )}

      {performanceQuery.isLoading ? (
        <LoadingSkeleton variant="table" count={4} />
      ) : performanceQuery.data ? (
        <div className="charts-grid-2">
          {/* Top Creators Card */}
          <Card padding={4}>
            <Stack direction="vertical" gap={3}>
              <Stack direction="horizontal" justify="between" align="center">
                <Stack direction="horizontal" gap={1.5} align="center">
                  <Activity size={18} style={{ color: '#2563eb' }} />
                  <Heading level={3}>Top Performing Creators</Heading>
                </Stack>
                <Button
                  label="View All Creators"
                  size="sm"
                  variant="ghost"
                  endContent={<ArrowRight size={14} />}
                  onClick={() => onNavigateTab('creators')}
                />
              </Stack>

              <DataTable
                columns={topCreatorColumns}
                rows={performanceQuery.data.topCreators}
                rowKey="id"
                isFetching={performanceQuery.isFetching}
                withCard={false}
                emptyTitle="No creator records"
                emptyDescription="No creator records available for this period."
              />
            </Stack>
          </Card>

          {/* Top Chatters Card */}
          <Card padding={4}>
            <Stack direction="vertical" gap={3}>
              <Stack direction="horizontal" justify="between" align="center">
                <Stack direction="horizontal" gap={1.5} align="center">
                  <MessageSquare size={18} style={{ color: '#10b981' }} />
                  <Heading level={3}>Top Performing Chatters</Heading>
                </Stack>
                <Button
                  label="View All Chatters"
                  size="sm"
                  variant="ghost"
                  endContent={<ArrowRight size={14} />}
                  onClick={() => onNavigateTab('chatters')}
                />
              </Stack>

              <DataTable
                columns={topChatterColumns}
                rows={performanceQuery.data.topChatters}
                rowKey="employeeId"
                isFetching={performanceQuery.isFetching}
                withCard={false}
                emptyTitle="No employee performance records"
                emptyDescription="No employee performance records found for this period."
              />
            </Stack>
          </Card>
        </div>
      ) : null}

      {/* Top Marketing Campaigns Strip */}
      {performanceQuery.data && (
        <Card padding={4}>
          <Stack direction="vertical" gap={3}>
            <Stack
              direction="horizontal"
              justify="between"
              align="center"
              wrap="wrap"
            >
              <Stack direction="horizontal" gap={1.5} align="center">
                <Link2 size={18} style={{ color: '#8b5cf6' }} />
                <Heading level={3}>
                  Marketing & Tracking Links Snapshot
                </Heading>
              </Stack>
              <Button
                label="Open Marketing Analytics"
                size="sm"
                variant="secondary"
                endContent={<ArrowRight size={14} />}
                onClick={() => onNavigateTab('marketing')}
              />
            </Stack>

            <Stack
              direction="horizontal"
              gap={4}
              wrap="wrap"
              justify="between"
            >
              <Stack direction="vertical" gap={0.5}>
                <Text type="supporting">Total Tracking Clicks</Text>
                <Heading level={3}>
                  {formatNumber(
                    performanceQuery.data.marketingSummary.totalClicks,
                    '0',
                  )}
                </Heading>
              </Stack>

              <Stack direction="vertical" gap={0.5}>
                <Text type="supporting">New Subscribers Acquired</Text>
                <Heading level={3}>
                  {formatNumber(
                    performanceQuery.data.marketingSummary.totalNewSubscribers,
                    '0',
                  )}
                </Heading>
              </Stack>

              <Stack direction="vertical" gap={0.5}>
                <Text type="supporting">Tracking Conversion Rate</Text>
                <Heading level={3}>
                  {formatPercentage(
                    performanceQuery.data.marketingSummary
                      .trackingConversionRate,
                    2,
                    'N/A',
                  )}
                </Heading>
              </Stack>

              <Stack direction="vertical" gap={0.5}>
                <Text type="supporting">Attributed Gross Revenue</Text>
                <Heading level={3}>
                  {formatCurrency(
                    performanceQuery.data.marketingSummary.totalGrossRevenue,
                    currency,
                  )}
                </Heading>
              </Stack>

              <Stack direction="vertical" gap={0.5}>
                <Text type="supporting">Attributed Net Revenue</Text>
                <Heading level={3}>
                  {formatCurrency(
                    performanceQuery.data.marketingSummary.totalNetRevenue,
                    currency,
                  )}
                </Heading>
              </Stack>
            </Stack>
          </Stack>
        </Card>
      )}
    </Stack>
  );
}
