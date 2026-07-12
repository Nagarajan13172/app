import { configureStore } from '@reduxjs/toolkit';
import { apiSlice } from '@/lib/api/apiSlice';
import authReducer from '@/lib/features/auth/authSlice';
import { authListenerMiddleware } from '@/lib/features/auth/authListener';

// Register the injected endpoints (and their auto-generated hooks) as a side
// effect of building the store.
import '@/lib/api/authApi';
import '@/lib/api/productsApi';

export const makeStore = () =>
  configureStore({
    reducer: {
      auth: authReducer,
      [apiSlice.reducerPath]: apiSlice.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware()
        .prepend(authListenerMiddleware.middleware)
        .concat(apiSlice.middleware),
  });

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];
