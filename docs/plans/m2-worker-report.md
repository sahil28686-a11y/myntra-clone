# M2 Worker Report — Custom v2 Modules + Store API Routes + Seed Extensions

**Project:** Myntra Clone — `E:/Projects/ecom store`
**Milestone:** M2 (Custom Medusa v2 modules + store API routes + seed extensions — code + tsc only)
**Date:** 2026-07-07

---

## 1. Summary

Built the 4 custom Medusa v2 modules (Pincode, Review, Wishlist, Return-request) as proper
`model.define()` + `Module()` + `MedusaService` modules, 7 store API routes, registered all 4
modules in `medusa-config.ts` (array form), wired v2 `authenticate("customer", …)` middleware for
auth-required routes, and extended `seed.ts` with 30 pincodes, GST tax rates, and a default admin
user. **`npx tsc --noEmit` passes with 0 errors.** No Docker / server / migrations run (per
constraints). Every v2 API pattern was verified against the installed `backend/node_modules/@medusajs/*`
packages; evidence is cited in §3.

---

## 2. Files created / modified

### Created — modules (4 × 3 files)
- `backend/src/modules/pincode/index.ts` — `Module("pincode", { service })`
- `backend/src/modules/pincode/models/pincode.ts` — `model.define("pincode", { id, code, is_serviceable, estimated_days, city, state })`
- `backend/src/modules/pincode/service.ts` — `extends MedusaService({ Pincode })` + `getPincode(code)`
- `backend/src/modules/review/index.ts` — `Module("review", { service })`
- `backend/src/modules/review/models/review.ts` — `model.define("review", { id, product_id, customer_id, rating, title, body, images(json), is_verified })`
- `backend/src/modules/review/service.ts` — `getAverageRating(productId)` → `{ average, count }` + `listReviews`/`createReview` (via MedusaService)
- `backend/src/modules/wishlist/index.ts` — `Module("wishlist", { service })`
- `backend/src/modules/wishlist/models/wishlist.ts` — `model.define("wishlist", { id, customer_id, product_id, variant_id nullable })`
- `backend/src/modules/wishlist/service.ts` — `addWishlist` (dedup by customer+product+variant) + `removeWishlist(id, customerId)` (ownership)
- `backend/src/modules/return-request/index.ts` — `Module("return_request", { service })`
- `backend/src/modules/return-request/models/return-request.ts` — `model.define("return_request", { id, order_id, customer_id, items(json), status, pickup_address(json nullable) })`
- `backend/src/modules/return-request/service.ts` — `getReturn(id, customerId)` (ownership) + `listReturns`/`createReturn` (via MedusaService)

### Created — store API routes (7)
- `backend/src/api/store/pincodes/[code]/route.ts` — `GET` (public) → `{ pincode, is_serviceable, estimated_days, city, state }` or 404
- `backend/src/api/store/reviews/[product_id]/route.ts` — `GET` (public) → `{ reviews, total, average_rating }`
- `backend/src/api/store/reviews/route.ts` — `POST` (auth) → creates a review
- `backend/src/api/store/wishlist/route.ts` — `GET` (auth) + `POST` (auth, dedup)
- `backend/src/api/store/wishlist/[id]/route.ts` — `DELETE` (auth + ownership)
- `backend/src/api/store/returns/route.ts` — `GET` (auth, customer-scoped) + `POST` (auth)
- `backend/src/api/store/returns/[id]/route.ts` — `GET` (auth + ownership)

### Modified
- `backend/medusa-config.ts` — `modules: {}` → `modules: [ { resolve, key } × 4 ]` (array form)
- `backend/src/api/middlewares.ts` — `routes: []` → 5 `authenticate("customer", ["session","bearer"])` middleware entries for review POST, wishlist GET/POST/DELETE, returns GET/POST
- `backend/src/scripts/seed.ts` — added pincodes (30), GST tax rates (India region default 18% + 0/5/12/28 slabs), default admin user `admin@myntra-clone.com`/`admin123`; kept region+products+categories from M1; idempotent guards

### Not touched (per hard constraints)
- No storefront files. No Docker / `medusa develop` / `medusa db:migrate` run.
- `src/admin/**` unchanged (still compiles). `_v1-archive/**` unchanged.

---

## 3. v2 API patterns verified against installed packages (with file/line evidence)

All verification was by inspecting `backend/node_modules/@medusajs/*` (v2.17.2), not by assuming docs.

