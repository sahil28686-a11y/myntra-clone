"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import {
  formatPrice,
  checkPincode,
  getCart,
  setCartShippingAddress,
  getShippingOptions,
  setCartShippingMethod,
  createPaymentSession,
  setPaymentSession,
  completeCart,
} from "@/lib/medusa"
import type { MedusaCart, MedusaAddress } from "@/lib/medusa"

type CheckoutStep = "address" | "shipping" | "payment" | "success"

export default function CheckoutPage() {
  const [step, setStep] = useState<CheckoutStep>("address")
  const [cart, setCart] = useState<MedusaCart | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [orderId, setOrderId] = useState<string | null>(null)

  // Address form
  const [address, setAddress] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    email: "",
    address_1: "",
    address_2: "",
    city: "",
    province: "",
    postal_code: "",
    country_code: "IN",
  })
  const [pincode, setPincode] = useState("")
  const [pincodeResult, setPincodeResult] = useState<{ is_serviceable: boolean; estimated_days: number } | null>(null)

  // Shipping
  const [shippingOptions, setShippingOptions] = useState<any[]>([])
  const [selectedShipping, setSelectedShipping] = useState<string | null>(null)

  // Payment
  const [selectedPayment, setSelectedPayment] = useState<string>("razorpay")

  // Load cart on mount
  useEffect(() => {
    async function loadCart() {
      try {
        const cartId = localStorage.getItem("cart_id")
        if (cartId) {
          const c = await getCart(cartId)
          setCart(c)
          // Pre-fill address if exists
          if (c.shipping_address) {
            setAddress({
              first_name: c.shipping_address.first_name || "",
              last_name: c.shipping_address.last_name || "",
              phone: c.shipping_address.phone || "",
              email: "",
              address_1: c.shipping_address.address_1 || "",
              address_2: c.shipping_address.address_2 || "",
              city: c.shipping_address.city || "",
              province: c.shipping_address.province || "",
              postal_code: c.shipping_address.postal_code || "",
              country_code: c.shipping_address.country_code || "IN",
            })
          }
        }
      } catch (err) {
        console.error("Failed to load cart:", err)
      }
      setLoading(false)
    }
    loadCart()
  }, [])

  const handleCheckPincode = async () => {
    if (!/^\d{6}$/.test(pincode)) return
    try {
      const result = await checkPincode(pincode)
      setPincodeResult(result)
      if (result.is_serviceable) {
        setAddress((prev) => ({ ...prev, postal_code: pincode }))
      }
    } catch {
      setPincodeResult({ is_serviceable: false, estimated_days: 0 })
    }
  }

  const handleAddressSubmit = async () => {
    if (!cart) return
    setSubmitting(true)
    try {
      const updated = await setCartShippingAddress(cart.id, {
        first_name: address.first_name,
        last_name: address.last_name,
        phone: address.phone,
        address_1: address.address_1,
        address_2: address.address_2,
        city: address.city,
        province: address.province,
        postal_code: address.postal_code,
        country_code: address.country_code,
      })
      setCart(updated)

      // Load shipping options
      const options = await getShippingOptions(cart.id)
      setShippingOptions(options)
      if (options.length > 0) {
        setSelectedShipping(options[0].id)
      }
      setStep("shipping")
    } catch (err) {
      console.error("Failed to set address:", err)
    }
    setSubmitting(false)
  }

  const handleShippingSubmit = async () => {
    if (!cart || !selectedShipping) return
    setSubmitting(true)
    try {
      const updated = await setCartShippingMethod(cart.id, selectedShipping)
      setCart(updated)

      // Create payment sessions
      const withSessions = await createPaymentSession(cart.id)
      setCart(withSessions)
      setStep("payment")
    } catch (err) {
      console.error("Failed to set shipping:", err)
    }
    setSubmitting(false)
  }

  const handlePaymentSubmit = async () => {
    if (!cart) return
    setSubmitting(true)
    try {
      // Set payment session
      const providerId = selectedPayment === "razorpay" ? "razorpay" : "manual"
      await setPaymentSession(cart.id, providerId)

      // Complete the cart (place order)
      const result = await completeCart(cart.id)
      if (result.type === "order") {
        setOrderId(result.data.display_id || result.data.id)
        localStorage.removeItem("cart_id")
        setStep("success")
      }
    } catch (err) {
      console.error("Failed to place order:", err)
    }
    setSubmitting(false)
  }

  if (loading) {
    return (
      <div className="max-w-container mx-auto px-4 md:px-8 py-12 text-center">
        <p className="text-myntra-muted">Loading checkout...</p>
      </div>
    )
  }

  const subtotal = cart?.subtotal || 0
  const delivery = cart?.shipping_total || (subtotal > 4999 ? 0 : 99)
  const total = cart?.total || (subtotal + delivery)

  return (
    <div className="max-w-container mx-auto px-4 md:px-8 py-6">
      {/* Steps indicator */}
      <div className="flex items-center justify-center gap-4 mb-8">
        {["address", "shipping", "payment"].map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                step === s
                  ? "bg-myntra-primary text-white"
                  : ["address", "shipping", "payment"].indexOf(step) > i
                  ? "bg-green-500 text-white"
                  : "bg-myntra-lightgray text-myntra-muted"
              }`}
            >
              {["address", "shipping", "payment"].indexOf(step) > i ? "✓" : i + 1}
            </div>
            <span className={`text-sm font-semibold hidden md:block ${step === s ? "text-myntra-dark" : "text-myntra-muted"}`}>
              {s === "address" ? "Address" : s === "shipping" ? "Shipping" : "Payment"}
            </span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main content */}
        <div className="lg:col-span-2">
          {step === "address" && (
            <div className="space-y-6">
              <h2 className="text-lg font-bold uppercase tracking-wider">Shipping Address</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="First Name"
                  value={address.first_name}
                  onChange={(e) => setAddress({ ...address, first_name: e.target.value })}
                  className="border border-myntra-border rounded-sm px-4 py-3 text-sm focus:outline-none focus:border-myntra-dark"
                />
                <input
                  type="text"
                  placeholder="Last Name"
                  value={address.last_name}
                  onChange={(e) => setAddress({ ...address, last_name: e.target.value })}
                  className="border border-myntra-border rounded-sm px-4 py-3 text-sm focus:outline-none focus:border-myntra-dark"
                />
                <input
                  type="tel"
                  placeholder="Phone Number"
                  value={address.phone}
                  onChange={(e) => setAddress({ ...address, phone: e.target.value })}
                  className="border border-myntra-border rounded-sm px-4 py-3 text-sm focus:outline-none focus:border-myntra-dark"
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={address.email}
                  onChange={(e) => setAddress({ ...address, email: e.target.value })}
                  className="border border-myntra-border rounded-sm px-4 py-3 text-sm focus:outline-none focus:border-myntra-dark"
                />
                <input
                  type="text"
                  placeholder="Address Line 1"
                  value={address.address_1}
                  onChange={(e) => setAddress({ ...address, address_1: e.target.value })}
                  className="border border-myntra-border rounded-sm px-4 py-3 text-sm focus:outline-none focus:border-myntra-dark col-span-2"
                />
                <input
                  type="text"
                  placeholder="Address Line 2 (Optional)"
                  value={address.address_2}
                  onChange={(e) => setAddress({ ...address, address_2: e.target.value })}
                  className="border border-myntra-border rounded-sm px-4 py-3 text-sm focus:outline-none focus:border-myntra-dark col-span-2"
                />
                <input
                  type="text"
                  placeholder="City"
                  value={address.city}
                  onChange={(e) => setAddress({ ...address, city: e.target.value })}
                  className="border border-myntra-border rounded-sm px-4 py-3 text-sm focus:outline-none focus:border-myntra-dark"
                />
                <input
                  type="text"
                  placeholder="State"
                  value={address.province}
                  onChange={(e) => setAddress({ ...address, province: e.target.value })}
                  className="border border-myntra-border rounded-sm px-4 py-3 text-sm focus:outline-none focus:border-myntra-dark"
                />
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Pincode"
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    className="flex-1 border border-myntra-border rounded-sm px-4 py-3 text-sm focus:outline-none focus:border-myntra-dark"
                    maxLength={6}
                  />
                  <button
                    onClick={handleCheckPincode}
                    disabled={pincode.length !== 6}
                    className="bg-myntra-dark text-white px-4 py-3 text-sm font-semibold rounded-sm disabled:opacity-50"
                  >
                    Check
                  </button>
                </div>
                {pincodeResult && (
                  <p className={`text-sm col-span-2 ${pincodeResult.is_serviceable ? "text-green-600" : "text-red-600"}`}>
                    {pincodeResult.is_serviceable
                      ? `✅ Delivery in ${pincodeResult.estimated_days} days`
                      : "❌ Not serviceable"}
                  </p>
                )}
              </div>
              <button
                onClick={handleAddressSubmit}
                disabled={submitting}
                className="bg-myntra-primary text-white font-semibold py-3 px-8 uppercase tracking-wider text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {submitting ? "Saving..." : "Continue to Shipping"}
              </button>
            </div>
          )}

          {step === "shipping" && (
            <div className="space-y-6">
              <h2 className="text-lg font-bold uppercase tracking-wider">Shipping Method</h2>
              {shippingOptions.length > 0 ? (
                <div className="space-y-3">
                  {shippingOptions.map((method: any) => (
                    <label
                      key={method.id}
                      className="flex items-center gap-4 p-4 border border-myntra-border rounded-sm cursor-pointer hover:border-myntra-dark"
                    >
                      <input
                        type="radio"
                        name="shipping"
                        className="accent-myntra-primary"
                        checked={selectedShipping === method.id}
                        onChange={() => setSelectedShipping(method.id)}
                      />
                      <div className="flex-1">
                        <p className="text-sm font-semibold">{method.name}</p>
                        {method.requirements?.map((req: any) => (
                          <p key={req.id} className="text-xs text-myntra-muted">{req.description}</p>
                        ))}
                      </div>
                      <span className="text-sm font-semibold">
                        {method.amount === 0 ? "FREE" : formatPrice(method.amount)}
                      </span>
                    </label>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {[
                    { name: "Standard Delivery", eta: "5-7 business days", price: 49 },
                    { name: "Express Delivery", eta: "2-3 business days", price: 99 },
                    { name: "Free Delivery", eta: "7-10 business days", price: 0 },
                  ].map((method) => (
                    <label key={method.name} className="flex items-center gap-4 p-4 border border-myntra-border rounded-sm cursor-pointer hover:border-myntra-dark">
                      <input type="radio" name="shipping" className="accent-myntra-primary" defaultChecked={method.price === 0} />
                      <div className="flex-1">
                        <p className="text-sm font-semibold">{method.name}</p>
                        <p className="text-xs text-myntra-muted">{method.eta}</p>
                      </div>
                      <span className="text-sm font-semibold">
                        {method.price === 0 ? "FREE" : formatPrice(method.price)}
                      </span>
                    </label>
                  ))}
                </div>
              )}
              <button
                onClick={handleShippingSubmit}
                disabled={submitting}
                className="bg-myntra-primary text-white font-semibold py-3 px-8 uppercase tracking-wider text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {submitting ? "Saving..." : "Continue to Payment"}
              </button>
            </div>
          )}

          {step === "payment" && (
            <div className="space-y-6">
              <h2 className="text-lg font-bold uppercase tracking-wider">Payment Method</h2>
              <div className="space-y-3">
                <label className="flex items-center gap-4 p-4 border border-myntra-border rounded-sm cursor-pointer hover:border-myntra-dark">
                  <input
                    type="radio"
                    name="payment"
                    className="accent-myntra-primary"
                    checked={selectedPayment === "razorpay"}
                    onChange={() => setSelectedPayment("razorpay")}
                  />
                  <div>
                    <p className="text-sm font-semibold">Razorpay</p>
                    <p className="text-xs text-myntra-muted">Credit/Debit Card, UPI, Net Banking</p>
                  </div>
                </label>
                <label className="flex items-center gap-4 p-4 border border-myntra-border rounded-sm cursor-pointer hover:border-myntra-dark">
                  <input
                    type="radio"
                    name="payment"
                    className="accent-myntra-primary"
                    checked={selectedPayment === "cod"}
                    onChange={() => setSelectedPayment("cod")}
                  />
                  <div>
                    <p className="text-sm font-semibold">Cash on Delivery</p>
                    <p className="text-xs text-myntra-muted">Pay when you receive</p>
                  </div>
                </label>
              </div>
              <button
                onClick={handlePaymentSubmit}
                disabled={submitting}
                className="bg-myntra-primary text-white font-semibold py-3 px-8 uppercase tracking-wider text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {submitting ? "Processing..." : "Place Order"}
              </button>
            </div>
          )}

          {step === "success" && (
            <div className="text-center py-12 space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <span className="text-3xl text-green-600">✓</span>
              </div>
              <h2 className="text-2xl font-bold text-myntra-dark">Order Placed Successfully!</h2>
              <p className="text-myntra-muted">Your order will be delivered in 5-7 business days.</p>
              {orderId && (
                <p className="text-sm text-myntra-muted">Order ID: #{orderId}</p>
              )}
              <div className="flex gap-4 justify-center pt-4">
                <Link href="/account/orders" className="btn-primary">View Orders</Link>
                <Link href="/" className="btn-secondary">Continue Shopping</Link>
              </div>
            </div>
          )}
        </div>

        {/* Order Summary Sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-[88px] border border-myntra-border rounded-sm p-6 space-y-4">
            <h3 className="text-lg font-bold uppercase tracking-wider">Order Summary</h3>
            {cart?.items && cart.items.length > 0 ? (
              <div className="space-y-3">
                {cart.items.map((item: any) => (
                  <div key={item.id} className="flex gap-3">
                    <div className="w-12 h-16 bg-myntra-lightgray rounded-sm flex-shrink-0 overflow-hidden">
                      {item.thumbnail ? (
                        <img src={item.thumbnail} alt={item.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-myntra-muted text-xs">Img</div>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{item.title}</p>
                      <p className="text-xs text-myntra-muted">Qty: {item.quantity}</p>
                      <p className="text-sm font-bold mt-1">{formatPrice(item.unit_price)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex gap-3">
                  <div className="w-12 h-16 bg-myntra-lightgray rounded-sm flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold">Classic Fit Polo T-Shirt</p>
                    <p className="text-xs text-myntra-muted">Qty: 1</p>
                    <p className="text-sm font-bold mt-1">{formatPrice(1299)}</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-12 h-16 bg-myntra-lightgray rounded-sm flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold">Slim Fit Jeans</p>
                    <p className="text-xs text-myntra-muted">Qty: 1</p>
                    <p className="text-sm font-bold mt-1">{formatPrice(1999)}</p>
                  </div>
                </div>
              </div>
            )}
            <hr className="border-myntra-border" />
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-myntra-muted">Subtotal</span>
                <span className="font-semibold">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-myntra-muted">Delivery</span>
                <span>{delivery === 0 ? "FREE" : formatPrice(delivery)}</span>
              </div>
            </div>
            <hr className="border-myntra-border" />
            <div className="flex justify-between text-base font-bold">
              <span>Total</span>
              <span>{formatPrice(total)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
