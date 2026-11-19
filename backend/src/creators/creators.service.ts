import { Injectable, NotFoundException } from '@nestjs/common';
import {
  centsToDollars,
  parseCents,
  resolveDateWindows,
  toUtcDateString,
} from '../common/utils/date-currency.util';
import { InflowwService } from '../infloww/infloww.service';
import { InflowwCreatorItem } from '../infloww/infloww.types';
import { CreatorsQueryDto } from './dto/creators-query.dto';

export interface CreatorSummaryDto {
  id: string;
  name: string;
  nickName: string;
  userName: string;
  tagName: string;
  status: string;
  platformPid: number | null;
  createdTime: string | null;
  totalEarningsGross: number;
  totalEarningsNet: number;
  totalFees: number;
  subscriptionRevenue: number;
  tipsRevenue: number;
  messagesRevenue: number;
  otherRevenue: number;
  transactionCount: number;
  activeFans: number | null;
  expiredFans: number | null;
  newSubscribers: number | null;
  subscriberRenewals: number | null;
  currency: string;
}

@Injectable()
export class CreatorsService {
  constructor(private readonly inflowwService: InflowwService) {}

  private isSubscriptionType(type: string): boolean {
    const lower = (type || '').toLowerCase();
    return lower.includes('subscription') || lower === 'subscribes';
  }

  private isTipsType(type: string): boolean {
    return (type || '').toLowerCase().includes('tip');
  }

  private isMessagesType(type: string): boolean {
    return (type || '').toLowerCase().includes('message');
  }

