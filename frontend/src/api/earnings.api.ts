import type { EarningsQuery, EarningsResponse } from '../types/api.types';
import { apiClient } from './axios';

export async function fetchEarnings(
  query?: EarningsQuery,
): Promise<EarningsResponse> {
  const { data } = await apiClient.get<EarningsResponse>('/earnings', {
    params: {
      startDate: query?.startDate,
      endDate: query?.endDate,
      creatorId: query?.creatorId || undefined,
      granularity: query?.granularity || 'daily',
      page: query?.page ?? 1,
      limit: query?.limit ?? 10,
      refresh: query?.refresh ? 'true' : undefined,
    },
  });
  return data;
}
