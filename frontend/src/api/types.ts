/**
 * User information returned from authentication endpoints.
 */
export interface User {
  id: string
  username: string
  hoTen: string
  email: string | null
  role: string
}

/**
 * Token information from authentication response.
 */
export interface TokenResponse {
  accessToken: string
  refreshToken: string | null
  tokenType: string
  expiresIn: number
}

/**
 * Full authentication response containing user and token data.
 */
export interface AuthResponse {
  user: User
  token: TokenResponse
}

/**
 * Standard API response wrapper used by all backend endpoints.
 */
export interface ApiResponse<T> {
  success: boolean
  status: number
  code: string
  message: string
  data: T
  timestamp: string
}

/**
 * Error response structure for failed API requests.
 */
export interface ApiError {
  success: boolean
  status: number
  code: string
  message: string
  errors: Array<{ field: string; message: string }> | null
  timestamp: string
}

/**
 * SinhVien data from backend API (GET /api/sinh-vien/{mssv}).
 * 
 * Backend trả về các trường đã được map đúng nghĩa:
 * - nganh: tên ngành từ danh mục (VD: "Công nghệ thông tin")
 * - lop: tên lớp từ danh mục (VD: "K14CTXHB")
 * - khoa: số khóa (VD: "Khóa 14")
 * - khoaNamHoc: năm học (VD: "2026–2029")
 * - heDaoTao: hệ đào tạo (VD: "Chính quy")
 * - trangThaiHocVu: trạng thái học vụ (enum name, VD: "ĐANG_HỌC")
 */
export interface SinhVien {
  mssv: string
  hoTen: string
  ngaySinh: string | null
  gioiTinh: string | null
  cccd: string | null
  sdt: string | null
  email: string | null
  queQuan: string | null
  /** Tên ngành từ danh mục. VD: "Công nghệ thông tin" */
  nganh: string | null
  /** Tên lớp từ danh mục. VD: "K14CTXHB" */
  lop: string | null
  /** Số khóa. VD: "Khóa 14" */
  khoa: string | null
  /** Năm học. VD: "2026–2029" */
  khoaNamHoc: string | null
  /** Hệ đào tạo. VD: "Chính quy" */
  heDaoTao: string | null
  /** Trạng thái học vụ (enum name). VD: "ĐANG_HỌC", "BẢO_LƯU" */
  trangThaiHocVu: string
  ngayTao: string
  ngayCapNhat: string | null
}

/**
 * Page metadata from backend.
 */
export interface PageMetadata {
  page: number
  size: number
  totalElements: number
  totalPages: number
}

/**
 * Generic paged wrapper used by backend (see backend PagedResponse.java).
 * Field `data` chứa list các phần tử, `page` chứa metadata.
 */
export interface PagedResponse<T> {
  data: T
  page: PageMetadata
}

/**
 * PhieuMuon (Phiếu xuất hồ sơ) — ánh xạ backend PhieuMuonResponse.
 *
 * Field date dùng string ISO ('YYYY-MM-DD' hoặc 'YYYY-MM-DDTHH:mm:ss')
 * do axios tự parse JSON; UI có thể dùng new Date(...) trực tiếp.
 */
export interface PhieuMuon {
  maPhieu: string
  mssv: string
  hoTenSinhVien: string | null
  loaiPhieu: string
  trangThai: string
  lyDo: string | null
  ngayMuon: string | null
  ngayTraDuKien: string | null
  ngayTraThucTe: string | null
  ghiChu: string | null
  nguoiTao: string | null
  ngayTao: string | null
  ngayCapNhat: string | null
  /** Danh sách mã hồ sơ giấy tờ thuộc phiếu. */
  danhSachMaHoSo?: string[] | null
  soLuongHoSo: number
}

/**
 * Paged response from backend for sinh-vien API.
 */
export interface SinhVienPagedResponse {
  data: SinhVien[]
  page: PageMetadata
}

/**
 * HoSoGiayTo data from backend API.
 */
export interface HoSoGiayTo {
  maHoSo: string
  mssv: string
  maLoai: string
  trangThaiNop: string
  banGocBanSao: string | null
  fileDinhKem: string | null
  viTriLuuKho: string | null
  ngayTao: string
  ngayCapNhat: string | null
}

/**
 * LoaiGiayTo data from backend API.
 */
export interface LoaiGiayTo {
  maLoai: string
  tenGiayTo: string
  moTa: string | null
  batBuoc: boolean
  dangSuDung: boolean
  thuTuHienThi: number | null
  ngayTao: string
}

/**
 * Search/filter params for sinh-vien API.
 */
export interface SinhVienSearchParams {
  keyword?: string
  trangThaiHocVu?: string
  nganh?: string
  lop?: string
  khoaNamNhapHoc?: string
  khoa?: string
  heDaoTao?: string
  page?: number
  size?: number
  sortDirection?: number
}
