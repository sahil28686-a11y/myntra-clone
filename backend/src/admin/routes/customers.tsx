import React, { useState, useEffect } from "react"

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState("")
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null)

  useEffect(() => {
    fetchCustomers()
  }, [page, search])

  const fetchCustomers = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" })
      if (search) params.set("q", search)
      const res = await fetch(`/admin/customers?${params}`)
      const data = await res.json()
      setCustomers(data.customers || [])
      setTotalPages(data.total_pages || 1)
    } catch (err) {
      console.error("Failed to fetch customers", err)
    }
    setLoading(false)
  }

  const viewCustomer = async (id: string) => {
    try {
      const res = await fetch(`/admin/customers/${id}`)
      const data = await res.json()
      setSelectedCustomer(data.customer)
    } catch (err) {
      console.error("Failed to fetch customer", err)
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Customers</h1>

      <div className="mb-6">
        <input
          type="text"
          placeholder="Search customers by name or email..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          className="w-full max-w-md border rounded px-3 py-2"
        />
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
                    <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Name</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Email</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Phone</th>
                    <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">Orders</th>
                    <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {customers.map((customer) => (
                    <tr key={customer.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        {customer.first_name} {customer.last_name}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">{customer.email}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{customer.phone || "-"}</td>
                      <td className="px-4 py-3 text-right">{customer.orders?.length || 0}</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => viewCustomer(customer.id)}
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

          {selectedCustomer && (
            <div className="bg-white rounded-lg shadow p-4">
              <h2 className="text-lg font-semibold mb-4">Customer Details</h2>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-gray-500">Name:</span>
                  <span className="ml-2">{selectedCustomer.first_name} {selectedCustomer.last_name}</span>
                </div>
                <div>
                  <span className="text-gray-500">Email:</span>
                  <span className="ml-2">{selectedCustomer.email}</span>
                </div>
                <div>
                  <span className="text-gray-500">Phone:</span>
                  <span className="ml-2">{selectedCustomer.phone || "-"}</span>
                </div>
                <div>
                  <span className="text-gray-500">Orders:</span>
                  <span className="ml-2">{selectedCustomer.orders?.length || 0}</span>
                </div>
                <div>
                  <span className="text-gray-500">Joined:</span>
                  <span className="ml-2">{new Date(selectedCustomer.created_at).toLocaleDateString()}</span>
                </div>

                {selectedCustomer.orders?.length > 0 && (
                  <div className="pt-3 border-t">
                    <h3 className="font-medium mb-2">Recent Orders</h3>
                    <div className="space-y-2">
                      {selectedCustomer.orders.slice(0, 5).map((order: any) => (
                        <div key={order.id} className="text-xs text-gray-600">
                          #{order.display_id || order.id.slice(0, 8)} — ₹{(order.total || 0).toLocaleString()}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
