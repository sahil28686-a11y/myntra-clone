# Myntra Clone — Deployment Guide

**Project:** Myntra Clone — Medusa v2 Backend + Next.js 14 Storefront
**Last updated:** 2026-07-07

This guide covers both local development and production deployment. Anyone
should be able to get the stack running by following these steps.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Prerequisites](#2-prerequisites)
3. [Local Development](#3-local-development)
4. [Production Deployment](#4-production-deployment)
5. [Environment Variables Reference](#5-environment-variables-reference)
6. [Default Admin Credentials](#6-default-admin-credentials)
7. [Payments — COD Only](#7-payments--cod-only)
8. [M4 Integration Risk: medusa-js vs js-sdk](#8-m4-integration-risk-medusa-js-vs-js-sdk)
9. [TODO(prod) — Post-Launch Items](#9-todoprod--post-launch-items)

---

## 1. Architecture Overview

```
                    ┌──────────────┐
                    │   Nginx      │  ← TLS termination, routing, rate limiting
                    └──────┬───────┘
           ┌───────────────┼───────────────┐
           │               │               │
     storefront.*      admin.*         api.*
     (Next.js:3000)   → /app          → /store, /admin, /auth
           │               │               │
           ▼               ▼               ▼
     ┌──────────┐   ┌─────────────────────────┐
     │ Storefront│   │ Medusa v2 Backend (:9000)│
     │ Next.js  │   │  - Store API /store/*    │
     │ (:3000)  │   │  - Admin API /admin/*    │
     └──────────┘   │  - Auth API  /auth/*     │
                    │  - Admin app /app        │
                    └──────────┬──────────────┘
                               │
                    ┌──────────┴──────────┐
                    │                     │
              ┌─────▼─────┐        ┌──────▼─────┐
              │ PostgreSQL │        │   Redis    │
              │   (:5432)  │        │   (:6379)  │
              └────────────┘        └────────────┘
```

**Medusa v2 key facts:**
- The backend serves the API **and** the native admin app on the **same port (9000)**.
- The admin app is served at the **`/app`** path (confirmed in
  `@medusajs/framework/dist/config/config.js` → `admin: { path: "/app" }`).
- The health endpoint is **`GET /health`** → `200 "OK"` (confirmed in
  `@medusajs/medusa/dist/commands/start.js` → `app.get("/health", ...)`).
- Store API: `/store/*`  ·  Admin API: `/admin/*`  ·  Auth API: `/auth/*`.

---

## 2. Prerequisites

### Local Development

| Requirement | Version | Notes |
|-------------|---------|-------|
| Node.js     | 20.x    | Medusa v2 requires Node ≥ 20 |
| npm         | 10.x    | Ships with Node 20 |
| Docker Desktop | latest | For Postgres + Redis containers |
| Git         | latest  | |

### Production Deployment

| Requirement | Version | Notes |
|-------------|---------|-------|
| Docker Engine | 24+  | |
| Docker Compose | v2+  | `docker compose` (not legacy `docker-compose`) |
| Nginx       | 1.18+  | Reverse proxy + TLS |
| A server    | 2+ vCPU, 4+ GB RAM | Linux (Ubuntu 22.04+ recommended) |
| A domain name | —    | Replace `myntra-clone.local` with your real domain |
| SSL certs   | Let's Encrypt | via certbot (deploy.sh handles this) |

---

## 3. Local Development

### 3.1 Start Postgres + Redis

```bash
# From the project root
docker compose up -d postgres redis

# Verify both are healthy
docker compose ps
# myntra-postgres  ...  Up (healthy)
# myntra-redis     ...  Up (healthy)
```

This uses `docker-compose.yml` which matches the defaults in
`medusa-config.ts`:
- Postgres: `postgres://myntra:myntra_pass@localhost:5432/myntra_store`
- Redis: `redis://localhost:6379`

### 3.2 Set up the backend

```bash
cd backend

# Create .env from the dev example (if not already present)
cp ../.env.example .env

# Install dependencies
npm install

# Run database migrations (v2 command)
npx medusa db:migrate

# Seed the database (region, categories, products, pincodes, GST, admin user)
npm run seed
#   ↑ equivalent to: npx medusa exec src/scripts/seed.ts

# Start the dev server (boots on :9000)
npm run dev
#   ↑ equivalent to: npx medusa develop
```

**Verify the backend:**

```bash
# Store API returns products
curl http://localhost:9000/store/products | jq '.products | length'
# → N > 0

# Health check
curl http://localhost:9000/health
# → OK

# Admin app (v2 native admin served at /app)
# Open http://localhost:9000/app in your browser
# Login: admin@myntra-clone.com / admin123
```

### 3.3 Set up the storefront

```bash
cd storefront

# Install dependencies
npm install

# Start the dev server (boots on :3000)
npm run dev
```

**Verify the storefront:**

Open `http://localhost:3000` in your browser. You should see the homepage
with products loaded from the Medusa Store API.

### 3.4 Environment variables for local dev

Create `backend/.env` (or copy from `../.env.example`):

```env
DATABASE_URL=postgres://myntra:myntra_pass@localhost:5432/myntra_store
REDIS_URL=redis://localhost:6379
JWT_SECRET=myntra-jwt-secret-change-in-production
COOKIE_SECRET=myntra-cookie-secret-change-in-production
STORE_CORS=http://localhost:3000
ADMIN_CORS=http://localhost:9000
AUTH_CORS=http://localhost:9000
MEDUSA_DISABLE_TELEMETRY=true
```

For the storefront, `NEXT_PUBLIC_MEDUSA_URL` defaults to
`http://localhost:9000`. If you need to override it, create
`storefront/.env.local`:

```env
NEXT_PUBLIC_MEDUSA_URL=http://localhost:9000
```

---

## 4. Production Deployment

### 4.1 Prepare the server

```bash
# Clone the repo
git clone <your-repo-url> /opt/myntra-clone
cd /opt/myntra-clone

# Create .env from the production example
cp .env.production.example .env

# Edit .env — set ALL secrets and replace myntra-clone.local with your domain
nano .env
```

**Critical values to set in `.env`:**

| Variable | What to set |
|----------|-------------|
| `POSTGRES_PASSWORD` | A strong random password |
| `DATABASE_URL` | Must match POSTGRES_USER/PASSWORD/DB |
| `JWT_SECRET` | `openssl rand -hex 32` |
| `COOKIE_SECRET` | `openssl rand -hex 32` |
| `STORE_CORS` | `https://your-domain.com` |
| `ADMIN_CORS` | `https://admin.your-domain.com` |
| `AUTH_CORS` | `https://admin.your-domain.com` |
| `DOMAIN` | `your-domain.com` |
| `ADMIN_DOMAIN` | `admin.your-domain.com` |
| `API_DOMAIN` | `api.your-domain.com` |
| `NEXT_PUBLIC_MEDUSA_URL` | `https://api.your-domain.com` |

### 4.2 Update nginx config

Edit `nginx/default.conf` and replace all occurrences of `myntra-clone.local`
with your real domain. Also update the SSL certificate paths to match your
Let's Encrypt certs.

### 4.3 Run the deploy script

```bash
# Make it executable
chmod +x deploy.sh

# Full deploy (build → migrate → seed → start → SSL)
./deploy.sh

# Or skip specific steps:
./deploy.sh --skip-build      # use existing images
./deploy.sh --skip-seed       # don't seed (already seeded)
./deploy.sh --skip-ssl        # skip certbot (certs already set up)

# Check status
./deploy.sh --status

# Rollback to previous version
./deploy.sh --rollback
```

### 4.4 What the deploy script does (in order)

1. **Pre-flight checks** — verifies Docker, Docker Compose, `.env` exists with
   required secrets (`JWT_SECRET`, `COOKIE_SECRET`).
2. **Database backup** — `pg_dump` of the current database to `backups/`.
3. **Pull latest code** — `git pull origin main`.
4. **Build Docker images** — `docker compose build medusa storefront`.
5. **Run migrations** — `medusa db:migrate` (v2 command, NOT v1
   `medusa migrations run`).
6. **Seed data** — `medusa exec src/scripts/seed.ts` (unified v2 seed script
   that creates region, categories, products with paise prices, pincodes, GST
   tax rates, COD payment provider, and the default admin user).
7. **Start services** — `docker compose up -d` (postgres, redis, medusa,
   storefront) + monitoring stack.
8. **SSL setup** — certbot obtains Let's Encrypt certs for all subdomains;
   sets up auto-renewal cron.
9. **Post-deploy** — prunes old Docker images. Does **NOT** create a duplicate
   admin user (the seed script already created `admin@myntra-clone.com`).

### 4.5 Manual deployment (without deploy.sh)

If you prefer to run steps individually:

```bash
# 1. Start infrastructure
docker compose -f docker-compose.prod.yml up -d postgres redis

# 2. Wait for healthchecks
docker compose -f docker-compose.prod.yml ps  # both "healthy"

# 3. Run migrations
docker compose -f docker-compose.prod.yml run --rm medusa npx medusa db:migrate

# 4. Seed (first time only)
docker compose -f docker-compose.prod.yml run --rm medusa npx medusa exec src/scripts/seed.ts

# 5. Start all services
docker compose -f docker-compose.prod.yml up -d

# 6. Start monitoring (optional)
docker compose -f docker-compose.monitoring.yml up -d

# 7. Set up nginx + SSL
#    Install nginx, copy nginx/default.conf to /etc/nginx/conf.d/
#    Run certbot for each subdomain
```

### 4.6 Verify the production deployment

```bash
# Health checks
curl https://api.your-domain.com/health        # → OK
curl https://your-domain.com/                  # → storefront HTML

# Store API
curl https://api.your-domain.com/store/products | jq '.products | length'
# → N > 0

# Admin panel
# Open https://admin.your-domain.com/app in your browser
# (redirects from https://admin.your-domain.com/ → /app automatically)
# Login: admin@myntra-clone.com / admin123

# Service status
./deploy.sh --status
```

---

## 5. Environment Variables Reference

### Medusa v2 Backend (required)

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgres://user:pass@host:5432/db` |
| `REDIS_URL` | Redis connection string | `redis://host:6379` |
| `JWT_SECRET` | JWT signing secret (≥ 32 chars) | `openssl rand -hex 32` |
| `COOKIE_SECRET` | Cookie signing secret (≥ 32 chars) | `openssl rand -hex 32` |
| `STORE_CORS` | Allowed storefront origin(s) | `https://your-domain.com` |
| `ADMIN_CORS` | Allowed admin origin(s) | `https://admin.your-domain.com` |
| `AUTH_CORS` | Allowed auth origin(s) (v2 required) | `https://admin.your-domain.com` |

### Optional

| Variable | Description | Default |
|----------|-------------|---------|
| `MEDUSA_DISABLE_TELEMETRY` | Disable anonymous telemetry | `false` |
| `LOG_LEVEL` | Log verbosity | `info` |
| `SENTRY_DSN` | Sentry error tracking | (not set) |

### NOT used in this pass

| Variable | Reason |
|----------|--------|
| `RAZORPAY_KEY_ID` | COD-only per §6.1; Razorpay deferred |
| `RAZORPAY_KEY_SECRET` | COD-only per §6.1; Razorpay deferred |
| `SENDGRID_API_KEY` | Email notifications deferred (post-launch) |
| `SENDGRID_FROM_EMAIL` | Email notifications deferred |
| `DATABASE_TYPE` | v1-only env var; removed (v2 infers from `DATABASE_URL`) |

---

## 6. Default Admin Credentials

The seed script (`backend/src/scripts/seed.ts`) creates a default admin user:

| Field | Value |
|-------|-------|
| Email | `admin@myntra-clone.com` |
| Password | `admin123` |

> ⚠️ **CRITICAL: Change this password immediately after first boot.**
>
> The default password is well-known and must not remain in production.
> Change it via:
>
> ```bash
> docker compose -f docker-compose.prod.yml exec medusa \
>   npx medusa user -e admin@myntra-clone.com -p <new-strong-password>
> ```
>
> Or log into the admin panel at `https://admin.your-domain.com/app` and
> change it in Settings → Profile.

---

## 7. Payments — COD Only

Per the resolved decision (§6.1 of the production-ready plan), this deployment
uses **Cash on Delivery (COD)** as the sole payment method. This is implemented
via the Medusa v2 `manual` payment provider.

- **No Razorpay keys are needed** for this pass.
- The `.env.production.example` file documents where to add Razorpay keys
  when you're ready to enable online payments.
- To enable Razorpay later, you'll need a v2-compatible Razorpay payment
  provider (the v1 `medusa-payment-razorpay` package is NOT v2-compatible).

---

## 8. M4 Integration Risk: medusa-js vs js-sdk

The storefront uses the Medusa JS client to talk to the backend. There are two
packages:

| Package | Status | Notes |
|---------|--------|-------|
| `@medusajs/medusa-js` | v1-era SDK | May have auth-persistence issues with v2 |
| `@medusajs/js-sdk` | v2 SDK | The recommended v2 client |

**Risk:** If the storefront uses `@medusajs/medusa-js` (v1-era), customer
auth may not persist correctly — the v2 backend uses cookie-based sessions
that the v1 SDK may not handle automatically. If auth issues are observed
during M4 integration testing, migrate the storefront to `@medusajs/js-sdk`.

**Check which SDK is installed:**
```bash
cd storefront && grep -E "medusa-js|js-sdk" package.json
```

If `@medusajs/medusa-js` is present and auth doesn't persist, switch to
`@medusajs/js-sdk` and update the client initialization in
`storefront/src/lib/medusa.ts` (or `api.ts`).

---

## 9. TODO(prod) — Post-Launch Items

These items are documented as known deferred work and should be addressed
before or shortly after production launch:

- [ ] **Host product images on own CDN.** Product images currently point to
      `assets.myntassets.com` placeholder URLs. For production, host images on
      your own CDN or configure the Medusa file service (S3, etc.). The
      `next.config.js` `images.remotePatterns` allows `assets.myntassets.com`
      for now, but these URLs may break.

- [ ] **Configure real domain + DNS.** Replace `myntra-clone.local` in all
      config files (nginx, `.env`, CORS settings) with your real domain.
      Create DNS A records for `your-domain.com`, `www`, `admin`, `api`, and
      `uploads` subdomains pointing to your server's IP.

- [ ] **Add Razorpay payment provider.** When ready to accept online payments,
      obtain Razorpay API keys, integrate a v2-compatible Razorpay provider,
      and add `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` to `.env`.

- [ ] **Set up external monitoring.** Configure an external uptime monitor
      (UptimeRobot, BetterStack, etc.) to ping `https://api.your-domain.com/health`
      and `https://your-domain.com/` at regular intervals. Set up alerting
      (email/Slack) for downtime.

- [ ] **Configure email notifications.** Set up SendGrid (or another provider)
      for transactional emails (order confirmations, shipping updates, etc.).
      Add `SENDGRID_API_KEY` and `SENDGRID_FROM_EMAIL` to `.env`.

- [ ] **Set up CI/CD.** GitHub Actions or similar for automated build, test,
      and deploy on push to `main`.

- [ ] **Database backups.** The deploy script creates a one-time backup before
      each deploy. Set up automated daily backups with retention policy and
      off-site storage.

- [ ] **Rate limit tuning.** Review nginx rate limits (`api_limit`, `auth_limit`,
      `admin_limit`) based on real traffic patterns after launch.

---

## Appendix: v2 Command Reference

| Task | v1 (obsolete) | v2 (correct) |
|------|----------------|--------------|
| Start server | `medusa start` | `medusa start` |
| Run migrations | `medusa migrations run` | `medusa db:migrate` |
| Seed data | `medusa seed` | `medusa exec src/scripts/seed.ts` |
| Create admin user | `medusa user -e ... -p ...` | `medusa user -e ... -p ...` |
| Dev server | `medusa develop` | `medusa develop` |
| Build | `medusa build` | `medusa build` |
| Admin app URL | (separate admin server) | `http://localhost:9000/app` |
| Health endpoint | (none / custom) | `GET /health` → `200 "OK"` |