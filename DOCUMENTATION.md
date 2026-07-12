# Nest App — Frontend Documentation

A Next.js 16 frontend that provides authentication and a full product-catalog CRUD experience on top of a **NestJS** backend. Built with the App Router, Material UI, and Redux Toolkit (with RTK Query for all server communication).

> **Note on Next.js version:** This project runs **Next.js 16.2.10 / React 19**, which introduces breaking changes from older Next.js (most visibly, `middleware.ts` is now `proxy.ts`). When editing, consult the guides bundled in `node_modules/next/dist/docs/` rather than relying on older Next.js knowledge.

---

## 1. What this app does

| Area | Capability |
| --- | --- |
| **Auth** | Register, log in, and log out. Session persists across reloads. |
| **Route protection** | Optimistic server-side redirect (via `proxy.ts`) + authoritative client-side guard (`AuthGuard`). |
| **Dashboard** | Shows the signed-in user's profile, fetched from a protected endpoint. |
| **Products (browse)** | Paginated, searchable, filterable, sortable product catalog with **table** and **grid** views. Available to every signed-in user. |
| **Products (manage)** | Create / edit / delete products, including multi-image upload. **Admin-only** — controls only render for users with `role === 'admin'`. |
| **Product detail** | Full product page with an image gallery and (for admins) edit/delete actions. |

The frontend is a pure client of the backend: it holds **no database**. Everything is fetched from the NestJS API and cached in Redux.

---

## 2. Tech stack

| Concern | Choice | Notes |
| --- | --- | --- |
| Framework | **Next.js 16** (App Router) | Runs on **port 3001** (`next dev -p 3001`). |
| UI runtime | **React 19** | |
| Component library | **Material UI (MUI) v9** + `@mui/icons-material` | Emotion-based styling. |
| SSR styling | `@mui/material-nextjs` | `AppRouterCacheProvider` for flash-free server-rendered MUI. |
| State management | **Redux Toolkit** + **react-redux** | Store created per-session in the client. |
| Data fetching | **RTK Query** (`@reduxjs/toolkit/query`) | All HTTP goes through one API slice; auto-generated hooks + caching. |
| Fonts | `next/font` — **Geist** & Geist Mono | Exposed as CSS variables. |
| Utility CSS | Tailwind CSS v4 | Present but minimal; MUI's `CssBaseline` owns global resets. |
| Language | **TypeScript** (strict) | Path alias `@/*` → project root. |

### Backend pairing
The API is a **NestJS** service expected at `http://localhost:3000/api` (configurable via `NEXT_PUBLIC_API_BASE_URL`). Because the backend uses port 3000, this frontend deliberately runs on **3001**.

---

## 3. Getting started

```bash
# 1. Install dependencies
npm install

# 2. Ensure the NestJS backend is running on :3000
#    (see the ../Nest-backend project)

# 3. Start the dev server (http://localhost:3001)
npm run dev
```

### Scripts (`package.json`)

| Script | Command | Purpose |
| --- | --- | --- |
| `dev` | `next dev -p 3001` | Local development on port 3001. |
| `build` | `next build` | Production build. |
| `start` | `next start -p 3001` | Serve the production build. |
| `lint` | `eslint` | Lint the codebase. |

### Environment (`.env.local`)

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000/api
```

`NEXT_PUBLIC_`-prefixed variables are **inlined into the client bundle at build time**, so they must be referenced as static literals (see `lib/config.ts`). If unset, the app falls back to `http://localhost:3000/api`.

---

## 4. Folder structure

