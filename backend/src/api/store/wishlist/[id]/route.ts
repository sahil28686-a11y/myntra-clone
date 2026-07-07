import type {
  MedusaStoreRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"

/**
 * DELETE /store/wishlist/:id  (auth — customer + ownership)
 *
 * The `authenticate("customer", ...)` middleware is registered in
 * `src/api/middlewares.ts`. The wishlist service's `removeWishlist`
 * performs the ownership check (entry must belong to the customer).
 */
export async function DELETE(
  req: MedusaStoreRequest,
  res: MedusaResponse
) {
  if (!req.auth_context?.actor_id) {
    throw new MedusaError(
      MedusaError.Types.UNAUTHORIZED,
      "You must be logged in to modify your wishlist"
    )
  }
  const customerId = req.auth_context.actor_id
  const id = req.params.id as string

  const wishlistService = req.scope.resolve("wishlist") as any

  const deleted = await wishlistService.removeWishlist(id, customerId)
  if (!deleted) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      "Wishlist item not found or does not belong to this customer"
    )
  }

  res.json({ id, deleted: true })
}