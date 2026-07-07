import { Router } from "express"

const router = Router()

// GET /admin/products — List all products with pagination
router.get("/admin/products", async (req, res) => {
  try {
    const medusa = req.app.get("medusa")
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 20
    const offset = (page - 1) * limit

    const [products, total] = await medusa.services.productService.listAndCount(
      {},
      { skip: offset, take: limit, order: { created_at: "DESC" } }
    )

    return res.json({
      products,
      total,
      page,
      limit,
      total_pages: Math.ceil(total / limit),
    })
  } catch (err: any) {
    return res.status(500).json({ error: err.message })
  }
})

// GET /admin/products/:id — Get single product
router.get("/admin/products/:id", async (req, res) => {
  try {
    const medusa = req.app.get("medusa")
    const product = await medusa.services.productService.retrieve(req.params.id, {
      relations: ["variants", "options", "images", "categories", "tags"],
    })
    return res.json({ product })
  } catch (err: any) {
    return res.status(500).json({ error: err.message })
  }
})

// POST /admin/products — Create product
router.post("/admin/products", async (req, res) => {
  try {
    const medusa = req.app.get("medusa")
    const product = await medusa.services.productService.create(req.body)
    return res.status(201).json({ product })
  } catch (err: any) {
    return res.status(500).json({ error: err.message })
  }
})

// PUT /admin/products/:id — Update product
router.put("/admin/products/:id", async (req, res) => {
  try {
    const medusa = req.app.get("medusa")
    const product = await medusa.services.productService.update(req.params.id, req.body)
    return res.json({ product })
  } catch (err: any) {
    return res.status(500).json({ error: err.message })
  }
})

// DELETE /admin/products/:id — Delete product
router.delete("/admin/products/:id", async (req, res) => {
  try {
    const medusa = req.app.get("medusa")
    await medusa.services.productService.delete(req.params.id)
    return res.json({ message: "Product deleted successfully" })
  } catch (err: any) {
    return res.status(500).json({ error: err.message })
  }
})

export default router
