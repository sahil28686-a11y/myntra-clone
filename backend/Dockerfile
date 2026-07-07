# =============================================================================
# Myntra Clone — Medusa v2 Backend Dockerfile
# =============================================================================
# Multi-stage build: install deps → build (medusa build) → lean runtime image.
# Migrations and seeding are NOT run here — they run against a live database
# via deploy.sh (medusa db:migrate / medusa exec src/scripts/seed.ts).
# =============================================================================

# ---- Build stage ----
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies first for better layer caching
COPY package.json package-lock.json* ./
RUN npm ci

# Copy source and build the v2 app (npm run build → medusa build)
COPY . .
RUN npm run build

# Prune devDependencies for a leaner runtime image
RUN npm prune --omit=dev

# ---- Runtime stage ----
FROM node:20-alpine

WORKDIR /app

# Runtime deps only (node_modules already pruned to production deps)
COPY --from=builder /app ./

# Medusa v2 listens on 9000; admin app served at /app path
ENV NODE_ENV=production
EXPOSE 9000

# v2 health endpoint: GET /health → 200 "OK"
# (evidence: @medusajs/medusa/dist/commands/start.js — app.get("/health", ...))
HEALTHCHECK --interval=30s --timeout=10s --retries=3 --start-period=60s \
  CMD wget --no-verbose --tries=1 --spider http://localhost:9000/health || exit 1

# medusa start — serves the API (port 9000) and the native admin app at /app
CMD ["npx", "medusa", "start"]