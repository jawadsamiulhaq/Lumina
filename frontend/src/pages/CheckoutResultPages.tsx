import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CheckCircle2, XCircle } from 'lucide-react'
import { Seo } from '@/components/Seo'
import { Container } from '@/components/Container'
import { Button } from '@/components/ui/Button'
import { useCartStore } from '@/store/cartStore'

export function CheckoutSuccessPage() {
  const refreshCart = useCartStore((s) => s.refresh)

  // The webhook clears the server cart; refresh to reflect it.
  useEffect(() => {
    const t = setTimeout(() => void refreshCart(), 1500)
    return () => clearTimeout(t)
  }, [refreshCart])

  return (
    <>
      <Seo title="Order confirmed" />
      <Container className="grid min-h-[70vh] place-items-center py-16">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-md text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.15, type: 'spring', stiffness: 260, damping: 18 }}
            className="mx-auto grid size-20 place-items-center rounded-full bg-emerald-50 text-emerald-500"
          >
            <CheckCircle2 className="size-11" />
          </motion.div>
          <h1 className="mt-6 text-3xl font-bold text-ink-900">Thank you for your order!</h1>
          <p className="mt-2 text-ink-500">
            Your payment was successful and your order is being processed. A confirmation has been sent to your email.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Link to="/account/orders"><Button>View my orders</Button></Link>
            <Link to="/products"><Button variant="outline">Keep shopping</Button></Link>
          </div>
        </motion.div>
      </Container>
    </>
  )
}

export function CheckoutCancelPage() {
  return (
    <>
      <Seo title="Checkout cancelled" />
      <Container className="grid min-h-[70vh] place-items-center py-16">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="max-w-md text-center">
          <div className="mx-auto grid size-20 place-items-center rounded-full bg-ink-100 text-ink-400">
            <XCircle className="size-11" />
          </div>
          <h1 className="mt-6 text-3xl font-bold text-ink-900">Checkout cancelled</h1>
          <p className="mt-2 text-ink-500">No worries — your cart is saved. You can complete your purchase whenever you’re ready.</p>
          <div className="mt-8 flex justify-center gap-3">
            <Link to="/checkout"><Button>Return to checkout</Button></Link>
            <Link to="/products"><Button variant="outline">Continue shopping</Button></Link>
          </div>
        </motion.div>
      </Container>
    </>
  )
}
