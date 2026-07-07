"use client"

// Zustand cart + auth stores.
// Cart: persists the Medusa cart id to localStorage; holds the in-memory cart
//   payload and a derived item count so the Header badge can react to updates.
// Auth: holds the logged-in customer; `loadCustomer` rehydrates the session on
//   page loads by calling customers.retrieve() (cookie-scoped via the SDK).

import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { MedusaCart, MedusaCustomer } from "./api"
import { getCustomer, loginCustomer, logoutCustomer } from "./api"

// ---------------------------------------------------------------------------
// Cart store
// ---------------------------------------------------------------------------

interface CartState {
  cartId: string | null
  cart: MedusaCart | null
  itemCount: number
  setCart: (cart: MedusaCart | null) => void
  refreshCart: () => Promise<void>
  clearCart: () => void
}

function countItems(cart: MedusaCart | null): number {
  if (!cart?.items) return 0
  return cart.items.reduce((sum, item) => sum + item.quantity, 0)
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      cartId: null,
      cart: null,
      itemCount: 0,
      setCart: (cart) =>
        set({
          cart,
          itemCount: countItems(cart),
          cartId: cart?.id ?? get().cartId,
        }),
      refreshCart: async () => {
        const cartId = get().cartId
        if (!cartId) return
        try {
          const { getCart } = await import("./api")
          const cart = await getCart(cartId)
          set({ cart, itemCount: countItems(cart) })
        } catch (err) {
          console.error("Failed to refresh cart:", err)
        }
      },
      clearCart: () => set({ cartId: null, cart: null, itemCount: 0 }),
    }),
    {
      name: "myntra-cart",
      // Only persist the cart id — the cart payload is always re-fetched.
      partialize: (state) => ({ cartId: state.cartId }),
    }
  )
)

// ---------------------------------------------------------------------------
// Auth store
// ---------------------------------------------------------------------------

interface AuthState {
  customer: MedusaCustomer | null
  isAuthenticated: boolean
  loading: boolean
  login: (email: string, password: string) => Promise<MedusaCustomer>
  logout: () => Promise<void>
  loadCustomer: () => Promise<MedusaCustomer | null>
}

export const useAuthStore = create<AuthState>((set) => ({
  customer: null,
  isAuthenticated: false,
  loading: false,
  login: async (email, password) => {
    const { customer } = await loginCustomer(email, password)
    set({ customer, isAuthenticated: true })
    return customer
  },
  logout: async () => {
    await logoutCustomer()
    set({ customer: null, isAuthenticated: false })
  },
  loadCustomer: async () => {
    set({ loading: true })
    try {
      const customer = await getCustomer()
      set({ customer, isAuthenticated: true, loading: false })
      return customer
    } catch {
      set({ customer: null, isAuthenticated: false, loading: false })
      return null
    }
  },
}))