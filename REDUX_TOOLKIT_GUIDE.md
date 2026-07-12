# Redux Toolkit Guide — Nest App

How this project uses **Redux Toolkit (RTK)**, function by function, grounded in the actual code.

Redux Toolkit is the **backbone** of this app's state. It does two very different jobs, so it helps to see it as **two halves**:

| Half | What it manages | Files |
| --- | --- | --- |
| **RTK core** | Client state that lives only in the browser — *who is logged in* | [store.ts](lib/store.ts), [authSlice.ts](lib/features/auth/authSlice.ts), [authListener.ts](lib/features/auth/authListener.ts) |
| **RTK Query** | Server state — *products, profile* fetched from NestJS | [apiSlice.ts](lib/api/apiSlice.ts), [authApi.ts](lib/api/authApi.ts), [productsApi.ts](lib/api/productsApi.ts) |

> **RTK Query is *part of* Redux Toolkit** — not a separate library. So "we use RTK" here means both halves.

The mental model to hold onto: **RTK core = your own state (auth). RTK Query = the server's state (products/profile).** They connect at exactly one point — `prepareHeaders` reads the token from the auth slice to authenticate every request.

---

## Part A — RTK Core (the store + client state)

### 1. `configureStore` — builds the Redux store

📍 [store.ts:11-21](lib/store.ts#L11-L21)

The one central place where everything is wired together. Replaces the old, verbose `createStore` + manual middleware setup.

```ts
export const makeStore = () =>
  configureStore({
    reducer: {
      auth: authReducer,                        // ← your auth slice
      [apiSlice.reducerPath]: apiSlice.reducer, // ← RTK Query's cache ("api")
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware()
        .prepend(authListenerMiddleware.middleware) // ← side-effect listener
        .concat(apiSlice.middleware),               // ← powers RTK Query caching
  });
```

- **`reducer`** — the shape of global state. Two top-level slices: `state.auth` (your data) and `state.api` (RTK Query's cache).
- **`getDefaultMiddleware`** — RTK ships sensible middleware out of the box (dev-mode checks for accidental mutations, etc.). You `.prepend` the auth listener and `.concat` the RTK Query middleware (which is **required** for caching/refetching to work).
- **Why `makeStore()` is a function** — it's called once per browser session in [providers.tsx:21-24](app/providers.tsx#L21-L24) via a `useRef`, so each user gets a fresh store (important for SSR safety).

The `RootState` / `AppDispatch` types are derived from it at [store.ts:23-25](lib/store.ts#L23-L25) — that's what makes the whole app type-safe.

### 2. `createSlice` — state + actions + reducer, all in one

📍 [authSlice.ts:21-50](lib/features/auth/authSlice.ts#L21-L50)

The heart of RTK core. In old Redux you'd write action types, action creators, and a reducer in three separate places. `createSlice` generates **all three from one object**.

```ts
const authSlice = createSlice({
  name: 'auth',                    // prefix for generated action types
  initialState,                    // { user, token, isAuthenticated, isInitialized }
  reducers: {
    setCredentials: (state, action) => {   // called after login/register
      state.user = action.payload.user;
      state.token = action.payload.accessToken;
      state.isAuthenticated = true;
      state.isInitialized = true;
    },
    hydrate: (state, action) => { ... },    // rehydrate from storage on startup
    logout: (state) => { ... },             // clear the session
  },
});
```

Three things to notice:

- **You "mutate" `state` directly** (`state.user = ...`). That looks illegal in Redux, but RTK uses **Immer** under the hood to turn your mutations into safe immutable updates. A big RTK convenience.
- **It auto-generates action creators.** [authSlice.ts:52](lib/features/auth/authSlice.ts#L52) exports them: `export const { setCredentials, hydrate, logout } = authSlice.actions;` — you never wrote those functions, `createSlice` did.
- **`PayloadAction<T>`** — an RTK type that types `action.payload`. So `setCredentials(data)` knows `data` must be `AuthData`.

**Selectors** live at the bottom ([authSlice.ts:55-59](lib/features/auth/authSlice.ts#L55-L59)) — small functions like `selectCurrentUser = (state) => state.auth.user` that components use to read state.

**Where these actions get dispatched:**
- `setCredentials` → [login/page.tsx:75](app/login/page.tsx#L75) and the register page, after a successful API call
- `hydrate` → [providers.tsx:34](app/providers.tsx#L34), on startup to restore the session
- `logout` → [AppShell.tsx](components/AppShell.tsx), [AuthGuard.tsx](components/AuthGuard.tsx), and automatically in [apiSlice.ts:34](lib/api/apiSlice.ts#L34) on a 401

### 3. `createListenerMiddleware` — run side-effects when an action fires

📍 [authListener.ts:7-21](lib/features/auth/authListener.ts#L7-L21)

Reducers must be **pure** (no `localStorage`, no network). But you *do* want to write to storage when the user logs in/out. The listener middleware is RTK's official way to react to actions with side-effects:

```ts
export const authListenerMiddleware = createListenerMiddleware();

authListenerMiddleware.startListening({
  actionCreator: setCredentials,           // when THIS action is dispatched...
  effect: (action) => {
    persistAuth(action.payload.accessToken, action.payload.user); // ...do this
  },
});

authListenerMiddleware.startListening({
  actionCreator: logout,
  effect: () => { clearAuth(); },
});
```

Clean separation: **component dispatches `setCredentials` → reducer updates state (pure) → listener writes to localStorage + cookie (side-effect)**. The reducer never touches storage.

---

## Part B — RTK Query (all server communication)

RTK Query is why you barely see `useEffect` + `fetch` anywhere. It's a data-fetching + caching layer built into RTK.

### 4. `createApi` — defines the "API slice" (one per app)

📍 [apiSlice.ts:41-46](lib/api/apiSlice.ts#L41-L46)

The central definition of *how* to talk to your backend.

```ts
export const apiSlice = createApi({
  reducerPath: 'api',              // where the cache lives in state (state.api)
  baseQuery: baseQueryWithAuth,    // how every request is made (see #5)
  tagTypes: ['Auth', 'Product'],   // labels for cache invalidation (see #8)
  endpoints: () => ({}),           // empty here — endpoints are injected later (see #6)
});
```

### 5. `fetchBaseQuery` + `prepareHeaders` — the configured fetch

📍 [apiSlice.ts:12-19](lib/api/apiSlice.ts#L12-L19)

`fetchBaseQuery` is a tiny wrapper around the browser `fetch`. `prepareHeaders` is where the **Bearer token gets attached to every request automatically** — you never manually set the auth header anywhere:

```ts
const rawBaseQuery = fetchBaseQuery({
  baseUrl: API_BASE_URL,                        // http://localhost:3000/api
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth.token; // reads your auth slice!
    if (token) headers.set('authorization', `Bearer ${token}`);
    return headers;
  },
});
```

This is the glue between Part A and Part B: RTK Query reads the token *from your auth slice*.

**The custom wrapper** `baseQueryWithAuth` ([apiSlice.ts:24-37](lib/api/apiSlice.ts#L24-L37)) adds one rule: if a request returns **401 while you hold a token**, auto-dispatch `logout()`. So an expired session logs you out cleanly, everywhere, without any component knowing about it.

### 6. `injectEndpoints` — add endpoints to the API slice

📍 [authApi.ts:10](lib/api/authApi.ts#L10) and [productsApi.ts:13](lib/api/productsApi.ts#L13)

Instead of defining every endpoint inside `createApi`, this project *injects* them from feature files. This keeps auth endpoints and product endpoints in separate files while sharing one cache. (They're imported in [store.ts:8-9](lib/store.ts#L8-L9) purely so this injection runs.)

### 7. `builder.query` vs `builder.mutation` — the two endpoint types

The core distinction in RTK Query:

| | `builder.query` | `builder.mutation` |
| --- | --- | --- |
| For | **reading** data (GET) | **changing** data (POST/PATCH/DELETE) |
| Runs | automatically when the component mounts | only when you call a trigger function |
| Example | `getProfile`, `listProducts`, `getProduct` | `login`, `register`, `createProduct`, `deleteProduct` |

```ts
// A QUERY — reads. authApi.ts:25
getProfile: builder.query<ProfileData, void>({
  query: () => ({ url: '/auth/profile', method: 'GET' }),
  transformResponse: (response) => response.data,  // see #9
  providesTags: ['Auth'],                          // see #8
}),

// A MUTATION — writes. authApi.ts:13
login: builder.mutation<AuthData, LoginRequest>({
  query: (body) => ({ url: '/auth/login', method: 'POST', body }),
  transformResponse: (response) => response.data,
  invalidatesTags: ['Auth'],                       // see #8
}),
```

### 8. `tagTypes` / `providesTags` / `invalidatesTags` — automatic cache invalidation

RTK Query's superpower. Tags let a *write* automatically refresh the right *reads*.

- A **query** `providesTags` — "my cached data is labeled with this tag."
- A **mutation** `invalidatesTags` — "when I succeed, throw away anything with this tag (refetch it)."

Concrete example from products:

```ts
// listProducts PROVIDES a 'LIST' tag (productsApi.ts:24-33)
providesTags: (result) => [ ...result.items.map(p => ({ type: 'Product', id: p._id })),
                            { type: 'Product', id: 'LIST' } ]

// createProduct INVALIDATES 'LIST' (productsApi.ts:45)
invalidatesTags: [{ type: 'Product', id: 'LIST' }]
```

So when an admin creates a product, RTK Query sees the `LIST` tag was invalidated and **automatically refetches the product list** — the new product appears with zero manual refetch code. `deleteProduct` and `updateProduct` invalidate both the specific `id` *and* `LIST` ([productsApi.ts:51-54, 72-75](lib/api/productsApi.ts#L51-L54)).

### 9. `transformResponse` — reshape the response

📍 every endpoint

Your backend wraps everything as `{ success, message, data }`. `transformResponse` unwraps it so components receive clean `data`:

```ts
transformResponse: (response: ApiResponse<AuthData>) => response.data,
```

Without this, every component would have to write `response.data.user` instead of `response.user`.

### 10. Auto-generated hooks — how components actually use all this

📍 [authApi.ts:33](lib/api/authApi.ts#L33), [productsApi.ts:91-100](lib/api/productsApi.ts#L91-L100)

For every endpoint, RTK Query **generates a React hook** (naming: `use` + endpoint + `Query`/`Mutation`). You export and use them:

```ts
// A query hook gives you data + loading + error, and fetches on mount:
const { data, isLoading, isFetching, error, refetch } = useListProductsQuery(filter);

// A mutation hook gives you a trigger function + status:
const [login, { isLoading, error }] = useLoginMutation();
const data = await login({ email, password }).unwrap();  // .unwrap() throws on error
```

`.unwrap()` (used in [login/page.tsx:74](app/login/page.tsx#L74)) turns the result into a normal promise you can `try/catch`.

### 11. `setupListeners` — refetch on focus/reconnect

📍 [providers.tsx:29](app/providers.tsx#L29)

One line that enables "refetch when the user tabs back to the window or regains a network connection." An optional quality-of-life feature from RTK Query.

---

## How it all flows together (login example)

```
User submits login form
   │
   ▼
useLoginMutation()  ──►  RTK Query builds POST /auth/login            (RTK Query)
   │                        └─ fetchBaseQuery sends it, transformResponse unwraps `data`
   ▼
dispatch(setCredentials(data))                                        (RTK core — createSlice reducer)
   │   ├─► reducer updates state.auth                                 (pure, via Immer)
   │   └─► authListener fires → persistAuth() writes localStorage + cookie   (listener middleware)
   ▼
Later: any component reads useAppSelector(selectCurrentUser)          (react-redux + selector)
   │
   ▼
Next API call: prepareHeaders reads state.auth.token → attaches Bearer  (RTK Query ↔ auth slice glue)
```

---

## Cheat sheet — every RTK function in this project

| Function | Half | Job | Where |
| --- | --- | --- | --- |
| `configureStore` | core | Build the store | [store.ts:12](lib/store.ts#L12) |
| `createSlice` | core | Auth state + actions + reducer | [authSlice.ts:21](lib/features/auth/authSlice.ts#L21) |
| `PayloadAction` | core | Type the action payload | authSlice.ts |
| `createListenerMiddleware` | core | Side-effects on action (persist storage) | [authListener.ts:7](lib/features/auth/authListener.ts#L7) |
| `createApi` | RTK Query | Define the API slice | [apiSlice.ts:41](lib/api/apiSlice.ts#L41) |
| `fetchBaseQuery` | RTK Query | Configured fetch + auth header | [apiSlice.ts:12](lib/api/apiSlice.ts#L12) |
| `injectEndpoints` | RTK Query | Add endpoints from feature files | [authApi.ts:10](lib/api/authApi.ts#L10) |
| `builder.query` | RTK Query | Read endpoints (GET) | authApi / productsApi |
| `builder.mutation` | RTK Query | Write endpoints (POST/PATCH/DELETE) | authApi / productsApi |
| `providesTags` / `invalidatesTags` / `tagTypes` | RTK Query | Auto cache invalidation | productsApi.ts |
| `transformResponse` | RTK Query | Unwrap `{success,message,data}` | every endpoint |
| auto hooks (`useLoginMutation`…) | RTK Query | Use endpoints in components | throughout |
| `setupListeners` | RTK Query | Refetch on focus/reconnect | [providers.tsx:29](app/providers.tsx#L29) |

*(Plus `useAppSelector` / `useAppDispatch` in [hooks.ts](lib/hooks.ts) — those come from **react-redux**, the React bindings, not RTK itself, but they're how components touch the store.)*
