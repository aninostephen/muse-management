import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { fetchEarnings } from '../api/earnings.api';
import type { EarningsQuery } from '../types/api.types';

export const earningsKeys = {
  all: ['earnings'] as const,
  analytics: (query?: EarningsQuery) => ['earnings', 'analytics', query] as const,
};

export function useEarnings(query?: EarningsQuery, enabled = true) {
  return useQuery({
    queryKey: earningsKeys.analytics(query),
    queryFn: () => fetchEarnings(query),
    placeholderData: keepPreviousData,
    enabled,
  });
}
