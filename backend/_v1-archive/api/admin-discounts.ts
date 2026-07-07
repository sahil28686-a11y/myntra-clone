import { Router } from "express"

const router = Router()

// GET /admin/discounts — List all discounts
router.get("/admin/discounts", async (req, res) => {
  try {
    const medusa = req.app.get("medusa")
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 20
    const offset = (page - 1) * limit

    const [discounts, total] = await medusa.services.discountService.listAndCount(
      {},
      { skip: offset, take: limit, order: { created_at: "DESC" } }
    )

    return res.json({
      discounts,
      total,
      page,
      limit,
      total_pages: Math.ceil(total / limit),
    })
  } catch (err: any) {
    return res.status(500).json({ error: err.message })
  }
})

// GET /admin/discounts/:id — Get single discount
router.get("/admin/discounts/:id", async (req, res) => {
  try {
    const medusa = req.app.get("medusa")
    const discount = await medusa.services.discountService.retrieve(req.params.id, {
      relations: ["rule", "regions"],
    })
    return res.json({ discount })
  } catch (err: any) {
    return res.status(500).json({ error: err.message })
  }
})

// POST /admin/discounts — Create discount
router.post("/admin/discounts", async (req, res) => {
  try {
    const medusa = req.app.get("medusa")
    const discount = await medusa.services.discountService.create(req.body)
    return res.status(201).json({ discount })
  } catch (err: any) {
    return res.status(500).json({ error: err.message })
  }
})

// PUT /admin/discounts/:id — Update discount
router.put("/admin/discounts/:id", async (req, res) => {
  try {
    const medusa = req.app.get("medusa")
    const discount = await medusa.services.discountService.update(req.params.id, req.body)
    return res.json({ discount })
  } catch (err: any) {
    return res.status(500).json({ error: err.message })
  }
})

// DELETE /admin/discounts/:id — Delete discount
router.delete("/admin/discounts/:id", async (req, res) => {
  try {
    const medusa = req.app.get("medusa")
    await medusa.services.discountService.delete(req.params.id)
    return res.json({ message: "Discount deleted successfully" })
  } catch (err: any) {
    return res.status(500).json({ error: err.message })
  }
})

export default router
