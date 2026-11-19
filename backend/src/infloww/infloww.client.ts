import {
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { firstValueFrom } from 'rxjs';
import { INFLOWW_ALLOWED_METHODS } from './infloww.constants';

interface CacheEntry<T = unknown> {
  expiresAt: number;
  data: T;
}

@Injectable()
export class InflowwClient implements OnModuleInit {
  private readonly logger = new Logger(InflowwClient.name);
  private readonly cache = new Map<string, CacheEntry>();
  private readonly inFlight = new Map<string, Promise<unknown>>();

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  onModuleInit(): void {
    // Enforce strict read-only guard on the underlying Axios instance
    this.httpService.axiosRef.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const method = (config.method || 'GET').toUpperCase();
        this.assertReadOnlyMethod(method);
        return config;
      },
    );
  }

  /**
   * Throws ForbiddenException if any method other than GET is attempted.
   */
  assertReadOnlyMethod(method: string): void {
    const upper = method.toUpperCase();
    if (
      !INFLOWW_ALLOWED_METHODS.includes(
        upper as (typeof INFLOWW_ALLOWED_METHODS)[number],
      )
    ) {
      throw new ForbiddenException(
        `Infloww API integration is strictly READ-ONLY. HTTP method "${upper}" is prohibited.`,
      );
    }
  }

  /**
   * Serializes query parameters using OpenAPI 3.1 form/explode rules (repeated keys for arrays, no [] brackets).
   */
  serializeParams(params?: Record<string, unknown>): string {
    if (!params) return '';
    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null || value === '') continue;
      if (Array.isArray(value)) {
        for (const item of value) {
          if (item !== undefined && item !== null && item !== '') {
            searchParams.append(key, String(item));
          }
        }
      } else {
        searchParams.append(key, String(value));
      }
    }
    return searchParams.toString();
  }

  /**
   * Clears the in-memory response cache (or entries matching a prefix).
   */
  clearCache(prefix?: string): void {
    if (!prefix) {
      this.cache.clear();
      return;
    }
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Performs a read-only GET request against the Infloww OpenAPI v1.4 server.
   */
  async get<T>(
    endpoint: string,
    params?: Record<string, unknown>,
    options?: { skipCache?: boolean; ttlMs?: number },
  ): Promise<T> {
    this.assertReadOnlyMethod('GET');

    const baseUrl = this.configService.get<string>(
      'infloww.apiUrl',
      'https://openapi.infloww.com/v1',
    );
    const apiKey = this.configService.get<string>('infloww.apiKey', '');
    const agencyOid = this.configService.get<string>('infloww.agencyOid', '');
    const timeoutMs = this.configService.get<number>(
      'infloww.timeoutMs',
      15000,
    );
    const defaultTtlMs = this.configService.get<number>('cacheTtlMs', 60000);

    if (!apiKey || !agencyOid) {
      throw new HttpException(
        {
          message:
            'Infloww API credentials (INFLOWW_API_KEY / INFLOWW_AGENCY_OID) are not configured on the backend.',
        },
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    const normalizedEndpoint = endpoint.startsWith('/')
      ? endpoint
      : `/${endpoint}`;
    const queryString = this.serializeParams(params);
    const fullUrl = `${baseUrl}${normalizedEndpoint}${
      queryString ? `?${queryString}` : ''
    }`;

    const cacheKey = `GET:${fullUrl}`;
    if (!options?.skipCache) {
      const cached = this.cache.get(cacheKey);
      if (cached && cached.expiresAt > Date.now()) {
        return cached.data as T;
      }
      const existingInFlight = this.inFlight.get(cacheKey);
      if (existingInFlight) {
        return (await existingInFlight) as T;
      }
    }

    const requestPromise = (async (): Promise<T> => {
      try {
        const response = await firstValueFrom(
          this.httpService.request<T>({
            method: 'GET',
            url: fullUrl,
            timeout: timeoutMs,
            headers: {
              // Official Infloww OpenAPI v1.4 authentication headers:
              // Raw API key in Authorization (no "Bearer " prefix) + Agency OID in x-oid
              Authorization: apiKey,
              'x-oid': agencyOid,
              Accept: 'application/json',
            },
          }),
        );

        const ttl = options?.ttlMs ?? defaultTtlMs;
        if (ttl > 0) {
          this.cache.set(cacheKey, {
            expiresAt: Date.now() + ttl,
            data: response.data,
          });
        }

        return response.data;
      } catch (err) {
        throw this.normalizeAxiosError(err, normalizedEndpoint);
      } finally {
        this.inFlight.delete(cacheKey);
      }
    })();

    this.inFlight.set(cacheKey, requestPromise);
    return requestPromise;
  }

  private normalizeAxiosError(
    error: unknown,
    endpoint: string,
  ): HttpException {
    if (error instanceof HttpException) {
      return error;
    }

    const axiosErr = error as AxiosError<{ errorMessage?: string }>;
    if (axiosErr?.isAxiosError) {
      const upstreamStatus =
        axiosErr.response?.status || HttpStatus.BAD_GATEWAY;
      const requestId =
        (axiosErr.response?.headers?.['x-request-id'] as string) || null;
      const upstreamMessage =
        typeof axiosErr.response?.data?.errorMessage === 'string'
          ? axiosErr.response.data.errorMessage
          : axiosErr.message || 'Upstream Infloww API request failed';

      this.logger.warn(
        `Infloww API error on GET ${endpoint} [status=${upstreamStatus}, x-request-id=${
          requestId || 'N/A'
        }]: ${upstreamMessage}`,
      );

      return new HttpException(
        {
          message: `Infloww API (${endpoint}): ${upstreamMessage}`,
          details: {
            endpoint,
            upstreamStatus,
            requestId,
          },
        },
        upstreamStatus,
      );
    }

    const fallbackMsg =
      error instanceof Error
        ? error.message
        : 'Unknown error communicating with Infloww API';
    this.logger.error(`Unexpected error on GET ${endpoint}: ${fallbackMsg}`);
    return new HttpException(
      {
        message: `Failed to fetch data from Infloww API (${endpoint})`,
      },
      HttpStatus.BAD_GATEWAY,
    );
  }
}