### 3.1 Module base class (`Module`) + service base (`MedusaService`) + DML (`model`)
- `@medusajs/framework/utils` re-exports `@medusajs/utils` wholesale
  (`framework/dist/utils/index.d.ts` → `export * from "@medusajs/utils"`).
- `Module` function: `@medusajs/utils/dist/modules-sdk/module.d.ts` line 11
  (`export declare function Module(serviceName, { service, loaders })`).
- `MedusaService` factory: `@medusajs/utils/dist/modules-sdk/medusa-service.d.ts` line 42
  (`MedusaService(models): MedusaServiceReturnType<…>`).
- `model` builder: `@medusajs/utils/dist/dml/entity-builder.d.ts` line 399
  (`export declare const model: EntityBuilder`) with `model.define(nameOrConfig, schema)`
  (line 92). DML properties verified in `@medusajs/utils/dist/dml/properties/index.d.ts`
  (`text`, `boolean`, `number`, `json`, `id`, `.nullable()`, `.searchable()`, `.primaryKey()`).
- **Canonical example mirrored:** `@medusajs/user/dist/index.js` does
  `Module(Modules.USER, { service: UserModuleService })`; `models/user.js` does
  `model.define("user", { id: model.id({ prefix: "user" }).primaryKey(), … })`;
  `services/user-module.js` does `class UserModuleService extends MedusaService({ User, Invite })`.
  The custom modules here follow this exact pattern.

### 3.2 Array-form module registration
- `@medusajs/types/dist/common/config-module.d.ts` line 1173: `InputConfigModules = (KnownModuleConfigs | GenericModuleConfig | …)[]`;
  line 1183: `InputConfigWithArrayModules = InputConfigBase & { modules?: InputConfigModules }`.
  Each entry: `{ resolve: string, key?: string, options?, disable? }` (lines 1138–1160).
- The object form `{}` is deprecated; `defineConfig` recommends the array form (line 9–11 of
  `@medusajs/utils/dist/common/define-config.d.ts`). `medusa-config.ts` now uses the array form.

### 3.3 Auth context for store routes
- `@medusajs/framework/dist/http/types.d.ts` line 159: `AuthContext { actor_id, actor_type,
  auth_identity_id, app_metadata, … }`; line 190: `MedusaStoreRequest extends MedusaRequest` with
  optional `auth_context?: AuthContext`; line 184: `AuthenticatedMedusaRequest` has required
  `auth_context`.
- **Canonical usage:** `@medusajs/medusa/dist/api/store/customers/me/route.js` reads
  `const id = req.auth_context.actor_id` for the logged-in customer. Custom auth routes use
  the same `req.auth_context.actor_id` (typed as `MedusaStoreRequest`).
- `authenticate` middleware: `@medusajs/framework/dist/http/middlewares/authenticate-middleware.d.ts`
  (`authenticate(actorType, authType, opts)`), re-exported via
  `@medusajs/medusa/dist/utils/middlewares/index.d.ts` (`export { authenticate }`).
  `import { defineMiddlewares, authenticate } from "@medusajs/medusa"` resolves (verified by tsc).
- **Middleware pattern mirrored:** `@medusajs/medusa/dist/api/store/customers/middlewares.js` uses
  `authenticate("customer", ["session", "bearer"])` with matcher strings. The 5 entries in
  `src/api/middlewares.ts` follow this shape.

### 3.4 Tax service (GST seed)
- `Modules.TAX = "tax"` (`@medusajs/utils/dist/modules-sdk/definition.d.ts` line 15/92).
- `@medusajs/tax/dist/services/tax-module-service.d.ts`: `createTaxRegions(CreateTaxRegionDTO)` (line 145),
  `createTaxRates(CreateTaxRateDTO)` (line 36), `listTaxRegions` / `listTaxRates` (service.d.ts in types).
- `CreateTaxRegionDTO` (`@medusajs/types/dist/tax/mutations.d.ts` line 158): `country_code`, optional
  `default_tax_rate: { rate, code, name }` — used to seed the India region with default 18% GST.
- `CreateTaxRateDTO` (line 8): `tax_region_id`, `rate`, `code`, `name`, `is_default` — used for the
  0/5/12/28 slabs.

