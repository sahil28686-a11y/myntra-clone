import { defineMiddlewares, authenticate } from "@medusajs/medusa"

/**
 * v2 middleware registration for custom API routes.
 *
 * `defineMiddlewares` is re-exported from @medusajs/medusa (dist/utils/
 * define-middlewares.* -> @medusajs/framework/http). `authenticate` is
 * re-exported from @medusajs/medusa (dist/utils/middlewares -> framework/http
 * middlewares/authenticate-middleware) and matches the pattern used by core
 * store routes (see @medusajs/medusa dist/api/store/customers/middlewares.js,
 * which calls `authenticate("customer", ["session", "bearer"])`).
 *
 * Auth-required store routes: review POST, wishlist GET/POST/DELETE, returns
 * GET/POST. Pincode GET and review GET stay public.
 */
export default defineMiddlewares({
  routes: [
    {
      method: "POST",
      matcher: "/store/reviews",
      middlewares: [authenticate("customer", ["session", "bearer"])],
    },
    {
      method: ["GET", "POST"],
      matcher: "/store/wishlist",
      middlewares: [authenticate("customer", ["session", "bearer"])],
    },
    {
      method: "DELETE",
      matcher: "/store/wishlist/:id",
      middlewares: [authenticate("customer", ["session", "bearer"])],
    },
    {
      method: ["GET", "POST"],
      matcher: "/store/returns",
      middlewares: [authenticate("customer", ["session", "bearer"])],
    },
    {
      method: "GET",
      matcher: "/store/returns/:id",
      middlewares: [authenticate("customer", ["session", "bearer"])],
    },
  ],
})