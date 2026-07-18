import { useAuthStore } from '@/store/authStore'
import { ADMIN_PERMISSIONS } from '@/lib/permissions'

/** True when the current user holds a permission (Admins implicitly hold all). */
export function useHasPermission(perm: string): boolean {
  return useAuthStore((s) => s.isAdmin || (s.user?.permissions?.includes(perm) ?? false))
}

/** True when the user can reach at least one section of the admin area. */
export function useCanAccessAdmin(): boolean {
  return useAuthStore((s) => s.isAdmin || ADMIN_PERMISSIONS.some((p) => s.user?.permissions?.includes(p)))
}
