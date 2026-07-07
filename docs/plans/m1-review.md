# M1 Medusa v2 Backend Scaffold — Advisory Review

Review target: `E:/Projects/ecom store/backend` (M1 scaffold).
Mode: **advisory / read-only**. No project files were modified.
All claims verified against the **installed** packages
(`@medusajs/framework@2.17.2`, `@medusajs/medusa@2.17.2`,
`@medusajs/utils`, `@medusajs/modules-sdk`, `@medusajs/link-modules`,
`@medusajs/core-flows`, `@medusajs/types`).

## Verdict

The **config, middleware, tsconfig, and dependency** files are solid and
correct for v2. **However, `src/scripts/seed.ts` has FOUR blockers** in the
product-creation path that will make the very first `npm run seed` fail
(`medusa exec src/scripts/seed.ts`). Each is a small, mechanical fix. The
non-seed files need no changes.

---

## Blocker (must fix before seed will run)

### B1 — `createProducts` return shape mishandled (array vs single object)
- **File:** `backend/src/scripts/seed.ts:299,316`
- **Evidence:**
  - Seed calls `productModule.createProducts({ ...single object... })` and
    casts `as any[]`, then does `const created = createdProducts[0]`.
  - Installed `@medusajs/product` `product-module-service.js:1096`:
    ```js
    async createProducts(data, sharedContext = {}) {
      const input = Array.isArray(data) ? data : [data];
      ...
      return Array.isArray(data) ? createdProducts : createdProducts[0];
    }
    ```
  - A single (non-array) input returns a **single `ProductDTO` object**, not
    an array. `createdProducts[0]` is therefore `undefined`, and the next
    line `created.id` throws `TypeError: Cannot read properties of undefined`.
- **Smallest safe fix:** drop the `as any[]` cast and the `[0]` indexing:
  ```ts
  const created = (await productModule.createProducts({
    title: p.title,
    /* ...unchanged... */
  })) as any
  ```
  (The returned `ProductDTO` already includes populated `variants` — verified
  via `findByIdsWithSplitPopulate(..., ["options","options.values","variants","images","tags"])`
  at `product-module-service.js:1308`, so `created.variants` keeps working.)

### B2 — Wrong foreign-key name in variant↔price-set remote link
- **File:** `backend/src/scripts/seed.ts:334`
- **Evidence:**
  - Seed links with:
    ```ts
    { [Modules.PRODUCT]: { product_variant_id: variant.id },
      [Modules.PRICING]: { price_set_id: priceSet.id } }
    ```
  - Installed `@medusajs/link-modules` `definitions/product-variant-price-set.js`
    defines the `PRODUCT` side relationship with `foreignKey: "variant_id"`
    (not `product_variant_id`).
  - `@medusajs/modules-sdk` `link.js:90` `getLinkModule` looks the link up by
    the exact key `[moduleA, moduleAKey, moduleB, moduleBKey].join("-")`
    where `moduleAKey` is the property name passed in the create call
    (`getLinkDataConfig`, `link.js:237`). The registered pair key is
    `product-variant_id-pricing-price_set_id`; the seed produces
    `product-product_variant_id-pricing-price_set_id` → no match →
    `getLinkModuleOrThrow` throws a linking error.
  - Authoritative confirmation: the core
    `@medusajs/core-flows` `product/steps/create-variant-pricing-link.js`
    uses:
    ```js
    [Modules.PRODUCT]: { variant_id: entry.variant_id },
    [Modules.PRICING]: { price_set_id: entry.price_set_id },
    ```
- **Smallest safe fix:** rename the key:
  ```ts
  [Modules.PRODUCT]: { variant_id: variant.id },
  ```
  Also update the misleading header comment (seed.ts:7-8 and 44-45) that
  claims `product_variant_id` is "the documented v2 pattern" — the installed
  code shows it is `variant_id`.

### B3 — Variant `options` passed as array of `{ value }` instead of `Record<title, value>`
- **File:** `backend/src/scripts/seed.ts:147` (type), and every variant entry
  (e.g. `:175` `options: [{ value: "S" }, { value: "Navy Blue" }]`).
- **Evidence:**
  - `@medusajs/types` `product/common.d.ts` `CreateProductVariantDTO.options`
    is typed `Record<string, string>` — "Each key is an option's title, and
    value is the option's value."
  - The admin HTTP validator
    `@medusajs/medusa` `api/admin/products/validators.js:123,155` uses
    `z.record(z.string(), z.string())` for variant options.
  - At runtime, `product-module-service.js:1176` calls
    `validateProductCreatePayload`, which checks
    `variant.options?.[option.title]` (`:1448-1452`). With an array
    `[{value:"S"},{value:"Navy Blue"}]`, `variant.options["Size"]` is
    `undefined`, so every variant is pushed to `missingOptionsVariants` and
    the call throws
    `Product "..." has variants with missing options: [...]`.
  - Even past validation, `:1213-1224` iterates
    `Object.entries(variant.options)` expecting `[title, value]` pairs, which
    the array form does not provide.
