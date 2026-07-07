import { model } from "@medusajs/framework/utils"

/**
 * Return-request data model (Medusa v2 DML / MikroORM).
 *
 * A customer's request to return one or more line items from an order.
 * `items` is a JSON array of `{ line_item_id, quantity, reason }`.
 * `status` defaults to "pending" and is advanced by an admin/ops flow.
 * `pickup_address` is an optional JSON address object.
 */
export const ReturnRequest = model.define("return_request", {
  id: model.id({ prefix: "rtrn" }).primaryKey(),
  order_id: model.text().searchable(),
  customer_id: model.text().searchable(),
  items: model.json(),
  status: model.text(),
  pickup_address: model.json().nullable(),
})

export default ReturnRequest