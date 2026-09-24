/**
 * User information returned from authentication endpoints.
 */
export interface User {
  id: string
  username: string
  hoTen: string
  email: string | null
  role: string
}

/**
 * Token information from authentication response.
 */
export interface TokenResponse {
  accessToken: string
  refreshToken: string | null
  tokenType: string
  expiresIn: number
}

/**
 * Full authentication response containing user and token data.
 */
export interface AuthResponse {
  user: User
  token: TokenResponse
}

/**
 * Standard API response wrapper used by all backend endpoints.
 */
export interface ApiResponse<T> {
  success: boolean
  status: number
  code: string
  message: string
  data: T
  timestamp: string
}

/**
 * Error response structure for failed API requests.
 */
export interface ApiError {
  success: boolean
  status: number
  code: string
  message: string
  errors: Array<{ field: string; message: string }> | null
  timestamp: string
}
