import { useState } from 'react';
import { Badge } from '@astryxdesign/core/Badge';
import { Banner } from '@astryxdesign/core/Banner';
import { Button } from '@astryxdesign/core/Button';
import { Card } from '@astryxdesign/core/Card';
import { Divider } from '@astryxdesign/core/Divider';
import { Heading } from '@astryxdesign/core/Heading';
import { Spinner } from '@astryxdesign/core/Spinner';
import { Stack } from '@astryxdesign/core/Stack';
import { Text } from '@astryxdesign/core/Text';
import { TextInput } from '@astryxdesign/core/TextInput';
import {
  DollarSign,
  LockOpen,
  MessageSquare,
  Search,
  UserCheck,
  Users,
  X,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { StatCard } from '../components/dashboard/StatCard';
import { ChatterTable } from '../components/tables/ChatterTable';
import { DataTable } from '../components/tables/DataTable';
import { ErrorState } from '../components/ui/ErrorState';
import { LoadingSkeleton } from '../components/ui/LoadingSkeleton';
import { useChatterDetail, useChatters } from '../hooks/useChatters';
import type {
  ChatterDetailResponse,
  ChattersListQuery,
  DateRangeFilter,
} from '../types/api.types';
import {
  formatCompactCurrency,
  formatCurrency,
  formatNumber,
  formatPercentage,
} from '../utils/formatters';

interface ChattersPageProps {
  dateRange: DateRangeFilter;
}

export function ChattersPage({ dateRange }: ChattersPageProps) {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [sortBy, setSortBy] =
    useState<NonNullable<ChattersListQuery['sortBy']>>('totalSales');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<
    number | string | null
  >(null);

  const chattersQuery = useChatters({
    ...dateRange,
    search,
    status,
    sortBy,
    sortOrder,
    page,
    limit: 10,
  });

  const detailQuery = useChatterDetail(selectedEmployeeId, dateRange);

  const handleSortChange = (
    field: NonNullable<ChattersListQuery['sortBy']>,
  ) => {
    if (sortBy === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
    setPage(1);
  };

  const summary = chattersQuery.data?.summary;

  return (
    <Stack direction="vertical" gap={4}>
      {/* Transparent Employee-Level Attribution Notice */}
      <Banner
        status="info"
        title="Verified Employee-Level Attribution"
        description={
          summary?.attributionSource ||
          'Chatter sales and messaging KPIs are sourced directly from Infloww OpenAPI v1.4 (/v1/employee-report/employee-sales-summary & /v1/employee-report/employee-chat-summary), never inferred from unattributed creator totals.'
        }
      />

      {chattersQuery.isError && (
        <ErrorState
          title="Unable to load Chatters performance"
          error={chattersQuery.error}
          isRetrying={chattersQuery.isFetching}
          onRetry={() => void chattersQuery.refetch()}
        />
      )}

      {/* Summary KPI Cards */}
      {chattersQuery.isLoading ? (
        <LoadingSkeleton variant="cards" count={4} />
      ) : summary ? (
        <div className="kpi-grid">
          <StatCard
            title="Active Chatters"
            value={formatNumber(summary.activeChatters, '0')}
            subtitle={`Total Employees: ${formatNumber(summary.totalEmployees, '0')}`}
            icon={<UserCheck size={18} />}
            badgeLabel="Activated"
            badgeVariant="success"
          />
          <StatCard
            title="Total Attributed Sales"
            value={formatCurrency(summary.totalAttributedSales)}
            subtitle="Verified employee sales across PPV, tips & DMs"
            icon={<DollarSign size={18} />}
            badgeLabel="Employee Report"
            badgeVariant="info"
          />
          <StatCard
            title="Direct PPVs Unlocked"
            value={formatNumber(summary.totalPpvsUnlocked, '0')}
            subtitle="Paid PPV transactions unlocked by fans"
            icon={<LockOpen size={18} />}
          />
          <StatCard
            title="Direct Messages Sent"
            value={formatNumber(summary.totalDirectMessages, '0')}
            subtitle="Excludes automated & mass messages"
            icon={<MessageSquare size={18} />}
          />
        </div>
      ) : null}

      {/* Search & Status Filter */}
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
              label="Search Chatters"
              isLabelHidden
              type="search"
              value={search}
              onChange={(val) => {
                setSearch(val);
                setPage(1);
              }}
              placeholder="Search by employee name or ID..."
              startIcon={<Search size={16} />}
              hasClear
              width="100%"
            />
          </div>

          <Stack direction="horizontal" gap={1} align="center" wrap="wrap">
            <Text type="supporting">Employee Status:</Text>
            {['all', 'Activated', 'Deactivated', 'Deleted'].map((s) => (
              <Button
                key={s}
                label={s === 'all' ? 'All Employees' : s}
                size="sm"
                variant={status === s ? 'primary' : 'secondary'}
                isLoading={chattersQuery.isFetching && status === s}
                isDisabled={chattersQuery.isFetching}
                onClick={() => {
                  setStatus(s);
                  setPage(1);
                }}
              />
            ))}
          </Stack>
        </Stack>
      </Card>

      {/* Chatters Table */}
      {chattersQuery.isLoading ? (
        <LoadingSkeleton variant="table" count={8} />
      ) : (
        <ChatterTable
          items={chattersQuery.data?.items || []}
          meta={chattersQuery.data?.meta}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSortChange={handleSortChange}
          onPageChange={setPage}
          onSelectChatter={(empId) => setSelectedEmployeeId(empId)}
          isFetching={chattersQuery.isFetching}
          selectedEmployeeId={selectedEmployeeId}
          isDetailLoading={detailQuery.isFetching}
        />
      )}

      {/* Chatter Detail Modal */}
      {selectedEmployeeId !== null && (
        <div
          className="modal-backdrop"
          onClick={() => setSelectedEmployeeId(null)}
        >
          <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
            <Stack direction="vertical" gap={4} padding={5}>
              <Stack direction="horizontal" justify="between" align="center">
                <Stack direction="vertical" gap={0.5}>
                  <Stack direction="horizontal" gap={2} align="center">
                    <Heading level={2}>
                      {detailQuery.data?.chatter.name ||
                        `Employee #${selectedEmployeeId}`}
                    </Heading>
                    {detailQuery.data?.chatter.status && (
                      <Badge
                        variant="success"
                        label={detailQuery.data.chatter.status}
                      />
                    )}
                  </Stack>
                  <Text type="supporting">
                    Employee ID #{selectedEmployeeId} • Assigned Creators &
                    Daily Sales Breakdown
                  </Text>
                </Stack>

                <Button
                  label="Close"
                  variant="secondary"
                  size="sm"
                  icon={<X size={16} />}
                  onClick={() => setSelectedEmployeeId(null)}
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
                    label="Loading chatter assignments & sales breakdown..."
                  />
                </Stack>
              ) : detailQuery.isError ? (
                <ErrorState
                  title="Unable to load chatter detail"
                  error={detailQuery.error}
                  isRetrying={detailQuery.isFetching}
                  onRetry={() => void detailQuery.refetch()}
                />
              ) : detailQuery.data ? (
                <Stack direction="vertical" gap={4}>
                  {/* Chatter KPI Summary */}
                  <div className="kpi-grid">
                    <StatCard
                      title="Total Attributed Sales"
                      value={formatCurrency(
                        detailQuery.data.metrics.totalSales,
                      )}
                      subtitle={`PPV: ${formatCurrency(detailQuery.data.metrics.ppvSales)} • Tips: ${formatCurrency(detailQuery.data.metrics.tipsSales)}`}
                      icon={<DollarSign size={16} />}
                    />
                    <StatCard
                      title="PPVs Unlocked"
                      value={formatNumber(
                        detailQuery.data.metrics.ppvsUnlocked,
                        '0',
                      )}
                      subtitle={`Unlock Rate: ${formatPercentage(detailQuery.data.metrics.unlockRate, 1, 'N/A')} • Avg PPV: ${formatCurrency(detailQuery.data.metrics.averagePpvSaleValue, 'USD', 'N/A')}`}
                      icon={<LockOpen size={16} />}
                    />
                    <StatCard
                      title="Direct Messages"
                      value={formatNumber(
                        detailQuery.data.metrics.directMessagesSent,
                        '0',
                      )}
                      subtitle={`Golden Ratio: ${formatPercentage(detailQuery.data.metrics.goldenRatio, 1, 'N/A')}`}
                      icon={<MessageSquare size={16} />}
                    />
                    <StatCard
                      title="Assigned Creators"
                      value={formatNumber(
                        detailQuery.data.assignedCreators.length,
                        '0',
                      )}
                      subtitle="Via /v1/employees/assigned-creators"
                      icon={<Users size={16} />}
                    />
                  </div>

                  {/* Assigned Creators Chips */}
                  <Card variant="muted" padding={3}>
                    <Stack direction="vertical" gap={2}>
                      <Text type="label" weight="semibold">
                        Assigned Creators (
                        {detailQuery.data.assignedCreators.length})
                      </Text>
                      {detailQuery.data.assignedCreators.length === 0 ? (
                        <Text type="supporting">
                          No creators currently assigned to this employee.
                        </Text>
                      ) : (
                        <Stack direction="horizontal" gap={1.5} wrap="wrap">
                          {detailQuery.data.assignedCreators.map((c) => (
                            <Badge
                              key={c.creatorId}
                              variant="info"
                              label={`${c.name}${c.userName ? ` (@${c.userName})` : ''}`}
                            />
                          ))}
                        </Stack>
                      )}
                    </Stack>
                  </Card>

                  {/* Daily Sales Chart */}
                  {detailQuery.data.dailyPerformance.length > 0 && (
                    <Card padding={4}>
                      <Stack direction="vertical" gap={2}>
                        <Heading level={4}>
                          Daily Sales Breakdown (PPV vs. Tips)
                        </Heading>
                        <div style={{ width: '100%', height: 230 }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={detailQuery.data.dailyPerformance}>
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
                              <Legend />
                              <Bar
                                dataKey="ppvSales"
                                name="PPV Sales"
                                fill="#2563eb"
                                radius={[4, 4, 0, 0]}
                              />
                              <Bar
                                dataKey="tipsSales"
                                name="Tips Sales"
                                fill="#10b981"
                                radius={[4, 4, 0, 0]}
                              />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </Stack>
                    </Card>
                  )}

                  {/* Sales by Creator Breakdown */}
                  {detailQuery.data.salesByCreator.length > 0 && (
                    <Card padding={4}>
                      <Stack direction="vertical" gap={2}>
                        <Heading level={4}>Sales Generated per Creator</Heading>
                        <DataTable<
                          ChatterDetailResponse['salesByCreator'][number]
                        >
                          columns={[
                            {
                              key: 'creatorName',
                              header: 'Creator',
                              render: (row) => (
                                <Text weight="semibold">{row.creatorName}</Text>
                              ),
                            },
                            {
                              key: 'totalSales',
                              header: 'Total Sales',
                              render: (row) => formatCurrency(row.totalSales),
                            },
                            {
                              key: 'ppvSales',
                              header: 'PPV Sales',
                              render: (row) => formatCurrency(row.ppvSales),
                            },
                            {
                              key: 'tipsSales',
                              header: 'Tips Sales',
                              render: (row) => formatCurrency(row.tipsSales),
                            },
                          ]}
                          rows={detailQuery.data.salesByCreator}
                          rowKey="platformPid"
                          withCard={false}
                        />
                      </Stack>
                    </Card>
                  )}
                </Stack>
              ) : null}
            </Stack>
          </div>
        </div>
      )}
    </Stack>
  );
}
