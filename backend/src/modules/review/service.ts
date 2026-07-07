import { MedusaService } from "@medusajs/framework/utils"
import { Review } from "./models/review"

/**
 * Review module service.
 *
 * Extends the v2 `MedusaService` base. Auto-generated CRUD:
 * createReviews, listReviews, retrieveReview, deleteReviews, updateReviews.
 * We add an aggregate helper for the average rating.
 */
class ReviewModuleService extends MedusaService({ Review }) {
  /**
   * Returns `{ average, count }` for a product's reviews.
   * `average` is 0 when there are no reviews (avoids NaN).
   */
  async getAverageRating(productId: string): Promise<{
    average: number
    count: number
  }> {
    const reviews = (await this.listReviews({ product_id: productId })) as any[]
    const count = reviews.length
    if (count === 0) {
      return { average: 0, count: 0 }
    }
    const sum = reviews.reduce((acc, r) => acc + (Number(r.rating) || 0), 0)
    return { average: sum / count, count }
  }
}

export default ReviewModuleService