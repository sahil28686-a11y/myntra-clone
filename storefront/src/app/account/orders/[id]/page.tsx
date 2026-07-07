"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { formatPrice, getOrder, requestReturn } from "@/lib/medusa"
import type { MedusaOrder } from "@/lib/medusa"

interface OrderDetailPageProps {
  params: { id: string }
}

export default function OrderDetailPage({ params }: OrderDetailPageProps) {
  const [order, setOrder] = useState<MedusaOrder | null>(null)
  const [loading, setLoading] = useState(true)
  const [showReturnForm, setShowReturnForm] = useState(false)
  const [returnItems, setReturnItems] = useState<string[]>([])
  const [returnReason, setReturnReason] = useState("")
  const [returnSubmitting, setReturnSubmitting] = useState(false)
  const [returnSuccess, setReturnSuccess] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const o = await getOrder(params.id)
        setOrder(o)
      } catch (err) {
        console.error("Failed to load order:", err)
      }
      setLoading(false)
    }
    load()
  }, [params.id])

  const handleReturnSubmit = async () => {
    if (!order || returnItems.length === 0) return
    setReturnSubmitting(true)
    try {
      await requestReturn({
        order_id: order.id,
        items: returnItems.map((itemId) => ({
          line_item_id: itemId,
          quantity: 1,
          reason: returnReason || "Size issue",
        })),
      })
      setReturnSuccess(true)
      setShowReturnForm(false)
    } catch (err) {
      console.error("Failed to submit return:", err)
    }
    setReturnSubmitting(false)
  }

  if (loading) {
    return (
      <div className="max-w-container mx-auto px-4 md:px-8 py-12 text-center">
        <p className="text-myntra-muted">Loading order...</p>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="max-w-container mx-auto px-4 md:px-8 py-12 text-center">
        <p className="text-myntra-muted mb-4">Order not found</p>
        <Link href="/account/orders" className="btn-primary">View Orders</Link>
      </div>
    )
  }

  const isDelivered = order.fulfillment_status === "fulfilled"
  const statusText = isDelivered ? "Delivered" :
    order.fulfillment_status === "shipped" ? "Shipped" :
    order.status === "cancelled" ? "Cancelled" : "Processing"

  const timeline = [
    { status: statusText, date: order.delivered_at || order.fulfilled_at || order.created_at },
    { status: "Confirmed", date: order.created_at },
    { status: "Placed", date: order.created_at },
  ]

  return (
    <div className="max-w-container mx-auto px-4 md:px-8 py-6">
      {/* Breadcrumb */}
      <nav className="text-xs text-myntra-muted mb-4">
        <Link href="/" className="hover:text-myntra-dark">Home</Link>
        <span className="mx-2">/</span>
        <Link href="/account/orders" className="hover:text-myntra-dark">Orders</Link>
        <span className="mx-2">/</span>
        <span className="text-myntra-dark font-semibold">#{order.display_id}</span>
      </nav>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-myntra-dark">#{order.display_id}</h1>
          <p className="text-sm text-myntra-muted">
            Placed on {new Date(order.created_at).toLocaleDateString("en-IN")}
          </p>
        </div>
        <span className={`text-sm font-semibold px-3 py-1 rounded-sm ${
          isDelivered ? "bg-green-100 text-green-700" : "bg-myntra-primary/10 text-myntra-primary"
        }`}>
          {statusText}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Items */}
          <div className="border border-myntra-border rounded-sm p-4 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider">Items</h3>
            {order.items.map((item) => (
              <div key={item.id} className="flex gap-4">
                <div className="w-20 h-24 bg-myntra-lightgray rounded-sm flex-shrink-0 overflow-hidden">
                  {item.thumbnail ? (
                    <img src={item.thumbnail} alt={item.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-myntra-muted text-xs">Img</div>
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-xs font-semibold text-myntra-muted uppercase">
                    {item.variant?.sku || "Product"}
                  </p>
                  <p className="text-sm font-semibold">{item.title}</p>
                  {item.variant?.title && (
                    <p className="text-xs text-myntra-muted">Variant: {item.variant.title}</p>
                  )}
                  <p className="text-sm font-bold mt-1">{formatPrice(item.unit_price)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold">Qty: {item.quantity}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Timeline */}
          <div className="border border-myntra-border rounded-sm p-4">
            <h3 className="text-sm font-bold uppercase tracking-wider mb-4">Order Timeline</h3>
            <div className="space-y-4">
              {timeline.map((event, i) => (
                <div key={i} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className={`w-3 h-3 rounded-full ${
                      i === 0 ? "bg-green-500" : "bg-myntra-border"
                    }`} />
                    {i < timeline.length - 1 && (
                      <div className="w-0.5 h-8 bg-myntra-border" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{event.status}</p>
                    <p className="text-xs text-myntra-muted">
                      {new Date(event.date).toLocaleDateString("en-IN")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Return button */}
          {isDelivered && !showReturnForm && !returnSuccess && (
            <button
              onClick={() => setShowReturnForm(true)}
              className="text-sm font-semibold text-myntra-primary hover:underline"
            >
              Request Return / Exchange
            </button>
          )}

          {returnSuccess && (
            <div className="bg-green-50 border border-green-200 rounded-sm p-4">
              <p className="text-sm text-green-700 font-semibold">✅ Return request submitted successfully!</p>
            </div>
          )}

          {showReturnForm && (
            <div className="border border-myntra-border rounded-sm p-4 space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider">Return Request</h3>
              <div className="space-y-3">
                {order.items.map((item) => (
                  <label key={item.id} className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      className="accent-myntra-primary"
                      checked={returnItems.includes(item.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setReturnItems([...returnItems, item.id])
                        } else {
                          setReturnItems(returnItems.filter((id) => id !== item.id))
                        }
                      }}
                    />
                    <span className="text-sm">{item.title}</span>
                  </label>
                ))}
                <select
                  className="w-full border border-myntra-border rounded-sm px-3 py-2 text-sm focus:outline-none"
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                >
                  <option value="">Select reason</option>
                  <option value="Size issue">Size issue</option>
                  <option value="Product damaged">Product damaged</option>
                  <option value="Wrong item delivered">Wrong item delivered</option>
                  <option value="Quality issue">Quality issue</option>
                  <option value="Changed mind">Changed mind</option>
                </select>
                <button
                  onClick={handleReturnSubmit}
                  disabled={returnItems.length === 0 || returnSubmitting}
                  className="bg-myntra-primary text-white font-semibold py-2 px-6 text-sm uppercase tracking-wider hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {returnSubmitting ? "Submitting..." : "Submit Request"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Order Summary Sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-[88px] border border-myntra-border rounded-sm p-6 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider">Order Details</h3>

            {order.shipping_address && (
              <div>
                <h4 className="text-xs font-semibold text-myntra-muted uppercase mb-2">Shipping Address</h4>
                <p className="text-sm">
                  {order.shipping_address.first_name} {order.shipping_address.last_name}
                </p>
                <p className="text-sm">{order.shipping_address.address_1}</p>
                {order.shipping_address.address_2 && (
                  <p className="text-sm">{order.shipping_address.address_2}</p>
                )}
                <p className="text-sm">
                  {order.shipping_address.city}, {order.shipping_address.province} - {order.shipping_address.postal_code}
                </p>
                {order.shipping_address.phone && (
                  <p className="text-sm">{order.shipping_address.phone}</p>
                )}
              </div>
            )}

            <hr className="border-myntra-border" />

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-myntra-muted">Subtotal</span>
                <span className="font-semibold">{formatPrice(order.subtotal)}</span>
              </div>
              {order.discount_total > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span>-{formatPrice(order.discount_total)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-myntra-muted">Delivery</span>
                <span className={order.shipping_total === 0 ? "text-green-600" : ""}>
                  {order.shipping_total === 0 ? "FREE" : formatPrice(order.shipping_total)}
                </span>
              </div>
            </div>

            <hr className="border-myntra-border" />

            <div className="flex justify-between text-base font-bold">
              <span>Total</span>
              <span>{formatPrice(order.total)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
