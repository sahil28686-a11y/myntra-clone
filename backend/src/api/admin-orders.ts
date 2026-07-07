import { Router } from "express"

const router = Router()

// GET /admin/orders — List all orders with pagination
router.get("/admin/orders", async (req, res) => {
  try {
    const medusa = req.app.get("medusa")
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 20
    const offset = (page - 1) * limit
    const status = req.query.status as string

    const filter: any = {}
    if (status && status !== "all") {
      filter.status = status
    }

    const [orders, total] = await medusa.services.orderService.listAndCount(
      filter,
      { skip: offset, take: limit, order: { created_at: "DESC" } }
    )

    return res.json({
      orders,
      total,
      page,
      limit,
      total_pages: Math.ceil(total / limit),
    })
  } catch (err: any) {
    return res.status(500).json({ error: err.message })
  }
})

// GET /admin/orders/:id — Get single order with details
router.get("/admin/orders/:id", async (req, res) => {
  try {
    const medusa = req.app.get("medusa")
    const order = await medusa.services.orderService.retrieve(req.params.id, {
      relations: ["items", "shipping_address", "billing_address", "payments", "fulfillments", "returns"],
    })
    return res.json({ order })
  } catch (err: any) {
    return res.status(500).json({ error: err.message })
  }
})

// PUT /admin/orders/:id/status — Update order status
router.put("/admin/orders/:id/status", async (req, res) => {
  try {
    const medusa = req.app.get("medusa")
    const { status } = req.body
    const order = await medusa.services.orderService.update(req.params.id, { status })
    return res.json({ order })
  } catch (err: any) {
    return res.status(500).json({ error: err.message })
  }
})

// POST /admin/orders/:id/fulfill — Fulfill order
router.post("/admin/orders/:id/fulfill", async (req, res) => {
  try {
    const medusa = req.app.get("medusa")
    const { items } = req.body
    const result = await medusa.services.fulfillmentService.createFulfillment(
      req.params.id,
      items || []
    )
    return res.json({ fulfillment: result })
  } catch (err: any) {
    return res.status(500).json({ error: err.message })
  }
})

// POST /admin/orders/:id/ship — Ship order
router.post("/admin/orders/:id/ship", async (req, res) => {
  try {
    const medusa = req.app.get("medusa")
    const { fulfillment_id, tracking_numbers } = req.body
    const result = await medusa.services.fulfillmentService.createShipment(
      req.params.id,
      fulfillment_id,
      tracking_numbers || []
    )
    return res.json({ order: result })
  } catch (err: any) {
    return res.status(500).json({ error: err.message })
  }
})

export default router
