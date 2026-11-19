import { Injectable } from '@nestjs/common';
import {
  centsToDollars,
  parseCents,
  resolveDateWindows,
} from '../common/utils/date-currency.util';
import { InflowwService } from '../infloww/infloww.service';
import {
  InflowwCampaignLinkItem,
  InflowwLinkType,
  InflowwTrackingLinkItem,
  InflowwTrialLinkItem,
} from '../infloww/infloww.types';
import {
  LinkFansQueryDto,
  TrackingLinksQueryDto,
} from './dto/tracking-links-query.dto';

export interface NormalizedMarketingLinkDto {
  id: string;
  linkType: InflowwLinkType;
  creatorId: string;
  creatorName: string;
  creatorUserName: string;
  name: string;
  code: string | null;
  url: string | null;
  source: string | null;
  targetFanType: string | null;
  discountPercentage: number | null;
  subDurationDays: number | null;
  subLimit: number | null;
  finishedFlag: boolean;
  clicks: number | null; // Available only for TRACKING links
  subscribers: number;
  payingFansCount: number;
  conversionRate: number | null; // Subscribers / Clicks * 100 (TRACKING links)
  spendingConversionRate: number | null;
  grossRevenue: number;
  netRevenue: number;
  epcGross: number | null;
  epcNet: number | null;
  aepsGross: number | null;
  aepsNet: number | null;
  currency: string;
  createdTime: string | null;
  expiredTime: string | null;
  updatedTime: string | null;
}

@Injectable()
export class TrackingLinksService {
  constructor(private readonly inflowwService: InflowwService) {}

  private buildOnlyFansLinkUrl(
    linkType: InflowwLinkType,
    creatorUserName: string,
    code?: string,
  ): string | null {
    if (!creatorUserName || !code) return null;
    if (linkType === 'TRACKING') {
      return `https://onlyfans.com/${creatorUserName}/c${code}`;
    }
    if (linkType === 'TRIAL') {
      return `https://onlyfans.com/${creatorUserName}/${code}`;
    }
    return null;
  }

