import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { useCartStore } from '@/store/cartStore'
import { useFlyStore } from '@/store/flyStore'
import { toast } from '@/store/toastStore'
import { getApiErrorMessage } from '@/lib/api'

/** Shared add-to-cart behaviour: auth guard, fly animation, optimistic add, error toast. */
export function useAddToCart() {
  const navigate = useNavigate()
  const status = useAuthStore((s) => s.status)
  const add = useCartStore((s) => s.add)
  const openCart = useCartStore((s) => s.open)
  const fly = useFlyStore((s) => s.fly)

  return useCallback(
    async (
      productId: number,
      opts?: { quantity?: number; imageUrl?: string | null; fromRect?: DOMRect | null; openDrawer?: boolean; variantId?: number | null },
    ) => {
      if (status !== 'authenticated') {
        toast.info('Please sign in to add items to your cart.')
        navigate('/login', { state: { from: window.location.pathname } })
        return
      }
      if (opts?.imageUrl && opts.fromRect) {
        fly(opts.imageUrl, opts.fromRect)
      }
      try {
        await add(productId, opts?.quantity ?? 1, opts?.variantId ?? null)
        if (opts?.openDrawer) openCart()
      } catch (err) {
        toast.error(getApiErrorMessage(err, 'Could not add to cart.'))
      }
    },
    [status, add, openCart, fly, navigate],
  )
}
