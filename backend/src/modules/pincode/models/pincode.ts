import { model } from "@medusajs/framework/utils"

/**
 * Pincode data model (Medusa v2 DML / MikroORM).
 *
 * Stores Indian pincodes with serviceability + delivery ETA for the
 * storefront's "check delivery" feature.
 *
 * Field shapes follow the verified v2 DML property API
 * (@medusajs/utils dist/dml/properties): model.text(), model.boolean(),
 * model.number(), model.id() and the .nullable() modifier.
 */
export const Pincode = model.define("pincode", {
  id: model.id({ prefix: "pinc" }).primaryKey(),
  code: model.text().searchable(),
  is_serviceable: model.boolean(),
  estimated_days: model.number(),
  city: model.text().nullable(),
  state: model.text().nullable(),
})

export default Pincode