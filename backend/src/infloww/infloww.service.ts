import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import {
  chunkArray,
  resolveDateWindows,
} from '../common/utils/date-currency.util';
import { InflowwClient } from './infloww.client';
import {
  INFLOWW_DEFAULT_PLATFORM,
  INFLOWW_ENDPOINTS,
  INFLOWW_MAX_BATCH_IDS,
  INFLOWW_MAX_PAGE_LIMIT,
  INFLOWW_MAX_PAGES_PER_QUERY,
} from './infloww.constants';
import {
  InflowwAnyLinkItem,
  InflowwAssignedCreatorItem,
  InflowwAvgSubLengthReportItem,
  InflowwCreatorChatSummaryItem,
  InflowwCreatorItem,
  InflowwCreatorRankReportItem,
  InflowwEmployeeChatSummaryItem,
  InflowwEmployeeItem,
  InflowwEmployeeSalesSummaryItem,
  InflowwFansCountReportItem,
  InflowwFansRenewOnReportItem,
  InflowwLinkFanItem,
  InflowwLinkStatus,
  InflowwLinkType,
  InflowwPaginatedResponse,
  InflowwProfileVisitorReportItem,
  InflowwRefundItem,
  InflowwReportResponse,
  InflowwSubscriberCountReportItem,
  InflowwTransactionItem,
  InflowwTransactionPerfItem,
} from './infloww.types';

@Injectable()
export class InflowwService {
  private readonly logger = new Logger(InflowwService.name);

  constructor(private readonly inflowwClient: InflowwClient) {}

  clearCache(prefix?: string): void {
    this.inflowwClient.clearCache(prefix);
  }

  /**
   * Traverses cursor-paginated Infloww endpoints until `hasMore` is false or maxPages is reached.
   */
  async fetchAllPages<TItem>(
    endpoint: string,
    baseParams: Record<string, unknown> = {},
    options?: {
      limit?: number;
      maxPages?: number;
      skipCache?: boolean;
    },
  ): Promise<TItem[]> {
    const limit = options?.limit ?? INFLOWW_MAX_PAGE_LIMIT;
    const maxPages = options?.maxPages ?? INFLOWW_MAX_PAGES_PER_QUERY;
    const items: TItem[] = [];
    let cursor: string | number | undefined = undefined;
    let page = 0;

    while (page < maxPages) {
      page += 1;
      const params: Record<string, unknown> = {
        ...baseParams,
        limit,
      };
      if (cursor !== undefined && cursor !== null && cursor !== '') {
        params.cursor = cursor;
      }

      const response = await this.inflowwClient.get<
        InflowwPaginatedResponse<TItem>
      >(endpoint, params, {
        skipCache: options?.skipCache && page === 1,
      });

      const list = response?.data?.list;
      if (Array.isArray(list) && list.length > 0) {
        items.push(...list);
      }

      const nextCursor = response?.cursor;
      const hasMore = Boolean(response?.hasMore);
      if (
        !hasMore ||
        nextCursor === undefined ||
        nextCursor === null ||
        nextCursor === '' ||
        nextCursor === cursor
      ) {
        break;
      }
      cursor = nextCursor;
    }

    return items;
  }

  /**
   * Runs async tasks with bounded concurrency to respect the 1,000 QPM agency rate limit.
   */
  async mapWithConcurrency<TInput, TOutput>(
    items: TInput[],
    concurrency: number,
    fn: (item: TInput) => Promise<TOutput>,
  ): Promise<TOutput[]> {
    const results: TOutput[] = new Array(items.length);
    let currentIndex = 0;

    const worker = async (): Promise<void> => {
      while (currentIndex < items.length) {
        const index = currentIndex;
        currentIndex += 1;
        results[index] = await fn(items[index]);
      }
    };

    const workers = Array.from(
      { length: Math.min(concurrency, items.length) },
      () => worker(),
    );
    await Promise.all(workers);
    return results;
  }