```
my-app/
├── app/                          # Next.js App Router: routes, layouts, pages
│   ├── layout.tsx                # Root layout (Server Component): fonts + MUI cache + Providers
│   ├── providers.tsx             # Client boundary: Redux store + MUI theme + auth rehydration
│   ├── page.tsx                  # "/" — redirects to /dashboard or /login
│   ├── globals.css               # Tailwind import + CSS variables
│   │
│   ├── login/page.tsx            # "/login" — sign-in form
│   ├── register/page.tsx         # "/register" — sign-up form
│   │
│   └── (app)/                    # Route GROUP for authenticated pages (no URL segment)
│       ├── layout.tsx            # Wraps children in AuthGuard + AppShell
│       ├── dashboard/page.tsx    # "/dashboard" — user profile
│       └── products/
│           ├── page.tsx          # "/products" — catalog (list/filter/sort/paginate)
│           └── [id]/page.tsx     # "/products/:id" — product detail
│
├── components/                   # Reusable React components
│   ├── AppShell.tsx              # Top nav bar + user menu for authed pages
│   ├── AuthGuard.tsx             # Client-side auth gate
│   ├── auth/
│   │   ├── AuthShell.tsx         # Split-screen layout for login/register
│   │   └── PasswordField.tsx     # Password input with show/hide toggle
│   └── products/
│       ├── ProductsTable.tsx     # Table view (sortable columns)
│       ├── ProductCard.tsx       # Grid-view card
│       ├── ProductFormDialog.tsx # Create/edit dialog with image upload
│       └── ConfirmDialog.tsx     # Generic confirm/cancel dialog
│
├── lib/                          # Non-UI logic: state, API, helpers
│   ├── store.ts                  # Redux store factory + typed RootState/AppDispatch
│   ├── hooks.ts                  # Pre-typed useAppDispatch / useAppSelector / useAppStore
│   ├── config.ts                 # API base URL + asset URL resolver
│   ├── theme.ts                  # MUI theme
│   ├── format.ts                 # Price/date formatters
│   │
│   ├── api/                      # RTK Query — all server communication
│   │   ├── apiSlice.ts           # Base API: baseQuery, auth header, 401 handling, tags
│   │   ├── authApi.ts            # login / register / profile endpoints
│   │   ├── productsApi.ts        # products CRUD + image upload + mail endpoints
│   │   └── parseError.ts         # Normalizes any RTK Query error into a message
│   │
│   ├── auth/
│   │   └── token.ts              # localStorage + cookie read/write for the token & user
│   │
│   ├── features/auth/
│   │   ├── authSlice.ts          # Auth reducer, actions, selectors
│   │   └── authListener.ts       # Side-effect middleware: persist/clear storage
│   │
│   ├── products/
│   │   └── filterStorage.ts      # Persist product filters to sessionStorage
│   │
│   └── types/
│       └── api.ts                # TypeScript contract mirroring the NestJS API
│
├── proxy.ts                      # Next 16 "proxy" (formerly middleware): optimistic route guard
├── next.config.ts                # Next.js config (currently default)
├── tsconfig.json                 # TS config (@/* path alias, strict mode)
├── .env.local                    # NEXT_PUBLIC_API_BASE_URL
├── AGENTS.md / CLAUDE.md         # Instructions for AI agents working in this repo
└── public/                       # Static SVG assets
```

### Two key conventions

- **`(app)` route group** — the parentheses mean the folder name does **not** appear in the URL. It exists purely to apply one shared layout (`AuthGuard` + `AppShell`) to every page inside it. So `app/(app)/dashboard/page.tsx` serves `/dashboard`, not `/app/dashboard`.
- **`@/` path alias** — imports like `@/lib/store` resolve from the project root (configured in `tsconfig.json`).

---

## 5. Architecture

### 5.1 The provider tree

Rendering flows from a **Server Component** root into a single **Client Component** boundary:

```
app/layout.tsx  (Server Component)
  └─ AppRouterCacheProvider        ← MUI Emotion SSR cache (no style flash)
       └─ Providers  (Client Component — "use client")
            ├─ Redux <Provider>    ← store created once per browser session
            └─ MUI <ThemeProvider> + <CssBaseline>
                 └─ {page content}
```

- **`app/layout.tsx`** stays a Server Component (loads fonts, sets `<html>`/metadata) and delegates everything interactive to `Providers`.
- **`app/providers.tsx`** is the one `'use client'` boundary that owns the Redux store and MUI theme for the whole app. On mount it also **rehydrates auth** (see below).

### 5.2 Authentication flow

The token is stored in **two places**, each serving a different consumer:

| Storage | Read by | Why |
| --- | --- | --- |
| `localStorage` (`accessToken`, `authUser`) | Client JS → attached as `Authorization: Bearer` header | Primary session store. |
| Cookie (`token`) | `proxy.ts` on the server | Lets the server do optimistic redirects before React runs. |

> ⚠️ **Security note (from the code):** the cookie is a plain JS-readable cookie, **not** an httpOnly session. It exists only so the server can guess where to route you and avoid a UI flash. The *authoritative* check is client-side (`AuthGuard`), and the real security boundary is the backend, which validates the JWT on every protected request.

**Sign-in / sign-up sequence:**

1. User submits the form on `/login` or `/register`.
2. The page calls `useLoginMutation` / `useRegisterMutation` (RTK Query) → backend returns `{ user, accessToken }`.
3. The page dispatches `setCredentials(data)` → the auth reducer stores it in Redux.
4. `authListener` middleware reacts to `setCredentials` and calls `persistAuth()` → writes localStorage **and** the cookie.
5. The page redirects (`/dashboard`, or the `from` query param if the user was bounced from a protected route).

