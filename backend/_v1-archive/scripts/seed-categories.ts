import { MedusaContainer } from "@medusajs/medusa"

export default async function seedCategories(container: MedusaContainer) {
  const categoryService = container.resolve("productCategoryService")

  const categories = [
    { name: "Men", handle: "men", parent_category_id: null },
    { name: "Women", handle: "women", parent_category_id: null },
    { name: "Kids", handle: "kids", parent_category_id: null },
    { name: "Home & Living", handle: "home-living", parent_category_id: null },
    { name: "Beauty", handle: "beauty", parent_category_id: null },

    // Men subcategories
    { name: "Topwear", handle: "men-topwear", parent_category_id: null },
    { name: "Bottomwear", handle: "men-bottomwear", parent_category_id: null },
    { name: "Footwear", handle: "men-footwear", parent_category_id: null },
    { name: "Accessories", handle: "men-accessories", parent_category_id: null },

    // Women subcategories
    { name: "Ethnic Wear", handle: "women-ethnic", parent_category_id: null },
    { name: "Western Wear", handle: "women-western", parent_category_id: null },
    { name: "Footwear", handle: "women-footwear", parent_category_id: null },
    { name: "Accessories", handle: "women-accessories", parent_category_id: null },
  ]

  for (const cat of categories) {
    try {
      await categoryService.create(cat)
      console.log(`Created category: ${cat.name}`)
    } catch (err: any) {
      console.log(`Skipped category ${cat.name}: ${err.message}`)
    }
  }

  console.log("Categories seeded successfully!")
}
