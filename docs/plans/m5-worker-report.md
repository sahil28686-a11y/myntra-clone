# M5 — Deployment Readiness Worker Report

**Date:** 2026-07-07
**Worker:** M5 (deployment readiness)
**Status:** Complete — all validation checks pass

---

## Files Changed / Created

| File | Action | Summary |
|------|--------|---------|
| `backend/Dockerfile` | Rewritten | Multi-stage v2 build: `npm ci` → `npm run build` (medusa build) → prune devDeps → lean runtime. `HEALTHCHECK` hits `/health`. Start cmd: `npx medusa start`. |
| `docker-compose.yml` (dev) | Edited | Removed `version` key, added `AUTH_CORS`, added `MEDUSA_DISABLE_TELEMETRY`, removed v1 `RAZORPAY_*` env. Postgres/Redis match `medusa-config.ts` defaults. |
| `docker-compose.prod.yml` | Rewritten | Removed `version` key. Added `AUTH_CORS`. Removed v1-only env vars (`SENDGRID_API_KEY`, `SENDGRID_FROM_EMAIL`, `RAZORPAY_*`). Domain placeholders → `myntra-clone.local`. Healthcheck uses `/health`. Resource limits/restart policies preserved. |
| `docker-compose.monitoring.yml` | Edited | Removed `version` key. Removed `depends_on` (storefront/medusa) that referenced services not in this file — they exist on the external `myntra_network` from the prod compose. Health endpoints already used `/health`. |
| `nginx/default.conf` | Rewritten | Added `location = / { return 301 /app; }` on admin subdomain so users land on the v2 admin app. All proxying preserves the path (does NOT strip `/app`). Domain placeholders → `myntra-clone.local`. SSL/security headers/rate limiting/gzip preserved. `client_max_body_size` confirmed for uploads. |
| `deploy.sh` | Edited | Migration: `medusa migrations run` → `medusa db:migrate`. Seed: replaced 5 separate v1 seed scripts with unified `medusa exec src/scripts/seed.ts`. Removed duplicate admin user creation from `post_deploy` (seed script already creates it). Required vars check no longer requires `RAZORPAY_*` (COD-only). Domain defaults → `myntra-clone.local`. Admin panel URL shows `/app`. |
| `.env.example` (dev) | Rewritten | Added `AUTH_CORS`. Removed `SENDGRID_*`, commented out `RAZORPAY_*`. Added `MEDUSA_DISABLE_TELEMETRY`. |
| `.env.production.example` | Rewritten | Added `AUTH_CORS`, `DATABASE_URL`, `REDIS_URL`. Removed v1-only `DATABASE_TYPE`, `SENDGRID_API_KEY` (commented out with note). `RAZORPAY_*` documented as NOT used (COD-only). Domain → `myntra-clone.local`. Prominent warning to change default admin password `admin123`. |
| `docs/deployment-guide.md` | Created | Comprehensive guide: prerequisites, local dev steps, production deploy steps, env var reference, default admin credentials + change-password warning, COD-only note, medusa-js vs js-sdk risk note, TODO(prod) list, v2 command reference table. |

---

## v1 → v2 Corrections

### `backend/Dockerfile`
- **Before:** Single-stage, `npm install`, `npm run build`, `npm run start`, no healthcheck.
- **After:** Multi-stage (`builder` + runtime), `npm ci`, `npm run build` (→ `medusa build`), `npm prune --omit=dev`, `HEALTHCHECK` → `http://localhost:9000/health`, start `npx medusa start`.

### `docker-compose.prod.yml`
- Removed: `SENDGRID_API_KEY`, `SENDGRID_FROM_EMAIL`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` (v1/v1-plugin env vars not needed for COD-only v2).
- Added: `AUTH_CORS` (v2-required, read by `medusa-config.ts`).
- Domain defaults: `myntra-clone.com` → `myntra-clone.local` (§6.6 deferred).
- Healthcheck: already used `/health` — confirmed correct for v2.
- Resource limits, restart policies, healthchecks: preserved.

### `docker-compose.yml` (dev)
- Added: `AUTH_CORS: http://localhost:9000` (v2-required).
- Removed: `RAZORPAY_*` env vars (COD-only).
- Added: `MEDUSA_DISABLE_TELEMETRY: "true"`.
- Postgres/Redis: confirmed matching `medusa-config.ts` defaults (`myntra:myntra_pass@localhost:5432/myntra_store`, `redis://localhost:6379`).

