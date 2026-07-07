import { Router } from "express"

const router = Router()

// GET /admin/customers — List all customers with pagination
router.get("/admin/customers", async (req, res) => {
  try {
    const medusa = req.app.get("medusa")
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 20
    const offset = (page - 1) * limit
    const q = req.query.q as string

    const filter: any = {}
    if (q) {
      filter.q = q
    }

    const [customers, total] = await medusa.services.customerService.listAndCount(
      filter,
      { skip: offset, take: limit, order: { created_at: "DESC" } }
    )

    return res.json({
      customers,
      total,
      page,
      limit,
      total_pages: Math.ceil(total / limit),
    })
  } catch (err: any) {
    return res.status(500).json({ error: err.message })
  }
})

// GET /admin/customers/:id — Get single customer with orders
router.get("/admin/customers/:id", async (req, res) => {
  try {
    const medusa = req.app.get("medusa")
    const customer = await medusa.services.customerService.retrieve(req.params.id, {
      relations: ["orders", "shipping_addresses"],
    })
    return res.json({ customer })
  } catch (err: any) {
    return res.status(500).json({ error: err.message })
  }
})

export default router
