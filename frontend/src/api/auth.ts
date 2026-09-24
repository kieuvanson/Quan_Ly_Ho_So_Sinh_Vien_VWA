import { apiClient } from './client'
import type { ApiResponse, AuthResponse } from './types'

/**
 * Authentication API client.
 * Endpoints:
 * - POST /api/auth/login
 * - POST /api/auth/refresh
 * - POST /api/auth/logout
 */
export const authApi = {
  /**
   * Authenticate user with username and password.
   * On success, sets access token in authStore and returns user info.
   * Refresh token is automatically set via HttpOnly cookie by the server.
   */
  login: async (username: string, password: string): Promise<ApiResponse<AuthResponse>> => {
    const response = await apiClient.post<ApiResponse<AuthResponse>>('/api/auth/login', {
      username,
      password,
    })
    return response.data
  },

  /**
   * Refresh access token using the HttpOnly cookie.
   * Automatically sends the refresh token cookie with the request.
   */
  refresh: async (): Promise<ApiResponse<AuthResponse>> => {
    const response = await apiClient.post<ApiResponse<AuthResponse>>('/api/auth/refresh')
    return response.data
  },

  /**
   * Logout and invalidate the refresh token.
   * Clears the HttpOnly cookie on the server side.
   */
  logout: async (): Promise<ApiResponse<void>> => {
    const response = await apiClient.post<ApiResponse<void>>('/api/auth/logout')
    return response.data
  },
}
