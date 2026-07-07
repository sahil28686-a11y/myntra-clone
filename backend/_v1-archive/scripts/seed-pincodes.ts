import { MedusaContainer } from "@medusajs/medusa"
import { Pincode } from "../models/pincode"

export default async function seedPincodes(container: MedusaContainer) {
  const db = container.resolve("db")
  const pincodeRepo = db.getRepository(Pincode)

  const pincodes = [
    // Metros
    { pincode: "110001", city: "New Delhi", state: "Delhi", is_serviceable: true, estimated_days: 2 },
    { pincode: "110002", city: "New Delhi", state: "Delhi", is_serviceable: true, estimated_days: 2 },
    { pincode: "400001", city: "Mumbai", state: "Maharashtra", is_serviceable: true, estimated_days: 2 },
    { pincode: "400002", city: "Mumbai", state: "Maharashtra", is_serviceable: true, estimated_days: 2 },
    { pincode: "700001", city: "Kolkata", state: "West Bengal", is_serviceable: true, estimated_days: 3 },
    { pincode: "600001", city: "Chennai", state: "Tamil Nadu", is_serviceable: true, estimated_days: 3 },
    { pincode: "560001", city: "Bangalore", state: "Karnataka", is_serviceable: true, estimated_days: 2 },
    { pincode: "500001", city: "Hyderabad", state: "Telangana", is_serviceable: true, estimated_days: 2 },
    { pincode: "380001", city: "Ahmedabad", state: "Gujarat", is_serviceable: true, estimated_days: 3 },
    { pincode: "411001", city: "Pune", state: "Maharashtra", is_serviceable: true, estimated_days: 2 },

    // Tier-2 cities
    { pincode: "302001", city: "Jaipur", state: "Rajasthan", is_serviceable: true, estimated_days: 3 },
    { pincode: "226001", city: "Lucknow", state: "Uttar Pradesh", is_serviceable: true, estimated_days: 3 },
    { pincode: "800001", city: "Patna", state: "Bihar", is_serviceable: true, estimated_days: 4 },
    { pincode: "462001", city: "Bhopal", state: "Madhya Pradesh", is_serviceable: true, estimated_days: 3 },
    { pincode: "452001", city: "Indore", state: "Madhya Pradesh", is_serviceable: true, estimated_days: 3 },
    { pincode: "682001", city: "Kochi", state: "Kerala", is_serviceable: true, estimated_days: 3 },
    { pincode: "641001", city: "Coimbatore", state: "Tamil Nadu", is_serviceable: true, estimated_days: 3 },
    { pincode: "520001", city: "Vijayawada", state: "Andhra Pradesh", is_serviceable: true, estimated_days: 3 },
    { pincode: "160001", city: "Chandigarh", state: "Chandigarh", is_serviceable: true, estimated_days: 2 },
    { pincode: "248001", city: "Dehradun", state: "Uttarakhand", is_serviceable: true, estimated_days: 3 },
    { pincode: "834001", city: "Ranchi", state: "Jharkhand", is_serviceable: true, estimated_days: 4 },
    { pincode: "751001", city: "Bhubaneswar", state: "Odisha", is_serviceable: true, estimated_days: 3 },
    { pincode: "781001", city: "Guwahati", state: "Assam", is_serviceable: true, estimated_days: 4 },
    { pincode: "395001", city: "Surat", state: "Gujarat", is_serviceable: true, estimated_days: 3 },
    { pincode: "440001", city: "Nagpur", state: "Maharashtra", is_serviceable: true, estimated_days: 3 },
    { pincode: "274001", city: "Kushinagar", state: "Uttar Pradesh", is_serviceable: true, estimated_days: 5 },
    { pincode: "144001", city: "Jalandhar", state: "Punjab", is_serviceable: true, estimated_days: 3 },
    { pincode: "313001", city: "Udaipur", state: "Rajasthan", is_serviceable: true, estimated_days: 3 },
    { pincode: "342001", city: "Jodhpur", state: "Rajasthan", is_serviceable: true, estimated_days: 3 },
    { pincode: "474001", city: "Gwalior", state: "Madhya Pradesh", is_serviceable: true, estimated_days: 3 },

    // Non-serviceable (remote areas)
    { pincode: "194101", city: "Kargil", state: "Ladakh", is_serviceable: false, estimated_days: 0 },
    { pincode: "744101", city: "Port Blair", state: "Andaman & Nicobar", is_serviceable: false, estimated_days: 0 },
  ]

  for (const p of pincodes) {
    try {
      const existing = await pincodeRepo.findOne({ where: { pincode: p.pincode } })
      if (!existing) {
        await pincodeRepo.save(pincodeRepo.create(p))
      }
    } catch (err: any) {
      console.log(`Skipped pincode ${p.pincode}: ${err.message}`)
    }
  }

  console.log(`Seeded ${pincodes.length} pincodes!`)
}
