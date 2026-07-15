import { Link, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react'
import { Seo } from '@/components/Seo'
import { Container } from '@/components/Container'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/States'
import { useCartStore } from '@/store/cartStore'
import { useAuthStore } from '@/store/authStore'
import { formatPrice } from '@/lib/format'
import { toast } from '@/store/toastStore'
import { getApiErrorMessage } from '@/lib/api'

const FALLBACK = 'https://placehold.co/200x200/eceef2/8591a6?text=—'

export function CartPage() {
  const navigate = useNavigate()
  const { cart, updateQty, remove } = useCartStore()
  const status = useAuthStore((s) => s.status)
  const items = cart?.items ?? []

  async function change(cartItemId: number, quantity: number) {
    try {
      await updateQty(cartItemId, quantity)
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Could not update quantity.'))
    }
  }

  if (status === 'authenticated' && items.length === 0) {
    return (
      <Container className="py-16">
        <Seo title="Cart" />
        <EmptyState
          icon={<ShoppingBag className="size-7" />}
          title="Your cart is empty"
          description="Browse our catalog and add something you love."
          action={<Link to="/products"><Button>Start shopping</Button></Link>}
        />
      </Container>
    )
  }

  if (status !== 'authenticated') {
    return (
      <Container className="py-16">
        <Seo title="Cart" />
        <EmptyState
          icon={<ShoppingBag className="size-7" />}
          title="Sign in to view your cart"
          description="Your cart is saved to your account."
          action={<Link to="/login"><Button>Sign in</Button></Link>}
        />
      </Container>
    )
  }

  return (
    <>
      <Seo title="Cart" />
      <Container className="py-8">
        <h1 className="mb-8 text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl">Shopping cart</h1>
        <div className="grid gap-10 lg:grid-cols-[1fr_360px]">
          <div className="divide-y divide-ink-100 border-y border-ink-100">
            <AnimatePresence initial={false}>
              {items.map((item) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex gap-4 py-5"
                >
                  <Link to={`/products/${item.slug}`} className="size-24 shrink-0 overflow-hidden rounded-2xl bg-ink-50">
                    <img src={item.imageUrl ?? FALLBACK} alt={item.name} className="size-full object-cover" />
                  </Link>
                  <div className="flex flex-1 flex-col">
                    <div className="flex justify-between gap-3">
                      <Link to={`/products/${item.slug}`} className="font-semibold text-ink-900 hover:text-brand-600">{item.name}</Link>
                      <span className="font-bold text-ink-900">{formatPrice(item.lineTotalInCents)}</span>
                    </div>
                    {item.variantLabel && <p className="mt-0.5 text-xs text-ink-400">{item.variantLabel}</p>}
                    <p className="mt-1 text-sm text-ink-500">{formatPrice(item.unitPriceInCents)} each</p>
                    <div className="mt-auto flex items-center gap-4 pt-3">
                      <div className="flex items-center rounded-full border border-ink-200">
                        <button onClick={() => void change(item.id, item.quantity - 1)} className="grid size-9 place-items-center rounded-full text-ink-600 hover:bg-ink-100"><Minus className="size-4" /></button>
                        <span className="w-9 text-center text-sm font-semibold">{item.quantity}</span>
                        <button onClick={() => void change(item.id, item.quantity + 1)} disabled={item.quantity >= item.stock} className="grid size-9 place-items-center rounded-full text-ink-600 hover:bg-ink-100 disabled:opacity-30"><Plus className="size-4" /></button>
                      </div>
                      <button onClick={() => void remove(item.id)} className="inline-flex items-center gap-1.5 text-sm text-ink-400 hover:text-accent-500">
                        <Trash2 className="size-4" /> Remove
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          <aside className="h-fit rounded-3xl border border-ink-100 bg-ink-50/50 p-6">
            <h2 className="text-lg font-bold text-ink-900">Order summary</h2>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-ink-500">Subtotal</dt><dd className="font-medium text-ink-900">{formatPrice(cart?.subtotalInCents ?? 0)}</dd></div>
              <div className="flex justify-between"><dt className="text-ink-500">Shipping</dt><dd className="font-medium text-ink-900">Calculated at checkout</dd></div>
            </dl>
            <div className="mt-4 flex justify-between border-t border-ink-200 pt-4">
              <span className="font-bold text-ink-900">Total</span>
              <span className="text-xl font-bold text-ink-900">{formatPrice(cart?.subtotalInCents ?? 0)}</span>
            </div>
            <Button className="mt-6 w-full" size="lg" onClick={() => navigate('/checkout')}>Proceed to checkout</Button>
            <Link to="/products" className="mt-3 block text-center text-sm text-ink-500 hover:text-ink-800">Continue shopping</Link>
          </aside>
        </div>
      </Container>
    </>
  )
}
