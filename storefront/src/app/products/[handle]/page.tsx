"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { HiOutlineHeart, HiOutlineShare, HiOutlineShoppingBag } from "react-icons/hi"
import {
  formatPrice,
  checkPincode,
  getProduct,
  getProductThumbnail,
  getProductImages,
  getVariantPrice,
  addToCart,
  createCart,
  getCart,
} from "@/lib/medusa"
import type { MedusaProduct, MedusaVariant } from "@/lib/medusa"

interface ProductDetailPageProps {
  params: { handle: string }
}

export default function ProductDetailPage({ params }: ProductDetailPageProps) {
  const [product, setProduct] = useState<MedusaProduct | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [selectedSize, setSelectedSize] = useState<string | null>(null)
  const [selectedVariant, setSelectedVariant] = useState<MedusaVariant | null>(null)
  const [pincode, setPincode] = useState("")
  const [pincodeResult, setPincodeResult] = useState<{ is_serviceable: boolean; estimated_days: number } | null>(null)
  const [pincodeLoading, setPincodeLoading] = useState(false)
  const [selectedImage, setSelectedImage] = useState(0)
  const [addingToCart, setAddingToCart] = useState(false)
  const [addedToCart, setAddedToCart] = useState(false)

  // Fetch product on mount
  useEffect(() => {
    async function load() {
      try {
        const p = await getProduct(params.handle)
        setProduct(p)
        if (p.variants.length > 0) {
          setSelectedVariant(p.variants[0])
        }
      } catch (err: any) {
        setError(err.message || "Failed to load product")
      }
      setLoading(false)
    }
    load()
  }, [params.handle])

  // Update selected variant when size changes
  useEffect(() => {
    if (!product) return
    if (selectedSize) {
      const variant = product.variants.find((v) => {
        const optionValues = v.options.map((o) => o.value)
        return optionValues.includes(selectedSize)
      })
      if (variant) setSelectedVariant(variant)
    }
  }, [selectedSize, product])

  if (loading) {
    return (
      <div className="min-h-[700px] mt-[80px] flex items-center justify-center">
        <p className="text-[#535766] text-sm">Loading product...</p>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="min-h-[700px] mt-[80px] flex items-center justify-center">
        <p className="text-red-500 mb-4">{error || "Product not found"}</p>
        <Link href="/products" className="text-[#FF3F6C] font-bold text-sm uppercase tracking-[0.15em]">Browse Products</Link>
      </div>
    )
  }

  const currentPrice = selectedVariant
    ? getVariantPrice(selectedVariant)
    : Math.min(...product.variants.map((v) => getVariantPrice(v)))

  const maxPrice = Math.max(...product.variants.map((v) => getVariantPrice(v)))

  const discount = maxPrice > currentPrice ? Math.round((1 - currentPrice / maxPrice) * 100) : 0
  const images = getProductImages(product)
  const thumbnail = getProductThumbnail(product)

  // Extract unique sizes from variants
  const sizeOption = product.options.find((o) => o.title.toLowerCase() === "size")
  const sizes = sizeOption?.values.map((v) => v.value) || []

  const handleCheckPincode = async () => {
    if (!/^\d{6}$/.test(pincode)) return
    setPincodeLoading(true)
    try {
      const result = await checkPincode(pincode)
      setPincodeResult(result)
    } catch {
      setPincodeResult({ is_serviceable: false, estimated_days: 0 })
    }
    setPincodeLoading(false)
  }

  const handleAddToCart = async () => {
    if (!selectedVariant) return
    setAddingToCart(true)
    try {
      let cartId = localStorage.getItem("cart_id")
      if (!cartId) {
        const cart = await createCart()
        cartId = cart.id
        localStorage.setItem("cart_id", cartId)
      }
      await addToCart(cartId, selectedVariant.id, 1)
      setAddedToCart(true)
      setTimeout(() => setAddedToCart(false), 3000)
    } catch (err) {
      console.error("Failed to add to cart:", err)
    }
    setAddingToCart(false)
  }

  return (
    <div className="min-h-[700px] mt-[80px]">
      <div className="max-w-[1280px] mx-auto px-[30px]">
        {/* Breadcrumb */}
        <div className="text-[12px] text-[#535766] py-[12px] border-b border-[#E9E9EB]">
          <Link href="/" className="hover:text-[#282C3F]">Home</Link>
          <span className="mx-2">/</span>
          <Link href="/products" className="hover:text-[#282C3F]">Products</Link>
          <span className="mx-2">/</span>
          <span className="text-[#282C3F] font-semibold">{product.title}</span>
        </div>

        <div className="flex flex-col lg:flex-row gap-[30px] pt-[20px]">
          {/* ===== LEFT: Image Gallery ===== */}
          <div className="lg:w-[55%] flex gap-[10px]">
            {/* Thumbnails */}
            <div className="flex flex-col gap-[8px] w-[60px] flex-shrink-0">
              {images.length > 0 ? (
                images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    className={`w-[60px] h-[80px] border-2 overflow-hidden flex-shrink-0 transition-all ${
                      selectedImage === i ? "border-[#FF3F6C] opacity-100" : "border-[#E9E9EB] opacity-70 hover:opacity-100"
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))
              ) : (
                <div className="w-[60px] h-[80px] border border-[#E9E9EB] flex items-center justify-center text-[10px] text-[#94969F]">
                  No img
                </div>
              )}
            </div>
            {/* Main Image */}
            <div className="flex-1 bg-[#F5F5F6] flex items-center justify-center overflow-hidden group relative">
              {images[selectedImage] ? (
                <img
                  src={images[selectedImage]}
                  alt={product.title}
                  className="w-full h-auto object-contain transition-transform duration-300 group-hover:scale-110 cursor-crosshair"
                />
              ) : thumbnail ? (
                <img
                  src={thumbnail}
                  alt={product.title}
                  className="w-full h-auto object-contain"
                />
              ) : (
                <span className="text-[#94969F] text-sm">Product Image</span>
              )}
            </div>
          </div>

          {/* ===== RIGHT: Product Info ===== */}
          <div className="lg:w-[45%]">
            {/* Brand */}
            {product.collection && (
              <Link href={`/collections/${""}`} className="text-[#FF3F6C] text-[14px] font-bold uppercase tracking-[0.05em] hover:underline">
                {product.collection.title}
              </Link>
            )}

            {/* Title */}
            <h1 className="text-[#282C3F] text-[20px] md:text-[24px] font-bold mt-[5px] leading-tight">
              {product.title}
            </h1>

            {/* Rating */}
            <div className="flex items-center gap-[8px] mt-[10px]">
              <span className="bg-[#03A685] text-white text-[11px] font-bold px-[6px] py-[2px] rounded-[3px] flex items-center gap-[3px]">
                4.2 ★
              </span>
              <span className="text-[#282C3F] text-[13px] font-semibold">4.2k Ratings</span>
            </div>

            {/* Price */}
            <div className="mt-[15px]">
              <div className="flex items-baseline gap-[10px]">
                <span className="text-[#282C3F] text-[20px] font-bold">
                  ₹{currentPrice.toLocaleString("en-IN")}
                </span>
                {maxPrice > currentPrice && (
                  <>
                    <span className="text-[#7E818C] text-[16px] line-through">
                      ₹{maxPrice.toLocaleString("en-IN")}
                    </span>
                    <span className="text-[#FF3F6C] text-[14px] font-bold">
                      ({discount}% OFF)
                    </span>
                  </>
                )}
              </div>
              {maxPrice > currentPrice && (
                <p className="text-[#03A685] text-[12px] font-semibold mt-[5px]">
                  inclusive of all taxes
                </p>
              )}
            </div>

            {/* Size Selector */}
            {sizes.length > 0 && (
              <div className="mt-[25px] border-t border-[#E9E9EB] pt-[20px]">
                <div className="flex items-center justify-between mb-[15px]">
                  <h3 className="text-[#282C3F] text-[14px] font-semibold">
                    Select Size
                  </h3>
                  <button className="text-[#FF3F6C] text-[12px] font-bold hover:underline">
                    Size Guide
                  </button>
                </div>
                <div className="flex flex-wrap gap-[10px]">
                  {sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`w-[50px] h-[50px] text-[14px] font-semibold rounded-full border transition-all ${
                        selectedSize === size
                          ? "border-[#FF3F6C] text-[#FF3F6C] bg-[#FF3F6C]/5"
                          : "border-[#D4D5D9] text-[#282C3F] hover:border-[#282C3F]"
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Pincode Checker */}
            <div className="mt-[25px] border-t border-[#E9E9EB] pt-[20px]">
              <h3 className="text-[#282C3F] text-[14px] font-semibold mb-[10px]">
                Delivery Options
              </h3>
              <div className="flex items-center gap-[8px]">
                <input
                  type="text"
                  placeholder="Enter pincode"
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  className="flex-1 border border-[#D4D5D9] px-[12px] py-[8px] text-[13px] focus:outline-none focus:border-[#282C3F]"
                  maxLength={6}
                />
                <button
                  onClick={handleCheckPincode}
                  disabled={pincode.length !== 6 || pincodeLoading}
                  className="bg-[#FF3F6C] text-white px-[20px] py-[8px] text-[12px] font-bold uppercase tracking-[0.1em] disabled:opacity-50 hover:opacity-90 transition-opacity"
                >
                  {pincodeLoading ? "..." : "Check"}
                </button>
              </div>
              {pincodeResult && (
                <p className={`text-[12px] mt-[8px] ${pincodeResult.is_serviceable ? "text-[#03A685]" : "text-[#FF3F6C]"}`}>
                  {pincodeResult.is_serviceable
                    ? `✅ Delivery available in ${pincodeResult.estimated_days} days`
                    : "❌ Delivery not available at this pincode"}
                </p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-[10px] mt-[25px]">
              <button
                onClick={handleAddToCart}
                disabled={!selectedVariant || addingToCart}
                className={`flex-1 font-bold py-[16px] px-[20px] text-[14px] uppercase tracking-[0.1em] transition-all flex items-center justify-center gap-[8px] ${
                  addedToCart
                    ? "bg-[#03A685] text-white"
                    : "bg-[#FF3F6C] text-white hover:opacity-90"
                }`}
              >
                <HiOutlineShoppingBag size={20} />
                {addingToCart ? "Adding..." : addedToCart ? "Added ✓" : "Add to Bag"}
              </button>
              <button className="w-[52px] h-[52px] border border-[#D4D5D9] flex items-center justify-center hover:border-[#282C3F] transition-colors" aria-label="Add to wishlist">
                <HiOutlineHeart size={20} className="text-[#282C3F]" />
              </button>
              <button className="w-[52px] h-[52px] border border-[#D4D5D9] flex items-center justify-center hover:border-[#282C3F] transition-colors" aria-label="Share">
                <HiOutlineShare size={20} className="text-[#282C3F]" />
              </button>
            </div>

            {/* Delivery Info */}
            <div className="mt-[20px] border border-[#E9E9EB] p-[15px]">
              <div className="flex items-center gap-[10px] text-[12px] text-[#282C3F]">
                <span className="font-semibold">✔</span>
                <span>Easy 14 days returns & exchanges</span>
              </div>
              <div className="flex items-center gap-[10px] text-[12px] text-[#282C3F] mt-[8px]">
                <span className="font-semibold">✔</span>
                <span>Cash on Delivery available</span>
              </div>
            </div>
          </div>
        </div>

        {/* ===== Product Details Section ===== */}
        {product.description && (
          <div className="mt-[40px] border-t border-[#E9E9EB] pt-[25px]">
            <h2 className="text-[#282C3F] text-[16px] font-bold uppercase tracking-[0.1em] mb-[15px]">
              Product Details
            </h2>
            <p className="text-[#535766] text-[14px] leading-relaxed max-w-[800px]">
              {product.description}
            </p>
          </div>
        )}

        {/* ===== Ratings Section ===== */}
        <div className="mt-[40px] border-t border-[#E9E9EB] pt-[25px] mb-[50px]">
          <h2 className="text-[#282C3F] text-[16px] font-bold uppercase tracking-[0.1em] mb-[15px]">
            Ratings & Reviews
          </h2>
          <div className="flex items-center gap-[15px]">
            <div className="text-center">
              <div className="text-[#282C3F] text-[36px] font-bold">4.2</div>
              <div className="text-[#03A685] text-[14px]">★★★★★</div>
            </div>
            <div className="flex-1">
              {[5, 4, 3, 2, 1].map((star) => (
                <div key={star} className="flex items-center gap-[8px] text-[12px] text-[#535766]">
                  <span>{star}</span>
                  <div className="flex-1 h-[4px] bg-[#E9E9EB] rounded-full">
                    <div
                      className="h-full bg-[#03A685] rounded-full"
                      style={{ width: `${star === 5 ? 60 : star === 4 ? 25 : star === 3 ? 10 : 5}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
