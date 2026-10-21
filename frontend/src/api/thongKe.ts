import { apiClient } from './client'
import type { ApiResponse } from './types'

/**
 * API thống kê tổng hợp cho trang Báo cáo - Thống kê.
 *
 * ENDPOINTS:
 * - GET /api/sinh-vien/stats              ✅ Tổng quan sinh viên
 * - GET /api/thong-ke/sinh-vien-theo-nganh  ✅ Thống kê theo ngành
 * - GET /api/thong-ke/ho-so                ✅ Tổng quan hồ sơ
 * - GET /api/thong-ke/muon-tra             ✅ Thống kê mượn/trả
 */

// ====================== TYPES ======================

/**
 * Response từ GET /api/sinh-vien/stats
 * Backend trả về Map<String, Object> nên cần xử lý type an toàn
 */
export interface SinhVienStatsResponse {
  tongSoSinhVien: number
  dangHoc: number
  totNghiep: number
  baoLuu: number
  dinhChi: number
  daRutHoSo: number
}

// Helper type cho raw response từ backend (Map<String, Object>)
export interface SinhVienStatsRaw {
  tongSoSinhVien: number | string
  dangHoc: number | string
  totNghiep: number | string
  baoLuu: number | string
  dinhChi: number | string
  daRutHoSo: number | string
}

/**
 * Response từ GET /api/thong-ke/sinh-vien-theo-nganh
 */
export interface ThongKeNganhResponse {
  nganhList: ThongKeNganhItem[]
  tongSoTrongLoc: number
  tongSoHeThong: number
}

/**
 * Một dòng trong bảng thống kê theo ngành.
 */
export interface ThongKeNganhItem {
  tenNganh: string
  nganh: string
  soLuong: number
  tyLePhanTram: number
}

/**
 * Response từ GET /api/thong-ke/ho-so
 * 
 * Quy tắc:
 * - Chỉ 8 giấy tờ bắt buộc (GT01-GT08) được tính
 * - Hồ sơ đầy đủ = sinh viên có đủ 8/8 giấy tờ bắt buộc với trạng thái "Đã nộp"
 * - Hồ sơ còn thiếu = sinh viên còn thiếu ít nhất 1 giấy tờ bắt buộc
 */
export interface ThongKeHoSoResponse {
  tongSoSinhVien: number
  hoSoDayDu: number
  hoSoConThieu: number
  soGiayToBatBuoc: number
}

/**
 * Response từ GET /api/thong-ke/muon-tra
 * 
 * Quy tắc:
 * - Chỉ đếm phiếu "Mượn tạm thời"
 * - Đang mượn: trạng thái "Đang mượn"
 * - Đã trả: trạng thái "Đã trả"
 * - Quá hạn: trạng thái "Quá hạn"
 */
export interface ThongKeMuonTraResponse {
  dangMuon: number
  daTra: number
  quaHan: number
}

// ====================== API CLIENT ======================

/**
 * Convert number|string từ API response thành number an toàn
 */
function toNumber(value: number | string | null | undefined): number {
  if (value === null || value === undefined) return 0
  if (typeof value === 'number') return value
  const parsed = parseInt(String(value), 10)
  return isNaN(parsed) ? 0 : parsed
}

/**
 * Convert raw API response (Map<String, Object>) thành typed response
 */
function normalizeSinhVienStats(raw: SinhVienStatsRaw): SinhVienStatsResponse {
  return {
    tongSoSinhVien: toNumber(raw.tongSoSinhVien),
    dangHoc: toNumber(raw.dangHoc),
    totNghiep: toNumber(raw.totNghiep),
    baoLuu: toNumber(raw.baoLuu),
    dinhChi: toNumber(raw.dinhChi),
    daRutHoSo: toNumber(raw.daRutHoSo),
  }
}

export const thongKeApi = {
  /**
   * Lấy tổng quan sinh viên (6 chỉ số).
   * Backend: GET /api/sinh-vien/stats
   * Backend trả về Map<String, Object> nên cần normalize
   */
  getSinhVienStats: async (): Promise<ApiResponse<SinhVienStatsResponse>> => {
    const response = await apiClient.get<ApiResponse<SinhVienStatsRaw>>('/api/sinh-vien/stats')
    // Normalize raw response thành typed response
    const normalizedData = normalizeSinhVienStats(response.data.data as unknown as SinhVienStatsRaw)
    return {
      ...response.data,
      data: normalizedData,
    }
  },

  /**
   * Lấy thống kê sinh viên theo ngành.
   * Backend: GET /api/thong-ke/sinh-vien-theo-nganh?khoaHocId={id}
   *
   * @param khoaHocId - ID khóa học để filter (undefined = tất cả)
   */
  getSinhVienTheoNganh: async (khoaHocId?: number): Promise<ApiResponse<ThongKeNganhResponse>> => {
    const params = khoaHocId !== undefined ? { khoaHocId } : {}
    const response = await apiClient.get<ApiResponse<ThongKeNganhResponse>>(
      '/api/thong-ke/sinh-vien-theo-nganh',
      { params }
    )
    return response.data
  },

  /**
   * Lấy tổng quan hồ sơ toàn hệ thống.
   * Backend: GET /api/thong-ke/ho-so
   */
  getThongKeHoSo: async (): Promise<ApiResponse<ThongKeHoSoResponse>> => {
    const response = await apiClient.get<ApiResponse<ThongKeHoSoResponse>>('/api/thong-ke/ho-so')
    return response.data
  },

  /**
   * Lấy thống kê mượn/trả hồ sơ.
   * Backend: GET /api/thong-ke/muon-tra
   */
  getThongKeMuonTra: async (): Promise<ApiResponse<ThongKeMuonTraResponse>> => {
    const response = await apiClient.get<ApiResponse<ThongKeMuonTraResponse>>('/api/thong-ke/muon-tra')
    return response.data
  },
}
