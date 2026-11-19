export type InflowwCreatorStatus =
  | 'connected'
  | 'disconnected'
  | 'not connect'
  | '2FA'
  | 'deleted'
  | string;

export type InflowwTransactionType =
  | 'Subscription'
  | 'Recurring Subscription'
  | 'RecurringSubscription'
  | 'Tips'
  | 'Messages'
  | 'Referrals'
  | 'Streams'
  | 'Posts'
  | 'Unknown'
  | string;

export type InflowwTipSource =
  | 'Profile'
  | 'Post'
  | 'Chat'
  | 'Stream'
  | 'Story'
  | 'Unknown'
  | string;

export type InflowwTransactionStatus =
  | 'loading'
  | 'done'
  | 'undo'
  | 'pending_return'
  | string;

export type InflowwSalesRule =
  | 'Unassigned'
  | 'Message sender'
  | 'Last chatter'
  | 'Employee on shift'
  | 'Manually reassigned'
  | string;

export type InflowwEmployeeStatus =
  | 'Activated'
  | 'Deactivated'
  | 'Deleted'
  | string;

export type InflowwLinkType = 'CAMPAIGN' | 'TRIAL' | 'TRACKING';
export type InflowwLinkStatus = 'ACTIVE' | 'DEACTIVATED';

export interface InflowwPaginatedResponse<TItem> {
  data?: {
    list?: TItem[];
    platformCode?: string;
    linkType?: string;
  } | null;
  cursor?: string | number | null;
  hasMore?: boolean;
  errorMessage?: string | null;
}

export interface InflowwReportResponse<TItem> {
  data?: {
    list?: TItem[];
    platformCode?: string;
  } | null;
  errorMessage?: string | null;
}

export interface InflowwCreatorItem {
  id: string | number;
  name: string;
  nickName?: string;
  userName?: string;
  tagName?: string;
  status?: InflowwCreatorStatus;
  platformPid?: number;
  createdTime?: string;
  deletedTime?: string | null;
}

export interface InflowwTransactionItem {
  id: string | number;
  transactionId: string;
  fanId: string;
  fanName: string;
  platformPid?: number;
  createdTime: string;
  tipSource?: InflowwTipSource;
  type: InflowwTransactionType;
  status: InflowwTransactionStatus;
  amount: string | number; // In cents (smallest currency unit)
  fee: string | number; // In cents
  net: string | number; // In cents
  currency: string;
}

export interface InflowwRefundItem {
  id: string | number;
  transactionId: string;
  fanId: string;
  paymentTime: string;
  refundTime?: string | null;
  paymentStatus: 'undo' | 'loading' | 'done' | string;
  paymentAmount: number | string; // In cents
  transactionType:
    | 'tips'
    | 'post'
    | 'chat_messages'
    | 'stream'
    | 'subscribes'
    | string;
  currency: string;
}

export interface InflowwTransactionPerfItem {
  id: number;
  transactionId: string;
  platformPid?: number;
  fanId: string;
  fanName: string;
  createdTime: string;
  type: InflowwTransactionType;
  tipSource?: InflowwTipSource;
  status: InflowwTransactionStatus;
  amount: number; // In cents
  fee: number; // In cents
  net: number; // In cents
  salesRule: InflowwSalesRule;
  attributeEmployeeId?: number | null;
  salesAmount: number; // In cents
  currency: string;
}

export interface InflowwFansCountReportItem {
  platformPid: number;
  date: string; // YYYY-MM-DD
  activeFans: number;
  expiredFans: number;
}

export interface InflowwSubscriberCountReportItem {
  platformPid: number;
  date: string; // YYYY-MM-DD
  newSubscribers: number;
  subscriberRenewals: number;
}

export interface InflowwFansRenewOnReportItem {
  platformPid: number;
  date: string; // YYYY-MM-DD
  fansWithRenewOn: number;
}

export interface InflowwAvgSubLengthReportItem {
  platformPid: number;
  date: string; // YYYY-MM-DD
  avgSubscriptionLength: number; // In days
}

export interface InflowwProfileVisitorReportItem {
  platformPid: number;
  date: string; // YYYY-MM-DD
  profileVisitors: number;
  guestProfileVisitors: number;
  loggedInUsersProfileVisitors: number;
}

