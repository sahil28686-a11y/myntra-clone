import { Modules, ContainerRegistrationKeys } from "@medusajs/framework/utils"
import type { MedusaContainer } from "@medusajs/medusa"

/**
 * M1/M2 unified seed script for the Myntra clone (Medusa v2).
 *
 * Run with: `npm run seed` (-> `medusa exec src/scripts/seed.ts`)
 *
 * The `medusa exec` command (see @medusajs/medusa dist/commands/exec.js)
 * loads the full application container and invokes the default export with
 * `{ container, args }`. We resolve the v2 module services via their container
 * registration keys (verified from @medusajs/utils modules-sdk/definition.d.ts
 * `Modules` enum: PRODUCT = "product", REGION = "region", PRICING =
 * "pricing", TAX = "tax", USER = "user", AUTH = "auth", WORKFLOW_ENGINE =
 * "workflows") and the remote link via ContainerRegistrationKeys.LINK =
 * "link". Custom modules are registered under their `Module()` keys:
 * "pincode" (see medusa-config.ts modules array).
 *
 * CRITICAL: Medusa v2 stores money values in the smallest currency unit. For
 * INR that is paise, so ₹1,299 is stored as `amount: 129900`.
 *
 * Note: product categories are managed by the product module itself
 * (`createProductCategories`) — there is no standalone "productCategory"
 * module registration key in the v2 `Modules` enum.
 *
 * Note on payments: a v2 "manual"/COD payment provider package is not
 * installed (only @medusajs/payment + @medusajs/payment-stripe are present).
 * COD/manual payment provider wiring is M4 scope (plan Risk R7). The default
 * modules already register the manual fulfillment provider and the stripe
 * payment provider.
 *
 * M2 additions: 30 pincodes, GST tax rates (flat per-product default), and a
 * default admin user (admin@myntra-clone.com / admin123). Admin user creation
 * mirrors the `medusa user` CLI (@medusajs/medusa dist/commands/user.js):
 * create-users-workflow -> authService.register("emailpass") ->
 * authService.updateAuthIdentities({ app_metadata: { user_id } }).
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
  // M2 additions:
  const pincodeModule = resolve("pincode")
  const taxModule = resolve(Modules.TAX)
  const userModule = resolve(Modules.USER)
  const authService = resolve(Modules.AUTH)
  const workflowService = resolve(Modules.WORKFLOW_ENGINE)

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
    // Record<option title, option value> — matches CreateProductVariantDTO.options
    options: Record<string, string>
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
        { title: "S / Navy Blue", sku: "POLO-S-NV", options: { Size: "S", Color: "Navy Blue" }, price: 129900 },
        { title: "M / Navy Blue", sku: "POLO-M-NV", options: { Size: "M", Color: "Navy Blue" }, price: 129900 },
        { title: "L / Navy Blue", sku: "POLO-L-NV", options: { Size: "L", Color: "Navy Blue" }, price: 129900 },
        { title: "XL / Navy Blue", sku: "POLO-XL-NV", options: { Size: "XL", Color: "Navy Blue" }, price: 129900 },
        { title: "S / White", sku: "POLO-S-WH", options: { Size: "S", Color: "White" }, price: 129900 },
        { title: "M / White", sku: "POLO-M-WH", options: { Size: "M", Color: "White" }, price: 129900 },
        { title: "L / White", sku: "POLO-L-WH", options: { Size: "L", Color: "White" }, price: 129900 },
        { title: "XL / White", sku: "POLO-XL-WH", options: { Size: "XL", Color: "White" }, price: 129900 },
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
        { title: "28 / Dark Blue", sku: "JEANS-28-DB", options: { Size: "28", Color: "Dark Blue" }, price: 199900 },
        { title: "30 / Dark Blue", sku: "JEANS-30-DB", options: { Size: "30", Color: "Dark Blue" }, price: 199900 },
        { title: "32 / Dark Blue", sku: "JEANS-32-DB", options: { Size: "32", Color: "Dark Blue" }, price: 199900 },
        { title: "34 / Dark Blue", sku: "JEANS-34-DB", options: { Size: "34", Color: "Dark Blue" }, price: 199900 },
        { title: "30 / Black", sku: "JEANS-30-BK", options: { Size: "30", Color: "Black" }, price: 199900 },
        { title: "32 / Black", sku: "JEANS-32-BK", options: { Size: "32", Color: "Black" }, price: 199900 },
        { title: "34 / Black", sku: "JEANS-34-BK", options: { Size: "34", Color: "Black" }, price: 199900 },
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
        { title: "S / Pink", sku: "KURTA-S-PK", options: { Size: "S", Color: "Pink" }, price: 249900 },
        { title: "M / Pink", sku: "KURTA-M-PK", options: { Size: "M", Color: "Pink" }, price: 249900 },
        { title: "L / Pink", sku: "KURTA-L-PK", options: { Size: "L", Color: "Pink" }, price: 249900 },
        { title: "S / Mint Green", sku: "KURTA-S-MG", options: { Size: "S", Color: "Mint Green" }, price: 249900 },
        { title: "M / Mint Green", sku: "KURTA-M-MG", options: { Size: "M", Color: "Mint Green" }, price: 249900 },
        { title: "L / Mint Green", sku: "KURTA-L-MG", options: { Size: "L", Color: "Mint Green" }, price: 249900 },
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
        { title: "7", sku: "SHOE-7", options: { Size: "7" }, price: 399900 },
        { title: "8", sku: "SHOE-8", options: { Size: "8" }, price: 399900 },
        { title: "9", sku: "SHOE-9", options: { Size: "9" }, price: 399900 },
        { title: "10", sku: "SHOE-10", options: { Size: "10" }, price: 399900 },
        { title: "11", sku: "SHOE-11", options: { Size: "11" }, price: 399900 },
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
        { title: "S / Blue", sku: "DRESS-S-BL", options: { Size: "S", Color: "Blue" }, price: 179900 },
        { title: "M / Blue", sku: "DRESS-M-BL", options: { Size: "M", Color: "Blue" }, price: 179900 },
        { title: "L / Blue", sku: "DRESS-L-BL", options: { Size: "L", Color: "Blue" }, price: 179900 },
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
    const created = (await productModule.createProducts({
      title: p.title,
      handle: p.handle,
      description: p.description,
      status: p.status,
      thumbnail: p.thumbnail,
      images: p.images.map((u) => ({ url: u })),
      categories: category ? [category] : [],
      options: p.options.map((o) => ({ title: o.title, values: o.values })),
      variants: p.variants.map((v) => ({
        title: v.title,
        sku: v.sku,
        options: v.options,
        manage_inventory: false,
      })),
    })) as any
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
        [Modules.PRODUCT]: { variant_id: variant.id },
        [Modules.PRICING]: { price_set_id: priceSet.id },
      })
    }
  }

  // ---------------------------------------------------------------------------
  // 4. Pincodes (M2) — 30 pincodes via the pincode module service
  // ---------------------------------------------------------------------------
  interface PincodeSeed {
    code: string
    is_serviceable: boolean
    estimated_days: number
    city: string
    state: string
  }

  const pincodes: PincodeSeed[] = [
    // Metros — serviceable, ~2 days
    { code: "110001", is_serviceable: true, estimated_days: 2, city: "New Delhi", state: "Delhi" },
    { code: "400001", is_serviceable: true, estimated_days: 2, city: "Mumbai", state: "Maharashtra" },
    { code: "560001", is_serviceable: true, estimated_days: 2, city: "Bengaluru", state: "Karnataka" },
    { code: "600001", is_serviceable: true, estimated_days: 2, city: "Chennai", state: "Tamil Nadu" },
    { code: "700001", is_serviceable: true, estimated_days: 2, city: "Kolkata", state: "West Bengal" },
    { code: "500001", is_serviceable: true, estimated_days: 2, city: "Hyderabad", state: "Telangana" },
    { code: "110002", is_serviceable: true, estimated_days: 2, city: "New Delhi", state: "Delhi" },
    { code: "400050", is_serviceable: true, estimated_days: 2, city: "Mumbai", state: "Maharashtra" },
    { code: "560002", is_serviceable: true, estimated_days: 2, city: "Bengaluru", state: "Karnataka" },
    { code: "600002", is_serviceable: true, estimated_days: 2, city: "Chennai", state: "Tamil Nadu" },
    // Tier-2 — serviceable, ~4 days
    { code: "411001", is_serviceable: true, estimated_days: 4, city: "Pune", state: "Maharashtra" },
    { code: "380001", is_serviceable: true, estimated_days: 4, city: "Ahmedabad", state: "Gujarat" },
    { code: "226001", is_serviceable: true, estimated_days: 4, city: "Lucknow", state: "Uttar Pradesh" },
    { code: "302001", is_serviceable: true, estimated_days: 4, city: "Jaipur", state: "Rajasthan" },
    { code: "462001", is_serviceable: true, estimated_days: 4, city: "Bhopal", state: "Madhya Pradesh" },
    { code: "160001", is_serviceable: true, estimated_days: 4, city: "Chandigarh", state: "Chandigarh" },
    { code: "682001", is_serviceable: true, estimated_days: 4, city: "Kochi", state: "Kerala" },
    { code: "530001", is_serviceable: true, estimated_days: 4, city: "Visakhapatnam", state: "Andhra Pradesh" },
    { code: "440001", is_serviceable: true, estimated_days: 4, city: "Nagpur", state: "Maharashtra" },
    { code: "208001", is_serviceable: true, estimated_days: 4, city: "Kanpur", state: "Uttar Pradesh" },
    { code: "360001", is_serviceable: true, estimated_days: 4, city: "Rajkot", state: "Gujarat" },
    { code: "144001", is_serviceable: true, estimated_days: 4, city: "Jalandhar", state: "Punjab" },
    { code: "695001", is_serviceable: true, estimated_days: 4, city: "Thiruvananthapuram", state: "Kerala" },
    { code: "800001", is_serviceable: true, estimated_days: 4, city: "Patna", state: "Bihar" },
    { code: "751001", is_serviceable: true, estimated_days: 4, city: "Bhubaneswar", state: "Odisha" },
    // Remote / non-serviceable
    { code: "781001", is_serviceable: false, estimated_days: 0, city: "Guwahati", state: "Assam" },
    { code: "194101", is_serviceable: false, estimated_days: 0, city: "Leh", state: "Ladakh" },
    { code: "799001", is_serviceable: false, estimated_days: 0, city: "Agartala", state: "Tripura" },
    { code: "792001", is_serviceable: false, estimated_days: 0, city: "Itanagar", state: "Arunachal Pradesh" },
    { code: "192221", is_serviceable: false, estimated_days: 0, city: "Anantnag", state: "Jammu and Kashmir" },
  ]

  const existingPincodes = await pincodeModule.listPincodes({})
  const existingPinCodes = new Set((existingPincodes as any[]).map((p) => p.code))
  const pincodesToCreate = pincodes.filter((p) => !existingPinCodes.has(p.code))
  if (pincodesToCreate.length > 0) {
    await pincodeModule.createPincodes(
      pincodesToCreate.map((p) => ({
        code: p.code,
        is_serviceable: p.is_serviceable,
        estimated_days: p.estimated_days,
        city: p.city,
        state: p.state,
      }))
    )
    console.log(`✓ ${pincodesToCreate.length} pincodes created`) 
  } else {
    console.log("Pincodes already seeded — skipping.")
  }

  // ---------------------------------------------------------------------------
  // 5. GST tax rates (M2) — flat per-product default via the v2 tax service
  // ---------------------------------------------------------------------------
  // Medusa v2 tax model: a tax region (country) holds tax rates; the region's
  // `default_tax_rate` applies to every product sold into that region unless
  // overridden by tax-rate rules. For the MVP (resolved decision §6.5: flat
  // per-product GST) we create an India ("in") tax region whose default rate
  // is 18% GST, and additionally create the other GST slabs (0/5/12/28) as
  // named tax-rate codes so they are available for future per-category rules.
  const existingTaxRegions = await taxModule.listTaxRegions({
    country_code: "in",
  })
  let indiaTaxRegionId: string | undefined = (existingTaxRegions as any[])[0]?.id

  if (!indiaTaxRegionId) {
    const region = await taxModule.createTaxRegions({
      country_code: "in",
      default_tax_rate: {
        rate: 18,
        code: "GST-18",
        name: "India GST (default 18%)",
      },
    })
    indiaTaxRegionId = (region as any).id
    console.log(`✓ India tax region created (default 18% GST)`) 
  } else {
    console.log("India tax region already exists — skipping.")
  }

  // Additional GST slabs (0/5/12/28) as non-default tax rates under the same
  // region, for future per-category rule wiring.
  const existingTaxRates = await taxModule.listTaxRates({
    tax_region_id: indiaTaxRegionId,
  })
  const existingRateCodes = new Set((existingTaxRates as any[]).map((r) => r.code))
  const gstSlabs = [
    { rate: 0, code: "GST-0", name: "GST 0% (exempt)" },
    { rate: 5, code: "GST-5", name: "GST 5%" },
    { rate: 12, code: "GST-12", name: "GST 12%" },
    { rate: 28, code: "GST-28", name: "GST 28%" },
  ]
  const slabsToCreate = gstSlabs.filter((s) => !existingRateCodes.has(s.code))
  if (slabsToCreate.length > 0 && indiaTaxRegionId) {
    await taxModule.createTaxRates(
      slabsToCreate.map((s) => ({
        tax_region_id: indiaTaxRegionId,
        rate: s.rate,
        code: s.code,
        name: s.name,
        is_default: false,
      }))
    )
    console.log(`✓ ${slabsToCreate.length} additional GST slabs created`) 
  }

  // ---------------------------------------------------------------------------
  // 6. Default admin user (M2) — admin@myntra-clone.com / admin123
  // ---------------------------------------------------------------------------
  // Mirrors the `medusa user` CLI (@medusajs/medusa dist/commands/user.js):
  //   1. create-users-workflow -> user record
  //   2. authService.register("emailpass", { body: { email, password } })
  //      -> auth identity
  //   3. authService.updateAuthIdentities({ id, app_metadata: { user_id } })
  //      -> link auth identity to user
  // Idempotent: if a user with the email already exists, skip.
  const adminEmail = "admin@myntra-clone.com"
  const adminPassword = "admin123"

  const existingAdmins = await userModule.listUsers({ email: adminEmail })
  if ((existingAdmins as any[]).length > 0) {
    console.log(
      `Admin user ${adminEmail} already exists — skipping admin creation.`
    )
  } else {
    const { result: users } = await workflowService
      .run("create-users-workflow", {
        input: {
          users: [
            {
              email: adminEmail,
              first_name: "Admin",
              last_name: "User",
            },
          ],
        },
      })
      .catch((err: any) => {
        // Fallback to the user module service if the workflow engine is not
        // available in the seed context (e.g. worker mode).
        console.warn(
          "create-users-workflow unavailable, falling back to userModule.createUsers",
          err?.message ?? err
        )
        return { result: null }
      })

    let adminUser: any = users?.[0]
    if (!adminUser) {
      adminUser = await userModule.createUsers({
        email: adminEmail,
        first_name: "Admin",
        last_name: "User",
      })
    }

    const { authIdentity, error } = await authService.register("emailpass", {
      body: { email: adminEmail, password: adminPassword },
    })

    if (error) {
      console.warn(
        `Admin auth identity registration reported: ${error}`
      )
    } else if (authIdentity) {
      await authService.updateAuthIdentities({
        id: authIdentity.id,
        app_metadata: { user_id: adminUser.id },
      })
    }

    console.log(
      `✓ Default admin user created (${adminEmail}). Change the password immediately.`
    ) 
  }

  console.log("Seed complete.")
}