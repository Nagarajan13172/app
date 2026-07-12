import {
  createApi,
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from '@reduxjs/toolkit/query/react';
import type { RootState } from '@/lib/store';
import { logout } from '@/lib/features/auth/authSlice';
import { API_BASE_URL } from '@/lib/config';

const rawBaseQuery = fetchBaseQuery({
  baseUrl: API_BASE_URL,
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth.token;
    if (token) headers.set('authorization', `Bearer ${token}`);
    return headers;
  },
});

// Wrap the base query so an expired/invalid token (a 401 while we still hold a
// token) logs the user out. A 401 during login/register (no token yet) is left
// for the calling component to display.
const baseQueryWithAuth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  const result = await rawBaseQuery(args, api, extraOptions);
  if (
    result.error?.status === 401 &&
    (api.getState() as RootState).auth.token
  ) {
    api.dispatch(logout());
  }
  return result;
};

// Base API. Concrete endpoints are added via injectEndpoints in feature files
// (authApi.ts, productsApi.ts) so every backend route flows through Redux.
export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithAuth,
  tagTypes: ['Auth', 'Product'],
  endpoints: () => ({}),
});
