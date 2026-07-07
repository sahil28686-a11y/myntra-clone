import { defineWidgetConfig } from "@medusajs/admin-sdk"

// Dashboard Widget — Shows analytics overview
export default defineWidgetConfig({
  name: "dashboard-overview",
  version: "1.0.0",
  path: "/dashboard",
  component: DashboardWidget,
})

function DashboardWidget() {
  const [data, setData] = React.useState<any>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
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

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Dashboard Overview</h1>
      <div className="grid grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Products" value={data.total_products} color="blue" />
        <StatCard label="Total Orders" value={data.total_orders} color="green" />
        <StatCard label="Total Customers" value={data.total_customers} color="purple" />
        <StatCard label="Total Revenue" value={`₹${(data.total_revenue || 0).toLocaleString()}`} color="orange" />
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold mb-4">Orders by Status</h2>
          <div className="space-y-2">
            {Object.entries(data.orders_by_status || {}).map(([status, count]: [string, any]) => (
              <div key={status} className="flex justify-between items-center">
                <span className="capitalize">{status}</span>
                <span className="font-medium">{count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold mb-4">Recent Orders</h2>
          <div className="space-y-3">
            {(data.recent_orders || []).slice(0, 5).map((order: any) => (
              <div key={order.id} className="flex justify-between items-center text-sm">
                <span className="text-gray-600 truncate max-w-[200px]">
                  {order.id.slice(0, 12)}...
                </span>
                <span className="font-medium">₹{(order.total || 0).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, color }: { label: string; value: string | number; color: string }) {
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
