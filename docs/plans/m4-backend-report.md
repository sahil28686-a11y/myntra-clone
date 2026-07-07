# M4 — Backend Runtime Verification Report

**Date:** 2026-07-07
**Backend:** Medusa v2 (`@medusajs/framework` / `@medusajs/medusa` 2.17.2)
**Project:** Myntra Clone — `E:/Projects/ecom store`

## TL;DR

The v2 backend **boots and serves data end-to-end**. The store API, custom
pincodes/reviews endpoints, admin app, and admin auth all work. Three small
mechanical backend fixes were required to get there (config export syntax,
tsconfig module system, and missing sales-channel link in the seed). The
storefront will **NOT** work as-is against this v2 backend — it must migrate
from `@medusajs/medusa-js` (v1-era) to `@medusajs/js-sdk` (v2) and adapt to
the v2 response shape (prices live in `variants[].calculated_price`, not
`variants[].prices`).

---

## 1. Postgres + Redis

**Command:**
```
docker compose -f docker-compose.yml up -d postgres redis
```
**Output:** Containers `myntra-postgres` and `myntra-redis` created and started
(compose file was usable as-is — no fallback `docker run` needed).

**Health verification:**
```
$ docker ps --format '{{.Names}}\t{{.Status}}'
myntra-postgres   Up (healthy)
myntra-redis      Up (healthy)

$ docker exec myntra-postgres pg_isready -U myntra -d myntra_store
/var/run/postgresql:5432 - accepting connections

$ docker exec myntra-redis redis-cli ping
PONG
```
✅ Both healthy.

---

## 2. `backend/.env` (gitignored)

Created fresh at `backend/.env`:
```
DATABASE_URL=postgres://myntra:myntra_pass@localhost:5432/myntra_store
REDIS_URL=redis://localhost:6379
JWT_SECRET=m4-dev-jwt-secret-32chars-min
COOKIE_SECRET=m4-dev-cookie-secret-32chars
STORE_CORS=http://localhost:3000
ADMIN_CORS=http://localhost:9000
AUTH_CORS=http://localhost:9000
MEDUSA_DISABLE_TELEMETRY=true
```
`git check-ignore backend/.env` → ignored (not committed).

---

## 3. Migrate

### First attempt — blocked (fix #1, fix #2)

`npx medusa db:migrate` failed twice; both were small mechanical backend
issues, fixed in backend files only:

**Fix #1 — `backend/medusa-config.ts`:** the config used
`module.exports = defineConfig({...})` (CommonJS) but the Medusa CLI loads
`.ts` as ESM, producing `ReferenceError: module is not defined in ES module
scope`. Changed to `export default defineConfig({...})`. This is the standard
v2 config shape.

**Fix #2 — `backend/tsconfig.json`:** the M1 tsconfig had
`"module": "ES2022", "moduleResolution": "Bundler"`. ts-node (used by the
Medusa CLI) then emitted ESM, and the custom module `index.ts` files import
`./service` **extensionless** — ESM resolution requires explicit extensions,
so every custom module failed with
`ERR_MODULE_NOT_FOUND: Cannot find module '.../src/modules/pincode/service'`.

Switching to `"module": "NodeNext", "moduleResolution": "NodeNext"` fixes it:
the backend `package.json` has no `"type": "module"`, so `.ts` files are in a
**CommonJS context** → ts-node emits CJS → extensionless relative imports
compile to `require("./service")` (works) → the framework's `dynamicImport`
(`require()`) loads them. `NodeNext` also resolves the framework's `exports`
subpaths (`@medusajs/framework/utils`) that `moduleResolution: "Node"` (node10)
cannot. `npx tsc --noEmit` passes with **0 errors** under this setting.

### Migration run (after fixes)

