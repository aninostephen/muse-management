import { Injectable } from '@nestjs/common';
import { ChattersService } from '../chatters/chatters.service';
import {
  centsToDollars,
  parseCents,
  resolveDateWindows,
} from '../common/utils/date-currency.util';
import { CreatorsService } from '../creators/creators.service';
import { EarningsService } from '../earnings/earnings.service';
import { RefreshableDateRangeQueryDto } from '../infloww/dto/infloww-query.dto';
import { InflowwService } from '../infloww/infloww.service';
import { TrackingLinksService } from '../tracking-links/tracking-links.service';
import { DashboardRevenueQueryDto } from './dto/dashboard.dto';

@Injectable()
export class DashboardService {
  constructor(
    private readonly inflowwService: InflowwService,
    private readonly creatorsService: CreatorsService,
    private readonly chattersService: ChattersService,
    private readonly earningsService: EarningsService,
    private readonly trackingLinksService: TrackingLinksService,
  ) { }

  async getOverview(query: RefreshableDateRangeQueryDto) {
    const skipCache = query.refresh === 'true';
    if (skipCache) {
      this.inflowwService.clearCache();
    }

    const { startDate, endDate } = resolveDateWindows(
      query.startDate,
      query.endDate,
    );

    const [{ creators, allCreatorsScopeAvailable }, employees] =
      await Promise.all([
        this.inflowwService.getAllCreatorsWithFallback(skipCache),
        this.inflowwService.getEmployees(undefined, skipCache),
      ]);

    const connectedCreators = creators.filter(
      (c) => !c.status || c.status.toLowerCase() === 'connected',
    );
    const connectedCreatorIds = connectedCreators.map((c) => c.id);

    const [transactions, refunds, fansCountRows, subscriberRows] =
      await Promise.all([
        this.inflowwService.getAllCreatorsTransactions(
          connectedCreators,
          startDate,
          endDate,
          skipCache,
        ),
        this.inflowwService.getAllCreatorsRefunds(
          connectedCreators,
          startDate,
          endDate,
          skipCache,
        ),
        this.inflowwService.getCreatorsFansCount(
          connectedCreatorIds,
          startDate,
          endDate,
          skipCache,
        ),
        this.inflowwService.getCreatorsSubscriberCount(
          connectedCreatorIds,
          startDate,
          endDate,
          skipCache,
        ),
      ]);

    let totalGrossCents = 0;
    let totalNetCents = 0;
    let totalFeeCents = 0;
    let validTxCount = 0;
    let currency = 'USD';

    for (const tx of transactions) {
      if (tx.status === 'undo') continue;
      totalGrossCents += parseCents(tx.amount) ?? 0;
      totalNetCents += parseCents(tx.net) ?? 0;
      totalFeeCents += parseCents(tx.fee) ?? 0;
      validTxCount += 1;
      if (tx.currency) currency = tx.currency;
    }

    const totalRefundsCents = refunds.reduce(
      (sum, r) => sum + (parseCents(r.paymentAmount) ?? 0),
      0,
    );

    // Latest activeFans and expiredFans per platformPid
    const latestFansByPid = new Map<
      string,
      { date: string; activeFans: number; expiredFans: number }
    >();
    for (const row of fansCountRows) {
      if (row.platformPid === undefined || row.platformPid === null) continue;
      const pidKey = String(row.platformPid).trim();
      const existing = latestFansByPid.get(pidKey);
      if (!existing || row.date >= existing.date) {
        latestFansByPid.set(pidKey, {
          date: row.date,
          activeFans: Number(row.activeFans ?? 0),
          expiredFans: Number(row.expiredFans ?? 0),
        });
      }
    }

    const hasFansData = latestFansByPid.size > 0;
    let totalActiveFans: number | null = hasFansData ? 0 : null;
    let totalExpiredFans: number | null = hasFansData ? 0 : null;

    if (hasFansData) {
      for (const snap of latestFansByPid.values()) {
        totalActiveFans = (totalActiveFans ?? 0) + snap.activeFans;
        totalExpiredFans = (totalExpiredFans ?? 0) + snap.expiredFans;
      }
    }

    const hasSubscriberData = subscriberRows.length > 0;
    const totalNewSubscribers: number | null = hasSubscriberData
      ? subscriberRows.reduce((s, r) => s + (r.newSubscribers ?? 0), 0)
      : connectedCreators.length === 0
        ? 0
        : null;
    const totalSubscriberRenewals: number | null = hasSubscriberData
      ? subscriberRows.reduce((s, r) => s + (r.subscriberRenewals ?? 0), 0)
      : connectedCreators.length === 0
        ? 0
        : null;

    const activeChatters = employees.filter(
      (e) => (e.status || '').toLowerCase() === 'activated',
    ).length;

    const totalRevenueGross = centsToDollars(totalGrossCents) ?? 0;
    const totalRevenueNet = centsToDollars(totalNetCents) ?? 0;
    const totalFees = centsToDollars(totalFeeCents) ?? 0;
    const totalRefunds = centsToDollars(totalRefundsCents) ?? 0;

    const averageRevenuePerCreator =
      connectedCreators.length > 0
        ? Math.round((totalRevenueGross / connectedCreators.length) * 100) / 100
        : null;

    return {
      dateRange: { startDate, endDate },
      kpis: {
        totalRevenueGross,
        totalRevenueNet,
        totalFees,
        totalRefunds,
        totalCreators: connectedCreators.length,
        totalCreatorsAllStatuses: creators.length,
        totalFans: totalActiveFans,
        totalExpiredFans,
        totalNewSubscribers,
        totalSubscriberRenewals,
        activeChatters,
        totalEmployees: employees.length,
        averageRevenuePerCreator,
        totalTransactions: validTxCount,
        refundCount: refunds.length,
        currency,
      },
      meta: {
        allCreatorsScopeAvailable,
        fansReportAvailable: hasFansData || connectedCreators.length === 0,
        lastSynchronizedAt: new Date().toISOString(),
      },
    };
  }

  async getRevenue(query: DashboardRevenueQueryDto) {
    return this.earningsService.getEarningsAnalytics({
      startDate: query.startDate,
      endDate: query.endDate,
      granularity: query.granularity || 'daily',
      refresh: query.refresh,
    });
  }

  async getPerformance(query: RefreshableDateRangeQueryDto) {
    const [creatorsResult, chattersResult, marketingResult] = await Promise.all(
      [
        this.creatorsService.getCreatorsList({
          startDate: query.startDate,
          endDate: query.endDate,
          sortBy: 'totalEarningsGross',
          sortOrder: 'desc',
          page: 1,
          limit: 5,
          refresh: query.refresh,
        }),
        this.chattersService.getChattersList({
          startDate: query.startDate,
          endDate: query.endDate,
          sortBy: 'totalSales',
          sortOrder: 'desc',
          page: 1,
          limit: 5,
          refresh: query.refresh,
        }),
        this.trackingLinksService.getTrackingLinksAnalytics({
          startDate: query.startDate,
          endDate: query.endDate,
          linkType: 'ALL',
          sortBy: 'grossRevenue',
          sortOrder: 'desc',
          page: 1,
          limit: 5,
          refresh: query.refresh,
        }),
      ],
    );

    return {
      dateRange: creatorsResult.dateRange,
      topCreators: creatorsResult.items,
      topChatters: chattersResult.items,
      chatterSummary: chattersResult.summary,
      topMarketingLinks: marketingResult.items.slice(0, 5),
      marketingSummary: marketingResult.summary,
    };
  }
}
