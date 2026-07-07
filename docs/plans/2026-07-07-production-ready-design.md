# Production-Ready Design & Implementation Plan

**Project:** Myntra Clone — Medusa v2 Backend + Next.js 14 Storefront
**Date:** 2026-07-07
**Approach:** A — Fresh Medusa v2 backend scaffold, re-implement custom features as v2 modules
**Status:** Planning document — no source code changes made

---

## 1. Architecture Overview (Target State)

### 1.1 Current State (Audited)

The codebase has two layers that are fundamentally incompatible:

**Backend (`backend/`):** The `package.json` pins `@medusajs/medusa@^2.17.2` (installed: 2.17.2), but ALL source code is Medusa **v1** style:
- `medusa-config.js` — CommonJS `module.exports = { projectConfig, plugins, modules }` (v1 format)
- `src/models/*.ts` — TypeORM `@Entity()` decorators (`typeorm@0.3.20` in deps)
- `src/api/*.ts` — Express `Router()` with `req.app.get("db").getRepository(...)` (v1 pattern)
- `src/scripts/*.ts` — v1 `MedusaContainer` with `container.resolve("regionService")` using v1 service names
- `src/api/admin-server.ts` — 49KB inline React.createElement SPA served via esm.sh CDN (v1 hack)
- `src/admin/*` — Stubbed v2 admin widgets/routes that reference non-existent v1 admin API routes (`/admin/products`, `/admin/orders`)

This backend **cannot boot**. `medusa develop` would fail at config loading because v2 expects `medusa-config.ts` with `defineConfig()`.

**Storefront (`storefront/`):** Next.js 14 App Router. TypeScript compiles with 0 errors. However:
- Homepage and PLP use hardcoded mock arrays (not the Medusa API)
- `formatPrice()` does NOT divide by 100 — prices display ~100× too high on cart/checkout
- Auth: `loginCustomer` calls `medusaClient.auth.create` but stores no token/cookie — dashboard fails
- Header search input has no form/onSubmit; Bag icon has no cart-count badge
- Dead links to `/studio`, `/gift-cards`, `/insider`, `/contact`, `/faq`, `/terms`, etc. → 404 with no `not-found.tsx`
- `next.config.js` is empty — no `images.remotePatterns` for `assets.myntassets.com`
- No `error.tsx` / `loading.tsx` app-router files
- Cart coupon is fake (client-side 10%); PDP ratings hardcoded "4.2"; PDP `Link href={/collections/${""}}` broken
- `getOrders({ customer_id })` passes invalid param to Medusa store API
- Checkout shows fake hardcoded order summary when cart is empty
- Dead deps: `zustand`, `react-hot-toast`, `axios`, `clsx` installed but unused

### 1.2 Target State

```
E:/Projects/ecom store/
├── backend/
│   ├── medusa-config.ts          # v2 defineConfig() — NEW
│   ├── package.json              # v2 deps only — CLEANED
│   ├── tsconfig.json             # v2 compatible — UPDATED
│   ├── Dockerfile                # v2 build — UPDATED
│   └── src/
│       ├── modules/              # v2 custom modules (MikroORM models)
│       │   ├── pincode/
│       │   │   ├── index.ts      # Module() definition
│       │   │   └── models/pincode.ts  # model.define()
│       │   ├── review/
│       │   │   ├── index.ts
│       │   │   └── models/review.ts
│       │   ├── wishlist/
│       │   │   ├── index.ts
│       │   │   └── models/wishlist.ts
│       │   └── return-request/
│       │       ├── index.ts
│       │       └── models/return-request.ts
│       ├── api/
│       │   ├── store/            # v2 store API routes
│       │   │   ├── pincodes/[code]/route.ts
│       │   │   ├── reviews/[product_id]/route.ts
│       │   │   ├── reviews/route.ts
│       │   │   ├── wishlist/route.ts
│       │   │   ├── wishlist/[id]/route.ts
│       │   │   ├── returns/route.ts
│       │   │   └── returns/[id]/route.ts
│       │   └── middlewares.ts    # v2 middleware definition
│       ├── admin/                # v2 admin extensions
│       │   ├── components/Layout.tsx  # KEEP (already v2-style)
│       │   ├── routes/                 # KEEP but fix API calls
│       │   └── widgets/dashboard.tsx   # KEEP
│       └── scripts/
│           └── seed.ts           # Unified v2 seed script — NEW
├── storefront/
│   ├── next.config.js            # images.remotePatterns — UPDATED
│   ├── package.json              # Remove dead deps or use them — UPDATED
│   └── src/
│       ├── lib/
│       │   ├── api.ts            # Fix formatPrice, auth, getOrders — UPDATED
│       │   ├── medusa.ts         # Re-export — UPDATED
│       │   └── store.ts          # NEW: zustand cart/auth store
│       ├── app/
│       │   ├── layout.tsx        # Wrap with store provider — UPDATED
│       │   ├── page.tsx          # Wire to API — UPDATED
│       │   ├── not-found.tsx     # NEW
│       │   ├── error.tsx         # NEW
│       │   ├── loading.tsx       # NEW
│       │   ├── products/
│       │   │   ├── page.tsx      # Wire to API — UPDATED
│       │   │   └── [handle]/page.tsx  # Fix reviews/wishlist/link — UPDATED
│       │   ├── cart/page.tsx     # Fix price, coupon — UPDATED
│       │   ├── checkout/page.tsx # Fix price, empty state — UPDATED
│       │   ├── search/page.tsx   # ALREADY works, verify
│       │   └── account/
│       │       ├── page.tsx      # Fix auth persistence — UPDATED
│       │       ├── dashboard/    # Route guard — UPDATED
│       │       ├── orders/       # Fix getOrders, route guard — UPDATED
│       │       ├── wishlist/     # Route guard — UPDATED
│       │       └── addresses/    # Route guard — UPDATED
│       ├── components/
│       │   ├── layout/Header.tsx # Search form + cart badge — UPDATED
│       │   ├── layout/Footer.tsx # Fix dead links — UPDATED
│       │   └── product/ProductCard.tsx  # Support MedusaProduct type — UPDATED
│       └── styles/globals.css    # unchanged
├── docker-compose.yml            # dev — unchanged
├── docker-compose.prod.yml       # prod — REVIEWED/UPDATED for v2
├── nginx/default.conf            # REVIEWED for v2
├── deploy.sh                     # REVIEWED for v2
└── .env.production.example       # REVIEWED for v2
```

