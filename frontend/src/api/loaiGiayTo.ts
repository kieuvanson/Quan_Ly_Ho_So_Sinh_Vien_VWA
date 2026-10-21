import { apiClient } from './client'
import type { ApiResponse, LoaiGiayTo } from './types'
import type { LoaiGiayToRequest } from './types'
import type { ImportResult } from './danhMuc'

/**
 * LoaiGiayTo API client.
 * Endpoints:
 * - GET  /api/loai-giay-to
 * - POST /api/loai-giay-to
 * - PUT  /api/loai-giay-to/{maLoai}
 * - DEL  /api/loai-giay-to/{maLoai}
 * - GET  /api/loai-giay-to/export
 * - GET  /api/loai-giay-to/template
 * - POST /api/loai-giay-to/import
 */
export const loaiGiayToApi = {
  /**
   * Get all active document types.
   */
  getAll: async (): Promise<ApiResponse<LoaiGiayTo[]>> => {
    const response = await apiClient.get<ApiResponse<LoaiGiayTo[]>>('/api/loai-giay-to')
    return response.data
  },

  /**
   * Create a new document type.
   */
  create: async (data: LoaiGiayToRequest): Promise<ApiResponse<LoaiGiayTo>> => {
    const response = await apiClient.post<ApiResponse<LoaiGiayTo>>('/api/loai-giay-to', data)
    return response.data
  },

  /**
   * Update an existing document type.
   */
  update: async (maLoai: string, data: LoaiGiayToRequest): Promise<ApiResponse<LoaiGiayTo>> => {
    const response = await apiClient.put<ApiResponse<LoaiGiayTo>>(`/api/loai-giay-to/${encodeURIComponent(maLoai)}`, data)
    return response.data
  },

  /**
   * Delete a document type.
   * Returns error if type is referenced by any HoSoGiayTo.
   */
  delete: async (maLoai: string): Promise<ApiResponse<void>> => {
    const response = await apiClient.delete<ApiResponse<void>>(`/api/loai-giay-to/${encodeURIComponent(maLoai)}`)
    return response.data
  },

  /**
   * Export all active document types to Excel.
   */
  exportExcel: async (): Promise<void> => {
    const res = await apiClient.get('/api/loai-giay-to/export', { responseType: 'blob' })
    const blob = res.data as Blob
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'danh-muc-loai-giay-to.xlsx'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  },

  /**
   * Download Excel template for import.
   */
  downloadTemplate: async (): Promise<void> => {
    const res = await apiClient.get('/api/loai-giay-to/template', { responseType: 'blob' })
    const blob = res.data as Blob
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'mau-import-loai-giay-to.xlsx'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  },

  /**
   * Upload Excel file to import document types.
   */
  importExcel: async (file: File): Promise<ApiResponse<ImportResult>> => {
    const form = new FormData()
    form.append('file', file)
    const res = await apiClient.post<ApiResponse<ImportResult>>('/api/loai-giay-to/import', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return res.data
  },
}
