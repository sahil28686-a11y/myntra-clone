// API service layer — wraps Medusa client and custom endpoints
// All storefront data fetching goes through this module

import Medusa from "@medusajs/medusa-js"

const MEDUSA_URL = process.env.NEXT_PUBLIC_MEDUSA_URL || "http://localhost:9000"

// Medusa JS SDK client — lazy init to avoid build-time connection hangs
let _medusaClient: any = null
function getMedusaClient() {
  if (!_medusaClient) {
    _medusaClient = new Medusa({
      baseUrl: MEDUSA_URL,
      maxRetries: 1,
    })
  }
  return _medusaClient
}

export const medusaClient = new Proxy({} as any, {
  get(_, prop) {
    return getMedusaClient()[prop as string]
  },
})

// ---------------------------------------------------------------------------
// Generic fetch helper for custom endpoints
// ---------------------------------------------------------------------------
async function fetchAPI<T = any>(
  endpoint: string,
  options: RequestInit = {},
  timeoutMs = 5000
): Promise<T> {
  const url = `${MEDUSA_URL}${endpoint}`
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      signal: controller.signal,
      ...options,
    })
    clearTimeout(timeoutId)
    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: "An error occurred" }))
      throw new Error(error.message || `API error: ${res.status}`)
    }
    return res.json()
  } catch (err) {
    clearTimeout(timeoutId)
    throw err
  }
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface MedusaProduct {
  id: string
  title: string
  handle: string
  description: string
  thumbnail: string | null
  images: { url: string }[]
  variants: MedusaVariant[]
  options: MedusaProductOption[]
  collection: { id: string; title: string } | null
  categories: { id: string; name: string }[]
  tags: { id: string; value: string }[]
  discount?: { percent: number } | null
  created_at: string
}

export interface MedusaVariant {
  id: string
  title: string
  sku: string
  prices: { amount: number; currency_code: string }[]
  inventory_quantity: number
  options: { value: string }[]
}

export interface MedusaProductOption {
  id: string
  title: string
  values: { value: string; id: string }[]
}

export interface MedusaCollection {
  id: string
  title: string
  handle: string
  products?: MedusaProduct[]
}

export interface MedusaCategory {
  id: string
  name: string
  handle: string
  parent_category_id: string | null
  category_children: MedusaCategory[]
}

export interface MedusaCart {
  id: string
  items: MedusaLineItem[]
  region_id: string
  shipping_address: MedusaAddress | null
  shipping_methods: any[]
  payment_sessions: any[]
  payment: any
  subtotal: number
  discount_total: number
  shipping_total: number
  total: number
  gift_card_total: number
}

export interface MedusaLineItem {
  id: string
  title: string
  description: string
  thumbnail: string | null
  quantity: number
  unit_price: number
  variant: MedusaVariant
  product_title?: string
}

export interface MedusaAddress {
  id: string
  first_name: string
  last_name: string
  phone: string
  company: string
  address_1: string
  address_2: string
  city: string
  country_code: string
  province: string
  postal_code: string
}

export interface MedusaOrder {
  id: string
  display_id: number
  status: string
  fulfillment_status: string
  payment_status: string
  total: number
  subtotal: number
  shipping_total: number
  discount_total: number
  tax_total: number
  items: MedusaLineItem[]
  shipping_address: MedusaAddress
  created_at: string
  fulfilled_at: string | null
  shipped_at: string | null
  delivered_at: string | null
}

export interface MedusaCustomer {
  id: string
  email: string
  first_name: string
  last_name: string
  phone: string
  has_account: boolean
  orders: MedusaOrder[]
  shipping_addresses: MedusaAddress[]
}

// ---------------------------------------------------------------------------
// Products
// ---------------------------------------------------------------------------
export async function getProducts(params?: {
  limit?: number
  offset?: number
  category_id?: string[]
  collection_id?: string[]
  tags?: string[]
  price_from?: number
  price_to?: number
  q?: string
}): Promise<{ products: MedusaProduct[]; count: number; offset: number; limit: number }> {
  const searchParams = new URLSearchParams()
  if (params?.limit) searchParams.set("limit", String(params.limit))
  if (params?.offset) searchParams.set("offset", String(params.offset))
  if (params?.category_id?.length) params.category_id.forEach((id) => searchParams.append("category_id[]", id))
  if (params?.collection_id?.length) params.collection_id.forEach((id) => searchParams.append("collection_id[]", id))
  if (params?.tags?.length) params.tags.forEach((t) => searchParams.append("tags[]", t))
  if (params?.price_from) searchParams.set("price_from", String(params.price_from))
  if (params?.price_to) searchParams.set("price_to", String(params.price_to))
  if (params?.q) searchParams.set("q", params.q)

  const qs = searchParams.toString()
  return medusaClient.products.list(qs ? `?${qs}` : "")
}

