import { Injectable, NotFoundException } from '@nestjs/common';
import {
  centsToDollars,
  parseCents,
  resolveDateWindows,
} from '../common/utils/date-currency.util';
import { InflowwService } from '../infloww/infloww.service';
import { ChattersQueryDto } from './dto/chatters-query.dto';

export interface ChatterSummaryDto {
  employeeId: number;
  name: string;
  status: string;
  createdTime: string | null;
  deletedTime: string | null;
  totalSales: number;
  ppvSales: number;
  tipsSales: number;
  directMessageSales: number;
  priorityMassMessageSales: number;
  massMessageSales: number;
  directMessagesSent: number;
  directPpvsSent: number;
  ppvsUnlocked: number;
  unlockRate: number | null;
  goldenRatio: number | null;
  fansChatted: number;
  characterCount: number;
  avgResponseTimeClockedMs: number | null;
  avgResponseTimeScheduledMs: number | null;
  averagePpvSaleValue: number | null;
  currency: string;
}

@Injectable()
export class ChattersService {
  constructor(private readonly inflowwService: InflowwService) {}

  async getChattersList(query: ChattersQueryDto) {
    const skipCache = query.refresh === 'true';
    const { startDate, endDate } = resolveDateWindows(
      query.startDate,
      query.endDate,
    );

    const employees = await this.inflowwService.getEmployees(
      undefined,
      skipCache,
    );
    const startUtcMs = new Date(`${startDate}T00:00:00.000Z`).getTime();
    // Skip querying batch reports for employees deleted prior to the selected startDate window
    const eligibleEmployeeIds = employees
      .filter((e) => {
        if ((e.status || '').toLowerCase() !== 'deleted') return true;
        const deletedMs = Number(e.deletedTime);
        return !Number.isFinite(deletedMs) || deletedMs >= startUtcMs;
      })
      .map((e) => e.employeeId);

    const [salesRows, chatRows] = await Promise.all([
      this.inflowwService.getEmployeesSalesSummary(
        eligibleEmployeeIds,
        startDate,
        endDate,
        skipCache,
      ),
      this.inflowwService.getEmployeesChatSummary(
        eligibleEmployeeIds,
        startDate,
        endDate,
        skipCache,
      ),
    ]);

    const salesByEmp = new Map<
      string,
      {
        salesCents: number;
        ppvCents: number;
        tipsCents: number;
        dmCents: number;
        priorityMassCents: number;
        massCents: number;
        currency: string;
      }
    >();

    for (const row of salesRows) {
      const eid = String(row.employeeId).trim();
      const curr = salesByEmp.get(eid) || {
        salesCents: 0,
        ppvCents: 0,
        tipsCents: 0,
        dmCents: 0,
        priorityMassCents: 0,
        massCents: 0,
        currency: row.currency || 'USD',
      };
      curr.salesCents += parseCents(row.salesAmount) ?? 0;
      curr.ppvCents += parseCents(row.ppvSalesAmount) ?? 0;
      curr.tipsCents += parseCents(row.tipsSalesAmount) ?? 0;
      curr.dmCents += parseCents(row.directMessageSalesAmount) ?? 0;
      curr.priorityMassCents += parseCents(row.priorityMassMessageSalesAmount) ?? 0;
      curr.massCents += parseCents(row.massMessageSalesAmount) ?? 0;
      salesByEmp.set(eid, curr);
    }

    const chatByEmp = new Map<
      string,
      {
        directMessagesSent: number;
        directPpvsSent: number;
        ppvsUnlocked: number;
        fansChatted: number;
        characterCount: number;
        clockedTimeSum: number;
        clockedTimeCount: number;
        scheduledTimeSum: number;
        scheduledTimeCount: number;
      }
    >();

    for (const row of chatRows) {
      const eid = String(row.employeeId).trim();
      const curr = chatByEmp.get(eid) || {
        directMessagesSent: 0,
        directPpvsSent: 0,
        ppvsUnlocked: 0,
        fansChatted: 0,
        characterCount: 0,
        clockedTimeSum: 0,
        clockedTimeCount: 0,
        scheduledTimeSum: 0,
        scheduledTimeCount: 0,
      };
      curr.directMessagesSent += Number(row.directMessagesSent ?? 0);
      curr.directPpvsSent += Number(row.directPpvsSent ?? 0);
      curr.ppvsUnlocked += Number(row.ppvsUnlocked ?? 0);
      curr.fansChatted += Number(row.fansChatted ?? 0);
      curr.characterCount += Number(row.characterCount ?? 0);

      const clockedMs = Number(row.responseTimeBasedOnClockedHours);
      if (Number.isFinite(clockedMs) && clockedMs > 0) {
        curr.clockedTimeSum += clockedMs;
        curr.clockedTimeCount += 1;
      }
      const scheduledMs = Number(row.responseTimeBasedOnScheduledHours);
      if (Number.isFinite(scheduledMs) && scheduledMs > 0) {
        curr.scheduledTimeSum += scheduledMs;
        curr.scheduledTimeCount += 1;
      }
      chatByEmp.set(eid, curr);
    }

    let items: ChatterSummaryDto[] = employees.map((emp) => {
      const empKey = String(emp.employeeId).trim();
      const s = salesByEmp.get(empKey);
      const c = chatByEmp.get(empKey);

      const totalSales = centsToDollars(s?.salesCents ?? 0) ?? 0;
      const ppvSales = centsToDollars(s?.ppvCents ?? 0) ?? 0;
      const tipsSales = centsToDollars(s?.tipsCents ?? 0) ?? 0;
      const directMessageSales = centsToDollars(s?.dmCents ?? 0) ?? 0;
      const priorityMassMessageSales =
        centsToDollars(s?.priorityMassCents ?? 0) ?? 0;
      const massMessageSales = centsToDollars(s?.massCents ?? 0) ?? 0;

      const directMessagesSent = c?.directMessagesSent ?? 0;
      const directPpvsSent = c?.directPpvsSent ?? 0;
      const ppvsUnlocked = c?.ppvsUnlocked ?? 0;

      const unlockRate =
        directPpvsSent > 0
          ? Math.round((ppvsUnlocked / directPpvsSent) * 10000) / 100
          : null;
      const goldenRatio =
        directMessagesSent > 0
          ? Math.round((directPpvsSent / directMessagesSent) * 10000) / 100
          : null;
      const averagePpvSaleValue =
        ppvsUnlocked > 0
          ? Math.round((ppvSales / ppvsUnlocked) * 100) / 100
          : null;

      return {
        employeeId: emp.employeeId,
        name: emp.employeeName || `Employee #${emp.employeeId}`,
        status: emp.status || 'Activated',
        createdTime: emp.createdTime || null,
        deletedTime: emp.deletedTime || null,
        totalSales,
        ppvSales,
        tipsSales,
        directMessageSales,
        priorityMassMessageSales,
        massMessageSales,
        directMessagesSent,
        directPpvsSent,
        ppvsUnlocked,
        unlockRate,
        goldenRatio,
        fansChatted: c?.fansChatted ?? 0,
        characterCount: c?.characterCount ?? 0,
        avgResponseTimeClockedMs:
          c && c.clockedTimeCount > 0
            ? Math.round(c.clockedTimeSum / c.clockedTimeCount)
            : null,
        avgResponseTimeScheduledMs:
          c && c.scheduledTimeCount > 0
            ? Math.round(c.scheduledTimeSum / c.scheduledTimeCount)
            : null,
        averagePpvSaleValue,
        currency: s?.currency || 'USD',
      };
    });

    const totalEmployeesCount = items.length;
    const activeChattersCount = items.filter(
      (i) => i.status.toLowerCase() === 'activated',
    ).length;

    if (query.status && query.status.toLowerCase() !== 'all') {
      const target = query.status.toLowerCase();
      items = items.filter((i) => i.status.toLowerCase() === target);
    }

    if (query.search && query.search.trim()) {
      const q = query.search.trim().toLowerCase();
      items = items.filter(
        (i) =>
          i.name.toLowerCase().includes(q) ||
          String(i.employeeId).includes(q),
      );
    }

    const sortBy = query.sortBy || 'totalSales';
    const sortOrder = query.sortOrder || 'desc';
    const dir = sortOrder === 'asc' ? 1 : -1;

    items.sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name) * dir;
      }
      const valA = a[sortBy] ?? -1;
      const valB = b[sortBy] ?? -1;
      return (Number(valA) - Number(valB)) * dir;
    });

    const total = items.length;
    const page = query.page || 1;
    const limit = query.limit || 10;
    const startIdx = (page - 1) * limit;
    const paginated = items.slice(startIdx, startIdx + limit);

    const totalAttributedRevenue = items.reduce(
      (sum, item) => sum + item.totalSales,
      0,
    );
    const totalPpvsUnlocked = items.reduce(
      (sum, item) => sum + item.ppvsUnlocked,
      0,
    );
    const totalDirectMessages = items.reduce(
      (sum, item) => sum + item.directMessagesSent,
      0,
    );

    return {
      dateRange: { startDate, endDate },
      summary: {
        totalEmployees: totalEmployeesCount,
        activeChatters: activeChattersCount,
        totalAttributedSales: Math.round(totalAttributedRevenue * 100) / 100,
        totalPpvsUnlocked,
        totalDirectMessages,
        attributionSource:
          'Verified Employee-Level Attribution via Infloww /v1/employee-report/employee-sales-summary & /v1/employee-report/employee-chat-summary',
      },
      meta: {
        total,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
      items: paginated,
    };
  }

  async getChatterById(
    employeeIdParam: string,
    startDateInput?: string,
    endDateInput?: string,
    refresh?: string,
  ) {
    const skipCache = refresh === 'true';
    const targetEmpKey = String(employeeIdParam).trim();
    const { startDate, endDate } = resolveDateWindows(
      startDateInput,
      endDateInput,
    );

    const employees = await this.inflowwService.getEmployees(
      undefined,
      skipCache,
    );
    const employee = employees.find(
      (e) => String(e.employeeId).trim() === targetEmpKey,
    );
    if (!employee) {
      throw new NotFoundException(
        `Chatter/Employee with ID "${employeeIdParam}" not found`,
      );
    }

    const [
      { creators },
      assignedRows,
      salesRows,
      chatRows,
    ] = await Promise.all([
      this.inflowwService.getAllCreatorsWithFallback(skipCache),
      this.inflowwService.getEmployeeAssignedCreators(targetEmpKey, skipCache),
      this.inflowwService.getEmployeesSalesSummary(
        [targetEmpKey],
        startDate,
        endDate,
        skipCache,
      ),
      this.inflowwService.getEmployeesChatSummary(
        [targetEmpKey],
        startDate,
        endDate,
        skipCache,
      ),
    ]);

    const creatorById = new Map(creators.map((c) => [String(c.id).trim(), c]));
    const creatorByPid = new Map(
      creators
        .filter((c) => c.platformPid !== undefined && c.platformPid !== null)
        .map((c) => [String(c.platformPid).trim(), c]),
    );

    const assignedCreators = assignedRows.map((row) => {
      const c = creatorById.get(String(row.creatorId).trim());
      return {
        creatorId: String(row.creatorId),
        name: c?.name || c?.nickName || `Creator #${row.creatorId}`,
        userName: c?.userName || '',
        status: c?.status || 'connected',
        platformCode: row.platformCode || 'OnlyFans',
      };
    });

    const dailyMap = new Map<
      string,
      {
        date: string;
        totalSalesCents: number;
        ppvSalesCents: number;
        tipsSalesCents: number;
        directMessagesSent: number;
        directPpvsSent: number;
        ppvsUnlocked: number;
      }
    >();

    const perCreatorSalesMap = new Map<
      string,
      {
        platformPid: number;
        creatorId: string | null;
        creatorName: string;
        totalSalesCents: number;
        ppvSalesCents: number;
        tipsSalesCents: number;
      }
    >();

    for (const s of salesRows) {
      const d = dailyMap.get(s.date) || {
        date: s.date,
        totalSalesCents: 0,
        ppvSalesCents: 0,
        tipsSalesCents: 0,
        directMessagesSent: 0,
        directPpvsSent: 0,
        ppvsUnlocked: 0,
      };
      const salesCents = parseCents(s.salesAmount) ?? 0;
      const ppvCents = parseCents(s.ppvSalesAmount) ?? 0;
      const tipsCents = parseCents(s.tipsSalesAmount) ?? 0;

      d.totalSalesCents += salesCents;
      d.ppvSalesCents += ppvCents;
      d.tipsSalesCents += tipsCents;
      dailyMap.set(s.date, d);

      if (s.platformPid) {
        const pidKey = String(s.platformPid).trim();
        const matchedCreator = creatorByPid.get(pidKey);
        const cEntry = perCreatorSalesMap.get(pidKey) || {
          platformPid: Number(s.platformPid),
          creatorId: matchedCreator ? String(matchedCreator.id) : null,
          creatorName:
            matchedCreator?.name ||
            matchedCreator?.nickName ||
            `Performer #${s.platformPid}`,
          totalSalesCents: 0,
          ppvSalesCents: 0,
          tipsSalesCents: 0,
        };
        cEntry.totalSalesCents += salesCents;
        cEntry.ppvSalesCents += ppvCents;
        cEntry.tipsSalesCents += tipsCents;
        perCreatorSalesMap.set(pidKey, cEntry);
      }
    }

    for (const c of chatRows) {
      const d = dailyMap.get(c.date) || {
        date: c.date,
        totalSalesCents: 0,
        ppvSalesCents: 0,
        tipsSalesCents: 0,
        directMessagesSent: 0,
        directPpvsSent: 0,
        ppvsUnlocked: 0,
      };
      d.directMessagesSent += c.directMessagesSent ?? 0;
      d.directPpvsSent += c.directPpvsSent ?? 0;
      d.ppvsUnlocked += c.ppvsUnlocked ?? 0;
      dailyMap.set(c.date, d);
    }

    const totalSalesCents = salesRows.reduce(
      (sum, r) => sum + (parseCents(r.salesAmount) ?? 0),
      0,
    );
    const ppvSalesCents = salesRows.reduce(
      (sum, r) => sum + (parseCents(r.ppvSalesAmount) ?? 0),
      0,
    );
    const tipsSalesCents = salesRows.reduce(
      (sum, r) => sum + (parseCents(r.tipsSalesAmount) ?? 0),
      0,
    );
    const directMessageSalesCents = salesRows.reduce(
      (sum, r) => sum + (parseCents(r.directMessageSalesAmount) ?? 0),
      0,
    );
    const directMessagesSent = chatRows.reduce(
      (sum, r) => sum + (r.directMessagesSent ?? 0),
      0,
    );
    const directPpvsSent = chatRows.reduce(
      (sum, r) => sum + (r.directPpvsSent ?? 0),
      0,
    );
    const ppvsUnlocked = chatRows.reduce(
      (sum, r) => sum + (r.ppvsUnlocked ?? 0),
      0,
    );

    return {
      dateRange: { startDate, endDate },
      chatter: {
        employeeId: employee.employeeId,
        name: employee.employeeName || `Employee #${employee.employeeId}`,
        status: employee.status || 'Activated',
        createdTime: employee.createdTime || null,
        deletedTime: employee.deletedTime || null,
      },
      metrics: {
        totalSales: centsToDollars(totalSalesCents) ?? 0,
        ppvSales: centsToDollars(ppvSalesCents) ?? 0,
        tipsSales: centsToDollars(tipsSalesCents) ?? 0,
        directMessageSales: centsToDollars(directMessageSalesCents) ?? 0,
        directMessagesSent,
        directPpvsSent,
        ppvsUnlocked,
        unlockRate:
          directPpvsSent > 0
            ? Math.round((ppvsUnlocked / directPpvsSent) * 10000) / 100
            : null,
        goldenRatio:
          directMessagesSent > 0
            ? Math.round((directPpvsSent / directMessagesSent) * 10000) / 100
            : null,
        averagePpvSaleValue:
          ppvsUnlocked > 0
            ? Math.round(
                ((centsToDollars(ppvSalesCents) ?? 0) / ppvsUnlocked) * 100,
              ) / 100
            : null,
      },
      assignedCreators,
      salesByCreator: Array.from(perCreatorSalesMap.values())
        .map((c) => ({
          platformPid: c.platformPid,
          creatorId: c.creatorId,
          creatorName: c.creatorName,
          totalSales: centsToDollars(c.totalSalesCents) ?? 0,
          ppvSales: centsToDollars(c.ppvSalesCents) ?? 0,
          tipsSales: centsToDollars(c.tipsSalesCents) ?? 0,
        }))
        .sort((a, b) => b.totalSales - a.totalSales),
      dailyPerformance: Array.from(dailyMap.values())
        .sort((a, b) => a.date.localeCompare(b.date))
        .map((d) => ({
          date: d.date,
          totalSales: centsToDollars(d.totalSalesCents) ?? 0,
          ppvSales: centsToDollars(d.ppvSalesCents) ?? 0,
          tipsSales: centsToDollars(d.tipsSalesCents) ?? 0,
          directMessagesSent: d.directMessagesSent,
          directPpvsSent: d.directPpvsSent,
          ppvsUnlocked: d.ppvsUnlocked,
        })),
    };
  }
}