  // ============================================================================
  // 1. Creators
  // ============================================================================

  async getConnectedCreators(
    skipCache = false,
  ): Promise<InflowwCreatorItem[]> {
    const list = await this.fetchAllPages<InflowwCreatorItem>(
      INFLOWW_ENDPOINTS.CONNECTED_CREATORS,
      { platformCode: INFLOWW_DEFAULT_PLATFORM },
      { skipCache },
    );
    return list.map((creator) => ({
      ...creator,
      status: creator.status || 'connected',
    }));
  }

  async getAllCreatorsWithFallback(skipCache = false): Promise<{
    creators: InflowwCreatorItem[];
    allCreatorsScopeAvailable: boolean;
  }> {
    try {
      const list = await this.fetchAllPages<InflowwCreatorItem>(
        INFLOWW_ENDPOINTS.ALL_CREATORS,
        { platformCode: INFLOWW_DEFAULT_PLATFORM },
        { skipCache },
      );
      return {
        creators: list,
        allCreatorsScopeAvailable: true,
      };
    } catch (error) {
      if (
        error instanceof HttpException &&
        (error.getStatus() === HttpStatus.FORBIDDEN ||
          error.getStatus() === HttpStatus.UNAUTHORIZED)
      ) {
        this.logger.log(
          'API key does not have "All Creators" scope for /v1/all-creators; falling back to /v1/creators.',
        );
        const connected = await this.getConnectedCreators(skipCache);
        return {
          creators: connected,
          allCreatorsScopeAvailable: false,
        };
      }
      throw error;
    }
  }

  // ============================================================================
  // 2. Transactions, Refunds & Attributed Sales Records
  // ============================================================================

  async getCreatorTransactions(
    creatorId: string | number,
    startDate?: string,
    endDate?: string,
    skipCache = false,
  ): Promise<Array<InflowwTransactionItem & { creatorId: string }>> {
    const { windows } = resolveDateWindows(startDate, endDate);
    const allTransactions: Array<
      InflowwTransactionItem & { creatorId: string }
    > = [];

    for (const window of windows) {
      const list = await this.fetchAllPages<InflowwTransactionItem>(
        INFLOWW_ENDPOINTS.TRANSACTIONS,
        {
          creatorId: Number(creatorId),
          startTime: window.startMs,
          endTime: window.endMs,
          platformCode: INFLOWW_DEFAULT_PLATFORM,
        },
        { skipCache },
      );
      for (const tx of list) {
        allTransactions.push({
          ...tx,
          creatorId: String(creatorId),
        });
      }
    }

    return allTransactions;
  }

  async getAllCreatorsTransactions(
    creators: InflowwCreatorItem[],
    startDate?: string,
    endDate?: string,
    skipCache = false,
  ): Promise<Array<InflowwTransactionItem & { creatorId: string }>> {
    const connectedCreators = creators.filter(
      (c) => !c.status || c.status.toLowerCase() === 'connected',
    );
    const perCreatorLists = await this.mapWithConcurrency(
      connectedCreators,
      5,
      async (creator) => {
        try {
          return await this.getCreatorTransactions(
            creator.id,
            startDate,
            endDate,
            skipCache,
          );
        } catch (err) {
          this.logger.warn(
            `Failed to fetch transactions for creator ${creator.id}: ${
              err instanceof Error ? err.message : String(err)
            }`,
          );
          return [];
        }
      },
    );

    return perCreatorLists.flat();
  }

  async getCreatorRefunds(
    creatorId: string | number,
    startDate?: string,
    endDate?: string,
    skipCache = false,
  ): Promise<Array<InflowwRefundItem & { creatorId: string }>> {
    const { windows } = resolveDateWindows(startDate, endDate);
    const allRefunds: Array<InflowwRefundItem & { creatorId: string }> = [];

    for (const window of windows) {
      const list = await this.fetchAllPages<InflowwRefundItem>(
        INFLOWW_ENDPOINTS.REFUNDS,
        {
          creatorId: Number(creatorId),
          startTime: window.startMs,
          endTime: window.endMs,
          platformCode: INFLOWW_DEFAULT_PLATFORM,
        },
        { skipCache },
      );
      for (const item of list) {
        allRefunds.push({
          ...item,
          creatorId: String(creatorId),
        });
      }
    }

    return allRefunds;
  }