### 3.5 Default admin user creation
- **Mirrored the `medusa user` CLI** (`@medusajs/medusa/dist/commands/user.js`):
  1. `workflowService.run("create-users-workflow", { input: { users: [{ email, first_name, last_name }] } })`
     → workflow id confirmed in `@medusajs/core-flows/dist/user/workflows/create-users.d.ts`
     (`createUsersWorkflowId = "create-users-workflow"`).
  2. `authService.register("emailpass", { body: { email, password } })` → returns
     `{ success, authIdentity, error }` (type `AuthenticationResponse`,
     `@medusajs/types/dist/auth/common/provider.d.ts` line 8).
  3. `authService.updateAuthIdentities({ id: authIdentity.id, app_metadata: { user_id: user.id } })`
     (verified on the CLI source lines 64–84).
- Module keys: `Modules.USER = "user"`, `Modules.AUTH = "auth"`,
  `Modules.WORKFLOW_ENGINE = "workflows"` (definition.d.ts lines 18/3/19).
- `listUsers({ email })` filter (`@medusajs/types/dist/user/common.d.ts` line 64) used for idempotency.
- **Fallback:** if `create-users-workflow` is unavailable in the seed container (worker mode), the
  seed falls back to `userModule.createUsers({ email, first_name, last_name })`
  (`@medusajs/user` service has `createUsers`).

### 3.6 Pincode module service resolution
- Custom modules registered with `Module("pincode", { service })` resolve via
  `container.resolve("pincode")` (and `req.scope.resolve("pincode")` in routes). The `key` field in
  `medusa-config.ts` is explicit and matches the `Module()` first argument.

---

## 4. Validation output (exact)

```
$ cd backend && npx tsc --noEmit
---EXIT=0---
(no output — 0 errors)
```

```
$ cd backend && npm install --dry-run
added 51 packages in 1s
114 packages are looking for funding
… (dry-run resolves cleanly, no errors)
```

### Acceptance contract checks
| # | Check | Result |
|---|-------|--------|
| 1 | `npx tsc --noEmit` | **0 errors** (exit 0) |
| 2 | 4 modules exist with `model.define()` + `Module()` + service | PASS (12 files under `src/modules/`) |
| 3 | 7 store routes exist | PASS (`store/pincodes/[code]`, `store/reviews/[product_id]`, `store/reviews`, `store/wishlist`, `store/wishlist/[id]`, `store/returns`, `store/returns/[id]`) |
| 4 | `medusa-config.ts` registers all 4 custom modules | PASS (array form, 4 entries) |
| 5 | `seed.ts` includes pincodes + GST + default admin user | PASS (sections 4/5/6) |
| 6 | `npm install --dry-run` clean | PASS |
| 7 | `src/admin/**` still compiles | PASS (unchanged; covered by tsc) |
| 8 | No staged files | PASS (`git diff --cached` empty; all changes in working tree) |

---

## 5. Assumptions made

1. **Custom module service resolution key = `Module()` first arg.** A module defined with
   `Module("pincode", …)` registers under key `"pincode"`; routes resolve it via
   `req.scope.resolve("pincode")`. The `key:` field in `medusa-config.ts` is set explicitly to match
   (belt-and-suspenders). This follows the core-module pattern (`@medusajs/user` registers under
   `Modules.USER = "user"`).
2. **GST "flat per-product rate" implemented as the India tax region's default rate (18%).**
   Medusa v2 tax rates bind to tax *regions*, not directly to products; the region's
   `default_tax_rate` applies to every product sold into that region absent per-rule overrides.
   Per resolved decision §6.5 (flat per-product GST for MVP), this is the correct minimal
   implementation. The 0/5/12/28 slabs are also seeded as named tax-rate codes for future
   per-category rule wiring. Per-product/per-category tax rules are explicitly out of M2 scope.
3. **`MedusaService` auto-CRUD method names** are inferred from the model map: a model named
   `Pincode` yields `createPincodes`/`listPincodes`/`retrievePincode`/`deletePincodes`/`updatePincodes`;
   `Review` → `createReviews`/`listReviews`/`retrieveReview`; `Wishlist` → `createWishlists`/
   `listWishlists`/`retrieveWishlist`/`deleteWishlists`; `ReturnRequest` → `createReturnRequests`/
   `listReturnRequests`/`retrieveReturnRequest`/`deleteReturnRequests`. These are produced by the
   `MedusaService` factory (verified by the core `UserModuleService` exposing `createUsers`,
   `listUsers`, etc. from `MedusaService({ User, Invite })`). Custom service methods (`getPincode`,
   `getAverageRating`, `addWishlist`, `removeWishlist`, `getReturn`) wrap these.
