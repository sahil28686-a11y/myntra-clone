import React, { useState, useEffect } from "react"
import { defineRouteConfig } from "@medusajs/admin-sdk"

export const config = defineRouteConfig({ label: "Discounts" })

export default function DiscountsPage() {
  const [promotions, setPromotions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    code: "",
    type: "standard" as "standard" | "buyget",
    value: 0,
    description: "",
    limit: 0,
  })

  useEffect(() => {
    fetchPromotions()
  }, [page])

  const fetchPromotions = async () => {
    setLoading(true)
    try {
      const limit = 20
      const offset = (page - 1) * limit
      const res = await fetch(`/admin/promotions?limit=${limit}&offset=${offset}`)
      const data = await res.json()
      // v2 AdminPromotionListResponse = PaginatedResponse<{ promotions }>
      setPromotions(data.promotions || [])
      const count = data.count ?? 0
      setTotalPages(Math.ceil(count / limit) || 1)
    } catch (err) {
      console.error("Failed to fetch promotions", err)
    }
    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      // AdminCreatePromotion requires: code, type, application_method
      // application_method requires: type, target_type, value
      const payload: Record<string, any> = {
        code: formData.code,
        type: formData.type,
        status: "active",
        application_method: {
          type: formData.type === "buyget" ? "fixed" : "percentage",
          target_type: "items",
          value: formData.value,
          currency_code: "inr",
          allocation: "each",
        },
      }
      if (formData.description) {
        payload.application_method.description = formData.description
      }
      if (formData.limit > 0) {
        payload.limit = formData.limit
      }

      const res = await fetch("/admin/promotions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        setShowForm(false)
        setFormData({ code: "", type: "standard", value: 0, description: "", limit: 0 })
        fetchPromotions()
      } else {
        const errData = await res.json().catch(() => ({}))
        console.error("Failed to create promotion:", errData)
      }
    } catch (err) {
      console.error("Failed to create promotion", err)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this promotion?")) return
    try {
      await fetch(`/admin/promotions/${id}`, { method: "DELETE" })
      fetchPromotions()
    } catch (err) {
      console.error("Failed to delete promotion", err)
    }
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Promotions</h1>
        <button
          onClick={() => setShowForm(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
        >
          Create Promotion
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg">
            <h2 className="text-xl font-semibold mb-4">New Promotion</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Code *</label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className="w-full border rounded px-3 py-2"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as "standard" | "buyget" })}
                    className="w-full border rounded px-3 py-2"
                  >
                    <option value="standard">Standard</option>
                    <option value="buyget">Buy X Get Y</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Value</label>
                  <input
                    type="number"
                    value={formData.value}
                    onChange={(e) => setFormData({ ...formData, value: Number(e.target.value) })}
                    className="w-full border rounded px-3 py-2"
                    min={0}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Usage Limit (0 = unlimited)</label>
                <input
                  type="number"
                  value={formData.limit}
                  onChange={(e) => setFormData({ ...formData, limit: Number(e.target.value) })}
                  className="w-full border rounded px-3 py-2"
                  min={0}
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 border rounded text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-8 text-gray-500">Loading...</div>
      ) : (
        <>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Code</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Type</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Status</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Auto</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Created</th>
                  <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {promotions.map((promo) => (
                  <tr key={promo.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono font-medium">{promo.code || "-"}</td>
                    <td className="px-4 py-3 text-sm capitalize">{promo.type || "-"}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs ${
                        promo.status === "active" ? "bg-green-100 text-green-700" :
                        promo.status === "draft" ? "bg-yellow-100 text-yellow-700" :
                        "bg-red-100 text-red-700"
                      }`}>
                        {promo.status || "unknown"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {promo.is_automatic ? "Yes" : "No"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {promo.created_at ? new Date(promo.created_at).toLocaleDateString("en-IN") : "-"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleDelete(promo.id)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Delete
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
        </>
      )}
    </div>
  )
}
