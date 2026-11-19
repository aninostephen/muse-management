import { Injectable } from '@nestjs/common';
import {
  centsToDollars,
  parseCents,
  resolveDateWindows,
  toUtcDateString,
} from '../common/utils/date-currency.util';
import { InflowwService } from '../infloww/infloww.service';
import { EarningsQueryDto } from './dto/earnings-query.dto';

@Injectable()
export class EarningsService {
  constructor(private readonly inflowwService: InflowwService) { }

  private normalizeDateString(createdTime: string): string {
    const num = Number(createdTime);
    if (Number.isFinite(num) && num > 0) {
      return toUtcDateString(new Date(num));
    }
    return String(createdTime).slice(0, 10);
  }

  private toBucketKey(
    dateStr: string,
    granularity: 'daily' | 'weekly' | 'monthly',
  ): string {
    if (granularity === 'monthly') {
      return dateStr.slice(0, 7); // YYYY-MM
    }
    if (granularity === 'weekly') {
      const d = new Date(`${dateStr}T00:00:00.000Z`);
      if (Number.isNaN(d.getTime())) return dateStr;
      // Monday-start week bucket
      const day = d.getUTCDay();
      const diff = d.getUTCDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), diff));
      return toUtcDateString(monday);
    }
    return dateStr;
  }

  private classifyBucket(
    type: string,
  ): 'subscription' | 'tips' | 'messages' | 'other' {
    const lower = (type || '').toLowerCase();
    if (lower.includes('subscription') || lower === 'subscribes') {
      return 'subscription';
    }
    if (lower.includes('tip')) {
      return 'tips';
    }
    if (lower.includes('message')) {
      return 'messages';
    }
    return 'other';
  }

  async getEarningsAnalytics(query: EarningsQueryDto) {
    const skipCache = query.refresh === 'true';
    const granularity = query.granularity || 'daily';
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

    const creatorById = new Map(creators.map((c) => [String(c.id), c]));

    const [transactions, refunds] = await Promise.all([
      this.inflowwService.getAllCreatorsTransactions(
        targetCreators,
        startDate,
        endDate,
        skipCache,
      ),
      this.inflowwService.getAllCreatorsRefunds(
        targetCreators,
        startDate,
        endDate,
        skipCache,
      ),
    ]);

    let totalGrossCents = 0;
    let totalFeeCents = 0;
    let totalNetCents = 0;
    let validTxCount = 0;
    let currency = 'USD';

    const timeSeriesMap = new Map<
      string,
      {
        period: string;
        grossCents: number;
        feeCents: number;
        netCents: number;
        subCents: number;
        tipsCents: number;
        msgCents: number;
        otherCents: number;
        transactionCount: number;
      }
    >();

    const categoryMap = new Map<
      string,
      {
        category: string;
        grossCents: number;
        feeCents: number;
        netCents: number;
        transactionCount: number;
      }
    >();

    const creatorRevenueMap = new Map<
      string,
      {
        creatorId: string;
        creatorName: string;
        userName: string;
        grossCents: number;
        feeCents: number;
        netCents: number;
        subCents: number;
        tipsCents: number;
        msgCents: number;
        otherCents: number;
        transactionCount: number;
      }
    >();

    for (const tx of transactions) {
      if (tx.status === 'undo') continue;
      const amountCents = parseCents(tx.amount) ?? 0;
      const feeCents = parseCents(tx.fee) ?? 0;
      const netCents = parseCents(tx.net) ?? 0;
      if (tx.currency) currency = tx.currency;

      totalGrossCents += amountCents;
      totalFeeCents += feeCents;
      totalNetCents += netCents;
      validTxCount += 1;

      const dateStr = this.normalizeDateString(tx.createdTime);
      const periodKey = this.toBucketKey(dateStr, granularity);
      const bucketType = this.classifyBucket(tx.type);

      // Time series aggregation
      const tsEntry = timeSeriesMap.get(periodKey) || {
        period: periodKey,
        grossCents: 0,
        feeCents: 0,
        netCents: 0,
        subCents: 0,
        tipsCents: 0,
        msgCents: 0,
        otherCents: 0,
        transactionCount: 0,
      };
      tsEntry.grossCents += amountCents;
      tsEntry.feeCents += feeCents;
      tsEntry.netCents += netCents;
      tsEntry.transactionCount += 1;
      if (bucketType === 'subscription') tsEntry.subCents += amountCents;
      else if (bucketType === 'tips') tsEntry.tipsCents += amountCents;
      else if (bucketType === 'messages') tsEntry.msgCents += amountCents;
      else tsEntry.otherCents += amountCents;
      timeSeriesMap.set(periodKey, tsEntry);

      // Category aggregation
      const catName = tx.type || 'Unknown';
      const catEntry = categoryMap.get(catName) || {
        category: catName,
        grossCents: 0,
        feeCents: 0,
        netCents: 0,
        transactionCount: 0,
      };
      catEntry.grossCents += amountCents;
      catEntry.feeCents += feeCents;
      catEntry.netCents += netCents;
      catEntry.transactionCount += 1;
      categoryMap.set(catName, catEntry);

      // Creator aggregation
      const cid = String(tx.creatorId);
      const creatorInfo = creatorById.get(cid);
      const crEntry = creatorRevenueMap.get(cid) || {
        creatorId: cid,
        creatorName:
          creatorInfo?.name || creatorInfo?.nickName || `Creator #${cid}`,
        userName: creatorInfo?.userName || '',
        grossCents: 0,
        feeCents: 0,
        netCents: 0,
        subCents: 0,
        tipsCents: 0,
        msgCents: 0,
        otherCents: 0,
        transactionCount: 0,
      };
      crEntry.grossCents += amountCents;
      crEntry.feeCents += feeCents;
      crEntry.netCents += netCents;
      crEntry.transactionCount += 1;
      if (bucketType === 'subscription') crEntry.subCents += amountCents;
      else if (bucketType === 'tips') crEntry.tipsCents += amountCents;
      else if (bucketType === 'messages') crEntry.msgCents += amountCents;
      else crEntry.otherCents += amountCents;
      creatorRevenueMap.set(cid, crEntry);
    }

    const totalRefundsCents = refunds.reduce(
      (sum, r) => sum + (parseCents(r.paymentAmount) ?? 0),
      0,
    );

    const totalGross = centsToDollars(totalGrossCents) ?? 0;
    const totalFees = centsToDollars(totalFeeCents) ?? 0;
    const totalNet = centsToDollars(totalNetCents) ?? 0;
    const totalRefunds = centsToDollars(totalRefundsCents) ?? 0;
    const netAfterRefunds =
      centsToDollars(totalNetCents - totalRefundsCents) ?? 0;
    const averageTransactionGross =
      validTxCount > 0
        ? Math.round((totalGross / validTxCount) * 100) / 100
        : null;

    const timeSeries = Array.from(timeSeriesMap.values())
      .sort((a, b) => a.period.localeCompare(b.period))
      .map((item) => ({
        period: item.period,
        gross: centsToDollars(item.grossCents) ?? 0,
        fee: centsToDollars(item.feeCents) ?? 0,
        net: centsToDollars(item.netCents) ?? 0,
        subscription: centsToDollars(item.subCents) ?? 0,
        tips: centsToDollars(item.tipsCents) ?? 0,
        messages: centsToDollars(item.msgCents) ?? 0,
        other: centsToDollars(item.otherCents) ?? 0,
        transactionCount: item.transactionCount,
      }));

    const byCategory = Array.from(categoryMap.values())
      .sort((a, b) => b.grossCents - a.grossCents)
      .map((item) => ({
        category: item.category,
        gross: centsToDollars(item.grossCents) ?? 0,
        fee: centsToDollars(item.feeCents) ?? 0,
        net: centsToDollars(item.netCents) ?? 0,
        transactionCount: item.transactionCount,
        percentageOfGross:
          totalGrossCents > 0
            ? Math.round((item.grossCents / totalGrossCents) * 10000) / 100
            : 0,
      }));

    const byCreator = Array.from(creatorRevenueMap.values())
      .sort((a, b) => b.grossCents - a.grossCents)
      .map((item) => ({
        creatorId: item.creatorId,
        creatorName: item.creatorName,
        userName: item.userName,
        gross: centsToDollars(item.grossCents) ?? 0,
        fee: centsToDollars(item.feeCents) ?? 0,
        net: centsToDollars(item.netCents) ?? 0,
        subscription: centsToDollars(item.subCents) ?? 0,
        tips: centsToDollars(item.tipsCents) ?? 0,
        messages: centsToDollars(item.msgCents) ?? 0,
        other: centsToDollars(item.otherCents) ?? 0,
        transactionCount: item.transactionCount,
        percentageOfGross:
          totalGrossCents > 0
            ? Math.round((item.grossCents / totalGrossCents) * 10000) / 100
            : 0,
      }));

    const sortedTransactions = [...transactions].sort(
      (a, b) => Number(b.createdTime || 0) - Number(a.createdTime || 0),
    );

    const totalTx = sortedTransactions.length;
    const page = query.page || 1;
    const limit = query.limit || 10;
    const startIdx = (page - 1) * limit;
    const paginatedTransactions = sortedTransactions.slice(
      startIdx,
      startIdx + limit,
    );

    return {
      dateRange: { startDate, endDate, granularity },
      creators: creators.map((c) => ({
        id: String(c.id),
        name: c.name || c.nickName || `Creator #${c.id}`,
        userName: c.userName || '',
      })),
      summary: {
        totalGross,
        totalFees,
        totalNet,
        totalRefunds,
        netAfterRefunds,
        transactionCount: validTxCount,
        refundCount: refunds.length,
        averageTransactionGross,
        currency,
      },
      timeSeries,
      byCategory,
      byCreator,
      transactionsMeta: {
        total: totalTx,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(totalTx / limit)),
      },
      recentTransactions: paginatedTransactions.map((tx) => {
        const cr = creatorById.get(String(tx.creatorId));
        return {
          id: String(tx.id),
          transactionId: tx.transactionId,
          creatorId: String(tx.creatorId),
          creatorName:
            cr?.name || cr?.nickName || `Creator #${tx.creatorId}`,
          fanId: tx.fanId,
          fanName: tx.fanName,
          type: tx.type,
          tipSource: tx.tipSource || 'Unknown',
          status: tx.status,
          gross: centsToDollars(tx.amount) ?? 0,
          fee: centsToDollars(tx.fee) ?? 0,
          net: centsToDollars(tx.net) ?? 0,
          currency: tx.currency || 'USD',
          createdTime: tx.createdTime,
        };
      }),
    };
  }
}
