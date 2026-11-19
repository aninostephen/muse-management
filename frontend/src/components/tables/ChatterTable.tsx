import { Badge, type BadgeVariant } from '@astryxdesign/core/Badge';
import { Button } from '@astryxdesign/core/Button';
import { Stack } from '@astryxdesign/core/Stack';
import { Text } from '@astryxdesign/core/Text';
import { Eye } from 'lucide-react';
import type {
  ChatterSummaryItem,
  ChattersListQuery,
  PaginationMeta,
} from '../../types/api.types';
import {
  formatCurrency,
  formatDurationMs,
  formatNumber,
  formatPercentage,
} from '../../utils/formatters';
import { DataTable, type DataTableColumn } from './DataTable';

type ChatterSortField = NonNullable<ChattersListQuery['sortBy']>;

interface ChatterTableProps {
  items: ChatterSummaryItem[];
  meta?: PaginationMeta;
  sortBy?: ChattersListQuery['sortBy'];
  sortOrder?: 'asc' | 'desc';
  onSortChange?: (field: ChatterSortField) => void;
  onPageChange?: (page: number) => void;
  onSelectChatter?: (employeeId: number | string) => void;
  isFetching?: boolean;
  selectedEmployeeId?: number | string | null;
  isDetailLoading?: boolean;
}

function getEmployeeStatusBadgeVariant(status: string): BadgeVariant {
  const lower = (status || '').toLowerCase();
  if (lower === 'activated') return 'success';
  if (lower === 'deactivated') return 'warning';
  if (lower === 'deleted') return 'error';
  return 'neutral';
}

export function ChatterTable({
  items,
  meta,
  sortBy = 'totalSales',
  sortOrder = 'desc',
  onSortChange,
  onPageChange,
  onSelectChatter,
  isFetching = false,
  selectedEmployeeId = null,
  isDetailLoading = false,
}: ChatterTableProps) {
  const columns: DataTableColumn<ChatterSummaryItem, ChatterSortField>[] = [
    {
      key: 'chatter',
      header: 'Chatter / Employee',
      sortKey: 'name',
      render: (chatter) => (
        <Stack direction="vertical" gap={0.5}>
          <Text weight="semibold">{chatter.name}</Text>
          <Text type="supporting">Employee ID #{chatter.employeeId}</Text>
        </Stack>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (chatter) => (
        <Badge
          variant={getEmployeeStatusBadgeVariant(chatter.status)}
          label={chatter.status}
        />
      ),
    },
    {
      key: 'totalSales',
      header: 'Total Attributed Sales',
      sortKey: 'totalSales',
      render: (chatter) => (
        <Text weight="semibold" hasTabularNumbers>
          {formatCurrency(chatter.totalSales, chatter.currency)}
        </Text>
      ),
    },
    {
      key: 'ppvSales',
      header: 'PPV Sales',
      sortKey: 'ppvSales',
      render: (chatter) => (
        <Text hasTabularNumbers>
          {formatCurrency(chatter.ppvSales, chatter.currency)}
        </Text>
      ),
    },
    {
      key: 'tipsSales',
      header: 'Tips Sales',
      sortKey: 'tipsSales',
      render: (chatter) => (
        <Text hasTabularNumbers>
          {formatCurrency(chatter.tipsSales, chatter.currency)}
        </Text>
      ),
    },
    {
      key: 'ppvsUnlocked',
      header: 'PPVs Unlocked',
      sortKey: 'ppvsUnlocked',
      render: (chatter) => (
        <Stack direction="vertical" gap={0}>
          <Text hasTabularNumbers>
            {formatNumber(chatter.ppvsUnlocked, '0')}
          </Text>
          <Text type="supporting">
            of {formatNumber(chatter.directPpvsSent, '0')} sent
          </Text>
        </Stack>
      ),
    },
    {
      key: 'unlockRate',
      header: 'PPV Unlock Rate',
      sortKey: 'unlockRate',
      render: (chatter) => (
        <Badge
          variant={
            chatter.unlockRate !== null && chatter.unlockRate >= 15
              ? 'success'
              : 'neutral'
          }
          label={formatPercentage(chatter.unlockRate, 1, 'N/A')}
        />
      ),
    },
    {
      key: 'averagePpvSaleValue',
      header: 'Avg PPV Value',
      render: (chatter) => (
        <Text hasTabularNumbers>
          {formatCurrency(
            chatter.averagePpvSaleValue,
            chatter.currency,
            'N/A',
          )}
        </Text>
      ),
    },
    {
      key: 'directMessagesSent',
      header: 'Direct Messages',
      sortKey: 'directMessagesSent',
      render: (chatter) => (
        <Stack direction="vertical" gap={0}>
          <Text hasTabularNumbers>
            {formatNumber(chatter.directMessagesSent, '0')}
          </Text>
          <Text type="supporting">
            {formatNumber(chatter.fansChatted, '0')} fans chatted
          </Text>
        </Stack>
      ),
    },
    {
      key: 'avgReplyTime',
      header: 'Avg Reply Time',
      render: (chatter) => (
        <Text hasTabularNumbers>
          {formatDurationMs(
            chatter.avgResponseTimeClockedMs ??
              chatter.avgResponseTimeScheduledMs,
            'N/A',
          )}
        </Text>
      ),
    },
  ];

  if (onSelectChatter) {
    columns.push({
      key: 'actions',
      header: 'Actions',
      stickyRight: true,
      render: (chatter) => (
        <Button
          label="Inspect"
          size="sm"
          variant="secondary"
          isLoading={
            isDetailLoading &&
            selectedEmployeeId !== null &&
            String(selectedEmployeeId) === String(chatter.employeeId)
          }
          icon={<Eye size={14} />}
          onClick={() => onSelectChatter(chatter.employeeId)}
        />
      ),
    });
  }

  return (
    <DataTable
      columns={columns}
      rows={items}
      rowKey="employeeId"
      sortBy={sortBy}
      sortOrder={sortOrder}
      onSortChange={onSortChange}
      onRowClick={
        onSelectChatter
          ? (chatter) => onSelectChatter(chatter.employeeId)
          : undefined
      }
      meta={meta}
      onPageChange={onPageChange}
      itemLabel="chatters"
      isFetching={isFetching}
      emptyTitle="No chatters found"
      emptyDescription="No employees matched the selected search or status filter."
    />
  );
}
