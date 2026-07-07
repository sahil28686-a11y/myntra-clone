import { MedusaContainer } from "@medusajs/medusa";

export default async function seedRegion(container: MedusaContainer) {
  const regionService = container.resolve("regionService");

  const existing = await regionService.list({ name: "India" });
  if (existing.length > 0) {
    console.log("India region already exists. Skipping.");
    return;
  }

  await regionService.create({
    name: "India",
    currency_code: "inr",
    countries: ["IN"],
    tax_rate: 0,
    payment_providers: ["manual", "razorpay"],
    fulfillment_providers: ["manual"],
  });

  console.log("✓ India region created with INR currency");
}
