import { apiClient } from './client'
import type { ApiResponse, PagedResponse } from './types'

/**
 * LichSuNop (lịch sử nộp giấy tờ) API client.
 *
 * Endpoints (backend — LichSuNopController):
 * - GET  /api/lich-su-nop/all?keyword=&hanhDong=&nguoiThucHien=&fromDate=&toDate=&page=&size=
 *          — danh sách lịch sử nộp trên toàn hệ thống (có lọc + phân trang).
 * - GET  /api/lich-su-nop?mssv=XXX&page=&size=
 *          — lịch sử nộp của 1 sinh viên (mssv BẮT BUỘC).
 * - GET  /api/lich-su-nop/ho-so/{maHoSo}  — lịch sử nộp của 1 hồ sơ giấy tờ.
 * - GET  /api/lich-su-nop/{maLog}           — chi tiết 1 bản ghi lịch sử.
 */

/** Một bản ghi lịch sử nộp — ánh xạ backend LichSuNopResponse. */
export interface LichSuNop {
  maLog: string
  maHoSo: string
  mssv: string
  /** Họ tên sinh viên (backend join bảng sinhvien). */
  hoTenSinhVien: string | null
  /** Tên loại giấy tờ (backend join bảng loai_giay_to). */
  tenGiayTo: string | null
  /** Hành động: "Nop giay to", "Huy nop", "Danh dau thieu", ... */
  hanhDong: string
  trangThaiCu: string | null
  trangThaiMoi: string | null
  ghiChu: string | null
  nguoiThucHien: string | null
  /** ISO-8601 timestamp. */
  thoiGian: string
}

/** Filter cho {@link lichSuNopApi.searchAll}. */
export interface LichSuNopSearchParams {
  /** Từ khoá: MSSV, họ tên SV, tên giấy tờ, hành động, ghi chú. */
  keyword?: string
  /** Hành động (VD: "Nop giay to"). */
  hanhDong?: string
  /** Username cán bộ thực hiện. */
  nguoiThucHien?: string
  /** Ngày bắt đầu (yyyy-MM-dd). */
  fromDate?: string
  /** Ngày kết thúc (yyyy-MM-dd). */
  toDate?: string
  /** Trang 0-based. */
  page?: number
  /** Số bản ghi mỗi trang. */
  size?: number
}

export const lichSuNopApi = {
  /**
   * Lấy lịch sử nộp giấy tờ trên toàn hệ thống, có lọc + phân trang.
   *
   * Dùng cho tab "Lịch sử hồ sơ & giấy tờ" của màn hình Lịch sử hoạt động.
   */
  searchAll: async (
    params: LichSuNopSearchParams = {}
  ): Promise<ApiResponse<PagedResponse<LichSuNop[]>>> => {
    const sp = new URLSearchParams()
    if (params.keyword) sp.append('keyword', params.keyword)
    if (params.hanhDong) sp.append('hanhDong', params.hanhDong)
    if (params.nguoiThucHien) sp.append('nguoiThucHien', params.nguoiThucHien)
    if (params.fromDate) sp.append('fromDate', params.fromDate)
    if (params.toDate) sp.append('toDate', params.toDate)
    sp.append('page', String(params.page ?? 0))
    sp.append('size', String(params.size ?? 20))

    const res = await apiClient.get<ApiResponse<PagedResponse<LichSuNop[]>>>(
      `/api/lich-su-nop/all?${sp.toString()}`
    )
    return res.data
  },

  /** Lấy chi tiết một bản ghi lịch sử nộp theo mã log. */
  getByMaLog: async (maLog: string): Promise<ApiResponse<LichSuNop>> => {
    const res = await apiClient.get<ApiResponse<LichSuNop>>(
      `/api/lich-su-nop/${encodeURIComponent(maLog)}`
    )
    return res.data
  },

  /** Lấy lịch sử nộp của 1 sinh viên theo MSSV. */
  getByMssv: async (
    mssv: string,
    page = 0,
    size = 20
  ): Promise<ApiResponse<{ content: LichSuNop[]; page: number; size: number; totalElements: number }>> => {
    const sp = new URLSearchParams()
    sp.append('mssv', mssv)
    sp.append('page', String(page))
    sp.append('size', String(size))
    const res = await apiClient.get<
      ApiResponse<{ content: LichSuNop[]; page: number; size: number; totalElements: number }>
    >(`/api/lich-su-nop?${sp.toString()}`)
    return res.data
  },
}
