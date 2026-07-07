"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { HiOutlineTrash } from "react-icons/hi"
import { formatPrice, getWishlist, removeFromWishlist, addToCart, createCart } from "@/lib/medusa"

export default function WishlistPage() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const result = await getWishlist()
        setItems(result.items || [])
      } catch (err) {
        console.error("Failed to load wishlist:", err)
      }
      setLoading(false)
    }
    load()
  }, [])

  const handleRemove = async (id: string) => {
    try {
      await removeFromWishlist(id)
      setItems((prev) => prev.filter((item) => item.id !== id))
    } catch (err) {
      console.error("Failed to remove from wishlist:", err)
    }
  }

  const handleAddToBag = async (productId: string, variantId?: string) => {
    try {
      let cartId = localStorage.getItem("cart_id")
      if (!cartId) {
        const cart = await createCart()
        cartId = cart.id
        localStorage.setItem("cart_id", cartId)
      }
      if (variantId) {
        await addToCart(cartId, variantId, 1)
      }
    } catch (err) {
      console.error("Failed to add to cart:", err)
    }
  }

  if (loading) {
    return (
      <div className="max-w-container mx-auto px-4 md:px-8 py-12 text-center">
        <p className="text-myntra-muted">Loading wishlist...</p>
      </div>
    )
  }

  return (
    <div className="max-w-container mx-auto px-4 md:px-8 py-6">
      <h1 className="text-xl font-bold text-myntra-dark mb-6">
        My Wishlist ({items.length})
      </h1>

      {items.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {items.map((item: any) => {
            const product = item.product || item
            const amount = product.variants?.[0]?.prices?.[0]?.amount ?? 0
            const maxAmount = product.variants?.length > 1
              ? Math.max(...product.variants.map((v: any) => v.prices?.[0]?.amount ?? 0))
              : undefined
            // formatPrice divides by 100 (paise -> rupees); pass raw amounts.
            const discount = maxAmount && maxAmount > amount ? Math.round((1 - amount / maxAmount) * 100) : 0
            const thumbnail = product.thumbnail || ""

            return (
              <div key={item.id || product.id} className="group relative">
                <button
                  onClick={() => handleRemove(item.id)}
                  className="absolute top-2 right-2 z-10 p-1.5 bg-white/80 rounded-full hover:bg-white"
                  aria-label="Remove from wishlist"
                >
                  <HiOutlineTrash size={16} className="text-red-500" />
                </button>
                <Link href={`/products/${product.handle}`} className="block">
                  <div className="aspect-[3/4] bg-myntra-lightgray rounded-sm relative overflow-hidden">
                    {thumbnail ? (
                      <img src={thumbnail} alt={product.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-myntra-muted text-xs">
                        Product Image
                      </div>
                    )}
                    {discount > 0 && (
                      <span className="absolute top-2 left-2 bg-myntra-primary text-white text-[10px] font-semibold px-1.5 py-0.5 rounded-sm">
                        {discount}% OFF
                      </span>
                    )}
                  </div>
                  <div className="mt-2">
                    {product.collection?.title && (
                      <p className="text-xs font-semibold text-myntra-muted uppercase">{product.collection.title}</p>
                    )}
                    <p className="text-sm text-myntra-dark">{product.title}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold">{formatPrice(amount)}</span>
                      {maxAmount && maxAmount > amount && (
                        <span className="text-xs text-myntra-muted line-through">{formatPrice(maxAmount)}</span>
                      )}
                    </div>
                  </div>
                </Link>
                <button
                  onClick={() => handleAddToBag(product.id, product.variants?.[0]?.id)}
                  className="w-full mt-2 bg-myntra-primary text-white text-xs font-semibold py-2 uppercase tracking-wider hover:opacity-90 transition-opacity"
                >
                  Add to Bag
                </button>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-12 border border-myntra-border rounded-sm">
          <p className="text-myntra-muted mb-4">Your wishlist is empty</p>
          <Link href="/products" className="btn-primary inline-block">
            Browse Products
          </Link>
        </div>
      )}
    </div>
  )
}