```
$ cd backend && npx medusa db:migrate
... MODULE: pincode  → Migration20260707110133.ts applied
... MODULE: review   → Migration20260707110134.ts applied
... MODULE: wishlist → Migration20260707110135.ts applied
... MODULE: return_request → Migration20260707110136.ts applied
... Migrations completed
... Links sync completed
... Migration scripts completed (5 scripts: currency normalize, product option
    link ids, product shipping profile, tax region provider, inventory reconcile)
```

> **Note:** The custom module `migrations/` directories were initially **empty**
> (the M1/M2 scaffold created the directories but never ran
> `medusa db:generate`). The first `db:migrate` reported "Skipped. Database is
> up-to-date for module" because there were zero migration files to run, so the
> `pincode`/`review`/`wishlist`/`return_request` tables did **not** exist.
> Running `npx medusa db:generate pincode review wishlist return_request`
> generated the 4 `Migration*.ts` files from the DML model definitions; a
> subsequent `db:migrate` created the tables. **This is a required one-time step
> for any fresh clone of this repo.**

**Table verification:**
```
$ docker exec myntra-postgres psql -U myntra -d myntra_store -c \
    "SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename IN
     ('pincode','review','wishlist','return_request') ORDER BY tablename;"
 pincode
 return_request
 review
 wishlist
(4 rows)
```
✅ All 4 custom tables created (plus all core v2 tables: product, region,
tax_region, sales_channel, api_key, etc.).

---

## 4. Seed

```
$ cd backend && npm run seed   # = medusa exec src/scripts/seed.ts
✓ India region created (INR, country IN)
✓ Category created: Men / Women / Kids / Home & Living / Beauty / Topwear /
  Bottomwear / Footwear / Ethnic Wear / Western Wear   (10 categories)
✓ Product created: Classic Fit Polo T-Shirt (prod_01KWY3X549ECDHH82JHCMGP0SB)
✓ Product created: Slim Fit Jeans       (prod_01KWY3X5AFVGKTSB6A1NH60MAY)
✓ Product created: Embroidered Kurta Set(prod_01KWY3X5ER7MMBZZ4REK01B0C4)
✓ Product created: Running Shoes        (prod_01KWY3X5JGTTEH8QC454K1E2N4)
✓ Product created: Floral Print Dress   (prod_01KWY3X5P7C4B6KB4W5N882MTK)  (5 products)
✓ 30 pincodes created
✓ India tax region created (default 18% GST)
✓ 4 additional GST slabs created   (GST-0 / GST-5 / GST-12 / GST-28)
✓ Default admin user created (admin@myntra-clone.com). Change the password immediately.
Seed complete.
```
✅ Seed completed. All seeded counts match the script.

### Fix #3 — `backend/src/scripts/seed.ts` (sales-channel link)

After seeding, `/store/products` returned **0 products** even with a valid
publishable API key, because the seeded products were **not linked to any
sales channel**. Medusa v2's store product API filters by the sales channel
of the request's publishable API key, so unlinked products are invisible.

The v2 core migrations auto-create a `Default Sales Channel`
(`sc_01KWY3X503VFQTWCXSSYCQS63K`) and a `Default Publishable API Key`
(`apk_01KWY3X51DADTN9X6DTYHP4Y1Q`, token
`pk_91ca8864dd17243297fcbd5afda4b2c2d41e3eee8ff0facf20ab9c9f3b7350b7`)
and link the two — but the seed never linked products to the channel
(`product_sales_channel` had 0 rows).

**Immediate fix (runtime, for the current DB):** inserted the 5 product→SC
links directly:
```sql
INSERT INTO product_sales_channel (product_id, sales_channel_id, id, created_at, updated_at)
SELECT p.id, 'sc_01KWY3X503VFQTWCXSSYCQS63K', 'pscl_'||p.id, now(), now()
FROM product p WHERE NOT EXISTS (SELECT 1 FROM product_sales_channel x
  WHERE x.product_id=p.id AND x.sales_channel_id='sc_01KWY3X503VFQTWCXSSYCQS63K');
-- INSERT 0 5
```

