import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"

/**
 * GET /store/pincodes/:code
 *
 * Resolves the pincode module service (`container.resolve("pincode")`,
 * registered via Module("pincode", ...)) and returns serviceability info for
 * the given pincode, or 404 when not found.
 *
 * No auth required — pincode serviceability is a public lookup.
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const code = req.params.code as string
  const pincodeService = req.scope.resolve("pincode") as any

  const pincode = await pincodeService.getPincode(code)

  if (!pincode) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Pincode ${code} not found`
    )
  }

  res.json({
    pincode: pincode.code,
    is_serviceable: pincode.is_serviceable,
    estimated_days: pincode.estimated_days,
    city: pincode.city,
    state: pincode.state,
  })
}