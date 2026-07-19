import { create } from 'zustand'
import { authApi, adminApi } from '@/api/services'
import { setAccessToken } from '@/lib/token'
import type { AuthResponse, User } from '@/types/api'

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated'

interface AuthState {
  user: User | null
  status: AuthStatus
  isAdmin: boolean
  isImpersonating: boolean
  impersonatorName: string | null
  bootstrap: () => Promise<void>
  applyAuth: (auth: AuthResponse) => void
  login: (email: string, password: string) => Promise<void>
  register: (body: { email: string; password: string; firstName: string; lastName: string }) => Promise<void>
  logout: () => Promise<void>
  impersonate: (userId: string) => Promise<void>
  stopImpersonating: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => {
  const apply = (auth: AuthResponse) => {
    setAccessToken(auth.accessToken)
    set({
      user: auth.user,
      status: 'authenticated',
      isAdmin: auth.user.roles.includes('Admin'),
      isImpersonating: auth.isImpersonating,
      impersonatorName: auth.impersonatorName,
    })
  }

  return {
    user: null,
    status: 'loading',
    isAdmin: false,
    isImpersonating: false,
    impersonatorName: null,

    applyAuth: apply,

    bootstrap: async () => {
      try {
        // Try to obtain a fresh access token from the httpOnly refresh cookie
        apply(await authApi.refresh())
      } catch {
        setAccessToken(null)
        set({ user: null, status: 'unauthenticated', isAdmin: false, isImpersonating: false, impersonatorName: null })
      }
    },

    login: async (email, password) => {
      apply(await authApi.login({ email, password }))
    },

    register: async (body) => {
      apply(await authApi.register(body))
    },

    logout: async () => {
      try {
        await authApi.logout()
      } finally {
        setAccessToken(null)
        set({ user: null, status: 'unauthenticated', isAdmin: false, isImpersonating: false, impersonatorName: null })
      }
    },

    impersonate: async (userId) => {
      apply(await adminApi.impersonateUser(userId))
    },

    stopImpersonating: async () => {
      apply(await authApi.stopImpersonation())
    },
  }
})