**On every app load (rehydration):**

1. `Providers` runs an effect that reads the persisted token/user via `readStoredToken()` / `readStoredUser()`.
2. It dispatches `hydrate({ token, user })` → sets `isAuthenticated` and, crucially, `isInitialized = true`.
3. `isInitialized` gates all redirect logic so nothing navigates before we know whether a session exists.
4. If a token was found, `refreshAuthCookie()` re-extends the cookie so it can't expire out from under a still-valid localStorage token.

**Logout:** dispatch `logout()` → reducer clears state, `authListener` calls `clearAuth()` (wipes storage + cookie), and the component redirects to `/login`.

**Expired token:** if any authenticated request returns **401 while a token is held**, the base query (`apiSlice.ts`) auto-dispatches `logout()`, forcing a clean sign-out. (A 401 during login/register — when no token is held yet — is left alone so the form can show the error.)

### 5.3 Route protection (two layers)

```
Request → proxy.ts (server, optimistic)   → AuthGuard (client, authoritative)
```

1. **`proxy.ts`** runs on the server for every non-API, non-static request. Based only on the presence of the `token` cookie it:
   - redirects `/` → `/dashboard` or `/login`;
   - bounces unauthenticated users away from `/dashboard` & `/products` (attaching `?from=…`);
   - bounces already-authenticated users away from `/login` & `/register`.
   This prevents flashing the wrong page but can be fooled by a stale cookie.

2. **`AuthGuard`** (wrapping the `(app)` group) is the real gate. After rehydration, if there's no valid client session it dispatches `logout()` (clearing the stale cookie so the proxy won't bounce you back) and redirects to `/login`. Until auth is confirmed it renders a loading spinner.

### 5.4 Data flow (RTK Query)

All server communication is funneled through **one API slice** so every request benefits from shared auth, caching, and cache-invalidation.

```
Component
  └─ useListProductsQuery(filter)          ← auto-generated hook
       └─ productsApi (injectEndpoints)
            └─ apiSlice.baseQuery          ← adds Bearer token, handles 401
                 └─ fetch → NestJS /api/...
                      └─ transformResponse ← unwraps { success, message, data } → data
```

- **`apiSlice.ts`** defines the base query (base URL, `Authorization` header injection, 401→logout) and declares cache **tag types** `['Auth', 'Product']`. It has **no endpoints of its own**.
- **`authApi.ts`** and **`productsApi.ts`** *inject* endpoints into that base slice. They're imported for their side effects in `store.ts` so their reducers/hooks register.
- Every endpoint's `transformResponse` unwraps the backend's `{ success, message, data }` envelope, so components receive clean `data`.
- **Cache invalidation via tags:** e.g. creating a product invalidates `{ type: 'Product', id: 'LIST' }`, so any mounted product list refetches automatically. Editing/deleting invalidates both the specific product id and the list.

### 5.5 State: what lives where

| State | Home | Persistence |
| --- | --- | --- |
| Auth (user, token, flags) | Redux `auth` slice | localStorage + cookie (via `authListener`) |
| Server data (products, profile) | RTK Query cache (Redux `api` slice) | In-memory; refetched on invalidation/focus |
| Product list filters/sort/view | Local `useState` in `products/page.tsx` | `sessionStorage` (via `filterStorage.ts`) |
| Form inputs / dialog open state | Local `useState` in each component | None (ephemeral) |

---

## 6. Pages (routes)

| Route | File | Description |
| --- | --- | --- |
| `/` | `app/page.tsx` | Redirect hub. Waits for rehydration, then routes to `/dashboard` or `/login`. Mostly a client fallback — `proxy.ts` usually redirects first. |
| `/login` | `app/login/page.tsx` | Email/password sign-in. Client-side email validation, error alerts, redirect-after-login (with an **open-redirect-safe** `from` param), and forwards already-authed users away. |
| `/register` | `app/register/page.tsx` | Sign-up with first/last name, email, password, phone. Field-level validation mirrors the backend DTO (e.g. password 6–64 chars, optional last name/phone only sent if filled). |
| `/dashboard` | `app/(app)/dashboard/page.tsx` | Shows the user's profile (name, email, phone, role, id) and re-fetches `GET /auth/profile` through RTK Query to demonstrate an authenticated call. Links to the catalog. |
| `/products` | `app/(app)/products/page.tsx` | The catalog workhorse (see below). |
| `/products/:id` | `app/(app)/products/[id]/page.tsx` | Product detail with image gallery, metadata, and admin edit/delete. Handles loading, not-found, and error states. |

