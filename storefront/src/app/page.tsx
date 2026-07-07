"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import ProductCard from "@/components/product/ProductCard"
import { getProducts, getCollections } from "@/lib/medusa"
import type { MedusaProduct, MedusaCollection } from "@/lib/medusa"

const featuredCategories = [
  { name: "Men", image: "https://assets.myntassets.com/h_720,q_100,w_1080/v1/assets/images/2024/1/1/men-category.jpg", href: "/products?category=men" },
  { name: "Women", image: "https://assets.myntassets.com/h_720,q_100,w_1080/v1/assets/images/2024/1/1/women-category.jpg", href: "/products?category=women" },
  { name: "Kids", image: "https://assets.myntassets.com/h_720,q_100,w_1080/v1/assets/images/2024/1/1/kids-category.jpg", href: "/products?category=kids" },
  { name: "Home & Living", image: "https://assets.myntassets.com/h_720,q_100,w_1080/v1/assets/images/2024/1/1/home-category.jpg", href: "/products?category=home-living" },
]

const bannerOffers = [
  { title: "FLAT 50% OFF", subtitle: "On top brands", color: "bg-[#FF3F6C]" },
  { title: "MIN 40% OFF", subtitle: "On ethnic wear", color: "bg-[#526CD0]" },
  { title: "UP TO 60% OFF", subtitle: "On footwear", color: "bg-green-600" },
]

const trendingProducts = [
  { id: "1", title: "Classic Fit Polo T-Shirt", handle: "classic-fit-polo-tshirt", price: 1299, originalPrice: 2599, image: "https://assets.myntassets.com/h_1440,q_100,w_1080/v1/assets/images/2024/1/1/placeholder-mens-polo.jpg", rating: 4.2, brand: "Roadster" },
  { id: "2", title: "Slim Fit Jeans", handle: "slim-fit-jeans", price: 1999, originalPrice: 3999, image: "https://assets.myntassets.com/h_1440,q_100,w_1080/v1/assets/images/2024/1/1/placeholder-mens-jeans.jpg", rating: 4.5, brand: "Levis" },
  { id: "3", title: "Embroidered Kurta Set", handle: "embroidered-kurta-set", price: 2499, originalPrice: 4999, image: "https://assets.myntassets.com/h_1440,q_100,w_1080/v1/assets/images/2024/1/1/placeholder-women-kurta.jpg", rating: 4.7, brand: "Libas" },
  { id: "4", title: "Running Shoes", handle: "running-shoes", price: 3999, originalPrice: 7999, image: "https://assets.myntassets.com/h_1440,q_100,w_1080/v1/assets/images/2024/1/1/placeholder-shoes.jpg", rating: 4.3, brand: "Puma" },
  { id: "5", title: "Floral Print Dress", handle: "floral-print-dress", price: 1799, originalPrice: 3499, image: "https://assets.myntassets.com/h_1440,q_100,w_1080/v1/assets/images/2024/1/1/placeholder-dress.jpg", rating: 4.1, brand: "H&M" },
  { id: "6", title: "Casual Sneakers", handle: "casual-sneakers", price: 2999, originalPrice: 5999, image: "https://assets.myntassets.com/h_1440,q_100,w_1080/v1/assets/images/2024/1/1/placeholder-sneakers.jpg", rating: 4.4, brand: "Nike" },
  { id: "7", title: "Denim Jacket", handle: "denim-jacket", price: 2499, originalPrice: 4999, image: "https://assets.myntassets.com/h_1440,q_100,w_1080/v1/assets/images/2024/1/1/placeholder-jacket.jpg", rating: 4.6, brand: "Levis" },
  { id: "8", title: "Silk Saree", handle: "silk-saree", price: 3999, originalPrice: 7999, image: "https://assets.myntassets.com/h_1440,q_100,w_1080/v1/assets/images/2024/1/1/placeholder-saree.jpg", rating: 4.8, brand: "Libas" },
  { id: "9", title: "Sports Watch", handle: "sports-watch", price: 4999, originalPrice: 9999, image: "https://assets.myntassets.com/h_1440,q_100,w_1080/v1/assets/images/2024/1/1/placeholder-watch.jpg", rating: 4.3, brand: "Fastrack" },
  { id: "10", title: "Leather Bag", handle: "leather-bag", price: 2999, originalPrice: 5999, image: "https://assets.myntassets.com/h_1440,q_100,w_1080/v1/assets/images/2024/1/1/placeholder-bag.jpg", rating: 4.5, brand: "Hidesign" },
]

