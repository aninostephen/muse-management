import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';

export const AUTH_TOKEN_STORAGE_KEY = 'muse_agency_jwt';
export const AUTH_USER_STORAGE_KEY = 'muse_agency_user';
export const AUTH_UNAUTHORIZED_EVENT = 'muse:auth:unauthorized';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

export interface ApiErrorPayload {
  statusCode: number;
  errorMessage: string;
  details?: unknown;
  path?: string;
  timestamp?: string;
}

/**
 * Single reusable Axios instance communicating exclusively with the NestJS backend.
 */
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Request interceptor: automatically attach JWT Bearer token if present
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: unknown) => Promise.reject(error),
);

// Response interceptor: normalize backend errors and handle 401 session expiration
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorPayload>) => {
    const status = error.response?.status ?? 0;
    const isLoginEndpoint = error.config?.url?.includes('/auth/login');

    if (status === 401 && !isLoginEndpoint) {
      localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
      localStorage.removeItem(AUTH_USER_STORAGE_KEY);
      window.dispatchEvent(new CustomEvent(AUTH_UNAUTHORIZED_EVENT));
    }

    const message =
      error.response?.data?.errorMessage ||
      error.message ||
      'An unexpected network error occurred while communicating with the backend server.';

    const normalizedError = new Error(message) as Error & {
      statusCode?: number;
      details?: unknown;
    };
    normalizedError.statusCode = status;
    normalizedError.details = error.response?.data?.details;

    return Promise.reject(normalizedError);
  },
);
