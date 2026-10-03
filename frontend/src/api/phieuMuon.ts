import { apiClient } from './client'
import type { ApiResponse, PhieuMuon, PagedResponse, SinhVien, HoSoGiayTo } from './types'

/**
 * PhieuMuon (Phiếu xuất hồ sơ) API client.
 *
 * Endpoints (backend — PhieuXuatHoSoController):
 * - GET    /api/phieu-muon/dang-muon
 * - GET    /api/phieu-muon/lich-su
 * - GET    /api/phieu-muon/{maPhieu}
 * - POST   /api/phieu-muon                    — tạo phiếu mới
 * - PUT    /api/phieu-muon/{maPhieu}/tra      — trả hồ sơ
 *
 * Lookup liên quan:
 * - GET    /api/sinh-vien/{mssv}              — chi tiết SV (lookup khi tạo phiếu)
 * - GET    /api/ho-so-giay-to?mssv=...        — danh sách hồ sơ giấy tờ của SV
 */
export const phieuMuonApi = {
  /** Lấy danh sách hồ sơ đang mượn. */
  getDangMuon: async (params: {
    keyword?: string
    trangThai?: string
    loaiHoSo?: string
    page?: number
    size?: number
  } = {}): Promise<ApiResponse<PagedResponse<PhieuMuon[]>>> => {
    const sp = new URLSearchParams()
    if (params.keyword) sp.append('keyword', params.keyword)
    if (params.trangThai) sp.append('trangThai', params.trangThai)
    if (params.loaiHoSo) sp.append('loaiHoSo', params.loaiHoSo)
    if (params.page !== undefined) sp.append('page', String(params.page))
    if (params.size !== undefined) sp.append('size', String(params.size))

    const qs = sp.toString()
    const url = qs ? `/api/phieu-muon/dang-muon?${qs}` : '/api/phieu-muon/dang-muon'
    const res = await apiClient.get<ApiResponse<PagedResponse<PhieuMuon[]>>>(url)
    return res.data
  },

  /** Lấy lịch sử mượn / trả. */
  getLichSu: async (params: {
    keyword?: string
    trangThai?: string
    loaiHoSo?: string
    fromDate?: string
    toDate?: string
    page?: number
    size?: number
  } = {}): Promise<ApiResponse<PagedResponse<PhieuMuon[]>>> => {
    const sp = new URLSearchParams()
    if (params.keyword) sp.append('keyword', params.keyword)
    if (params.trangThai) sp.append('trangThai', params.trangThai)
    if (params.loaiHoSo) sp.append('loaiHoSo', params.loaiHoSo)
    if (params.fromDate) sp.append('fromDate', params.fromDate)
    if (params.toDate) sp.append('toDate', params.toDate)
    if (params.page !== undefined) sp.append('page', String(params.page))
    if (params.size !== undefined) sp.append('size', String(params.size))

    const qs = sp.toString()
    const url = qs ? `/api/phieu-muon/lich-su?${qs}` : '/api/phieu-muon/lich-su'
    const res = await apiClient.get<ApiResponse<PagedResponse<PhieuMuon[]>>>(url)
    return res.data
  },

  /** Tạo phiếu mượn / rút hồ sơ mới. */
  create: async (body: {
    mssv: string
    loaiPhieu: string
    ngayMuon: string
    ngayTraDuKien?: string
    lyDo: string
    ghiChu?: string
    danhSachMaHoSo: string[]
  }): Promise<ApiResponse<PhieuMuon>> => {
    const res = await apiClient.post<ApiResponse<PhieuMuon>>('/api/phieu-muon', body)
    return res.data
  },

  /** Trả hồ sơ. */
  tra: async (maPhieu: string, body: { ghiChu?: string } = {}): Promise<ApiResponse<PhieuMuon>> => {
    const res = await apiClient.put<ApiResponse<PhieuMuon>>(
      `/api/phieu-muon/${encodeURIComponent(maPhieu)}/tra`,
      body
    )
    return res.data
  },

  /**
   * Lấy danh sách phiếu đang hoạt động (Chờ duyệt / Đang mượn / Quá hạn) của 1 SV.
   * Endpoint: GET /api/phieu-muon/by-mssv/{mssv}
   */
  getActiveByMssv: async (mssv: string): Promise<ApiResponse<PhieuMuon[]>> => {
    const res = await apiClient.get<ApiResponse<PhieuMuon[]>>(
      `/api/phieu-muon/by-mssv/${encodeURIComponent(mssv)}`
    )
    return res.data
  },

  /**
   * Duyệt phiếu: Chờ duyệt → Đang mượn (Mượn tạm thời) / Hoàn tất (Rút vĩnh viễn).
   * Endpoint: PUT /api/phieu-muon/{maPhieu}/duyet
   */
  duyet: async (maPhieu: string): Promise<ApiResponse<PhieuMuon>> => {
    const res = await apiClient.put<ApiResponse<PhieuMuon>>(
      `/api/phieu-muon/${encodeURIComponent(maPhieu)}/duyet`
    )
    return res.data
  },

  /**
   * Từ chối phiếu: Chờ duyệt → Từ chối.
   * Endpoint: PUT /api/phieu-muon/{maPhieu}/tu-choi
   * Body (optional): { lyDoTuChoi: "..." }
   */
  tuChoi: async (
    maPhieu: string,
    body: { lyDoTuChoi?: string } = {}
  ): Promise<ApiResponse<PhieuMuon>> => {
    const res = await apiClient.put<ApiResponse<PhieuMuon>>(
      `/api/phieu-muon/${encodeURIComponent(maPhieu)}/tu-choi`,
      body
    )
    return res.data
  },
}

/** Lookup helpers dùng chung trong trang mượn / trả. */
export const lookupApi = {
  /** Lấy chi tiết 1 sinh viên theo MSSV. Trả về null nếu không tồn tại. */
  getSinhVien: async (mssv: string): Promise<SinhVien | null> => {
    try {
      const res = await apiClient.get<ApiResponse<SinhVien>>(
        `/api/sinh-vien/${encodeURIComponent(mssv)}`
      )
      if (res.data?.success && res.data.data) return res.data.data
      return null
    } catch {
      return null
    }
  },

  /** Lấy danh sách hồ sơ giấy tờ của 1 sinh viên. */
  getHoSoGiayTo: async (mssv: string): Promise<HoSoGiayTo[]> => {
    try {
      const res = await apiClient.get<ApiResponse<HoSoGiayTo[]>>(
        `/api/ho-so-giay-to?mssv=${encodeURIComponent(mssv)}`
      )
      if (res.data?.success && Array.isArray(res.data.data)) return res.data.data
      return []
    } catch {
      return []
    }
  },
}