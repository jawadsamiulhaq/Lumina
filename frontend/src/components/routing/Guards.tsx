import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { Spinner, EmptyState } from '@/components/ui/States'
import { ADMIN_PERMISSIONS } from '@/lib/permissions'
import { Button } from '@/components/ui/Button'
import { ShieldAlert } from 'lucide-react'
import { Link } from 'react-router-dom'

export function RequireAuth({ children }: { children: ReactNode }) {
  const status = useAuthStore((s) => s.status)
  const location = useLocation()

  if (status === 'loading') return <Spinner label="Loading…" />
  if (status !== 'authenticated') return <Navigate to="/login" state={{ from: location.pathname }} replace />
  return <>{children}</>
}

/** Admin role only — kept for anything that must be strictly super-user. */
export function RequireAdmin({ children }: { children: ReactNode }) {
  const status = useAuthStore((s) => s.status)
  const isAdmin = useAuthStore((s) => s.isAdmin)
  const location = useLocation()

  if (status === 'loading') return <Spinner label="Loading…" />
  if (status !== 'authenticated') return <Navigate to="/login" state={{ from: location.pathname }} replace />
  if (!isAdmin) return <Navigate to="/" replace />
  return <>{children}</>
}

/** Lets anyone with at least one admin permission into the admin area (not just Admins). */
export function RequireAdminArea({ children }: { children: ReactNode }) {
  const status = useAuthStore((s) => s.status)
  const canEnter = useAuthStore((s) => s.isAdmin || ADMIN_PERMISSIONS.some((p) => s.user?.permissions?.includes(p)))
  const location = useLocation()

  if (status === 'loading') return <Spinner label="Loading…" />
  if (status !== 'authenticated') return <Navigate to="/login" state={{ from: location.pathname }} replace />
  if (!canEnter) return <Navigate to="/" replace />
  return <>{children}</>
}

/** Guards a single admin route by a specific permission; shows a Forbidden panel otherwise. */
export function RequirePermission({ perm, children }: { perm: string; children: ReactNode }) {
  const allowed = useAuthStore((s) => s.isAdmin || (s.user?.permissions?.includes(perm) ?? false))
  if (allowed) return <>{children}</>
  return (
    <EmptyState
      icon={<ShieldAlert className="size-7" />}
      title="You don't have access to this section"
      description="Ask an administrator to grant you the required permission."
      action={<Link to="/admin"><Button variant="outline" size="sm">Back to admin</Button></Link>}
    />
  )
}
