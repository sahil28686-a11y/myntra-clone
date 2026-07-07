import { defineMiddlewares } from "@medusajs/medusa"

/**
 * v2 middleware registration for custom API routes.
 *
 * `defineMiddlewares` is re-exported from @medusajs/medusa (see
 * dist/utils/define-middlewares.* -> @medusajs/framework/http). No custom
 * route middleware is required for M1; custom store routes (pincodes, reviews,
 * wishlist, returns) and their auth middleware are added in M2.
 */
export default defineMiddlewares({
  routes: [],
})