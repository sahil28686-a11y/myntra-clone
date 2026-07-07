import { MedusaService } from "@medusajs/framework/utils"
import { Wishlist } from "./models/wishlist"

/**
 * Wishlist module service.
 *
 * Extends the v2 `MedusaService` base. Auto-generated CRUD:
 * createWishlists, listWishlists, retrieveWishlist, deleteWishlists,
 * updateWishlists. We add a dedup-guarded `addWishlist` and an
 * ownership-checked `removeWishlist`.
 */
class WishlistModuleService extends MedusaService({ Wishlist }) {
  /**
   * Add a wishlist entry, deduplicating by customer_id + product_id +
   * variant_id. Returns the existing entry if one already exists.
   */
  async addWishlist(data: {
    customer_id: string
    product_id: string
    variant_id?: string | null
  }) {
    const existing = (await this.listWishlists({
      customer_id: data.customer_id,
      product_id: data.product_id,
      variant_id: data.variant_id ?? null,
    })) as any[]

    if (existing.length > 0) {
      return existing[0]
    }

    const created = (await this.createWishlists({
      customer_id: data.customer_id,
      product_id: data.product_id,
      variant_id: data.variant_id ?? null,
    })) as any
    return created
  }

  /**
   * Remove a wishlist entry only if it belongs to `customerId`.
   * Returns `{ deleted: true }` on success or `{ deleted: false }` when the
   * entry does not exist or is owned by another customer.
   */
  async removeWishlist(id: string, customerId: string): Promise<boolean> {
    const entry = (await this.retrieveWishlist(id).catch(() => undefined)) as
      | any
      | undefined
    if (!entry || entry.customer_id !== customerId) {
      return false
    }
    await this.deleteWishlists([id])
    return true
  }
}

export default WishlistModuleService