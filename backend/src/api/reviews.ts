import { Router } from "express"
import { Review } from "../models/review"

const router = Router()

// GET /store/reviews/:product_id — Get reviews for a product
router.get("/store/reviews/:product_id", async (req, res) => {
  const { product_id } = req.params
  const page = parseInt(req.query.page as string) || 1
  const limit = parseInt(req.query.limit as string) || 10

  const reviewRepo = req.app.get("db").getRepository(Review)
  const [reviews, total] = await reviewRepo.findAndCount({
    where: { product_id },
    skip: (page - 1) * limit,
    take: limit,
    order: { created_at: "DESC" },
  })

  // Calculate average rating
  const avgResult = await reviewRepo
    .createQueryBuilder("review")
    .select("AVG(review.rating)", "avg")
    .where("review.product_id = :product_id", { product_id })
    .getRawOne()

  return res.json({
    reviews,
    total,
    page,
    limit,
    average_rating: parseFloat(avgResult?.avg || "0"),
    total_ratings: total,
  })
})

// POST /store/reviews — Submit a review
router.post("/store/reviews", async (req, res) => {
  const { product_id, rating, title, body, images } = req.body
  const customer_id = req.user?.customer_id

  if (!customer_id) {
    return res.status(401).json({ error: "Authentication required" })
  }

  if (!product_id || !rating || rating < 1 || rating > 5) {
    return res.status(400).json({ error: "product_id and rating (1-5) are required" })
  }

  const reviewRepo = req.app.get("db").getRepository(Review)
  const review = reviewRepo.create({
    product_id,
    customer_id,
    rating,
    title,
    body,
    images: images || [],
    is_verified: false,
  })

  const saved = await reviewRepo.save(review)
  return res.status(201).json(saved)
})

export default router
