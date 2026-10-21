import { apiClient } from './client'
import type { ApiResponse } from './types'

export interface UserResponse {
  id: number
  username: string
  hoTen: string
  email: string | null
  role: string
  isActive: boolean
  createdAt: string | null
  updatedAt: string | null
}

export interface UserProfileRequest {
  hoTen: string
  email?: string | null
}

export interface UpdateRoleRequest {
  role: 'ADMIN' | 'STAFF'
}

/**
 * User API client.
 * Endpoints:
 * - GET  /api/users
 * - GET  /api/users/me
 * - PUT  /api/users/{username}/profile
 * - PUT  /api/users/{username}/role
 * - POST /api/users/{username}/deactivate
 * - POST /api/users/{username}/activate
 */
export const userApi = {
  getAll: async (): Promise<ApiResponse<UserResponse[]>> => {
    const response = await apiClient.get<ApiResponse<UserResponse[]>>('/api/users')
    return response.data
  },

  updateProfile: async (username: string, data: UserProfileRequest): Promise<ApiResponse<UserResponse>> => {
    const response = await apiClient.put<ApiResponse<UserResponse>>(
      `/api/users/${encodeURIComponent(username)}/profile`,
      data
    )
    return response.data
  },

  updateRole: async (username: string, data: UpdateRoleRequest): Promise<ApiResponse<UserResponse>> => {
    const response = await apiClient.put<ApiResponse<UserResponse>>(
      `/api/users/${encodeURIComponent(username)}/role`,
      data
    )
    return response.data
  },

  deactivate: async (username: string): Promise<ApiResponse<UserResponse>> => {
    const response = await apiClient.post<ApiResponse<UserResponse>>(
      `/api/users/${encodeURIComponent(username)}/deactivate`
    )
    return response.data
  },

  activate: async (username: string): Promise<ApiResponse<UserResponse>> => {
    const response = await apiClient.post<ApiResponse<UserResponse>>(
      `/api/users/${encodeURIComponent(username)}/activate`
    )
    return response.data
  },
}
