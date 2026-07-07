"use client"

import Link from "next/link"
import ProductCard from "@/components/product/ProductCard"

interface ProductsPageProps {
  searchParams: { [key: string]: string | string[] | undefined }
}

const sortOptions = [
  { value: "default", label: "Sort by: Relevance" },
  { value: "popularity", label: "Sort by: Popularity" },
  { value: "price_asc", label: "Sort by: Price Low to High" },
  { value: "price_desc", label: "Sort by: Price High to Low" },
  { value: "newest", label: "Sort by: Newest First" },
  { value: "discount", label: "Sort by: Discount" },
]

const priceRanges = [
  { label: "Under ₹499", min: 0, max: 499 },
  { label: "₹500 - ₹999", min: 500, max: 999 },
  { label: "₹1000 - ₹1999", min: 1000, max: 1999 },
  { label: "₹2000+", min: 2000, max: undefined },
]

const discountRanges = [
  { label: "10% and above", value: 10 },
  { label: "20% and above", value: 20 },
  { label: "30% and above", value: 30 },
  { label: "40% and above", value: 40 },
  { label: "50% and above", value: 50 },
  { label: "60% and above", value: 60 },
  { label: "70% and above", value: 70 },
]

const sizes = ["XS", "S", "M", "L", "XL", "XXL", "3XL"]

const colors = [
  { name: "Black", hex: "#000000" },
  { name: "White", hex: "#FFFFFF" },
  { name: "Blue", hex: "#0000FF" },
  { name: "Red", hex: "#FF0000" },
  { name: "Green", hex: "#008000" },
  { name: "Grey", hex: "#808080" },
  { name: "Navy", hex: "#000080" },
  { name: "Pink", hex: "#FFC0CB" },
]