const brandLogos = [
  { name: "Adidas", image: "" },
  { name: "Puma", image: "" },
  { name: "Nike", image: "" },
  { name: "Levis", image: "" },
  { name: "H&M", image: "" },
  { name: "Zara", image: "" },
  { name: "Roadster", image: "" },
  { name: "Tommy Hilfiger", image: "" },
  { name: "U.S. Polo Assn.", image: "" },
  { name: "Mast & Harbour", image: "" },
]

const moreBrands = [
  { name: "Mango", image: "" },
  { name: "Forever 21", image: "" },
  { name: "Vero Moda", image: "" },
  { name: "Only", image: "" },
  { name: "Flying Machine", image: "" },
  { name: "Wrangler", image: "" },
  { name: "Spykar", image: "" },
  { name: "Pepe Jeans", image: "" },
  { name: "Diesel", image: "" },
  { name: "Superdry", image: "" },
]

// ====== DISCOUNT DEAL ROWS (Myntra-style category tiles) ======
const dealRow1 = {
  title: "DEALS OF THE DAY",
  items: [
    { name: "Fusion Wear", discount: "50-80% OFF", href: "/products?category=fusion-wear" },
    { name: "Men Casual Wear", discount: "40-60% OFF", href: "/products?category=men-casual-wear" },
    { name: "Sports Wear", discount: "30-70% OFF", href: "/products?category=sports-wear" },
    { name: "Women Western Wear", discount: "50-80% OFF", href: "/products?category=women-western-wear" },
    { name: "Loungewear", discount: "30-60% OFF", href: "/products?category=loungewear" },
    { name: "Innerwear", discount: "10-50% OFF", href: "/products?category=innerwear" },
  ],
}

const dealRow2 = {
  title: "BIGGEST DEALS",
  items: [
    { name: "Kids Wear", discount: "50-80% OFF", href: "/products?category=kids" },
    { name: "Footwear", discount: "40-70% OFF", href: "/products?category=footwear" },
    { name: "Women Footwear", discount: "40-70% OFF", href: "/products?category=women-footwear" },
    { name: "Accessories", discount: "40-70% OFF", href: "/products?category=accessories" },
    { name: "Office Wear", discount: "30-60% OFF", href: "/products?category=office-wear" },
    { name: "Ethnic Wear", discount: "50-80% OFF", href: "/products?category=ethnic-wear" },
  ],
}

const dealRow3 = {
  title: "TOP PICKS",
  items: [
    { name: "Home Furnishing", discount: "40-70% OFF", href: "/products?category=home-furnishing" },
    { name: "Handbags", discount: "40-70% OFF", href: "/products?category=handbags" },
    { name: "Gadgets", discount: "10-50% OFF", href: "/products?category=gadgets" },
    { name: "Jewellery", discount: "10-50% OFF", href: "/products?category=jewellery" },
    { name: "Plus Size Women", discount: "50-80% OFF", href: "/products?category=plus-size-women" },
    { name: "Plus Size Men", discount: "50-80% OFF", href: "/products?category=plus-size-men" },
  ],
}

const dealRow4 = {
  title: "TRENDING",
  items: [
    { name: "Watches", discount: "30-60% OFF", href: "/products?category=watches" },
    { name: "Loungewear Women", discount: "30-60% OFF", href: "/products?category=loungewear-women" },
    { name: "Work Wear Men", discount: "20-50% OFF", href: "/products?category=work-wear-men" },
    { name: "Eyewear", discount: "30-60% OFF", href: "/products?category=eyewear" },
    { name: "Work Wear Women", discount: "20-50% OFF", href: "/products?category=work-wear-women" },
    { name: "Casual Wear", discount: "30-60% OFF", href: "/products?category=casual-wear" },
  ],
}

const dealRow5 = {
  title: "MUST-HAVE DEALS",
  items: [
    { name: "Trolley Bags", discount: "30-60% OFF", href: "/products?category=trolley-bags" },
    { name: "Flip Flops", discount: "30-60% OFF", href: "/products?category=flipflops" },
    { name: "Beauty & Grooming", discount: "20-50% OFF", href: "/products?category=beauty" },
    { name: "Smart Watches", discount: "20-50% OFF", href: "/products?category=smart-watches" },
    { name: "Backpacks", discount: "30-60% OFF", href: "/products?category=backpacks" },
    { name: "Sunglasses", discount: "30-60% OFF", href: "/products?category=sunglasses" },
  ],
}