**Permanent fix (seed script):** added a `3b.` block to `seed.ts` that resolves
`Modules.SALES_CHANNEL`, finds the `Default Sales Channel`, and links every
seeded product to it via `remoteLink.create(...)` (idempotent — skips already
linked products). `npx tsc --noEmit` still passes with 0 errors.

---

## 5. Boot (`medusa develop`)

```
$ cd backend && nohup npm run dev > "E:/Projects/ecom store/m4-dev.log" 2>&1 &
```
> The dev server's file watcher restart-loops if the log file lives inside the
> watched `backend/` tree, so the log is written to the project root
> (`m4-dev.log`, outside `backend/`). A leftover process from an earlier run
> held port 9000 (`EADDRINUSE`); it was killed (`taskkill //PID 29192 //F`)
> before the successful boot.

**Boot log tail:**
```
✔ Server is ready on port: 9000 – 6880ms
info:    Admin URL → http://localhost:9000/app
```

**Health poll:**
```
$ curl -s -w "\nHTTP:%{http_code}\n" http://localhost:9000/health
OK
HTTP:200
```
✅ Server running, `/health` 200. **Left running** for the storefront E2E step
(per instructions). Postgres + Redis containers also left running.

---

## 6. Endpoint verification (curl)

> **Important v2 behavior:** every `/store/*` route (including the custom
> pincodes/reviews routes) requires the `x-publishable-api-key` header set to
> the API key **token** (`pk_...`), not the key **id** (`apk_...`). Using the
> id yields `400 {"type":"not_allowed","message":"A valid publishable key is
> required to proceed with the request"}`.

Publishable API key token used:
`pk_91ca8864dd17243297fcbd5afda4b2c2d41e3eee8ff0facf20ab9c9f3b7350b7`

### 6a. `GET /health`
```
HTTP:200  body: OK
```

### 6b. `GET /store/products`  (with header)
```
HTTP:200
count: 5   products returned: 5
```
**Real product[0] JSON shape** (top-level fields):
```
['id','title','subtitle','description','handle','is_giftcard','discountable',
 'thumbnail','collection_id','type_id','weight','length','height','width',
 'hs_code','origin_country','mid_code','material','created_at','updated_at',
 'type','collection','options','tags','images','variants']
```
- `thumbnail`: `"https://assets.myntassets.com/.../placeholder-mens-polo.jpg"` ✅
- `images`: `[{ id, url, metadata, rank, product_id, ... }]` ✅
- `collection`: `null` (no collection seeded) ⚠️
- `categories`: **NOT present** in default field set (must be requested via
  `fields`) ⚠️
- `options`: `[{ id, title, values: [{ id, value, ... }] }]` ✅

**Variant[0] shape (default request — NO prices):**
```
['id','title','sku','barcode','ean','upc','allow_backorder','manage_inventory',
 'hs_code','origin_country','mid_code','material','weight','length','height',
 'width','metadata','variant_rank','thumbnail','product_id','created_at',
 'updated_at','deleted_at','options']
```
⚠️ **No `prices`, no `calculated_price` by default.**

**Variant[0] shape with `?fields=+variants.calculated_price&region_id=<reg_id>`:**
- adds key `calculated_price`:
```json
{
  "id": "pset_01KWY3X56NWVVGFW3QAZ22E8D5",
  "is_calculated_price_price_list": false,
  "is_calculated_price_tax_inclusive": false,
  "calculated_amount": 129900,
  "raw_calculated_amount": { "value": "129900", "precision": 20 },
  "is_original_price_price_list": false,
  "is_original_price_tax_inclusive": false,
  "original_amount": 129900,
  "raw_original_amount": { "value": "129900", "precision": 20 },
  "currency_code": "inr",
  "calculated_price": { "id": "...", "price_list_id": null, ... },
  "original_price":  { "id": "...", "price_list_id": null, ... }
}
```
✅ Price is in **paise** (`calculated_amount: 129900` = ₹1,299), as expected.
Note: requesting `calculated_price` **without** `region_id` returns
`400 {"message":"Missing required pricing context to calculate prices -
region_id"}`.

