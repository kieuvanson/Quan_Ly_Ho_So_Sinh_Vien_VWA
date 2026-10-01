import { apiClient } from './client'
import type { ApiResponse, SinhVienPagedResponse, SinhVienSearchParams, SinhVien } from './types'

/**
 * Kết quả import Excel trả về từ backend.
 */
export interface ImportResult {
  successCount: number
  failureCount: number
  insertedCount: number
  updatedCount: number
  errors: Array<{ rowNumber: number; message: string }>
}

/**
 * SinhVien API client.
 * Endpoints:
 * - GET    /api/sinh-vien (search, filter, paginate)
 * - GET    /api/sinh-vien/:mssv (get detail)
 * - GET    /api/sinh-vien/export (download xlsx)
 * - GET    /api/sinh-vien/import-template (download template xlsx)
 * - POST   /api/sinh-vien/import (upload xlsx)
 */
export const sinhVienApi = {
  /**
   * Get paginated list of students with search and filter.
   */
  getAll: async (params: SinhVienSearchParams = {}): Promise<ApiResponse<SinhVienPagedResponse>> => {
    const searchParams = new URLSearchParams()

    if (params.keyword) searchParams.append('keyword', params.keyword)
    if (params.trangThaiHocVu) searchParams.append('trangThaiHocVu', params.trangThaiHocVu)
    if (params.nganh) searchParams.append('nganh', params.nganh)
    if (params.lop) searchParams.append('lop', params.lop)
    if (params.khoaNamNhapHoc) searchParams.append('khoaNamNhapHoc', params.khoaNamNhapHoc)
    if (params.khoa) searchParams.append('khoa', params.khoa)
    if (params.heDaoTao) searchParams.append('heDaoTao', params.heDaoTao)
    if (params.page !== undefined) searchParams.append('page', String(params.page))
    if (params.size !== undefined) searchParams.append('size', String(params.size))
    if (params.sortDirection !== undefined) searchParams.append('sortDirection', String(params.sortDirection))

    const queryString = searchParams.toString()
    const url = queryString ? `/api/sinh-vien?${queryString}` : '/api/sinh-vien'

    const res = await apiClient.get<ApiResponse<SinhVienPagedResponse>>(url)
    return res.data
  },

  /**
   * Get student detail by MSSV.
   */
  getByMssv: async (mssv: string): Promise<ApiResponse<SinhVien>> => {
    const res = await apiClient.get<ApiResponse<SinhVien>>(`/api/sinh-vien/${mssv}`)
    return res.data
  },

  /**
   * Download Excel theo filter hiện tại.
   * @param scope 'filtered' = toàn bộ kết quả lọc, 'page' = chỉ trang hiện tại
   */
  exportExcel: async (params: SinhVienSearchParams = {}, scope: 'filtered' | 'page' = 'filtered'): Promise<Blob> => {
    const searchParams = new URLSearchParams()
    if (params.keyword) searchParams.append('keyword', params.keyword)
    if (params.trangThaiHocVu) searchParams.append('trangThaiHocVu', params.trangThaiHocVu)
    if (params.nganh) searchParams.append('nganh', params.nganh)
    if (params.lop) searchParams.append('lop', params.lop)
    if (params.khoaNamNhapHoc) searchParams.append('khoaNamNhapHoc', params.khoaNamNhapHoc)
    if (params.khoa) searchParams.append('khoa', params.khoa)
    if (params.heDaoTao) searchParams.append('heDaoTao', params.heDaoTao)
    if (scope === 'page') {
      if (params.page !== undefined) searchParams.append('page', String(params.page))
      if (params.size !== undefined) searchParams.append('size', String(params.size))
    }
    searchParams.append('scope', scope)

    const res = await apiClient.get(`/api/sinh-vien/export?${searchParams.toString()}`, {
      responseType: 'blob',
    })
    return res.data as Blob
  },

  /**
   * Download file Excel mẫu để import.
   */
  downloadTemplate: async (): Promise<Blob> => {
    const res = await apiClient.get('/api/sinh-vien/import-template', {
      responseType: 'blob',
    })
    return res.data as Blob
  },

  /**
   * Upload file Excel để import.
   * - Nếu MSSV đã tồn tại: cập nhật (upsert).
   * - Nếu chưa có: tạo mới.
   */
  importExcel: async (file: File): Promise<ApiResponse<ImportResult>> => {
    const form = new FormData()
    form.append('file', file)
    const res = await apiClient.post<ApiResponse<ImportResult>>('/api/sinh-vien/import', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return res.data
  },
}

/**
 * Helper: trigger browser download cho Blob (Excel/PDF/...).
 */
export function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}