const allDealRows = [dealRow1, dealRow2, dealRow3, dealRow4, dealRow5]

// ====== CATEGORY SECTIONS ======
const categorySections = [
  {
    title: "SHOP BY CATEGORY", subtitle: "Men's Topwear",
    items: [
      { name: "T-Shirts", image: "" },
      { name: "Shirts", image: "" },
      { name: "Kurtas", image: "" },
      { name: "Jackets", image: "" },
      { name: "Suits", image: "" },
    ],
  },
  {
    title: "SHOP BY CATEGORY", subtitle: "Women's Ethnic Wear",
    items: [
      { name: "Kurtis", image: "" },
      { name: "Sarees", image: "" },
      { name: "Lehengas", image: "" },
      { name: "Dresses", image: "" },
      { name: "Jewellery", image: "" },
    ],
  },
  {
    title: "SHOP BY CATEGORY", subtitle: "Footwear",
    items: [
      { name: "Sports Shoes", image: "" },
      { name: "Casual Shoes", image: "" },
      { name: "Sandals", image: "" },
      { name: "Boots", image: "" },
      { name: "Slippers", image: "" },
    ],
  },
  {
    title: "SHOP BY CATEGORY", subtitle: "Accessories",
    items: [
      { name: "Watches", image: "" },
      { name: "Sunglasses", image: "" },
      { name: "Bags", image: "" },
      { name: "Belts", image: "" },
      { name: "Wallets", image: "" },
    ],
  },
  {
    title: "SHOP BY CATEGORY", subtitle: "Beauty & Personal Care",
    items: [
      { name: "Makeup", image: "" },
      { name: "Skincare", image: "" },
      { name: "Haircare", image: "" },
      { name: "Fragrances", image: "" },
      { name: "Bath & Body", image: "" },
    ],
  },
]

// ====== MORE PRODUCT ROWS ======
const productRow2 = [
  { id: "11", title: "Cotton T-Shirt", handle: "cotton-tshirt", price: 799, originalPrice: 1599, image: "", rating: 4.2, brand: "Roadster" },
  { id: "12", title: "Formal Shirt", handle: "formal-shirt", price: 1499, originalPrice: 2999, image: "", rating: 4.3, brand: "Arrow" },
  { id: "13", title: "Casual Loafers", handle: "casual-loafers", price: 2499, originalPrice: 4999, image: "", rating: 4.1, brand: "Woodland" },
  { id: "14", title: "Handbag", handle: "handbag", price: 1999, originalPrice: 3999, image: "", rating: 4.5, brand: "Lavie" },
  { id: "15", title: "Sunglasses", handle: "sunglasses", price: 999, originalPrice: 1999, image: "", rating: 4.0, brand: "Fastrack" },
]

const productRow3 = [
  { id: "16", title: "Winter Jacket", handle: "winter-jacket", price: 2999, originalPrice: 5999, image: "", rating: 4.6, brand: "Puma" },
  { id: "17", title: "Running Shorts", handle: "running-shorts", price: 999, originalPrice: 1999, image: "", rating: 4.2, brand: "Adidas" },
  { id: "18", title: "Backpack", handle: "backpack", price: 1499, originalPrice: 2999, image: "", rating: 4.4, brand: "Skybags" },
  { id: "19", title: "Analog Watch", handle: "analog-watch", price: 3999, originalPrice: 7999, image: "", rating: 4.7, brand: "Titan" },
  { id: "20", title: "Leather Belt", handle: "leather-belt", price: 799, originalPrice: 1599, image: "", rating: 4.1, brand: "Tommy Hilfiger" },
]

// ====== TOP PICKS ======
const topPicks = [
  { name: "Best of Men's Wear", image: "" },
  { name: "Best of Women's Wear", image: "" },
  { name: "Best of Kids Wear", image: "" },
  { name: "Best of Accessories", image: "" },
  { name: "Best of Footwear", image: "" },
  { name: "Best of Beauty", image: "" },
]

// ====== PROMO BANNERS ======
const promoBanners = [
  { title: "WINTER COLLECTION", subtitle: "Up to 70% off on winter essentials", color: "from-blue-900 to-blue-700", href: "/products?category=winter" },
  { title: "ETHNIC COLLECTION", subtitle: "Discover the latest in ethnic wear", color: "from-pink-800 to-pink-600", href: "/products?category=ethnic" },
  { title: "SPORTS GEAR", subtitle: "Gear up with top sports brands", color: "from-green-800 to-green-600", href: "/products?category=sports" },
]