4. **`MedusaStoreRequest` typing for auth routes.** Store routes are typed with
   `MedusaStoreRequest` (optional `auth_context`); auth presence is enforced by the
   `authenticate("customer", …)` middleware AND a defensive `req.auth_context?.actor_id` check inside
   each handler (double-guard, mirrors core `customers/me` which relies on middleware + reads
   `actor_id` directly).
5. **`is_verified` review default** is `false` on creation (set by a future order-completion flow).
6. **Admin user idempotency** is keyed on `userModule.listUsers({ email })`. If the user exists the
   whole admin section is skipped (auth identity is assumed to already exist). Re-running seed is safe.
7. **`create-users-workflow` fallback.** The seed first tries the workflow engine (canonical CLI
   path) and falls back to `userModule.createUsers` if the workflow engine is unavailable in the
   `medusa exec` container context. Both paths then register the emailpass auth identity and link it.
8. **No COD payment provider wiring in seed.** Per M1 note, no v2 manual/COD payment provider package
   is installed; COD provider wiring is M4 scope (resolved decision §6.1 confirms COD-only payments,
   but the provider module itself must be added/registered before checkout can offer COD). The seed
   does not register a non-existent provider.

---

## 6. Blockers / things that will matter once Docker is up

- **Docker is off** (per constraints) → runtime verification is pending. Once Postgres+Redis are up:
  - `npx medusa db:migrate` must be run BEFORE seed — it creates the `pincode`, `review`, `wishlist`,
    and `return_request` tables from the DML models. Without it the seed's pincode inserts will fail.
  - `npm run seed` then seeds pincodes + GST + admin user + region/products/categories.
  - `npm run dev` boots; verify:
    - `curl http://localhost:9000/store/pincodes/110001` → `{ is_serviceable: true, estimated_days: 2 }`
    - `curl http://localhost:9000/store/pincodes/194101` → `{ is_serviceable: false }` (non-serviceable row exists; the route returns the row, not a 404 — a non-serviceable pincode is still a "found" pincode)
    - `curl http://localhost:9000/store/pincodes/999999` → 404 (truly absent)
    - `curl http://localhost:9000/store/reviews/<product_id>` → `{ reviews: [], total: 0, average_rating: 0 }`
    - Wishlist/returns require a customer session (`authenticate("customer", ["session","bearer"])`).
- **Module registration keys at runtime.** If `container.resolve("pincode")` / `"review"` /
  `"wishlist"` / `"return_request"` does not resolve, the `key:` field in `medusa-config.ts` may need
  to be removed (let it be inferred from `Module()`'s first arg) or the resolve name adjusted. The
  array-form `{ resolve: "./src/modules/x", key: "x" }` is the documented v2 pattern, but first-boot
  confirmation is required.
- **Admin login.** After seeding, the admin should be able to log in at `http://localhost:9000/app`
  with `admin@myntra-clone.com` / `admin123`. The password MUST be changed immediately (documented in
  the seed log + deployment guide to-do). If the `create-users-workflow` path is the one that ran
  (not the fallback), RBAC super-admin role assignment depends on the `rbac` feature flag (off by
  default) — the CLI only assigns the role when `FeatureFlag.isFeatureEnabled("rbac")`. Without RBAC
  the user is a plain admin, which is sufficient for the native admin login.
- **Auth identity duplication.** If the seed is interrupted between user creation and auth identity
  registration, a re-run will skip (user exists) and NOT re-create the auth identity — leaving an
  unlinked user. Mitigation: the idempotency guard is at the user level; if a partial run is
  suspected, the operator should delete the admin user + auth identity and re-seed. (Acceptable for
  a dev seed.)
- **`is_verified` reviews / verified-buyer flow** is not implemented (out of M2 scope).
- **Return-request has no admin-side status-advancement route** (out of M2 scope; the model + store
  create/list/get are the M2 surface).

---

## 7. What was NOT touched (per hard constraints)

- No storefront files edited.
- No Docker / `medusa develop` / `medusa start` / `medusa db:migrate` run.
- `src/admin/**` not modified (still compiles).
- Single writer — only the backend was modified in this run.
- No v1 files moved/deleted (M1 already archived v1).