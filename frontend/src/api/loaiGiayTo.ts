import { apiClient } from './client'
import type { ApiResponse, LoaiGiayTo } from './types'

/**
 * LoaiGiayTo API client.
 * Endpoints:
 * - GET /api/loai-giay-to (get all active document types)
 */
export const loaiGiayToApi = {
  /**
   * Get all active document types.
   */
  getAll: async (): Promise<ApiResponse<LoaiGiayTo[]>> => {
    const response = await apiClient.get<ApiResponse<LoaiGiayTo[]>>('/api/loai-giay-to')
    return response.data
  },
}
