import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { fetchChatterById, fetchChattersList } from '../api/chatters.api';
import type { ChattersListQuery, DateRangeFilter } from '../types/api.types';

export const chattersKeys = {
  all: ['chatters'] as const,
  list: (query?: ChattersListQuery) => ['chatters', 'list', query] as const,
  detail: (employeeId: number | string | null, filter?: DateRangeFilter) =>
    [
      'chatters',
      'detail',
      employeeId,
      filter?.startDate,
      filter?.endDate,
    ] as const,
};

export function useChatters(query?: ChattersListQuery, enabled = true) {
  return useQuery({
    queryKey: chattersKeys.list(query),
    queryFn: () => fetchChattersList(query),
    placeholderData: keepPreviousData,
    enabled,
  });
}

export function useChatterDetail(
  employeeId: number | string | null,
  filter?: DateRangeFilter,
) {
  return useQuery({
    queryKey: chattersKeys.detail(employeeId, filter),
    queryFn: () => fetchChatterById(employeeId!, filter),
    enabled: employeeId !== null && employeeId !== undefined && employeeId !== '',
  });
}
