export const INFLOWW_DEFAULT_PLATFORM = 'OnlyFans' as const;

export const INFLOWW_MAX_PAGE_LIMIT = 100;
export const INFLOWW_MAX_BATCH_IDS = 10;
export const INFLOWW_MAX_PAGES_PER_QUERY = 25;

export const INFLOWW_ALLOWED_METHODS = ['GET'] as const;

/**
 * Verified Infloww OpenAPI v1.4 endpoints relative to INFLOWW_API_URL (https://openapi.infloww.com/v1)
 */
export const INFLOWW_ENDPOINTS = {
  // Creator Scope — Profiles & Status
  CONNECTED_CREATORS: '/creators',
  ALL_CREATORS: '/all-creators',
  CREATOR_STATUS_CHANGE_LOG: '/creator/status-change-log',

  // Creator Scope — Transactions, Refunds & Attribution
  TRANSACTIONS: '/transactions',
  REFUNDS: '/refunds',
  TRANSACTION_PERF_DETAILS: '/transaction-perf/details',

  // Creator Scope — Marketing & Links
  LINKS: '/links',
  LINK_FANS: '/linkfans',

  // Creator Scope — Daily Reports (up to 10 creatorIds per call, YYYY-MM-DD)
  CREATOR_CHAT_SUMMARY: '/creator-report/chat-summary',
  CREATOR_FANS_COUNT: '/creator-report/fans/count',
  CREATOR_SUBSCRIBER_COUNT: '/creator-report/fans/subscriber-count',
  CREATOR_FANS_RENEW_ON: '/creator-report/fans/renew-on',
  CREATOR_AVG_SUBSCRIPTION_LENGTH: '/creator-report/fans/avg-subscription-length',
  CREATOR_PROFILE_VISITOR_COUNT: '/creator-report/reach/profile-visitor-count',
  CREATOR_RANK: '/creator-report/rank',

  // Creator Scope — Messaging & Scripts
  AUTOMATED_MESSAGES: '/automated-messages',
  PRIORITY_MASS_MESSAGES: '/priority-mass-messages',
  SCRIPTS: '/scripts',
  SCRIPT_STATISTICS: '/script/statistics',
  SCRIPT_TAGS: '/script-tag',
  SCRIPT_TAG_STATISTICS: '/script-tag/statistics',
  SCRIPT_SEQUENCES: '/script-sequence',
  SCRIPT_SEQUENCE_STATISTICS: '/script-sequence/statistics',

  // Employee Scope
  EMPLOYEES: '/employees',
  EMPLOYEE_ASSIGNED_CREATORS: '/employees/assigned-creators',
  EMPLOYEE_SALES_SUMMARY: '/employee-report/employee-sales-summary',
  EMPLOYEE_CHAT_SUMMARY: '/employee-report/employee-chat-summary',

  // Organization Scope
  MONTHLY_BILLING: '/invoice-data/monthly-billing',
  MANUAL_ASSIGNMENT_DETAILS: '/transaction-perf/manual-assignment/details',
} as const;
