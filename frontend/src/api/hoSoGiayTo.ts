import { apiClient } from './client'
import type { ApiResponse, HoSoGiayTo } from './types'

/**
 * HoSoGiayTo API client.
 * Endpoints:
 * - GET /api/ho-so-giay-to?mssv={mssv} (get all documents for a student)
 */
export const hoSoGiayToApi = {
  /**
   * Get all documents for a student by MSSV.
   */
  getByMssv: async (mssv: string): Promise<ApiResponse<HoSoGiayTo[]>> => {
    const response = await apiClient.get<ApiResponse<HoSoGiayTo[]>>(
      `/api/ho-so-giay-to?mssv=${encodeURIComponent(mssv)}`
    )
    return response.data
  },
}
