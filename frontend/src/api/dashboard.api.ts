import type {
  DashboardOverviewResponse,
  DashboardPerformanceResponse,
  DateRangeFilter,
  EarningsResponse,
  RevenueGranularity,
} from '../types/api.types';
import { apiClient } from './axios';

export async function fetchDashboardOverview(
  filter?: DateRangeFilter,
): Promise<DashboardOverviewResponse> {
  const { data } = await apiClient.get<DashboardOverviewResponse>(
    '/dashboard/overview',
    {
      params: {
        startDate: filter?.startDate,
        endDate: filter?.endDate,
        refresh: filter?.refresh ? 'true' : undefined,
      },
    },
  );
  return data;
}

export async function fetchDashboardRevenue(
  filter?: DateRangeFilter & { granularity?: RevenueGranularity },
): Promise<EarningsResponse> {
  const { data } = await apiClient.get<EarningsResponse>(
    '/dashboard/revenue',
    {
      params: {
        startDate: filter?.startDate,
        endDate: filter?.endDate,
        granularity: filter?.granularity || 'daily',
        refresh: filter?.refresh ? 'true' : undefined,
      },
    },
  );
  return data;
}

export async function fetchDashboardPerformance(
  filter?: DateRangeFilter,
): Promise<DashboardPerformanceResponse> {
  const { data } = await apiClient.get<DashboardPerformanceResponse>(
    '/dashboard/performance',
    {
      params: {
        startDate: filter?.startDate,
        endDate: filter?.endDate,
        refresh: filter?.refresh ? 'true' : undefined,
      },
    },
  );
  return data;
}