### 1.3 Integration Surface

- Storefront → Medusa v2 Store API (`/store/products`, `/store/carts`, `/store/customers`, `/store/auth`, `/store/pincodes/:code`, `/store/reviews/:product_id`, `/store/wishlist`, `/store/returns`)
- Storefront auth: Medusa v2 storefront auth uses cookie-based sessions via `medusaClient.auth.create` with `origin: "store"` — the SDK sets a `Authorization` header / cookie automatically
- Medusa v2 Admin: Native admin app served at `/app` (v2 bundles admin at port 9000), custom admin widgets/routes in `src/admin/`
- Database: PostgreSQL 15 via Docker; Redis for cache/queues
- Payments: Razorpay (v2 module or provider plugin) + COD (manual provider)

---

## 2. Milestones M0–M5

### M0: Repo Hygiene (Confirm)

**Goal:** Confirm the baseline git state is clean.

**Status:** Already done per task brief. Git initialized, `.gitignore` created (confirmed: covers `node_modules/`, `.env`, logs, screenshots, `.next/`, `dist/`, uploads), baseline committed, branch created.

**Verification:**
- `git status` shows clean working tree (or only expected untracked files)
- `git log --oneline` shows baseline commit
- `.gitignore` includes `*.png`, `dev-server*.log`, `node_modules/`, `.env`

**Stop/Escalation:** If git is not initialized or baseline commit missing → stop and report.

---

### M1: Fresh Medusa v2 Backend Scaffold + Core Commerce Boots

**Goal:** Replace the v1 backend code with a clean Medusa v2 application that boots, runs migrations, seeds region + products, and returns data from `/store/products`.

#### Tasks (each 2–5 min)

1. **Backup current v1 backend source**
   - Move `backend/src/models/*`, `backend/src/api/*` (v1 files), `backend/src/scripts/*`, `backend/src/subscribers/*`, `backend/src/strategies/*`, `backend/src/types/*` to `backend/_v1-archive/` (gitignored or kept for reference)
   - File: `backend/_v1-archive/` (new directory)
   - Do NOT delete `backend/src/admin/*` — those are v2-style stubs to keep

2. **Create `backend/medusa-config.ts`**
   - File: `backend/medusa-config.ts` (NEW, replaces `medusa-config.js`)
   - Use `defineConfig({ projectConfig: { database_url, http: { storeCors, adminCors }, jwtSecret, cookieSecret, redisUrl }, plugins: [], modules: {} })`
   - Import `defineConfig` from `@medusajs/medusa` (verify exact import path at implementation time — check `@medusajs/medusa` exports or the draft-order README pattern)
   - Delete `backend/medusa-config.js`
   - Acceptance: `npx tsc --noEmit` in backend passes with the new config

3. **Update `backend/package.json`**
   - Remove v1 deps: `typeorm`, `medusa-fulfillment-manual`, `medusa-payment-manual`, `medusa-payment-razorpay`, `@medusajs/medusa-plugin-sendgrid`, `express`, `cors`, `cookie-parser`, `jsonwebtoken`, `multer`, `csv-parse`, `sharp`, `ioredis`, `pg` (Medusa v2 manages these internally)
   - Remove `reflect-metadata` (v2 uses MikroORM, not TypeORM decorators in user code)
   - Fix `@types/react` from `^19` → `^18` in devDeps
   - Keep: `@medusajs/medusa@^2.17.2`, `typescript`, `ts-node`, `@types/node`
   - Update scripts: `"dev": "medusa develop"`, `"build": "medusa build"`, `"start": "medusa start"`, `"migrate": "medusa db:migrate"`, `"seed": "medusa exec src/scripts/seed.ts"`
   - Acceptance: `npm install` succeeds without errors; `@types/react` version is 18.x

4. **Update `backend/tsconfig.json`**
   - Remove `emitDecoratorMetadata` and `experimentalDecorators` (TypeORM-only)
   - Keep `jsx: "react-jsx"` for admin widgets
   - Remove the `exclude: ["src/admin/**/*.tsx"]` line — v2 admin TSX files should be compiled
   - Acceptance: `npx tsc --noEmit` passes

5. **Create `.env` for backend (dev)**
   - File: `backend/.env` (NEW, gitignored)
   - Keys: `DATABASE_URL=postgres://myntra:myntra_pass@localhost:5432/myntra_store`, `REDIS_URL=redis://localhost:6379`, `JWT_SECRET=...`, `COOKIE_SECRET=...`, `STORE_CORS=http://localhost:3000`, `ADMIN_CORS=http://localhost:9000`, `RAZORPAY_KEY_ID=`, `RAZORPAY_KEY_SECRET=`
   - Acceptance: `medusa-config.ts` can read env vars

6. **Create unified seed script `backend/src/scripts/seed.ts`**
   - File: `backend/src/scripts/seed.ts` (NEW)
   - Use v2 container pattern: `export default async function ({ container })` — resolve v2 services: `container.resolve("region")`, `container.resolve("product")`, `container.resolve("productCategory")` (verify exact v2 service registration keys from `@medusajs/medusa` core module names)
   - Seed: India region (INR, country IN), ~5 categories (men, women, kids, home-living, beauty + subcategories), ~5 products with variants + prices in paise (e.g. ₹1299 → `amount: 129900`)
   - **CRITICAL:** v2 prices are in the smallest currency unit (paise for INR). The existing seed used `amount: 1299` (rupees) — must change to `amount: 129900`
   - Acceptance: Script exists and compiles

7. **Delete `backend/src/api/admin-server.ts`**
   - Remove the 49KB inline SPA file
   - Also delete root `admin-server.js` (standalone version)
   - Medusa v2 serves its native admin app at `http://localhost:9000/app`
   - Acceptance: File removed; no references remain

8. **Create `backend/src/api/middlewares.ts`**
   - File: `backend/src/api/middlewares.ts` (NEW)
   - Use v2 `defineMiddlewares` to register any custom route middleware (CORS for custom store routes, auth for wishlist/returns/reviews POST)
   - Acceptance: Compiles

