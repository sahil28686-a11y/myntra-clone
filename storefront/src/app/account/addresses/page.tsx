"use client"

import { useState, useEffect } from "react"
import { HiOutlinePlus, HiOutlinePencil, HiOutlineTrash } from "react-icons/hi"
import { getCustomer, addCustomerAddress, updateCustomerAddress, deleteCustomerAddress } from "@/lib/medusa"
import type { MedusaAddress } from "@/lib/medusa"

export default function AddressesPage() {
  const [addresses, setAddresses] = useState<MedusaAddress[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    address_1: "",
    address_2: "",
    city: "",
    province: "",
    postal_code: "",
    country_code: "IN",
  })

  useEffect(() => {
    async function load() {
      try {
        const cust = await getCustomer()
        setAddresses(cust.shipping_addresses || [])
      } catch (err) {
        console.error("Failed to load addresses:", err)
      }
      setLoading(false)
    }
    load()
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      if (editingId) {
        const cust = await updateCustomerAddress(editingId, form)
        setAddresses(cust.shipping_addresses || [])
      } else {
        const cust = await addCustomerAddress(form)
        setAddresses(cust.shipping_addresses || [])
      }
      setShowForm(false)
      setEditingId(null)
      setForm({ first_name: "", last_name: "", phone: "", address_1: "", address_2: "", city: "", province: "", postal_code: "", country_code: "IN" })
    } catch (err) {
      console.error("Failed to save address:", err)
    }
    setSaving(false)
  }

  const handleEdit = (address: MedusaAddress) => {
    setForm({
      first_name: address.first_name || "",
      last_name: address.last_name || "",
      phone: address.phone || "",
      address_1: address.address_1 || "",
      address_2: address.address_2 || "",
      city: address.city || "",
      province: address.province || "",
      postal_code: address.postal_code || "",
      country_code: address.country_code || "IN",
    })
    setEditingId(address.id)
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    try {
      const cust = await deleteCustomerAddress(id)
      setAddresses(cust.shipping_addresses || [])
    } catch (err) {
      console.error("Failed to delete address:", err)
    }
  }

  if (loading) {
    return (
      <div className="max-w-container mx-auto px-4 md:px-8 py-12 text-center">
        <p className="text-myntra-muted">Loading addresses...</p>
      </div>
    )
  }

  return (
    <div className="max-w-container mx-auto px-4 md:px-8 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-myntra-dark">Saved Addresses</h1>
        <button
          onClick={() => {
            setShowForm(true)
            setEditingId(null)
            setForm({ first_name: "", last_name: "", phone: "", address_1: "", address_2: "", city: "", province: "", postal_code: "", country_code: "IN" })
          }}
          className="flex items-center gap-2 bg-myntra-dark text-white px-4 py-2 text-sm font-semibold rounded-sm hover:opacity-90 transition-opacity"
        >
          <HiOutlinePlus size={16} />
          Add Address
        </button>
      </div>

      {addresses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {addresses.map((address) => (
            <div key={address.id} className="border border-myntra-border rounded-sm p-4 relative">
              <p className="text-sm font-semibold">
                {address.first_name} {address.last_name}
              </p>
              {address.phone && <p className="text-sm text-myntra-muted">{address.phone}</p>}
              <p className="text-sm text-myntra-muted mt-1">{address.address_1}</p>
              {address.address_2 && <p className="text-sm text-myntra-muted">{address.address_2}</p>}
              <p className="text-sm text-myntra-muted">
                {address.city}, {address.province} - {address.postal_code}
              </p>
              <div className="flex gap-3 mt-3">
                <button
                  onClick={() => handleEdit(address)}
                  className="flex items-center gap-1 text-xs font-semibold text-myntra-muted hover:text-myntra-dark"
                >
                  <HiOutlinePencil size={14} />
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(address.id)}
                  className="flex items-center gap-1 text-xs font-semibold text-red-500 hover:text-red-600"
                >
                  <HiOutlineTrash size={14} />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 border border-myntra-border rounded-sm">
          <p className="text-myntra-muted">No saved addresses</p>
        </div>
      )}

      {/* Address Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-sm p-6 w-full max-w-lg space-y-4">
            <h2 className="text-lg font-bold">{editingId ? "Edit Address" : "Add Address"}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="First Name"
                value={form.first_name}
                onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                className="border border-myntra-border rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-myntra-dark"
                required
              />
              <input
                type="text"
                placeholder="Last Name"
                value={form.last_name}
                onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                className="border border-myntra-border rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-myntra-dark"
              />
              <input
                type="tel"
                placeholder="Phone Number"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="border border-myntra-border rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-myntra-dark col-span-2"
              />
              <input
                type="text"
                placeholder="Address Line 1"
                value={form.address_1}
                onChange={(e) => setForm({ ...form, address_1: e.target.value })}
                className="border border-myntra-border rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-myntra-dark col-span-2"
              />
              <input
                type="text"
                placeholder="Address Line 2 (Optional)"
                value={form.address_2}
                onChange={(e) => setForm({ ...form, address_2: e.target.value })}
                className="border border-myntra-border rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-myntra-dark col-span-2"
              />
              <input
                type="text"
                placeholder="City"
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                className="border border-myntra-border rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-myntra-dark"
              />
              <input
                type="text"
                placeholder="State"
                value={form.province}
                onChange={(e) => setForm({ ...form, province: e.target.value })}
                className="border border-myntra-border rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-myntra-dark"
              />
              <input
                type="text"
                placeholder="Pincode"
                value={form.postal_code}
                onChange={(e) => setForm({ ...form, postal_code: e.target.value.replace(/\D/g, "").slice(0, 6) })}
                className="border border-myntra-border rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-myntra-dark"
                maxLength={6}
              />
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => { setShowForm(false); setEditingId(null) }}
                className="px-4 py-2 text-sm font-semibold border border-myntra-border rounded-sm hover:bg-myntra-lightgray"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 text-sm font-semibold bg-myntra-primary text-white rounded-sm hover:opacity-90 disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
