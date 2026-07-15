import { AnimatePresence, motion } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react'
import { useCartStore } from '@/store/cartStore'
import { formatPrice } from '@/lib/format'
import { Button } from '@/components/ui/Button'
import { toast } from '@/store/toastStore'
import { getApiErrorMessage } from '@/lib/api'

const FALLBACK = 'https://placehold.co/200x200/eceef2/8591a6?text=—'

export function CartDrawer() {
  const navigate = useNavigate()
  const { isOpen, close, cart, updateQty, remove } = useCartStore()
  const items = cart?.items ?? []

  async function change(cartItemId: number, quantity: number) {
    try {
      await updateQty(cartItemId, quantity)
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Could not update quantity.'))
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[90]">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={close}
            className="absolute inset-0 bg-ink-950/40 backdrop-blur-sm"
          />
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 340, damping: 36 }}
            className="absolute right-0 top-0 flex h-full w-[min(92vw,420px)] flex-col bg-white shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-ink-100 px-5 py-4">
              <h2 className="flex items-center gap-2 text-lg font-bold text-ink-900">
                <ShoppingBag className="size-5" /> Your cart
              </h2>
              <button onClick={close} className="grid size-9 place-items-center rounded-full text-ink-500 hover:bg-ink-100">
                <X className="size-5" />
              </button>
            </div>

            {items.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
                <div className="grid size-16 place-items-center rounded-2xl bg-ink-50 text-ink-300">
                  <ShoppingBag className="size-8" />
                </div>
                <p className="font-semibold text-ink-900">Your cart is empty</p>
                <p className="text-sm text-ink-500">Add some products to get started.</p>
                <Button variant="outline" size="sm" onClick={close} className="mt-1">
                  Continue shopping
                </Button>
              </div>
            ) : (
              <>
                <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
                  <AnimatePresence initial={false}>
                    {items.map((item) => (
                      <motion.div
                        key={item.id}
                        layout
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, x: 30 }}
                        transition={{ duration: 0.2 }}
                        className="flex gap-3"
                      >
                        <Link to={`/products/${item.slug}`} onClick={close} className="size-20 shrink-0 overflow-hidden rounded-xl bg-ink-50">
                          <img src={item.imageUrl ?? FALLBACK} alt={item.name} className="size-full object-cover" />
                        </Link>
                        <div className="flex flex-1 flex-col">
                          <div className="flex justify-between gap-2">
                            <Link to={`/products/${item.slug}`} onClick={close} className="line-clamp-2 text-sm font-medium text-ink-900 hover:text-brand-600">
                              {item.name}
                            </Link>
                            <button onClick={() => void remove(item.id)} className="text-ink-300 hover:text-accent-500">
                              <Trash2 className="size-4" />
                            </button>
                          </div>
                          {item.variantLabel && <p className="mt-0.5 text-xs text-ink-400">{item.variantLabel}</p>}
                          <p className="mt-0.5 text-sm text-ink-500">{formatPrice(item.unitPriceInCents)}</p>
                          <div className="mt-auto flex items-center justify-between pt-2">
                            <div className="flex items-center rounded-full border border-ink-200">
                              <button onClick={() => void change(item.id, item.quantity - 1)} className="grid size-8 place-items-center rounded-full text-ink-600 hover:bg-ink-100">
                                <Minus className="size-3.5" />
                              </button>
                              <span className="w-8 text-center text-sm font-semibold">{item.quantity}</span>
                              <button
                                onClick={() => void change(item.id, item.quantity + 1)}
                                disabled={item.quantity >= item.stock}
                                className="grid size-8 place-items-center rounded-full text-ink-600 hover:bg-ink-100 disabled:opacity-30"
                              >
                                <Plus className="size-3.5" />
                              </button>
                            </div>
                            <span className="text-sm font-bold text-ink-900">{formatPrice(item.lineTotalInCents)}</span>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>

                <div className="space-y-3 border-t border-ink-100 p-5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-ink-500">Subtotal</span>
                    <span className="text-lg font-bold text-ink-900">{formatPrice(cart?.subtotalInCents ?? 0)}</span>
                  </div>
                  <p className="text-xs text-ink-400">Shipping & taxes calculated at checkout.</p>
                  <Button
                    className="w-full"
                    size="lg"
                    onClick={() => {
                      close()
                      navigate('/checkout')
                    }}
                  >
                    Checkout
                  </Button>
                </div>
              </>
            )}
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  )
}
