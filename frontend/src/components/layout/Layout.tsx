import { useLocation, useOutlet } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Navbar } from './Navbar'
import { Footer } from './Footer'
import { ImpersonationBanner } from './ImpersonationBanner'
import { CartDrawer } from '@/components/cart/CartDrawer'
import { FlyToCartLayer } from '@/components/cart/FlyToCartLayer'
import { Toaster } from '@/components/ui/Toaster'
import { pageTransition } from '@/lib/motion'

export function Layout() {
  const location = useLocation()
  const outlet = useOutlet()

  return (
    <div className="flex min-h-screen flex-col">
      <ImpersonationBanner />
      <Navbar />
      <main className="flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            variants={pageTransition}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            {outlet}
          </motion.div>
        </AnimatePresence>
      </main>
      <Footer />
      <CartDrawer />
      <FlyToCartLayer />
      <Toaster />
    </div>
  )
}
