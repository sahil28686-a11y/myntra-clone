import { defineConfig } from "@medusajs/framework/utils"

/**
 * Medusa v2 backend configuration for the Myntra clone.
 *
 * Note on the import: In @medusajs/framework@2.17.2 `defineConfig` is not
 * re-exported from the package root. It lives in `@medusajs/utils` (a
 * dependency of the framework) and is surfaced via the framework's `./utils`
 * subpath export (see framework package.json `exports["./utils"]` ->
 * `dist/utils/index.js` which does `export * from "@medusajs/utils"`).
 *
 * Environment variables are read from `process.env` (loaded automatically by
 * Medusa from `backend/.env`).
 */
module.exports = defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    redisUrl: process.env.REDIS_URL,
    http: {
      storeCors: process.env.STORE_CORS || "http://localhost:3000",
      adminCors: process.env.ADMIN_CORS || "http://localhost:9000",
      authCors: process.env.AUTH_CORS || "http://localhost:9000",
      jwtSecret: process.env.JWT_SECRET,
      cookieSecret: process.env.COOKIE_SECRET,
    },
  },
  plugins: [],
  modules: {},
})