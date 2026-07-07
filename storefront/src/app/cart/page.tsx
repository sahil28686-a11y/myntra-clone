"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { HiOutlineTrash, HiOutlineMinus, HiOutlinePlus } from "react-icons/hi"
import { formatPrice, getCart, updateCartItem, removeCartItem, createCart } from "@/lib/medusa"
import type { MedusaCart, MedusaLineItem } from "@/lib/medusa"

export default function CartPage() {
  const [cart, setCart] = useState<MedusaCart | null>(null)
  const [loading, setLoading] = useState(true)
  const [coupon, setCoupon] = useState("")
  const [couponApplied, setCouponApplied] = useState(false)

  // Load cart on mount
  useEffect(() => {
    async function loadCart() {
      try {
        let cartId = localStorage.getItem("cart_id")
        if (cartId) {
          const c = await getCart(cartId)
          setCart(c)
        }
      } catch (err) {
        console.error("Failed to load cart:", err)
      }
      setLoading(false)
    }
    loadCart()
  }, [])

  const updateQuantity = async (itemId: string, delta: number) => {
    if (!cart) return
    const item = cart.items.find((i) => i.id === itemId)
    if (!item) return
    const newQty = Math.max(1, item.quantity + delta)
    try {
      const updated = await updateCartItem(cart.id, itemId, newQty)
      setCart(updated)
    } catch (err) {
      console.error("Failed to update quantity:", err)
    }
  }

  const removeItem = async (itemId: string) => {
    if (!cart) return
    try {
      const updated = await removeCartItem(cart.id, itemId)
      setCart(updated)
    } catch (err) {
      console.error("Failed to remove item:", err)
    }
  }

  if (loading) {
    return (
      <div className="max-w-container mx-auto px-4 md:px-8 py-12 text-center">
        <p className="text-myntra-muted">Loading cart...</p>
      </div>
    )
  }

  const items = cart?.items || []
  const subtotal = cart?.subtotal || 0
  const discount = couponApplied ? subtotal * 0.1 : 0
  const delivery = subtotal > 4999 ? 0 : 99
  const total = subtotal - discount + delivery

  return (
    <div className="max-w-container mx-auto px-4 md:px-8 py-6">
      {/* Breadcrumb */}
      <nav className="text-xs text-myntra-muted mb-4">
        <Link href="/" className="hover:text-myntra-dark">Home</Link>
        <span className="mx-2">/</span>
        <span className="text-myntra-dark font-semibold">Shopping Bag</span>
      </nav>

      <h1 className="text-xl md:text-2xl font-bold text-myntra-dark mb-6">
        Shopping Bag ({items.length} items)
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {items.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-myntra-muted mb-4">Your bag is empty</p>
              <Link href="/products" className="btn-primary inline-block">
                Continue Shopping
              </Link>
            </div>
          ) : (
            items.map((item: MedusaLineItem) => (
              <div key={item.id} className="flex gap-4 p-4 border border-myntra-border rounded-sm">
                {/* Image */}
                <div className="w-24 h-32 bg-myntra-lightgray rounded-sm flex-shrink-0 overflow-hidden">
                  {item.thumbnail ? (
                    <img src={item.thumbnail} alt={item.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-myntra-muted text-xs">
                      No Image
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 space-y-1">
                  <p className="text-xs font-semibold text-myntra-muted uppercase">
                    {item.variant?.sku || "Product"}
                  </p>
                  <h3 className="text-sm font-semibold text-myntra-dark">{item.title}</h3>
                  {item.variant?.title && (
                    <p className="text-xs text-myntra-muted">Variant: {item.variant.title}</p>
                  )}
                  <p className="text-sm font-bold text-myntra-dark">
                    {formatPrice(item.unit_price)}
                  </p>

                  {/* Quantity controls */}
                  <div className="flex items-center gap-3 mt-3">
                    <div className="flex items-center border border-myntra-border rounded-sm">
                      <button
                        onClick={() => updateQuantity(item.id, -1)}
                        className="p-1.5 hover:bg-myntra-lightgray"
                      >
                        <HiOutlineMinus size={16} />
                      </button>
                      <span className="px-4 text-sm font-semibold">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, 1)}
                        className="p-1.5 hover:bg-myntra-lightgray"
                      >
                        <HiOutlinePlus size={16} />
                      </button>
                    </div>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-myntra-muted hover:text-red-500 transition-colors"
                      aria-label="Remove item"
                    >
                      <HiOutlineTrash size={18} />
                    </button>
                  </div>
                </div>

                {/* Price */}
                <div className="text-right">
                  <p className="text-sm font-bold text-myntra-dark">
                    {formatPrice(item.unit_price * item.quantity)}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="sticky top-[88px] border border-myntra-border rounded-sm p-6 space-y-4">
            <h3 className="text-lg font-bold uppercase tracking-wider">Order Summary</h3>

            {/* Coupon */}
            <div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter coupon code"
                  value={coupon}
                  onChange={(e) => setCoupon(e.target.value.toUpperCase())}
                  className="flex-1 border border-myntra-border rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-myntra-dark"
                />
                <button
                  onClick={() => setCouponApplied(true)}
                  disabled={!coupon}
                  className="bg-myntra-dark text-white px-3 py-2 text-sm font-semibold rounded-sm disabled:opacity-50"
                >
                  Apply
                </button>
              </div>
              {couponApplied && (
                <p className="text-xs text-green-600 mt-1">✅ Coupon applied! 10% off</p>
              )}
            </div>

            <hr className="border-myntra-border" />

            {/* Price breakdown */}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-myntra-muted">Subtotal</span>
                <span className="font-semibold">{formatPrice(subtotal)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span>-{formatPrice(discount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-myntra-muted">Delivery</span>
                <span className={delivery === 0 ? "text-green-600" : ""}>
                  {delivery === 0 ? "FREE" : formatPrice(delivery)}
                </span>
              </div>
            </div>

            <hr className="border-myntra-border" />

            <div className="flex justify-between text-base font-bold">
              <span>Total</span>
              <span>{formatPrice(total)}</span>
            </div>

            <Link
              href="/checkout"
              className="block w-full bg-myntra-primary text-white text-center font-semibold py-3 uppercase tracking-wider text-sm hover:opacity-90 transition-opacity"
            >
              Proceed to Checkout
            </Link>

            <Link
              href="/products"
              className="block w-full text-center text-sm text-myntra-muted hover:text-myntra-dark"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