9. **Update `backend/Dockerfile`**
   - Ensure build step runs `npm run build` (which calls `medusa build`)
   - Add `RUN npx medusa db:migrate` as part of entrypoint or deploy script (not Dockerfile — migrations run against running DB)
   - Acceptance: Dockerfile references v2 build correctly

#### Validation Contract (M1)

**Must be true:**
- `backend/medusa-config.ts` exists, `medusa-config.js` does not exist
- `backend/package.json` has no `typeorm`, no v1 plugin packages, `@types/react` is `^18`
- `npx tsc --noEmit` in `backend/` passes with 0 errors
- Docker is running (Postgres + Redis up via `docker-compose up -d postgres redis`)

**Verification commands (run in order):**
```bash
cd backend
npx tsc --noEmit                           # TS compiles
# Start Docker (user action required):
docker-compose up -d postgres redis
# Wait for healthchecks:
docker-compose ps                          # both healthy
# Run migrations:
npx medusa db:migrate
# Seed:
npx medusa exec src/scripts/seed.ts
# Start dev server:
npm run dev                                # boots on :9000
# Verify API:
curl http://localhost:9000/store/products  # returns { products: [...], count: N }
curl http://localhost:9000/admin         # redirects to /app (native admin)
```

**Stop/Escalation:**
- If Docker daemon is off → all code tasks can proceed, but verification waits. Document the pending verification step.
- If `defineConfig` import fails → check `@medusajs/medusa` exports; fall back to direct config object export pattern
- If `medusa db:migrate` fails → check DATABASE_URL connectivity, check that Postgres is healthy
- If `/store/products` returns empty → check seed script ran successfully, check region was created

---

### M2: Custom v2 Modules + Store API Routes + Seeds

**Goal:** Re-implement pincode, review, wishlist, and return-request as proper Medusa v2 modules with MikroORM models, v2 store API routes, and seed data.

#### Tasks (each 2–5 min)

1. **Create Pincode module**
   - Files (NEW):
     - `backend/src/modules/pincode/index.ts` — `import { Module } from "@medusajs/medusa"`; `export default Module("pincode", { service: PincodeService })`
     - `backend/src/modules/pincode/models/pincode.ts` — `import { model } from "@medusajs/medusa"`; `model.define("pincode", { id: model.text().primaryKey(), code: model.text(), is_serviceable: model.boolean(), estimated_days: model.number(), city: model.text().nullable(), state: model.text().nullable() })`
     - `backend/src/modules/pincode/service.ts` — extends `MedusaService` (v2 base service) with `listPincodes`, `getPincode(code)`, `createPincodes`
   - Register in `medusa-config.ts`: `modules: [{ resolve: "./src/modules/pincode" }]`
   - Acceptance: `npx tsc --noEmit` passes

2. **Create Pincode store API route**
   - File: `backend/src/api/store/pincodes/[code]/route.ts` (NEW)
   - `export async function GET(req, res) { ... }` — resolve pincode module service, query by code, return `{ pincode, is_serviceable, estimated_days, city, state }`
   - Acceptance: Compiles

3. **Create Review module**
   - Files (NEW):
     - `backend/src/modules/review/index.ts`
     - `backend/src/modules/review/models/review.ts` — `model.define("review", { id, product_id, customer_id, rating, title, body, images: model.json().nullable(), is_verified: model.boolean() })`
     - `backend/src/modules/review/service.ts` — `listReviews(productId)`, `getAverageRating(productId)`, `createReview(data)`
   - Register in `medusa-config.ts`
   - Acceptance: Compiles

4. **Create Review store API routes**
   - Files (NEW):
     - `backend/src/api/store/reviews/[product_id]/route.ts` — `GET` returns `{ reviews, total, average_rating }`
     - `backend/src/api/store/reviews/route.ts` — `POST` requires auth (resolve customer from `req.auth_context` or v2 auth middleware)
   - Acceptance: Compiles

5. **Create Wishlist module**
   - Files (NEW):
     - `backend/src/modules/wishlist/index.ts`
     - `backend/src/modules/wishlist/models/wishlist.ts` — `model.define("wishlist", { id, customer_id, product_id, variant_id: model.text().nullable() })`
     - `backend/src/modules/wishlist/service.ts` — `listWishlist(customerId)`, `addWishlist(data)`, `removeWishlist(id)`
   - Register in `medusa-config.ts`
   - Acceptance: Compiles

6. **Create Wishlist store API routes**
   - Files (NEW):
     - `backend/src/api/store/wishlist/route.ts` — `GET` (auth required), `POST` (auth required, dedup check)
     - `backend/src/api/store/wishlist/[id]/route.ts` — `DELETE` (auth required, ownership check)
   - Acceptance: Compiles

7. **Create Return Request module**
   - Files (NEW):
     - `backend/src/modules/return-request/index.ts`
     - `backend/src/modules/return-request/models/return-request.ts` — `model.define("return_request", { id, order_id, customer_id, items: model.json(), status: model.text(), pickup_address: model.json().nullable(), pickup_date: model.dateTime().nullable() })`
     - `backend/src/modules/return-request/service.ts`
   - Register in `medusa-config.ts`
   - Acceptance: Compiles

8. **Create Return Request store API routes**
   - Files (NEW):
     - `backend/src/api/store/returns/route.ts` — `POST` (auth), `GET` (auth, scoped to customer)
     - `backend/src/api/store/returns/[id]/route.ts` — `GET` (auth, ownership check)
   - Acceptance: Compiles

9. **Extend seed script with pincodes + taxes**
   - File: `backend/src/scripts/seed.ts` (UPDATE)
   - Add pincode seeding (30 pincodes from the existing seed data — metros, tier-2, non-serviceable)
   - Add GST tax rates (0%, 5%, 12%, 18%, 28%) using v2 tax rate service
   - Acceptance: Seed script compiles and includes all data

10. **Create admin API routes for custom modules (optional, keep existing stubs)**
    - The existing `src/admin/routes/*.tsx` files call `/admin/products`, `/admin/orders` etc. — these are served by Medusa v2's **native** admin API, not custom routes. Verify the native admin API endpoints match what the widgets call. If they don't match, fix the fetch URLs in the admin widgets.
    - For custom module admin (pincode/review/return management), add v2 admin routes under `backend/src/admin/routes/` if needed — but this is lower priority; the native admin covers products/orders/customers/discounts.
    - Acceptance: Admin widgets compile and fetch from valid v2 admin endpoints

