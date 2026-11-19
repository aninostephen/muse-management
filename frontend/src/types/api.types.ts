// ============================================================================
// Authentication & User Types
// ============================================================================

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: 'admin';
}

export interface LoginRequestDto {
  email: string;
  password: string;
}

export interface LoginResponseDto {
  accessToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
  user: AuthUser;
}

export interface AuthMeResponseDto {
  user: AuthUser | null;
}

// ============================================================================
// Common Query & Pagination Types
// ============================================================================

export interface DateRangeFilter {
  startDate?: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
  refresh?: boolean;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  allCreatorsScopeAvailable?: boolean;
}

// ============================================================================
// Dashboard Types
// ============================================================================

export interface DashboardOverviewKpis {
  totalRevenueGross: number;
  totalRevenueNet: number;
  totalFees: number;
  totalRefunds: number;
  totalCreators: number;
  totalCreatorsAllStatuses: number;
  totalFans: number | null;
  totalExpiredFans: number | null;
  totalNewSubscribers: number | null;
  totalSubscriberRenewals: number | null;
  activeChatters: number;
  totalEmployees: number;
  averageRevenuePerCreator: number | null;
  totalTransactions: number;
  refundCount: number;
  currency: string;
}

export interface DashboardOverviewResponse {
  dateRange: {
    startDate: string;
    endDate: string;
  };
  kpis: DashboardOverviewKpis;
  meta: {
    allCreatorsScopeAvailable: boolean;
    fansReportAvailable: boolean;
    lastSynchronizedAt: string;
  };
}

export interface DashboardPerformanceResponse {
  dateRange: {
    startDate: string;
    endDate: string;
  };
  topCreators: CreatorSummaryItem[];
  topChatters: ChatterSummaryItem[];
  chatterSummary: ChattersListSummary;
  topMarketingLinks: MarketingLinkItem[];
  marketingSummary: MarketingLinksSummary;
}

// ============================================================================
// Creators Types
// ============================================================================

