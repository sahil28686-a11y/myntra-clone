# M3a — Storefront Data/Auth Integration — Worker Report

**Date:** 2026-07-07
**Scope:** M3a (tasks 1–8, 12, 13) of the production-ready plan — data/auth integration for the `storefront`. UI-polish tasks (Header search, cart badge, PDP reviews/wishlist, not-found/error/loading pages, Footer links, next.config remotePatterns, next/image migration, dead-deps removal) are deferred to M3b and were NOT touched.

---

## Summary

Fixed the verified data/auth bugs so the storefront correctly integrates with the Medusa v2 backend while keeping the Myntra visual design unchanged. TypeScript compiles with **0 errors** and `npm run build` **succeeds**.

---

## Critical SDK finding (must read)

The installed storefront SDK is **`@medusajs/medusa-js@2.0.2`** — this is the **legacy v1-style JS client**, NOT the real Medusa v2 SDK (`@medusajs/js-sdk`). The task instructions assumed the real v2 SDK; the actual installed package differs in several method names. I verified every uncertain method against `node_modules/@medusajs/medusa-js/dist/index.d.ts` and `dist/index.mjs` and adapted accordingly. Evidence below.

### 1. Auth method name + persistence
- **Evidence:** `dist/index.d.ts:129` `declare class AuthResource` exposes `authenticate(payload)`, `deleteSession()`, `getSession()`, `exists(email)`. There is **no `auth.create`** method.
- The existing `loginCustomer` called `medusaClient.auth.create(...)` — **this method does not exist**, so login was completely broken.
- **Fix:** `loginCustomer` now calls `medusaClient.auth.authenticate({ email, password })` (POST `/store/auth`).
- **Persistence:** `dist/index.mjs` `Client.request` builds every axios request with `withCredentials:!0`. The axios client therefore sends/receives cookies automatically, and the browser persists the httpOnly session cookie. **No manual token storage is needed** — `getCustomer()` (GET `/store/customers/me`) works on later page loads because the browser re-sends the cookie. `publishableApiKey` is NOT required for auth (it only scopes catalog resources via the `x-publishable-api-key` header, `dist/index.d.ts:55`).
- `logoutCustomer()` → `medusaClient.auth.deleteSession()` (DELETE `/store/auth`).
- `isAuthenticated()` → tries `medusaClient.auth.getSession()` (GET `/store/auth`), returns boolean.

### 2. Cart discount — no `addDiscount`
- **Evidence:** `dist/index.d.ts:187` `CartsResource` exposes `deleteDiscount(cart_id, code)` but **no `addDiscount`**.
- **Fix:** Discounts are applied via `carts.update(cartId, { discounts: [{ code }] })`. Confirmed the request body type `StorePostCartsCartReq` (`node_modules/@medusajs/medusa/dist/api/routes/store/carts/update-cart.d.ts`) has a `discounts?: Discount[]` field where `Discount = { code: string }` — POST `/store/carts/{id}`.
- Added `applyCartDiscount(cartId, code)` and `removeCartDiscount(cartId, code)` helpers.

### 3. Orders — no `orders.list()`
- **Evidence:** `dist/index.d.ts:374` `OrdersResource` exposes only `retrieve`, `retrieveByCartId`, `lookupOrder`, `requestCustomerOrders`, `confirmRequest` — **no `list`**.
- **Fix:** `getOrders()` now uses `medusaClient.customers.listOrders()` (GET `/store/customers/me/orders`), which is auto-scoped to the logged-in customer via the session cookie. No `customer_id` param is passed. (The task instruction said `medusaClient.orders.list()` — that method does not exist in this SDK; `customers.listOrders()` is the correct auto-scoped equivalent.)
- `getOrder(id)` is unchanged (uses `orders.retrieve`).

### 4. Payment provider id (COD)
- Per decision §6.1 (COD-only), `setPaymentSession` is called with provider id **`"manual"`** (the Medusa manual/COD provider). The Razorpay radio is rendered disabled and labeled "Coming soon".
- **Runtime confirmation needed (M4):** the actual manual provider id installed in the backend region must be verified once the backend boots. If the v2 backend registers the manual provider under a different id, update `setPaymentSession(cart.id, "manual")` in `src/app/checkout/page.tsx`.

---

## Files changed

