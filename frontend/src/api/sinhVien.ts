import { apiClient } from './client'
import type { ApiResponse, SinhVienPagedResponse, SinhVienSearchParams, SinhVien } from './types'

/**
 * SinhVien API client.
 * Endpoints:
 * - GET /api/sinh-vien (search, filter, paginate)
 * - GET /api/sinh-vien/:mssv (get detail)
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
    
    const response = await apiClient.get<ApiResponse<SinhVienPagedResponse>>(url)
    return response.data
  },

  /**
   * Get student detail by MSSV.
   */
  getByMssv: async (mssv: string): Promise<ApiResponse<SinhVien>> => {
    const response = await apiClient.get<ApiResponse<SinhVien>>(`/api/sinh-vien/${mssv}`)
    return response.data
  },
}
