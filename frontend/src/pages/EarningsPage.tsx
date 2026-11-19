import { useState } from 'react';
import { Badge } from '@astryxdesign/core/Badge';
import { Button } from '@astryxdesign/core/Button';
import { Card } from '@astryxdesign/core/Card';
import { Heading } from '@astryxdesign/core/Heading';
import { Stack } from '@astryxdesign/core/Stack';
import { Text } from '@astryxdesign/core/Text';
import {
  ArrowDownRight,
  DollarSign,
  Percent,
  Receipt,
  RotateCcw,
  Wallet,
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
import { useEarnings } from '../hooks/useEarnings';
import type {
  DateRangeFilter,
  EarningsResponse,
  RevenueCategoryBreakdown,
  RevenueGranularity,
} from '../types/api.types';
import {
  formatCurrency,
  formatDateTime,
  formatNumber,
  formatPercentage,
} from '../utils/formatters';

interface EarningsPageProps {
  dateRange: DateRangeFilter;
}

export function EarningsPage({ dateRange }: EarningsPageProps) {
  const [selectedCreatorId, setSelectedCreatorId] = useState<string>('');
  const [granularity, setGranularity] = useState<RevenueGranularity>('daily');
  const [page, setPage] = useState(1);

  const earningsQuery = useEarnings({
    ...dateRange,
    creatorId: selectedCreatorId || undefined,
    granularity,
    page,
    limit: 10,
  });

  const summary = earningsQuery.data?.summary;
  const currency = summary?.currency || 'USD';

  const categoryColumns: DataTableColumn<RevenueCategoryBreakdown>[] = [
    {
      key: 'category',
      header: 'Category',
      render: (cat) => <Badge variant="info" label={cat.category} />,
    },
    {
      key: 'transactionCount',
      header: 'Transactions',
      render: (cat) => formatNumber(cat.transactionCount, '0'),
    },
    {
      key: 'gross',
      header: 'Gross Revenue',
      render: (cat) => (
        <Text weight="semibold" hasTabularNumbers>
          {formatCurrency(cat.gross, currency)}
        </Text>
      ),
    },
    {
      key: 'fee',
      header: 'Platform Fees',
      render: (cat) => (
        <Text hasTabularNumbers>{formatCurrency(cat.fee, currency)}</Text>
      ),
    },
    {
      key: 'net',
      header: 'Net Revenue',
      render: (cat) => (
        <Text hasTabularNumbers>{formatCurrency(cat.net, currency)}</Text>
      ),
    },
    {
      key: 'percentageOfGross',
      header: '% of Gross',
      render: (cat) => (
        <Badge
          variant="neutral"
          label={formatPercentage(cat.percentageOfGross, 1)}
        />
      ),
    },
  ];

  type TransactionRow = EarningsResponse['recentTransactions'][number];

  const transactionColumns: DataTableColumn<TransactionRow>[] = [
    {
      key: 'createdTime',
      header: 'Timestamp',
      render: (tx) => formatDateTime(tx.createdTime),
    },
    {
      key: 'creatorName',
      header: 'Creator',
      render: (tx) => <Text weight="medium">{tx.creatorName}</Text>,
    },
    {
      key: 'fan',
      header: 'Fan',
      render: (tx) => tx.fanName || tx.fanId,
    },
    {
      key: 'type',
      header: 'Type',
      render: (tx) => <Badge variant="neutral" label={tx.type} />,
    },
    {
      key: 'tipSource',
      header: 'Tip Source',
      render: (tx) => <Text type="supporting">{tx.tipSource}</Text>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (tx) => (
        <Badge
          variant={
            tx.status === 'done'
              ? 'success'
              : tx.status === 'loading'
                ? 'warning'
                : 'neutral'
          }
          label={tx.status}
        />
      ),
    },
    {
      key: 'gross',
      header: 'Gross',
      render: (tx) => (
        <Text weight="semibold" hasTabularNumbers>
          {formatCurrency(tx.gross, tx.currency)}
        </Text>
      ),
    },
    {
      key: 'fee',
      header: 'Fee',
      render: (tx) => (
        <Text hasTabularNumbers>{formatCurrency(tx.fee, tx.currency)}</Text>
      ),
    },
    {
      key: 'net',
      header: 'Net',
      render: (tx) => (
        <Text hasTabularNumbers>{formatCurrency(tx.net, tx.currency)}</Text>
      ),
    },
  ];

  return (
    <Stack direction="vertical" gap={4}>
      {earningsQuery.isError && (
        <ErrorState
          title="Unable to load Earnings & Transactions analytics"
          error={earningsQuery.error}
          isRetrying={earningsQuery.isFetching}
          onRetry={() => void earningsQuery.refetch()}
        />
      )}

      {/* Filter Bar: Creator Selector & Time Granularity */}
      <Card padding={4}>
        <Stack
          direction="horizontal"
          justify="between"
          align="center"
          wrap="wrap"
          gap={3}
        >
          <Stack direction="horizontal" gap={2} align="center" wrap="wrap">
            <Text type="label" weight="semibold">
              Filter by Creator:
            </Text>
            <select
              aria-label="Filter earnings by creator"
              disabled={earningsQuery.isFetching}
              value={selectedCreatorId}
              onChange={(e) => {
                setSelectedCreatorId(e.target.value);
                setPage(1);
              }}
              style={{
                height: 32,
                padding: '0 10px',
                borderRadius: 8,
                border: '1px solid var(--dashboard-border)',
                backgroundColor: 'var(--dashboard-surface)',
                color: 'inherit',
                fontSize: 13.5,
                minWidth: 220,
                opacity: earningsQuery.isFetching ? 0.65 : 1,
              }}
            >
              <option value="">All Connected Creators</option>
              {(earningsQuery.data?.creators || []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.userName ? `(@${c.userName})` : ''}
                </option>
              ))}
            </select>
            {selectedCreatorId && (
              <Button
                label="Clear Filter"
                size="sm"
                variant="ghost"
                isDisabled={earningsQuery.isFetching}
                onClick={() => {
                  setSelectedCreatorId('');
                  setPage(1);
                }}
              />
            )}
          </Stack>

          <Stack direction="horizontal" gap={1} align="center">
            <Text type="supporting">Aggregation:</Text>
            {(['daily', 'weekly', 'monthly'] as RevenueGranularity[]).map(
              (g) => (
                <Button
                  key={g}
                  label={g.charAt(0).toUpperCase() + g.slice(1)}
                  size="sm"
                  variant={granularity === g ? 'primary' : 'secondary'}
                  isLoading={earningsQuery.isFetching && granularity === g}
                  isDisabled={earningsQuery.isFetching}
                  onClick={() => setGranularity(g)}
                />
              ),
            )}
          </Stack>
        </Stack>
      </Card>

      {/* Revenue Summary KPIs */}
      {earningsQuery.isLoading ? (
        <LoadingSkeleton variant="cards" count={5} />
      ) : summary ? (
        <div className="kpi-grid">
          <StatCard
            title="Gross Revenue"
            value={formatCurrency(summary.totalGross, currency)}
            subtitle={`${formatNumber(summary.transactionCount, '0')} transactions`}
            icon={<DollarSign size={18} />}
            badgeLabel="Gross"
            badgeVariant="info"
          />
          <StatCard
            title="Net Revenue (After OF Fee)"
            value={formatCurrency(summary.totalNet, currency)}
            subtitle={`Platform Fees: ${formatCurrency(summary.totalFees, currency)}`}
            icon={<Wallet size={18} />}
            badgeLabel="Net"
            badgeVariant="success"
          />
          <StatCard
            title="Refunds & Reversals"
            value={formatCurrency(summary.totalRefunds, currency)}
            subtitle={`${formatNumber(summary.refundCount, '0')} refund events (/v1/refunds)`}
            icon={<RotateCcw size={18} />}
            badgeLabel={summary.refundCount > 0 ? 'Refunded' : '0 Refunds'}
            badgeVariant={summary.refundCount > 0 ? 'warning' : 'neutral'}
          />
          <StatCard
            title="Net After Refunds"
            value={formatCurrency(summary.netAfterRefunds, currency)}
            subtitle="Net earnings minus verified refunds"
            icon={<ArrowDownRight size={18} />}
          />
          <StatCard
            title="Avg Transaction Value"
            value={formatCurrency(
              summary.averageTransactionGross,
              currency,
              'N/A',
            )}
            isUnavailable={summary.averageTransactionGross === null}
            subtitle="Gross revenue per transaction"
            icon={<Percent size={18} />}
          />
        </div>
      ) : null}

      {/* Revenue Over Time Chart */}
      {earningsQuery.isLoading ? (
        <LoadingSkeleton variant="chart" />
      ) : earningsQuery.data ? (
        <>
          <RevenueChart
            data={earningsQuery.data.timeSeries}
            granularity={granularity}
            onGranularityChange={setGranularity}
            isFetching={earningsQuery.isFetching}
            currency={currency}
          />

          <div className="charts-grid-2">
            <RevenueByCreatorChart
              data={earningsQuery.data.byCreator}
              currency={currency}
            />
            <RevenueCategoryPieChart
              data={earningsQuery.data.byCategory}
              currency={currency}
            />
          </div>

          {/* Category Breakdown Table */}
          <Card padding={4}>
            <Stack direction="vertical" gap={3}>
              <Heading level={3}>
                Revenue Breakdown by Transaction Category
              </Heading>
              <DataTable
                columns={categoryColumns}
                rows={earningsQuery.data.byCategory}
                rowKey="category"
                isFetching={earningsQuery.isFetching}
                withCard={false}
                emptyTitle="No category transactions"
                emptyDescription="No revenue transactions were found for the current filters."
              />
            </Stack>
          </Card>

          {/* Recent Transactions Log */}
          <Card padding={0}>
            <Stack direction="vertical" gap={0}>
              <Stack
                direction="horizontal"
                justify="between"
                align="center"
                padding={4}
              >
                <Stack direction="horizontal" gap={1.5} align="center">
                  <Receipt size={18} style={{ color: '#2563eb' }} />
                  <Heading level={3}>Recent Transactions Log</Heading>
                </Stack>
                <Text type="supporting">
                  Verified transactions from /v1/transactions (10 per page)
                </Text>
              </Stack>

              <DataTable
                columns={transactionColumns}
                rows={earningsQuery.data.recentTransactions}
                rowKey={(tx) => `${tx.creatorId}-${tx.id}`}
                meta={earningsQuery.data.transactionsMeta}
                onPageChange={setPage}
                itemLabel="transactions"
                isFetching={earningsQuery.isFetching}
                withCard={false}
                emptyTitle="No recent transactions"
                emptyDescription="No transactions were found in the selected time range."
              />
            </Stack>
          </Card>
        </>
      ) : null}
    </Stack>
  );
}