#### Validation Contract (M2)

**Must be true:**
- All 4 custom modules exist with MikroORM models and service classes
- All store API routes exist and compile
- `npx tsc --noEmit` in `backend/` passes with 0 errors
- `medusa-config.ts` registers all 4 custom modules

**Verification commands (Docker must be running):**
```bash
cd backend
npx tsc --noEmit
npx medusa db:migrate                      # creates tables for custom modules
npx medusa exec src/scripts/seed.ts        # seeds pincodes, products, region, taxes
npm run dev
# Verify custom endpoints:
curl http://localhost:9000/store/pincodes/110001    # { is_serviceable: true, estimated_days: 2 }
curl http://localhost:9000/store/pincodes/999999    # { is_serviceable: false }
curl http://localhost:9000/store/reviews/<product_id>  # { reviews: [], total: 0, average_rating: 0 }
# Wishlist (requires auth — test with a logged-in customer token):
# POST http://localhost:9000/store/wishlist with auth header
```

**Stop/Escalation:**
- If `model.define()` import path is unclear → check `@medusajs/medusa` utils exports; the v2 pattern is `import { model } from "@medusajs/medusa"` or from `@medusajs/framework`
- If module registration fails → check that the module `index.ts` exports `Module()` correctly
- If migrations don't create custom tables → check that modules are registered in `medusa-config.ts` before running `db:migrate`

---

### M3: Storefront Critical Fixes

**Goal:** Fix all verified storefront bugs so the frontend correctly integrates with the running v2 backend.

#### Tasks (each 2–5 min)

1. **Fix `formatPrice()` — divide by 100**
   - File: `storefront/src/lib/api.ts`
   - Change: `formatPrice(amount, currency)` → divide amount by 100 before formatting: `new Intl.NumberFormat("en-IN", { ... }).format(amount / 100)`
   - Add a separate `formatPriceRupees(amount)` for amounts already in rupees (for mock data fallback if needed)
   - Acceptance: `formatPrice(129900)` → `₹1,299`; `formatPrice(1299)` → `₹13` (correct paise behavior)
   - **Risk:** This changes behavior for all callers. Verify cart/checkout/PDP/search all pass paise amounts. The mock data on homepage/PLP uses rupee amounts directly in `ProductCard` — those will need to be updated to either pass `amount * 100` or use a rupee formatter. **Resolution:** Since homepage/PLP will be wired to the API (task 5), mock fallbacks should convert their rupee values to paise before passing to `formatPrice`, or ProductCard should receive paise amounts.

2. **Fix `ProductCard` to handle both mock and Medusa product types**
   - File: `storefront/src/components/product/ProductCard.tsx`
   - Change: Accept either a mock product (with `price` in rupees) or a `MedusaProduct`. If `MedusaProduct`, compute price via `getCheapestVariantPrice()` (already divides by 100). If mock, pass `price * 100` to `formatPrice` or use a rupee formatter.
   - Acceptance: ProductCard renders correct prices for both data sources

3. **Fix `getOrders()` — remove invalid `customer_id` param**
   - File: `storefront/src/lib/api.ts`
   - Change: `getOrders()` → `medusaClient.orders.list()` (no params — v2 auto-scopes to logged-in customer)
   - Update callers: `storefront/src/app/account/dashboard/page.tsx`, `storefront/src/app/account/orders/page.tsx` — remove `getCustomer()` + `getOrders(cust.id)` pattern, just call `getOrders()` directly
   - Acceptance: No `customer_id` param passed to orders API

4. **Fix auth persistence — store token/cookie after login**
   - File: `storefront/src/lib/api.ts`
   - Change `loginCustomer`: After `medusaClient.auth.create({ email, password })`, the v2 SDK should set a cookie/token. Verify that the Medusa JS SDK (`@medusajs/medusa-js@^2.0.0`) handles this automatically when `publishableApiKey` is set. If not, manually store the returned token and set it as a header on subsequent requests.
   - Add `logoutCustomer()` function: clear stored auth state
   - Add `isAuthenticated()` helper: check if auth token exists / try `getCustomer()` and return boolean
   - Acceptance: After login, `getCustomer()` returns customer data on subsequent page loads

5. **Create zustand cart + auth store**
   - File: `storefront/src/lib/store.ts` (NEW)
   - Use `zustand` (already installed): cart store with `{ cartId, cart, itemCount, setCart, addItem, refreshCart }`
   - Auth store with `{ customer, isAuthenticated, login, logout, loadCustomer }`
   - Persist cartId to localStorage
   - Acceptance: Store compiles; `zustand` is now used (no longer dead dep)

6. **Add route guards for `/account/*` pages**
   - File: `storefront/src/app/account/dashboard/layout.tsx` (NEW) or guard in each page
   - On mount: check auth; if not authenticated, redirect to `/account` (login page)
   - Apply to: `dashboard`, `orders`, `wishlist`, `addresses`
   - Acceptance: Unauthenticated access to `/account/dashboard` redirects to `/account`

7. **Wire homepage to Medusa API**
   - File: `storefront/src/app/page.tsx`
   - Change: Make it a server component (or use `useEffect` + client). Fetch `getProducts({ limit: 10 })` for trending products, `getCollections()` for featured categories. Keep the existing layout/sections but populate product rows from API data. Graceful fallback: if API fails, show a subset of mock data with a console warning.
   - Acceptance: Homepage renders products from `/store/products` when backend is running

8. **Wire PLP to Medusa API**
   - File: `storefront/src/app/products/page.tsx`
   - Change: Convert to server component with `searchParams`. Call `getProducts({ category_id, q, limit: 30, offset })` based on URL params. Map Medusa products to ProductCard format. Keep fallback products for when API is down. Apply sort on client or via API params.
   - Acceptance: PLP renders products from API with filters

9. **Fix Header search — add form + navigation**
   - File: `storefront/src/components/layout/Header.tsx`
   - Change: Wrap search input in `<form onSubmit={...}>` that navigates to `/search?q=${encodeURIComponent(query)}`. Add `useState` for query. Apply to both desktop and mobile search.
   - Acceptance: Typing in search + Enter navigates to `/search?q=...`

