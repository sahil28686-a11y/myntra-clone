import { Router } from "express"
import { ReturnRequest } from "../models/return-request"

const router = Router()

// POST /store/returns — Request a return
router.post("/store/returns", async (req, res) => {
  const customer_id = req.user?.customer_id
  if (!customer_id) {
    return res.status(401).json({ error: "Authentication required" })
  }

  const { order_id, items, pickup_address } = req.body
  if (!order_id || !items || !items.length) {
    return res.status(400).json({ error: "order_id and items are required" })
  }

  const returnRepo = req.app.get("db").getRepository(ReturnRequest)
  const returnRequest = returnRepo.create({
    order_id,
    customer_id,
    items,
    pickup_address,
    status: "pending",
  })

  const saved = await returnRepo.save(returnRequest)
  return res.status(201).json(saved)
})

// GET /store/returns — Get customer's return requests
router.get("/store/returns", async (req, res) => {
  const customer_id = req.user?.customer_id
  if (!customer_id) {
    return res.status(401).json({ error: "Authentication required" })
  }

  const returnRepo = req.app.get("db").getRepository(ReturnRequest)
  const returns = await returnRepo.find({
    where: { customer_id },
    order: { created_at: "DESC" },
  })

  return res.json({ returns })
})

// GET /store/returns/:id — Get specific return request
router.get("/store/returns/:id", async (req, res) => {
  const customer_id = req.user?.customer_id
  if (!customer_id) {
    return res.status(401).json({ error: "Authentication required" })
  }

  const returnRepo = req.app.get("db").getRepository(ReturnRequest)
  const returnRequest = await returnRepo.findOne({
    where: { id: req.params.id, customer_id },
  })

  if (!returnRequest) {
    return res.status(404).json({ error: "Return request not found" })
  }

  return res.json(returnRequest)
})

export default router
