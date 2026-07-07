import React, { useState, useEffect } from "react"
import { defineRouteConfig } from "@medusajs/admin-sdk"

export const config = defineRouteConfig({ label: "Orders" })

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedOrder, setSelectedOrder] = useState<any>(null)

  useEffect(() => {
    fetchOrders()
  }, [page, statusFilter])

  const fetchOrders = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ limit: "20", offset: String((page - 1) * 20) })
      if (statusFilter !== "all") params.set("status", statusFilter)
      const res = await fetch(`/admin/orders?${params}`)
      const data = await res.json()
      setOrders(data.orders || [])
      setTotalPages(Math.ceil((data.count || 0) / 20) || 1)
    } catch (err) {
      console.error("Failed to fetch orders", err)
    }
    setLoading(false)
  }

  const viewOrder = async (id: string) => {
    try {
      const res = await fetch(`/admin/orders/${id}`)
      const data = await res.json()
      setSelectedOrder(data.order)
    } catch (err) {
      console.error("Failed to fetch order", err)
    }
  }

  const updateStatus = async (id: string, status: string) => {
    try {
      await fetch(`/admin/orders/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
      fetchOrders()
      if (selectedOrder?.id === id) viewOrder(id)
    } catch (err) {
      console.error("Failed to update status", err)
    }
  }

  const statuses = ["all", "pending", "completed", "processing", "canceled", "requires_action"]

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Orders</h1>

      <div className="flex space-x-2 mb-6">
        {statuses.map((s) => (
          <button
            key={s}
            onClick={() => { setStatusFilter(s); setPage(1) }}
            className={`px-3 py-1 rounded text-sm ${
              statusFilter === s
                ? "bg-indigo-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-500">Loading...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Order ID</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Status</th>
                    <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">Total</th>
                    <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">Date</th>
                    <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-mono">
                        {order.display_id || order.id.slice(0, 12)}...
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded text-xs ${
                          order.status === "completed" ? "bg-green-100 text-green-700" :
                          order.status === "processing" ? "bg-blue-100 text-blue-700" :
                          order.status === "canceled" ? "bg-red-100 text-red-700" :
                          "bg-yellow-100 text-yellow-700"
                        }`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-medium">
                        ₹{(order.total || 0).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-gray-500">
                        {new Date(order.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => viewOrder(order.id)}
                          className="text-indigo-600 hover:text-indigo-800 text-sm"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-center items-center space-x-4 mt-4">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="px-3 py-1 border rounded disabled:opacity-50"
              >
                Previous
              </button>
              <span className="text-sm text-gray-600">Page {page} of {totalPages}</span>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="px-3 py-1 border rounded disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>

          {selectedOrder && (
            <div className="bg-white rounded-lg shadow p-4">
              <h2 className="text-lg font-semibold mb-4">Order Details</h2>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-gray-500">ID:</span>
                  <span className="ml-2 font-mono">{selectedOrder.id.slice(0, 16)}...</span>
                </div>
                <div>
                  <span className="text-gray-500">Status:</span>
                  <span className="ml-2 capitalize">{selectedOrder.status}</span>
                </div>
                <div>
                  <span className="text-gray-500">Total:</span>
                  <span className="ml-2 font-medium">₹{(selectedOrder.total || 0).toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-gray-500">Items:</span>
                  <span className="ml-2">{selectedOrder.items?.length || 0}</span>
                </div>
                <div>
                  <span className="text-gray-500">Date:</span>
                  <span className="ml-2">{new Date(selectedOrder.created_at).toLocaleString()}</span>
                </div>

                <div className="pt-3 border-t">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Update Status</label>
                  <select
                    value={selectedOrder.status}
                    onChange={(e) => updateStatus(selectedOrder.id, e.target.value)}
                    className="w-full border rounded px-2 py-1 text-sm"
                  >
                    <option value="pending">Pending</option>
                    <option value="processing">Processing</option>
                    <option value="completed">Completed</option>
                    <option value="canceled">Canceled</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
