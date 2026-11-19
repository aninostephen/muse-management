import { Badge, type BadgeVariant } from '@astryxdesign/core/Badge';
import { Button } from '@astryxdesign/core/Button';
import { Stack } from '@astryxdesign/core/Stack';
import { Text } from '@astryxdesign/core/Text';
import { Eye } from 'lucide-react';
import type {
  CreatorSummaryItem,
  CreatorsListQuery,
  PaginationMeta,
} from '../../types/api.types';
import { formatCurrency, formatNumber } from '../../utils/formatters';
import { DataTable, type DataTableColumn } from './DataTable';

type CreatorSortField = NonNullable<CreatorsListQuery['sortBy']>;

interface CreatorTableProps {
  items: CreatorSummaryItem[];
  meta?: PaginationMeta;
  sortBy?: CreatorsListQuery['sortBy'];
  sortOrder?: 'asc' | 'desc';
  onSortChange?: (field: CreatorSortField) => void;
  onPageChange?: (page: number) => void;
  onSelectCreator?: (creatorId: string) => void;
  isFetching?: boolean;
  selectedCreatorId?: string | null;
  isDetailLoading?: boolean;
}

function getCreatorStatusBadgeVariant(status: string): BadgeVariant {
  const lower = (status || '').toLowerCase();
  if (lower === 'connected') return 'success';
  if (lower === '2fa') return 'warning';
  if (lower === 'deleted' || lower === 'disconnected') return 'error';
  return 'neutral';
}

export function CreatorTable({
  items,
  meta,
  sortBy = 'totalEarningsGross',
  sortOrder = 'desc',
  onSortChange,
  onPageChange,
  onSelectCreator,
  isFetching = false,
  selectedCreatorId = null,
  isDetailLoading = false,
}: CreatorTableProps) {
  const columns: DataTableColumn<CreatorSummaryItem, CreatorSortField>[] = [
    {
      key: 'creator',
      header: 'Creator',
      sortKey: 'name',
      render: (creator) => (
        <Stack direction="vertical" gap={0.5}>
          <Text weight="semibold">{creator.name}</Text>
          <Text type="supporting">
            {creator.userName ? `@${creator.userName}` : `ID #${creator.id}`}
            {creator.tagName ? ` • ${creator.tagName}` : ''}
          </Text>
        </Stack>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (creator) => (
        <Badge
          variant={getCreatorStatusBadgeVariant(creator.status)}
          label={creator.status || 'connected'}
        />
      ),
    },
    {
      key: 'totalEarningsGross',
      header: 'Gross Earnings',
      sortKey: 'totalEarningsGross',
      render: (creator) => (
        <Text weight="semibold" hasTabularNumbers>
          {formatCurrency(creator.totalEarningsGross, creator.currency)}
        </Text>
      ),
    },
    {
      key: 'totalEarningsNet',
      header: 'Net Earnings',
      sortKey: 'totalEarningsNet',
      render: (creator) => (
        <Text hasTabularNumbers>
          {formatCurrency(creator.totalEarningsNet, creator.currency)}
        </Text>
      ),
    },
    {
      key: 'subscriptionRevenue',
      header: 'Subscriptions',
      sortKey: 'subscriptionRevenue',
      render: (creator) => (
        <Text hasTabularNumbers>
          {formatCurrency(creator.subscriptionRevenue, creator.currency)}
        </Text>
      ),
    },
    {
      key: 'tipsAndMessages',
      header: 'Tips & Messages',
      render: (creator) => (
        <Stack direction="vertical" gap={0}>
          <Text hasTabularNumbers>
            {formatCurrency(
              creator.tipsRevenue + creator.messagesRevenue,
              creator.currency,
            )}
          </Text>
          <Text type="supporting">
            Tips: {formatCurrency(creator.tipsRevenue, creator.currency)} • Msg:{' '}
            {formatCurrency(creator.messagesRevenue, creator.currency)}
          </Text>
        </Stack>
      ),
    },
    {
      key: 'activeFans',
      header: 'Active Fans',
      sortKey: 'activeFans',
      render: (creator) => (
        <Stack direction="vertical" gap={0}>
          <Text hasTabularNumbers>
            {formatNumber(creator.activeFans, 'Unavailable')}
          </Text>
          {creator.newSubscribers !== null && (
            <Text type="supporting">
              +{formatNumber(creator.newSubscribers, '0')} new
            </Text>
          )}
        </Stack>
      ),
    },
    {
      key: 'transactionCount',
      header: 'Transactions',
      sortKey: 'transactionCount',
      render: (creator) => (
        <Text hasTabularNumbers>
          {formatNumber(creator.transactionCount, '0')}
        </Text>
      ),
    },
  ];

  if (onSelectCreator) {
    columns.push({
      key: 'actions',
      header: 'Actions',
      stickyRight: true,
      render: (creator) => (
        <Button
          label="Details"
          size="sm"
          variant="secondary"
          isLoading={isDetailLoading && selectedCreatorId === creator.id}
          icon={<Eye size={14} />}
          onClick={() => onSelectCreator(creator.id)}
        />
      ),
    });
  }

  return (
    <DataTable
      columns={columns}
      rows={items}
      rowKey="id"
      sortBy={sortBy}
      sortOrder={sortOrder}
      onSortChange={onSortChange}
      onRowClick={
        onSelectCreator ? (creator) => onSelectCreator(creator.id) : undefined
      }
      meta={meta}
      onPageChange={onPageChange}
      itemLabel="creators"
      isFetching={isFetching}
      emptyTitle="No creators found"
      emptyDescription="No creators matched the current search or status filter."
    />
  );
}
