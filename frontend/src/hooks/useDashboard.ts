import { useQuery } from '@tanstack/react-query';
import {
  fetchDashboardOverview,
  fetchDashboardPerformance,
  fetchDashboardRevenue,
} from '../api/dashboard.api';
import type { DateRangeFilter, RevenueGranularity } from '../types/api.types';

export const dashboardKeys = {
  all: ['dashboard'] as const,
  overview: (filter?: DateRangeFilter) =>
    ['dashboard', 'overview', filter?.startDate, filter?.endDate] as const,
  revenue: (
    filter?: DateRangeFilter & { granularity?: RevenueGranularity },
  ) =>
    [
      'dashboard',
      'revenue',
      filter?.startDate,
      filter?.endDate,
      filter?.granularity || 'daily',
    ] as const,
  performance: (filter?: DateRangeFilter) =>
    ['dashboard', 'performance', filter?.startDate, filter?.endDate] as const,
};

export function useDashboardOverview(filter?: DateRangeFilter, enabled = true) {
  return useQuery({
    queryKey: dashboardKeys.overview(filter),
    queryFn: () => fetchDashboardOverview(filter),
    enabled,
  });
}

export function useDashboardRevenue(
  filter?: DateRangeFilter & { granularity?: RevenueGranularity },
  enabled = true,
) {
  return useQuery({
    queryKey: dashboardKeys.revenue(filter),
    queryFn: () => fetchDashboardRevenue(filter),
    enabled,
  });
}

export function useDashboardPerformance(
  filter?: DateRangeFilter,
  enabled = true,
) {
  return useQuery({
    queryKey: dashboardKeys.performance(filter),
    queryFn: () => fetchDashboardPerformance(filter),
    enabled,
  });
}