// Fallback products — used when Medusa API is unavailable
const fallbackProducts = [
  { id: "1", title: "Classic Fit Polo T-Shirt", handle: "classic-fit-polo", price: 1299, originalPrice: 2599, image: "https://assets.myntassets.com/h_1440,q_100,w_1080/v1/assets/images/2024/1/1/placeholder-mens-polo.jpg", rating: 4.2, brand: "Roadster" },
  { id: "2", title: "Slim Fit Jeans", handle: "slim-fit-jeans", price: 1999, originalPrice: 3999, image: "https://assets.myntassets.com/h_1440,q_100,w_1080/v1/assets/images/2024/1/1/placeholder-mens-jeans.jpg", rating: 4.5, brand: "Levis" },
  { id: "3", title: "Embroidered Kurta Set", handle: "embroidered-kurta-set", price: 2499, originalPrice: 4999, image: "https://assets.myntassets.com/h_1440,q_100,w_1080/v1/assets/images/2024/1/1/placeholder-women-kurta.jpg", rating: 4.7, brand: "Libas" },
  { id: "4", title: "Running Shoes", handle: "running-shoes", price: 3499, originalPrice: 6999, image: "https://assets.myntassets.com/h_1440,q_100,w_1080/v1/assets/images/2024/1/1/placeholder-shoes.jpg", rating: 4.3, brand: "Nike" },
  { id: "5", title: "Floral Print Dress", handle: "floral-print-dress", price: 1799, originalPrice: 3499, image: "https://assets.myntassets.com/h_1440,q_100,w_1080/v1/assets/images/2024/1/1/placeholder-dress.jpg", rating: 4.6, brand: "H&M" },
  { id: "6", title: "Casual Sneakers", handle: "casual-sneakers", price: 2499, originalPrice: 4999, image: "https://assets.myntassets.com/h_1440,q_100,w_1080/v1/assets/images/2024/1/1/placeholder-sneakers.jpg", rating: 4.1, brand: "Puma" },
  { id: "7", title: "Leather Jacket", handle: "leather-jacket", price: 4999, originalPrice: 9999, image: "https://assets.myntassets.com/h_1440,q_100,w_1080/v1/assets/images/2024/1/1/placeholder-jacket.jpg", rating: 4.4, brand: "Zara" },
  { id: "8", title: "Silk Saree", handle: "silk-saree", price: 3999, originalPrice: 7999, image: "https://assets.myntassets.com/h_1440,q_100,w_1080/v1/assets/images/2024/1/1/placeholder-saree.jpg", rating: 4.8, brand: "Manyavar" },
  { id: "9", title: "Denim Jacket", handle: "denim-jacket", price: 2999, originalPrice: 5999, image: "https://assets.myntassets.com/h_1440,q_100,w_1080/v1/assets/images/2024/1/1/placeholder-denim.jpg", rating: 4.3, brand: "Levis" },
  { id: "10", title: "Sports T-Shirt", handle: "sports-tshirt", price: 999, originalPrice: 1999, image: "https://assets.myntassets.com/h_1440,q_100,w_1080/v1/assets/images/2024/1/1/placeholder-sports.jpg", rating: 4.0, brand: "Adidas" },
  { id: "11", title: "Formal Shirt", handle: "formal-shirt", price: 1499, originalPrice: 2999, image: "https://assets.myntassets.com/h_1440,q_100,w_1080/v1/assets/images/2024/1/1/placeholder-formal.jpg", rating: 4.2, brand: "Arrow" },
  { id: "12", title: "Casual Shorts", handle: "casual-shorts", price: 799, originalPrice: 1599, image: "https://assets.myntassets.com/h_1440,q_100,w_1080/v1/assets/images/2024/1/1/placeholder-shorts.jpg", rating: 4.1, brand: "Roadster" },
  { id: "13", title: "Handbag", handle: "handbag", price: 2999, originalPrice: 5999, image: "https://assets.myntassets.com/h_1440,q_100,w_1080/v1/assets/images/2024/1/1/placeholder-bag.jpg", rating: 4.5, brand: "Lavie" },
  { id: "14", title: "Sunglasses", handle: "sunglasses", price: 1999, originalPrice: 3999, image: "https://assets.myntassets.com/h_1440,q_100,w_1080/v1/assets/images/2024/1/1/placeholder-sunglasses.jpg", rating: 4.3, brand: "Fastrack" },
  { id: "15", title: "Wrist Watch", handle: "wrist-watch", price: 4999, originalPrice: 9999, image: "https://assets.myntassets.com/h_1440,q_100,w_1080/v1/assets/images/2024/1/1/placeholder-watch.jpg", rating: 4.6, brand: "Titan" },
  { id: "16", title: "Backpack", handle: "backpack", price: 2499, originalPrice: 4999, image: "https://assets.myntassets.com/h_1440,q_100,w_1080/v1/assets/images/2024/1/1/placeholder-backpack.jpg", rating: 4.4, brand: "Skybags" },
  { id: "17", title: "Casual Loafers", handle: "casual-loafers", price: 1799, originalPrice: 3599, image: "https://assets.myntassets.com/h_1440,q_100,w_1080/v1/assets/images/2024/1/1/placeholder-loafers.jpg", rating: 4.2, brand: "Bata" },
  { id: "18", title: "Kurti", handle: "kurti", price: 1299, originalPrice: 2599, image: "https://assets.myntassets.com/h_1440,q_100,w_1080/v1/assets/images/2024/1/1/placeholder-kurti.jpg", rating: 4.5, brand: "Libas" },
  { id: "19", title: "Trousers", handle: "trousers", price: 1999, originalPrice: 3999, image: "https://assets.myntassets.com/h_1440,q_100,w_1080/v1/assets/images/2024/1/1/placeholder-trousers.jpg", rating: 4.1, brand: "Van Heusen" },
  { id: "20", title: "Hoodie", handle: "hoodie", price: 2999, originalPrice: 5999, image: "https://assets.myntassets.com/h_1440,q_100,w_1080/v1/assets/images/2024/1/1/placeholder-hoodie.jpg", rating: 4.3, brand: "HRX" },
]

