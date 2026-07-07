// API service layer — wraps the Medusa v2 JS SDK (@medusajs/js-sdk) and custom
// storefront endpoints.
//
// M4b: migrated from the v1-era Medusa JS client to the v2 @medusajs/js-sdk.
// Key v2 adaptations:
//   - The SDK is constructed with `publishableKey` (sent as the
//     `x-publishable-api-key` header on every /store/* call) and
//     `auth: { type: "session" }` (cookie-based customer auth).
//   - Prices live on the variant as `calculated_amount` / `original_amount`
//     (paise), only returned when `region_id` + `fields=+variants.calculated_price`
//     are passed on product fetches.
//   - Customer auth is `sdk.auth.login("customer","emailpass",...)` which (with
//     session auth) mints an httpOnly cookie; subsequent store calls are scoped.
//   - Cart/order/customer methods map to the v2 SDK resource methods.
//   - Custom routes (pincodes/reviews/wishlist/returns) use `sdk.client.fetch`,
//     which reuses the same publishable-key + cookie headers.

import Medusa from "@medusajs/js-sdk"

const MEDUSA_URL = process.env.NEXT_PUBLIC_MEDUSA_URL || "http://localhost:9000"
const PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY ||
  "pk_91ca8864dd17243297fcbd5afda4b2c2d41e3eee8ff0facf20ab9c9f3b7350b7"

// v2 SDK client — single shared instance. `auth: { type: "session" }` makes the
// SDK exchange the JWT from /auth/customer/emailpass for an httpOnly session
// cookie (POST /auth/session) and send `credentials: "include"` on every call.
export const sdk = new Medusa({
  baseUrl: MEDUSA_URL,
  publishableKey: PUBLISHABLE_KEY,
  auth: { type: "session" },
})

// ---------------------------------------------------------------------------
// Default region + pricing context
// ---------------------------------------------------------------------------
// v2 only returns variant prices when a `region_id` is supplied (requesting
// `calculated_price` without it 400s). We fetch the regions once, pick the
// India/INR region (fallback: first region) and cache the id for every product
// fetch. Cached in module scope; on the client this persists for the session.

let _defaultRegionId: string | null = null
let _defaultRegionPromise: Promise<string | null> | null = null

export async function getDefaultRegionId(): Promise<string | null> {
  if (_defaultRegionId) return _defaultRegionId
  if (_defaultRegionPromise) return _defaultRegionPromise
  _defaultRegionPromise = (async () => {
    try {
      const { regions } = await sdk.store.region.list()
      const inRegion = regions.find(
        (r: any) =>
          r.currency_code === "inr" ||
          (r.countries || []).some((c: any) => c.iso_2 === "in")
      )
      const id = (inRegion || regions[0])?.id || null
      _defaultRegionId = id
      return id
    } catch (err) {
      console.warn("Failed to load regions for pricing context:", err)
      return null
    }
  })()
  return _defaultRegionPromise
}

// Fields requested on every product fetch so the UI gets prices + categories.
// `+variants.calculated_price` adds the paise price fields to the variant's
// default field set; `*categories` expands the category relation (the `+`
// prefix does not load relations — only `*` does). The default product fields
// already include images, options, tags, variants and collection.
const PRODUCT_FIELDS = "+variants.calculated_price,*categories"

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
  collection: { id: string; title: string; handle?: string } | null
  categories: { id: string; name: string }[]
  tags: { id: string; value: string }[]
  discount?: { percent: number } | null
  created_at: string
}

export interface MedusaVariant {
  id: string
  title: string
  sku: string
  // v2 pricing: paise values, present only when region_id + calculated_price
  // fields are requested. `calculated_amount` is the sell price, `original_amount`
  // the list/strikethrough price.
  calculated_amount?: number
  original_amount?: number
  calculated_price?: {
    calculated_amount: number
    original_amount: number
    currency_code?: string
  }
  inventory_quantity?: number
  options: { value: string; id?: string }[]
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
  handle?: string
}): Promise<{ products: MedusaProduct[]; count: number; offset: number; limit: number }> {
  const region_id = await getDefaultRegionId()
  const query: Record<string, any> = {
    limit: params?.limit ?? 20,
    offset: params?.offset ?? 0,
    fields: PRODUCT_FIELDS,
  }
  if (region_id) query.region_id = region_id
  if (params?.category_id?.length) query.category_id = params.category_id
  if (params?.collection_id?.length) query.collection_id = params.collection_id
  if (params?.tags?.length) query.tag_id = params.tags
  if (params?.price_from != null) query.price_from = params.price_from
  if (params?.price_to != null) query.price_to = params.price_to
  if (params?.q) query.q = params.q
  if (params?.handle) query.handle = params.handle

  const result = await sdk.store.product.list(query)
  return {
    products: (result.products as any) || [],
    count: (result as any).count ?? result.products?.length ?? 0,
    offset: (result as any).offset ?? 0,
    limit: (result as any).limit ?? params?.limit ?? 20,
  }
}

