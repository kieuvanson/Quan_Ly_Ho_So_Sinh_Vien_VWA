import { apiClient } from './client'
import type {
  ApiResponse, HoSoGiayTo, HoSoGiayToListItem, HoSoGiayToSearchParams,
  LoaiGiayTo, PagedResponse,
} from './types'

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
   * Get document by maHoSo.
   */
  getByMaHoSo: async (maHoSo: string): Promise<ApiResponse<HoSoGiayTo>> => {
    const response = await apiClient.get<ApiResponse<HoSoGiayTo>>(
      `/api/ho-so-giay-to/${encodeURIComponent(maHoSo)}`
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

  /**
   * Delete document by maHoSo.
   */
  delete: async (maHoSo: string): Promise<ApiResponse<void>> => {
    const response = await apiClient.delete<ApiResponse<void>>(
      `/api/ho-so-giay-to/${encodeURIComponent(maHoSo)}`
    )
    return response.data
  },

  /**
   * Tìm kiếm phân trang hồ sơ giấy tờ (kèm thông tin sinh viên) cho bảng
   * "Danh sách hồ sơ giấy tờ".
   *
   * @param params.keyword         tìm trên MSSV hoặc họ tên
   * @param params.maLoai          mã loại (GT01..GT13)
   * @param params.trangThaiNop    Chưa nộp / Đã nộp / Thiếu / Không hợp lệ
   * @param params.nganhId         lọc theo ngành SV
   * @param params.lopId           lọc theo lớp SV
   * @param params.khoaHocId       lọc theo khóa học SV
   * @param params.trangThaiHocVu  Đang_học / Bảo_lưu / Đình_chỉ / Tốt_nghiệp / Đã_rút_hồ_sơ
   * @param params.page            0-based
   * @param params.size            kích thước trang (mặc định 25)
   */
  searchList: async (
    params: HoSoGiayToSearchParams
  ): Promise<ApiResponse<PagedResponse<HoSoGiayToListItem[]>>> => {
    const sp = new URLSearchParams()
    if (params.keyword) sp.append('keyword', params.keyword)
    if (params.maLoai) sp.append('maLoai', params.maLoai)
    if (params.trangThaiNop) sp.append('trangThaiNop', params.trangThaiNop)
    if (params.nganhId !== undefined) sp.append('nganhId', String(params.nganhId))
    if (params.lopId !== undefined) sp.append('lopId', String(params.lopId))
    if (params.khoaHocId !== undefined) sp.append('khoaHocId', String(params.khoaHocId))
    if (params.trangThaiHocVu) sp.append('trangThaiHocVu', params.trangThaiHocVu)
    sp.append('page', String(params.page ?? 0))
    sp.append('size', String(params.size ?? 25))
    const response = await apiClient.get<ApiResponse<PagedResponse<HoSoGiayToListItem[]>>>(
      `/api/ho-so-giay-to/all?${sp.toString()}`
    )
    return response.data
  },
}

/**
 * LoaiGiayTo API client.
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
   * Get mandatory document types only.
   */
  getBatBuoc: async (): Promise<ApiResponse<LoaiGiayTo[]>> => {
    const response = await apiClient.get<ApiResponse<LoaiGiayTo[]>>('/api/loai-giay-to/bat-buoc')
    return response.data
  },
}
