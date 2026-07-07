import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

/**
 * GET /store/reviews/:product_id
 *
 * Public: returns the list of reviews for a product plus the aggregate
 * average rating. Resolves the review module service
 * (`container.resolve("review")`).
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const productId = req.params.product_id as string
  const reviewService = req.scope.resolve("review") as any

  const reviews = (await reviewService.listReviews({
    product_id: productId,
  })) as any[]
  const { average, count } = await reviewService.getAverageRating(productId)

  res.json({
    reviews,
    total: count,
    average_rating: Math.round(average * 10) / 10,
  })
}