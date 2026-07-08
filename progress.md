# Myntra Clone — Progress Tracker

> **Last Updated:** 2026-07-08
> **Status:** 🟢 Phase 5: Deployment — LIVE on VPS (NPM edge, *.smcloud.cloud)

## 🚀 Live Deployment (2026-07-08)

Deployed to the Hostinger KVM 2 VPS (`72.61.171.205`, `*.smcloud.cloud`) behind the existing **nginx-proxy-manager (NPM)** edge + Let's Encrypt. Coolify's Traefik is disabled on this box, so the deploy mirrors the proven `storydiya-api`/`coolify` pattern.

| URL | Forwards to | Purpose |
|---|---|---|
| `https://shop.smcloud.cloud` | host `:3100` (Next.js storefront) | Storefront |
| `https://api.smcloud.cloud` | host `:9100` (Medusa backend) | Store API + admin at `/app` |
| `https://admin.smcloud.cloud` | host `:9100` | Admin UI (alias) |

**Runtime model:** Postgres + Redis in Docker (`ecom-postgres`/`ecom-redis`, exposed to host on `127.0.0.1:5434`/`6380`); Medusa backend + storefront built and run on the **host** as `systemd` services (`ecom-medusa.service`, `ecom-storefront.service`, `Restart=always`). NPM reaches the host services via the docker bridge gateway `172.22.0.1` (UFW rules added to allow `172.22.0.0/16` → host `9100`/`3100`).

**Admin credentials:** created via `medusa user` — email/password stored only on the VPS (not committed).
**Storefront publishable key (live):** `pk_cd6eed…` (full token stored only on the VPS; linked to Default Sales Channel via admin API).

**VPS paths:** repo at `/docker/ecom-store`; logs `/var/log/ecom-medusa.log` + `/var/log/ecom-storefront.log`; secrets in `/docker/ecom-store/backend/.env` (chmod 600).

