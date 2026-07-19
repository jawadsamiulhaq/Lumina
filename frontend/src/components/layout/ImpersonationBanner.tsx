import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { UserCog, LogOut } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useCartStore } from '@/store/cartStore'
import { toast } from '@/store/toastStore'
import { getApiErrorMessage } from '@/lib/api'

/**
 * Sticky bar shown while an admin is impersonating another user. It's a constant,
 * unmissable reminder that the current session isn't really the admin's, plus a
 * one-click way back to their own account.
 */
export function ImpersonationBanner() {
  const navigate = useNavigate()
  const isImpersonating = useAuthStore((s) => s.isImpersonating)
  const user = useAuthStore((s) => s.user)
  const stopImpersonating = useAuthStore((s) => s.stopImpersonating)
  const refreshCart = useCartStore((s) => s.refresh)
  const [leaving, setLeaving] = useState(false)

  async function handleStop() {
    setLeaving(true)
    try {
      await stopImpersonating()
      await refreshCart()
      toast.success('Back to your account.')
      navigate('/admin/users')
    } catch (err) {
      toast.error(getApiErrorMessage(err))
      setLeaving(false)
    }
  }

  return (
    <AnimatePresence>
      {isImpersonating && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="sticky top-0 z-[60] overflow-hidden bg-amber-500 text-amber-950"
        >
          <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2 text-sm sm:px-6 lg:px-8">
            <UserCog className="size-4 shrink-0" />
            <span className="font-medium">
              Viewing as {user?.firstName} {user?.lastName}
              {user?.email ? <span className="font-normal opacity-80"> · {user.email}</span> : null}
            </span>
            <button
              onClick={handleStop}
              disabled={leaving}
              className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-amber-950/90 px-3 py-1 text-xs font-semibold text-amber-50 transition hover:bg-amber-950 disabled:opacity-60"
            >
              <LogOut className="size-3.5" />
              {leaving ? 'Returning…' : 'Return to your account'}
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