### Modified
| File | Change |
|---|---|
| `src/lib/api.ts` | `formatPrice` now divides by 100 (paise→rupees); added `formatPriceRupees` (for amounts already in rupees). `getOrders()` → `customers.listOrders()` (no `customer_id`). `loginCustomer` → `auth.authenticate`. Added `logoutCustomer`, `isAuthenticated`, `applyCartDiscount`, `removeCartDiscount`. |
| `src/lib/medusa.ts` | Re-exported the new helpers (`logoutCustomer`, `isAuthenticated`, `formatPriceRupees`, `applyCartDiscount`, `removeCartDiscount`). |
| `src/components/product/ProductCard.tsx` | Accepts either a mock product (`price` in rupees) or a `MedusaProduct` (variants with paise prices). Medusa products use `getCheapestVariantPrice()` (already /100); mock uses `formatPriceRupees()`. Visual layout identical. |
| `src/app/page.tsx` | Converted to client component; `useEffect` fetches `getProducts({ limit: 10 })` for the Trending/Best-Sellers/New-Arrivals rows and `getCollections()` for featured categories. Graceful fallback to existing mock data with `console.warn` on API failure. All sections/layout preserved. |
| `src/app/products/page.tsx` | Converted to client component; reads `searchParams` via `useSearchParams()` (wrapped in `<Suspense>`); calls `getProducts({ category_id?, q?, price_from?, price_to?, limit: 30, offset })`; client-side sort; falls back to `fallbackProducts` on API failure. Filter sidebar + sort + grid preserved. |
| `src/app/cart/page.tsx` | Replaced fake client-side 10% coupon with real `applyCartDiscount`/`removeCartDiscount` (Medusa discount codes); shows `cart.discount_total` and server error messages. Delivery estimate now expressed in paise (₹99 = 9900) so `formatPrice` is correct; free-over-₹4999 threshold uses paise (499900). |
| `src/app/checkout/page.tsx` | Empty-cart → "Your bag is empty" empty state (removed fake Polo/Jeans summary). COD-only payment (Razorpay disabled + "Coming soon"); `setPaymentSession` uses `"manual"`. Removed hardcoded shipping fallback array → "No shipping options available" message. Delivery calc paise-correct. |
| `src/app/account/dashboard/page.tsx` | Calls `getOrders()` directly (dropped `getOrders(cust.id)`). Wired `HiOutlineLogout` sidebar button to working `logoutCustomer()` + redirect to `/account`. |
| `src/app/account/orders/page.tsx` | Calls `getOrders()` directly; removed the `getCustomer()`-then-`getOrders(cust.id)` pattern. |
| `src/app/account/wishlist/page.tsx` | Fixed price display: now passes raw paise amounts to `formatPrice` (the previous code pre-divided by 100, which would double-divide after the formatPrice fix). |

### New
| File | Purpose |
|---|---|
| `src/lib/store.ts` | Zustand cart store (`{ cartId, cart, itemCount, setCart, refreshCart, clearCart }`, persists `cartId` to localStorage) + auth store (`{ customer, isAuthenticated, login, logout, loadCustomer }`). Makes `zustand` a used dependency. |
| `src/components/auth/AccountGuard.tsx` | Shared client route guard; rehydrates the auth session on mount via the cookie-scoped SDK and redirects to `/account` when unauthenticated. |
| `src/app/account/dashboard/layout.tsx` | Wraps dashboard in `AccountGuard`. |
| `src/app/account/orders/layout.tsx` | Wraps orders list **and** `orders/[id]` in `AccountGuard`. |
| `src/app/account/wishlist/layout.tsx` | Wraps wishlist in `AccountGuard`. |
| `src/app/account/addresses/layout.tsx` | Wraps addresses in `AccountGuard`. |

---

## Validation

### `npx tsc --noEmit` (in `storefront/`)
```
$ npx tsc --noEmit
TSC EXIT: 0
```
**0 errors.**