- **Smallest safe fix:** change `VariantSeed.options` to
  `Record<string, string>` and each variant's options to
  `{ Size: "S", Color: "Navy Blue" }` (key = option `title`, value = option
  value). This is a mechanical rewrite of the variant `options` literals.

### B4 — Product `images` passed as `string[]` instead of `{ url: string }[]`
- **File:** `backend/src/scripts/seed.ts:158` (type) and each product's
  `images: [...]` literal (e.g. `:167`).
- **Evidence:**
  - `@medusajs/types` `product/common.d.ts` `CreateProductDTO.images` is
    `UpsertProductImageDTO[]` (`{ id?, url?, metadata? }`).
  - Admin validator `validators.js:172`:
    `images: z.array(z.object({ url: z.string() })).optional()`.
  - At runtime, `normalizeCreateProductInput`
    (`product-module-service.js:1489-1493`) does
    `productData.images.map((image) => image.rank != null ? image : { ...image, rank: index })`.
    For a string image, `{ ...("https://..."), rank }` yields an object with
    character-indexed numeric keys and **no `url`** property.
  - `@medusajs/product` `models/product-image.js` defines
    `url: model.text()` (NOT nullable). Persisting an image without `url`
    violates the NOT NULL constraint → DB error during
    `productService_.create(productsToCreate, ...)` (`:1265`).
- **Smallest safe fix:** pass `{ url }` objects:
  ```ts
  images: p.images.map((u) => ({ url: u }))
  ```
  (Or change `ProductSeed.images` to `{ url: string }[]` and adjust literals.)

> **Failure ordering:** B3 throws first (inside `createProducts` validation),
> then B4 (DB insert), then B1 (`[0]` indexing), then B2 (remote link). All
> four must be fixed for the seed to complete.

---

## Should-fix

### S1 — Redundant/misleading `key` field in `medusa-config.ts` modules array
- **File:** `backend/medusa-config.ts:24-27` and the preceding comment.
- **Evidence:** `@medusajs/utils` `common/define-config.js:66-77`
  `transformModules` does `delete moduleConfig.key` for non-external modules
  and instead resolves the registration name from the module's
  `joinerConfig.serviceName` (i.e. the first arg of `Module("pincode", {...})`
  in `src/modules/pincode/index.ts`). The `key` is only consumed for
  `scope: "external"` or `disable`-d modules.
- **Impact:** Harmless at runtime (the real key comes from `Module(...)`), but
  the comment's claim that `key` is "the container registration name used by
  `container.resolve(key)`" is inaccurate and could mislead future edits.
- **Smallest safe fix:** either drop the `key` fields (rely on the `Module()`
  definition) or correct the comment to state the registration name comes from
  the module's `Module()` definition, with `key` only used for external/
  disabled modules.

### S2 — Duplicate/stale doc-comment block at top of `seed.ts`
- **File:** `backend/src/scripts/seed.ts:5-38` vs `:40-62`.
- **Evidence:** Two overlapping "M1 unified seed script" comment blocks, the
  first labelled "M1/M2" and the second "M1", with slightly inconsistent
  scope notes (e.g. COD wiring described as "M2/M4" in one and "M4" in the
  other).
- **Impact:** No runtime effect; readability/maintenance noise.
- **Smallest safe fix:** delete the older `:40-62` block, keep the M1/M2 one.

---

## Nit

