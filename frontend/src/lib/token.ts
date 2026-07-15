// In-memory access token holder. The access token is intentionally kept in memory
// (not localStorage) — the refresh token lives in an httpOnly cookie set by the API.

let accessToken: string | null = null

export function getAccessToken(): string | null {
  return accessToken
}

export function setAccessToken(token: string | null): void {
  accessToken = token
}