### 6c. `GET /store/pincodes/110001` (serviceable)
```
HTTP:200
{"pincode":"110001","is_serviceable":true,"estimated_days":2,"city":"New Delhi","state":"Delhi"}
```
✅ Matches expected shape.

### 6d. `GET /store/pincodes/194101` (Leh — non-serviceable)
```
HTTP:200
{"pincode":"194101","is_serviceable":false,"estimated_days":0,"city":"Leh","state":"Ladakh"}
```
✅ Non-serviceable, 200 (row exists).

### 6e. `GET /store/pincodes/999999` (not found)
```
HTTP:404
{"type":"not_found","message":"Pincode 999999 not found"}
```
✅ 404 as expected.

### 6f. `GET /store/reviews/<real product_id>`
```
product_id = prod_01KWY3X549ECDHH82JHCMGP0SB
HTTP:200
{"reviews":[],"total":0,"average_rating":0}
```
✅ Correct shape `{ reviews, total, average_rating }`. Empty because no reviews
were seeded (expected — the seed script does not create reviews).

### 6g. `GET /app` (admin HTML)
```
HTTP:200  content-type: text/html  size: 743
<!DOCTYPE html><html><head>
  <script type="module">import { injectIntoGlobalHook } from "/app/@react-refresh"; ...
  <script type="module" src="/app/@vite/client"></script>
```
✅ v2 admin app (Vite-served) loads.

### 6h. `GET /store/products?category_id[]=...` (category filter)
```
category_id (men-topwear) = pcat_01KWY3X53DJ077V3NQ713T3NEW
HTTP:200  count: 1
 - Classic Fit Polo T-Shirt (prod_01KWY3X549ECDHH82JHCMGP0SB)
```
✅ Category filter works (1 product in `men-topwear`).

---

## 7. Admin auth smoke test

The v2 admin auth path (verified by inspecting
`backend/node_modules/@medusajs/medusa/dist/api/auth/[actor_type]/[auth_provider]`)
is `POST /auth/<actor_type>/<provider>` → for admin email/password:
`POST /auth/user/emailpass`.

**Step 1 — `POST /auth/user/emailpass`:**
```
$ curl -X POST http://localhost:9000/auth/user/emailpass \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@myntra-clone.com","password":"admin123"}'
HTTP:200
{"token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.<payload>..."}   (432-char JWT)
```
JWT payload decodes to `actor_type: "user"`, `actor_id: "user_01KWY3X5SH4J49WGQQB6KBK3D7"`,
`app_metadata.user_id`: same. ✅

**Step 2 — `POST /auth/session` (exchange Bearer token for session cookie):**
```
$ curl -X POST http://localhost:9000/auth/session \
    -H "Authorization: Bearer <token>"
HTTP:200
{"user":{"actor_id":"user_01KWY3X5SH4J49WGQQB6KBK3D7","actor_type":"user",
  "auth_identity_id":"authid_01KWY3X5VMR4DDPKM6BTA4JGKE",
  "auth_provider":"emailpass","app_metadata":{"user_id":"..."}, ...}}
```
✅ Session minted.

**Step 3 — `GET /admin/users` (with session cookie):**
```
HTTP:200
{"users":[{"id":"user_01KWY3X5SH4J49WGQQB6KBK3D7","first_name":"Admin",
  "last_name":"User","email":"admin@myntra-clone.com",...}],"count":1,...}
```
✅ Admin auth fully works end-to-end. The seeded admin
`admin@myntra-clone.com` / `admin123` is functional.

---

## 8. SDK compatibility verdict

