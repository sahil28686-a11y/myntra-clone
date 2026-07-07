import { Router } from "express"
import { Pincode } from "../models/pincode"

const router = Router()

// GET /store/pincodes/:code — Check pincode serviceability
router.get("/store/pincodes/:code", async (req, res) => {
  const { code } = req.params

  if (!/^\d{6}$/.test(code)) {
    return res.status(400).json({ error: "Invalid pincode format" })
  }

  const pincodeRepo = req.app.get("db").getRepository(Pincode)
  const pincode = await pincodeRepo.findOne({ where: { pincode: code } })

  if (!pincode) {
    return res.status(404).json({
      pincode: code,
      is_serviceable: false,
      message: "Pincode not serviceable",
    })
  }

  return res.json({
    pincode: pincode.pincode,
    is_serviceable: pincode.is_serviceable,
    estimated_days: pincode.estimated_days,
    city: pincode.city,
    state: pincode.state,
  })
})

export default router