  async getTrackingLinksAnalytics(query: TrackingLinksQueryDto) {
    const skipCache = query.refresh === 'true';
    const { startDate, endDate } = resolveDateWindows(
      query.startDate,
      query.endDate,
    );

    const { creators } =
      await this.inflowwService.getAllCreatorsWithFallback(skipCache);

    const targetCreators =
      query.creatorId && query.creatorId.trim()
        ? creators.filter((c) => String(c.id) === query.creatorId?.trim())
        : creators;

    const requestedTypes: InflowwLinkType[] =
      !query.linkType || query.linkType === 'ALL'
        ? ['TRACKING', 'TRIAL', 'CAMPAIGN']
        : [query.linkType];

    const rawLinks = await this.inflowwService.getAllCreatorsLinks(
      targetCreators,
      requestedTypes,
      startDate,
      endDate,
      query.status,
      skipCache,
    );

    let items: NormalizedMarketingLinkDto[] = rawLinks.map((raw) => {
      const linkType = raw.linkType;
      const grossCents = parseCents(raw.earningsGross) ?? 0;
      const netCents = parseCents(raw.earningsNet) ?? 0;
      const subscribers = Number(raw.subCount ?? 0);
      const payingFansCount = Number(raw.payingFansCount ?? 0);

      let name = `Link #${raw.id}`;
      let code: string | null = null;
      let source: string | null = null;
      let targetFanType: string | null = null;
      let discountPercentage: number | null = null;
      let subDurationDays: number | null = null;
      let subLimit: number | null = null;
      let clicks: number | null = null;
      let conversionRate: number | null = null;
      let spendingConversionRate: number | null = null;
      let epcGross: number | null = null;
      let epcNet: number | null = null;
      let aepsGross: number | null = null;
      let aepsNet: number | null = null;

      if (linkType === 'TRACKING') {
        const t = raw as InflowwTrackingLinkItem;
        name = t.name || `Tracking Link #${t.id}`;
        code = t.code || null;
        source = t.source || null;
        clicks = typeof t.clickCount === 'number' ? t.clickCount : 0;
        conversionRate =
          clicks > 0
            ? Math.round((subscribers / clicks) * 10000) / 100
            : t.subscriptionCVR !== undefined
              ? Number(t.subscriptionCVR)
              : null;
        spendingConversionRate =
          t.spendingCVR !== undefined && t.spendingCVR !== null
            ? Number(t.spendingCVR)
            : subscribers > 0
              ? Math.round((payingFansCount / subscribers) * 10000) / 100
              : null;
        epcGross =
          t.epcGross !== undefined
            ? centsToDollars(t.epcGross)
            : clicks > 0
              ? Math.round(((centsToDollars(grossCents) ?? 0) / clicks) * 100) /
                100
              : null;
        epcNet =
          t.epcNet !== undefined
            ? centsToDollars(t.epcNet)
            : clicks > 0
              ? Math.round(((centsToDollars(netCents) ?? 0) / clicks) * 100) /
                100
              : null;
        aepsGross =
          t.aepsGross !== undefined
            ? centsToDollars(t.aepsGross)
            : subscribers > 0
              ? Math.round(
                  ((centsToDollars(grossCents) ?? 0) / subscribers) * 100,
                ) / 100
              : null;
        aepsNet =
          t.aepsNet !== undefined
            ? centsToDollars(t.aepsNet)
            : subscribers > 0
              ? Math.round(
                  ((centsToDollars(netCents) ?? 0) / subscribers) * 100,
                ) / 100
              : null;
      } else if (linkType === 'TRIAL') {
        const tr = raw as InflowwTrialLinkItem;
        name = tr.name || `Free Trial #${tr.id}`;
        code = tr.code || null;
        source = tr.source || null;
        subDurationDays = tr.subDuration ?? null;
        subLimit = tr.subLimit ?? null;
        spendingConversionRate =
          tr.spendClaim !== undefined && tr.spendClaim !== null
            ? Number(tr.spendClaim)
            : subscribers > 0
              ? Math.round((payingFansCount / subscribers) * 10000) / 100
              : null;
        aepsGross =
          tr.aepsGross !== undefined
            ? centsToDollars(tr.aepsGross)
            : subscribers > 0
              ? Math.round(
                  ((centsToDollars(grossCents) ?? 0) / subscribers) * 100,
                ) / 100
              : null;
        aepsNet =
          tr.aepsNet !== undefined
            ? centsToDollars(tr.aepsNet)
            : subscribers > 0
              ? Math.round(
                  ((centsToDollars(netCents) ?? 0) / subscribers) * 100,
                ) / 100
              : null;
      } else {
        const c = raw as InflowwCampaignLinkItem;
        name = c.message || `Profile Promotion #${c.id}`;
        targetFanType = c.type || null;
        discountPercentage = c.discount ?? null;
        subDurationDays = c.subDuration ?? null;
        subLimit = c.subLimit ?? null;
        aepsGross =
          subscribers > 0
            ? Math.round(
                ((centsToDollars(grossCents) ?? 0) / subscribers) * 100,
              ) / 100
            : null;
        aepsNet =
          subscribers > 0
            ? Math.round(
                ((centsToDollars(netCents) ?? 0) / subscribers) * 100,
              ) / 100
            : null;
      }

      return {
        id: String(raw.id),
        linkType,
        creatorId: raw.creatorId,
        creatorName: raw.creatorName,
        creatorUserName: raw.creatorUserName,
        name,
        code,
        url: this.buildOnlyFansLinkUrl(
          linkType,
          raw.creatorUserName,
          code || undefined,
        ),
        source,
        targetFanType,
        discountPercentage,
        subDurationDays,
        subLimit,
        finishedFlag: Boolean(raw.finishedFlag),
        clicks,
        subscribers,
        payingFansCount,
        conversionRate,
        spendingConversionRate,
        grossRevenue: centsToDollars(grossCents) ?? 0,
        netRevenue: centsToDollars(netCents) ?? 0,
        epcGross,
        epcNet,
        aepsGross,
        aepsNet,
        currency: raw.currency || 'USD',
        createdTime: raw.createdTime || null,
        expiredTime: raw.expiredTime || null,
        updatedTime: raw.updatedTime || null,
      };
    });

    if (query.search && query.search.trim()) {
      const q = query.search.trim().toLowerCase();
      items = items.filter(
        (item) =>
          item.name.toLowerCase().includes(q) ||
          (item.code && item.code.toLowerCase().includes(q)) ||
          (item.source && item.source.toLowerCase().includes(q)) ||
          item.creatorName.toLowerCase().includes(q) ||
          item.id.toLowerCase().includes(q),
      );
    }

    const sortBy = query.sortBy || 'grossRevenue';
    const sortOrder = query.sortOrder || 'desc';
    const dir = sortOrder === 'asc' ? 1 : -1;

    items.sort((a, b) => {
      if (sortBy === 'createdTime') {
        return (Number(a.createdTime || 0) - Number(b.createdTime || 0)) * dir;
      }
      const valA = a[sortBy] ?? -1;
      const valB = b[sortBy] ?? -1;
      return (Number(valA) - Number(valB)) * dir;
    });

    const trackingLinks = items.filter((i) => i.linkType === 'TRACKING');
    const trialLinks = items.filter((i) => i.linkType === 'TRIAL');
    const campaignLinks = items.filter((i) => i.linkType === 'CAMPAIGN');

    const totalClicks =
      trackingLinks.length > 0
        ? trackingLinks.reduce((sum, i) => sum + (i.clicks ?? 0), 0)
        : 0;
    const trackingSubscribers = trackingLinks.reduce(
      (sum, i) => sum + i.subscribers,
      0,
    );
    const totalNewSubscribers = items.reduce((sum, i) => sum + i.subscribers, 0);
    const totalPayingFans = items.reduce(
      (sum, i) => sum + i.payingFansCount,
      0,
    );
    const totalGrossRevenue =
      Math.round(
        items.reduce((sum, i) => sum + i.grossRevenue, 0) * 100,
      ) / 100;
    const totalNetRevenue =
      Math.round(items.reduce((sum, i) => sum + i.netRevenue, 0) * 100) /
      100;

    // Conversion rate (Subscribers / Clicks * 100) is strictly calculated on TRACKING links where clicks exist
    const trackingConversionRate =
      totalClicks > 0
        ? Math.round((trackingSubscribers / totalClicks) * 10000) / 100
        : null;

    const total = items.length;
    const page = query.page || 1;
    const limit = query.limit || 10;
    const startIdx = (page - 1) * limit;
    const paginatedItems = items.slice(startIdx, startIdx + limit);

    return {
      dateRange: { startDate, endDate },
      creators: creators.map((c) => ({
        id: String(c.id),
        name: c.name || c.nickName || `Creator #${c.id}`,
        userName: c.userName || '',
      })),
      summary: {
        totalLinks: items.length,
        trackingLinksCount: trackingLinks.length,
        trialLinksCount: trialLinks.length,
        campaignsCount: campaignLinks.length,
        totalClicks,
        trackingSubscribers,
        totalNewSubscribers,
        trackingConversionRate,
        totalPayingFans,
        totalGrossRevenue,
        totalNetRevenue,
        // Explicitly distinguish unavailable promotion cost data per Task-Info.md
        promotionCostAvailable: false,
        costPerSubscriber: null,
        roiPercentage: null,
        limitationNote:
          'Infloww OpenAPI v1.4 (/v1/links) provides attributed revenue, clicks (for TRACKING links), and subscribers, but does not store external ad spend / promotion cost. Cost per Subscriber and cost-based ROI are marked unavailable rather than fabricated.',
      },
      meta: {
        total,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
      items: paginatedItems,
    };
  }

  async getLinkFansBreakdown(query: LinkFansQueryDto) {
    const fans = await this.inflowwService.getLinkFans(
      query.creatorId,
      query.linkType,
      query.linkId,
    );

    const mappedFans = fans.map((f) => {
      const subGross = centsToDollars(f.subscriptionEarningGross) ?? 0;
      const subNet = centsToDollars(f.subscriptionEarningNet) ?? 0;
      const postsGross = centsToDollars(f.postsEarningGross) ?? 0;
      const postsNet = centsToDollars(f.postsEarningNet) ?? 0;
      const msgGross = centsToDollars(f.messagesEarningGross) ?? 0;
      const msgNet = centsToDollars(f.messagesEarningNet) ?? 0;
      const streamGross = centsToDollars(f.streamsEarningGross) ?? 0;
      const streamNet = centsToDollars(f.streamsEarningNet) ?? 0;
      const tipsGross = centsToDollars(f.tipsEarningGross) ?? 0;
      const tipsNet = centsToDollars(f.tipsEarningNet) ?? 0;

      return {
        id: f.id,
        fanId: f.fanId,
        fanName: f.fanName,
        subscriptionGross: subGross,
        subscriptionNet: subNet,
        postsGross,
        postsNet,
        messagesGross: msgGross,
        messagesNet: msgNet,
        streamsGross: streamGross,
        streamsNet: streamNet,
        tipsGross,
        tipsNet,
        totalGross:
          Math.round(
            (subGross + postsGross + msgGross + streamGross + tipsGross) * 100,
          ) / 100,
        totalNet:
          Math.round(
            (subNet + postsNet + msgNet + streamNet + tipsNet) * 100,
          ) / 100,
        currency: f.currency || 'USD',
        subscribedTime: f.subscribedTime,
      };
    });

    const total = mappedFans.length;
    const page = query.page || 1;
    const limit = query.limit || 10;
    const startIdx = (page - 1) * limit;
    const paginatedFans = mappedFans.slice(startIdx, startIdx + limit);

    return {
      creatorId: query.creatorId,
      linkType: query.linkType,
      linkId: query.linkId,
      totalFans: total,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
      items: paginatedFans,
    };
  }
}