  async getAllCreatorsRefunds(
    creators: InflowwCreatorItem[],
    startDate?: string,
    endDate?: string,
    skipCache = false,
  ): Promise<Array<InflowwRefundItem & { creatorId: string }>> {
    const connectedCreators = creators.filter(
      (c) => !c.status || c.status.toLowerCase() === 'connected',
    );
    const perCreatorLists = await this.mapWithConcurrency(
      connectedCreators,
      5,
      async (creator) => {
        try {
          return await this.getCreatorRefunds(
            creator.id,
            startDate,
            endDate,
            skipCache,
          );
        } catch (err) {
          this.logger.warn(
            `Failed to fetch refunds for creator ${creator.id}: ${
              err instanceof Error ? err.message : String(err)
            }`,
          );
          return [];
        }
      },
    );

    return perCreatorLists.flat();
  }

  async getCreatorSalesPerfDetails(
    creatorId: string | number,
    startDate?: string,
    endDate?: string,
    skipCache = false,
  ): Promise<{
    records: Array<InflowwTransactionPerfItem & { creatorId: string }>;
    scopeAvailable: boolean;
  }> {
    const { windows } = resolveDateWindows(startDate, endDate);
    const records: Array<InflowwTransactionPerfItem & { creatorId: string }> =
      [];

    try {
      for (const window of windows) {
        const list = await this.fetchAllPages<InflowwTransactionPerfItem>(
          INFLOWW_ENDPOINTS.TRANSACTION_PERF_DETAILS,
          {
            creatorId: Number(creatorId),
            startTime: window.startMs,
            endTime: window.endMs,
            platformCode: INFLOWW_DEFAULT_PLATFORM,
          },
          { skipCache },
        );
        for (const item of list) {
          records.push({
            ...item,
            creatorId: String(creatorId),
          });
        }
      }
      return { records, scopeAvailable: true };
    } catch (error) {
      if (
        error instanceof HttpException &&
        (error.getStatus() === HttpStatus.FORBIDDEN ||
          error.getStatus() === HttpStatus.UNAUTHORIZED)
      ) {
        return { records: [], scopeAvailable: false };
      }
      throw error;
    }
  }

  // ============================================================================
  // 3. Creator Daily Reports (Chunked by <= 10 creatorIds and <= 30-day windows)
  // ============================================================================

  private async fetchCreatorBatchReport<TReportItem>(
    endpoint: string,
    creatorIds: Array<string | number>,
    startDate?: string,
    endDate?: string,
    skipCache = false,
  ): Promise<TReportItem[]> {
    const cleanIds = creatorIds
      .map((id) => String(id).trim())
      .filter((id) => id.length > 0);
    if (cleanIds.length === 0) return [];

    const idBatches = chunkArray(cleanIds, INFLOWW_MAX_BATCH_IDS);
    const { windows } = resolveDateWindows(startDate, endDate);
    const tasks: Array<{ window: (typeof windows)[number]; batch: string[] }> =
      [];

    for (const window of windows) {
      for (const batch of idBatches) {
        tasks.push({ window, batch });
      }
    }

    const nested = await this.mapWithConcurrency(tasks, 5, async (task) => {
      try {
        const response = await this.inflowwClient.get<
          InflowwReportResponse<TReportItem>
        >(
          endpoint,
          {
            creatorIds: task.batch,
            startTime: task.window.startDate,
            endTime: task.window.endDate,
            platformCode: INFLOWW_DEFAULT_PLATFORM,
          },
          { skipCache },
        );
        return Array.isArray(response?.data?.list) ? response.data.list : [];
      } catch (err) {
        this.logger.warn(
          `Creator report request failed on ${endpoint} for batch [${task.batch.join(
            ',',
          )}]: ${err instanceof Error ? err.message : String(err)}`,
        );
        return [];
      }
    });

    return nested.flat();
  }

