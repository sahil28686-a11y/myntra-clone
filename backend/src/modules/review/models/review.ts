import { model } from "@medusajs/framework/utils"

/**
 * Review data model (Medusa v2 DML / MikroORM).
 *
 * Product reviews written by authenticated customers. `images` is a JSON
 * array of image URLs. `is_verified` marks reviews that come from a
 * confirmed purchase (default false; set by a future order-completion flow).
 */
export const Review = model.define("review", {
  id: model.id({ prefix: "rev" }).primaryKey(),
  product_id: model.text().searchable(),
  customer_id: model.text().searchable(),
  rating: model.number(),
  title: model.text().nullable(),
  body: model.text().nullable(),
  images: model.json().nullable(),
  is_verified: model.boolean(),
})

export default Review