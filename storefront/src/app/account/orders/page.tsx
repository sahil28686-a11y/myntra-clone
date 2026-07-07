"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { getOrders, formatPrice } from "@/lib/medusa"
import type { MedusaOrder } from "@/lib/medusa"

export default function OrdersPage() {
  const router = useRouter()
  const [orders, setOrders] = useState<MedusaOrder[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const ords = await getOrders()
        setOrders(ords)
      } catch (err) {
        console.error("Not authenticated or load failed:", err)
        router.push("/account")
        return
      }
      setLoading(false)
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="max-w-container mx-auto px-4 md:px-8 py-12 text-center">
        <p className="text-myntra-muted">Loading orders...</p>
      </div>
    )
  }

  const getStatusDisplay = (order: MedusaOrder) => {
    if (order.status === "cancelled") return { text: "Cancelled", color: "text-red-500" }
    if (order.fulfillment_status === "fulfilled") return { text: "Delivered", color: "text-green-600" }
    if (order.fulfillment_status === "shipped") return { text: "Shipped", color: "text-myntra-primary" }
    return { text: "Processing", color: "text-myntra-primary" }
  }

  return (
    <div className="max-w-container mx-auto px-4 md:px-8 py-6">
      <h1 className="text-xl font-bold text-myntra-dark mb-6">My Orders</h1>

      {orders.length > 0 ? (
        <div className="space-y-3">
          {orders.map((order) => {
            const status = getStatusDisplay(order)
            return (
              <Link
                key={order.id}
                href={`/account/orders/${order.id}`}
                className="flex items-center justify-between p-4 border border-myntra-border rounded-sm hover:border-myntra-dark transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-16 h-20 bg-myntra-lightgray rounded-sm overflow-hidden">
                    {order.items[0]?.thumbnail ? (
                      <img src={order.items[0].thumbnail} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-myntra-muted text-xs">Img</div>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">#{order.display_id}</p>
                    <p className="text-xs text-myntra-muted">
                      {new Date(order.created_at).toLocaleDateString("en-IN")}
                    </p>
                    <p className="text-xs text-myntra-muted">{order.items.length} item(s)</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">{formatPrice(order.total)}</p>
                  <span className={`text-xs font-semibold ${status.color}`}>
                    {status.text}
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-12 border border-myntra-border rounded-sm">
          <p className="text-myntra-muted mb-4">No orders yet</p>
          <Link href="/products" className="btn-primary inline-block">
            Start Shopping
          </Link>
        </div>
      )}
    </div>
  )
}