  async getCreatorsList(query: CreatorsQueryDto) {
    const skipCache = query.refresh === 'true';
    const { startDate, endDate } = resolveDateWindows(
      query.startDate,
      query.endDate,
    );

    const { creators, allCreatorsScopeAvailable } =
      await this.inflowwService.getAllCreatorsWithFallback(skipCache);

    const connectedCreatorIds = creators
      .filter((c) => !c.status || c.status.toLowerCase() === 'connected')
      .map((c) => c.id);

    const [transactions, fansCountRows, subscriberRows] = await Promise.all([
      this.inflowwService.getAllCreatorsTransactions(
        creators,
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

    // Group transactions by creatorId
    const txByCreator = new Map<
      string,
      {
        grossCents: number;
        netCents: number;
        feeCents: number;
        subGrossCents: number;
        tipsGrossCents: number;
        msgGrossCents: number;
        otherGrossCents: number;
        count: number;
        currency: string;
      }
    >();

    for (const tx of transactions) {
      if (tx.status === 'undo') continue;
      const cid = String(tx.creatorId);
      const curr = txByCreator.get(cid) || {
        grossCents: 0,
        netCents: 0,
        feeCents: 0,
        subGrossCents: 0,
        tipsGrossCents: 0,
        msgGrossCents: 0,
        otherGrossCents: 0,
        count: 0,
        currency: tx.currency || 'USD',
      };

      const amount = parseCents(tx.amount) ?? 0;
      const net = parseCents(tx.net) ?? 0;
      const fee = parseCents(tx.fee) ?? 0;

      curr.grossCents += amount;
      curr.netCents += net;
      curr.feeCents += fee;
      curr.count += 1;

      if (this.isSubscriptionType(tx.type)) {
        curr.subGrossCents += amount;
      } else if (this.isTipsType(tx.type)) {
        curr.tipsGrossCents += amount;
      } else if (this.isMessagesType(tx.type)) {
        curr.msgGrossCents += amount;
      } else {
        curr.otherGrossCents += amount;
      }

      txByCreator.set(cid, curr);
    }

    // Latest activeFans/expiredFans per platformPid
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

    // Sum newSubscribers & subscriberRenewals per platformPid across the period
    const subsByPid = new Map<
      string,
      { newSubscribers: number; subscriberRenewals: number }
    >();
    for (const row of subscriberRows) {
      if (row.platformPid === undefined || row.platformPid === null) continue;
      const pidKey = String(row.platformPid).trim();
      const existing = subsByPid.get(pidKey) || {
        newSubscribers: 0,
        subscriberRenewals: 0,
      };
      existing.newSubscribers += Number(row.newSubscribers ?? 0);
      existing.subscriberRenewals += Number(row.subscriberRenewals ?? 0);
      subsByPid.set(pidKey, existing);
    }

    let items: CreatorSummaryDto[] = creators.map(
      (creator: InflowwCreatorItem) => {
        const cid = String(creator.id);
        const txAgg = txByCreator.get(cid);
        const pidKey =
          creator.platformPid !== undefined && creator.platformPid !== null
            ? String(creator.platformPid).trim()
            : null;
        const pid = pidKey !== null ? Number(pidKey) : null;
        const fansSnap = pidKey !== null ? latestFansByPid.get(pidKey) : undefined;
        const subsSnap = pidKey !== null ? subsByPid.get(pidKey) : undefined;

        return {
          id: cid,
          name: creator.name || creator.nickName || `Creator #${cid}`,
          nickName: creator.nickName || '',
          userName: creator.userName || '',
          tagName: creator.tagName || '',
          status: creator.status || 'connected',
          platformPid: pid,
          createdTime: creator.createdTime || null,
          totalEarningsGross: centsToDollars(txAgg?.grossCents ?? 0) ?? 0,
          totalEarningsNet: centsToDollars(txAgg?.netCents ?? 0) ?? 0,
          totalFees: centsToDollars(txAgg?.feeCents ?? 0) ?? 0,
          subscriptionRevenue: centsToDollars(txAgg?.subGrossCents ?? 0) ?? 0,
          tipsRevenue: centsToDollars(txAgg?.tipsGrossCents ?? 0) ?? 0,
          messagesRevenue: centsToDollars(txAgg?.msgGrossCents ?? 0) ?? 0,
          otherRevenue: centsToDollars(txAgg?.otherGrossCents ?? 0) ?? 0,
          transactionCount: txAgg?.count ?? 0,
          // Preserve null when fan report metrics are unavailable for a creator
          activeFans: fansSnap ? fansSnap.activeFans : null,
          expiredFans: fansSnap ? fansSnap.expiredFans : null,
          newSubscribers: subsSnap ? subsSnap.newSubscribers : null,
          subscriberRenewals: subsSnap ? subsSnap.subscriberRenewals : null,
          currency: txAgg?.currency || 'USD',
        };
      },
    );

    // Filter by status
    if (query.status && query.status.toLowerCase() !== 'all') {
      const targetStatus = query.status.toLowerCase();
      items = items.filter((item) => item.status.toLowerCase() === targetStatus);
    }

    // Filter by search
    if (query.search && query.search.trim()) {
      const q = query.search.trim().toLowerCase();
      items = items.filter(
        (item) =>
          item.name.toLowerCase().includes(q) ||
          item.nickName.toLowerCase().includes(q) ||
          item.userName.toLowerCase().includes(q) ||
          item.tagName.toLowerCase().includes(q) ||
          item.id.toLowerCase().includes(q),
      );
    }

    // Sort
    const sortBy = query.sortBy || 'totalEarningsGross';
    const sortOrder = query.sortOrder || 'desc';
    const direction = sortOrder === 'asc' ? 1 : -1;

    items.sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name) * direction;
      }
      const valA = a[sortBy] ?? -1;
      const valB = b[sortBy] ?? -1;
      return (Number(valA) - Number(valB)) * direction;
    });

    const total = items.length;
    const page = query.page || 1;
    const limit = query.limit || 10;
    const startIndex = (page - 1) * limit;
    const paginatedItems = items.slice(startIndex, startIndex + limit);

    const totalGross =
      Math.round(
        items.reduce((s, c) => s + c.totalEarningsGross, 0) * 100,
      ) / 100;
    const totalNet =
      Math.round(items.reduce((s, c) => s + c.totalEarningsNet, 0) * 100) /
      100;
    const totalSubscriptionRevenue =
      Math.round(items.reduce((s, c) => s + c.subscriptionRevenue, 0) * 100) /
      100;
    const creatorsWithFans = items.filter((c) => c.activeFans !== null);
    const totalActiveFans =
      creatorsWithFans.length > 0
        ? creatorsWithFans.reduce((s, c) => s + (c.activeFans ?? 0), 0)
        : null;