export async function getProduct(handle: string): Promise<MedusaProduct> {
  // v2 store product list supports a `handle` filter.
  const { products } = await getProducts({ handle, limit: 1 })
  if (!products || products.length === 0) throw new Error(`Product not found: ${handle}`)
  return products[0]
}

export async function getProductById(id: string): Promise<MedusaProduct> {
  const region_id = await getDefaultRegionId()
  const { product } = await sdk.store.product.retrieve(id, {
    fields: PRODUCT_FIELDS,
    ...(region_id ? { region_id } : {}),
  } as any)
  return product as any
}

// ---------------------------------------------------------------------------
// Collections
// ---------------------------------------------------------------------------
export async function getCollections(): Promise<MedusaCollection[]> {
  const { collections } = await sdk.store.collection.list()
  return (collections as any) || []
}

export async function getCollectionByHandle(handle: string): Promise<MedusaCollection> {
  // v2 collection.retrieve takes an id, not a handle. Find via list.
  const collections = await getCollections()
  const found = collections.find((c) => c.handle === handle)
  if (!found) throw new Error(`Collection not found: ${handle}`)
  return found
}

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------
export async function getCategories(): Promise<MedusaCategory[]> {
  const { product_categories } = await sdk.store.category.list()
  return (product_categories as any) || []
}

// ---------------------------------------------------------------------------
// Cart
// ---------------------------------------------------------------------------
export async function createCart(regionId?: string): Promise<MedusaCart> {
  const rid = regionId || (await getDefaultRegionId()) || undefined
  const { cart } = await sdk.store.cart.create({ region_id: rid } as any)
  return cart as any
}

export async function getCart(cartId: string): Promise<MedusaCart> {
  const { cart } = await sdk.store.cart.retrieve(cartId)
  return cart as any
}

export async function addToCart(
  cartId: string,
  variantId: string,
  quantity: number
): Promise<MedusaCart> {
  const { cart } = await sdk.store.cart.createLineItem(cartId, {
    variant_id: variantId,
    quantity,
  } as any)
  return cart as any
}

export async function updateCartItem(
  cartId: string,
  lineItemId: string,
  quantity: number
): Promise<MedusaCart> {
  const { cart } = await sdk.store.cart.updateLineItem(cartId, lineItemId, {
    quantity,
  } as any)
  return cart as any
}

export async function removeCartItem(
  cartId: string,
  lineItemId: string
): Promise<MedusaCart> {
  // v2 deleteLineItem returns { deleted, parent: cart } (not { cart }).
  const result: any = await sdk.store.cart.deleteLineItem(cartId, lineItemId)
  return (result.parent ?? result.cart) as MedusaCart
}

export async function setCartShippingAddress(
  cartId: string,
  address: Partial<MedusaAddress>
): Promise<MedusaCart> {
  const { cart } = await sdk.store.cart.update(cartId, {
    shipping_address: address as any,
  } as any)
  return cart as any
}

export async function setCartShippingMethod(
  cartId: string,
  shippingOptionId: string
): Promise<MedusaCart> {
  const { cart } = await sdk.store.cart.addShippingMethod(cartId, {
    option_id: shippingOptionId,
  } as any)
  return cart as any
}

export async function createPaymentSession(cartId: string): Promise<MedusaCart> {
  // v2 separates payment collection/session init from the cart. We return the
  // current cart here; the provider is selected in setPaymentSession below.
  return getCart(cartId)
}

