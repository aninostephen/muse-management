import { useState } from 'react';
import { Badge } from '@astryxdesign/core/Badge';
import { Button } from '@astryxdesign/core/Button';
import { Card } from '@astryxdesign/core/Card';
import { Divider } from '@astryxdesign/core/Divider';
import { Heading } from '@astryxdesign/core/Heading';
import { Spinner } from '@astryxdesign/core/Spinner';
import { Stack } from '@astryxdesign/core/Stack';
import { Text } from '@astryxdesign/core/Text';
import { TextInput } from '@astryxdesign/core/TextInput';
import {
  Award,
  DollarSign,
  Eye,
  MessageCircle,
  Search,
  UserCheck,
  Users,
  X,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { StatCard } from '../components/dashboard/StatCard';
import { CreatorTable } from '../components/tables/CreatorTable';
import { DataTable } from '../components/tables/DataTable';
import { ErrorState } from '../components/ui/ErrorState';
import { LoadingSkeleton } from '../components/ui/LoadingSkeleton';
import { useCreatorDetail, useCreators } from '../hooks/useCreators';
import type {
  CreatorDetailResponse,
  CreatorsListQuery,
  DateRangeFilter,
} from '../types/api.types';
import {
  formatCompactCurrency,
  formatCurrency,
  formatDateTime,
  formatDurationMs,
  formatNumber,
} from '../utils/formatters';

interface CreatorsPageProps {
  dateRange: DateRangeFilter;
}

export function CreatorsPage({ dateRange }: CreatorsPageProps) {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [sortBy, setSortBy] =
    useState<NonNullable<CreatorsListQuery['sortBy']>>('totalEarningsGross');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [selectedCreatorId, setSelectedCreatorId] = useState<string | null>(
    null,
  );

  const creatorsQuery = useCreators({
    ...dateRange,
    search,
    status,
    sortBy,
    sortOrder,
    page,
    limit: 10,
  });

  const detailQuery = useCreatorDetail(selectedCreatorId, dateRange);

  const handleSortChange = (
    field: NonNullable<CreatorsListQuery['sortBy']>,
  ) => {
    if (sortBy === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
    setPage(1);
  };

  const items = creatorsQuery.data?.items || [];
  const summary = creatorsQuery.data?.summary;
  const totalGross =
    summary?.totalGross ??
    items.reduce((s, c) => s + c.totalEarningsGross, 0);
  const totalNet =
    summary?.totalNet ??
    items.reduce((s, c) => s + c.totalEarningsNet, 0);
  const totalSubRevenue =
    summary?.totalSubscriptionRevenue ??
    items.reduce((s, c) => s + c.subscriptionRevenue, 0);
  const creatorsWithFans = items.filter((c) => c.activeFans !== null);
  const totalActiveFans =
    summary !== undefined
      ? summary.totalActiveFans
      : creatorsWithFans.length > 0
        ? creatorsWithFans.reduce((s, c) => s + (c.activeFans ?? 0), 0)
        : null;

  return (
    <Stack direction="vertical" gap={4}>
      {creatorsQuery.isError && (
        <ErrorState
          title="Unable to load Creators list"
          error={creatorsQuery.error}
          isRetrying={creatorsQuery.isFetching}
          onRetry={() => void creatorsQuery.refetch()}
        />
      )}

      {/* Summary KPIs */}
      {creatorsQuery.isLoading ? (
        <LoadingSkeleton variant="cards" count={4} />
      ) : (
        <div className="kpi-grid">
          <StatCard
            title="Creators Matching Filter"
            value={formatNumber(creatorsQuery.data?.meta.total ?? 0, '0')}
            subtitle={
              creatorsQuery.data?.meta.allCreatorsScopeAvailable
                ? 'Includes all agency creator statuses'
                : 'Connected creators scope (/v1/creators)'
            }
            icon={<Users size={18} />}
          />
          <StatCard
            title="Page Gross Earnings"
            value={formatCurrency(totalGross)}
            subtitle={`Net: ${formatCurrency(totalNet)}`}
            icon={<DollarSign size={18} />}
          />
          <StatCard
            title="Subscription Revenue"
            value={formatCurrency(totalSubRevenue)}
            subtitle="Direct + recurring subscriptions"
            icon={<Award size={18} />}
          />
          <StatCard
            title="Active Fans (Page)"
            value={formatNumber(totalActiveFans, 'Unavailable')}
            isUnavailable={totalActiveFans === null}
            subtitle="Latest daily fan count report"
            icon={<UserCheck size={18} />}
          />
        </div>
      )}

      {/* Search & Status Filters Bar */}
      <Card padding={4}>
        <Stack
          direction="horizontal"
          justify="between"
          align="center"
          wrap="wrap"
          gap={3}
        >
          <div style={{ minWidth: 280, flex: 1, maxWidth: 420 }}>
            <TextInput
              label="Search Creators"
              isLabelHidden
              type="search"
              value={search}
              onChange={(val) => {
                setSearch(val);
                setPage(1);
              }}
              placeholder="Search by creator name, @username, tag, or ID..."
              startIcon={<Search size={16} />}
              hasClear
              width="100%"
            />
          </div>

          <Stack direction="horizontal" gap={1} align="center" wrap="wrap">
            <Text type="supporting">Status:</Text>
            {['all', 'connected', 'disconnected', '2FA', 'deleted'].map((s) => (
              <Button
                key={s}
                label={s === 'all' ? 'All Statuses' : s}
                size="sm"
                variant={status === s ? 'primary' : 'secondary'}
                isLoading={creatorsQuery.isFetching && status === s}
                isDisabled={creatorsQuery.isFetching}
                onClick={() => {
                  setStatus(s);
                  setPage(1);
                }}
              />
            ))}
          </Stack>
        </Stack>
      </Card>

      {/* Creators Table */}
      {creatorsQuery.isLoading ? (
        <LoadingSkeleton variant="table" count={8} />
      ) : (
        <CreatorTable
          items={items}
          meta={creatorsQuery.data?.meta}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSortChange={handleSortChange}
          onPageChange={setPage}
          onSelectCreator={(id) => setSelectedCreatorId(id)}
          isFetching={creatorsQuery.isFetching}
          selectedCreatorId={selectedCreatorId}
          isDetailLoading={detailQuery.isFetching}
        />
      )}

      {/* Creator Detail Modal / Drawer */}
      {selectedCreatorId && (
        <div
          className="modal-backdrop"
          onClick={() => setSelectedCreatorId(null)}
        >
          <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
            <Stack direction="vertical" gap={4} padding={5}>
              <Stack direction="horizontal" justify="between" align="center">
                <Stack direction="vertical" gap={0.5}>
                  <Stack direction="horizontal" gap={2} align="center">
                    <Heading level={2}>
                      {detailQuery.data?.creator.name ||
                        `Creator #${selectedCreatorId}`}
                    </Heading>
                    {detailQuery.data?.creator.status && (
                      <Badge
                        variant="success"
                        label={detailQuery.data.creator.status}
                      />
                    )}
                  </Stack>
                  <Text type="supporting">
                    {detailQuery.data?.creator.userName
                      ? `@${detailQuery.data.creator.userName}`
                      : `ID: ${selectedCreatorId}`}
                    {detailQuery.data?.creator.platformPid
                      ? ` • Performer PID: ${detailQuery.data.creator.platformPid}`
                      : ''}
                  </Text>
                </Stack>

                <Button
                  label="Close"
                  variant="secondary"
                  size="sm"
                  icon={<X size={16} />}
                  onClick={() => setSelectedCreatorId(null)}
                />
              </Stack>

              <Divider />

              {detailQuery.isLoading ? (
                <Stack
                  direction="vertical"
                  align="center"
                  justify="center"
                  paddingBlock={8}
                >
                  <Spinner
                    size="lg"
                    label="Loading creator performance & fan reports..."
                  />
                </Stack>
              ) : detailQuery.isError ? (
                <ErrorState
                  title="Unable to load creator detail"
                  error={detailQuery.error}
                  isRetrying={detailQuery.isFetching}
                  onRetry={() => void detailQuery.refetch()}
                />
              ) : detailQuery.data ? (
                <Stack direction="vertical" gap={4}>
                  {/* Creator Revenue & Fan KPIs */}
                  <div className="kpi-grid">
                    <StatCard
                      title="Gross Earnings"
                      value={formatCurrency(
                        detailQuery.data.revenue.totalEarningsGross,
                      )}
                      subtitle={`Net: ${formatCurrency(detailQuery.data.revenue.totalEarningsNet)}`}
                      icon={<DollarSign size={16} />}
                    />
                    <StatCard
                      title="Active Fans"
                      value={formatNumber(
                        detailQuery.data.fanAnalytics.activeFans,
                        'Unavailable',
                      )}
                      isUnavailable={
                        detailQuery.data.fanAnalytics.activeFans === null
                      }
                      subtitle={`Expired: ${formatNumber(detailQuery.data.fanAnalytics.expiredFans, 'N/A')} • Auto-Renew: ${formatNumber(detailQuery.data.fanAnalytics.fansWithRenewOn, 'N/A')}`}
                      icon={<UserCheck size={16} />}
                    />
                    <StatCard
                      title="Reach & Platform Rank"
                      value={
                        detailQuery.data.fanAnalytics.performanceRank !== null
                          ? `Top ${detailQuery.data.fanAnalytics.performanceRank}%`
                          : 'Unavailable'
                      }
                      isUnavailable={
                        detailQuery.data.fanAnalytics.performanceRank === null
                      }
                      subtitle={`Profile Visitors: ${formatNumber(detailQuery.data.fanAnalytics.profileVisitors, 'N/A')} • Avg Sub: ${detailQuery.data.fanAnalytics.avgSubscriptionLengthDays ?? 'N/A'}d`}
                      icon={<Eye size={16} />}
                    />
                    <StatCard
                      title="Creator Chat Activity"
                      value={
                        detailQuery.data.chatActivity
                          ? `${formatNumber(detailQuery.data.chatActivity.messagesSent)} msgs`
                          : 'Unavailable'
                      }
                      isUnavailable={!detailQuery.data.chatActivity}
                      subtitle={
                        detailQuery.data.chatActivity
                          ? `PPVs: ${formatNumber(detailQuery.data.chatActivity.ppvsSent)} • Reply: ${formatDurationMs(detailQuery.data.chatActivity.replyTimeMs)}`
                          : 'From /v1/creator-report/chat-summary'
                      }
                      icon={<MessageCircle size={16} />}
                    />
                  </div>

                  {/* Revenue Channel Breakdown */}
                  <Card variant="muted" padding={3}>
                    <Stack
                      direction="horizontal"
                      justify="between"
                      wrap="wrap"
                      gap={3}
                    >
                      <Stack direction="vertical" gap={0.5}>
                        <Text type="supporting">Subscriptions</Text>
                        <Text weight="semibold">
                          {formatCurrency(
                            detailQuery.data.revenue.subscriptionRevenue,
                          )}
                        </Text>
                      </Stack>
                      <Stack direction="vertical" gap={0.5}>
                        <Text type="supporting">Tips</Text>
                        <Text weight="semibold">
                          {formatCurrency(detailQuery.data.revenue.tipsRevenue)}
                        </Text>
                      </Stack>
                      <Stack direction="vertical" gap={0.5}>
                        <Text type="supporting">Messages / PPV</Text>
                        <Text weight="semibold">
                          {formatCurrency(
                            detailQuery.data.revenue.messagesRevenue,
                          )}
                        </Text>
                      </Stack>
                      <Stack direction="vertical" gap={0.5}>
                        <Text type="supporting">Other (Posts / Streams)</Text>
                        <Text weight="semibold">
                          {formatCurrency(detailQuery.data.revenue.otherRevenue)}
                        </Text>
                      </Stack>
                      <Stack direction="vertical" gap={0.5}>
                        <Text type="supporting">Refunds</Text>
                        <Text weight="semibold">
                          {formatCurrency(detailQuery.data.revenue.totalRefunds)}{' '}
                          ({detailQuery.data.revenue.refundCount})
                        </Text>
                      </Stack>
                    </Stack>
                  </Card>

                  {/* Daily Revenue Trend */}
                  {detailQuery.data.dailyRevenue.length > 0 && (
                    <Card padding={4}>
                      <Stack direction="vertical" gap={2}>
                        <Heading level={4}>Daily Earnings Trajectory</Heading>
                        <div style={{ width: '100%', height: 220 }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={detailQuery.data.dailyRevenue}>
                              <CartesianGrid
                                strokeDasharray="3 3"
                                stroke="var(--dashboard-border)"
                              />
                              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                              <YAxis
                                tick={{ fontSize: 11 }}
                                tickFormatter={(v: number) =>
                                  formatCompactCurrency(v, 'USD', '$0')
                                }
                              />
                              <Tooltip
                                formatter={(val: unknown, name: unknown) => [
                                  formatCurrency(Number(val ?? 0)),
                                  String(name),
                                ]}
                              />
                              <Area
                                type="monotone"
                                dataKey="gross"
                                name="Gross"
                                stroke="#2563eb"
                                fill="#2563eb"
                                fillOpacity={0.18}
                              />
                              <Area
                                type="monotone"
                                dataKey="net"
                                name="Net"
                                stroke="#10b981"
                                fill="#10b981"
                                fillOpacity={0.18}
                              />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      </Stack>
                    </Card>
                  )}

                  {/* Recent Transactions */}
                  <Card padding={4}>
                    <Stack direction="vertical" gap={2}>
                      <Heading level={4}>
                        Recent Transactions (
                        {detailQuery.data.recentTransactions.length})
                      </Heading>
                      <DataTable<
                        CreatorDetailResponse['recentTransactions'][number]
                      >
                        columns={[
                          {
                            key: 'date',
                            header: 'Date',
                            render: (tx) => formatDateTime(tx.createdTime),
                          },
                          {
                            key: 'fan',
                            header: 'Fan',
                            render: (tx) => tx.fanName || tx.fanId,
                          },
                          {
                            key: 'type',
                            header: 'Type',
                            render: (tx) => (
                              <Badge variant="neutral" label={tx.type} />
                            ),
                          },
                          {
                            key: 'status',
                            header: 'Status',
                            accessor: 'status',
                          },
                          {
                            key: 'amount',
                            header: 'Gross',
                            render: (tx) =>
                              formatCurrency(tx.amount, tx.currency),
                          },
                          {
                            key: 'net',
                            header: 'Net',
                            render: (tx) =>
                              formatCurrency(tx.net, tx.currency),
                          },
                        ]}
                        rows={detailQuery.data.recentTransactions.slice(0, 10)}
                        rowKey="id"
                        withCard={false}
                        emptyTitle="No transactions recorded"
                        emptyDescription="No transactions recorded in this date range."
                      />
                    </Stack>
                  </Card>
                </Stack>
              ) : null}
            </Stack>
          </div>
        </div>
      )}
    </Stack>
  );
}
