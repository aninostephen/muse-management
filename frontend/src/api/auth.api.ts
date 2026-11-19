import type {
  AuthMeResponseDto,
  LoginRequestDto,
  LoginResponseDto,
} from '../types/api.types';
import { apiClient } from './axios';

export async function loginApi(
  credentials: LoginRequestDto,
): Promise<LoginResponseDto> {
  const { data } = await apiClient.post<LoginResponseDto>(
    '/auth/login',
    credentials,
  );
  return data;
}

export async function fetchCurrentUserApi(): Promise<AuthMeResponseDto> {
  const { data } = await apiClient.get<AuthMeResponseDto>('/auth/me');
  return data;
}
