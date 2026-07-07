import { MedusaContainer } from "@medusajs/medusa"

export default async function seedPayment(container: MedusaContainer) {
  const regionService = container.resolve("regionService")
  const paymentProviderService = container.resolve("paymentProviderService")

  // Find India region
  let indiaRegion
  try {
    const regions = await regionService.list({ name: "India" })
    indiaRegion = regions[0]
  } catch (err: any) {
    console.log("India region not found, skipping payment seeding")
    return
  }

  if (!indiaRegion) {
    console.log("India region not found, skipping payment seeding")
    return
  }

  // Enable manual payment (COD) for India region
  try {
    await paymentProviderService.registerInstalledProvider(["manual"])
    console.log("Manual payment provider registered")
  } catch (err: any) {
    console.log(`Manual payment provider already registered: ${err.message}`)
  }

  // Enable Razorpay
  try {
    await paymentProviderService.registerInstalledProvider(["razorpay"])
    console.log("Razorpay payment provider registered")
  } catch (err: any) {
    console.log(`Razorpay already registered: ${err.message}`)
  }

  console.log("Payment providers seeded successfully!")
}
