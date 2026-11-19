import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { fetchCreatorById, fetchCreatorsList } from '../api/creators.api';
import type { CreatorsListQuery, DateRangeFilter } from '../types/api.types';

export const creatorsKeys = {
  all: ['creators'] as const,
  list: (query?: CreatorsListQuery) => ['creators', 'list', query] as const,
  detail: (creatorId: string | null, filter?: DateRangeFilter) =>
    [
      'creators',
      'detail',
      creatorId,
      filter?.startDate,
      filter?.endDate,
    ] as const,
};

export function useCreators(query?: CreatorsListQuery, enabled = true) {
  return useQuery({
    queryKey: creatorsKeys.list(query),
    queryFn: () => fetchCreatorsList(query),
    placeholderData: keepPreviousData,
    enabled,
  });
}

export function useCreatorDetail(
  creatorId: string | null,
  filter?: DateRangeFilter,
) {
  return useQuery({
    queryKey: creatorsKeys.detail(creatorId, filter),
    queryFn: () => fetchCreatorById(creatorId!, filter),
    enabled: Boolean(creatorId),
  });
}