// ====== SECTION RENDERER ======
function DealRow({ title, items }: { title: string; items: { name: string; discount: string; href: string }[] }) {
  return (
    <section className="max-w-[1280px] mx-auto px-8 mt-6">
      <h2 className="text-[14px] font-bold text-[#3E4152] uppercase tracking-[0.15em] my-[30px]">
        {title}
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-[2px]">
        {items.map((item, i) => (
          <Link key={i} href={item.href} className="group">
            <div className="aspect-[3/4] bg-[#F5F5F6] relative overflow-hidden flex flex-col items-center justify-center p-4 text-center border border-[#EAEAEC] hover:shadow-md transition-shadow">
              <span className="text-[14px] font-bold text-[#282C3F] leading-tight">{item.name}</span>
              <span className="text-[12px] text-[#FF3F6C] font-bold mt-3 bg-white px-2 py-1">{item.discount}</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}

function CategorySection({ title, subtitle, items }: { title: string; subtitle: string; items: { name: string; image: string }[] }) {
  return (
    <section className="max-w-[1280px] mx-auto px-8 mt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[14px] font-bold text-[#3E4152] uppercase tracking-[0.15em] my-[30px] mb-0">
            {title}
          </h2>
          <p className="text-[14px] text-[#696E79] mt-2 mb-[20px]">{subtitle}</p>
        </div>
        <Link href="/products" className="text-[12px] font-bold text-[#FF3F6C] uppercase tracking-[0.15em] hover:underline">
          View All
        </Link>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-[2px]">
        {items.map((item, i) => (
          <Link key={i} href="/products" className="group">
            <div className="aspect-[3/4] bg-[#F5F5F6] relative overflow-hidden flex items-center justify-center border border-[#EAEAEC] hover:shadow-md transition-shadow">
              <span className="text-[#535766] text-sm font-medium">{item.name}</span>
            </div>
            <div className="mt-3 text-center">
              <p className="text-[14px] font-bold text-[#282C3F]">{item.name}</p>
              <p className="text-[12px] text-[#696E79] mt-1">Shop Now</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}

export default function HomePage() {
  // Trending / Best Sellers / New Arrivals are populated from the Medusa API
  // (getProducts) with a graceful fallback to mock data when the backend is
  // unavailable. Featured categories fall back to the static set.
  const [trending, setTrending] = useState<any[]>(trendingProducts)
  const [bestSellers, setBestSellers] = useState<any[]>(productRow2)
  const [newArrivals, setNewArrivals] = useState<any[]>(productRow3)
  const [categories, setCategories] = useState(featuredCategories)

  useEffect(() => {
    let active = true
    async function load() {
      try {
        const { products } = await getProducts({ limit: 10 })
        if (!active || !products?.length) return
        const apiProducts = products as MedusaProduct[]
        // Split the first 10 API products across the three rows.
        setTrending(apiProducts.slice(0, 5))
        setBestSellers(apiProducts.slice(5, 10).length ? apiProducts.slice(5, 10) : productRow2)
        // If the API returns fewer than 10, keep mock data for the empty rows.
        if (apiProducts.length < 5) setTrending(trendingProducts)
      } catch (err) {
        console.warn("Homepage: Medusa API unavailable, showing mock products.", err)
      }

      try {
        const collections = await getCollections()
        if (!active || !collections?.length) return
        setCategories(
          collections.slice(0, 4).map((c: MedusaCollection) => ({
            name: c.title,
            image: "",
            href: `/products?collection=${c.handle}`,
          }))
        )
      } catch (err) {
        console.warn("Homepage: collections unavailable, showing static categories.", err)
      }
    }
    load()
    return () => { active = false }
  }, [])

  return (
    <div>
      {/* ===== HERO BANNER SECTION ===== */}
      <section className="bg-[#F5F5F6]">
        <div className="max-w-[1280px] mx-auto px-8 py-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-[2px]">
            {bannerOffers.map((offer, i) => (
              <div key={i} className={`${offer.color} text-white p-8 text-center cursor-pointer hover:opacity-95 transition-opacity min-h-[200px] flex flex-col items-center justify-center`}>
                <h2 className="text-[24px] md:text-[30px] font-bold tracking-tight">{offer.title}</h2>
                <p className="text-[14px] mt-2 opacity-90">{offer.subtitle}</p>
                <button className="mt-4 bg-white text-[#282C3F] font-bold px-6 py-2 text-[12px] uppercase tracking-[0.15em] hover:bg-gray-100 transition-colors">
                  Shop Now
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== BRAND CAROUSEL ===== */}
      <section className="max-w-[1280px] mx-auto px-8">
        <h2 className="text-[14px] font-bold text-[#3E4152] uppercase tracking-[0.15em] my-[30px]">
          Top Brands
        </h2>
        <div className="grid grid-cols-5 md:grid-cols-10 gap-[2px] mb-6">
          {brandLogos.map((brand) => (
            <div key={brand.name} className="flex items-center justify-center p-4 border border-[#EAEAEC] hover:shadow-md transition-shadow cursor-pointer bg-white min-h-[80px]">
              <span className="text-[10px] font-bold text-[#535766] uppercase tracking-wider text-center leading-tight">{brand.name}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ===== CATEGORY GRID ===== */}
      <section className="max-w-[1280px] mx-auto px-8">
        <h2 className="text-[14px] font-bold text-[#3E4152] uppercase tracking-[0.15em] my-[30px]">
          Shop by Category
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-[2px]">
          {categories.map((cat) => (
            <Link key={cat.name} href={cat.href} className="group relative overflow-hidden aspect-[3/4] bg-[#F5F5F6] block">
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent z-10" />
              <div className="absolute bottom-0 left-0 right-0 z-20 p-4">
                <h3 className="text-white text-lg md:text-xl font-bold">{cat.name}</h3>
                <p className="text-white/80 text-sm">Shop now →</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ===== DISCOUNT DEAL ROWS (5 rows, 6 items each) ===== */}
      {allDealRows.map((row, idx) => (
        <DealRow key={`deal-${idx}`} title={row.title} items={row.items} />
      ))}

      {/* ===== PROMOTIONAL BANNERS ===== */}
      <section className="max-w-[1280px] mx-auto px-8 mt-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {promoBanners.map((banner, i) => (
            <Link key={i} href={banner.href} className={`bg-gradient-to-br ${banner.color} text-white p-8 text-center cursor-pointer hover:opacity-95 transition-opacity min-h-[220px] flex flex-col items-center justify-center`}>
              <h2 className="text-[22px] md:text-[28px] font-bold tracking-tight">{banner.title}</h2>
              <p className="text-[13px] mt-2 opacity-90 max-w-[200px]">{banner.subtitle}</p>
              <button className="mt-4 bg-white text-[#282C3F] font-bold px-6 py-2 text-[12px] uppercase tracking-[0.15em] hover:bg-gray-100 transition-colors">
                Shop Now
              </button>
            </Link>
          ))}
        </div>
      </section>

      {/* ===== TRENDING PRODUCTS ROW 1 ===== */}
      <section className="max-w-[1280px] mx-auto px-8">
        <div className="flex items-center justify-between">
          <h2 className="text-[14px] font-bold text-[#3E4152] uppercase tracking-[0.15em] my-[30px]">
            Trending Now
          </h2>
          <Link href="/products" className="text-[12px] font-bold text-[#FF3F6C] uppercase tracking-[0.15em] hover:underline">
            View All
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-[2px]">
          {trending.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* ===== CATEGORY SECTIONS ===== */}
      {categorySections.map((catSection, idx) => (
        <CategorySection key={`cat-${idx}`} title={catSection.title} subtitle={catSection.subtitle} items={catSection.items} />
      ))}

      {/* ===== MORE BRANDS STRIP ===== */}
      <section className="max-w-[1280px] mx-auto px-8 mt-6">
        <h2 className="text-[14px] font-bold text-[#3E4152] uppercase tracking-[0.15em] my-[30px]">
          More Brands
        </h2>
        <div className="grid grid-cols-5 md:grid-cols-10 gap-[2px] mb-6">
          {moreBrands.map((brand) => (
            <div key={brand.name} className="flex items-center justify-center p-4 border border-[#EAEAEC] hover:shadow-md transition-shadow cursor-pointer bg-white min-h-[80px]">
              <span className="text-[10px] font-bold text-[#535766] uppercase tracking-wider text-center leading-tight">{brand.name}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ===== TOP PICKS ===== */}
      <section className="max-w-[1280px] mx-auto px-8 mt-6">
        <h2 className="text-[14px] font-bold text-[#3E4152] uppercase tracking-[0.15em] my-[30px]">
          Top Picks
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-[2px]">
          {topPicks.map((pick, i) => (
            <Link key={i} href="/products" className="group">
              <div className="aspect-[4/5] bg-[#F5F5F6] relative overflow-hidden flex items-center justify-center border border-[#EAEAEC] hover:shadow-md transition-shadow">
                <span className="text-[#535766] text-sm font-medium p-4 text-center">{pick.name}</span>
              </div>
              <div className="mt-3 text-center">
                <p className="text-[14px] font-bold text-[#282C3F]">{pick.name}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ===== MORE PRODUCT ROWS ===== */}
      <section className="max-w-[1280px] mx-auto px-8">
        <div className="flex items-center justify-between">
          <h2 className="text-[14px] font-bold text-[#3E4152] uppercase tracking-[0.15em] my-[30px]">
            Best Sellers
          </h2>
          <Link href="/products" className="text-[12px] font-bold text-[#FF3F6C] uppercase tracking-[0.15em] hover:underline">
            View All
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-[2px]">
          {bestSellers.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      <section className="max-w-[1280px] mx-auto px-8 mt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-[14px] font-bold text-[#3E4152] uppercase tracking-[0.15em] my-[30px]">
            New Arrivals
          </h2>
          <Link href="/products" className="text-[12px] font-bold text-[#FF3F6C] uppercase tracking-[0.15em] hover:underline">
            View All
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-[2px]">
          {newArrivals.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* ===== APP DOWNLOAD BANNER ===== */}
      <section className="mt-6 bg-[#F5F5F6]">
        <div className="max-w-[1280px] mx-auto px-8 py-6">
          <div className="bg-gradient-to-r from-[#FF3F6C] to-[#FF6B8A] text-white rounded-sm overflow-hidden">
            <div className="flex flex-col md:flex-row items-center justify-between p-8 md:p-12">
              <div className="text-center md:text-left mb-4 md:mb-0">
                <h2 className="text-[28px] md:text-[36px] font-bold tracking-tight">
                  UPTO ₹300 OFF
                </h2>
                <p className="text-[14px] mt-2 opacity-90 max-w-md">
                  On your first order. Download the Myntra App now for exclusive deals, faster checkout, and style inspiration on the go!
                </p>
              </div>
              <div className="flex gap-3 mt-4 md:mt-0">
                <div className="bg-[#282C3F] text-white px-8 py-3 text-[12px] font-bold uppercase tracking-[0.15em] cursor-pointer hover:bg-opacity-90 transition-opacity rounded-sm">
                  Google Play
                </div>
                <div className="bg-[#282C3F] text-white px-8 py-3 text-[12px] font-bold uppercase tracking-[0.15em] cursor-pointer hover:bg-opacity-90 transition-opacity rounded-sm">
                  App Store
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== END OF SEASON SALE BANNER ===== */}
      <section className="mt-6">
        <div className="bg-gradient-to-r from-[#FF3F6C] to-[#FF6B8A] text-white py-20">
          <div className="max-w-[1280px] mx-auto px-8 text-center">
            <h2 className="text-[36px] md:text-[48px] font-bold tracking-tight">
              END OF SEASON SALE
            </h2>
            <p className="text-[16px] mt-3 opacity-90 max-w-lg mx-auto">
              Up to 70% off on thousands of styles. Limited period only. Don&apos;t miss out on the biggest fashion event of the season!
            </p>
            <button className="mt-6 bg-white text-[#FF3F6C] font-bold px-10 py-3 text-[14px] uppercase tracking-[0.15em] hover:bg-gray-100 transition-colors">
              Shop Now
            </button>
          </div>
        </div>
      </section>

      {/* ===== NEWSLETTER SECTION ===== */}
      <section className="bg-[#282C3F] text-white py-12 mt-6">
        <div className="max-w-[1280px] mx-auto px-8 text-center">
          <h2 className="text-[28px] md:text-[34px] font-bold tracking-tight">
            SIGN UP & GET 10% OFF
          </h2>
          <p className="text-[14px] text-[#D4D5D9] mt-2 max-w-lg mx-auto">
            Be the first to know about new arrivals, exclusive deals, and style inspiration delivered to your inbox.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input type="email" placeholder="Enter your email" className="flex-1 px-4 py-3 text-[14px] text-[#282C3F] focus:outline-none" />
            <button className="bg-[#FF3F6C] text-white font-bold px-6 py-3 text-[12px] uppercase tracking-[0.15em] hover:opacity-90 transition-opacity">
              Subscribe
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}
