import { Modules, ContainerRegistrationKeys } from "@medusajs/framework/utils"
import type { MedusaContainer } from "@medusajs/medusa"

/**
 * M1 unified seed script for the Myntra clone (Medusa v2).
 *
 * Run with: `npm run seed` (-> `medusa exec src/scripts/seed.ts`)
 *
 * The `medusa exec` command (see @medusajs/medusa dist/commands/exec.js) loads
 * the full application container and invokes the default export with
 * `{ container, args }`. We resolve the v2 module services via their container
 * registration keys (verified from @medusajs/utils modules-sdk/definition.d.ts
 * `Modules` enum: PRODUCT = "product", REGION = "region", PRICING = "pricing")
 * and the remote link via ContainerRegistrationKeys.LINK = "link".
 *
 * CRITICAL: Medusa v2 stores money values in the smallest currency unit. For
 * INR that is paise, so ₹1,299 is stored as `amount: 129900`.
 *
 * Note: product categories are managed by the product module itself
 * (`createProductCategories`) — there is no standalone "productCategory"
 * module registration key in the v2 `Modules` enum.
 *
 * Note on payments: a v2 "manual"/COD payment provider package is not installed
 * (only @medusajs/payment + @medusajs/payment-stripe are present). COD/manual
 * payment provider wiring is M2/M4 scope (plan Risk R7). The default modules
 * already register the manual fulfillment provider and the stripe payment
 * provider.
 */

type Resolver = (name: string) => any

interface SeedParams {
  container: MedusaContainer
  args?: unknown
}