### `npm run build` (in `storefront/`)
```
$ npm run build
 ▲ Next.js 14.2.0
   Creating an optimized production build ...
 ✓ Compiled successfully
   Linting and checking validity of types ...
   Collecting page data ...
   Generating static pages (13/13)
 ✓ Generating static pages (13/13)
   Finalizing page optimization ...

Route (app)                              Size     First Load JS
┌ ○ /                                    4.5 kB          151 kB
├ ○ /_not-found                          871 B          87.8 kB
├ ○ /account                             3.16 kB         138 kB
├ ○ /account/addresses                   4.59 kB         140 kB
├ ○ /account/dashboard                   4.5 kB          147 kB
├ ○ /account/orders                      3.11 kB         145 kB
├ ƒ /account/orders/[id]                 4.38 kB         146 kB
├ ○ /account/wishlist                    4.44 kB         147 kB
├ ○ /cart                                4.99 kB         148 kB
├ ○ /checkout                            5.05 kB         147 kB
├ ○ /products                            4.01 kB         151 kB
├ ƒ /products/[handle]                   5.73 kB         148 kB
└ ○ /search                              1.27 kB         148 kB
EXIT: 0
```
**Build succeeds.** (`/products` uses `useSearchParams` wrapped in `<Suspense>`; `/account/orders/[id]` and `/products/[handle]` are dynamic server-rendered on demand.)

### formatPrice behavior (verified with Node)
```
formatPrice(129900)      => ₹1,299      (paise → rupees, correct)
formatPrice(1299)        => ₹13         (correct paise behavior)
formatPriceRupees(1299)  => ₹1,299      (amounts already in rupees)
```

### Acceptance-contract checks
- `formatPrice(129900)` returns `₹1,299` — ✅
- `getOrders` passes no `customer_id` — ✅ (uses `customers.listOrders()`, no params)
- `src/lib/store.ts` exists (zustand) — ✅
- `/account/dashboard` has an auth guard (redirects to `/account` when unauthenticated) — ✅ (`AccountGuard` in `dashboard/layout.tsx`; applied to dashboard, orders, orders/[id], wishlist, addresses)
- Homepage + PLP call the API with fallback — ✅
- Cart uses real discount-code API; checkout is COD-only with empty-state — ✅

---

## Assumptions
1. **SDK = legacy v1-style `@medusajs/medusa-js@2.0.2`.** All method names were verified against the installed package (evidence above). The task's references to `medusaClient.orders.list()` and `medusaClient.carts.addDiscount` were adapted to the actual SDK API (`customers.listOrders()` and `carts.update({ discounts })`).
2. **Auth persists via cookies** (axios `withCredentials:true` + browser cookie jar). No manual token/header management required. This is runtime-gated — confirmed by code inspection, not by a live backend.
3. **Manual provider id = `"manual"`** for COD. Needs M4 runtime confirmation against the booted backend.
4. **Cart page delivery estimate** (₹99, free over ₹4999) is a UI affordance, expressed in paise (9900 / threshold 499900) so it stays correct with `formatPrice`. The cart page does not set a shipping method, so `cart.shipping_total` is normally 0 there; the estimate fills that gap. Checkout uses `cart.shipping_total` from the real shipping method.
5. Mock fallback data on homepage/PLP keeps its rupee prices; `ProductCard` routes mock products through `formatPriceRupees` so they render correctly alongside API products.

## Runtime confirmation needed (M4, once backend is up)
- Manual/COD payment provider id (`"manual"`).
- `auth.authenticate` actually sets a session cookie and `customers.retrieve()` returns the customer on a subsequent request (cookie persistence).
- `customers.listOrders()` returns the logged-in customer's orders.
- `carts.update({ discounts: [{ code }] })` applies a seeded discount code and returns `discount_total`.
- Homepage/PLP `getProducts`/`getCollections` return seeded data.

## Risks
- The legacy SDK (`@medusajs/medusa-js@2.0.2`) targets the Medusa v1 store API shape. The M1/M2 work rebuilds the backend as Medusa v2. If the v2 backend's store API differs from what this SDK expects (endpoint paths, response shapes), runtime integration may need the real `@medusajs/js-sdk` instead. This is gated to M4 and is out of M3a scope.
- `AccountGuard` calls `loadCustomer()` on every mount of a protected page; if the session cookie is absent this issues one failing `/store/customers/me` request before redirecting. Acceptable for now.

---

## Acceptance report