    return {
      dateRange: { startDate, endDate },
      summary: {
        totalMatchingCreators: total,
        totalGross,
        totalNet,
        totalSubscriptionRevenue,
        totalActiveFans,
      },
      meta: {
        total,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(total / limit)),
        allCreatorsScopeAvailable,
      },
      items: paginatedItems,
    };
  }

  async getCreatorById(
    creatorId: string,
    startDateInput?: string,
    endDateInput?: string,
    refresh?: string,
  ) {
    const skipCache = refresh === 'true';
    const { startDate, endDate } = resolveDateWindows(
      startDateInput,
      endDateInput,
    );

    const { creators } =
      await this.inflowwService.getAllCreatorsWithFallback(skipCache);
    const creator = creators.find((c) => String(c.id) === String(creatorId));
    if (!creator) {
      throw new NotFoundException(`Creator with ID "${creatorId}" not found`);
    }

    const [
      transactions,
      refunds,
      fansCount,
      subscriberCount,
      fansRenewOn,
      avgSubLength,
      profileVisitors,
      rankRows,
      chatSummaryRows,
    ] = await Promise.all([
      this.inflowwService.getCreatorTransactions(
        creator.id,
        startDate,
        endDate,
        skipCache,
      ),
      this.inflowwService.getCreatorRefunds(
        creator.id,
        startDate,
        endDate,
        skipCache,
      ),
      this.inflowwService.getCreatorsFansCount(
        [creator.id],
        startDate,
        endDate,
        skipCache,
      ),
      this.inflowwService.getCreatorsSubscriberCount(
        [creator.id],
        startDate,
        endDate,
        skipCache,
      ),
      this.inflowwService.getCreatorsFansRenewOn(
        [creator.id],
        startDate,
        endDate,
        skipCache,
      ),
      this.inflowwService.getCreatorsAvgSubscriptionLength(
        [creator.id],
        startDate,
        endDate,
        skipCache,
      ),
      this.inflowwService.getCreatorsProfileVisitors(
        [creator.id],
        startDate,
        endDate,
        skipCache,
      ),
      this.inflowwService.getCreatorsRank(
        [creator.id],
        startDate,
        endDate,
        skipCache,
      ),
      this.inflowwService.getCreatorsChatSummary(
        [creator.id],
        startDate,
        endDate,
        skipCache,
      ),
    ]);

    let grossCents = 0;
    let netCents = 0;
    let feeCents = 0;
    let subGrossCents = 0;
    let tipsGrossCents = 0;
    let msgGrossCents = 0;
    let otherGrossCents = 0;

    const dailyRevenueMap = new Map<
      string,
      {
        date: string;
        grossCents: number;
        netCents: number;
        transactionCount: number;
      }
    >();

    for (const tx of transactions) {
      if (tx.status === 'undo') continue;
      const amount = parseCents(tx.amount) ?? 0;
      const net = parseCents(tx.net) ?? 0;
      const fee = parseCents(tx.fee) ?? 0;

      grossCents += amount;
      netCents += net;
      feeCents += fee;

      if (this.isSubscriptionType(tx.type)) subGrossCents += amount;
      else if (this.isTipsType(tx.type)) tipsGrossCents += amount;
      else if (this.isMessagesType(tx.type)) msgGrossCents += amount;
      else otherGrossCents += amount;

      const ts = Number(tx.createdTime);
      const dateStr = Number.isFinite(ts)
        ? toUtcDateString(new Date(ts))
        : String(tx.createdTime).slice(0, 10);

      const dEntry = dailyRevenueMap.get(dateStr) || {
        date: dateStr,
        grossCents: 0,
        netCents: 0,
        transactionCount: 0,
      };
      dEntry.grossCents += amount;
      dEntry.netCents += net;
      dEntry.transactionCount += 1;
      dailyRevenueMap.set(dateStr, dEntry);
    }

    const totalRefundsCents = refunds.reduce(
      (sum, r) => sum + (parseCents(r.paymentAmount) ?? 0),
      0,
    );

    const latestFans =
      fansCount.length > 0
        ? [...fansCount].sort((a, b) => a.date.localeCompare(b.date)).pop()
        : null;
    const latestRenewOn =
      fansRenewOn.length > 0
        ? [...fansRenewOn].sort((a, b) => a.date.localeCompare(b.date)).pop()
        : null;
    const latestAvgSubLength =
      avgSubLength.length > 0
        ? [...avgSubLength].sort((a, b) => a.date.localeCompare(b.date)).pop()
        : null;
    const latestRank =
      rankRows.length > 0
        ? [...rankRows].sort((a, b) => a.date.localeCompare(b.date)).pop()
        : null;
    const chatSummary = chatSummaryRows.length > 0 ? chatSummaryRows[0] : null;

    const totalNewSubscribers =
      subscriberCount.length > 0
        ? subscriberCount.reduce((s, r) => s + (r.newSubscribers ?? 0), 0)
        : null;
    const totalRenewals =
      subscriberCount.length > 0
        ? subscriberCount.reduce((s, r) => s + (r.subscriberRenewals ?? 0), 0)
        : null;
    const totalProfileVisitors =
      profileVisitors.length > 0
        ? profileVisitors.reduce((s, r) => s + (r.profileVisitors ?? 0), 0)
        : null;

    return {
      dateRange: { startDate, endDate },
      creator: {
        id: String(creator.id),
        name: creator.name || creator.nickName || `Creator #${creator.id}`,
        nickName: creator.nickName || '',
        userName: creator.userName || '',
        tagName: creator.tagName || '',
        status: creator.status || 'connected',
        platformPid: creator.platformPid ?? null,
        createdTime: creator.createdTime || null,
      },
      revenue: {
        totalEarningsGross: centsToDollars(grossCents) ?? 0,
        totalEarningsNet: centsToDollars(netCents) ?? 0,
        totalFees: centsToDollars(feeCents) ?? 0,
        subscriptionRevenue: centsToDollars(subGrossCents) ?? 0,
        tipsRevenue: centsToDollars(tipsGrossCents) ?? 0,
        messagesRevenue: centsToDollars(msgGrossCents) ?? 0,
        otherRevenue: centsToDollars(otherGrossCents) ?? 0,
        totalRefunds: centsToDollars(totalRefundsCents) ?? 0,
        refundCount: refunds.length,
        transactionCount: transactions.length,
      },
      fanAnalytics: {
        activeFans: latestFans ? latestFans.activeFans : null,
        expiredFans: latestFans ? latestFans.expiredFans : null,
        newSubscribers: totalNewSubscribers,
        subscriberRenewals: totalRenewals,
        fansWithRenewOn: latestRenewOn ? latestRenewOn.fansWithRenewOn : null,
        avgSubscriptionLengthDays: latestAvgSubLength
          ? latestAvgSubLength.avgSubscriptionLength
          : null,
        profileVisitors: totalProfileVisitors,
        performanceRank: latestRank ? latestRank.performanceRank : null,
      },
      chatActivity: chatSummary
        ? {
            replyTimeMs: chatSummary.replyTime,
            fansChatted: chatSummary.fansChatted,
            messagesSent: chatSummary.messagesSent,
            ppvsSent: chatSummary.ppvsSent,
          }
        : null,
      dailyRevenue: Array.from(dailyRevenueMap.values())
        .sort((a, b) => a.date.localeCompare(b.date))
        .map((d) => ({
          date: d.date,
          gross: centsToDollars(d.grossCents) ?? 0,
          net: centsToDollars(d.netCents) ?? 0,
          transactionCount: d.transactionCount,
        })),
      recentTransactions: transactions.slice(0, 25).map((tx) => ({
        id: String(tx.id),
        transactionId: tx.transactionId,
        fanId: tx.fanId,
        fanName: tx.fanName,
        type: tx.type,
        tipSource: tx.tipSource || 'Unknown',
        status: tx.status,
        amount: centsToDollars(tx.amount) ?? 0,
        fee: centsToDollars(tx.fee) ?? 0,
        net: centsToDollars(tx.net) ?? 0,
        currency: tx.currency || 'USD',
        createdTime: tx.createdTime,
      })),
    };
  }
}