### N1 — `ContainerRegistrationKeys.LINK` comment accuracy (no change needed)
- The seed header claims `ContainerRegistrationKeys.LINK = "link"`.
  Verified correct at `@medusajs/utils` `common/container.js:14` (`LINK: "link"`).
  (Note: `Modules.LINK = "link_modules"` is a *different* constant — the module
  registration name — and is not what the seed uses. No issue, just flagging
  the distinction so it isn't "corrected" by mistake.)

---

## What is correct (verified, no change needed)

- **`medusa-config.ts`**
  - `import { defineConfig } from "@medusajs/framework/utils"` is correct:
    `framework/dist/utils/index.js` re-exports all of `@medusajs/utils`, and
    `defineConfig` lives in `@medusajs/utils/dist/common/define-config.js`
    (`exports.defineConfig`, re-exported via `common/index.js:33`).
  - Config shape matches v2 `ConfigModule`: `projectConfig.databaseUrl`,
    `redisUrl`, `http.{storeCors,adminCors,authCors,jwtSecret,cookieSecret}`,
    `plugins`, `modules` array form — all valid fields per
    `@medusajs/types` `common/config-module.d.ts`.
  - `modules` array form `{ resolve, key }` is accepted by
    `transformModules`; the custom modules resolve to `Module("pincode", ...)`
    etc., whose keys match the seed's `container.resolve("pincode")`.
  - CommonJS `module.exports = defineConfig(...)` + ESM `import` is the
    standard v2 medusa-config pattern; loaded at runtime by Medusa's config
    loader (jiti/esbuild), **not** type-checked by tsc.

- **`src/api/middlewares.ts`**
  - `defineMiddlewares` and `authenticate` are both re-exported from
    `@medusajs/medusa` (root re-exports `./utils`; `utils/index.js` re-exports
    `./define-middlewares` and `./middlewares`, the latter exporting
    `authenticate` from `authenticate-middleware`).
  - `authenticate("customer", ["session", "bearer"])` matches the signature in
    `@medusajs/framework` `http/middlewares/authenticate-middleware.js:14`
    and the exact pattern core uses for store customers
    (`@medusajs/medusa` `api/store/customers/middlewares.js:46,56`).
  - Route matchers/methods shape is valid for `defineMiddlewares`.

- **`tsconfig.json`**
  - `module: "ES2022"` + `moduleResolution: "Bundler"` is appropriate for v2
    (matches the official v2 starter) and supported by the pinned
    `typescript ^5.5.0`.
  - `include: ["src/**/*"]` correctly **excludes** `medusa-config.ts` (at the
    backend root) from tsc type-checking; the config is runtime-loaded only.
    This is intentional and correct.
  - `exclude: ["node_modules", "dist", "_v1-archive"]` is fine. `lib` includes
    `DOM` (harmless; some framework types reference DOM globals).

- **`package.json`**
  - Deps `@medusajs/framework@2.17.2` + `@medusajs/medusa@^2.17.2` are correct
    and version-aligned. The `medusa` CLI binary is provided by
    `@medusajs/cli` (a peer of `@medusajs/framework`), which is installed
    transitively (`node_modules/.bin/medusa` resolves; `@medusajs/cli`
    `package.json` bin `medusa -> cli.js`). All framework/medusa peer deps
    are optional or satisfied.
  - Scripts (`dev`, `build`, `start`, `migrate`, `seed`) map to correct
    `medusa` subcommands.

- **`seed.ts` (non-product parts)**
  - `Modules` enum keys `PRODUCT`, `REGION`, `PRICING`, `TAX`, `USER`,
    `AUTH`, `WORKFLOW_ENGINE` all exist in
    `@medusajs/utils` `modules-sdk/definition.js`.
  - `ContainerRegistrationKeys` and `Modules` are exported from
    `@medusajs/framework/utils` (via `@medusajs/utils` `index.js`
    re-exporting `./modules-sdk` and `./common`).
  - Seed signature `export default async function seed({ container })`
    matches `medusa exec` (`@medusajs/medusa` `commands/exec.js`: loads the
    default export and calls `scriptToExec({ container, args })`).
  - Paise pricing is applied **consistently** — every `price` is the rupee
    value × 100 (₹1,299 → 129900, ₹1,999 → 199900, ₹2,499 → 249900,
    ₹3,999 → 399900, ₹1,799 → 179900). `createPriceSets({ prices: [{ amount,
    currency_code: "inr" }] })` matches `CreatePriceSetDTO`/
    `CreateMoneyAmountDTO`.
  - Region / category / pincode / tax-region / admin-user creation all use
    idempotency guards (`list*` before `create*`). Admin-user creation
    mirrors `@medusajs/medusa` `commands/user.js`
    (`create-users-workflow` → `authService.register("emailpass", { body })`
    → `authService.updateAuthIdentities({ id, app_metadata: { user_id } })`),
    including a `userModule.createUsers` fallback if the workflow engine is
    unavailable.
  - `MedusaContainer` type import from `@medusajs/medusa` resolves (re-exported
    via `./types/global` → `./types` → root `index.d.ts`).

---

## Residual risks (post-fix)

- **Custom-module migrations:** `medusa db:migrate` must be run before
  `seed` so the `pincode` (and `review`/`wishlist`/`return_request`) tables
  exist; otherwise `pincodeModule.listPincodes({})` in the seed will fail.
  The `Pincode` DML model exists (`src/modules/pincode/models/pincode.ts`),
  so migration generation should succeed — but this depends on Docker/DB
  being up first (out of scope for this review).
- **Env vars:** `DATABASE_URL`, `REDIS_URL`, `JWT_SECRET`, `COOKIE_SECRET`
  must be set in `backend/.env` for `medusa develop`/`db:migrate`/`seed`.
  `defineConfig` has non-prod fallbacks for secrets (`supersecret`) and a
  default DB URL, but the real run needs the Docker-compose values.
- The four blocker fixes are mechanical but touch every variant literal
  (B3) and every product image literal (B4); care is needed to keep the
  option `title`→`value` mapping consistent with each product's
  `options: [{ title, values }]` definition.