export interface InflowwCreatorRankReportItem {
  platformPid: number;
  date: string; // YYYY-MM-DD
  performanceRank: number;
}

export interface InflowwCreatorChatSummaryItem {
  platformPid: number;
  replyTime: number; // In milliseconds
  fansChatted: number;
  messagesSent: number;
  ppvsSent: number;
}

export interface InflowwEmployeeItem {
  employeeId: number;
  employeeName: string;
  status: InflowwEmployeeStatus;
  createdTime?: string;
  deletedTime?: string | null;
}

export interface InflowwAssignedCreatorItem {
  platformCode: string;
  employeeId: number;
  creatorId: number;
}

export interface InflowwEmployeeSalesSummaryItem {
  employeeId: number;
  date: string; // YYYY-MM-DD
  platformPid: number;
  salesAmount: number; // In cents
  ppvSalesAmount: number; // In cents
  tipsSalesAmount: number; // In cents
  directMessageSalesAmount: number; // In cents
  priorityMassMessageSalesAmount: number; // In cents
  massMessageSalesAmount: number; // In cents
  currency: string;
}

export interface InflowwEmployeeChatSummaryItem {
  employeeId: number;
  date: string; // YYYY-MM-DD
  platformPid: number;
  directMessagesSent: number;
  directPpvsSent: number;
  goldenRatio: string; // Percentage string
  ppvsUnlocked: number;
  unlockRate: string; // Percentage string
  fansChatted: number;
  characterCount: number;
  responseTimeBasedOnScheduledHours?: number | null; // ms
  responseTimeBasedOnClockedHours?: number | null; // ms
}

export interface InflowwCampaignLinkItem {
  id: string;
  message?: string;
  type?: 'new' | 'expired' | 'both' | string;
  subCount: number;
  subLimit?: number;
  subDuration?: number;
  discount?: number;
  finishedFlag?: boolean;
  earningsGross: number; // In cents
  earningsNet: number; // In cents
  payingFansCount: number;
  currency: string;
  createdTime?: string;
  expiredTime?: string;
  updatedTime?: string;
}

export interface InflowwTrialLinkItem {
  id: string;
  name?: string;
  code?: string;
  subDuration?: number;
  subLimit?: number;
  subCount: number;
  finishedFlag?: boolean;
  source?: string;
  autoDefaultList?: boolean;
  defaultListName?: string;
  relTagNames?: string[];
  spendClaim?: string;
  payingFansCount: number;
  earningsGross: number; // In cents
  earningsNet: number; // In cents
  aepsGross?: number; // In cents
  aepsNet?: number; // In cents
  currency: string;
  createdTime?: string;
  expiredTime?: string;
  updatedTime?: string;
}

export interface InflowwTrackingLinkItem {
  id: string;
  name?: string;
  code?: string;
  clickCount: number;
  subCount: number;
  finishedFlag?: boolean;
  source?: string;
  autoDefaultList?: boolean;
  defaultListName?: string;
  relTagNames?: string[];
  earningsGross: number; // In cents
  earningsNet: number; // In cents
  payingFansCount: number;
  subscriptionCVR?: string;
  spendingCVR?: string;
  epcGross?: number; // In cents
  epcNet?: number; // In cents
  aepsGross?: number; // In cents
  aepsNet?: number; // In cents
  currency: string;
  createdTime?: string;
  expiredTime?: string;
  updatedTime?: string;
}

export type InflowwAnyLinkItem =
  | InflowwCampaignLinkItem
  | InflowwTrialLinkItem
  | InflowwTrackingLinkItem;

export interface InflowwLinkFanItem {
  id: string;
  fanId: string;
  fanName: string;
  subscriptionEarningGross: number; // In cents
  subscriptionEarningNet: number; // In cents
  postsEarningGross: number; // In cents
  postsEarningNet: number; // In cents
  messagesEarningGross: number; // In cents
  messagesEarningNet: number; // In cents
  streamsEarningGross: number; // In cents
  streamsEarningNet: number; // In cents
  tipsEarningGross: number; // In cents
  tipsEarningNet: number; // In cents
  currency: string;
  subscribedTime: string;
}
