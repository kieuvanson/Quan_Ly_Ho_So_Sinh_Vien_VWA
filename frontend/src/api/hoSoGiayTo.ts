import { apiClient } from './client'
import type { ApiResponse, HoSoGiayTo } from './types'

/**
 * HoSoGiayTo API client.
 *
 * Endpoints (backend — HoSoGiayToController):
 * - GET    /api/ho-so-giay-to?mssv=...               — list giấy tờ của 1 SV
 * - GET    /api/ho-so-giay-to/{maHoSo}               — chi tiết 1 giấy tờ
 * - POST   /api/ho-so-giay-to?mssv=...&maLoai=...    — tạo mới (bổ sung)
 * - PUT    /api/ho-so-giay-to/{maHoSo}               — cập nhật thông tin
 * - PATCH  /api/ho-so-giay-to/{maHoSo}/trang-thai    — cập nhật trạng thái nộp
 * - DELETE /api/ho-so-giay-to/{maHoSo}               — xóa
 * - GET    /api/ho-so-giay-to/stats?mssv=...         — thống kê
 */
export const hoSoGiayToApi = {
  /**
   * Lấy danh sách giấy tờ của 1 sinh viên theo MSSV.
   */
  getByMssv: async (mssv: string): Promise<ApiResponse<HoSoGiayTo[]>> => {
    const response = await apiClient.get<ApiResponse<HoSoGiayTo[]>>(
      `/api/ho-so-giay-to?mssv=${encodeURIComponent(mssv)}`
    )
    return response.data
  },

  /**
   * Bổ sung 1 hồ sơ giấy tờ mới cho sinh viên.
   *
   * @param mssv    MSSV sinh viên
   * @param maLoai  Mã loại giấy tờ (GT01..GT13)
   * @param body    Thông tin bổ sung
   */
  create: async (
    mssv: string,
    maLoai: string,
    body: {
      trangThaiNop?: string
      banGocBanSao?: string
      viTriLuuKho?: string
      fileDinhKem?: string
      ghiChu?: string
    } = {}
  ): Promise<ApiResponse<HoSoGiayTo>> => {
    const response = await apiClient.post<ApiResponse<HoSoGiayTo>>(
      `/api/ho-so-giay-to?mssv=${encodeURIComponent(mssv)}&maLoai=${encodeURIComponent(maLoai)}`,
      body
    )
    return response.data
  },

  /**
   * Cập nhật toàn bộ thông tin 1 hồ sơ giấy tờ.
   * Nếu trạng thái nộp thay đổi sẽ tự động ghi LichSuNop.
   */
  update: async (
    maHoSo: string,
    body: {
      trangThaiNop?: string
      banGocBanSao?: string
      viTriLuuKho?: string
      fileDinhKem?: string
      ghiChu?: string
    } = {}
  ): Promise<ApiResponse<HoSoGiayTo>> => {
    const response = await apiClient.put<ApiResponse<HoSoGiayTo>>(
      `/api/ho-so-giay-to/${encodeURIComponent(maHoSo)}`,
      body
    )
    return response.data
  },

  /**
   * Cập nhật nhanh trạng thái nộp (tick / bỏ tick checkbox).
   * Tự động ghi LichSuNop với hành động tương ứng.
   */
  capNhatTrangThai: async (
    maHoSo: string,
    trangThaiMoi: string,
    ghiChu?: string
  ): Promise<ApiResponse<HoSoGiayTo>> => {
    const sp = new URLSearchParams()
    sp.append('trangThaiMoi', trangThaiMoi)
    if (ghiChu) sp.append('ghiChu', ghiChu)
    const response = await apiClient.patch<ApiResponse<HoSoGiayTo>>(
      `/api/ho-so-giay-to/${encodeURIComponent(maHoSo)}/trang-thai?${sp.toString()}`
    )
    return response.data
  },
}