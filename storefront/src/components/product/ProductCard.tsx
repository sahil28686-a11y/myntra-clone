import Link from "next/link"
import { HiOutlineHeart } from "react-icons/hi"
import { formatPrice } from "@/lib/medusa"

interface Product {
  id: string
  title: string
  handle: string
  price: number
  originalPrice?: number
  image: string
  rating?: number
  brand?: string
}

export default function ProductCard({ product }: { product: Product }) {
  const discount = product.originalPrice && product.originalPrice > product.price
    ? Math.round((1 - product.price / product.originalPrice) * 100)
    : 0

  return (
    <div className="group relative">
      {/* Wishlist button */}
      <button
        className="absolute top-2 right-2 z-10 p-1.5 bg-white/80 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
        aria-label="Add to wishlist"
      >
        <HiOutlineHeart size={18} className="text-myntra-dark" />
      </button>

      <Link href={`/products/${product.handle}`} className="block">
        {/* Image - Myntra uses aspect-[3/4] with no rounded corners */}
        <div className="aspect-[3/4] bg-[#F5F5F6] relative overflow-hidden">
          {product.image ? (
            <img
              src={product.image}
              alt={product.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-myntra-muted text-xs">
              Product Image
            </div>
          )}
          {discount > 0 && (
            <span className="absolute top-[12px] left-[12px] bg-[#FF3F6C] text-white text-[11px] font-bold px-[5px] py-[2px]">
              {discount}% OFF
            </span>
          )}
        </div>

        {/* Details - Myntra uses specific spacing and typography */}
        <div className="mt-[10px] px-0 space-y-[1px]">
          {product.brand && (
            <p className="text-[14px] font-bold text-[#282C3F] leading-[1.3]">{product.brand}</p>
          )}
          <p className="text-[14px] text-[#535766] line-clamp-2 leading-[1.3]">{product.title}</p>
          <div className="flex items-center gap-[5px] mt-[5px] flex-wrap">
            <span className="text-[14px] font-bold text-[#282C3F]">
              {formatPrice(product.price)}
            </span>
            {product.originalPrice && product.originalPrice > product.price && (
              <span className="text-[12px] text-[#94969F] line-through">
                {formatPrice(product.originalPrice)}
              </span>
            )}
            {discount > 0 && (
              <span className="text-[12px] font-semibold text-[#FF3F6C]">
                ({discount}% OFF)
              </span>
            )}
          </div>
          {product.rating && (
            <div className="flex items-center gap-1 mt-[6px]">
              <span className="text-[11px] bg-[#4F6D4A] text-white px-[4px] py-[1px] font-medium">
                {product.rating} ★
              </span>
            </div>
          )}
        </div>
      </Link>
    </div>
  )
}
