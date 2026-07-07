import { Router } from "express"

const router = Router()

// GET /admin/settings — Get store settings
router.get("/admin/settings", async (req, res) => {
  try {
    const medusa = req.app.get("medusa")
    const store = await medusa.services.storeService.retrieve()
    return res.json({ store })
  } catch (err: any) {
    return res.status(500).json({ error: err.message })
  }
})

// PUT /admin/settings — Update store settings
router.put("/admin/settings", async (req, res) => {
  try {
    const medusa = req.app.get("medusa")
    const store = await medusa.services.storeService.update(req.body)
    return res.json({ store })
  } catch (err: any) {
    return res.status(500).json({ error: err.message })
  }
})

// GET /admin/settings/payment — Get payment provider settings
router.get("/admin/settings/payment", async (req, res) => {
  try {
    const medusa = req.app.get("medusa")
    const providers = await medusa.services.paymentProviderService.list()
    return res.json({ providers })
  } catch (err: any) {
    return res.status(500).json({ error: err.message })
  }
})

// GET /admin/returns — List all return requests
router.get("/admin/returns", async (req, res) => {
  try {
    const { ReturnRequest } = require("../models/return-request")
    const returnRepo = req.app.get("db").getRepository(ReturnRequest)
    const returns = await returnRepo.find({
      order: { created_at: "DESC" },
      take: 50,
    })
    return res.json({ returns })
  } catch (err: any) {
    return res.status(500).json({ error: err.message })
  }
})

// PUT /admin/returns/:id/status — Update return request status
router.put("/admin/returns/:id/status", async (req, res) => {
  try {
    const { ReturnRequest } = require("../models/return-request")
    const returnRepo = req.app.get("db").getRepository(ReturnRequest)
    const { status } = req.body

    const returnRequest = await returnRepo.findOne({ where: { id: req.params.id } })
    if (!returnRequest) {
      return res.status(404).json({ error: "Return request not found" })
    }

    returnRequest.status = status
    const saved = await returnRepo.save(returnRequest)
    return res.json({ return_request: saved })
  } catch (err: any) {
    return res.status(500).json({ error: err.message })
  }
})

export default router
