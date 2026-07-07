"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { HiOutlineUser, HiOutlineShoppingBag, HiOutlineHeart, HiOutlineLocationMarker, HiOutlineLogout } from "react-icons/hi"
import { getCustomer, getOrders, formatPrice, logoutCustomer } from "@/lib/medusa"
import type { MedusaCustomer, MedusaOrder } from "@/lib/medusa"

const sidebarLinks = [
  { name: "Dashboard", href: "/account/dashboard", icon: HiOutlineUser },
  { name: "Orders", href: "/account/orders", icon: HiOutlineShoppingBag },
  { name: "Wishlist", href: "/account/wishlist", icon: HiOutlineHeart },
  { name: "Addresses", href: "/account/addresses", icon: HiOutlineLocationMarker },
]

export default function DashboardPage() {
  const router = useRouter()
  const [customer, setCustomer] = useState<MedusaCustomer | null>(null)
  const [orders, setOrders] = useState<MedusaOrder[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const cust = await getCustomer()
        setCustomer(cust)
        const ords = await getOrders()
        setOrders(ords)
      } catch (err) {
        console.error("Failed to load dashboard:", err)
      }
      setLoading(false)
    }
    load()
  }, [])

  const handleLogout = async () => {
    try {
      await logoutCustomer()
    } catch (err) {
      console.error("Failed to logout:", err)
    }
    router.push("/account")
  }

  if (loading) {
    return (
      <div className="max-w-container mx-auto px-4 md:px-8 py-12 text-center">
        <p className="text-myntra-muted">Loading dashboard...</p>
      </div>
    )
  }

  const recentOrders = orders.slice(0, 3)
  const inTransit = orders.filter((o) => o.fulfillment_status === "not_fulfilled" && o.status !== "cancelled").length

  return (
    <div className="max-w-container mx-auto px-4 md:px-8 py-6">
      <div className="flex gap-8">
        {/* Sidebar */}
        <aside className="hidden md:block w-56 flex-shrink-0">
          <div className="sticky top-[88px] space-y-1">
            {sidebarLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-sm hover:bg-myntra-lightgray transition-colors"
              >
                <link.icon size={18} />
                {link.name}
              </Link>
            ))}
            <hr className="border-myntra-border my-2" />
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-4 py-3 text-sm font-semibold text-red-500 hover:bg-red-50 rounded-sm w-full transition-colors"
            >
              <HiOutlineLogout size={18} />
              Logout
            </button>
          </div>
        </aside>

        {/* Main content */}
        <div className="flex-1">
          <h1 className="text-xl font-bold text-myntra-dark mb-6">
            Hello, {customer?.first_name || "Customer"}
          </h1>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="border border-myntra-border rounded-sm p-4">
              <p className="text-2xl font-bold text-myntra-dark">{orders.length}</p>
              <p className="text-sm text-myntra-muted">Total Orders</p>
            </div>
            <div className="border border-myntra-border rounded-sm p-4">
              <p className="text-2xl font-bold text-myntra-dark">{inTransit}</p>
              <p className="text-sm text-myntra-muted">In Transit</p>
            </div>
            <div className="border border-myntra-border rounded-sm p-4">
              <p className="text-2xl font-bold text-myntra-dark">{customer?.shipping_addresses?.length || 0}</p>
              <p className="text-sm text-myntra-muted">Saved Addresses</p>
            </div>
          </div>

          {/* Recent Orders */}
          <h2 className="text-lg font-bold text-myntra-dark mb-4">Recent Orders</h2>
          {recentOrders.length > 0 ? (
            <div className="space-y-3">
              {recentOrders.map((order) => (
                <Link
                  key={order.id}
                  href={`/account/orders/${order.id}`}
                  className="flex items-center justify-between p-4 border border-myntra-border rounded-sm hover:border-myntra-dark transition-colors"
                >
                  <div>
                    <p className="text-sm font-semibold">#{order.display_id}</p>
                    <p className="text-xs text-myntra-muted">
                      {new Date(order.created_at).toLocaleDateString("en-IN")}
                    </p>
                    <p className="text-xs text-myntra-muted">{order.items.length} item(s)</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">{formatPrice(order.total)}</p>
                    <span className={`text-xs font-semibold ${
                      order.fulfillment_status === "fulfilled" || order.status === "completed"
                        ? "text-green-600"
                        : order.status === "cancelled"
                        ? "text-red-500"
                        : "text-myntra-primary"
                    }`}>
                      {order.fulfillment_status === "fulfilled" ? "Delivered" :
                       order.fulfillment_status === "shipped" ? "Shipped" :
                       order.status === "cancelled" ? "Cancelled" :
                       "Processing"}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 border border-myntra-border rounded-sm">
              <p className="text-myntra-muted text-sm">No orders yet</p>
              <Link href="/products" className="btn-primary inline-block mt-4">
                Start Shopping
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
