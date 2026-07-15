import axios from 'axios'
import type { AxiosError, AxiosRequestConfig } from 'axios'
import { getAccessToken, setAccessToken } from './token'
import type { AuthResponse } from '@/types/api'

const BASE_URL = import.meta.env.VITE_API_URL ?? '/api/v1'

export const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // send/receive the httpOnly refresh cookie
})

// Attach the access token to every request
api.interceptors.request.use((config) => {
  const token = getAccessToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Optional callback invoked when refresh ultimately fails (wired by the auth store)
let onAuthFailure: (() => void) | null = null
export function setAuthFailureHandler(handler: (() => void) | null): void {
  onAuthFailure = handler
}

// Single-flight refresh so concurrent 401s share one refresh request
let refreshPromise: Promise<string | null> | null = null

async function refreshAccessToken(): Promise<string | null> {
  refreshPromise ??= (async () => {
    try {
      const { data } = await axios.post<AuthResponse>(
        `${BASE_URL}/auth/refresh`,
        {},
        { withCredentials: true },
      )
      setAccessToken(data.accessToken)
      return data.accessToken
    } catch {
      setAccessToken(null)
      return null
    } finally {
      refreshPromise = null
    }
  })()
  return refreshPromise
}

interface RetriableConfig extends AxiosRequestConfig {
  _retry?: boolean
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as RetriableConfig | undefined
    const status = error.response?.status
    const url = original?.url ?? ''

    const isAuthEndpoint = url.includes('/auth/login') || url.includes('/auth/refresh') || url.includes('/auth/register')

    if (status === 401 && original && !original._retry && !isAuthEndpoint) {
      original._retry = true
      const newToken = await refreshAccessToken()
      if (newToken) {
        original.headers = { ...original.headers, Authorization: `Bearer ${newToken}` }
        return api(original)
      }
      onAuthFailure?.()
    }

    return Promise.reject(error)
  },
)

/** Extracts a human-readable message from an API error (ProblemDetails or ValidationProblem). */
export function getApiErrorMessage(error: unknown, fallback = 'Something went wrong.'): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as
      | { title?: string; detail?: string; errors?: Record<string, string[]> }
      | undefined
    if (data?.errors) {
      const first = Object.values(data.errors)[0]
      if (first?.length) return first[0]
    }
    return data?.detail ?? data?.title ?? error.message ?? fallback
  }
  return fallback
}
