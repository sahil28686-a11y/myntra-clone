import React, { useState, useEffect } from "react"
import { defineRouteConfig } from "@medusajs/admin-sdk"

export const config = defineRouteConfig({ label: "Settings" })

export default function SettingsPage() {
  const [store, setStore] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    default_currency_code: "",
  })
  const [saveMessage, setSaveMessage] = useState("")

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      // v2 AdminStoreListResponse: { stores, count, limit, offset }
      const res = await fetch("/admin/stores")
      const data = await res.json()
      const stores = data.stores || []
      const s = stores[0] || null
      setStore(s)
      if (s) {
        // Derive default currency from supported_currencies
        const defCur = (s.supported_currencies || []).find((c: any) => c.is_default)
        setFormData({
          name: s.name || "",
          default_currency_code: defCur?.currency_code || "inr",
        })
      }
    } catch (err) {
      console.error("Failed to fetch store settings", err)
    }
    setLoading(false)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!store?.id) return
    setSaving(true)
    setSaveMessage("")
    try {
      // AdminUpdateStore: { name?, supported_currencies?, ... }
      const payload: Record<string, any> = {
        name: formData.name,
        supported_currencies: [
          {
            currency_code: formData.default_currency_code,
            is_default: true,
          },
        ],
      }
      const res = await fetch(`/admin/stores/${store.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        setSaveMessage("Settings saved successfully!")
        fetchSettings()
      } else {
        const errData = await res.json().catch(() => ({}))
        setSaveMessage(errData.message || "Failed to save settings")
      }
    } catch (err) {
      setSaveMessage("Error saving settings")
    }
    setSaving(false)
  }

  if (loading) return <div className="p-6 text-center text-gray-500">Loading...</div>

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Store Settings</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">General Settings</h2>
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Store Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full border rounded px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Default Currency</label>
              <input
                type="text"
                value={formData.default_currency_code}
                onChange={(e) => setFormData({ ...formData, default_currency_code: e.target.value })}
                className="w-full border rounded px-3 py-2"
                placeholder="inr"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="bg-indigo-600 text-white px-6 py-2 rounded hover:bg-indigo-700 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Settings"}
            </button>

            {saveMessage && (
              <p className={`text-sm ${saveMessage.includes("success") ? "text-green-600" : "text-red-600"}`}>
                {saveMessage}
              </p>
            )}
          </form>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Payment Configuration</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center">
                <span>Razorpay</span>
                <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">Configured</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Cash on Delivery</span>
                <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">Enabled</span>
              </div>
              <p className="text-gray-500 mt-2">
                Razorpay keys are configured via environment variables.
                Update <code className="bg-gray-100 px-1 rounded">RAZORPAY_KEY_ID</code> and{' '}
                <code className="bg-gray-100 px-1 rounded">RAZORPAY_KEY_SECRET</code> in your .env file.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Store Info</h2>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-gray-500">Store ID:</span>
                <span className="ml-2 font-mono">{store?.id || "-"}</span>
              </div>
              <div>
                <span className="text-gray-500">Default Currency:</span>
                <span className="ml-2">{formData.default_currency_code?.toUpperCase() || "-"}</span>
              </div>
              <div>
                <span className="text-gray-500">Default Sales Channel:</span>
                <span className="ml-2 font-mono text-xs">{store?.default_sales_channel_id || "-"}</span>
              </div>
              <div>
                <span className="text-gray-500">Default Region:</span>
                <span className="ml-2 font-mono text-xs">{store?.default_region_id || "-"}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
