import { apiClient } from './client'
import type { ApiResponse, PhieuMuon, PagedResponse } from './types'

/**
 * PhieuMuon (Phiếu xuất hồ sơ) API client.
 *
 * Endpoints (backend — PhieuXuatHoSoController):
 * - GET /api/phieu-muon/dang-muon?keyword=&trangThai=&loaiHoSo=&page=&size=
 * - GET /api/phieu-muon/lich-su?keyword=&trangThai=&loaiHoSo=&fromDate=&toDate=&page=&size=
 */
export const phieuMuonApi = {
  /**
   * Lấy danh sách hồ sơ đang mượn (mỗi dòng = 1 phiếu xuất hồ sơ).
   *
   * @param params.keyword    Tìm theo maPhieu | mssv | hoTen | lyDo
   * @param params.trangThai  Mặc định 'Đang mượn' nếu không truyền (server-side default)
   * @param params.loaiHoSo   'Mượn tạm thời' | 'Rút vĩnh viễn'
   * @param params.page       Trang (0-based)
   * @param params.size       Số dòng / trang (tối đa 100)
   */
  getDangMuon: async (params: {
    keyword?: string
    trangThai?: string
    loaiHoSo?: string
    page?: number
    size?: number
  } = {}): Promise<ApiResponse<PagedResponse<PhieuMuon[]>>> => {
    const searchParams = new URLSearchParams()
    if (params.keyword) searchParams.append('keyword', params.keyword)
    if (params.trangThai) searchParams.append('trangThai', params.trangThai)
    if (params.loaiHoSo) searchParams.append('loaiHoSo', params.loaiHoSo)
    if (params.page !== undefined) searchParams.append('page', String(params.page))
    if (params.size !== undefined) searchParams.append('size', String(params.size))

    const queryString = searchParams.toString()
    const url = queryString
      ? `/api/phieu-muon/dang-muon?${queryString}`
      : '/api/phieu-muon/dang-muon'

    const res = await apiClient.get<ApiResponse<PagedResponse<PhieuMuon[]>>>(url)
    return res.data
  },

  /**
   * Lấy lịch sử mượn / trả (mỗi dòng = 1 phiếu, MỌI trạng thái).
   *
   * @param params.keyword    Tìm theo maPhieu | mssv | hoTen | lyDo
   * @param params.trangThai  Optional. Lọc theo 1 trong 7 giá trị ENUM.
   * @param params.loaiHoSo   'Mượn tạm thời' | 'Rút vĩnh viễn'
   * @param params.fromDate   yyyy-MM-dd — lọc phiếu có ngayTao >= fromDate
   * @param params.toDate     yyyy-MM-dd — lọc phiếu có ngayTao < toDate + 1 day
   * @param params.page       Trang (0-based)
   * @param params.size       Số dòng / trang (tối đa 100)
   */
  getLichSu: async (params: {
    keyword?: string
    trangThai?: string
    loaiHoSo?: string
    fromDate?: string
    toDate?: string
    page?: number
    size?: number
  } = {}): Promise<ApiResponse<PagedResponse<PhieuMuon[]>>> => {
    const searchParams = new URLSearchParams()
    if (params.keyword) searchParams.append('keyword', params.keyword)
    if (params.trangThai) searchParams.append('trangThai', params.trangThai)
    if (params.loaiHoSo) searchParams.append('loaiHoSo', params.loaiHoSo)
    if (params.fromDate) searchParams.append('fromDate', params.fromDate)
    if (params.toDate) searchParams.append('toDate', params.toDate)
    if (params.page !== undefined) searchParams.append('page', String(params.page))
    if (params.size !== undefined) searchParams.append('size', String(params.size))

    const queryString = searchParams.toString()
    const url = queryString
      ? `/api/phieu-muon/lich-su?${queryString}`
      : '/api/phieu-muon/lich-su'

    const res = await apiClient.get<ApiResponse<PagedResponse<PhieuMuon[]>>>(url)
    return res.data
  },
}