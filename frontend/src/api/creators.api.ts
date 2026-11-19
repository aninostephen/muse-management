import type {
  CreatorDetailResponse,
  CreatorsListQuery,
  CreatorsListResponse,
  DateRangeFilter,
} from '../types/api.types';
import { apiClient } from './axios';

export async function fetchCreatorsList(
  query?: CreatorsListQuery,
): Promise<CreatorsListResponse> {
  const { data } = await apiClient.get<CreatorsListResponse>('/creators', {
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

export async function fetchCreatorById(
  creatorId: string,
  filter?: DateRangeFilter,
): Promise<CreatorDetailResponse> {
  const { data } = await apiClient.get<CreatorDetailResponse>(
    `/creators/${encodeURIComponent(creatorId)}`,
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