export async function setPaymentSession(
  cartId: string,
  providerId: string
): Promise<MedusaCart> {
  try {
    const cart = await getCart(cartId)
    await sdk.store.payment.initiatePaymentSession(cart as any, {
      provider_id: providerId,
    } as any)
  } catch (err) {
    // A payment provider may not be configured (e.g. COD). Surface the cart so
    // the page can proceed; the complete step will report a hard failure.
    console.warn("Failed to initiate payment session:", err)
  }
  return getCart(cartId)
}

export async function completeCart(cartId: string): Promise<{ type: string; data: any }> {
  // v2 returns { type: "order", order } on success or { type: "cart", error, cart }
  // on failure. Map to the { type, data } shape the checkout page expects.
  const result: any = await sdk.store.cart.complete(cartId)
  return {
    type: result.type,
    data: result.type === "order" ? result.order : result.cart,
  }
}

export async function applyCartDiscount(cartId: string, code: string): Promise<MedusaCart> {
  const { cart } = await sdk.store.cart.addPromotions(cartId, {
    promo_codes: [code],
  } as any)
  return cart as any
}

export async function removeCartDiscount(cartId: string, code: string): Promise<MedusaCart> {
  const { cart } = await sdk.store.cart.removePromotions(cartId, {
    promo_codes: [code],
  } as any)
  return cart as any
}

// ---------------------------------------------------------------------------
// Shipping Options
// ---------------------------------------------------------------------------
export async function getShippingOptions(cartId: string): Promise<any[]> {
  const { shipping_options } = await sdk.store.fulfillment.listCartOptions({
    cart_id: cartId,
  } as any)
  return (shipping_options as any) || []
}

// ---------------------------------------------------------------------------
// Regions
// ---------------------------------------------------------------------------
export async function getRegions(): Promise<any[]> {
  const { regions } = await sdk.store.region.list()
  return (regions as any) || []
}

// ---------------------------------------------------------------------------
// Orders
// ---------------------------------------------------------------------------
export async function getOrders(): Promise<MedusaOrder[]> {
  // v2 store orders are scoped to the logged-in customer session — no
  // customer_id param is required.
  const { orders } = await sdk.store.order.list()
  return (orders as any) || []
}

export async function getOrder(orderId: string): Promise<MedusaOrder> {
  const { order } = await sdk.store.order.retrieve(orderId)
  return order as any
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
  // v2 registration is two steps: obtain a registration JWT via
  // sdk.auth.register, then create the customer with that token as a Bearer
  // header. After creation we log in so a session cookie is minted.
  const token = await sdk.auth.register("customer", "emailpass", {
    email: data.email,
    password: data.password,
  } as any)

  const { customer } = await sdk.store.customer.create(
    {
      email: data.email,
      first_name: data.first_name,
      last_name: data.last_name,
      phone: data.phone,
    } as any,
    {},
    { Authorization: `Bearer ${token}` }
  )

  // Establish a session so /account/* pages see the logged-in customer.
  await sdk.auth.login("customer", "emailpass", {
    email: data.email,
    password: data.password,
  } as any)

  return { customer: customer as any }
}

export async function loginCustomer(
  email: string,
  password: string
): Promise<{ customer: MedusaCustomer }> {
  // With auth.type "session", sdk.auth.login posts to
  // /auth/customer/emailpass then /auth/session — the cookie is set and
  // subsequent store calls are authenticated.
  await sdk.auth.login("customer", "emailpass", { email, password } as any)
  const customer = await getCustomer()
  return { customer }
}

export async function logoutCustomer(): Promise<void> {
  await sdk.auth.logout()
}

export async function isAuthenticated(): Promise<boolean> {
  try {
    await sdk.store.customer.retrieve()
    return true
  } catch {
    return false
  }
}

export async function getCustomer(): Promise<MedusaCustomer> {
  const { customer } = await sdk.store.customer.retrieve()
  // v2 customer.retrieve does not embed addresses by default. Fetch them
  // separately so the dashboard/addresses pages keep working with the
  // existing `customer.shipping_addresses` shape.
  let shipping_addresses: MedusaAddress[] = []
  try {
    const { addresses } = await sdk.store.customer.listAddress()
    shipping_addresses = (addresses as any) || []
  } catch {
    // Not authenticated or no addresses — leave empty.
  }
  return { ...(customer as any), shipping_addresses }
}

export async function updateCustomer(data: Partial<MedusaCustomer>): Promise<MedusaCustomer> {
  const { customer } = await sdk.store.customer.update(data as any)
  return customer as any
}

