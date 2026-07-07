import { MedusaService } from "@medusajs/framework/utils"
import { Pincode } from "./models/pincode"

/**
 * Pincode module service.
 *
 * Extends the v2 `MedusaService` base (@medusajs/utils dist/modules-sdk/
 * medusa-service.d.ts) which auto-generates CRUD helpers (createPincodes,
 * listPincodes, retrievePincode, deletePincodes, ...) from the supplied
 * model map. We add a couple of convenience wrappers on top.
 */
class PincodeModuleService extends MedusaService({ Pincode }) {
  /**
   * Resolve a single pincode row by its `code` (e.g. "110001").
   * Returns `undefined` when not found.
   */
  async getPincode(code: string) {
    const rows = await this.listPincodes({ code })
    return rows[0]
  }
}

export default PincodeModuleService