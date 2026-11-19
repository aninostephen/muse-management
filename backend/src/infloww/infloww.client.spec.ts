import { ForbiddenException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { of } from 'rxjs';
import { InflowwClient } from './infloww.client';

describe('InflowwClient (Read-Only & Auth Guardrails)', () => {
  let client: InflowwClient;
  let requestCalls: unknown[];
  let mockResponseData: unknown;

  beforeEach(() => {
    requestCalls = [];
    mockResponseData = { data: { list: [] }, hasMore: false };

    const httpServiceMock = {
      request: (config: unknown) => {
        requestCalls.push(config);
        return of({
          data: mockResponseData,
          status: 200,
        });
      },
      axiosRef: {
        interceptors: {
          request: {
            use: () => 0,
          },
        },
      },
    } as unknown as HttpService;

    const configServiceMock = {
      get: (key: string, defaultVal?: unknown) => {
        const map: Record<string, unknown> = {
          'infloww.apiUrl': 'https://openapi.infloww.com/v1',
          'infloww.apiKey': 'test_raw_api_key_64_chars',
          'infloww.agencyOid': 'test_agency_oid',
          'infloww.timeoutMs': 15000,
          cacheTtlMs: 60000,
        };
        return map[key] ?? defaultVal;
      },
    } as unknown as ConfigService;

    client = new InflowwClient(httpServiceMock, configServiceMock);
  });

  it('allows GET requests and attaches raw Authorization key and x-oid headers', async () => {
    const res = await client.get('/creators', { limit: 10 });
    expect(res).toEqual({ data: { list: [] }, hasMore: false });
    expect(requestCalls).toHaveLength(1);
    expect(requestCalls[0]).toMatchObject({
      method: 'GET',
      url: 'https://openapi.infloww.com/v1/creators?limit=10',
      headers: {
        Authorization: 'test_raw_api_key_64_chars',
        'x-oid': 'test_agency_oid',
        Accept: 'application/json',
      },
    });
  });

  it('strictly blocks POST, PUT, PATCH, and DELETE methods (READ-ONLY enforcement)', () => {
    for (const method of ['POST', 'PUT', 'PATCH', 'DELETE']) {
      expect(() => client.assertReadOnlyMethod(method)).toThrow(
        ForbiddenException,
      );
    }
  });

  it('serializes array query parameters using repeated keys without brackets', () => {
    const qs = client.serializeParams({
      creatorIds: [101, 102],
      startTime: '2026-10-01',
    });
    expect(qs).toBe('creatorIds=101&creatorIds=102&startTime=2026-10-01');
  });

  it('caches GET responses within the TTL window and bypasses cache when skipCache=true', async () => {
    mockResponseData = { data: { list: [{ id: '1' }] } };

    await client.get('/creators');
    await client.get('/creators');
    expect(requestCalls).toHaveLength(1);

    await client.get('/creators', undefined, { skipCache: true });
    expect(requestCalls).toHaveLength(2);
  });

  it('throws 503 SERVICE_UNAVAILABLE if credentials are missing', async () => {
    const emptyConfig = {
      get: (_k: string, def?: unknown) => def ?? '',
    } as unknown as ConfigService;

    const unconfiguredClient = new InflowwClient(
      {} as HttpService,
      emptyConfig,
    );

    await expect(unconfiguredClient.get('/creators')).rejects.toMatchObject({
      status: HttpStatus.SERVICE_UNAVAILABLE,
    });
  });
});