10. **Add cart-count badge to Header Bag icon**
    - File: `storefront/src/components/layout/Header.tsx`
    - Change: Use zustand cart store to read `itemCount`. Render a badge (red circle with count) over the Bag icon if count > 0.
    - Acceptance: After adding items to cart, Bag icon shows count badge

11. **Fix PDP — wire reviews, fix collection link, wire wishlist**
    - File: `storefront/src/app/products/[handle]/page.tsx`
    - Changes:
      - Replace hardcoded "4.2" rating with `getProductReviews(product.id)` — show real average_rating and review count
      - Fix `Link href={/collections/${""}}` → use actual collection handle: `product.collection?.handle || "#"`
      - Wire wishlist button: call `addToWishlist(product.id, selectedVariant?.id)` on click (requires auth — show login prompt if not authenticated)
      - Size Guide button: either add a modal or link to a static size guide page (stub acceptable)
    - Acceptance: PDP shows real reviews, working collection link, functional wishlist button

12. **Fix cart — price display + real discount codes**
    - File: `storefront/src/app/cart/page.tsx`
    - Changes:
      - `formatPrice(item.unit_price)` — now correct since formatPrice divides by 100 (task 1)
      - `formatPrice(subtotal)`, `formatPrice(total)` — these are paise from Medusa, now correct
      - Replace fake 10% coupon with `medusaClient.carts.addDiscount(cartId, { code: coupon })`
      - Show `cart.discount_total` from the updated cart instead of client-side calculation
      - Use `cart.shipping_total` instead of hardcoded delivery calculation
    - Acceptance: Cart shows correct prices; coupon applies real Medusa discount codes

13. **Fix checkout — remove fake summary, fix prices**
    - File: `storefront/src/app/checkout/page.tsx`
    - Changes:
      - When cart is empty (no items), show empty state with "Your bag is empty" + link to products — do NOT show the fake hardcoded "Classic Fit Polo T-Shirt" / "Slim Fit Jeans" items
      - `formatPrice(subtotal)`, `formatPrice(total)`, `formatPrice(item.unit_price)` — now correct after formatPrice fix
      - Remove the hardcoded shipping fallback array when `shippingOptions.length === 0` — instead show "No shipping options available" or retry
    - Acceptance: Empty cart shows empty state; prices display correctly

14. **Add `not-found.tsx`**
    - File: `storefront/src/app/not-found.tsx` (NEW)
    - Myntra-styled 404 page with link back to home
    - Acceptance: Visiting `/studio` shows styled 404 instead of default Next.js 404

15. **Add `error.tsx` + `loading.tsx`**
    - Files (NEW):
      - `storefront/src/app/error.tsx` — root error boundary (client component, reset button)
      - `storefront/src/app/loading.tsx` — root loading skeleton
      - `storefront/src/app/products/loading.tsx` — PLP loading skeleton
      - `storefront/src/app/products/[handle]/loading.tsx` — PDP loading skeleton
    - Acceptance: Error states show styled UI; navigation shows loading skeleton

16. **Fix dead links in Footer**
    - File: `storefront/src/components/layout/Footer.tsx`
    - Change: For links to `/studio`, `/gift-cards`, `/insider`, `/contact`, `/faq`, `/terms`, `/terms-of-use`, `/shipping`, `/cancellation`, `/returns`, `/privacy`, `/grievance` — either:
      - Option A: Create simple stub pages under `app/(static)/` with placeholder content
      - Option B: Remove links that have no corresponding page (simpler, recommended for MVP)
      - **Recommended:** Remove `/studio`, `/insider` (Myntra-specific features not in scope). Create minimal stub pages for policy links (`/contact`, `/faq`, `/terms`, `/terms-of-use`, `/shipping`, `/cancellation`, `/returns`, `/privacy`, `/grievance`, `/gift-cards`) with "Coming soon" content — these are expected on an e-commerce site.
    - Acceptance: No Footer link returns a raw 404

17. **Add `images.remotePatterns` to `next.config.js`**
    - File: `storefront/next.config.js`
    - Change:
      ```js
      const nextConfig = {
        images: {
          remotePatterns: [
            { protocol: "https", hostname: "assets.myntassets.com" },
            { protocol: "https", hostname: "constant.myntassets.com" },
          ],
        },
      }
      ```
    - Acceptance: `next/image` components can load Myntra asset URLs

18. **Migrate ProductCard and PDP images to `next/image`**
    - Files: `storefront/src/components/product/ProductCard.tsx`, `storefront/src/app/products/[handle]/page.tsx`
    - Change: Replace `<img>` with `<Image>` from `next/image` for optimized loading. Use appropriate width/height or fill with aspect ratio container.
    - Acceptance: Images render via next/image optimization

19. **Clean up dead deps or use them**
    - File: `storefront/package.json`
    - `zustand` → now USED (cart/auth store, task 5) — keep
    - `react-hot-toast` → use for cart/wishlist action feedback (add to PDP "Add to Bag", wishlist add/remove) — or remove if not adding
    - `axios` → remove (not used; `fetch` is used in api.ts)
    - `clsx` → remove (not used) or use for conditional class names
    - **Recommended:** Use `react-hot-toast` for user feedback on cart/wishlist actions. Remove `axios` and `clsx`.
    - Acceptance: No unused deps; `npm install` succeeds

20. **Fix PDP price display**
    - File: `storefront/src/app/products/[handle]/page.tsx`
    - The PDP already uses `getVariantPrice()` which divides by 100, but displays with `₹{currentPrice.toLocaleString("en-IN")}` (raw number). This is correct since `getVariantPrice` returns rupees. Verify consistency with `formatPrice()` after the fix.
    - Acceptance: PDP price matches ProductCard price for the same product

#### Validation Contract (M3)

**Must be true:**
- `formatPrice(129900)` → `₹1,299` (divides by 100)
- `getOrders()` does not pass `customer_id`
- Login persists auth; dashboard loads customer data after login
- Header search navigates to `/search?q=`
- Header Bag shows count badge after add-to-cart
- Homepage + PLP fetch from Medusa API (with fallback)
- `not-found.tsx`, `error.tsx`, `loading.tsx` exist
- `next.config.js` has `images.remotePatterns`
- `npx tsc --noEmit` in `storefront/` passes with 0 errors

