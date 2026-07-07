import { useEffect, useState } from "react"
import { defineWidgetConfig } from "@medusajs/admin-sdk"

// Dashboard Widget — Shows analytics overview on the Orders list page.
// v2 has no dedicated "dashboard" injection zone; "order.list.before" places
// this widget at the top of the Orders list, which is the closest equivalent.

function DashboardWidget() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/admin/analytics/dashboard")
      .then((res) => res.json())
      .then((data) => {
        setData(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return <div className="p-4">Loading dashboard...</div>
  if (!data) return <div className="p-4 text-red-500">Failed to load dashboard data</div>

  // total_revenue is in paise — divide by 100 for rupees.
  const revenueRupees = (data.total_revenue || 0) / 100

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Dashboard Overview</h1>
      <div className="grid grid-cols-3 gap-4 mb-8">
        <StatCard label="Total Products" value={data.total_products} color="blue" />
        <StatCard label="Total Orders" value={data.total_orders} color="green" />
        <StatCard
          label="Total Revenue"
          value={`₹${revenueRupees.toLocaleString("en-IN")}`}
          color="orange"
        />
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <h2 className="text-lg font-semibold mb-4">Recent Orders</h2>
        {(data.recent_orders || []).length > 0 ? (
          <div className="space-y-3">
            {(data.recent_orders || []).map((order: any) => (
              <div
                key={order.id}
                className="flex justify-between items-center text-sm"
              >
                <div>
                  <span className="font-medium">#{order.display_id}</span>
                  <span className="ml-3 text-gray-500 capitalize">
                    {order.status}
                  </span>
                </div>
                <span className="font-medium">
                  ₹{((order.total || 0) / 100).toLocaleString("en-IN")}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">No orders yet.</p>
        )}
      </div>
    </div>
  )
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string
  value: string | number
  color: string
}) {
  const colors: Record<string, string> = {
    blue: "bg-blue-50 border-blue-200 text-blue-700",
    green: "bg-green-50 border-green-200 text-green-700",
    purple: "bg-purple-50 border-purple-200 text-purple-700",
    orange: "bg-orange-50 border-orange-200 text-orange-700",
  }

  return (
    <div className={`rounded-lg border p-4 ${colors[color] || colors.blue}`}>
      <div className="text-sm opacity-75">{label}</div>
      <div className="text-2xl font-bold mt-1">{value}</div>
    </div>
  )
}

export const config = defineWidgetConfig({ zone: "order.list.before" })
export default DashboardWidget