export async function getProduct(handle: string): Promise<MedusaProduct> {
  const result = await medusaClient.products.list({ handle })
  if (!result.products || result.products.length === 0) throw new Error(`Product not found: ${handle}`)
  return result.products[0]
}

export async function getProductById(id: string): Promise<MedusaProduct> {
  const { product } = await medusaClient.products.retrieve(id)
  return product
}

// ---------------------------------------------------------------------------
// Collections
// ---------------------------------------------------------------------------
export async function getCollections(): Promise<MedusaCollection[]> {
  const { collections } = await medusaClient.collections.list()
  return collections
}

export async function getCollectionByHandle(handle: string): Promise<MedusaCollection> {
  const { collection } = await medusaClient.collections.retrieve(handle)
  return collection
}

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------
export async function getCategories(): Promise<MedusaCategory[]> {
  const { product_categories } = await medusaClient.productCategories.list()
  return product_categories
}

// ---------------------------------------------------------------------------
// Cart
// ---------------------------------------------------------------------------
export async function createCart(regionId?: string): Promise<MedusaCart> {
  const { cart } = await medusaClient.carts.create({ region_id: regionId })
  return cart
}

export async function getCart(cartId: string): Promise<MedusaCart> {
  const { cart } = await medusaClient.carts.retrieve(cartId)
  return cart
}

export async function addToCart(
  cartId: string,
  variantId: string,
  quantity: number
): Promise<MedusaCart> {
  const { cart } = await medusaClient.carts.lineItems.create(cartId, {
    variant_id: variantId,
    quantity,
  })
  return cart
}

export async function updateCartItem(
  cartId: string,
  lineItemId: string,
  quantity: number
): Promise<MedusaCart> {
  const { cart } = await medusaClient.carts.lineItems.update(cartId, lineItemId, {
    quantity,
  })
  return cart
}

export async function removeCartItem(
  cartId: string,
  lineItemId: string
): Promise<MedusaCart> {
  const { cart } = await medusaClient.carts.lineItems.delete(cartId, lineItemId)
  return cart
}

export async function setCartShippingAddress(
  cartId: string,
  address: Partial<MedusaAddress>
): Promise<MedusaCart> {
  const { cart } = await medusaClient.carts.update(cartId, {
    shipping_address: address,
  })
  return cart
}

export async function setCartShippingMethod(
  cartId: string,
  shippingOptionId: string
): Promise<MedusaCart> {
  const { cart } = await medusaClient.carts.addShippingMethod(cartId, {
    option_id: shippingOptionId,
  })
  return cart
}

export async function createPaymentSession(cartId: string): Promise<MedusaCart> {
  const { cart } = await medusaClient.carts.createPaymentSessions(cartId)
  return cart
}

export async function setPaymentSession(
  cartId: string,
  providerId: string
): Promise<MedusaCart> {
  const { cart } = await medusaClient.carts.setPaymentSession(cartId, {
    provider_id: providerId,
  })
  return cart
}

export async function completeCart(cartId: string): Promise<{ type: string; data: any }> {
  return medusaClient.carts.complete(cartId)
}

export async function applyCartDiscount(cartId: string, code: string): Promise<MedusaCart> {
  // The installed SDK has no carts.addDiscount method. Discounts are applied by
  // updating the cart with a discounts array: POST /store/carts/{id} { discounts: [{ code }] }.
  const { cart } = await medusaClient.carts.update(cartId, { discounts: [{ code }] })
  return cart
}

export async function removeCartDiscount(cartId: string, code: string): Promise<MedusaCart> {
  const { cart } = await medusaClient.carts.deleteDiscount(cartId, code)
  return cart
}

// ---------------------------------------------------------------------------
// Shipping Options
// ---------------------------------------------------------------------------
export async function getShippingOptions(cartId: string): Promise<any[]> {
  const { shipping_options } = await medusaClient.shippingOptions.listCartOptions(cartId)
  return shipping_options
}

// ---------------------------------------------------------------------------
// Regions
// ---------------------------------------------------------------------------
export async function getRegions(): Promise<any[]> {
  const { regions } = await medusaClient.regions.list()
  return regions
}

// ---------------------------------------------------------------------------
// Orders
// ---------------------------------------------------------------------------
export async function getOrders(): Promise<MedusaOrder[]> {
  // v2 store API auto-scopes orders to the logged-in customer session.
  // The installed @medusajs/medusa-js SDK (v2.0.2) exposes this via
  // customers.listOrders() -> GET /store/customers/me/orders (cookie-scoped).
  const { orders } = await medusaClient.customers.listOrders()
  return orders
}

export async function getOrder(orderId: string): Promise<MedusaOrder> {
  const { order } = await medusaClient.orders.retrieve(orderId)
  return order
}