### The products page in detail (`app/(app)/products/page.tsx`)

This is the most feature-rich screen. It manages:

- **Search** (debounced 350 ms), **category** filter, **availability** filter (all / in stock / out), **sort field** + **sort order**, **pagination**, **rows-per-page**, and **view mode** (table/grid).
- All filter state is **rehydrated from `sessionStorage`** on mount and **persisted on every change**, so reloads and back-navigation keep your place. The debounce deliberately skips its first run so restoring a saved search doesn't reset the page to 1.
- The filter object is memoized and fed to `useListProductsQuery`; **sorting/paging are server-side** (changing them re-queries the API).
- Guards the current page number back into range when the result set shrinks (e.g. deleting the last item on the last page).
- Admin-only "Add product" button and per-row edit/delete actions (gated on `user.role === 'admin'`).
- Feedback surfaces: loading skeleton, empty state, error alert with **Retry**, and a success/error **Snackbar** toast.

---

## 7. Components

### Layout / chrome

| Component | Role |
| --- | --- |
| **`AppShell`** | Sticky top nav for authenticated pages. Active-route highlighting, user role chip, avatar with initials, and a logout button. Wraps all `(app)` pages. |
| **`AuthGuard`** | Client-side auth gate for the `(app)` group. Renders a spinner until auth is confirmed; redirects unauthenticated users to `/login`. |
| **`auth/AuthShell`** | Split-screen layout for `/login` & `/register`: a branded gradient panel (hidden on mobile) beside a centered form card. Takes `title`, `subtitle`, `children`, `footer`. |

### Auth

| Component | Role |
| --- | --- |
| **`auth/PasswordField`** | Wraps MUI `TextField` as a password input: lock icon adornment + a show/hide toggle. Accepts all `TextFieldProps`. *(This is the file currently open in your editor.)* |

### Products

| Component | Role |
| --- | --- |
| **`products/ProductsTable`** | Table view. Sortable columns (`name`, `price`, `stock`) via `TableSortLabel` — clicking a header calls back to re-query the API. Shows image thumbnail, name (linked), category, price, stock chip, and admin action buttons. |
| **`products/ProductCard`** | Grid-view card. Clickable image + name + price + category/stock chips; admin edit/delete footer. Links to the detail page. |
| **`products/ProductFormDialog`** | Create/edit dialog. Controlled fields with validation (name, price, stock, category, description), **multi-image upload** (≤5 files, ≤5 MB each, images only) with live object-URL previews, and a note that new uploads replace existing images. Submits as `multipart/form-data`; create vs. edit chosen by whether a `product` prop is passed. |
| **`products/ConfirmDialog`** | Generic yes/no dialog (title, message, confirm label, loading state). Reused for delete confirmations on both the list and detail pages. |

---

## 8. The `lib/` layer

### State & store

| File | Exports | Purpose |
| --- | --- | --- |
| `store.ts` | `makeStore`, `RootState`, `AppDispatch`, `AppStore` | Builds the Redux store: `auth` reducer + `api` reducer, with the auth listener prepended and RTK Query middleware appended. Imports `authApi`/`productsApi` for their endpoint-registration side effects. |
| `hooks.ts` | `useAppDispatch`, `useAppSelector`, `useAppStore` | Pre-typed react-redux hooks. **Use these everywhere** instead of the raw hooks. |
| `features/auth/authSlice.ts` | `setCredentials`, `hydrate`, `logout`, selectors | The auth reducer. Selectors: `selectCurrentUser`, `selectToken`, `selectIsAuthenticated`, `selectIsInitialized`, `selectAuth`. |
| `features/auth/authListener.ts` | `authListenerMiddleware` | Listener middleware that persists to storage on `setCredentials` and clears it on `logout`, keeping the reducers pure. |

### API layer

| File | Purpose |
| --- | --- |
| `api/apiSlice.ts` | The base RTK Query API: base URL, Bearer-token header injection, auto-logout on 401-with-token, and cache tag types. |
| `api/authApi.ts` | `useLoginMutation`, `useRegisterMutation`, `useGetProfileQuery`. |
| `api/productsApi.ts` | `useListProductsQuery`, `useGetProductQuery`, `useCreateProductMutation`, `useUpdateProductMutation`, `useUploadProductImageMutation`, `useDeleteProductMutation`, plus `useSendTestMailMutation` / `useQueueMailMutation` (admin mail endpoints). |
| `api/parseError.ts` | `getErrorMessage(error)` — turns any RTK Query/serialized error into one human-readable string, including a friendly "Is the backend running on port 3000?" for network failures and joining validation-error arrays. |

