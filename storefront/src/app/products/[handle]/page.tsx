"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { HiOutlineHeart, HiOutlineShare, HiOutlineShoppingBag } from "react-icons/hi"
import toast from "react-hot-toast"
import {
  formatPriceRupees,
  checkPincode,
  getProduct,
  getProductThumbnail,
  getProductImages,
  getVariantPrice,
  getProductReviews,
  addToWishlist,
  addToCart,
  createCart,
} from "@/lib/medusa"
import { useCartStore, useAuthStore } from "@/lib/store"
import type { MedusaProduct, MedusaVariant } from "@/lib/medusa"

interface ProductDetailPageProps {
  params: { handle: string }
}

interface ReviewState {
  reviews: any[]
  total: number
  average_rating?: number
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
  const [wishlistLoading, setWishlistLoading] = useState(false)

  const [reviews, setReviews] = useState<ReviewState | null>(null)

  const cartId = useCartStore((s) => s.cartId)
  const setCart = useCartStore((s) => s.setCart)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

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

  // Fetch reviews once the product is available
  useEffect(() => {
    if (!product) return
    let cancelled = false
    async function loadReviews() {
      try {
        const result = await getProductReviews(product!.id)
        if (!cancelled) setReviews(result)
      } catch {
        // Graceful fallback — leave reviews null so we show "No reviews yet".
        if (!cancelled) setReviews(null)
      }
    }
    loadReviews()
    return () => {
      cancelled = true
    }
  }, [product])

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
      <div className="min-h-[700px] mt-[80px] flex flex-col items-center justify-center gap-4">
        <p className="text-red-500">{error || "Product not found"}</p>
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

  // Compute average rating: prefer the API's average_rating, else derive from
  // the returned reviews when available.
  const avgRating =
    reviews?.average_rating ??
    (reviews && reviews.reviews.length > 0
      ? reviews.reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.reviews.length
      : null)
  const reviewCount = reviews?.total ?? 0