export async function addCustomerAddress(
  address: Partial<MedusaAddress>
): Promise<MedusaCustomer> {
  await sdk.store.customer.createAddress(address as any)
  return getCustomer()
}

export async function updateCustomerAddress(
  addressId: string,
  address: Partial<MedusaAddress>
): Promise<MedusaCustomer> {
  await sdk.store.customer.updateAddress(addressId, address as any)
  return getCustomer()
}

export async function deleteCustomerAddress(addressId: string): Promise<MedusaCustomer> {
  await sdk.store.customer.deleteAddress(addressId)
  return getCustomer()
}

// ---------------------------------------------------------------------------
// Custom Endpoints (Pincode, Reviews, Wishlist, Returns)
// ---------------------------------------------------------------------------
// The v2 SDK has no typed methods for these custom routes. `sdk.client.fetch`
// reuses the configured publishable key + session cookie headers automatically
// (and parses JSON when accept: application/json, which the SDK sets by
// default). Inputs are relative paths — the SDK prepends the base URL.

async function customFetch<T = any>(
  path: string,
  init?: { method?: string; body?: any; query?: Record<string, any> }
): Promise<T> {
  return sdk.client.fetch<T>(path, {
    method: init?.method,
    body: init?.body,
    query: init?.query,
  } as any)
}

export async function checkPincode(code: string) {
  return customFetch<{ pincode: string; is_serviceable: boolean; estimated_days: number; city?: string; state?: string }>(
    `store/pincodes/${code}`
  )
}

export async function getProductReviews(productId: string, page = 1, limit = 10) {
  return customFetch<{ reviews: any[]; total: number; average_rating?: number }>(
    `store/reviews/${productId}`,
    { query: { page, limit } }
  )
}

export async function submitReview(data: {
  product_id: string
  rating: number
  title?: string
  body?: string
  images?: string[]
}) {
  return customFetch("store/reviews", { method: "POST", body: data })
}

export async function getWishlist() {
  return customFetch<{ items: any[] }>("store/wishlist")
}

export async function addToWishlist(productId: string, variantId?: string) {
  return customFetch("store/wishlist", {
    method: "POST",
    body: { product_id: productId, variant_id: variantId },
  })
}

export async function removeFromWishlist(id: string) {
  return customFetch(`store/wishlist/${id}`, { method: "DELETE" })
}

export async function requestReturn(data: {
  order_id: string
  items: { line_item_id: string; quantity: number; reason: string }[]
  pickup_address?: any
}) {
  return customFetch("store/returns", { method: "POST", body: data })
}

export async function getReturns() {
  return customFetch<{ returns: any[] }>("store/returns")
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

// Returns the variant's sell price in RUPEES (paise / 100) for direct use with
// formatPriceRupees. Reads the v2 calculated_price fields.
export function getVariantPrice(variant: MedusaVariant, _currency = "INR"): number {
  const paise =
    variant.calculated_amount ??
    variant.calculated_price?.calculated_amount ??
    0
  return paise / 100
}

export function getVariantOriginalPrice(variant: MedusaVariant, _currency = "INR"): number {
  const paise =
    variant.original_amount ??
    variant.calculated_price?.original_amount ??
    variant.calculated_amount ??
    variant.calculated_price?.calculated_amount ??
    0
  return paise / 100
}

export function getCheapestVariantPrice(
  variants: MedusaVariant[],
  currency = "INR"
): { price: number; originalPrice?: number } {
  if (!variants?.length) return { price: 0 }
  const priced = variants
    .map((v) => ({
      price: getVariantPrice(v, currency),
      original: getVariantOriginalPrice(v, currency),
    }))
    .filter((p) => p.price > 0)
  if (!priced.length) return { price: 0 }
  const min = Math.min(...priced.map((p) => p.price))
  // Original (strikethrough) price: use the largest original across variants
  // so the discount badge reflects the biggest listed saving.
  const maxOriginal = Math.max(...priced.map((p) => p.original))
  return {
    price: min,
    originalPrice: maxOriginal > min ? maxOriginal : undefined,
  }
}

export function getProductThumbnail(product: MedusaProduct): string {
  return product.thumbnail || product.images?.[0]?.url || ""
}

export function getProductImages(product: MedusaProduct): string[] {
  return product.images?.map((img) => img.url) || (product.thumbnail ? [product.thumbnail] : [])
}