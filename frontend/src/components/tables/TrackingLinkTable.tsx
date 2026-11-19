import { Badge, type BadgeVariant } from '@astryxdesign/core/Badge';
import { Button } from '@astryxdesign/core/Button';
import { Stack } from '@astryxdesign/core/Stack';
import { Text } from '@astryxdesign/core/Text';
import { ExternalLink, Users } from 'lucide-react';
import type {
  MarketingLinkItem,
  MarketingLinkType,
  PaginationMeta,
  TrackingLinksQuery,
} from '../../types/api.types';
import {
  formatCurrency,
  formatDate,
  formatNumber,
  formatPercentage,
} from '../../utils/formatters';
import { DataTable, type DataTableColumn } from './DataTable';

type TrackingLinkSortField = NonNullable<TrackingLinksQuery['sortBy']>;

interface TrackingLinkTableProps {
  items: MarketingLinkItem[];
  meta?: PaginationMeta;
  sortBy?: TrackingLinksQuery['sortBy'];
  sortOrder?: 'asc' | 'desc';
  onSortChange?: (field: TrackingLinkSortField) => void;
  onPageChange?: (page: number) => void;
  onInspectFans?: (link: MarketingLinkItem) => void;
  isFetching?: boolean;
  inspectedLinkId?: string | null;
  isFansLoading?: boolean;
}

function getLinkTypeBadge(linkType: MarketingLinkType): {
  label: string;
  variant: BadgeVariant;
} {
  if (linkType === 'TRACKING') {
    return { label: 'Tracking Link', variant: 'info' };
  }
  if (linkType === 'TRIAL') {
    return { label: 'Free Trial Link', variant: 'purple' };
  }
  return { label: 'Profile Promotion', variant: 'teal' };
}

export function TrackingLinkTable({
  items,
  meta,
  sortBy = 'grossRevenue',
  sortOrder = 'desc',
  onSortChange,
  onPageChange,
  onInspectFans,
  isFetching = false,
  inspectedLinkId = null,
  isFansLoading = false,
}: TrackingLinkTableProps) {
  const columns: DataTableColumn<MarketingLinkItem, TrackingLinkSortField>[] = [
    {
      key: 'campaign',
      header: 'Campaign / Link',
      render: (link) => (
        <Stack direction="vertical" gap={0.5}>
          <Text weight="semibold">{link.name}</Text>
          <Stack direction="horizontal" gap={1} align="center">
            {link.code && <Text type="code">c{link.code}</Text>}
            {link.url && (
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  color: 'var(--dashboard-accent)',
                  fontSize: 12,
                  textDecoration: 'none',
                }}
              >
                <span>Link</span>
                <ExternalLink size={11} />
              </a>
            )}
            {link.discountPercentage !== null && (
              <Text type="supporting">{link.discountPercentage}% off</Text>
            )}
          </Stack>
        </Stack>
      ),
    },
    {
      key: 'linkType',
      header: 'Type',
      render: (link) => {
        const badge = getLinkTypeBadge(link.linkType);
        return <Badge variant={badge.variant} label={badge.label} />;
      },
    },
    {
      key: 'creator',
      header: 'Creator',
      render: (link) => (
        <Stack direction="vertical" gap={0}>
          <Text weight="medium">{link.creatorName}</Text>
          {link.creatorUserName && (
            <Text type="supporting">@{link.creatorUserName}</Text>
          )}
        </Stack>
      ),
    },
    {
      key: 'clicks',
      header: 'Clicks',
      sortKey: 'clicks',
      render: (link) =>
        link.linkType === 'TRACKING' ? (
          <Text hasTabularNumbers>{formatNumber(link.clicks, '0')}</Text>
        ) : (
          <Text type="supporting">N/A ({link.linkType})</Text>
        ),
    },
    {
      key: 'subscribers',
      header: 'New Subscribers',
      sortKey: 'subscribers',
      render: (link) => (
        <Stack direction="vertical" gap={0}>
          <Text weight="semibold" hasTabularNumbers>
            {formatNumber(link.subscribers, '0')}
          </Text>
          <Text type="supporting">
            {formatNumber(link.payingFansCount, '0')} paying
          </Text>
        </Stack>
      ),
    },
    {
      key: 'conversionRate',
      header: 'Conversion Rate',
      sortKey: 'conversionRate',
      render: (link) =>
        link.linkType === 'TRACKING' ? (
          <Badge
            variant={
              link.conversionRate !== null && link.conversionRate >= 10
                ? 'success'
                : 'neutral'
            }
            label={formatPercentage(link.conversionRate, 2, '0.00%')}
          />
        ) : (
          <Text type="supporting">
            Spend CVR:{' '}
            {formatPercentage(link.spendingConversionRate, 1, 'N/A')}
          </Text>
        ),
    },
    {
      key: 'grossRevenue',
      header: 'Gross Attributed',
      sortKey: 'grossRevenue',
      render: (link) => (
        <Text weight="semibold" hasTabularNumbers>
          {formatCurrency(link.grossRevenue, link.currency)}
        </Text>
      ),
    },
    {
      key: 'netRevenue',
      header: 'Net Attributed',
      sortKey: 'netRevenue',
      render: (link) => (
        <Text hasTabularNumbers>
          {formatCurrency(link.netRevenue, link.currency)}
        </Text>
      ),
    },
    {
      key: 'epcAeps',
      header: 'EPC / AEPS',
      render: (link) => (
        <Stack direction="vertical" gap={0}>
          <Text type="supporting">
            AEPS: {formatCurrency(link.aepsNet, link.currency, 'N/A')}
          </Text>
          {link.linkType === 'TRACKING' && (
            <Text type="supporting">
              EPC: {formatCurrency(link.epcNet, link.currency, 'N/A')}
            </Text>
          )}
        </Stack>
      ),
    },
    {
      key: 'createdTime',
      header: 'Created',
      sortKey: 'createdTime',
      render: (link) => (
        <Text type="supporting">{formatDate(link.createdTime)}</Text>
      ),
    },
  ];

  if (onInspectFans) {
    columns.push({
      key: 'actions',
      header: 'Actions',
      stickyRight: true,
      render: (link) => (
        <Button
          label="Fans"
          size="sm"
          variant="secondary"
          isLoading={isFansLoading && inspectedLinkId === link.id}
          icon={<Users size={13} />}
          onClick={() => onInspectFans(link)}
        />
      ),
    });
  }

  return (
    <DataTable
      columns={columns}
      rows={items}
      rowKey={(link) => `${link.linkType}-${link.creatorId}-${link.id}`}
      sortBy={sortBy}
      sortOrder={sortOrder}
      onSortChange={onSortChange}
      meta={meta}
      onPageChange={onPageChange}
      itemLabel="marketing links"
      isFetching={isFetching}
      emptyTitle="No marketing links or campaigns found"
      emptyDescription="No tracking links, free trial links, or promotions matched your current filters."
    />
  );
}