export interface CreatorSummaryItem {
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

export interface CreatorsListQuery extends DateRangeFilter {
  search?: string;
  status?: string;
  sortBy?:
    | 'name'
    | 'totalEarningsGross'
    | 'totalEarningsNet'
    | 'subscriptionRevenue'
    | 'activeFans'
    | 'transactionCount';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface CreatorsListResponse {
  dateRange: { startDate: string; endDate: string };
  summary?: {
    totalMatchingCreators: number;
    totalGross: number;
    totalNet: number;
    totalSubscriptionRevenue: number;
    totalActiveFans: number | null;
  };
  meta: PaginationMeta;
  items: CreatorSummaryItem[];
}

export interface CreatorDetailResponse {
  dateRange: { startDate: string; endDate: string };
  creator: {
    id: string;
    name: string;
    nickName: string;
    userName: string;
    tagName: string;
    status: string;
    platformPid: number | null;
    createdTime: string | null;
  };
  revenue: {
    totalEarningsGross: number;
    totalEarningsNet: number;
    totalFees: number;
    subscriptionRevenue: number;
    tipsRevenue: number;
    messagesRevenue: number;
    otherRevenue: number;
    totalRefunds: number;
    refundCount: number;
    transactionCount: number;
  };
  fanAnalytics: {
    activeFans: number | null;
    expiredFans: number | null;
    newSubscribers: number | null;
    subscriberRenewals: number | null;
    fansWithRenewOn: number | null;
    avgSubscriptionLengthDays: number | null;
    profileVisitors: number | null;
    performanceRank: number | null;
  };
  chatActivity: {
    replyTimeMs: number;
    fansChatted: number;
    messagesSent: number;
    ppvsSent: number;
  } | null;
  dailyRevenue: Array<{
    date: string;
    gross: number;
    net: number;
    transactionCount: number;
  }>;
  recentTransactions: Array<{
    id: string;
    transactionId: string;
    fanId: string;
    fanName: string;
    type: string;
    tipSource: string;
    status: string;
    amount: number;
    fee: number;
    net: number;
    currency: string;
    createdTime: string;
  }>;
}

// ============================================================================
// Chatters / Employees Types
// ============================================================================

export interface ChatterSummaryItem {
  employeeId: number | string;
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

export interface ChattersListSummary {
  totalEmployees: number;
  activeChatters: number;
  totalAttributedSales: number;
  totalPpvsUnlocked: number;
  totalDirectMessages: number;
  attributionSource: string;
}

export interface ChattersListQuery extends DateRangeFilter {
  search?: string;
  status?: string;
  sortBy?:
    | 'name'
    | 'totalSales'
    | 'ppvSales'
    | 'tipsSales'
    | 'directMessagesSent'
    | 'ppvsUnlocked'
    | 'unlockRate';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface ChattersListResponse {
  dateRange: { startDate: string; endDate: string };
  summary: ChattersListSummary;
  meta: PaginationMeta;
  items: ChatterSummaryItem[];
}

export interface ChatterDetailResponse {
  dateRange: { startDate: string; endDate: string };
  chatter: {
    employeeId: number | string;
    name: string;
    status: string;
    createdTime: string | null;
    deletedTime: string | null;
  };
  metrics: {
    totalSales: number;
    ppvSales: number;
    tipsSales: number;
    directMessageSales: number;
    directMessagesSent: number;
    directPpvsSent: number;
    ppvsUnlocked: number;
    unlockRate: number | null;
    goldenRatio: number | null;
    averagePpvSaleValue: number | null;
  };
  assignedCreators: Array<{
    creatorId: string;
    name: string;
    userName: string;
    status: string;
    platformCode: string;
  }>;
  salesByCreator: Array<{
    platformPid: number;
    creatorId: string | null;
    creatorName: string;
    totalSales: number;
    ppvSales: number;
    tipsSales: number;
  }>;
  dailyPerformance: Array<{
    date: string;
    totalSales: number;
    ppvSales: number;
    tipsSales: number;
    directMessagesSent: number;
    directPpvsSent: number;
    ppvsUnlocked: number;
  }>;
}

// ============================================================================
// Earnings & Revenue Types
// ============================================================================

export type RevenueGranularity = 'daily' | 'weekly' | 'monthly';

export interface EarningsQuery extends DateRangeFilter {
  creatorId?: string;
  granularity?: RevenueGranularity;
  page?: number;
  limit?: number;
}

export interface RevenueTimeSeriesPoint {
  period: string;
  gross: number;
  fee: number;
  net: number;
  subscription: number;
  tips: number;
  messages: number;
  other: number;
  transactionCount: number;
}

export interface RevenueCategoryBreakdown {
  category: string;
  gross: number;
  fee: number;
  net: number;
  transactionCount: number;
  percentageOfGross: number;
}

export interface RevenueCreatorBreakdown {
  creatorId: string;
  creatorName: string;
  userName: string;
  gross: number;
  fee: number;
  net: number;
  subscription: number;
  tips: number;
  messages: number;
  other: number;
  transactionCount: number;
  percentageOfGross: number;
}

export interface EarningsResponse {
  dateRange: {
    startDate: string;
    endDate: string;
    granularity: RevenueGranularity;
  };
  creators?: Array<{
    id: string;
    name: string;
    userName: string;
  }>;
  summary: {
    totalGross: number;
    totalFees: number;
    totalNet: number;
    totalRefunds: number;
    netAfterRefunds: number;
    transactionCount: number;
    refundCount: number;
    averageTransactionGross: number | null;
    currency: string;
  };
  timeSeries: RevenueTimeSeriesPoint[];
  byCategory: RevenueCategoryBreakdown[];
  byCreator: RevenueCreatorBreakdown[];
  transactionsMeta?: PaginationMeta;
  recentTransactions: Array<{
    id: string;
    transactionId: string;
    creatorId: string;
    creatorName: string;
    fanId: string;
    fanName: string;
    type: string;
    tipSource: string;
    status: string;
    gross: number;
    fee: number;
    net: number;
    currency: string;
    createdTime: string;
  }>;
}

// ============================================================================
// Marketing & Tracking Links Types
// ============================================================================

export type MarketingLinkType = 'TRACKING' | 'TRIAL' | 'CAMPAIGN';

export interface TrackingLinksQuery extends DateRangeFilter {
  creatorId?: string;
  linkType?: 'ALL' | MarketingLinkType;
  status?: 'ACTIVE' | 'DEACTIVATED';
  search?: string;
  sortBy?:
    | 'grossRevenue'
    | 'netRevenue'
    | 'subscribers'
    | 'clicks'
    | 'conversionRate'
    | 'createdTime';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface MarketingLinkItem {
  id: string;
  linkType: MarketingLinkType;
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
  clicks: number | null;
  subscribers: number;
  payingFansCount: number;
  conversionRate: number | null;
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

export interface MarketingLinksSummary {
  totalLinks: number;
  trackingLinksCount: number;
  trialLinksCount: number;
  campaignsCount: number;
  totalClicks: number;
  trackingSubscribers: number;
  totalNewSubscribers: number;
  trackingConversionRate: number | null;
  totalPayingFans: number;
  totalGrossRevenue: number;
  totalNetRevenue: number;
  promotionCostAvailable: boolean;
  costPerSubscriber: number | null;
  roiPercentage: number | null;
  limitationNote: string;
}

export interface TrackingLinksResponse {
  dateRange: { startDate: string; endDate: string };
  creators?: Array<{
    id: string;
    name: string;
    userName: string;
  }>;
  summary: MarketingLinksSummary;
  meta: PaginationMeta;
  items: MarketingLinkItem[];
}

export interface LinkFansBreakdownResponse {
  creatorId: string;
  linkType: MarketingLinkType;
  linkId: string;
  totalFans: number;
  meta?: PaginationMeta;
  items: Array<{
    id: string;
    fanId: string;
    fanName: string;
    subscriptionGross: number;
    subscriptionNet: number;
    postsGross: number;
    postsNet: number;
    messagesGross: number;
    messagesNet: number;
    streamsGross: number;
    streamsNet: number;
    tipsGross: number;
    tipsNet: number;
    totalGross: number;
    totalNet: number;
    currency: string;
    subscribedTime: string;
  }>;
}
