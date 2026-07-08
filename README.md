# Myntra Clone — Medusa v2 + Next.js 14

A full-featured clone of [Myntra.com](https://www.myntra.com) (Indian fashion e-commerce) built on **Medusa.js v2** (backend) + **Next.js 14** App Router (storefront), with India-specific features (INR region, pincode checker, COD payments, wishlist, returns).

> **Status:** Live on a VPS behind nginx-proxy-manager + Let's Encrypt. See `progress.md` for the full build history.

## Live demo

| URL | Purpose |
|---|---|
| `https://shop.smcloud.cloud` | Storefront (Next.js) |
| `https://api.smcloud.cloud` | Medusa Store API + admin at `/app` |
| `https://admin.smcloud.cloud/app` | Medusa admin dashboard |

## Tech stack

- **Backend:** Medusa.js v2.17 (`@medusajs/framework` + `@medusajs/medusa`), custom v2 modules (pincode, review, wishlist, return-request), admin extensions (dashboard widget + 6 custom routes).
- **Storefront:** Next.js 14 (App Router), Tailwind CSS with Myntra design tokens, `@medusajs/js-sdk` v2.
- **DB/Cache:** PostgreSQL 15, Redis 7.
- **Payments:** COD via the built-in `pp_system_default` provider.
- **Infra:** Docker Compose for Postgres/Redis; backend + storefront run on the host under systemd; nginx-proxy-manager edge + Let's Encrypt.

## Repo layout

```
backend/      # Medusa v2 backend (medusa-config.ts, src/modules, src/api, src/admin, src/scripts/seed.ts)
storefront/   # Next.js 14 storefront (src/app, src/lib/api.ts, tailwind)
docker-compose.yml          # dev: postgres + redis
docker-compose.vps.yml      # VPS deploy (NPM edge variant)
docker-compose.prod.yml     # standalone prod (nginx + certbot) — reference, superseded by the VPS/NPM setup
docs/                       # design + deployment guides
progress.md                 # session-by-session progress log
```

## Local development

```bash
# 1. Start Postgres + Redis
docker compose up -d postgres redis

# 2. Backend
cd backend
cp .env.example .env            # fill in DATABASE_URL, JWT_SECRET, COOKIE_SECRET
npm install
npm run dev                     # http://localhost:9000

# 3. Storefront
cd ../storefront
cp .env.example .env.local      # set NEXT_PUBLIC_MEDUSA_URL + publishable key
npm install
npm run dev                     # http://localhost:3000
```

## Seeding

```bash
cd backend
npx medusa db:migrate
npx medusa db:sync-links
npx medusa exec src/scripts/seed.ts
```

The seed creates an India region (INR), categories, sample products, a default sales channel, and a publishable API key. **Note:** the seed's `remoteLink.create` for `api_key↔sales_channel` fails in the `medusa exec` context (the `PublishableApiKeySalesChannel` link is not registered there); link the publishable key to the sales channel via the admin API after seeding:

```http
POST /admin/api-keys/:id/sales-channels
Authorization: Bearer <admin jwt>
{ "add": ["<sales_channel_id>"] }
```

## Deployment

See `docs/deployment-guide.md` and the session-8 entry in `progress.md` for the VPS/NPM deployment that is currently live.

## License

MIT — see the Myntra design tokens/imagery: this is a learning project; Myntra's brand, logos, and product imagery belong to Myntra (Myntra Designs Pvt. Ltd.).