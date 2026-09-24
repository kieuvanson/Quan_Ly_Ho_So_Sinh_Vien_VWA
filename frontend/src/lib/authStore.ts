/**
 * In-memory authentication store.
 * Access token is stored in memory only - NOT in localStorage or sessionStorage.
 * Refresh token is managed by the server via HttpOnly cookie.
 */
import type { User } from '../api/types'
import type { AuthResponse } from '../api/types'

class AuthStoreClass {
  private _accessToken: string | null = null
  private _user: User | null = null

  setAccessToken(token: string): void {
    this._accessToken = token
  }

  getAccessToken(): string | null {
    return this._accessToken
  }

  setUser(user: User): void {
    this._user = user
  }

  getUser(): User | null {
    return this._user
  }

  /**
   * Set both access token and user from auth response.
   */
  setAuth(authResponse: AuthResponse): void {
    this._accessToken = authResponse.token.accessToken
    this._user = authResponse.user
  }

  clearAuth(): void {
    this._accessToken = null
    this._user = null
  }

  clear(): void {
    this.clearAuth()
  }

  isAuthenticated(): boolean {
    return this._accessToken !== null
  }
}

export const authStore = new AuthStoreClass()
