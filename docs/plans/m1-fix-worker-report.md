# M1 Fix Worker Report

Applied the M1 reviewer's blocker fixes to `backend/src/scripts/seed.ts` and
the S1 should-fix to `backend/medusa-config.ts`. No other files touched.
No Docker / migrations / seed were run (code + tsc only, per contract).

## Changed files

| File | Change |
|------|--------|
| `backend/src/scripts/seed.ts` | B1, B2, B3, B4, S2 |
| `backend/medusa-config.ts` | S1 (comment correction) |

## What changed (file:line, post-edit line numbers)

### B1 — `createProducts` return shape
- `seed.ts:274` — replaced
  `const createdProducts = (await productModule.createProducts({...})) as any[]`
  + `const created = createdProducts[0]` with
  `const created = (await productModule.createProducts({...})) as any`.
  No `as any[]` cast, no `[0]` indexing. `created.variants` still resolves
  (populated by the service).

### B2 — Remote-link FK name
- `seed.ts:307` — `[Modules.PRODUCT]: { product_variant_id: variant.id }` →
  `[Modules.PRODUCT]: { variant_id: variant.id }`.
- No header comments in `seed.ts` actually claimed `product_variant_id` was
  the v2 pattern (the review's referenced comment lines did not contain that
  string), so no comment text needed correcting there. The misleading key
  itself was the only occurrence and is now fixed.

### B3 — Variant `options` shape (`Record<title, value>`)
- `seed.ts:127` — `VariantSeed.options` type changed from
  `{ value: string }[]` to `Record<string, string>` (with clarifying comment).
- All 29 variant literals rewritten from `[{ value: "S" }, { value: "Navy Blue" }]`
  to `{ Size: "S", Color: "Navy Blue" }`. Keys match each product's
  `options: [{ title, values }]` titles.
  - Polo/Jeans/Kurta/Dress products define options `Size` + `Color` →
    variants use `{ Size, Color }`.
  - Running Shoes defines only `Size` → variants use `{ Size }`.

### B4 — Product `images` shape (`{ url }[]`)
- `ProductSeed.images` type kept as `string[]` (less churn); mapped at the
  call site.
- `seed.ts:280` — `images: p.images` → `images: p.images.map((u) => ({ url: u }))`.

### S1 — `medusa-config.ts` modules `key` field
- `medusa-config.ts:24-31` — rewrote the comment block above the 4 custom
  module entries to state that the container registration name comes from the
  `Module("name", ...)` definition's first argument, NOT from `key`, and that
  `key` is only consumed for `scope: "external"` or `disable`-d modules
  (per `@medusajs/utils` `common/define-config.js` `transformModules`).
  Chose the comment-fix option (less churn). `container.resolve("pincode")`
  etc. still resolve — the `Module()` first arg is the registration name.
  The `key` fields are retained for explicitness.

### S2 — Duplicate comment block
- Deleted the older "M1" labelled `/** ... */` comment block (the one starting
  with "M1 unified seed script") from the top of `seed.ts`. The "M1/M2"
  block is retained as the single header.

## Option title→value mapping reconciliation

No reconciliation needed — every product's variant `options` titles map
directly onto that product's declared `options: [{ title, values }]`:

| Product | Option titles | Variant option keys |
|---------|---------------|---------------------|
| Classic Fit Polo T-Shirt | Size, Color | Size, Color |
| Slim Fit Jeans | Size, Color | Size, Color |
| Embroidered Kurta Set | Size, Color | Size, Color |
| Running Shoes | Size | Size |
| Floral Print Dress | Size, Color | Size, Color |

All variant values are present in the corresponding product option's
`values` array (verified by reading the literals).

## Validation

### `npx tsc --noEmit` (run from `backend/`)
```
EXIT: 0
```
Zero errors, zero output.

### grep checks
- `grep -n "product_variant_id" backend/src/scripts/seed.ts` → **no matches** (B2 done).
- `grep -n "options: \[" backend/src/scripts/seed.ts` → 5 matches, ALL are
  the **product-level** `options: [{ title, values }]` definitions
  (`seed.ts:151,178,204,229,250`), which is the correct `CreateProductDTO.options`
  shape. No **variant** option literals remain in array form (B3 done).
- Variant options confirmed as `Record<string,string>` objects keyed by option
  title (`{ Size: "S", Color: "Navy Blue" }` etc.) — 29 variants, all correct.
- `images: p.images.map((u) => ({ url: u }))` at `seed.ts:280` (B4 done).
- `createProducts` return is `const created = (await ...)) as any` — no
  `[0]` indexing, no `as any[]` (B1 done).

## Residual risks
- None introduced by these edits. Pre-existing residual risks from the review
  (custom-module migrations must run before seed; env vars must be set) remain
  out of scope — no Docker/DB run was performed per the contract.
- `medusa-config.ts` is excluded from tsc (`tsconfig.json` `include: ["src/**/*"]`),
  so S1's comment-only change is not type-checked; it is runtime-loaded only.