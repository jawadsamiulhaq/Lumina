import { create } from 'zustand'
import { authApi } from '@/api/services'
import { setAccessToken } from '@/lib/token'
import type { AuthResponse, User } from '@/types/api'

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated'

interface AuthState {
  user: User | null
  status: AuthStatus
  isAdmin: boolean
  bootstrap: () => Promise<void>
  applyAuth: (auth: AuthResponse) => void
  login: (email: string, password: string) => Promise<void>
  register: (body: { email: string; password: string; firstName: string; lastName: string }) => Promise<void>
  logout: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  status: 'loading',
  isAdmin: false,

  applyAuth: (auth) => {
    setAccessToken(auth.accessToken)
    set({ user: auth.user, status: 'authenticated', isAdmin: auth.user.roles.includes('Admin') })
  },

  bootstrap: async () => {
    try {
      // Try to obtain a fresh access token from the httpOnly refresh cookie
      const auth = await authApi.refresh()
      setAccessToken(auth.accessToken)
      set({ user: auth.user, status: 'authenticated', isAdmin: auth.user.roles.includes('Admin') })
    } catch {
      setAccessToken(null)
      set({ user: null, status: 'unauthenticated', isAdmin: false })
    }
  },

  login: async (email, password) => {
    const auth = await authApi.login({ email, password })
    setAccessToken(auth.accessToken)
    set({ user: auth.user, status: 'authenticated', isAdmin: auth.user.roles.includes('Admin') })
  },

  register: async (body) => {
    const auth = await authApi.register(body)
    setAccessToken(auth.accessToken)
    set({ user: auth.user, status: 'authenticated', isAdmin: auth.user.roles.includes('Admin') })
  },

  logout: async () => {
    try {
      await authApi.logout()
    } finally {
      setAccessToken(null)
      set({ user: null, status: 'unauthenticated', isAdmin: false })
    }
  },
}))
