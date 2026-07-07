import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules, ContainerRegistrationKeys } from "@medusajs/framework/utils"

/**
 * POST /admin/products/bulk-upload
 *
 * Accepts multipart/form-data with a `file` field (CSV).
 * Columns: title, handle, description, price, sku
 *
 * For each row, creates a product with one default variant + a price (paise)
 * via the product and pricing modules, and links the variant to its price set
 * and the product to the default sales channel.
 *
 * Mirrors the product-creation patterns in src/scripts/seed.ts.
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const productModule = req.scope.resolve(Modules.PRODUCT) as any
  const pricingModule = req.scope.resolve(Modules.PRICING) as any
  const salesChannelModule = req.scope.resolve(Modules.SALES_CHANNEL) as any
  const remoteLink = req.scope.resolve(ContainerRegistrationKeys.LINK) as any

  // Resolve the default sales channel (created by v2 core seed)
  const defaultSalesChannels = (await salesChannelModule.listSalesChannels({
    name: "Default Sales Channel",
  })) as any[]
  const defaultSalesChannelId = defaultSalesChannels[0]?.id

  // Parse the uploaded CSV file
  const file = (req as any).file
  if (!file) {
    res.status(400).json({ error: "No file uploaded. Send a CSV file in the 'file' field." })
    return
  }

  let csvText: string
  try {
    csvText = file.buffer?.toString("utf-8") || file.toString()
  } catch {
    res.status(400).json({ error: "Could not read uploaded file as text." })
    return
  }

  const lines = csvText
    .split(/\r?\n/)
    .map((l: string) => l.trim())
    .filter((l: string) => l.length > 0)

  if (lines.length < 2) {
    res.status(400).json({ error: "CSV must have a header row and at least one data row." })
    return
  }

  // Parse header
  const header = lines[0].split(",").map((h: string) => h.trim().toLowerCase())
  const titleIdx = header.indexOf("title")
  const handleIdx = header.indexOf("handle")
  const descIdx = header.indexOf("description")
  const priceIdx = header.indexOf("price")
  const skuIdx = header.indexOf("sku")

  if (titleIdx === -1 || handleIdx === -1) {
    res.status(400).json({ error: "CSV must have 'title' and 'handle' columns." })
    return
  }

  const created: string[] = []
  const errors: string[] = []

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",").map((c: string) => c.trim())
    const title = cols[titleIdx]
    const handle = cols[handleIdx]
    const description = descIdx >= 0 ? cols[descIdx] : ""
    const priceRaw = priceIdx >= 0 ? cols[priceIdx] : "0"
    const sku = skuIdx >= 0 ? cols[skuIdx] : handle

    if (!title || !handle) {
      errors.push(`Row ${i}: missing title or handle`)
      continue
    }

    const pricePaise = Math.round(parseFloat(priceRaw) * 100)
    if (isNaN(pricePaise) || pricePaise <= 0) {
      errors.push(`Row ${i} (${title}): invalid price "${priceRaw}"`)
      continue
    }

    try {
      // Create product with one default variant
      const product = (await productModule.createProducts({
        title,
        handle,
        description: description || undefined,
        status: "published",
        options: [],
        variants: [
          {
            title: "Default",
            sku: sku || handle,
            manage_inventory: false,
          },
        ],
      })) as any

      const variant = product.variants?.[0]
      if (!variant) {
        errors.push(`Row ${i} (${title}): variant not created`)
        continue
      }

      // Create price set and link to variant
      const priceSet = (await pricingModule.createPriceSets({
        prices: [
          {
            amount: pricePaise,
            currency_code: "inr",
          },
        ],
      })) as any

      await remoteLink.create({
        [Modules.PRODUCT]: { variant_id: variant.id },
        [Modules.PRICING]: { price_set_id: priceSet.id },
      })

      // Link product to default sales channel
      if (defaultSalesChannelId) {
        await remoteLink.create({
          [Modules.PRODUCT]: { product_id: product.id },
          [Modules.SALES_CHANNEL]: { sales_channel_id: defaultSalesChannelId },
        })
      }

      created.push(title)
    } catch (err: any) {
      errors.push(`Row ${i} (${title}): ${err.message || "unknown error"}`)
    }
  }

  res.status(201).json({
    message: `Created ${created.length} product(s)`,
    created,
    errors,
  })
}