export default function ProductsPage({ searchParams }: ProductsPageProps) {
  const category = searchParams?.category as string | undefined
  const q = searchParams?.q as string | undefined
  const sort = searchParams?.sort as string | undefined
  const size = searchParams?.size as string | undefined
  const color = searchParams?.color as string | undefined
  const minPrice = searchParams?.min_price as string | undefined
  const maxPrice = searchParams?.max_price as string | undefined
  const minDiscount = searchParams?.min_discount as string | undefined

  // Use fallback products (API integration will be added when backend is running)
  let products = [...fallbackProducts]
  let count = products.length

  // Sort products if needed
  if (sort === "price_asc") {
    products.sort((a, b) => a.price - b.price)
  } else if (sort === "price_desc") {
    products.sort((a, b) => b.price - a.price)
  } else if (sort === "discount") {
    products.sort((a, b) => {
      const dA = a.originalPrice ? (a.originalPrice - a.price) / a.originalPrice : 0
      const dB = b.originalPrice ? (b.originalPrice - b.price) / b.originalPrice : 0
      return dB - dA
    })
  }

  const buildFilterUrl = (key: string, value: string | null) => {
    const url = new URLSearchParams()
    if (q) url.set("q", q)
    if (category) url.set("category", category)
    if (sort && sort !== "default") url.set("sort", sort)
    if (value) url.set(key, value)
    const qs = url.toString()
    return `/products${qs ? `?${qs}` : ""}`
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumb - Myntra style */}
      <div className="max-w-[1280px] mx-auto px-4 md:px-8 pt-[16px] pb-[8px]">
        <nav className="flex items-center gap-[4px] text-[12px] text-[#94969F]">
          <Link href="/" className="hover:text-[#282C3F]">Home</Link>
          <span className="mx-[4px]">/</span>
          {category ? (
            <>
              <Link href="/products" className="hover:text-[#282C3F] capitalize">{category.split("-").join(" ")}</Link>
              <span className="mx-[4px]">/</span>
              <span className="text-[#282C3F] font-semibold">T-Shirts</span>
            </>
          ) : (
            <span className="text-[#282C3F] font-semibold">Products</span>
          )}
        </nav>
      </div>

      <div className="max-w-[1280px] mx-auto px-4 md:px-8 flex gap-0">
        {/* ===== FILTER SIDEBAR ===== */}
        <aside className="hidden lg:block w-[280px] flex-shrink-0 border-r border-[#E9E9EB] pr-6">
          <div className="sticky top-[80px]">
            {/* Filter Header */}
            <div className="py-4 border-b border-[#E9E9EB]">
              <h1 className="text-[18px] font-bold text-[#282C3F] uppercase tracking-[0.1em]">
                Filters
              </h1>
            </div>

            {/* Categories */}
            <div className="py-4 border-b border-[#E9E9EB]">
              <h2 className="text-[13px] font-bold text-[#282C3F] uppercase tracking-[0.1em] mb-3">
                Categories
              </h2>
              <div className="space-y-1 max-h-[200px] overflow-y-auto">
                {["Men", "Women", "Kids", "Home & Living", "Beauty"].map((cat) => (
                  <Link
                    key={cat}
                    href={buildFilterUrl("category", cat.toLowerCase().replace(/ & /g, "-"))}
                    className={`block text-[14px] py-1.5 px-2 rounded-sm transition-colors ${
                      category === cat.toLowerCase().replace(/ & /g, "-")
                        ? "text-[#FF3F6C] font-semibold bg-[#FFF0F3]"
                        : "text-[#282C3F] hover:bg-[#F5F5F6]"
                    }`}
                  >
                    {cat}
                  </Link>
                ))}
              </div>
            </div>

            {/* Size */}
            <div className="py-4 border-b border-[#E9E9EB]">
              <h2 className="text-[13px] font-bold text-[#282C3F] uppercase tracking-[0.1em] mb-3">
                Size
              </h2>
              <div className="flex flex-wrap gap-2">
                {sizes.map((s) => (
                  <Link
                    key={s}
                    href={buildFilterUrl("size", size === s ? null : s)}
                    className={`min-w-[44px] h-[44px] flex items-center justify-center text-[14px] font-medium border rounded-sm transition-colors ${
                      size === s
                        ? "border-[#FF3F6C] text-[#FF3F6C] bg-[#FFF0F3]"
                        : "border-[#D4D5D9] text-[#282C3F] hover:border-[#282C3F]"
                    }`}
                  >
                    {s}
                  </Link>
                ))}
              </div>
            </div>

            {/* Color */}
            <div className="py-4 border-b border-[#E9E9EB]">
              <h2 className="text-[13px] font-bold text-[#282C3F] uppercase tracking-[0.1em] mb-3">
                Color
              </h2>
              <div className="flex flex-wrap gap-2">
                {colors.map((c) => (
                  <Link
                    key={c.name}
                    href={buildFilterUrl("color", color === c.name.toLowerCase() ? null : c.name.toLowerCase())}
                    className={`w-[32px] h-[32px] rounded-full border-2 transition-all ${
                      color === c.name.toLowerCase()
                        ? "border-[#FF3F6C] scale-110"
                        : "border-[#D4D5D9] hover:border-[#282C3F]"
                    }`}
                    style={{ backgroundColor: c.hex }}
                    title={c.name}
                  />
                ))}
              </div>
            </div>

            {/* Price Range */}
            <div className="py-4 border-b border-[#E9E9EB]">
              <h2 className="text-[13px] font-bold text-[#282C3F] uppercase tracking-[0.1em] mb-3">
                Price
              </h2>
              <div className="space-y-1">
                {priceRanges.map((range) => (
                  <Link
                    key={range.label}
                    href={`/products?${new URLSearchParams({
                      ...(q ? { q } : {}),
                      ...(category ? { category } : {}),
                      ...(sort && sort !== "default" ? { sort } : {}),
                      min_price: String(range.min),
                      ...(range.max ? { max_price: String(range.max) } : {}),
                    }).toString()}`}
                    className={`block text-[14px] py-1.5 px-2 rounded-sm transition-colors ${
                      minPrice === String(range.min)
                        ? "text-[#FF3F6C] font-semibold bg-[#FFF0F3]"
                        : "text-[#282C3F] hover:bg-[#F5F5F6]"
                    }`}
                  >
                    {range.label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Discount */}
            <div className="py-4 border-b border-[#E9E9EB]">
              <h2 className="text-[13px] font-bold text-[#282C3F] uppercase tracking-[0.1em] mb-3">
                Discount
              </h2>
              <div className="space-y-1">
                {discountRanges.map((d) => (
                  <Link
                    key={d.value}
                    href={buildFilterUrl("min_discount", minDiscount === String(d.value) ? null : String(d.value))}
                    className={`block text-[14px] py-1.5 px-2 rounded-sm transition-colors ${
                      minDiscount === String(d.value)
                        ? "text-[#FF3F6C] font-semibold bg-[#FFF0F3]"
                        : "text-[#282C3F] hover:bg-[#F5F5F6]"
                    }`}
                  >
                    {d.label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Clear Filters */}
            {(category || size || color || minPrice || minDiscount) && (
              <div className="py-4">
                <Link
                  href="/products"
                  className="block w-full text-center text-[13px] font-bold text-[#FF3F6C] uppercase tracking-[0.1em] py-2 border border-[#FF3F6C] rounded-sm hover:bg-[#FFF0F3] transition-colors"
                >
                  Clear All Filters
                </Link>
              </div>
            )}
          </div>
        </aside>

        {/* ===== PRODUCT GRID AREA ===== */}
        <div className="flex-1 pl-0 lg:pl-6">
          {/* Sort Bar */}
          <div className="flex items-center justify-between py-4 border-b border-[#E9E9EB]">
            <p className="text-[13px] text-[#94969F]">
              <span className="font-bold text-[#282C3F]">{products.length}</span> of{" "}
              <span className="font-bold text-[#282C3F]">{count}</span> products
            </p>
            <div className="flex items-center gap-2">
              <span className="text-[12px] text-[#94969F]">Sort by:</span>
              <select
                className="text-[13px] font-semibold text-[#282C3F] border-none bg-transparent focus:outline-none cursor-pointer pr-4"
                defaultValue={sort || "default"}
                onChange={(e) => {
                  const val = e.target.value
                  const params = new URLSearchParams(window.location.search)
                  if (val === "default") params.delete("sort")
                  else params.set("sort", val)
                  window.location.href = `/products?${params.toString()}`
                }}
              >
                {sortOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Product Grid */}
          {products.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-[1px] bg-[#E9E9EB] mt-0">
              {products.map((product: any) => (
                <div key={product.id} className="bg-white">
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-[80px]">
              <div className="text-[48px] mb-[16px]">🔍</div>
              <p className="text-[#94969F] text-[16px] mb-[8px]">No products found</p>
              <p className="text-[#94969F] text-[13px] mb-[24px]">Try adjusting your filters or search terms</p>
              <Link
                href="/products"
                className="inline-block bg-[#FF3F6C] text-white text-[13px] font-bold uppercase tracking-[0.15em] px-[32px] py-[12px] hover:opacity-90 transition-opacity"
              >
                Clear Filters
              </Link>
            </div>
          )}

          {/* Pagination - Myntra style */}
          {count > 30 && (
            <div className="flex justify-center items-center gap-[8px] mt-[40px] mb-[60px]">
              <button className="w-[36px] h-[36px] flex items-center justify-center text-[14px] text-[#94969F] border border-[#E9E9EB] hover:border-[#282C3F] transition-colors bg-white">
                ‹
              </button>
              {Array.from({ length: Math.min(Math.ceil(count / 30), 5) }, (_, i) => i + 1).map((page) => (
                <Link
                  key={page}
                  href={`/products?offset=${(page - 1) * 30}`}
                  className={`w-[36px] h-[36px] flex items-center justify-center text-[14px] font-semibold border transition-colors bg-white ${
                    page === 1
                      ? "bg-[#FF3F6C] text-white border-[#FF3F6C]"
                      : "text-[#282C3F] border-[#E9E9EB] hover:border-[#282C3F]"
                  }`}
                >
                  {page}
                </Link>
              ))}
              <button className="w-[36px] h-[36px] flex items-center justify-center text-[14px] text-[#94969F] border border-[#E9E9EB] hover:border-[#282C3F] transition-colors bg-white">
                ›
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