**Installed SDKs (storefront):**
- `@medusajs/medusa-js@2.0.2` — the **v1-era** JS client (what `storefront/src/lib/api.ts` imports).
- `@medusajs/js-sdk@2.17.2` — the **v2** SDK (matches the backend; NOT used by the storefront).

### The storefront will **NOT** work as-is. It needs `@medusajs/js-sdk` + response-shape mapping.

Evidence (comparing `storefront/src/lib/api.ts` + `ProductCard.tsx` against the
real `/store/products` response):

| Storefront expectation | Real v2 response | Status |
|---|---|---|
| `variant.prices: {amount, currency_code}[]` (`getVariantPrice` reads this) | **No `prices` array**; price is `variant.calculated_price.calculated_amount` (paise), only present when `region_id` + `fields=+variants.calculated_price` are passed | ❌ **Broken** — `getVariantPrice` returns 0 → `ProductCard` shows ₹0 for every product |
| `getProducts()` passes no `region_id`, no `fields` | v2 returns no prices without region context (400 if `calculated_price` requested without `region_id`) | ❌ No prices ever returned |
| `new Medusa({ baseUrl, maxRetries })` — no publishable API key | v2 requires `x-publishable-api-key` header on **every** `/store/*` call (else 400) | ❌ All store calls 400 |
| `medusaClient.auth.authenticate({email,password})` (v1 `/store/auth`) | v2 storefront auth is `POST /auth/customer/emailpass` → `POST /auth/session` (cookie) | ❌ Login broken |
| `MedusaProduct.collection: {id,title,handle}` | `collection: null` (no collection seeded) | ⚠️ Null; PLP "brand" label will be empty |
| `MedusaProduct.categories: {id,name}[]` | `categories` **not in default fields** (must request via `fields`) | ⚠️ Missing unless explicitly selected |
| `variant.inventory_quantity` | not in default v2 variant fields | ⚠️ Missing |
| `medusaClient.carts.*`, `orders.*`, `customers.*` | v1-era method names/paths; v2 cart/order/customer APIs differ (e.g. v2 orders are under the order module, cart totals shape differs) | ⚠️ Likely partial breakage |

### Required storefront changes (out of M4 scope — for the storefront worker):

1. **Switch the client** from `@medusajs/medusa-js` to `@medusajs/js-sdk`
   (`@medusajs/js-sdk@2.17.2` is already installed). Configure it with the
   publishable API key **token** and a default region:
   ```ts
   import Medusa from "@medusajs/js-sdk"
   export const sdk = new Medusa({
     baseUrl: process.env.NEXT_PUBLIC_MEDUSA_URL || "http://localhost:9000",
     publishableApiKey: process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY,
     auth: { type: "session" }, // storefront cookie auth
   })
   ```
   The publishable API key token (`pk_91ca88...`) must be exposed to the
   browser via `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY`.

2. **Price mapping:** replace `getVariantPrice`'s `variant.prices.find(...)`
   with reading `variant.calculated_price?.calculated_amount` (paise) and
   `variant.calculated_price?.original_amount`. Update the `MedusaVariant`
   type accordingly. `formatPrice` (÷100) already correctly assumes paise.

3. **`getProducts` / `getProduct`:** pass `region_id` (the India region
   `reg_01KWY3X522ZKGJ0V64P7WSNP42`) and `fields=+variants.calculated_price`
   (and `+categories` if the PLP needs category labels) so prices are returned.

4. **Auth:** replace `medusaClient.auth.authenticate` with the v2 flow
   (`sdk.auth.login(...)` → `/auth/customer/emailpass` → session cookie).

5. **Cart/Orders/Customers:** re-map to the v2 SDK resource methods and v2
   response shapes (cart totals, line items, order module).

### Bottom line
The `@medusajs/medusa-js` vs `@medusajs/js-sdk` question is resolved by the
real response: **`@medusajs/js-sdk` is required.** `@medusajs/medusa-js`
targets the v1 API shape (`variants[].prices[]`, `/store/auth`) and cannot
parse the v2 `calculated_price` shape or satisfy the publishable-API-key /
region-context requirements. The storefront needs `@medusajs/js-sdk` plus
response-shape mapping in `api.ts`/`ProductCard.tsx`.

