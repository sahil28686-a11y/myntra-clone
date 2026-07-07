import { MedusaContainer } from "@medusajs/medusa"

export default async function seedTaxes(container: MedusaContainer) {
  const regionService = container.resolve("regionService")
  const taxRateService = container.resolve("taxRateService")

  // Find or create India region
  let indiaRegion
  try {
    const regions = await regionService.list({ name: "India" })
    indiaRegion = regions[0]
  } catch (err: any) {
    console.log("India region not found, skipping tax seeding")
    return
  }

  if (!indiaRegion) {
    console.log("India region not found, skipping tax seeding")
    return
  }

  const gstRates = [
    { name: "GST 0%", rate: 0, code: "GST0" },
    { name: "GST 5%", rate: 5, code: "GST5" },
    { name: "GST 12%", rate: 12, code: "GST12" },
    { name: "GST 18%", rate: 18, code: "GST18" },
    { name: "GST 28%", rate: 28, code: "GST28" },
  ]

  for (const gst of gstRates) {
    try {
      await taxRateService.create({
        region_id: indiaRegion.id,
        name: gst.name,
        rate: gst.rate,
        code: gst.code,
      })
      console.log(`Created tax rate: ${gst.name}`)
    } catch (err: any) {
      console.log(`Skipped tax rate ${gst.name}: ${err.message}`)
    }
  }

  console.log("Tax rates seeded successfully!")
}
