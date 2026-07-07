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
export default defineConfig({
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
  modules: [
    // Custom v2 modules. Array form is the recommended v2 config shape
    // (@medusajs/types InputConfigWithArrayModules). Each entry resolves the
    // module's index.ts which exports `Module("name", { service })`; the
    // registration name used by `container.resolve(name)` comes from the
    // `Module()` definition's first argument, NOT from the `key` field below.
    // `key` is only consumed for `scope: "external"` or `disable`-d modules
    // (see @medusajs/utils common/define-config.js transformModules). It is
    // retained here for explicitness but is redundant for these local modules.
    { resolve: "./src/modules/pincode", key: "pincode" },
    { resolve: "./src/modules/review", key: "review" },
    { resolve: "./src/modules/wishlist", key: "wishlist" },
    { resolve: "./src/modules/return-request", key: "return_request" },
  ],
})