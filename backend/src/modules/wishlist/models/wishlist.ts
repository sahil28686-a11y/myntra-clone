import { model } from "@medusajs/framework/utils"

/**
 * Wishlist data model (Medusa v2 DML / MikroORM).
 *
 * A customer's saved products. `variant_id` is optional — a wishlist entry
 * can target a product or a specific variant. Dedup is enforced in the
 * service by customer_id + product_id + variant_id.
 */
export const Wishlist = model.define("wishlist", {
  id: model.id({ prefix: "wish" }).primaryKey(),
  customer_id: model.text().searchable(),
  product_id: model.text().searchable(),
  variant_id: model.text().nullable(),
})

export default Wishlist