// ---------------------------------------------------------------------------
// Customers / Auth
// ---------------------------------------------------------------------------
export async function registerCustomer(data: {
  email: string
  password: string
  first_name?: string
  last_name?: string
  phone?: string
}): Promise<{ customer: MedusaCustomer }> {
  return medusaClient.customers.create(data)
}

export async function loginCustomer(email: string, password: string): Promise<{ customer: MedusaCustomer }> {
  // The installed SDK uses auth.authenticate (POST /store/auth). The session is
  // persisted automatically via an httpOnly cookie — the axios client is created
  // with `withCredentials: true`, so the browser sends the cookie on later
  // requests (e.g. customers.retrieve -> /store/customers/me).
  return medusaClient.auth.authenticate({ email, password })
}

export async function logoutCustomer(): Promise<void> {
  // DELETE /store/auth clears the server-side session cookie.
  await medusaClient.auth.deleteSession()
}

export async function isAuthenticated(): Promise<boolean> {
  // GET /store/auth returns the customer when a session cookie is present.
  try {
    await medusaClient.auth.getSession()
    return true
  } catch {
    return false
  }
}

export async function getCustomer(): Promise<MedusaCustomer> {
  const { customer } = await medusaClient.customers.retrieve()
  return customer
}

export async function updateCustomer(data: Partial<MedusaCustomer>): Promise<MedusaCustomer> {
  const { customer } = await medusaClient.customers.update(data)
  return customer
}

export async function addCustomerAddress(
  address: Partial<MedusaAddress>
): Promise<MedusaCustomer> {
  const { customer } = await medusaClient.customers.addresses.addAddress({
    address,
  })
  return customer
}

export async function updateCustomerAddress(
  addressId: string,
  address: Partial<MedusaAddress>
): Promise<MedusaCustomer> {
  const { customer } = await medusaClient.customers.addresses.updateAddress(
    addressId,
    { address }
  )
  return customer
}

export async function deleteCustomerAddress(
  addressId: string
): Promise<MedusaCustomer> {
  const { customer } = await medusaClient.customers.addresses.deleteAddress(addressId)
  return customer
}

// ---------------------------------------------------------------------------
// Custom Endpoints (Pincode, Reviews, Wishlist, Returns)
// ---------------------------------------------------------------------------
export async function checkPincode(code: string) {
  return fetchAPI<{ pincode: string; is_serviceable: boolean; estimated_days: number }>(
    `/store/pincodes/${code}`
  )
}

export async function getProductReviews(productId: string, page = 1, limit = 10) {
  return fetchAPI<{ reviews: any[]; total: number }>(
    `/store/reviews/${productId}?page=${page}&limit=${limit}`
  )
}

export async function submitReview(data: {
  product_id: string
  rating: number
  title?: string
  body?: string
  images?: string[]
}) {
  return fetchAPI("/store/reviews", {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export async function getWishlist() {
  return fetchAPI<{ items: any[] }>("/store/wishlist")
}

export async function addToWishlist(productId: string, variantId?: string) {
  return fetchAPI("/store/wishlist", {
    method: "POST",
    body: JSON.stringify({ product_id: productId, variant_id: variantId }),
  })
}

export async function removeFromWishlist(id: string) {
  return fetchAPI(`/store/wishlist/${id}`, { method: "DELETE" })
}

export async function requestReturn(data: {
  order_id: string
  items: { line_item_id: string; quantity: number; reason: string }[]
  pickup_address?: any
}) {
  return fetchAPI("/store/returns", {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export async function getReturns() {
  return fetchAPI<{ returns: any[] }>("/store/returns")
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
export function formatPrice(amount: number, currency = "INR") {
  // Medusa returns money values in the smallest currency unit (paise for INR).
  // Divide by 100 before formatting so formatPrice(129900) -> "₹1,299".
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount / 100)
}

export function formatPriceRupees(amount: number, currency = "INR") {
  // For amounts already expressed in rupees (e.g. mock/fallback data, or
  // values already divided by 100 via getVariantPrice). formatPriceRupees(1299) -> "₹1,299".
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function getVariantPrice(variant: MedusaVariant, currency = "INR"): number {
  const price = variant.prices.find((p) => p.currency_code === currency.toLowerCase())
  return price ? price.amount / 100 : 0
}

export function getCheapestVariantPrice(
  variants: MedusaVariant[],
  currency = "INR"
): { price: number; originalPrice?: number } {
  if (!variants.length) return { price: 0 }
  const prices = variants.map((v) => getVariantPrice(v, currency))
  const min = Math.min(...prices)
  const max = Math.max(...prices)
  return { price: min, originalPrice: min !== max ? max : undefined }
}

export function getProductThumbnail(product: MedusaProduct): string {
  return product.thumbnail || product.images?.[0]?.url || ""
}

export function getProductImages(product: MedusaProduct): string[] {
  return product.images?.map((img) => img.url) || (product.thumbnail ? [product.thumbnail] : [])
}
