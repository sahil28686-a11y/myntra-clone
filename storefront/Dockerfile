# =============================================================================
# Myntra Clone — Next.js 14 Storefront Dockerfile
# =============================================================================
# Next.js inlines NEXT_PUBLIC_* env vars at BUILD time, so they must be present
# during `next build`. They are passed as build args from docker-compose.vps.yml
# and exported into the build environment.
# =============================================================================

FROM node:20-alpine AS builder

WORKDIR /app

ARG NODE_ENV=production
ARG NEXT_PUBLIC_MEDUSA_URL
ARG NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY
ENV NODE_ENV=${NODE_ENV}
ENV NEXT_PUBLIC_MEDUSA_URL=${NEXT_PUBLIC_MEDUSA_URL}
ENV NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=${NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY}

COPY package.json package-lock.json* ./
RUN npm install

COPY . .
RUN npm run build

# ---- Runtime stage ----
FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app ./

ENV NODE_ENV=production
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --retries=3 --start-period=40s \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1

CMD ["npm", "run", "start"]