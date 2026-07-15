import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { HelmetProvider } from 'react-helmet-async'
import { MotionConfig } from 'framer-motion'
import { BrowserRouter } from 'react-router-dom'
import { queryClient } from '@/lib/queryClient'
import { setAuthFailureHandler } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { useCartStore } from '@/store/cartStore'

/** Bootstraps auth from the refresh cookie and keeps the cart in sync with auth state. */
function AuthGate({ children }: { children: ReactNode }) {
  const bootstrap = useAuthStore((s) => s.bootstrap)
  const status = useAuthStore((s) => s.status)
  const refreshCart = useCartStore((s) => s.refresh)
  const resetCart = useCartStore((s) => s.reset)

  useEffect(() => {
    void bootstrap()
    setAuthFailureHandler(() => {
      void useAuthStore.getState().logout()
    })
    return () => setAuthFailureHandler(null)
  }, [bootstrap])

  useEffect(() => {
    if (status === 'authenticated') void refreshCart()
    else if (status === 'unauthenticated') resetCart()
  }, [status, refreshCart, resetCart])

  return <>{children}</>
}

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <MotionConfig reducedMotion="user">
          <BrowserRouter>
            <AuthGate>{children}</AuthGate>
          </BrowserRouter>
        </MotionConfig>
      </QueryClientProvider>
    </HelmetProvider>
  )
}