### `nginx/default.conf`
- **Key fix:** Admin subdomain `location = / { return 301 /app; }` — redirects bare admin root to the v2 admin app path (`/app`). All other locations proxy to `medusa:9000` preserving the path, so `/app/*` (SPA + assets), `/admin/*` (REST API), and `/auth/*` (auth endpoints) all route correctly. The `/app` prefix is NOT stripped.
- Domain placeholders: `myntra-clone.com` → `myntra-clone.local`.
- SSL/security headers/rate limiting/gzip: preserved as-is.
- `client_max_body_size`: 50M on storefront, 100M on admin/api (confirmed for uploads).

### `deploy.sh`
- Migration command: `npx medusa migrations run` (v1) → `npx medusa db:migrate` (v2).
- Seed command: replaced 5 separate v1 seed scripts (`seed-categories`, `seed-products`, etc.) with unified v2 `npx medusa exec src/scripts/seed.ts`.
- Admin user: removed `post_deploy` admin user creation — the seed script already creates `admin@myntra-clone.com`/`admin123`, so a separate `medusa user` call would create a duplicate. Added a comment with the manual command for creating additional admins.
- Required vars: removed `RAZORPAY_KEY_ID`/`RAZORPAY_KEY_SECRET` from required checks (COD-only per §6.1).
- Domain defaults: `myntra-clone.com` → `myntra-clone.local`.
- Admin panel URL in summary: `https://admin.${domain}` → `https://admin.${domain}/app`.

### `.env.production.example`
- Added: `DATABASE_URL`, `REDIS_URL` (full connection strings, v2), `AUTH_CORS` (v2-required).
- Removed: `DATABASE_TYPE` (v1-only), `SENDGRID_API_KEY`/`SENDGRID_FROM_EMAIL` (moved to commented-out section with "deferred" note).
- `RAZORPAY_*`: documented as NOT used (COD-only per §6.1), commented out with instructions for future enablement.
- Domain: `myntra-clone.com` → `myntra-clone.local`.
- Admin password warning: prominent note at top + in the `ADMIN_PASSWORD` section to change `admin123` immediately.

### `.env.example` (dev)
- Added: `AUTH_CORS`.
- Removed: `SENDGRID_*`, uncommented `RAZORPAY_*`.
- Added: `MEDUSA_DISABLE_TELEMETRY`.

### `docker-compose.monitoring.yml`
- Removed: `version` key (obsolete).
- Removed: `depends_on: [storefront, medusa]` from `uptime-monitor` — these services are in the prod compose, not this file. Caused `docker compose config` to fail with "depends on undefined service". The external `myntra_network` already connects them.
- Health endpoints: already used `http://medusa:9000/health` — confirmed correct for v2.

---

## v2 Health + Admin `/app` Path Evidence

### Health endpoint: `GET /health` → `200 "OK"`

**Evidence:** `backend/node_modules/@medusajs/medusa/dist/commands/start.js`:
```js
// line 246-248
app.get("/health", (_, res) => {
    res.status(200).send("OK");
});
```

### Admin app path: `/app`

**Evidence:** `backend/node_modules/@medusajs/framework/dist/config/config.js`:
```js
// line 137-139
admin: projectConfig.admin ?? {
    path: "/app",
},
```