### Auth persistence

| File | Purpose |
| --- | --- |
| `auth/token.ts` | Read/write the token & user in localStorage and the mirror cookie: `readStoredToken`, `readStoredUser`, `persistAuth`, `clearAuth`, `refreshAuthCookie`. All are SSR-safe (no-op when `window` is undefined) and tolerate storage being unavailable (private mode). |

### Helpers & config

| File | Purpose |
| --- | --- |
| `config.ts` | `API_BASE_URL`, `BACKEND_ORIGIN`, and `assetUrl(path)` — resolves backend-relative image paths (e.g. `/uploads/x.png`) to absolute URLs. |
| `theme.ts` | The MUI theme: indigo primary (`#4f46e5`), sky secondary, rounded corners, Geist font, no-uppercase buttons, `TextField` defaults to full width. |
| `format.ts` | `formatPrice` (INR currency) and `formatDate` (localized short date), both null/NaN-safe. |
| `products/filterStorage.ts` | `readStoredFilters` / `writeStoredFilters` + the `StockFilter` / `SortField` / `SortOrder` / `ViewMode` types. Persists the catalog's UI state to `sessionStorage` under `products.filters.v1`. |
| `types/api.ts` | The single source of truth for the backend contract: `ApiResponse<T>`, `ApiErrorBody`, `AuthUser`, `AuthData`, `ProfileData`, `LoginRequest`, `RegisterRequest`, `Product`, `PaginatedProducts`, `ProductFilter`, and the mail types. |

---

## 9. Backend API contract

All routes are under `/api`. Every **success** response is wrapped as `{ success: true, message, data }`; every **error** as `{ success: false, statusCode, error, message, path, timestamp }` (where `message` may be a string or an array of validation errors). The frontend's `transformResponse` unwraps `data`, and `parseError.ts` decodes the error shape.

| Method & path | Auth | Frontend hook | Notes |
| --- | --- | --- | --- |
| `POST /auth/register` | public | `useRegisterMutation` | Returns `{ user, accessToken }`. |
| `POST /auth/login` | public | `useLoginMutation` | Returns `{ user, accessToken }`. |
| `GET /auth/profile` | Bearer | `useGetProfileQuery` | Returns the decoded token identity. |
| `GET /products` | Bearer | `useListProductsQuery` | Paginated; accepts `ProductFilter` params. |
| `GET /products/:id` | Bearer | `useGetProductQuery` | Single product. |
| `POST /products` | **admin** | `useCreateProductMutation` | `multipart/form-data` (with images). |
| `PATCH /products/:id` | **admin** | `useUpdateProductMutation` | `multipart/form-data`; unsent fields are kept. |
| `POST /products/:id/image` | **admin** | `useUploadProductImageMutation` | Single `image` field. |
| `DELETE /products/:id` | **admin** | `useDeleteProductMutation` | |
| `POST /mail/test` | **admin** | `useSendTestMailMutation` | (No UI yet — hook available.) |
| `POST /mail/queue` | **admin** | `useQueueMailMutation` | (No UI yet — hook available.) |

The Bearer token is attached automatically by `apiSlice.ts`; **admin** authorization is enforced by the backend, with the frontend additionally hiding admin-only controls when `user.role !== 'admin'`.

---

## 10. Conventions & gotchas for contributors

- **`'use client'` everywhere interactive.** The root layout is a Server Component; almost everything else (pages, components) is a Client Component because it uses Redux/MUI/hooks.
- **Always go through RTK Query** for HTTP. Add new endpoints via `injectEndpoints` in a `lib/api/*.ts` file and remember to import that file in `store.ts` so it registers.
- **Use the typed hooks** (`useAppSelector`/`useAppDispatch`) from `lib/hooks.ts`, never the raw react-redux ones.
- **Gate redirects on `isInitialized`.** Don't navigate based on auth until rehydration has run, or you'll bounce users incorrectly on first paint.
- **Route protection is defense-in-depth, not a security boundary.** `proxy.ts` + `AuthGuard` improve UX; the backend JWT check is the real gate.
- **Middleware is `proxy.ts` now** (Next 16). Editing it means editing the `proxy()` function, not a `middleware()` one.
- **Backend must be on :3000**; this app is on :3001. A `FETCH_ERROR` surfaces as "Is the backend running on port 3000?".
- **Read the bundled Next.js docs** in `node_modules/next/dist/docs/` before using unfamiliar APIs — this Next version differs from older releases.
```
