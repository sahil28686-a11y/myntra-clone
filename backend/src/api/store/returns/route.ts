import type {
  MedusaStoreRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"

/**
 * GET  /store/returns  (auth — customer, scoped to the customer)
 * POST /store/returns  (auth — customer)
 *
 * The `authenticate("customer", ...)` middleware is registered in
 * `src/api/middlewares.ts`. v2 populates `req.auth_context.actor_id` with the
 * customer id. The return-request module service is resolved via
 * `container.resolve("return_request")`.
 */

interface ReturnItem {
  line_item_id: string
  quantity: number
  reason: string
}

interface CreateReturnBody {
  order_id: string
  items: ReturnItem[]
  pickup_address?: Record<string, unknown>
}

// GET — list the authenticated customer's return requests
export async function GET(
  req: MedusaStoreRequest,
  res: MedusaResponse
) {
  if (!req.auth_context?.actor_id) {
    throw new MedusaError(
      MedusaError.Types.UNAUTHORIZED,
      "You must be logged in to view your return requests"
    )
  }
  const customerId = req.auth_context.actor_id
  const returnService = req.scope.resolve("return_request") as any

  const returns = await returnService.listReturnRequests({ customer_id: customerId })
  res.json({ returns })
}

// POST — create a return request
export async function POST(
  req: MedusaStoreRequest<CreateReturnBody>,
  res: MedusaResponse
) {
  if (!req.auth_context?.actor_id) {
    throw new MedusaError(
      MedusaError.Types.UNAUTHORIZED,
      "You must be logged in to create a return request"
    )
  }
  const customerId = req.auth_context.actor_id
  const body = req.validatedBody as CreateReturnBody

  if (!body?.order_id || !Array.isArray(body?.items) || body.items.length === 0) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "order_id and a non-empty items array are required"
    )
  }

  const returnService = req.scope.resolve("return_request") as any

  const returnRequest = await returnService.createReturnRequests({
    order_id: body.order_id,
    customer_id: customerId,
    items: body.items,
    status: "pending",
    pickup_address: body.pickup_address ?? null,
  })

  res.status(201).json({ return_request: returnRequest })
}