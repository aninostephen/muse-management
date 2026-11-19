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
  AlertCircle,
  DollarSign,
  Link2,
  MousePointerClick,
  Percent,
  Search,
  UserPlus,
  X,
} from 'lucide-react';
import { StatCard } from '../components/dashboard/StatCard';
import { DataTable } from '../components/tables/DataTable';
import { TrackingLinkTable } from '../components/tables/TrackingLinkTable';
import { ErrorState } from '../components/ui/ErrorState';
import { LoadingSkeleton } from '../components/ui/LoadingSkeleton';
import {
  useLinkFans,
  useTrackingLinks,
} from '../hooks/useTrackingLinks';
import type {
  DateRangeFilter,
  LinkFansBreakdownResponse,
  MarketingLinkItem,
  MarketingLinkType,
  TrackingLinksQuery,
} from '../types/api.types';
import {
  formatCurrency,
  formatDateTime,
  formatNumber,
  formatPercentage,
} from '../utils/formatters';

interface MarketingPageProps {
  dateRange: DateRangeFilter;
}

export function MarketingPage({ dateRange }: MarketingPageProps) {
  const [selectedCreatorId, setSelectedCreatorId] = useState<string>('');
  const [linkType, setLinkType] = useState<'ALL' | MarketingLinkType>('ALL');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] =
    useState<NonNullable<TrackingLinksQuery['sortBy']>>('grossRevenue');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [inspectedLink, setInspectedLink] =
    useState<MarketingLinkItem | null>(null);
  const [fansPage, setFansPage] = useState(1);

  const linksQuery = useTrackingLinks({
    ...dateRange,
    creatorId: selectedCreatorId || undefined,
    linkType,
    search,
    sortBy,
    sortOrder,
    page,
    limit: 10,
  });

  const linkFansQuery = useLinkFans(
    inspectedLink
      ? {
          creatorId: inspectedLink.creatorId,
          linkType: inspectedLink.linkType,
          linkId: inspectedLink.id,
          page: fansPage,
          limit: 10,
        }
      : null,
  );

  const handleSortChange = (
    field: NonNullable<TrackingLinksQuery['sortBy']>,
  ) => {
    if (sortBy === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
    setPage(1);
  };

  const summary = linksQuery.data?.summary;

  return (
    <Stack direction="vertical" gap={4}>
      {/* Transparent Promotion Cost & ROI Limitation Notice per Task-Info.md */}
      <Banner
        status="warning"
        title="Tracking-Link Attribution vs. Marketing Cost ROI"
        description={
          summary?.limitationNote ||
          'Infloww OpenAPI v1.4 (/v1/links) provides verified link clicks, new subscribers, conversion rates, and attributed gross/net revenue, but does not store external promotion or ad spend costs. Cost per Subscriber and cost-based ROI are explicitly shown as Unavailable rather than fabricated.'
        }
      />

      {linksQuery.isError && (
        <ErrorState
          title="Unable to load Marketing & Tracking Links analytics"
          error={linksQuery.error}
          isRetrying={linksQuery.isFetching}
          onRetry={() => void linksQuery.refetch()}
        />
      )}

      {/* Marketing Summary KPIs */}
      {linksQuery.isLoading ? (
        <LoadingSkeleton variant="cards" count={6} />
      ) : summary ? (
        <div className="kpi-grid">
          <StatCard
            title="Total Tracking Clicks"
            value={formatNumber(summary.totalClicks, '0')}
            subtitle={`Across ${formatNumber(summary.trackingLinksCount, '0')} tracking links`}
            icon={<MousePointerClick size={18} />}
            badgeLabel="Tracking Links"
            badgeVariant="info"
          />

          <StatCard
            title="New Subscribers Acquired"
            value={formatNumber(summary.totalNewSubscribers, '0')}
            subtitle={`Tracking: ${formatNumber(summary.trackingSubscribers, '0')} • Paying Fans: ${formatNumber(summary.totalPayingFans, '0')}`}
            icon={<UserPlus size={18} />}
            badgeLabel="All Campaigns"
            badgeVariant="success"
          />

          <StatCard
            title="Tracking Conversion Rate"
            value={formatPercentage(summary.trackingConversionRate, 2, 'N/A')}
            isUnavailable={summary.trackingConversionRate === null}
            subtitle="Subscribers ÷ Clicks × 100 (TRACKING links)"
            icon={<Percent size={18} />}
          />

          <StatCard
            title="Attributed Gross Revenue"
            value={formatCurrency(summary.totalGrossRevenue)}
            subtitle={`Net Attributed: ${formatCurrency(summary.totalNetRevenue)}`}
            icon={<DollarSign size={18} />}
            badgeLabel="Link Attribution"
            badgeVariant="purple"
          />

          <StatCard
            title="Total Campaigns & Links"
            value={formatNumber(summary.totalLinks, '0')}
            subtitle={`Tracking: ${summary.trackingLinksCount} • Trial: ${summary.trialLinksCount} • Promo: ${summary.campaignsCount}`}
            icon={<Link2 size={18} />}
          />

          <StatCard
            title="Cost / Subscriber & ROI"
            value="Unavailable"
            isUnavailable
            subtitle="Promotion cost is not exposed by Infloww API"
            icon={<AlertCircle size={18} />}
            badgeLabel="API Limitation"
            badgeVariant="warning"
          />
        </div>
      ) : null}

      {/* Filter Bar */}
      <Card padding={4}>
        <Stack
          direction="horizontal"
          justify="between"
          align="center"
          wrap="wrap"
          gap={3}
        >
          <div style={{ minWidth: 260, flex: 1, maxWidth: 380 }}>
            <TextInput
              label="Search Marketing Links"
              isLabelHidden
              type="search"
              value={search}
              onChange={(val) => {
                setSearch(val);
                setPage(1);
              }}
              placeholder="Search by link name, campaign message, code, or creator..."
              startIcon={<Search size={16} />}
              hasClear
              width="100%"
            />
          </div>

          <Stack direction="horizontal" gap={2} align="center" wrap="wrap">
            <select
              aria-label="Filter marketing links by creator"
              disabled={linksQuery.isFetching}
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
                opacity: linksQuery.isFetching ? 0.65 : 1,
              }}
            >
              <option value="">All Connected Creators</option>
              {(linksQuery.data?.creators || []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            <Stack direction="horizontal" gap={1}>
              {(
                [
                  { id: 'ALL', label: 'All Types' },
                  { id: 'TRACKING', label: 'Tracking Links' },
                  { id: 'TRIAL', label: 'Free Trial Links' },
                  { id: 'CAMPAIGN', label: 'Promotions' },
                ] as const
              ).map((t) => (
                <Button
                  key={t.id}
                  label={t.label}
                  size="sm"
                  variant={linkType === t.id ? 'primary' : 'secondary'}
                  isLoading={linksQuery.isFetching && linkType === t.id}
                  isDisabled={linksQuery.isFetching}
                  onClick={() => {
                    setLinkType(t.id);
                    setPage(1);
                  }}
                />
              ))}
            </Stack>
          </Stack>
        </Stack>
      </Card>

      {/* Tracking Links Table */}
      {linksQuery.isLoading ? (
        <LoadingSkeleton variant="table" count={8} />
      ) : (
        <TrackingLinkTable
          items={linksQuery.data?.items || []}
          meta={linksQuery.data?.meta}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSortChange={handleSortChange}
          onPageChange={setPage}
          isFetching={linksQuery.isFetching}
          inspectedLinkId={inspectedLink?.id ?? null}
          isFansLoading={linkFansQuery.isFetching}
          onInspectFans={(link) => {
            setInspectedLink(link);
            setFansPage(1);
          }}
        />
      )}

      {/* Link Acquired Fans Modal (/v1/linkfans) */}
      {inspectedLink && (
        <div
          className="modal-backdrop"
          onClick={() => setInspectedLink(null)}
        >
          <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
            <Stack direction="vertical" gap={4} padding={5}>
              <Stack direction="horizontal" justify="between" align="center">
                <Stack direction="vertical" gap={0.5}>
                  <Stack direction="horizontal" gap={2} align="center">
                    <Heading level={2}>{inspectedLink.name}</Heading>
                    <Badge
                      variant="info"
                      label={inspectedLink.linkType}
                    />
                  </Stack>
                  <Text type="supporting">
                    Creator: {inspectedLink.creatorName} • Acquired Fans &
                    Spending Breakdown (/v1/linkfans)
                  </Text>
                </Stack>

                <Button
                  label="Close"
                  variant="secondary"
                  size="sm"
                  icon={<X size={16} />}
                  onClick={() => setInspectedLink(null)}
                />
              </Stack>

              <Divider />

              {linkFansQuery.isLoading ? (
                <Stack
                  direction="vertical"
                  align="center"
                  justify="center"
                  paddingBlock={8}
                >
                  <Spinner
                    size="lg"
                    label="Loading fans acquired from this link..."
                  />
                </Stack>
              ) : linkFansQuery.isError ? (
                <ErrorState
                  title="Unable to load fans for this marketing link"
                  error={linkFansQuery.error}
                  isRetrying={linkFansQuery.isFetching}
                  onRetry={() => void linkFansQuery.refetch()}
                />
              ) : linkFansQuery.data ? (
                <Stack direction="vertical" gap={3}>
                  <Text type="supporting">
                    Total Fans Returned: {linkFansQuery.data.totalFans}
                  </Text>
                  <DataTable<LinkFansBreakdownResponse['items'][number]>
                    columns={[
                      {
                        key: 'fan',
                        header: 'Fan',
                        render: (fan) => (
                          <Stack direction="vertical" gap={0}>
                            <Text weight="semibold">
                              {fan.fanName || fan.fanId}
                            </Text>
                            <Text type="supporting">{fan.fanId}</Text>
                          </Stack>
                        ),
                      },
                      {
                        key: 'subscribedTime',
                        header: 'Subscribed Date',
                        render: (fan) => formatDateTime(fan.subscribedTime),
                      },
                      {
                        key: 'subscriptionGross',
                        header: 'Subscription (Gross)',
                        render: (fan) =>
                          formatCurrency(fan.subscriptionGross, fan.currency),
                      },
                      {
                        key: 'messagesGross',
                        header: 'Messages (Gross)',
                        render: (fan) =>
                          formatCurrency(fan.messagesGross, fan.currency),
                      },
                      {
                        key: 'tipsGross',
                        header: 'Tips (Gross)',
                        render: (fan) =>
                          formatCurrency(fan.tipsGross, fan.currency),
                      },
                      {
                        key: 'postsAndStreams',
                        header: 'Posts / Streams',
                        render: (fan) =>
                          formatCurrency(
                            fan.postsGross + fan.streamsGross,
                            fan.currency,
                          ),
                      },
                      {
                        key: 'totalGross',
                        header: 'Total Gross',
                        render: (fan) => (
                          <Text weight="semibold" hasTabularNumbers>
                            {formatCurrency(fan.totalGross, fan.currency)}
                          </Text>
                        ),
                      },
                      {
                        key: 'totalNet',
                        header: 'Total Net',
                        render: (fan) => (
                          <Text hasTabularNumbers>
                            {formatCurrency(fan.totalNet, fan.currency)}
                          </Text>
                        ),
                      },
                    ]}
                    rows={linkFansQuery.data.items}
                    rowKey={(fan) => `${fan.id}-${fan.fanId}`}
                    meta={linkFansQuery.data.meta}
                    onPageChange={setFansPage}
                    itemLabel="fans"
                    isFetching={linkFansQuery.isFetching}
                    withCard={false}
                    emptyTitle="No individual fan spending records"
                    emptyDescription="No individual fan spending records returned for this link yet (OnlyFans linkfans sync has up to a 4-hour delay)."
                  />
                </Stack>
              ) : null}
            </Stack>
          </div>
        </div>
      )}
    </Stack>
  );
}
