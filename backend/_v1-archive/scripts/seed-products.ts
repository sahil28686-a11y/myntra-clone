import { MedusaContainer } from "@medusajs/medusa"

export default async function seedProducts(container: MedusaContainer) {
  const productService = container.resolve("productService")
  const categoryService = container.resolve("productCategoryService")

  const categories = await categoryService.list({})
  const catMap = new Map(categories.map((c: any) => [c.handle, c.id]))

  const products = [
    {
      title: "Classic Fit Polo T-Shirt",
      handle: "classic-fit-polo-tshirt",
      description: "Premium cotton polo t-shirt with embroidered logo. Perfect for casual and semi-formal occasions.",
      categories: [{ id: catMap.get("men-topwear") }],
      options: [{ title: "Size" }, { title: "Color" }],
      variants: [
        { title: "S / Navy Blue", prices: [{ amount: 1299, currency_code: "inr" }], options: [{ value: "S" }, { value: "Navy Blue" }] },
        { title: "M / Navy Blue", prices: [{ amount: 1299, currency_code: "inr" }], options: [{ value: "M" }, { value: "Navy Blue" }] },
        { title: "L / Navy Blue", prices: [{ amount: 1299, currency_code: "inr" }], options: [{ value: "L" }, { value: "Navy Blue" }] },
        { title: "XL / Navy Blue", prices: [{ amount: 1299, currency_code: "inr" }], options: [{ value: "XL" }, { value: "Navy Blue" }] },
        { title: "S / White", prices: [{ amount: 1299, currency_code: "inr" }], options: [{ value: "S" }, { value: "White" }] },
        { title: "M / White", prices: [{ amount: 1299, currency_code: "inr" }], options: [{ value: "M" }, { value: "White" }] },
        { title: "L / White", prices: [{ amount: 1299, currency_code: "inr" }], options: [{ value: "L" }, { value: "White" }] },
        { title: "XL / White", prices: [{ amount: 1299, currency_code: "inr" }], options: [{ value: "XL" }, { value: "White" }] },
      ],
      images: ["https://assets.myntassets.com/h_1440,q_100,w_1080/v1/assets/images/2024/1/1/placeholder-mens-polo.jpg"],
      weight: 250,
      origin_country: "IN",
    },
    {
      title: "Slim Fit Jeans",
      handle: "slim-fit-jeans",
      description: "Stretchable slim fit jeans with 5-pocket design. Made from premium denim for all-day comfort.",
      categories: [{ id: catMap.get("men-bottomwear") }],
      options: [{ title: "Size" }, { title: "Color" }],
      variants: [
        { title: "28 / Dark Blue", prices: [{ amount: 1999, currency_code: "inr" }], options: [{ value: "28" }, { value: "Dark Blue" }] },
        { title: "30 / Dark Blue", prices: [{ amount: 1999, currency_code: "inr" }], options: [{ value: "30" }, { value: "Dark Blue" }] },
        { title: "32 / Dark Blue", prices: [{ amount: 1999, currency_code: "inr" }], options: [{ value: "32" }, { value: "Dark Blue" }] },
        { title: "34 / Dark Blue", prices: [{ amount: 1999, currency_code: "inr" }], options: [{ value: "34" }, { value: "Dark Blue" }] },
        { title: "30 / Black", prices: [{ amount: 1999, currency_code: "inr" }], options: [{ value: "30" }, { value: "Black" }] },
        { title: "32 / Black", prices: [{ amount: 1999, currency_code: "inr" }], options: [{ value: "32" }, { value: "Black" }] },
        { title: "34 / Black", prices: [{ amount: 1999, currency_code: "inr" }], options: [{ value: "34" }, { value: "Black" }] },
      ],
      images: ["https://assets.myntassets.com/h_1440,q_100,w_1080/v1/assets/images/2024/1/1/placeholder-mens-jeans.jpg"],
      weight: 500,
      origin_country: "IN",
    },
    {
      title: "Embroidered Kurta Set",
      handle: "embroidered-kurta-set",
      description: "Beautiful embroidered cotton kurta with matching dupatta and palazzo pants. Perfect for festive occasions.",
      categories: [{ id: catMap.get("women-ethnic") }],
      options: [{ title: "Size" }, { title: "Color" }],
      variants: [
        { title: "S / Pink", prices: [{ amount: 2499, currency_code: "inr" }], options: [{ value: "S" }, { value: "Pink" }] },
        { title: "M / Pink", prices: [{ amount: 2499, currency_code: "inr" }], options: [{ value: "M" }, { value: "Pink" }] },
        { title: "L / Pink", prices: [{ amount: 2499, currency_code: "inr" }], options: [{ value: "L" }, { value: "Pink" }] },
        { title: "S / Mint Green", prices: [{ amount: 2499, currency_code: "inr" }], options: [{ value: "S" }, { value: "Mint Green" }] },
        { title: "M / Mint Green", prices: [{ amount: 2499, currency_code: "inr" }], options: [{ value: "M" }, { value: "Mint Green" }] },
        { title: "L / Mint Green", prices: [{ amount: 2499, currency_code: "inr" }], options: [{ value: "L" }, { value: "Mint Green" }] },
      ],
      images: ["https://assets.myntassets.com/h_1440,q_100,w_1080/v1/assets/images/2024/1/1/placeholder-women-kurta.jpg"],
      weight: 400,
      origin_country: "IN",
    },
    {
      title: "Running Shoes",
      handle: "running-shoes",
      description: "Lightweight mesh running shoes with cushioned sole. Designed for comfort during long runs.",
      categories: [{ id: catMap.get("men-footwear") }],
      options: [{ title: "Size" }],
      variants: [
        { title: "7", prices: [{ amount: 3999, currency_code: "inr" }], options: [{ value: "7" }] },
        { title: "8", prices: [{ amount: 3999, currency_code: "inr" }], options: [{ value: "8" }] },
        { title: "9", prices: [{ amount: 3999, currency_code: "inr" }], options: [{ value: "9" }] },
        { title: "10", prices: [{ amount: 3999, currency_code: "inr" }], options: [{ value: "10" }] },
        { title: "11", prices: [{ amount: 3999, currency_code: "inr" }], options: [{ value: "11" }] },
      ],
      images: ["https://assets.myntassets.com/h_1440,q_100,w_1080/v1/assets/images/2024/1/1/placeholder-shoes.jpg"],
      weight: 600,
      origin_country: "IN",
    },
    {
      title: "Floral Print Dress",
      handle: "floral-print-dress",
      description: "Elegant floral print midi dress with tie-up back. Made from breathable viscose fabric.",
      categories: [{ id: catMap.get("women-western") }],
      options: [{ title: "Size" }, { title: "Color" }],
      variants: [
        { title: "S / Blue", prices: [{ amount: 1799, currency_code: "inr" }], options: [{ value: "S" }, { value: "Blue" }] },
        { title: "M / Blue", prices: [{ amount: 1799, currency_code: "inr" }], options: [{ value: "M" }, { value: "Blue" }] },
        { title: "L / Blue", prices: [{ amount: 1799, currency_code: "inr" }], options: [{ value: "L" }, { value: "Blue" }] },
      ],
      images: ["https://assets.myntassets.com/h_1440,q_100,w_1080/v1/assets/images/2024/1/1/placeholder-dress.jpg"],
      weight: 200,
      origin_country: "IN",
    },
  ]

  for (const product of products) {
    try {
      await productService.create(product)
      console.log(`Created product: ${product.title}`)
    } catch (err: any) {
      console.log(`Skipped product ${product.title}: ${err.message}`)
    }
  }

  console.log("Products seeded successfully!")
}