---

## Backend fixes applied (summary)

| # | File | Change | Reason | Evidence |
|---|---|---|---|---|
| 1 | `backend/medusa-config.ts` | `module.exports =` → `export default` | CLI loads `.ts` as ESM; `module.exports` threw `ReferenceError: module is not defined in ES module scope` | migrate error before fix; 0 errors after |
| 2 | `backend/tsconfig.json` | `module`/`moduleResolution`: `ES2022`/`Bundler` → `NodeNext`/`NodeNext` | ESM emission made extensionless `./service` imports in custom modules unresolvable (`ERR_MODULE_NOT_FOUND`); NodeNext + CJS context (no `type:module` in package.json) emits CJS where `require("./service")` works, and resolves framework `exports` subpaths | migrate error before; tsc 0 errors + migrate succeeds after |
| 3 | `backend/src/scripts/seed.ts` | Added `Modules.SALES_CHANNEL` resolution + idempotent block linking all seeded products to the `Default Sales Channel` via `remoteLink` | Seeded products had no sales-channel link → `/store/products` returned 0 (v2 filters by the API key's sales channel) | `product_sales_channel` count 0 before; 5 after; `/store/products` returns 5 |

**Generated artifacts (untracked, should be committed):**
- `backend/src/modules/pincode/migrations/Migration20260707110133.ts`
- `backend/src/modules/review/migrations/Migration20260707110134.ts`
- `backend/src/modules/wishlist/migrations/Migration20260707110135.ts`
- `backend/src/modules/return-request/migrations/Migration20260707110136.ts`

These are produced by `npx medusa db:generate <modules>` from the DML models
and are required for `db:migrate` to create the custom tables on a fresh DB.

**Immediate runtime fix (not a file change):** inserted 5 rows into
`product_sales_channel` to make the already-seeded products visible to the
store API. The seed-script change (#3) makes this permanent for future seeds.

---

## Blockers / residual risks

- **No blockers** for the backend — it boots, migrates, seeds, and serves.
- **Storefront is blocked** on the SDK migration described in §8 (out of M4
  scope — storefront files are owned by another worker and were not touched).
- **COD payment provider** is not wired (per plan, R7 — no manual/COD provider
  package installed; default modules register stripe + manual fulfillment).
  Checkout payment flow is not verified here.
- **`medusa db:generate` is a required one-time step** for fresh clones (the
  scaffold ships empty `migrations/` dirs). Consider adding it to setup docs
  or a `db:setup` script invocation.
- The dev server's file watcher restart-loops if logs are written inside
  `backend/`; logs were redirected to the project root. A `dev-server*.log`
  pattern is already in `.gitignore`.
- Placeholder product images (`assets.myntassets.com/.../placeholder-*.jpg`)
  may not resolve — `next.config.js` `images.remotePatterns` still needs
  configuring (storefront task).
- **Admin password `admin123`** is weak and matches the plan's default — change
  before any non-local deployment.

---

## State left behind

- `myntra-postgres` and `myntra-redis` containers: **running** (healthy).
- `medusa develop` dev server: **running** on `http://localhost:9000`
  (background, log at `E:/Projects/ecom store/m4-dev.log`).
- `backend/.env`: present (gitignored).
- Seeded data: 1 region (India/INR), 10 categories, 5 products (paise prices),
  30 pincodes, 1 tax region (18% GST) + 4 slabs, 1 admin user, 1 publishable
  API key + 1 sales channel (products linked).

Publishable API key token for storefront use:
`pk_91ca8864dd17243297fcbd5afda4b2c2d41e3eee8ff0facf20ab9c9f3b7350b7`
India region id: `reg_01KWY3X522ZKGJ0V64P7WSNP42`