export default async function seed({ container }: SeedParams) {
  const resolve: Resolver = (name: string) => container.resolve(name)

  const regionModule = resolve(Modules.REGION)
  const productModule = resolve(Modules.PRODUCT)
  const pricingModule = resolve(Modules.PRICING)
  const remoteLink = resolve(ContainerRegistrationKeys.LINK)

  // ---------------------------------------------------------------------------
  // 1. India region (INR, country IN)
  // ---------------------------------------------------------------------------
  const existingRegions = await regionModule.listRegions({ name: "India" })
  if (existingRegions.length > 0) {
    console.log("India region already exists — skipping region creation.")
  } else {
    await regionModule.createRegions({
      name: "India",
      currency_code: "inr",
      countries: ["in"],
      metadata: {},
    })
    console.log("✓ India region created (INR, country IN)")
  }

  // ---------------------------------------------------------------------------
  // 2. Categories
  // ---------------------------------------------------------------------------
  const categoryDefs = [
    { name: "Men", handle: "men", is_active: true },
    { name: "Women", handle: "women", is_active: true },
    { name: "Kids", handle: "kids", is_active: true },
    { name: "Home & Living", handle: "home-living", is_active: true },
    { name: "Beauty", handle: "beauty", is_active: true },
    { name: "Topwear", handle: "men-topwear", is_active: true },
    { name: "Bottomwear", handle: "men-bottomwear", is_active: true },
    { name: "Footwear", handle: "men-footwear", is_active: true },
    { name: "Ethnic Wear", handle: "women-ethnic", is_active: true },
    { name: "Western Wear", handle: "women-western", is_active: true },
  ]

  const existingCategories = await productModule.listProductCategories({})
  const existingHandles = new Set(
    (existingCategories as any[]).map((c) => c.handle)
  )
  const categoryHandleToId = new Map<string, string>(
    (existingCategories as any[]).map((c) => [c.handle, c.id])
  )

  for (const cat of categoryDefs) {
    if (existingHandles.has(cat.handle)) {
      categoryHandleToId.set(cat.handle, categoryHandleToId.get(cat.handle)!)
      continue
    }
    const created = await productModule.createProductCategories(cat)
    categoryHandleToId.set(cat.handle, (created as any).id)
    console.log(`✓ Category created: ${cat.name}`)
  }

  const categoryId = (handle: string) => {
    const id = categoryHandleToId.get(handle)
    return id ? { id } : undefined
  }

  // ---------------------------------------------------------------------------
  // 3. Products + variants (prices in PAISE)
  // ---------------------------------------------------------------------------
  interface VariantSeed {
    title: string
    sku: string
    options: { value: string }[]
    price: number // paise
  }

  interface ProductSeed {
    title: string
    handle: string
    description: string
    status: "published" | "draft" | "proposed" | "rejected"
    categoryHandle: string
    thumbnail: string
    images: string[]
    options: { title: string; values: string[] }[]
    variants: VariantSeed[]
  }

  const products: ProductSeed[] = [
    {
      title: "Classic Fit Polo T-Shirt",
      handle: "classic-fit-polo-tshirt",
      description:
        "Premium cotton polo t-shirt with embroidered logo. Perfect for casual and semi-formal occasions.",
      status: "published",
      categoryHandle: "men-topwear",
      thumbnail:
        "https://assets.myntassets.com/h_1440,q_100,w_1080/v1/assets/images/2024/1/1/placeholder-mens-polo.jpg",
      images: [
        "https://assets.myntassets.com/h_1440,q_100,w_1080/v1/assets/images/2024/1/1/placeholder-mens-polo.jpg",
      ],
      options: [
        { title: "Size", values: ["S", "M", "L", "XL"] },
        { title: "Color", values: ["Navy Blue", "White"] },
      ],
      variants: [
        { title: "S / Navy Blue", sku: "POLO-S-NV", options: [{ value: "S" }, { value: "Navy Blue" }], price: 129900 },
        { title: "M / Navy Blue", sku: "POLO-M-NV", options: [{ value: "M" }, { value: "Navy Blue" }], price: 129900 },
        { title: "L / Navy Blue", sku: "POLO-L-NV", options: [{ value: "L" }, { value: "Navy Blue" }], price: 129900 },
        { title: "XL / Navy Blue", sku: "POLO-XL-NV", options: [{ value: "XL" }, { value: "Navy Blue" }], price: 129900 },
        { title: "S / White", sku: "POLO-S-WH", options: [{ value: "S" }, { value: "White" }], price: 129900 },
        { title: "M / White", sku: "POLO-M-WH", options: [{ value: "M" }, { value: "White" }], price: 129900 },
        { title: "L / White", sku: "POLO-L-WH", options: [{ value: "L" }, { value: "White" }], price: 129900 },
        { title: "XL / White", sku: "POLO-XL-WH", options: [{ value: "XL" }, { value: "White" }], price: 129900 },
      ],
    },
    {
      title: "Slim Fit Jeans",
      handle: "slim-fit-jeans",
      description:
        "Stretchable slim fit jeans with 5-pocket design. Made from premium denim for all-day comfort.",
      status: "published",
      categoryHandle: "men-bottomwear",
      thumbnail:
        "https://assets.myntassets.com/h_1440,q_100,w_1080/v1/assets/images/2024/1/1/placeholder-mens-jeans.jpg",
      images: [
        "https://assets.myntassets.com/h_1440,q_100,w_1080/v1/assets/images/2024/1/1/placeholder-mens-jeans.jpg",
      ],
      options: [
        { title: "Size", values: ["28", "30", "32", "34"] },
        { title: "Color", values: ["Dark Blue", "Black"] },
      ],
      variants: [
        { title: "28 / Dark Blue", sku: "JEANS-28-DB", options: [{ value: "28" }, { value: "Dark Blue" }], price: 199900 },
        { title: "30 / Dark Blue", sku: "JEANS-30-DB", options: [{ value: "30" }, { value: "Dark Blue" }], price: 199900 },
        { title: "32 / Dark Blue", sku: "JEANS-32-DB", options: [{ value: "32" }, { value: "Dark Blue" }], price: 199900 },
        { title: "34 / Dark Blue", sku: "JEANS-34-DB", options: [{ value: "34" }, { value: "Dark Blue" }], price: 199900 },
        { title: "30 / Black", sku: "JEANS-30-BK", options: [{ value: "30" }, { value: "Black" }], price: 199900 },
        { title: "32 / Black", sku: "JEANS-32-BK", options: [{ value: "32" }, { value: "Black" }], price: 199900 },
        { title: "34 / Black", sku: "JEANS-34-BK", options: [{ value: "34" }, { value: "Black" }], price: 199900 },
      ],
    },
    {
      title: "Embroidered Kurta Set",
      handle: "embroidered-kurta-set",
      description:
        "Beautiful embroidered cotton kurta with matching dupatta and palazzo pants. Perfect for festive occasions.",
      status: "published",
      categoryHandle: "women-ethnic",
      thumbnail:
        "https://assets.myntassets.com/h_1440,q_100,w_1080/v1/assets/images/2024/1/1/placeholder-women-kurta.jpg",
      images: [
        "https://assets.myntassets.com/h_1440,q_100,w_1080/v1/assets/images/2024/1/1/placeholder-women-kurta.jpg",
      ],
      options: [
        { title: "Size", values: ["S", "M", "L"] },
        { title: "Color", values: ["Pink", "Mint Green"] },
      ],
      variants: [
        { title: "S / Pink", sku: "KURTA-S-PK", options: [{ value: "S" }, { value: "Pink" }], price: 249900 },
        { title: "M / Pink", sku: "KURTA-M-PK", options: [{ value: "M" }, { value: "Pink" }], price: 249900 },
        { title: "L / Pink", sku: "KURTA-L-PK", options: [{ value: "L" }, { value: "Pink" }], price: 249900 },
        { title: "S / Mint Green", sku: "KURTA-S-MG", options: [{ value: "S" }, { value: "Mint Green" }], price: 249900 },
        { title: "M / Mint Green", sku: "KURTA-M-MG", options: [{ value: "M" }, { value: "Mint Green" }], price: 249900 },
        { title: "L / Mint Green", sku: "KURTA-L-MG", options: [{ value: "L" }, { value: "Mint Green" }], price: 249900 },
      ],
    },
    {
      title: "Running Shoes",
      handle: "running-shoes",
      description:
        "Lightweight mesh running shoes with cushioned sole. Designed for comfort during long runs.",
      status: "published",
      categoryHandle: "men-footwear",
      thumbnail:
        "https://assets.myntassets.com/h_1440,q_100,w_1080/v1/assets/images/2024/1/1/placeholder-shoes.jpg",
      images: [
        "https://assets.myntassets.com/h_1440,q_100,w_1080/v1/assets/images/2024/1/1/placeholder-shoes.jpg",
      ],
      options: [{ title: "Size", values: ["7", "8", "9", "10", "11"] }],
      variants: [
        { title: "7", sku: "SHOE-7", options: [{ value: "7" }], price: 399900 },
        { title: "8", sku: "SHOE-8", options: [{ value: "8" }], price: 399900 },
        { title: "9", sku: "SHOE-9", options: [{ value: "9" }], price: 399900 },
        { title: "10", sku: "SHOE-10", options: [{ value: "10" }], price: 399900 },
        { title: "11", sku: "SHOE-11", options: [{ value: "11" }], price: 399900 },
      ],
    },
    {
      title: "Floral Print Dress",
      handle: "floral-print-dress",
      description:
        "Elegant floral print midi dress with tie-up back. Made from breathable viscose fabric.",
      status: "published",
      categoryHandle: "women-western",
      thumbnail:
        "https://assets.myntassets.com/h_1440,q_100,w_1080/v1/assets/images/2024/1/1/placeholder-dress.jpg",
      images: [
        "https://assets.myntassets.com/h_1440,q_100,w_1080/v1/assets/images/2024/1/1/placeholder-dress.jpg",
      ],
      options: [
        { title: "Size", values: ["S", "M", "L"] },
        { title: "Color", values: ["Blue"] },
      ],
      variants: [
        { title: "S / Blue", sku: "DRESS-S-BL", options: [{ value: "S" }, { value: "Blue" }], price: 179900 },
        { title: "M / Blue", sku: "DRESS-M-BL", options: [{ value: "M" }, { value: "Blue" }], price: 179900 },
        { title: "L / Blue", sku: "DRESS-L-BL", options: [{ value: "L" }, { value: "Blue" }], price: 179900 },
      ],
    },
  ]

  const existingProducts = await productModule.listProducts({})
  const existingProductHandles = new Set(
    (existingProducts as any[]).map((p) => p.handle)
  )

  for (const p of products) {
    if (existingProductHandles.has(p.handle)) {
      console.log(`Product "${p.title}" already exists — skipping.`)
      continue
    }

    const category = categoryId(p.categoryHandle)
    const createdProducts = (await productModule.createProducts({
      title: p.title,
      handle: p.handle,
      description: p.description,
      status: p.status,
      thumbnail: p.thumbnail,
      images: p.images,
      categories: category ? [category] : [],
      options: p.options.map((o) => ({ title: o.title, values: o.values })),
      variants: p.variants.map((v) => ({
        title: v.title,
        sku: v.sku,
        options: v.options,
        manage_inventory: false,
      })),
    })) as any[]

    const created = createdProducts[0]
    console.log(`✓ Product created: ${p.title} (${created.id})`)

    // ----- 4. Prices (paise) via the pricing module + link to variants -----
    for (const variant of created.variants as any[]) {
      const seedVariant = p.variants.find((v) => v.title === variant.title)
      if (!seedVariant) continue

      const priceSet = (await pricingModule.createPriceSets({
        prices: [
          {
            amount: seedVariant.price, // paise
            currency_code: "inr",
          },
        ],
      })) as any

      await remoteLink.create({
        [Modules.PRODUCT]: { product_variant_id: variant.id },
        [Modules.PRICING]: { price_set_id: priceSet.id },
      })
    }
  }

  console.log("Seed complete.")
}