  // Collection link — only link if a handle exists; otherwise fall back to the
  // products listing so we never emit a broken /collections route.
  const collectionHref = product.collection?.handle
    ? `/collections/${product.collection.handle}`
    : "/products"

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
      // Prefer the zustand store's cart id; fall back to the legacy
      // localStorage "cart_id" key used by the cart/checkout pages so an
      // existing cart is reused instead of creating a duplicate.
      let cid = cartId || localStorage.getItem("cart_id")
      if (!cid) {
        const cart = await createCart()
        cid = cart.id
        setCart(cart)
      }
      const updated = await addToCart(cid, selectedVariant.id, 1)
      setCart(updated)
      // Mirror the cart id to the legacy key used by the cart/checkout pages
      // (M3a wired those to localStorage "cart_id"). Keeps both in sync until
      // those pages are migrated onto the zustand store.
      localStorage.setItem("cart_id", cid)
      setAddedToCart(true)
      setTimeout(() => setAddedToCart(false), 3000)
    } catch (err) {
      console.error("Failed to add to cart:", err)
      toast.error("Could not add to bag. Please try again.")
    }
    setAddingToCart(false)
  }

  const handleWishlist = async () => {
    if (!isAuthenticated) {
      toast("Please log in to save to wishlist")
      return
    }
    setWishlistLoading(true)
    try {
      await addToWishlist(product.id, selectedVariant?.id)
      toast.success("Added to wishlist")
    } catch (err) {
      console.error("Failed to add to wishlist:", err)
      toast.error("Could not add to wishlist. Please try again.")
    }
    setWishlistLoading(false)
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
                    className={`relative w-[60px] h-[80px] border-2 overflow-hidden flex-shrink-0 transition-all ${
                      selectedImage === i ? "border-[#FF3F6C] opacity-100" : "border-[#E9E9EB] opacity-70 hover:opacity-100"
                    }`}
                  >
                    <Image
                      src={img}
                      alt=""
                      fill
                      sizes="60px"
                      className="object-cover"
                    />
                  </button>
                ))
              ) : (
                <div className="w-[60px] h-[80px] border border-[#E9E9EB] flex items-center justify-center text-[10px] text-[#94969F]">
                  No img
                </div>
              )}
            </div>
            {/* Main Image */}
            <div className="flex-1 bg-[#F5F5F6] flex items-center justify-center overflow-hidden group relative aspect-[3/4]">
              {images[selectedImage] ? (
                <Image
                  src={images[selectedImage]}
                  alt={product.title}
                  fill
                  sizes="(min-width: 1024px) 55vw, 100vw"
                  priority
                  className="object-contain transition-transform duration-300 group-hover:scale-110 cursor-crosshair"
                />
              ) : thumbnail ? (
                <Image
                  src={thumbnail}
                  alt={product.title}
                  fill
                  sizes="(min-width: 1024px) 55vw, 100vw"
                  priority
                  className="object-contain"
                />
              ) : (
                <span className="text-[#94969F] text-sm">Product Image</span>
              )}
            </div>
          </div>

          {/* ===== RIGHT: Product Info ===== */}
          <div className="lg:w-[45%]">
            {/* Brand / Collection */}
            {product.collection && (
              <Link href={collectionHref} className="text-[#FF3F6C] text-[14px] font-bold uppercase tracking-[0.05em] hover:underline">
                {product.collection.title}
              </Link>
            )}

            {/* Title */}
            <h1 className="text-[#282C3F] text-[20px] md:text-[24px] font-bold mt-[5px] leading-tight">
              {product.title}
            </h1>

            {/* Rating */}
            <div className="flex items-center gap-[8px] mt-[10px]">
              {avgRating !== null ? (
                <>
                  <span className="bg-[#03A685] text-white text-[11px] font-bold px-[6px] py-[2px] rounded-[3px] flex items-center gap-[3px]">
                    {avgRating.toFixed(1)} ★
                  </span>
                  <span className="text-[#282C3F] text-[13px] font-semibold">
                    {reviewCount} {reviewCount === 1 ? "Rating" : "Ratings"}
                  </span>
                </>
              ) : (
                <span className="text-[#94969F] text-[13px]">No ratings yet</span>
              )}
            </div>

            {/* Price */}
            <div className="mt-[15px]">
              <div className="flex items-baseline gap-[10px]">
                <span className="text-[#282C3F] text-[20px] font-bold">
                  {formatPriceRupees(currentPrice)}
                </span>
                {maxPrice > currentPrice && (
                  <>
                    <span className="text-[#7E818C] text-[16px] line-through">
                      {formatPriceRupees(maxPrice)}
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
              <button
                onClick={handleWishlist}
                disabled={wishlistLoading}
                className="w-[52px] h-[52px] border border-[#D4D5D9] flex items-center justify-center hover:border-[#282C3F] transition-colors disabled:opacity-50"
                aria-label="Add to wishlist"
              >
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

        {/* ===== Ratings & Reviews Section ===== */}
        <div className="mt-[40px] border-t border-[#E9E9EB] pt-[25px] mb-[50px]">
          <h2 className="text-[#282C3F] text-[16px] font-bold uppercase tracking-[0.1em] mb-[15px]">
            Ratings & Reviews
          </h2>
          {avgRating !== null ? (
            <>
              <div className="flex items-center gap-[15px]">
                <div className="text-center">
                  <div className="text-[#282C3F] text-[36px] font-bold">
                    {avgRating.toFixed(1)}
                  </div>
                  <div className="text-[#03A685] text-[14px]">★★★★★</div>
                </div>
                <div className="flex-1">
                  {[5, 4, 3, 2, 1].map((star) => {
                    const count = reviews?.reviews
                      ? reviews.reviews.filter((r) => r.rating === star).length
                      : 0
                    const pct = reviews?.reviews && reviews.reviews.length > 0
                      ? Math.round((count / reviews.reviews.length) * 100)
                      : 0
                    return (
                      <div key={star} className="flex items-center gap-[8px] text-[12px] text-[#535766]">
                        <span>{star}</span>
                        <div className="flex-1 h-[4px] bg-[#E9E9EB] rounded-full">
                          <div
                            className="h-full bg-[#03A685] rounded-full"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* A few reviews */}
              {reviews?.reviews && reviews.reviews.length > 0 && (
                <div className="mt-[25px] space-y-[20px]">
                  {reviews.reviews.slice(0, 3).map((r: any) => (
                    <div key={r.id ?? r.title} className="border-b border-[#E9E9EB] pb-[15px]">
                      <div className="flex items-center gap-[8px] mb-[6px]">
                        <span className="bg-[#03A685] text-white text-[11px] font-bold px-[6px] py-[2px] rounded-[3px]">
                          {r.rating} ★
                        </span>
                        {r.title && (
                          <span className="text-[#282C3F] text-[14px] font-semibold">{r.title}</span>
                        )}
                      </div>
                      {r.body && (
                        <p className="text-[#535766] text-[14px] leading-relaxed">{r.body}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <p className="text-[#94969F] text-[14px]">No reviews yet</p>
          )}
        </div>
      </div>
    </div>
  )
}