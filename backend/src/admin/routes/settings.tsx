import React, { useState, useEffect } from "react"

export default function SettingsPage() {
  const [store, setStore] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    brand_name: "",
    logo_url: "",
    theme_id: "light",
  })
  const [saveMessage, setSaveMessage] = useState("")

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const res = await fetch("/admin/settings")
      const data = await res.json()
      setStore(data.store)
      setFormData({
        name: data.store.name || "",
        brand_name: data.store.brand_name || "",
        logo_url: data.store.logo_url || "",
        theme_id: data.store.theme_id || "light",
      })
    } catch (err) {
      console.error("Failed to fetch settings", err)
    }
    setLoading(false)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setSaveMessage("")
    try {
      const res = await fetch("/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })
      if (res.ok) {
        setSaveMessage("Settings saved successfully!")
      } else {
        setSaveMessage("Failed to save settings")
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Brand Name</label>
              <input
                type="text"
                value={formData.brand_name}
                onChange={(e) => setFormData({ ...formData, brand_name: e.target.value })}
                className="w-full border rounded px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Logo URL</label>
              <input
                type="text"
                value={formData.logo_url}
                onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                className="w-full border rounded px-3 py-2"
                placeholder="https://example.com/logo.png"
              />
              {formData.logo_url && (
                <img
                  src={formData.logo_url}
                  alt="Logo preview"
                  className="mt-2 h-12 object-contain border rounded"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none" }}
                />
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Theme</label>
              <select
                value={formData.theme_id}
                onChange={(e) => setFormData({ ...formData, theme_id: e.target.value })}
                className="w-full border rounded px-3 py-2"
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="minimal">Minimal</option>
                <option value="vibrant">Vibrant</option>
              </select>
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
                <span className="ml-2 font-mono">{store?.id}</span>
              </div>
              <div>
                <span className="text-gray-500">Default Currency:</span>
                <span className="ml-2">INR</span>
              </div>
              <div>
                <span className="text-gray-500">Default Region:</span>
                <span className="ml-2">India</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