  async getCreatorsFansCount(
    creatorIds: Array<string | number>,
    startDate?: string,
    endDate?: string,
    skipCache = false,
  ): Promise<InflowwFansCountReportItem[]> {
    return this.fetchCreatorBatchReport<InflowwFansCountReportItem>(
      INFLOWW_ENDPOINTS.CREATOR_FANS_COUNT,
      creatorIds,
      startDate,
      endDate,
      skipCache,
    );
  }

  async getCreatorsSubscriberCount(
    creatorIds: Array<string | number>,
    startDate?: string,
    endDate?: string,
    skipCache = false,
  ): Promise<InflowwSubscriberCountReportItem[]> {
    return this.fetchCreatorBatchReport<InflowwSubscriberCountReportItem>(
      INFLOWW_ENDPOINTS.CREATOR_SUBSCRIBER_COUNT,
      creatorIds,
      startDate,
      endDate,
      skipCache,
    );
  }

  async getCreatorsFansRenewOn(
    creatorIds: Array<string | number>,
    startDate?: string,
    endDate?: string,
    skipCache = false,
  ): Promise<InflowwFansRenewOnReportItem[]> {
    return this.fetchCreatorBatchReport<InflowwFansRenewOnReportItem>(
      INFLOWW_ENDPOINTS.CREATOR_FANS_RENEW_ON,
      creatorIds,
      startDate,
      endDate,
      skipCache,
    );
  }

  async getCreatorsAvgSubscriptionLength(
    creatorIds: Array<string | number>,
    startDate?: string,
    endDate?: string,
    skipCache = false,
  ): Promise<InflowwAvgSubLengthReportItem[]> {
    return this.fetchCreatorBatchReport<InflowwAvgSubLengthReportItem>(
      INFLOWW_ENDPOINTS.CREATOR_AVG_SUBSCRIPTION_LENGTH,
      creatorIds,
      startDate,
      endDate,
      skipCache,
    );
  }

  async getCreatorsProfileVisitors(
    creatorIds: Array<string | number>,
    startDate?: string,
    endDate?: string,
    skipCache = false,
  ): Promise<InflowwProfileVisitorReportItem[]> {
    return this.fetchCreatorBatchReport<InflowwProfileVisitorReportItem>(
      INFLOWW_ENDPOINTS.CREATOR_PROFILE_VISITOR_COUNT,
      creatorIds,
      startDate,
      endDate,
      skipCache,
    );
  }

  async getCreatorsRank(
    creatorIds: Array<string | number>,
    startDate?: string,
    endDate?: string,
    skipCache = false,
  ): Promise<InflowwCreatorRankReportItem[]> {
    return this.fetchCreatorBatchReport<InflowwCreatorRankReportItem>(
      INFLOWW_ENDPOINTS.CREATOR_RANK,
      creatorIds,
      startDate,
      endDate,
      skipCache,
    );
  }

  async getCreatorsChatSummary(
    creatorIds: Array<string | number>,
    startDate?: string,
    endDate?: string,
    skipCache = false,
  ): Promise<InflowwCreatorChatSummaryItem[]> {
    return this.fetchCreatorBatchReport<InflowwCreatorChatSummaryItem>(
      INFLOWW_ENDPOINTS.CREATOR_CHAT_SUMMARY,
      creatorIds,
      startDate,
      endDate,
      skipCache,
    );
  }

  // ============================================================================
  // 4. Employees / Chatters & Employee Daily Reports
  // ============================================================================

