import { create } from 'zustand'
import { cartApi } from '@/api/services'
import type { Cart } from '@/types/api'

interface CartState {
  cart: Cart | null
  loading: boolean
  isOpen: boolean
  /** Increments whenever the item count grows — used to trigger the badge bounce. */
  bumpKey: number

  refresh: () => Promise<void>
  add: (productId: number, quantity?: number, variantId?: number | null) => Promise<void>
  updateQty: (cartItemId: number, quantity: number) => Promise<void>
  remove: (cartItemId: number) => Promise<void>
  reset: () => void
  open: () => void
  close: () => void
  toggle: () => void
}

const emptyCart: Cart = { items: [], subtotalInCents: 0, itemCount: 0 }

export const useCartStore = create<CartState>((set, get) => ({
  cart: null,
  loading: false,
  isOpen: false,
  bumpKey: 0,

  refresh: async () => {
    set({ loading: true })
    try {
      const cart = await cartApi.get()
      set({ cart })
    } finally {
      set({ loading: false })
    }
  },

  add: async (productId, quantity = 1, variantId = null) => {
    const prevCount = get().cart?.itemCount ?? 0
    const cart = await cartApi.add(productId, quantity, variantId)
    set((s) => ({ cart, bumpKey: cart.itemCount > prevCount ? s.bumpKey + 1 : s.bumpKey }))
  },

  updateQty: async (cartItemId, quantity) => {
    // optimistic update
    const current = get().cart
    if (current) {
      const items = current.items
        .map((i) => (i.id === cartItemId ? { ...i, quantity, lineTotalInCents: i.unitPriceInCents * quantity } : i))
        .filter((i) => i.quantity > 0)
      set({
        cart: {
          items,
          subtotalInCents: items.reduce((sum, i) => sum + i.lineTotalInCents, 0),
          itemCount: items.reduce((sum, i) => sum + i.quantity, 0),
        },
      })
    }
    const cart = await cartApi.update(cartItemId, quantity)
    set({ cart })
  },

  remove: async (cartItemId) => {
    const current = get().cart
    if (current) {
      const items = current.items.filter((i) => i.id !== cartItemId)
      set({
        cart: {
          items,
          subtotalInCents: items.reduce((sum, i) => sum + i.lineTotalInCents, 0),
          itemCount: items.reduce((sum, i) => sum + i.quantity, 0),
        },
      })
    }
    const cart = await cartApi.remove(cartItemId)
    set({ cart })
  },

  reset: () => set({ cart: emptyCart, isOpen: false }),

  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
  toggle: () => set((s) => ({ isOpen: !s.isOpen })),
}))
