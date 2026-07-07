import type {
  MedusaStoreRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"

/**
 * GET /store/returns/:id  (auth — customer + ownership)
 *
 * The `authenticate("customer", ...)` middleware is registered in
 * `src/api/middlewares.ts`. The return-request service's `getReturn`
 * performs the ownership check (request must belong to the customer).
 */
export async function GET(
  req: MedusaStoreRequest,
  res: MedusaResponse
) {
  if (!req.auth_context?.actor_id) {
    throw new MedusaError(
      MedusaError.Types.UNAUTHORIZED,
      "You must be logged in to view a return request"
    )
  }
  const customerId = req.auth_context.actor_id
  const id = req.params.id as string

  const returnService = req.scope.resolve("return_request") as any

  const returnRequest = await returnService.getReturn(id, customerId)
  if (!returnRequest) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      "Return request not found or does not belong to this customer"
    )
  }

  res.json({ return_request: returnRequest })
}