import { MedusaService } from "@medusajs/framework/utils"
import { ReturnRequest } from "./models/return-request"

/**
 * Return-request module service.
 *
 * Extends the v2 `MedusaService` base. Auto-generated CRUD:
 * createReturnRequests, listReturnRequests, retrieveReturnRequest,
 * deleteReturnRequests, updateReturnRequests. We add an
 * ownership-checked `getReturn`.
 */
class ReturnRequestModuleService extends MedusaService({ ReturnRequest }) {
  /**
   * Retrieve a return request only if it belongs to `customerId`.
   * Returns `undefined` when the request does not exist or is owned by
   * another customer.
   */
  async getReturn(id: string, customerId: string) {
    const entry = (await this.retrieveReturnRequest(id).catch(
      () => undefined
    )) as any | undefined
    if (!entry || entry.customer_id !== customerId) {
      return undefined
    }
    return entry
  }
}

export default ReturnRequestModuleService