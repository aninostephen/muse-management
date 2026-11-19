import type {
  ChatterDetailResponse,
  ChattersListQuery,
  ChattersListResponse,
  DateRangeFilter,
} from '../types/api.types';
import { apiClient } from './axios';

export async function fetchChattersList(
  query?: ChattersListQuery,
): Promise<ChattersListResponse> {
  const { data } = await apiClient.get<ChattersListResponse>('/chatters', {
    params: {
      startDate: query?.startDate,
      endDate: query?.endDate,
      search: query?.search || undefined,
      status: query?.status && query.status !== 'all' ? query.status : undefined,
      sortBy: query?.sortBy,
      sortOrder: query?.sortOrder,
      page: query?.page,
      limit: query?.limit,
      refresh: query?.refresh ? 'true' : undefined,
    },
  });
  return data;
}

export async function fetchChatterById(
  employeeId: number | string,
  filter?: DateRangeFilter,
): Promise<ChatterDetailResponse> {
  const { data } = await apiClient.get<ChatterDetailResponse>(
    `/chatters/${encodeURIComponent(String(employeeId))}`,
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
