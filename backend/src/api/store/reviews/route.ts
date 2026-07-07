import type {
  MedusaStoreRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"

/**
 * POST /store/reviews
 *
 * Auth-required (customer). The `authenticate("customer", ...)` middleware is
 * registered in `src/api/middlewares.ts` for this route; when authenticated
 * v2 populates `req.auth_context.actor_id` with the customer id (verified in
 * @medusajs/medusa dist/api/store/customers/me/route.js).
 *
 * Body: { product_id, rating (1-5), title?, body?, images?, is_verified? }
 */
interface CreateReviewBody {
  product_id: string
  rating: number
  title?: string
  body?: string
  images?: string[]
  is_verified?: boolean
}

export async function POST(
  req: MedusaStoreRequest<CreateReviewBody>,
  res: MedusaResponse
) {
  if (!req.auth_context?.actor_id) {
    throw new MedusaError(
      MedusaError.Types.UNAUTHORIZED,
      "You must be logged in to submit a review"
    )
  }

  const customerId = req.auth_context.actor_id
  const body = req.validatedBody as CreateReviewBody

  if (!body?.product_id || body?.rating == null) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "product_id and rating are required"
    )
  }

  if (body.rating < 1 || body.rating > 5) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "rating must be between 1 and 5"
    )
  }

  const reviewService = req.scope.resolve("review") as any

  const review = await reviewService.createReviews({
    product_id: body.product_id,
    customer_id: customerId,
    rating: body.rating,
    title: body.title ?? null,
    body: body.body ?? null,
    images: body.images ?? null,
    is_verified: body.is_verified ?? false,
  })

  res.status(201).json({ review })
}