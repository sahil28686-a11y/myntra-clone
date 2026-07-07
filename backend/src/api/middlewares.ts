import multer from "multer"
import { defineMiddlewares, authenticate } from "@medusajs/medusa"

// In-memory multer for the bulk-upload admin route (mirrors v2 core's
// admin/uploads middlewares.js, which uses multer.memoryStorage()). v2 does
// NOT auto-parse multipart — a multer middleware must be registered per route.
const upload = multer({ storage: multer.memoryStorage() })

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
    // Admin bulk-upload — parse the multipart `file` field. Admin routes are
    // auth-protected by default; this only adds multipart parsing.
    {
      method: "POST",
      matcher: "/admin/products/bulk-upload",
      middlewares: [upload.single("file")],
    },
  ],
})