### Deploy fixes made this session
- Added `@medusajs/admin-sdk@2.17.2` as a direct backend dep (was only transitive/optional in the lockfile → `medusa build` failed on `defineWidgetConfig`/`defineRouteConfig` imports).
- `medusa db:sync-links` run (link tables existed; the `PublishableApiKeySalesChannel` link is not registered in `medusa exec` context, so the seed's `remoteLink.create` for api_key↔sales_channel fails). Seed's key + products + region ARE created; the key→SC link is applied post-seed via the admin API (`POST /admin/api-keys/:id/sales-channels` body `{add:[sc_id]}`).
- `backend/public` symlinked to `dist/public` so `medusa start` (which looks in `<cwd>/public/admin`) finds the built admin (build outputs to `dist/public/admin` due to `outDir: ./dist`).
- `docker-compose.vps.yml` added (NPM-edge variant: no nginx/certbot services; postgres/redis exposed to host on `5434`/`6380`; medusa/storefront services kept for reference but run on host).
- `storefront/Dockerfile` made multi-stage + accepts `NEXT_PUBLIC_*` build args (for the container path; the live deploy builds on host instead, with `.env.local` read by Next at build time).

### Why not built in Docker
`docker build` (buildkit) on this VPS could not reach `registry.npmjs.org` efficiently — `@medusajs/*` packument fetches took 85–102s each inside buildkit, while host `curl` to npmjs was fast. So `npm ci` + `medusa build` + `next build` were run on the host (fast), and the services run on the host under systemd. Re-containerization can revisit `docker build --network=host` if desired.

---

## Overall Progress

| Phase | Status | % Complete |
|-------|--------|------------|
| Phase 1: Foundation | ✅ Complete | 100% |
| Phase 2: Frontend Clone | 🚧 In Progress | 40% |
| Phase 3: Backend Integration | 🚧 In Progress | ~85% |
| Phase 4: Admin Panel | 🚧 In Progress | ~30% |
| Phase 5: Deployment | 🚧 In Progress | 40% |

---

## Phase 1: Foundation ✅

### Docker Compose
- [x] Create `docker-compose.yml` (postgres, redis, medusa, storefront)
- [x] Create `.env.example` with all required vars
- [x] Create `setup.sh`

### Medusa Backend
- [x] Scaffold Medusa v2 backend
- [x] Configure `medusa-config.js`
- [x] Create custom entities (Pincode, Review, Wishlist, ReturnRequest)
- [x] Create API endpoints (pincodes, reviews, wishlist, returns, bulk-upload, analytics)
- [x] Create subscribers (invoice generation)
- [x] Create seed scripts (categories, products, pincodes, taxes, payment)
- [x] Create Dockerfile

### Next.js Storefront
- [x] Scaffold Next.js 14 with App Router
- [x] Set up Tailwind CSS with Myntra design tokens
- [x] Create Medusa client library
- [x] Create shared components (Header, Footer, ProductCard)
- [x] Create root layout
- [x] Create Dockerfile

---

## Phase 2: Frontend Clone (Autonomous UI Loop)

### Homepage
- [x] Build homepage with hero banners, category grid, trending products, newsletter
- [x] Added 5 discount deal rows (Deals of the Day, Biggest Deals, Top Picks, Trending, Must-Have Deals) with 6 category tiles each
- [x] Added brand carousel (10 brands)
- [x] Added 5 category sections (Men's Topwear, Women's Ethnic, Footwear, Accessories, Beauty)
- [x] Added More Brands strip (10 brands)
- [x] Added Top Picks section (6 categories)
- [x] Added 2 more product rows (Best Sellers, New Arrivals)
- [x] Added App Download banner (UPTO ₹300 OFF)
- [x] Added End of Season Sale banner
- [x] Added Newsletter signup section
- [x] Page size increased from 53KB to 217KB (4x)
- [ ] Pixel-perfect matching loop
- [ ] ✅ Verified

### Product Listing Page
- [x] Build PLP with filter sidebar, product grid, sort, pagination
- [ ] Extract Myntra PLP HTML/CSS/assets for pixel-perfect matching
- [ ] Pixel-perfect matching loop
- [ ] ✅ Verified

### Product Detail Page
- [x] Build PDP with image gallery, size/color picker, pincode checker, highlights
- [x] Extracted Myntra PDP HTML/CSS/assets for pixel-perfect matching
- [x] Updated PDP to match Myntra exact design: image gallery with thumbnails (left), brand/title/rating/price/size/pincode/Add to Bag (right), product details + ratings below
- [x] Myntra design tokens applied: #282C3F, #535766, #FF3F6C, #03A685, #7E818C, #E9E9EB
- [ ] Pixel-perfect visual comparison loop (dev server build issue - disk space constrained)
- [ ] ✅ Verified

### Cart Page
- [x] Build cart with quantity controls, coupon, order summary
- [ ] Extract Myntra cart HTML/CSS/assets for pixel-perfect matching
- [ ] Pixel-perfect matching loop
- [ ] ✅ Verified

### Checkout Flow
- [x] Build checkout with address, shipping, payment steps + success page
- [ ] Extract Myntra checkout HTML/CSS/assets for pixel-perfect matching
- [ ] Pixel-perfect matching loop
- [ ] ✅ Verified

### Account Pages
- [x] Build login/register, dashboard, orders, order detail, wishlist, addresses
- [ ] Extract Myntra account pages HTML/CSS/assets for pixel-perfect matching
- [ ] Pixel-perfect matching loop
- [ ] ✅ Verified

### Search
- [ ] Build search page with autocomplete and filters
- [ ] Extract Myntra search HTML/CSS/assets
- [ ] Pixel-perfect matching loop
- [ ] ✅ Verified

---

## Phase 3: Backend Integration 🚧

- [x] Created comprehensive API service layer (`src/lib/api.ts`) wrapping all Medusa client calls
- [x] Updated `src/lib/medusa.ts` to re-export from API layer with full TypeScript types
- [x] Added TypeScript declaration file for `@medusajs/medusa-js`
- [x] Homepage: Fetches real products from `/store/products` and collections from `/store/collections`
- [x] Product Listing: Fetches real products with filters, categories, sort, pagination
- [x] Product Detail: Fetches single product by handle, size/color variant selection, pincode checker
- [x] Cart: Uses Medusa cart API (create cart, add/update/remove line items, persisted via localStorage)
- [x] Checkout: Full Medusa checkout flow (address → shipping methods → payment sessions → complete order)
- [x] Account/Auth: Uses Medusa customer/auth API (register, login, get customer)
- [x] Dashboard: Fetches real customer data and orders
- [x] Orders: Fetches real order history from Medusa
- [x] Order Detail: Fetches single order, return request submission
- [x] Wishlist: Uses custom wishlist API (list, add, remove)
- [x] Addresses: Uses Medusa customer addresses API (CRUD)
- [x] Search: Fetches products by query from `/store/products?q=`
- [x] Header: Shows cart count from localStorage, search form submits to /search
- [x] ProductCard: Handles real product data with images, discounts, brands
- [x] TypeScript compiles with zero errors

### Remaining gaps
- Checkout payment cannot complete: checkout calls `setPaymentSession(cart.id, "manual")` but `@medusajs/payment-manual` is not installed and `medusa-config.ts` has no payment provider enabled (`plugins: []`). No Razorpay wiring either.
- Publishable API key is not reproducibly provisioned: storefront hardcodes `pk_91ca8864...` but `seed.ts` never creates it; fresh DB+seed → `/store/*` 400s.

---

## Phase 4: Admin Panel 🚧

- [x] Admin API routes (products CRUD, orders, customers, discounts, settings, returns)
- [x] Admin server route (serves SPA at /admin)
- [x] Dashboard page with analytics overview
- [x] Products page (list, create, edit, delete)
- [x] Orders page (list, filter by status, view details, update status)
- [x] Customers page (list, search, view details)
- [x] Discounts page (list, create, delete)
- [x] Bulk Upload page (CSV upload form)
- [x] Settings page (store name, brand, logo, theme, payment config)
- [x] Admin layout with sidebar navigation
- [x] Admin React widgets (dashboard widget)

### Current gaps (v2)
- `widgets/dashboard.tsx` is missing the required `zone` property and uses `export default defineWidgetConfig(...)` (returns a config object, not a component) — v2 needs `export default <Component>` + `export const config = defineWidgetConfig({ zone })`.
- `routes/*.tsx` (products, orders, customers, discounts, bulk-upload, settings) have no `defineRouteConfig` export → not registered as v2 admin custom routes.
- They call non-existent endpoints: `/admin/discounts` (v2 = `/admin/promotions`), `/admin/settings`, `/admin/products/bulk-upload`, `/admin/analytics/dashboard` (no `src/api/admin/` folder).
- Native v2 admin at `/app` works; all custom Phase 4 pages/widgets are non-functional.

---

## Phase 5: Deployment

- [ ] Production Docker Compose config
- [ ] Nginx config with SSL
- [ ] CI/CD pipeline
- [ ] Domain DNS setup
- [ ] Monitoring (health checks, logs)

---

## Session Log

| Date | Session | Work Done | Next Steps |
|------|---------|-----------|------------|
| 2026-07-07 | 1 | Design doc + progress.md created | Phase 1: Foundation |
| 2026-07-07 | 1 | Docker Compose, Medusa backend scaffold, custom entities, API endpoints, seed scripts, Next.js storefront scaffold, all pages built (homepage, PLP, PDP, cart, checkout, account pages) | Phase 2: Pixel-perfect extraction loop, Phase 3: Backend integration |
| 2026-07-07 | 1 | Extracted Myntra homepage HTML (476KB) + CSS (11KB) for reference. Saved to docs/reference/. | Refine frontend to match Myntra design tokens exactly |
| 2026-07-07 | 1 | Refined design tokens to match Myntra exact colors (#3E4152, #535766, #7E818C, #E9EDEC). Updated Header, Footer, ProductCard, globals.css. Backend deps installed. Storefront builds successfully (12 pages). | Phase 2: Pixel-perfect visual comparison loop, Phase 3: Backend integration |
| 2026-07-07 | 1 | Built complete admin panel: API routes (products, orders, customers, discounts, settings, returns), SPA server route at /admin, 7 admin pages (Dashboard, Products, Orders, Customers, Discounts, Bulk Upload, Settings), admin layout with sidebar navigation, React widgets. | Phase 2: Pixel-perfect UI loop, Phase 3: Backend integration |
| 2026-07-07 | 2 | Connected all storefront pages to Medusa API: created API service layer (api.ts), updated all 13 pages, updated Header with cart count + search, updated ProductCard for real data, added TypeScript declarations. TypeScript compiles with zero errors. | Phase 2: Pixel-perfect autonomous UI loop, Phase 5: Deployment |
| 2026-07-07 | 3 | Started autonomous pixel-perfect UI loop. Captured Myntra baseline screenshot (1440x7439). Captured local build screenshot (1440x1807). Initial mismatch: 50.02%. Updated Header to match Myntra exact structure (logo sprite, nav with hover, search bar, user icons). Updated Footer with all Myntra sections (Online Shopping, Customer Policies, App Download, Social, Useful Links, Promises). Updated globals.css with Myntra exact colors (#282C3F, #535766, #696E79, #E9E9EB). Updated tailwind.config.js. Mismatch improved to 38.28%. | Continue pixel-perfect loop: add more homepage sections (brand carousels, deals), refine header mega menu, match exact spacing/typography |
| 2026-07-07 | 3 | Extracted exact Myntra design tokens via Playwright: font (Figtree-Regular), nav (14px bold #282C3F), search (bg #F5F5F6, h40px, border-radius 0 4px 4px 0), logo (53x36 sprite). Updated Header with exact Myntra logo sprite, nav spacing (17px padding), search bar styling. Updated globals.css with Figtree font. Mismatch: 38.14%. | Need to add more homepage sections to match Myntra's 7439px page height. Current page is only 2169px. |
| 2026-07-07 | 3 | Added all missing homepage sections: 4 deal rows (DEALS OF THE DAY, BIGGEST DEALS, TOP PICKS, TRENDING), app download banner (UPTO ₹300 OFF), End of Season Sale banner, 2 more product rows (Best Sellers, New Arrivals). Page height now 10802px (exceeds Myntra's 7439px). | Pixel-perfect refinement: match exact spacing, colors, typography. Start PLP/PDP pixel-perfect loop. |
| 2026-07-07 | 3 | Updated PDP to Myntra exact design: image gallery with thumbnails (left), brand/title/rating/price/size/pincode/Add to Bag (right), product details + ratings below. Used Myntra exact colors (#282C3F, #535766, #FF3F6C, #03A685, #7E818C, #E9E9EB). TypeScript compiles with zero errors. | Fix dev server build issue (disk space constrained). Continue pixel-perfect visual comparison loop. Start PLP pixel-perfect update. |
| 2026-07-07 | 4 | Added all missing homepage sections: 5 discount deal rows (30 category tiles), brand carousel, 5 category sections, More Brands strip, Top Picks, 2 more product rows, App Download banner, End of Season Sale banner. Page size grew from 53KB to 217KB (4x). | Phase 2: Pixel-perfect visual comparison loop, Phase 5: Deployment |
| 2026-07-07 | 3 | Added 5 discount category deal rows (Fusion Wear, Loungewear, Kids Wear, Home Furnishing, Watches) matching Myntra's homepage structure. Added app download banner (UPTO ₹300 OFF). Homepage now 600+ lines with all major Myntra sections. Build succeeds (12 pages, 0 errors). | Continue pixel-perfect loop: compare screenshots, refine spacing/colors/typography |
| 2026-07-07 | 4 | Added all missing homepage sections: brand carousels (10 brands), deal sections (2), promotional banners (3), category sections (5: Men, Women, Footwear, Accessories, Beauty), more brands strip (8), top picks (4), full-width EOSS banner. Page height: 2169px → 7616px (vs Myntra 7439px). Mismatch: 52.05% → 25.48%. Remaining mismatch due to placeholder content vs real Myntra images. | Phase 5: Deployment setup (Docker Compose production, Nginx, SSL, CI/CD) |
| 2026-07-07 | 5 | Refined homepage with exact Myntra design tokens: section titles 14px bold #3E4152, spacing my-[30px], grid gaps [2px], reduced margins. Dev server running on port 3000 (200 OK, 216KB). | Phase 5: Deployment setup |
| 2026-07-07 | 4 | Fixed build issues (Medusa client lazy init, re-export chain). Build now succeeds with all 13 pages. Dev server running. Homepage renders at 9883px with all sections. | Continue pixel-perfect refinement loop. Start PLP/PDP extraction. |
| 2026-07-07 | 5 | Pixel-perfect comparison run: 61.68% mismatch (expected - different viewport sizes and content). Production build works. All 13 pages compile. | Need to: (1) Fix dev server hanging on Medusa client calls, (2) Re-capture Myntra baseline at 1440px, (3) Run pixel-perfect refinement loop |

---

## Phase 5: Deployment 🚧

### Docker Compose (Production)
- [x] Create `docker-compose.prod.yml` with production-optimized service configs
- [x] Resource limits for all services
- [x] Health checks with start periods
- [x] Restart policies (always)
- [x] Named volumes
- [x] Dedicated Docker network

### Nginx Reverse Proxy
- [x] Create `nginx/default.conf` with SSL termination
- [x] Static file caching (365d for assets)
- [x] Gzip compression
- [x] Rate limiting (30r/s API, 10r/s auth, 20r/s admin)
- [x] Security headers (HSTS, XSS, CSP)
- [x] Subdomain routing (admin.*, api.*, uploads.*)
- [x] CORS headers for API
- [x] Large body support (100MB for uploads)

### Environment Configuration
- [x] Create `.env.production.example` with all production vars
- [ ] Configure actual DNS records
- [ ] Set up production secrets

### Deployment Script
- [x] Create `deploy.sh` with full deployment workflow
- [x] Pre-flight checks (Docker, .env, required vars)
- [x] Database backup before deploy
- [x] Git pull
- [x] Docker image build
- [x] Database migrations
- [x] Data seeding (skips if already seeded)
- [x] SSL setup with Let's Encrypt + auto-renewal
- [x] Post-deploy tasks (admin user, cleanup)
- [x] Status check command
- [x] Rollback support

### Monitoring
- [x] Create `docker-compose.monitoring.yml`
- [x] Health check endpoint
- [x] Log cleanup service
- [x] Uptime monitoring
- [ ] Set up external monitoring (UptimeRobot/BetterStack)

### Remaining
- [ ] Configure actual DNS records
- [ ] Set up production secrets
- [ ] Set up CI/CD pipeline
- [ ] Configure external monitoring

---

## Session Log
| 2026-07-07 | 5 | Refined PDP to match Myntra design: image gallery with hover zoom, thumbnail opacity states, brand/price/rating sections, size selector, pincode checker, add-to-bag button, delivery info, product details, ratings breakdown. Fixed ProductCard.tsx syntax error. Build succeeds with all 13 pages. | Continue refinement of remaining pages. |
| 2026-07-07 | 6 | Fresh evidence-based audit of current codebase. Verified old audit was stale (v1→v2 migration done, prices/auth/cart/headsearch fixed). Real findings: CRITICAL = no payment provider (checkout can't complete), publishable key not reproducible, setup.sh broken; HIGH = custom admin extensions misstructured for v2; MEDIUM = no account auth guards, broken /collections/ PDP link. Both storefront+backend tsc 0 errors. | Fix criticals + mediums via DeepSeek workers + GLM 5.2 review gate. |
| 2026-07-07 | 7 | Autonomously fixed all audit findings via DeepSeek workers (Flash=mechanical, V4 Pro=deep v2) + GLM 5.2 review gate verifying every diff against installed node_modules. Two commits: 61d3198 (M4b v2 SDK migration, pre-existing work reviewed+committed) and 347ae9b (audit fixes). Fixes: (1) checkout payment -> built-in SystemPaymentProvider pp_system_default (auto-registered by @medusajs/payment, verified in loaders/providers.js:53); (2) seed.ts now creates+links a publishable API key (idempotent by title+type; gate fixed worker's token-lookup bug); (3) setup.sh -> unified seed.ts; (4) account auth guards on dashboard/orders/wishlist/addresses -> redirect to /account; (5) PDP /collections/ -> /products?collection=; (6) wishlist v2 price fields; (7) admin: dashboard widget fixed (zone order.list.before + correct export shape), 6 routes got defineRouteConfig + re-pointed to v2 native endpoints (/admin/promotions, /admin/stores, count-based pagination), new /admin/analytics/dashboard + /admin/products/bulk-upload routes; (8) gate: registered multer middleware + installed multer/@types/multer (v2 doesn't auto-parse multipart). Both tsc 0 errors, working tree clean. | RUNTIME SMOKE TEST (user will do): seed -> copy printed publishable token to storefront/.env.local -> /store products -> add-to-cart -> checkout complete (COD pp_system_default) -> account auth guard -> admin analytics + bulk-upload (multer) + settings (/admin/stores). Then Phase 2 pixel-perfect (~40%) and Phase 5 deploy (DNS/secrets/CI/CD) remain. |
| 2026-07-08 | 8 | **DEPLOYED LIVE to VPS** (Hostinger KVM 2, NPM edge, *.smcloud.cloud). Discovered the VPS edge is nginx-proxy-manager (NPM), NOT Coolify's Traefik (disabled). Built + ran Medusa backend & storefront on the host (buildkit npm ci was network-broken inside buildkit → 85-102s/packument; host network fine). Postgres+Redis in Docker (host ports 5434/6380). Fixed: added @medusajs/admin-sdk dep (build was failing on admin imports); ran db:sync-links; symlinked backend/public→dist/public for medusa start; UFW allow 172.22.0.0/16→9100/3100 so NPM can reach host services via bridge gateway. Created 3 NPM proxy hosts with LE certs (shop/api/admin.smcloud.cloud). Seeded (5 products, India/INR region, sales channel); linked publishable key→SC via admin API (seed's remoteLink for api_key↔sales_channel fails in medusa exec context — PublishableApiKeySalesChannel link not registered there). systemd services ecom-medusa + ecom-storefront (Restart=always). **Verified live:** https://api.smcloud.cloud/store/products → 5 products; https://shop.smcloud.cloud → 200 (122KB, Myntra homepage renders); https://admin.smcloud.cloud/app → 200. Admin user created (credentials on VPS only). | Remaining: add-to-cart + COD checkout live smoke test; fix seed.ts api_key↔sales_channel link for reproducibility; Phase 2 pixel-perfect (~40%); favicon; production secrets rotation; monitoring. |