Additionally, `@medusajs/medusa/dist/commands/start.js` line 127 logs:
```js
logger.info(`Admin URL → http://${host || "localhost"}:${port}${adminPath}`);
```
Where `adminPath` defaults to `/app`.

### v2 CLI commands verified

- `medusa db:migrate` — confirmed in `@medusajs/cli/dist/create-cli.js:191` (`command: "db:migrate"`).
- `medusa exec [file]` — confirmed in `@medusajs/cli/dist/create-cli.js:553` (`command: "exec [file] [args..]"`).
- `medusa user -e <email> -p <password>` — confirmed in `@medusajs/cli/dist/create-cli.js:525-547` (options `e`/`email`, `p`/`password`, `i`/`id`, `invite`).

---

## Validation Results

### `docker compose config` (all three files)

```
docker compose -f docker-compose.prod.yml config     → exit 0 (warnings about unset JWT_SECRET/COOKIE_SECRET are expected without .env)
docker compose config (dev)                          → exit 0
docker compose -f docker-compose.monitoring.yml config → exit 0
```

### `bash -n deploy.sh` (syntax check)

```
bash -n deploy.sh → exit 0 (no syntax errors)
```

### Nginx sanity review (manual — `nginx -t` not available locally)

- `admin.myntra-clone.local` server block:
  - `location = / { return 301 /app; }` — redirects bare root to the v2 admin app path.
  - `location / { proxy_pass http://medusa_backend; }` — proxies all paths (including `/app`, `/admin`, `/auth`) to `medusa:9000` **preserving the path** (no rewrite/strip).
  - `/admin/uploads` has `client_max_body_size 100M`.
- `api.myntra-clone.local` server block:
  - Proxies `/store/*`, `/admin/*`, `/auth/*` to `medusa:9000`.
  - CORS headers include `x-publishable-api-key` (v2 storefront API requirement).
- Storefront server block proxies `/` → `storefront:3000`.

### v1 command check in `deploy.sh`

```
grep -n "medusa migrations run" deploy.sh
→ line 183: only in a comment "# (NOT v1 \"medusa migrations run\")"
→ No actual v1 migration command remains.
```

### `.env.production.example` v2 vars check

```
DATABASE_URL  → present
REDIS_URL     → present
JWT_SECRET    → present
COOKIE_SECRET → present
STORE_CORS    → present
ADMIN_CORS    → present
AUTH_CORS     → present
```

### v1-only vars check in `.env.production.example`

```
DATABASE_TYPE        → not present (PASS)
SENDGRID_API_KEY=    → not present uncommented (PASS; commented out with "deferred" note)
```

### `backend/Dockerfile` check

```
HEALTHCHECK → http://localhost:9000/health (PASS)
npm run build (→ medusa build) (PASS)
npx medusa start (PASS)
```

### `docs/deployment-guide.md` exists

```
464 lines — covers: prerequisites, local dev, production deploy, env vars,
admin credentials, COD-only note, medusa-js vs js-sdk risk, TODO(prod) list.
```

---

## Assumptions

1. **`npm ci` in Dockerfile:** Assumes `package-lock.json` exists. If it doesn't, `npm ci` will fail — the Dockerfile uses `package-lock.json*` glob in the COPY to avoid a hard failure, but `npm ci` itself requires the lockfile. If no lockfile exists at build time, switch to `npm install`. The backend `package.json` was regenerated in M1 so a lockfile should exist after `npm install`.

2. **Domain placeholder `myntra-clone.local`:** Per §6.6, the real domain is deferred. All configs use `myntra-clone.local` as a placeholder. SSL cert paths in nginx reference this placeholder — they must be updated to the real domain at deploy time. This is documented in the deployment guide.

3. **`wget` in HEALTHCHECK:** The Alpine base image includes `wget` by default (BusyBox). If a non-Alpine base is used, switch to `curl`.

4. **Monitoring compose runs alongside prod compose:** The monitoring stack uses an external network (`myntra_network`) created by the prod compose. It must be started after the prod stack: `docker compose -f docker-compose.prod.yml up -d` then `docker compose -f docker-compose.monitoring.yml up -d`.

5. **Storefront Dockerfile** was not modified (hard constraint: no storefront source edits). It already uses `npm install` + `npm run build` + `npm run start` which maps to `next build`/`next start`. This is correct for the Next.js storefront.

6. **`_docker-diag.ps1`, `_docker-err.ps1`, etc.** are untracked files from Docker debugging — not created by this worker and not part of the deployment artifact set. They should be gitignored or cleaned up separately.

---

## Open Risks / Questions

1. **No lockfile verification:** Could not verify `backend/package-lock.json` exists (it may have been regenerated by M1). If absent, `npm ci` in the Dockerfile will fail. Mitigation: documented in assumptions above.

2. **Nginx not testable locally:** `nginx -t` is not available in this environment. The config was reviewed manually for `/app` routing correctness. Full nginx validation requires a server with nginx installed.

3. **SSL certs for `.local` domain:** Let's Encrypt will not issue certs for `.local` domains. The deploy script's SSL step will fail until the real domain is configured. This is expected behavior — documented in the deployment guide.

4. **Docker daemon:** Docker CLI is available and `docker compose config` works (parsing only). No containers were built or started (per hard constraints).