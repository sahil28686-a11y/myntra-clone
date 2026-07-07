import { Router } from "express"
import { Wishlist } from "../models/wishlist"

const router = Router()

// GET /store/wishlist — Get customer's wishlist
router.get("/store/wishlist", async (req, res) => {
  const customer_id = req.user?.customer_id
  if (!customer_id) {
    return res.status(401).json({ error: "Authentication required" })
  }

  const wishlistRepo = req.app.get("db").getRepository(Wishlist)
  const items = await wishlistRepo.find({
    where: { customer_id },
    order: { created_at: "DESC" },
  })

  return res.json({ wishlist: items })
})

// POST /store/wishlist — Add item to wishlist
router.post("/store/wishlist", async (req, res) => {
  const customer_id = req.user?.customer_id
  if (!customer_id) {
    return res.status(401).json({ error: "Authentication required" })
  }

  const { product_id, variant_id } = req.body
  if (!product_id) {
    return res.status(400).json({ error: "product_id is required" })
  }

  const wishlistRepo = req.app.get("db").getRepository(Wishlist)

  // Check if already exists
  const existing = await wishlistRepo.findOne({
    where: { customer_id, product_id, variant_id: variant_id || null },
  })
  if (existing) {
    return res.status(409).json({ error: "Item already in wishlist" })
  }

  const item = wishlistRepo.create({ customer_id, product_id, variant_id })
  const saved = await wishlistRepo.save(item)
  return res.status(201).json(saved)
})

// DELETE /store/wishlist/:id — Remove from wishlist
router.delete("/store/wishlist/:id", async (req, res) => {
  const customer_id = req.user?.customer_id
  if (!customer_id) {
    return res.status(401).json({ error: "Authentication required" })
  }

  const wishlistRepo = req.app.get("db").getRepository(Wishlist)
  const item = await wishlistRepo.findOne({
    where: { id: req.params.id, customer_id },
  })

  if (!item) {
    return res.status(404).json({ error: "Wishlist item not found" })
  }

  await wishlistRepo.remove(item)
  return res.json({ message: "Removed from wishlist" })
})

export default router
