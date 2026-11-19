import { keepPreviousData, useQuery } from '@tanstack/react-query';
import {
  fetchLinkFans,
  fetchTrackingLinks,
} from '../api/tracking-links.api';
import type {
  MarketingLinkType,
  TrackingLinksQuery,
} from '../types/api.types';

export const trackingLinksKeys = {
  all: ['tracking-links'] as const,
  list: (query?: TrackingLinksQuery) =>
    ['tracking-links', 'list', query] as const,
  fans: (params: {
    creatorId: string;
    linkType: MarketingLinkType;
    linkId: string;
    page?: number;
    limit?: number;
  } | null) => ['tracking-links', 'fans', params] as const,
};

export function useTrackingLinks(query?: TrackingLinksQuery, enabled = true) {
  return useQuery({
    queryKey: trackingLinksKeys.list(query),
    queryFn: () => fetchTrackingLinks(query),
    placeholderData: keepPreviousData,
    enabled,
  });
}

export function useLinkFans(
  params: {
    creatorId: string;
    linkType: MarketingLinkType;
    linkId: string;
    page?: number;
    limit?: number;
  } | null,
) {
  return useQuery({
    queryKey: trackingLinksKeys.fans(params),
    queryFn: () => fetchLinkFans(params!),
    placeholderData: keepPreviousData,
    enabled: Boolean(
      params && params.creatorId && params.linkType && params.linkId,
    ),
  });
}
