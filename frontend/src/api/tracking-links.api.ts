import type {
  LinkFansBreakdownResponse,
  MarketingLinkType,
  TrackingLinksQuery,
  TrackingLinksResponse,
} from '../types/api.types';
import { apiClient } from './axios';

export async function fetchTrackingLinks(
  query?: TrackingLinksQuery,
): Promise<TrackingLinksResponse> {
  const { data } = await apiClient.get<TrackingLinksResponse>(
    '/tracking-links',
    {
      params: {
        startDate: query?.startDate,
        endDate: query?.endDate,
        creatorId: query?.creatorId || undefined,
        linkType: query?.linkType || 'ALL',
        status: query?.status || undefined,
        search: query?.search || undefined,
        sortBy: query?.sortBy,
        sortOrder: query?.sortOrder,
        page: query?.page ?? 1,
        limit: query?.limit ?? 10,
        refresh: query?.refresh ? 'true' : undefined,
      },
    },
  );
  return data;
}

export async function fetchLinkFans(params: {
  creatorId: string;
  linkType: MarketingLinkType;
  linkId: string;
  page?: number;
  limit?: number;
}): Promise<LinkFansBreakdownResponse> {
  const { data } = await apiClient.get<LinkFansBreakdownResponse>(
    '/tracking-links/fans',
    {
      params: {
        ...params,
        page: params.page ?? 1,
        limit: params.limit ?? 10,
      },
    },
  );
  return data;
}