**Verification commands:**
```bash
cd storefront
npx tsc --noEmit                           # 0 errors
npm run build                              # build succeeds
npm run dev                                # dev server on :3000
# Browser flows (with backend running on :9000):
# 1. Visit / → products render from API
# 2. Visit /products → products from API with filters
# 3. Search "polo" in header → navigates to /search?q=polo
# 4. Visit /products/classic-fit-polo-tshirt → PDP loads, reviews section shows real data
# 5. Add to cart → Bag icon shows "1" badge
# 6. Visit /cart → prices correct (₹1,299 not ₹129,900)
# 7. Visit /studio → styled 404 page
# 8. Login → redirect to /account/dashboard → customer data loads
# 9. Visit /account/dashboard without login → redirect to /account
```

**Stop/Escalation:**
- If `@medusajs/medusa-js` SDK doesn't auto-persist auth → investigate cookie vs token approach; may need to manually set `Authorization: Bearer <token>` header on the Medusa client
- If homepage server component fetch fails during build (SSR) → use client component with `useEffect` instead (Medusa client is client-side anyway due to the lazy Proxy pattern)
- If `next/image` causes layout shift on Myntra assets → use `fill` with `object-cover` in fixed-aspect containers

---

### M4: End-to-End Integration Verification

**Goal:** Prove the full stack works end-to-end with documented evidence.

#### Tasks

1. **Full stack startup**
   - `docker-compose up -d postgres redis`
   - `cd backend && npm run dev` (port 9000)
   - `cd storefront && npm run dev` (port 3000)
   - Acceptance: Both servers running without errors

2. **Catalog browse flow**
   - Homepage loads with real products
   - Click a product → PDP loads with images, price, size selector, reviews
   - Acceptance: No console errors; data from API

3. **Search flow**
   - Type in header search → `/search?q=polo` → results from API
   - Acceptance: Search returns matching products

4. **Cart flow**
   - On PDP: select size → Add to Bag → Bag badge increments
   - Visit `/cart` → item appears with correct price (₹1,299)
   - Update quantity → price updates
   - Apply coupon code (if a discount code was seeded) → discount applied
   - Acceptance: Cart shows correct prices and discount

5. **Checkout flow**
   - Proceed to checkout → enter address + pincode → pincode check returns serviceability
   - Select shipping → select payment (Razorpay or COD)
   - Place order → success page with order ID
   - Acceptance: Order created in Medusa; cart cleared

6. **Auth flow**
   - Register new customer → login → dashboard loads with customer name
   - View orders → empty state (new customer)
   - Logout → redirected to login
   - Acceptance: Auth persists across page navigation; logout clears session

7. **Pincode serviceability**
   - Enter `110001` on PDP → "Delivery available in 2 days"
   - Enter `194101` → "Delivery not available"
   - Acceptance: Pincode API returns correct data

8. **Reviews**
   - On PDP with seeded reviews → average rating + review list displays
   - Submit a review (while logged in) → review appears
   - Acceptance: Reviews API works end-to-end

9. **Wishlist**
   - Click heart on PDP (while logged in) → item added to wishlist
   - Visit `/account/wishlist` → item appears
   - Remove from wishlist → item disappears
   - Acceptance: Wishlist CRUD works

10. **Returns (if order exists)**
    - With a completed order, submit a return request
    - Acceptance: Return request created; visible in returns list

11. **Admin**
    - Visit `http://localhost:9000/app` → Medusa v2 native admin loads
    - Login with admin credentials (create via `npx medusa user -e admin@myntra-clone.com -p password`)
    - View products, orders, customers
    - Acceptance: Native admin functional

#### Validation Contract (M4)

**Evidence to collect:**
- Screenshots or curl outputs for each flow
- `curl http://localhost:9000/store/products | jq '.products | length'` → N > 0
- `curl http://localhost:9000/store/pincodes/110001` → serviceable
- Browser DevTools: no 4xx/5xx errors on any page
- `npx tsc --noEmit` passes in both `backend/` and `storefront/`

**Stop/Escalation:**
- If any flow fails → document the failure, the error, and the likely cause
- If Razorpay payment fails (no API keys configured) → use COD (manual provider) for verification; document that Razorpay needs real keys for production

---

### M5: Deployment Readiness

**Goal:** Review and fix all deployment artifacts for Medusa v2 compatibility; document run steps.

#### Tasks (each 2–5 min)

1. **Review `docker-compose.prod.yml`**
   - File: `docker-compose.prod.yml`
   - Check: Medusa service builds from v2 `Dockerfile`; env vars match v2 config (`DATABASE_URL`, `REDIS_URL`, `JWT_SECRET`, `COOKIE_SECRET`, `STORE_CORS`, `ADMIN_CORS`)
   - Check: No v1-specific env vars (e.g., `DATABASE_TYPE`, `databaseType`)
   - Check: `medusa` service runs `medusa start` (not v1 `medusa start` with different flags)
   - Acceptance: Compose file is v2-compatible

2. **Update `backend/Dockerfile` for v2**
   - File: `backend/Dockerfile`
   - Ensure: `npm install --production` or `npm ci` for smaller image; `npm run build` runs `medusa build`; expose 9000
   - Add: `HEALTHCHECK` using `curl http://localhost:9000/health`
   - Acceptance: Dockerfile builds successfully

3. **Review `nginx/default.conf`**
   - File: `nginx/default.conf`
   - Check: `api.*` subdomain proxies to `medusa:9000`; `admin.*` proxies to `medusa:9000/app`; storefront at root
   - Check: v2 admin is served at `/app` path — ensure nginx doesn't strip the `/app` prefix
   - Acceptance: Nginx config routes correctly for v2

4. **Review `deploy.sh`**
   - File: `deploy.sh`
   - Check: Migration command is `medusa db:migrate` (not v1 `medusa migrations run`)
   - Check: Seed command is `medusa exec src/scripts/seed.ts` (v2 pattern)
   - Check: Admin user creation uses `medusa user` (v2 command, not v1 `medusa user`)
   - Acceptance: Deploy script uses v2 commands