  async getEmployees(
    employeeIds?: number[],
    skipCache = false,
  ): Promise<InflowwEmployeeItem[]> {
    const params: Record<string, unknown> = {};
    if (Array.isArray(employeeIds) && employeeIds.length > 0) {
      params.employeeIds = employeeIds;
    }
    return this.fetchAllPages<InflowwEmployeeItem>(
      INFLOWW_ENDPOINTS.EMPLOYEES,
      params,
      { skipCache },
    );
  }

  async getEmployeeAssignedCreators(
    employeeId: number | string,
    skipCache = false,
  ): Promise<InflowwAssignedCreatorItem[]> {
    return this.fetchAllPages<InflowwAssignedCreatorItem>(
      INFLOWW_ENDPOINTS.EMPLOYEE_ASSIGNED_CREATORS,
      { employeeId: String(employeeId).trim() },
      { skipCache },
    );
  }

  async getEmployeesSalesSummary(
    employeeIds: Array<number | string>,
    startDate?: string,
    endDate?: string,
    skipCache = false,
  ): Promise<InflowwEmployeeSalesSummaryItem[]> {
    const cleanIds = employeeIds
      .map((id) => String(id).trim())
      .filter((id) => id.length > 0);
    if (cleanIds.length === 0) return [];

    const idBatches = chunkArray(cleanIds, INFLOWW_MAX_BATCH_IDS);
    const { windows } = resolveDateWindows(startDate, endDate);
    const tasks: Array<{ window: (typeof windows)[number]; batch: string[] }> =
      [];

    for (const window of windows) {
      for (const batch of idBatches) {
        tasks.push({ window, batch });
      }
    }

    const nested = await this.mapWithConcurrency(tasks, 5, async (task) => {
      try {
        const response = await this.inflowwClient.get<
          InflowwReportResponse<InflowwEmployeeSalesSummaryItem>
        >(
          INFLOWW_ENDPOINTS.EMPLOYEE_SALES_SUMMARY,
          {
            employeeIds: task.batch,
            startTime: task.window.startDate,
            endTime: task.window.endDate,
            platformCode: INFLOWW_DEFAULT_PLATFORM,
          },
          { skipCache },
        );
        return Array.isArray(response?.data?.list) ? response.data.list : [];
      } catch (err) {
        this.logger.warn(
          `Employee sales summary failed for batch [${task.batch.join(',')}]: ${
            err instanceof Error ? err.message : String(err)
          }`,
        );
        return [];
      }
    });

    return nested.flat();
  }

  async getEmployeesChatSummary(
    employeeIds: Array<number | string>,
    startDate?: string,
    endDate?: string,
    skipCache = false,
  ): Promise<InflowwEmployeeChatSummaryItem[]> {
    const cleanIds = employeeIds
      .map((id) => String(id).trim())
      .filter((id) => id.length > 0);
    if (cleanIds.length === 0) return [];

    const idBatches = chunkArray(cleanIds, INFLOWW_MAX_BATCH_IDS);
    const { windows } = resolveDateWindows(startDate, endDate);
    const tasks: Array<{ window: (typeof windows)[number]; batch: string[] }> =
      [];

    for (const window of windows) {
      for (const batch of idBatches) {
        tasks.push({ window, batch });
      }
    }

    const nested = await this.mapWithConcurrency(tasks, 5, async (task) => {
      try {
        const response = await this.inflowwClient.get<
          InflowwReportResponse<InflowwEmployeeChatSummaryItem>
        >(
          INFLOWW_ENDPOINTS.EMPLOYEE_CHAT_SUMMARY,
          {
            employeeIds: task.batch,
            startTime: task.window.startDate,
            endTime: task.window.endDate,
            platformCode: INFLOWW_DEFAULT_PLATFORM,
          },
          { skipCache },
        );
        return Array.isArray(response?.data?.list) ? response.data.list : [];
      } catch (err) {
        this.logger.warn(
          `Employee chat summary failed for batch [${task.batch.join(',')}]: ${
            err instanceof Error ? err.message : String(err)
          }`,
        );
        return [];
      }
    });

    return nested.flat();
  }

