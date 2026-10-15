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
 * Row phẳng cho bảng "Danh sách hồ sơ giấy tờ" trên frontend.
 * Trả về từ {@code GET /api/ho-so-giay-to/all}.
 *
 * Projection từ {@code ho_so_giay_to JOIN sinhvien JOIN loai_giay_to}.
 */
export interface HoSoGiayToListItem {
  maHoSo: string
  mssv: string
  maLoai: string
  tenLoai: string
  loaiBatBuoc: boolean | null
  trangThaiNop: string
  banGocBanSao: string | null
  fileDinhKem: string | null
  viTriLuuKho: string | null
  hoTen: string
  tenNganh: string
  tenLop: string
  tenKhoa: string
  trangThaiHocVu: string
  ngayTao: string
  ngayCapNhat: string | null
}

/** Filter cho {@code hoSoGiayToApi.searchList}. */
export interface HoSoGiayToSearchParams {
  keyword?: string
  maLoai?: string
  trangThaiNop?: string
  nganhId?: number
  lopId?: number
  khoaHocId?: number
  trangThaiHocVu?: string
  page?: number
  size?: number
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

export interface LoaiGiayToRequest {
  tenGiayTo: string
  moTa?: string | null
  batBuoc?: boolean
  dangSuDung?: boolean
  thuTuHienThi?: number | null
}

export interface Khoa {
  id: number
  maKhoa: string
  tenKhoa: string
  moTa: string | null
  dangSuDung: boolean
}

export interface Nganh {
  id: number
  maNganh: string
  tenNganh: string
  khoa: { id: number; tenKhoa: string } | null
  moTa: string | null
  dangSuDung: boolean
}

export interface KhoaHoc {
  id: number
  maKhoaHoc: string
  tenKhoaHoc: string
  namBatDau: number | null
  namKetThuc: number | null
  moTa: string | null
  dangSuDung: boolean
}

export interface Lop {
  id: number
  maLop: string
  tenLop: string
  nganh: { id: number; tenNganh: string; khoa?: { id: number; tenKhoa: string } | null } | null
  /** Khoa suy ra từ nganh.khoa (Lớp không có khoa trực tiếp). */
  khoa: { id: number; tenKhoa: string } | null
  khoaHoc: {
    id: number
    tenKhoaHoc: string
    namBatDau: number | null
    namKetThuc: number | null
  } | null
  moTa: string | null
  dangSuDung: boolean
}

// ============ Request DTOs (backend CRUD) ============

export interface KhoaRequest {
  tenKhoa: string
  moTa?: string | null
  dangSuDung?: boolean
}

export interface NganhRequest {
  // KhoaId là bắt buộc - Ngành phải thuộc một Khoa chuyên môn
  khoaId: number
  tenNganh: string
  moTa?: string | null
  dangSuDung?: boolean
}

export interface KhoaHocRequest {
  tenKhoaHoc: string
  namBatDau?: number | null
  namKetThuc?: number | null
  moTa?: string | null
  dangSuDung?: boolean
}

export interface LopRequest {
  tenLop: string
  nganhId: number
  khoaHocId: number
  moTa?: string | null
  dangSuDung?: boolean
}

/**
 * Trạng thái học vụ — ENUM cố định từ backend, chỉ đọc.
 */
export interface TrangThaiHocVuItem {
  ma: string
  ten: string
  moTa: string
  mauHienThi: string
}

/**
 * Trạng thái nộp giấy tờ — ENUM cố định từ backend, chỉ đọc.
 */
export interface TrangThaiNopItem {
  ma: string
  ten: string
  moTa: string
  mauHienThi: string
}

/**
 * Trạng thái phiếu xuất hồ sơ — ENUM cố định từ backend, chỉ đọc.
 */
export interface TrangThaiPhieuItem {
  ma: string
  ten: string
  moTa: string
  mauHienThi: string
}

/**
 * Search/filter params for sinh-vien API.
 *
 * <p>UI giữ nhãn tiếng Việt cho dropdown, nhưng khi gọi API ưu tiên truyền
 * {@code *_id} (Integer) để backend truy vấn theo đúng khóa ngoại. Các field
 * String cũ vẫn được giữ để tương thích ngược; backend sẽ tự resolve.</p>
 */
export interface SinhVienSearchParams {
  /** Từ khóa tìm theo họ tên, MSSV, CCCD. */
  keyword?: string
  /** Tên/giá trị trạng thái học vụ (UI label, vd: "Đang học" → backend enum). */
  trangThaiHocVu?: string

  /** Tên ngành — fallback nếu chưa có {@link nganhId}. */
  nganh?: string
  /** Tên lớp — fallback nếu chưa có {@link lopId}. */
  lop?: string
  /** Tên khóa học (niên khóa) — fallback nếu chưa có {@link khoaHocId}. */
  khoaNamNhapHoc?: string
  /** Tên khoa chuyên môn — fallback nếu chưa có {@link khoaId}. */
  khoa?: string

  /** Hệ đào tạo. */
  heDaoTao?: string

  /** ID ngành (ưu tiên hơn {@link nganh}). Backend filter theo {@code sinhvien.nganh_id}. */
  nganhId?: number
  /** ID lớp (ưu tiên hơn {@link lop}). Backend filter theo {@code sinhvien.lop_id}. */
  lopId?: number
  /** ID khóa học/niên khóa (ưu tiên hơn {@link khoaNamNhapHoc}). Backend filter theo {@code sinhvien.khoa_hoc_id}. */
  khoaHocId?: number
  /** ID khoa chuyên môn (ưu tiên hơn {@link khoa}). Backend filter theo {@code sinhvien.khoa_id}. */
  khoaId?: number

  page?: number
  size?: number
  sortDirection?: number
}