```acceptance-report
{
  "criteriaSatisfied": [
    {
      "id": "criterion-1",
      "status": "satisfied",
      "evidence": "Implemented all M3a tasks (1-8,12,13) with narrow edits; no backend files touched; Myntra visual layout preserved; no M3b scope (Header search/cart badge, PDP reviews/wishlist, not-found/error/loading, Footer links, next.config, next/image) was touched. tsc 0 errors, build succeeds."
    },
    {
      "id": "criterion-2",
      "status": "satisfied",
      "evidence": "Verified SDK methods against node_modules/@medusajs/medusa-js/dist/index.d.ts + index.mjs with file/line citations; tsc and build output pasted; formatPrice behavior verified via Node; changed-files and new files listed."
    }
  ],
  "changedFiles": [
    "storefront/src/lib/api.ts",
    "storefront/src/lib/medusa.ts",
    "storefront/src/lib/store.ts",
    "storefront/src/components/product/ProductCard.tsx",
    "storefront/src/components/auth/AccountGuard.tsx",
    "storefront/src/app/page.tsx",
    "storefront/src/app/products/page.tsx",
    "storefront/src/app/cart/page.tsx",
    "storefront/src/app/checkout/page.tsx",
    "storefront/src/app/account/dashboard/page.tsx",
    "storefront/src/app/account/dashboard/layout.tsx",
    "storefront/src/app/account/orders/page.tsx",
    "storefront/src/app/account/orders/layout.tsx",
    "storefront/src/app/account/wishlist/page.tsx",
    "storefront/src/app/account/wishlist/layout.tsx",
    "storefront/src/app/account/addresses/layout.tsx"
  ],
  "testsAddedOrUpdated": [],
  "commandsRun": [
    {
      "command": "cd storefront && npx tsc --noEmit",
      "result": "passed",
      "summary": "0 TypeScript errors (final run)"
    },
    {
      "command": "cd storefront && npm run build",
      "result": "passed",
      "summary": "Compiled successfully; 13/13 static pages generated; route summary printed; EXIT 0"
    },
    {
      "command": "node -e \"...formatPrice...\"",
      "result": "passed",
      "summary": "formatPrice(129900)=>₹1,299; formatPrice(1299)=>₹13; formatPriceRupees(1299)=>₹1,299"
    }
  ],
  "validationOutput": [
    "tsc --noEmit: 0 errors (exit 0)",
    "npm run build: ✓ Compiled successfully; 13/13 static pages; exit 0",
    "formatPrice(129900) => ₹1,299 (divides by 100)",
    "getOrders uses customers.listOrders() with no customer_id",
    "src/lib/store.ts exists (zustand cart + auth stores)",
    "AccountGuard applied to /account/dashboard, /account/orders(+[id]), /account/wishlist, /account/addresses",
    "Homepage + PLP call getProducts/getCollections with mock fallback",
    "Cart uses applyCartDiscount/removeCartDiscount (real Medusa discount codes); checkout COD-only with empty-state + no fake shipping fallback"
  ],
  "residualRisks": [
    "Installed SDK is legacy v1-style @medusajs/medusa-js@2.0.2, not the real Medusa v2 @medusajs/js-sdk; runtime integration with the v2 backend (M1/M2) is gated to M4 and may require switching SDKs.",
    "Manual/COD payment provider id \"manual\" needs M4 runtime confirmation against the booted backend region.",
    "Auth cookie persistence confirmed by code inspection (axios withCredentials) only — not yet exercised against a live backend."
  ],
  "noStagedFiles": true,
  "diffSummary": "Fixed formatPrice (/100) + added formatPriceRupees; rewired auth (auth.authenticate, logout, isAuthenticated), orders (customers.listOrders), and cart discounts (carts.update discounts) to match the installed legacy SDK; added zustand cart/auth store; added AccountGuard layouts for all protected /account/* pages; wired homepage + PLP to the API with mock fallback; made cart use real discount codes and checkout COD-only with an empty-cart state and no fake shipping fallback; fixed wishlist paise display.",
  "reviewFindings": [
    "no blockers"
  ],
  "manualNotes": "Key deviation from task text: the task assumed the real Medusa v2 SDK, but the installed @medusajs/medusa-js@2.0.2 is the legacy v1-style client. Verified method names against the package and adapted: auth.authenticate (not auth.create), customers.listOrders (not orders.list), carts.update({discounts}) (not carts.addDiscount). All documented with evidence in the report. M3b tasks were intentionally left untouched."
}
```