  // ============================================================================
  // 5. Marketing Links, Trial Links & Promotions (/v1/links & /v1/linkfans)
  // ============================================================================

  async getCreatorLinks(
    creatorId: string | number,
    linkType: InflowwLinkType,
    startDate?: string,
    endDate?: string,
    status?: InflowwLinkStatus,
    skipCache = false,
  ): Promise<
    Array<
      InflowwAnyLinkItem & {
        creatorId: string;
        linkType: InflowwLinkType;
      }
    >
  > {
    const { windows } = resolveDateWindows(startDate, endDate);
    const results: Array<
      InflowwAnyLinkItem & {
        creatorId: string;
        linkType: InflowwLinkType;
      }
    > = [];

    for (const window of windows) {
      const params: Record<string, unknown> = {
        creatorId: Number(creatorId),
        linkType,
        startTime: window.startMs,
        endTime: window.endMs,
        platformCode: INFLOWW_DEFAULT_PLATFORM,
      };
      // status is not applicable when linkType is CAMPAIGN per Infloww v1.4 spec
      if (status && linkType !== 'CAMPAIGN') {
        params.status = status;
      }

      const list = await this.fetchAllPages<InflowwAnyLinkItem>(
        INFLOWW_ENDPOINTS.LINKS,
        params,
        { skipCache },
      );

      for (const item of list) {
        results.push({
          ...item,
          creatorId: String(creatorId),
          linkType,
        });
      }
    }

    // Deduplicate links across multiple 31-day windows by (linkType, id)
    const deduped = new Map<
      string,
      InflowwAnyLinkItem & { creatorId: string; linkType: InflowwLinkType }
    >();
    for (const item of results) {
      deduped.set(`${item.linkType}:${item.creatorId}:${item.id}`, item);
    }

    return Array.from(deduped.values());
  }

  async getAllCreatorsLinks(
    creators: InflowwCreatorItem[],
    linkTypes: InflowwLinkType[] = ['TRACKING', 'TRIAL', 'CAMPAIGN'],
    startDate?: string,
    endDate?: string,
    status?: InflowwLinkStatus,
    skipCache = false,
  ): Promise<
    Array<
      InflowwAnyLinkItem & {
        creatorId: string;
        creatorName: string;
        creatorUserName: string;
        linkType: InflowwLinkType;
      }
    >
  > {
    const connectedCreators = creators.filter(
      (c) => !c.status || c.status.toLowerCase() === 'connected',
    );

    const tasks: Array<{
      creator: InflowwCreatorItem;
      linkType: InflowwLinkType;
    }> = [];
    for (const creator of connectedCreators) {
      for (const linkType of linkTypes) {
        tasks.push({ creator, linkType });
      }
    }

    const nested = await this.mapWithConcurrency(tasks, 5, async (task) => {
      try {
        const links = await this.getCreatorLinks(
          task.creator.id,
          task.linkType,
          startDate,
          endDate,
          status,
          skipCache,
        );
        return links.map((link) => ({
          ...link,
          creatorName:
            task.creator.name ||
            task.creator.nickName ||
            `Creator #${task.creator.id}`,
          creatorUserName: task.creator.userName || '',
        }));
      } catch (err) {
        this.logger.warn(
          `Failed to fetch ${task.linkType} links for creator ${task.creator.id}: ${
            err instanceof Error ? err.message : String(err)
          }`,
        );
        return [];
      }
    });

    return nested.flat();
  }

  async getLinkFans(
    creatorId: string | number,
    linkType: InflowwLinkType,
    linkId: string | number,
    skipCache = false,
  ): Promise<InflowwLinkFanItem[]> {
    return this.fetchAllPages<InflowwLinkFanItem>(
      INFLOWW_ENDPOINTS.LINK_FANS,
      {
        creatorId: Number(creatorId),
        linkType,
        linkId: Number(linkId),
        platformCode: INFLOWW_DEFAULT_PLATFORM,
      },
      { skipCache },
    );
  }
}