5. **Review `.env.production.example`**
   - File: `.env.production.example`
   - Ensure: All v2-required env vars documented (`DATABASE_URL`, `REDIS_URL`, `JWT_SECRET`, `COOKIE_SECRET`, `STORE_CORS`, `ADMIN_CORS`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`)
   - Remove: v1-specific vars (`DATABASE_TYPE`, `SENDGRID_API_KEY` unless needed)
   - Acceptance: Env template is v2-complete

6. **Review `docker-compose.monitoring.yml`**
   - File: `docker-compose.monitoring.yml`
   - Check: Health check endpoints match v2 (`/health` on Medusa v2)
   - Acceptance: Monitoring config valid

7. **Document run steps**
   - File: `docs/deployment-guide.md` (NEW)
   - Document: Prerequisites (Docker, Node 20), local dev steps, production deploy steps, env var setup, admin user creation, seed instructions
   - Acceptance: Anyone can deploy by following the guide

#### Validation Contract (M5)

**Must be true:**
- `docker-compose.prod.yml` references v2 commands and env vars
- `deploy.sh` uses `medusa db:migrate` and `medusa exec`
- `nginx/default.conf` routes `/app` correctly
- `.env.production.example` has all v2 vars
- Deployment guide exists and is complete

**Verification commands:**
```bash
# Dry-run validation (no actual deploy):
cd backend && npx tsc --noEmit        # 0 errors
cd storefront && npx tsc --noEmit     # 0 errors
# Docker build (if Docker is running):
docker-compose -f docker-compose.prod.yml build   # builds without errors
# Nginx config syntax:
nginx -t -c nginx/default.conf        # (if nginx installed locally)
```

**Stop/Escalation:**
- If `docker-compose build` fails → fix Dockerfile; don't proceed to actual deploy without user confirmation
- If nginx config has issues → fix routing rules; test with local nginx if available
- **Do NOT attempt actual production deployment** — this milestone is about readiness, not execution

---

## 3. Non-Goals (YAGNI)

1. **Pixel-perfect Myntra matching loop** — The existing 25% mismatch is acceptable for production. Visual refinement is an ongoing task, not a blocker.
2. **External DNS/SSL setup** — Requires user's domain and server access. Document the steps but don't execute.
3. **CI/CD pipeline** — GitHub Actions / CI setup is post-launch. Document as future work.
4. **Standalone `admin-server.js` SPA** — Being replaced by Medusa v2 native admin. Do not attempt to fix or maintain the esm.sh CDN SPA.
5. **External monitoring service (UptimeRobot/BetterStack)** — Requires external accounts. Document as optional.
6. **SendGrid email integration** — Remove from deps; email notifications are post-launch.
7. **Myntra Insider / Gift Cards / Studio** — These are Myntra-specific features out of scope for a clone. Remove dead links.
8. **Bulk CSV product upload** — The admin widget stub exists; full implementation is post-launch. Native v2 admin supports product creation.

---

## 4. Risks + Open Questions

### Risks

| # | Risk | Impact | Mitigation |
|---|------|--------|------------|
| R1 | **Docker daemon is OFF** | Blocks all backend verification (M1, M2, M4) | Code work proceeds without Docker. Verification is a gated step that requires user to start Docker Desktop. Document clearly. |
| R2 | **`defineConfig` import path unclear** | M1 scaffold fails to compile | Check `@medusajs/medusa` package exports at implementation time. Fallback: export config object directly without `defineConfig`. The draft-order README shows `defineConfig` pattern. |
| R3 | **v2 module service base class** | Custom modules may not register correctly | Verify the exact v2 `Module()` and `MedusaService` API from `@medusajs/medusa` dist. The v2 pattern changed across versions — 2.17.2 may differ from docs. |
| R4 | **Medusa JS SDK auth persistence** | Auth doesn't persist; dashboard fails after login | The `@medusajs/medusa-js@^2.0.0` SDK may require a `publishableApiKey` or may use cookie-based auth. Test empirically. If SDK doesn't persist, manually store JWT and set headers. |
| R5 | **Price paise vs rupees confusion** | Prices display 100× wrong or 100× too low | Centralize all price formatting through `formatPrice()` (which divides by 100). Ensure ALL callers pass paise amounts. Mock data must be converted to paise or use a separate formatter. |
| R6 | **v2 admin widget API URLs** | Admin widgets call wrong endpoints | v2 native admin API uses different URL patterns than v1. The existing `src/admin/routes/*.tsx` files fetch from `/admin/products` etc. — verify these match v2 admin API paths. |
| R7 | **Razorpay v2 compatibility** | Payment provider may not work with v2 | The v1 `medusa-payment-razorpay` package may not be v2-compatible. Check for a v2 Razorpay provider or implement as a custom v2 payment provider. For now, use `manual` (COD) provider for verification. |
| R8 | **Seed script v2 service names** | Seed fails because service registration keys changed | v2 uses different service registration keys than v1 (e.g., `region` not `regionService`). Verify exact keys from v2 core module exports. |

### Open Questions (Need User Decision)

1. **Razorpay for production:** Do you have Razorpay API keys for testing, or should we use COD (manual provider) only for now? This affects M4 payment verification and M5 production config.

2. **Dead footer links:** Should we create stub pages for policy links (`/contact`, `/faq`, `/terms`, etc.) with placeholder content, or remove them entirely? **Recommendation:** Create minimal stubs — e-commerce sites are expected to have these.

3. **Image hosting:** Product images currently point to `assets.myntassets.com` placeholders that may not exist. Should we use real product images (hosted where?) or keep placeholder URLs? For production, images need to be hosted on your own CDN or Medusa file service.

4. **Domain name:** What domain will this be deployed to? Affects nginx config, CORS settings, and `.env.production`.

5. **Admin user:** Should we create a default admin user in the seed script, or will you create it manually via `medusa user` command?

6. **GST tax implementation:** Should GST be applied as a flat rate per product, or per-product-category? The current seed creates tax rates but doesn't link them to products. Full tax implementation may require a custom tax calculation strategy.

---

## 5. Meta-Prompt for M1 Worker Subagent

```
You are implementing M1 of the production-ready plan for a Myntra-clone e-commerce project at E:/Projects/ecom store.

## Context
The backend at `backend/` has Medusa v2 packages installed (@medusajs/medusa@2.17.2) but ALL source code is v1-style (TypeORM entities, Express Router with req.app.get("db").getRepository(), v1 medusa-config.js). It cannot boot. Your job is to replace it with a clean Medusa v2 application.

## Your tasks (in order)

1. Move v1 backend files to `backend/_v1-archive/`: src/models/*.ts, src/api/*.ts (the v1 API routes: pincodes.ts, reviews.ts, wishlist.ts, returns.ts, admin-*.ts, analytics.ts, bulk-upload.ts, admin-server.ts), src/scripts/*.ts, src/subscribers/*, src/strategies/*, src/types/*. Do NOT move src/admin/* (those are v2-style stubs to keep).

2. Delete `backend/medusa-config.js`. Create `backend/medusa-config.ts` using the v2 `defineConfig()` pattern. Check the @medusajs/medusa package exports to find the correct import for `defineConfig`. The draft-order README at `backend/node_modules/@medusajs/draft-order/README.md` shows the pattern: `module.exports = defineConfig({ projectConfig: {...}, plugins: [], modules: {} })`. Configure: DATABASE_URL, REDIS_URL, JWT_SECRET, COOKIE_SECRET, STORE_CORS=http://localhost:3000, ADMIN_CORS=http://localhost:9000. Read env from process.env.

3. Update `backend/package.json`: Remove v1 deps (typeorm, medusa-fulfillment-manual, medusa-payment-manual, medusa-payment-razorpay, express, cors, cookie-parser, jsonwebtoken, multer, csv-parse, sharp, ioredis, pg, reflect-metadata, @types/cookie-parser, @types/cors, @types/express, @types/jsonwebtoken, @types/multer). Fix @types/react from ^19 to ^18. Keep: @medusajs/medusa, typescript, ts-node, @types/node. Update scripts: dev=medusa develop, build=medusa build, start=medusa start, migrate=medusa db:migrate, seed=medusa exec src/scripts/seed.ts.

4. Update `backend/tsconfig.json`: Remove emitDecoratorMetadata and experimentalDecorators. Remove the exclude for src/admin/**/*.tsx. Keep jsx: react-jsx.

5. Create `backend/src/scripts/seed.ts`: Use v2 container pattern (export default async function seed({ container })). Resolve v2 services (verify exact service keys — likely "region", "product", "productCategory" — check @medusajs/medusa core module names). Seed: India region (INR, country IN), 5+ categories, 5+ products with variants. CRITICAL: prices in PAISE (₹1299 → amount: 129900). Include payment provider setup (manual/COD).

6. Delete root `admin-server.js` if it exists. Delete `backend/src/api/admin-server.ts` (in _v1-archive already).

7. Create `backend/src/api/middlewares.ts` using v2 defineMiddlewares pattern.

8. Run `cd backend && npx tsc --noEmit` to verify 0 TypeScript errors.

## Constraints
- Do NOT edit any storefront files.
- Do NOT run Docker commands (daemon may be off). Just ensure code compiles.
- Do NOT delete backend/src/admin/* — keep the v2 admin widget stubs.
- If `defineConfig` import is unclear, check the package exports or fall back to a plain object export.

## Validation
- `cd backend && npx tsc --noEmit` → 0 errors
- `medusa-config.ts` exists, `medusa-config.js` does not exist
- `package.json` has no typeorm, no v1 plugins, @types/react is ^18
- `src/scripts/seed.ts` exists and compiles
- `src/api/admin-server.ts` does not exist

## Report
When done, report: files changed, tsc output, any v2 API patterns you had to verify/adjust, and any blockers for when Docker is available.
```

---

## Summary

This plan addresses 15 verified critical gaps across the Myntra-clone stack. The backend is fundamentally broken (v1 code on v2 packages) and must be rebuilt fresh. The storefront compiles but has data integration bugs (price formatting, mock data, auth persistence) and missing app-router infrastructure (404/error/loading). The work is organized into 6 serial milestones (M0–M5) with concrete file-level tasks and validation contracts. Docker availability is the primary external dependency — all code work can proceed without it, with verification gated behind Docker startup.

---

## 6. Resolved Decisions (User-Approved 2026-07-07)

All six open questions from §4 are resolved with these defaults. Workers for M2–M5 MUST follow them without re-asking:

1. **Payments → COD only.** Use Medusa v2 `manual` provider (Cash on Delivery). Do NOT integrate Razorpay in this pass. Razorpay is deferred until the user provides test keys. Remove `medusa-payment-razorpay` from deps (already removed in M1). In checkout UI, keep COD as the sole payment option; remove the Razorpay radio option (or keep it disabled + labeled "Coming soon").
2. **Footer dead links → stub policy pages + remove Myntra-only ones.** Create minimal stub pages (Coming-soon style, Myntra-styled) for: `/contact`, `/faq`, `/terms`, `/terms-of-use`, `/shipping`, `/cancellation`, `/returns`, `/privacy`, `/grievance`, `/gift-cards`. **Remove** `/studio` and `/insider` from the Footer and Header nav entirely (out of scope for a clone).
3. **Product images → keep placeholder Myntra asset URLs for now.** Do not migrate image hosting. Add a clear `TODO(prod)` note in the deployment guide that production must host product images on the user's own CDN or Medusa file service. `next.config.js` `images.remotePatterns` for `assets.myntassets.com` / `constant.myntassets.com` is still added (M3 task 17) so `next/image` works with the placeholders.
4. **Admin user → seed a default admin.** The seed script (`backend/src/scripts/seed.ts`) creates a default admin user: email `admin@myntra-clone.com`, password `admin123` (documented in the deployment guide + `.env.production.example` as a value to change immediately). Verify the exact v2 admin-user creation API (`medusa user` CLI or the `auth`/`user` module service) by inspecting the installed package.
5. **GST → flat per-product rate for MVP.** Seed GST tax rates (0/5/12/18/28%) and apply a single flat rate per product via the v2 tax rate/rules API. Do not build a custom tax calculation strategy. Document the simplification in the deployment guide.
6. **Domain → deferred.** nginx/CORS/`.env.production` keep placeholder domain `example.com` (or `myntra-clone.local`); the user fills in the real domain at deploy time. Do not block M5 on this.

### Docker / verification gating
Docker Desktop is configured to store data on `D:\DockerData` (verified) but the Linux engine is not yet provisioned. All milestones proceed with code + `tsc --noEmit` / `npm run build` as the gate. Runtime verification (`medusa db:migrate`, `medusa develop`, `curl /store/products`, browser flows) is a **gated step** that runs once the user confirms the Docker engine is up. Workers must clearly separate "compiles/builds" evidence from "runtime" evidence in their reports.