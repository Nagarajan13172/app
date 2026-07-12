import { apiSlice } from './apiSlice';
import type {
  ApiResponse,
  AuthData,
  LoginRequest,
  RegisterRequest,
  ProfileData,
} from '@/lib/types/api';

export const authApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // POST /api/auth/login
    login: builder.mutation<AuthData, LoginRequest>({
      query: (body) => ({ url: '/auth/login', method: 'POST', body }),
      transformResponse: (response: ApiResponse<AuthData>) => response.data,
      invalidatesTags: ['Auth'],
    }),
    // POST /api/auth/register
    register: builder.mutation<AuthData, RegisterRequest>({
      query: (body) => ({ url: '/auth/register', method: 'POST', body }),
      transformResponse: (response: ApiResponse<AuthData>) => response.data,
      invalidatesTags: ['Auth'],
    }),
    // GET /api/auth/profile (requires Bearer token)
    getProfile: builder.query<ProfileData, void>({
      query: () => ({ url: '/auth/profile', method: 'GET' }),
      transformResponse: (response: ApiResponse<ProfileData>) => response.data,
      providesTags: ['Auth'],
    }),
  }),
});

export const { useLoginMutation, useRegisterMutation, useGetProfileQuery } =
  authApi;
