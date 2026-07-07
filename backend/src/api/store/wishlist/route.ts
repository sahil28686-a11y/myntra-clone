import type {
  MedusaStoreRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"

/**
 * GET /store/wishlist  (auth — customer)
 * POST /store/wishlist (auth — customer)
 *
 * The `authenticate("customer", ...)` middleware is registered in
 * `src/api/middlewares.ts`. v2 populates `req.auth_context.actor_id` with the
 * customer id (verified in @medusajs/medusa dist/api/store/customers/me/
 * route.js). The wishlist module service is resolved via
 * `container.resolve("wishlist")`.
 */

interface AddWishlistBody {
  product_id: string
  variant_id?: string | null
}

// GET — list the authenticated customer's wishlist
export async function GET(
  req: MedusaStoreRequest,
  res: MedusaResponse
) {
  if (!req.auth_context?.actor_id) {
    throw new MedusaError(
      MedusaError.Types.UNAUTHORIZED,
      "You must be logged in to view your wishlist"
    )
  }
  const customerId = req.auth_context.actor_id
  const wishlistService = req.scope.resolve("wishlist") as any

  const wishlist = await wishlistService.listWishlists({ customer_id: customerId })
  res.json({ wishlist })
}

// POST — add to wishlist (deduped by customer + product + variant)
export async function POST(
  req: MedusaStoreRequest<AddWishlistBody>,
  res: MedusaResponse
) {
  if (!req.auth_context?.actor_id) {
    throw new MedusaError(
      MedusaError.Types.UNAUTHORIZED,
      "You must be logged in to add to your wishlist"
    )
  }
  const customerId = req.auth_context.actor_id
  const body = req.validatedBody as AddWishlistBody

  if (!body?.product_id) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "product_id is required"
    )
  }

  const wishlistService = req.scope.resolve("wishlist") as any

  const item = await wishlistService.addWishlist({
    customer_id: customerId,
    product_id: body.product_id,
    variant_id: body.variant_id ?? null,
  })

  res.status(201).json({ wishlist: item })
}