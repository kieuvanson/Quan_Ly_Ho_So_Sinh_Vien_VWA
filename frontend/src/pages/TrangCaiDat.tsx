import { useState } from 'react'
import './TrangCaiDat.css'

// Types
interface Nganh {
  id: number
  maNganh: string
  tenNganh: string
  trangThai: string
}

interface Khoa {
  id: number
  maKhoa: string
  tenKhoa: string
  namBatDau: number
  namKetThuc: number
  trangThai: string
}

interface Lop {
  id: number
  maLop: string
  tenLop: string
  nganh: string
  khoa: string
  trangThai: string
}

interface LoaiGiayTo {
  id: number
  maLoai: string
  tenGiayTo: string
  moTa: string
  batBuoc: boolean
  thuTu: number
  trangThai: string
}

interface NguoiDung {
  id: number
  hoTen: string
  username: string
  email: string
  vaiTro: string
  trangThai: string
}

interface TrangThaiHocVu {
  id: number
  tenTrangThai: string
  moTa: string
  mauHienThi: string
  trangThai: string
}

interface TrangThaiHoSo {
  id: number
  tenTrangThai: string
  moTa: string
  trangThai: string
}

interface TrangThaiGiayTo {
  id: number
  tenTrangThai: string
  moTa: string
  mauHienThi: string
  trangThai: string
}

interface LyDoRutHoSo {
  id: number
  tenLyDo: string
  trangThai: string
}

interface LichSuSaoLuu {
  id: number
  thoiGian: string
  nguoiThucHien: string
  loai: string
  dungLuong: string
  trangThai: string
}

// Mock Data
const MOCK_NGANH: Nganh[] = [
  { id: 1, maNganh: '7480201', tenNganh: 'Công nghệ thông tin', trangThai: 'Đang sử dụng' },
  { id: 2, maNganh: '7380101', tenNganh: 'Luật', trangThai: 'Đang sử dụng' },
  { id: 3, maNganh: '7340101', tenNganh: 'Quản trị kinh doanh', trangThai: 'Đang sử dụng' },
  { id: 4, maNganh: '7340201', tenNganh: 'Tài chính - Ngân hàng', trangThai: 'Đang sử dụng' },
  { id: 5, maNganh: '7340301', tenNganh: 'Kế toán', trangThai: 'Đang sử dụng' },
  { id: 6, maNganh: '7220201', tenNganh: 'Ngôn ngữ Anh', trangThai: 'Đang sử dụng' },
  { id: 7, maNganh: '7320104', tenNganh: 'Truyền thông đa phương tiện', trangThai: 'Ngừng sử dụng' },
]

const MOCK_KHOA: Khoa[] = [
  { id: 1, maKhoa: 'K14', tenKhoa: 'Khóa 14', namBatDau: 2025, namKetThuc: 2029, trangThai: 'Đang sử dụng' },
  { id: 2, maKhoa: 'K15', tenKhoa: 'Khóa 15', namBatDau: 2026, namKetThuc: 2030, trangThai: 'Đang sử dụng' },
  { id: 3, maKhoa: 'K16', tenKhoa: 'Khóa 16', namBatDau: 2027, namKetThuc: 2031, trangThai: 'Đang sử dụng' },
  { id: 4, maKhoa: 'K13', tenKhoa: 'Khóa 13', namBatDau: 2024, namKetThuc: 2028, trangThai: 'Ngừng sử dụng' },
]

const MOCK_LOP: Lop[] = [
  { id: 1, maLop: 'CNTT14A', tenLop: 'CNTT14A', nganh: 'Công nghệ thông tin', khoa: 'K14', trangThai: 'Đang sử dụng' },
  { id: 2, maLop: 'L14A', tenLop: 'Luật14A', nganh: 'Luật', khoa: 'K14', trangThai: 'Đang sử dụng' },
  { id: 3, maLop: 'QT14A', tenLop: 'Quản trị Kinh doanh 14A', nganh: 'Quản trị kinh doanh', khoa: 'K14', trangThai: 'Đang sử dụng' },
  { id: 4, maLop: 'TCNH15A', tenLop: 'Tài chính Ngân hàng 15A', nganh: 'Tài chính - Ngân hàng', khoa: 'K15', trangThai: 'Đang sử dụng' },
  { id: 5, maLop: 'K15A', tenLop: 'Kế toán 15A', nganh: 'Kế toán', khoa: 'K15', trangThai: 'Đang sử dụng' },
  { id: 6, maLop: 'ANH14A', tenLop: 'Ngôn ngữ Anh 14A', nganh: 'Ngôn ngữ Anh', khoa: 'K14', trangThai: 'Ngừng sử dụng' },
]

const MOCK_LOAI_GIAY_TO: LoaiGiayTo[] = [
  { id: 1, maLoai: 'CCCD', tenGiayTo: 'Căn cước công dân', moTa: 'CMND/CCCD', batBuoc: true, thuTu: 1, trangThai: 'Đang sử dụng' },
  { id: 2, maLoai: 'BANG_THPT', tenGiayTo: 'Bằng tốt nghiệp THPT', moTa: 'Bằng tốt nghiệp trung học phổ thông', batBuoc: true, thuTu: 2, trangThai: 'Đang sử dụng' },
  { id: 3, maLoai: 'HOC_BA', tenGiayTo: 'Học bạ', moTa: 'Học bạ trung học phổ thông', batBuoc: true, thuTu: 3, trangThai: 'Đang sử dụng' },
  { id: 4, maLoai: 'HO_KHAU', tenGiayTo: 'Sổ hộ khẩu', moTa: 'Sổ hộ khẩu gia đình', batBuoc: true, thuTu: 4, trangThai: 'Đang sử dụng' },
  { id: 5, maLoai: 'KHAM_SUC_KHOE', tenGiayTo: 'Giấy khám sức khỏe', moTa: 'Giấy xác nhận sức khỏe', batBuoc: true, thuTu: 5, trangThai: 'Đang sử dụng' },
  { id: 6, maLoai: 'ANH_THE', tenGiayTo: 'Ảnh thẻ', moTa: 'Ảnh thẻ 3x4', batBuoc: true, thuTu: 6, trangThai: 'Đang sử dụng' },
  { id: 7, maLoai: 'PHIEU_SV', tenGiayTo: 'Phiếu điểm sinh viên', moTa: 'Phiếu điểm từ trường cũ', batBuoc: true, thuTu: 7, trangThai: 'Đang sử dụng' },
  { id: 8, maLoai: 'XAC_NHAN_SV', tenGiayTo: 'Giấy xác nhận sinh viên', moTa: 'Giấy xác nhận đang là sinh viên', batBuoc: true, thuTu: 8, trangThai: 'Đang sử dụng' },
  { id: 9, maLoai: 'CHUNG_CHI', tenGiayTo: 'Chứng chỉ khác', moTa: 'Các chứng chỉ khác (nếu có)', batBuoc: false, thuTu: 9, trangThai: 'Đang sử dụng' },
  { id: 10, maLoai: 'GIANY_KY', tenGiayTo: 'Giấy ủy quyền', moTa: 'Giấy ủy quyền (nếu có)', batBuoc: false, thuTu: 10, trangThai: 'Ngừng sử dụng' },
]

const MOCK_NGUOI_DUNG: NguoiDung[] = [
  { id: 1, hoTen: 'Nguyễn Thị A', username: 'nguyenthia', email: 'nguyenthia@vwa.edu.vn', vaiTro: 'Quản trị viên', trangThai: 'Hoạt động' },
  { id: 2, hoTen: 'Trần Văn B', username: 'tranvanb', email: 'tranvanb@vwa.edu.vn', vaiTro: 'Cán bộ đào tạo', trangThai: 'Hoạt động' },
  { id: 3, hoTen: 'Lê Thị C', username: 'lethic', email: 'lethic@vwa.edu.vn', vaiTro: 'Cán bộ tiếp nhận', trangThai: 'Hoạt động' },
  { id: 4, hoTen: 'Phạm Văn D', username: 'phamvand', email: 'phamvand@vwa.edu.vn', vaiTro: 'Người xem', trangThai: 'Khóa' },
  { id: 5, hoTen: 'Hoàng Thị E', username: 'hoangthie', email: 'hoangthie@vwa.edu.vn', vaiTro: 'Cán bộ đào tạo', trangThai: 'Hoạt động' },
]

const MOCK_TRANG_THAI_HOC_VU: TrangThaiHocVu[] = [
  { id: 1, tenTrangThai: 'Đang học', moTa: 'Sinh viên đang trong quá trình học tập', mauHienThi: 'primary', trangThai: 'Đang sử dụng' },
  { id: 2, tenTrangThai: 'Bảo lưu', moTa: 'Sinh viên tạm ngừng học tập có thời hạn', mauHienThi: 'warning', trangThai: 'Đang sử dụng' },
  { id: 3, tenTrangThai: 'Đình chỉ', moTa: 'Sinh viên bị tạm dừng học tập do vi phạm', mauHienThi: 'danger', trangThai: 'Đang sử dụng' },
  { id: 4, tenTrangThai: 'Tốt nghiệp', moTa: 'Sinh viên đã hoàn thành chương trình học', mauHienThi: 'success', trangThai: 'Đang sử dụng' },
  { id: 5, tenTrangThai: 'Đã rút hồ sơ', moTa: 'Sinh viên đã rút hồ sơ khỏi trường', mauHienThi: 'secondary', trangThai: 'Đang sử dụng' },
]

const MOCK_TRANG_THAI_HO_SO: TrangThaiHoSo[] = [
  { id: 1, tenTrangThai: 'Đầy đủ', moTa: 'Hồ sơ có đầy đủ các giấy tờ theo quy định', trangThai: 'Đang sử dụng' },
  { id: 2, tenTrangThai: 'Đang thiếu', moTa: 'Hồ sơ đang thiếu một số giấy tờ', trangThai: 'Đang sử dụng' },
]

const MOCK_TRANG_THAI_GIAY_TO: TrangThaiGiayTo[] = [
  { id: 1, tenTrangThai: 'Chưa nộp', moTa: 'Giấy tờ chưa được nộp', mauHienThi: 'default', trangThai: 'Đang sử dụng' },
  { id: 2, tenTrangThai: 'Đã nộp', moTa: 'Giấy tờ đã được nộp và xác nhận', mauHienThi: 'success', trangThai: 'Đang sử dụng' },
  { id: 3, tenTrangThai: 'Thiếu', moTa: 'Giấy tờ chưa đầy đủ hoặc chưa hợp lệ', mauHienThi: 'warning', trangThai: 'Đang sử dụng' },
  { id: 4, tenTrangThai: 'Không hợp lệ', moTa: 'Giấy tờ không đủ điều kiện hoặc hết hạn', mauHienThi: 'danger', trangThai: 'Đang sử dụng' },
]

const MOCK_LY_DO_RUT_HO_SO: LyDoRutHoSo[] = [
  { id: 1, tenLyDo: 'Chuyển trường', trangThai: 'Đang sử dụng' },
  { id: 2, tenLyDo: 'Thôi học', trangThai: 'Đang sử dụng' },
  { id: 3, tenLyDo: 'Hoàn thành chương trình', trangThai: 'Đang sử dụng' },
  { id: 4, tenLyDo: 'Lý do cá nhân', trangThai: 'Đang sử dụng' },
  { id: 5, tenLyDo: 'Khác', trangThai: 'Đang sử dụng' },
]

const MOCK_LICH_SU_SAO_LUU: LichSuSaoLuu[] = [
  { id: 1, thoiGian: '28/09/2026 17:30', nguoiThucHien: 'System', loai: 'Tự động', dungLuong: '125 MB', trangThai: 'Thành công' },
  { id: 2, thoiGian: '27/09/2026 17:30', nguoiThucHien: 'System', loai: 'Tự động', dungLuong: '124 MB', trangThai: 'Thành công' },
  { id: 3, thoiGian: '26/09/2026 17:30', nguoiThucHien: 'System', loai: 'Tự động', dungLuong: '123 MB', trangThai: 'Thành công' },
  { id: 4, thoiGian: '25/09/2026 10:00', nguoiThucHien: 'Nguyễn Thị A', loai: 'Thủ công', dungLuong: '122 MB', trangThai: 'Thành công' },
]

// Icons
const Icons = {
  book: (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/>
    </svg>
  ),
  file: (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
      <polyline points="14 2 14 8 20 8"/>
    </svg>
  ),
  tag: (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z"/>
      <circle cx="7.5" cy="7.5" r=".5"/>
    </svg>
  ),
  users: (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  refresh: (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 3 4 7l4 4"/>
      <path d="M4 7h16"/>
      <path d="m16 21 4-4-4-4"/>
      <path d="M20 17H4"/>
    </svg>
  ),
  download: (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="7 10 12 15 17 10"/>
      <line x1="12" y1="15" x2="12" y2="3"/>
    </svg>
  ),
  building: (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="2" width="16" height="20" rx="2" ry="2"/>
      <path d="M9 22v-4h6v4"/>
      <path d="M8 6h.01"/>
      <path d="M16 6h.01"/>
      <path d="M12 6h.01"/>
      <path d="M12 10h.01"/>
      <path d="M12 14h.01"/>
      <path d="M16 10h.01"/>
      <path d="M16 14h.01"/>
      <path d="M8 10h.01"/>
      <path d="M8 14h.01"/>
    </svg>
  ),
  database: (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="12" cy="5" rx="9" ry="3"/>
      <path d="M3 5V19A9 3 0 0 0 21 19V5"/>
      <path d="M3 12A9 3 0 0 0 21 12"/>
    </svg>
  ),
  chevronRight: (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m9 18 6-6-6-6"/>
    </svg>
  ),
  chevronDown: (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m6 9 6 6 6-6"/>
    </svg>
  ),
  plus: (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14"/>
      <path d="M12 5v14"/>
    </svg>
  ),
  search: (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/>
      <path d="m21 21-4.3-4.3"/>
    </svg>
  ),
  edit: (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
    </svg>
  ),
  x: (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6 6 18"/>
      <path d="m6 6 12 12"/>
    </svg>
  ),
  check: (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  downloadCloud: (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"/>
      <path d="M12 12v9"/>
      <path d="m16 16-4-4-4 4"/>
    </svg>
  ),
  upload: (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="17 8 12 3 7 8"/>
      <line x1="12" y1="3" x2="12" y2="15"/>
    </svg>
  ),
  clock: (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <polyline points="12 6 12 12 16 14"/>
    </svg>
  ),
  image: (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
      <circle cx="9" cy="9" r="2"/>
      <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
    </svg>
  ),
}

// Menu items
interface MenuItem {
  id: string
  label: string
  icon: React.ReactNode
  parentId?: string
}

const MENU_ITEMS: MenuItem[] = [
  { id: 'danh-muc-dao-tao', label: 'Danh mục đào tạo', icon: Icons.book },
  { id: 'nganh', label: 'Ngành', icon: Icons.book, parentId: 'danh-muc-dao-tao' },
  { id: 'khoa', label: 'Khóa', icon: Icons.book, parentId: 'danh-muc-dao-tao' },
  { id: 'lop', label: 'Lớp', icon: Icons.book, parentId: 'danh-muc-dao-tao' },
  { id: 'danh-muc-ho-so', label: 'Danh mục hồ sơ', icon: Icons.file },
  { id: 'loai-giay-to', label: 'Loại giấy tờ', icon: Icons.file, parentId: 'danh-muc-ho-so' },
  { id: 'trang-thai', label: 'Trạng thái', icon: Icons.tag },
  { id: 'trang-thai-hoc-vu', label: 'Trạng thái học vụ', icon: Icons.tag, parentId: 'trang-thai' },
  { id: 'trang-thai-ho-so', label: 'Trạng thái hồ sơ', icon: Icons.tag, parentId: 'trang-thai' },
  { id: 'trang-thai-giay-to', label: 'Trạng thái giấy tờ', icon: Icons.tag, parentId: 'trang-thai' },
  { id: 'nguoi-dung', label: 'Người dùng & Phân quyền', icon: Icons.users },
  { id: 'cau-hinh-muon-tra', label: 'Mượn / trả hồ sơ', icon: Icons.refresh },
  { id: 'cau-hinh-rut-ho-so', label: 'Rút hồ sơ', icon: Icons.download },
  { id: 'thong-tin-he-thong', label: 'Thông tin hệ thống', icon: Icons.building },
  { id: 'sao-luu-du-lieu', label: 'Sao lưu & dữ liệu', icon: Icons.database },
]

// Get menu tree
const getMenuTree = () => {
  const parents = MENU_ITEMS.filter(m => !m.parentId)
  return parents.map(parent => ({
    ...parent,
    children: MENU_ITEMS.filter(m => m.parentId === parent.id)
  }))
}

// Modal Component
interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  footer?: React.ReactNode
}

function Modal({ isOpen, onClose, title, children, footer }: ModalProps) {
  if (!isOpen) return null

  return (
    <div className="cai-dat-modal-overlay" onClick={onClose}>
      <div className="cai-dat-modal" onClick={(e) => e.stopPropagation()}>
        <div className="cai-dat-modal__header">
          <h3 className="cai-dat-modal__title">{title}</h3>
          <button className="cai-dat-modal__close" onClick={onClose}>
            {Icons.x}
          </button>
        </div>
        <div className="cai-dat-modal__body">
          {children}
        </div>
        {footer && (
          <div className="cai-dat-modal__footer">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}

// Status Badge Component
function StatusBadge({ status }: { status: string }) {
  const statusClass = status.toLowerCase().replace(/ /g, '-')
  return (
    <span className={`cai-dat-badge cai-dat-badge--${statusClass}`}>
      {status}
    </span>
  )
}

// Color Badge for Trạng thái giấy tờ
function ColorBadge({ label, color }: { label: string; color: string }) {
  return (
    <span className={`cai-dat-color-badge cai-dat-color-badge--${color}`}>
      {label}
    </span>
  )
}

// Toggle Component
function Toggle({ checked, onChange }: { checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <label className="cai-dat-toggle">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="cai-dat-toggle__slider"></span>
    </label>
  )
}

// Table Component
interface TableColumn {
  key: string
  label: string
  width?: string
}

interface TableProps<T> {
  columns: TableColumn[]
  data: T[]
  renderRow: (item: T, index: number) => React.ReactNode
}

function Table<T>({ columns, data, renderRow }: TableProps<T>) {
  return (
    <div className="cai-dat-table-wrapper">
      <table className="cai-dat-table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key} className="cai-dat-table__header" style={{ width: col.width }}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => renderRow(item, index))}
        </tbody>
      </table>
    </div>
  )
}

// Section Header Component
function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="cai-dat-section-header">
      <h2 className="cai-dat-section-header__title">{title}</h2>
      {subtitle && <p className="cai-dat-section-header__subtitle">{subtitle}</p>}
    </div>
  )
}

// Toolbar Component
function Toolbar({ 
  searchPlaceholder,
  filters,
  actionButton
}: { 
  searchPlaceholder?: string
  filters?: React.ReactNode
  actionButton?: React.ReactNode
}) {
  return (
    <div className="cai-dat-toolbar">
      <div className="cai-dat-toolbar__left">
        {searchPlaceholder && (
          <div className="cai-dat-toolbar__search">
            {Icons.search}
            <input type="text" placeholder={searchPlaceholder} />
          </div>
        )}
        {filters}
      </div>
      {actionButton && (
        <div className="cai-dat-toolbar__right">
          {actionButton}
        </div>
      )}
    </div>
  )
}

// Card Component
function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="cai-dat-card">
      <h3 className="cai-dat-card__title">{title}</h3>
      <div className="cai-dat-card__content">
        {children}
      </div>
    </div>
  )
}

// Tab Component
function Tab({ tabs, activeTab, onChange }: { tabs: { id: string; label: string }[]; activeTab: string; onChange: (id: string) => void }) {
  return (
    <div className="cai-dat-tabs">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className={`cai-dat-tab ${activeTab === tab.id ? 'cai-dat-tab--active' : ''}`}
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}

export function TrangCaiDat() {
  // State
  const [activeMenu, setActiveMenu] = useState<string>('nganh')
  const [expandedMenu, setExpandedMenu] = useState<string[]>(['danh-muc-dao-tao', 'danh-muc-ho-so', 'trang-thai'])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add')
  const [activeTrangThaiTab, setActiveTrangThaiTab] = useState<string>('trang-thai-hoc-vu')

  // Config states
  const [muonTraConfig, setMuonTraConfig] = useState({
    thoiHanMacDinh: 7,
    choPhepGiaHan: true,
    soLanGiaHanToiDa: 2,
    choPhepTraQuaHan: true,
    tuDongDanhDauQuaHan: true,
    thongBaoGanHan: true,
    soNgayTruocHan: 1,
  })

  const [rutHoSoConfig, setRutHoSoConfig] = useState({
    yeuCauXacNhan: true,
    batBuocLyDo: true,
    batBuocGhiChu: false,
  })

  const [heThongConfig, setHeThongConfig] = useState({
    tenDonVi: 'HỌC VIỆN PHỤ NỮ VIỆT NAM',
    tenHeThong: 'Hệ thống quản lý hồ sơ sinh viên VWA',
    email: 'contact@vwa.edu.vn',
    soDienThoai: '0243.XXX.XXXX',
    diaChi: 'Hà Nội, Việt Nam',
  })

  const menuTree = getMenuTree()

  // Toggle expand menu
  const toggleMenu = (menuId: string) => {
    setExpandedMenu(prev => 
      prev.includes(menuId) 
        ? prev.filter(id => id !== menuId)
        : [...prev, menuId]
    )
  }

  // Handle menu click
  const handleMenuClick = (menuId: string) => {
    setActiveMenu(menuId)
    const item = MENU_ITEMS.find(m => m.id === menuId)
    if (item?.parentId && !expandedMenu.includes(item.parentId)) {
      setExpandedMenu(prev => [...prev, item.parentId!])
    }
  }

  // Modal handlers
  const openAddModal = () => {
    setModalMode('add')
    setIsModalOpen(true)
  }

  const openEditModal = () => {
    setModalMode('edit')
    setIsModalOpen(true)
  }

  // Render modal footer
  const modalFooter = (
    <>
      <button className="cai-dat-btn cai-dat-btn--secondary" onClick={() => setIsModalOpen(false)}>
        Hủy
      </button>
      <button className="cai-dat-btn cai-dat-btn--primary" onClick={() => setIsModalOpen(false)}>
        Lưu
      </button>
    </>
  )

  // Render content based on active menu
  const renderContent = () => {
    switch (activeMenu) {
      case 'nganh':
        return renderNganhContent()
      case 'khoa':
        return renderKhoaContent()
      case 'lop':
        return renderLopContent()
      case 'loai-giay-to':
        return renderLoaiGiayToContent()
      case 'trang-thai-hoc-vu':
      case 'trang-thai-ho-so':
      case 'trang-thai-giay-to':
        return renderTrangThaiContent()
      case 'nguoi-dung':
        return renderNguoiDungContent()
      case 'cau-hinh-muon-tra':
        return renderCauHinhMuonTraContent()
      case 'cau-hinh-rut-ho-so':
        return renderCauHinhRutHoSoContent()
      case 'thong-tin-he-thong':
        return renderThongTinHeThongContent()
      case 'sao-luu-du-lieu':
        return renderSaoLuuDuLieuContent()
      default:
        return null
    }
  }

  // Ngành content
  const renderNganhContent = () => {
    const columns: TableColumn[] = [
      { key: 'stt', label: 'STT', width: '60px' },
      { key: 'maNganh', label: 'Mã ngành', width: '120px' },
      { key: 'tenNganh', label: 'Tên ngành' },
      { key: 'trangThai', label: 'Trạng thái', width: '150px' },
      { key: 'thaoTac', label: 'Thao tác', width: '100px' },
    ]

    return (
      <div className="cai-dat-content">
        <SectionHeader 
          title="QUẢN LÝ NGÀNH" 
          subtitle="Quản lý các ngành đào tạo được sử dụng trong hệ thống"
        />
        
        <Toolbar
          searchPlaceholder="Tìm ngành..."
          filters={
            <select className="cai-dat-toolbar__select">
              <option value="">Tất cả trạng thái</option>
              <option value="dang-su-dung">Đang sử dụng</option>
              <option value="ngung-su-dung">Ngừng sử dụng</option>
            </select>
          }
          actionButton={
            <button className="cai-dat-btn cai-dat-btn--primary" onClick={openAddModal}>
              {Icons.plus} Thêm ngành
            </button>
          }
        />

        <Table
          columns={columns}
          data={MOCK_NGANH}
          renderRow={(item, index) => (
            <tr key={item.id}>
              <td className="cai-dat-table__cell cai-dat-table__cell--center">{String(index + 1).padStart(2, '0')}</td>
              <td className="cai-dat-table__cell">{item.maNganh}</td>
              <td className="cai-dat-table__cell">{item.tenNganh}</td>
              <td className="cai-dat-table__cell"><StatusBadge status={item.trangThai} /></td>
              <td className="cai-dat-table__cell cai-dat-table__cell--center">
                <button className="cai-dat-btn-action" onClick={openEditModal}>
                  {Icons.edit} Sửa
                </button>
              </td>
            </tr>
          )}
        />
      </div>
    )
  }

  // Khóa content
  const renderKhoaContent = () => {
    const columns: TableColumn[] = [
      { key: 'stt', label: 'STT', width: '60px' },
      { key: 'maKhoa', label: 'Mã khóa', width: '100px' },
      { key: 'tenKhoa', label: 'Tên khóa', width: '150px' },
      { key: 'namBatDau', label: 'Năm bắt đầu', width: '130px' },
      { key: 'namKetThuc', label: 'Năm kết thúc', width: '130px' },
      { key: 'trangThai', label: 'Trạng thái', width: '150px' },
      { key: 'thaoTac', label: 'Thao tác', width: '100px' },
    ]

    return (
      <div className="cai-dat-content">
        <SectionHeader 
          title="QUẢN LÝ KHÓA" 
          subtitle="Quản lý các khóa tuyển sinh/đào tạo"
        />
        
        <Toolbar
          searchPlaceholder="Tìm khóa..."
          filters={
            <select className="cai-dat-toolbar__select">
              <option value="">Tất cả trạng thái</option>
              <option value="dang-su-dung">Đang sử dụng</option>
              <option value="ngung-su-dung">Ngừng sử dụng</option>
            </select>
          }
          actionButton={
            <button className="cai-dat-btn cai-dat-btn--primary" onClick={openAddModal}>
              {Icons.plus} Thêm khóa
            </button>
          }
        />

        <Table
          columns={columns}
          data={MOCK_KHOA}
          renderRow={(item, index) => (
            <tr key={item.id}>
              <td className="cai-dat-table__cell cai-dat-table__cell--center">{String(index + 1).padStart(2, '0')}</td>
              <td className="cai-dat-table__cell">{item.maKhoa}</td>
              <td className="cai-dat-table__cell">{item.tenKhoa}</td>
              <td className="cai-dat-table__cell">{item.namBatDau}</td>
              <td className="cai-dat-table__cell">{item.namKetThuc}</td>
              <td className="cai-dat-table__cell"><StatusBadge status={item.trangThai} /></td>
              <td className="cai-dat-table__cell cai-dat-table__cell--center">
                <button className="cai-dat-btn-action" onClick={openEditModal}>
                  {Icons.edit} Sửa
                </button>
              </td>
            </tr>
          )}
        />
      </div>
    )
  }

  // Lớp content
  const renderLopContent = () => {
    const columns: TableColumn[] = [
      { key: 'stt', label: 'STT', width: '60px' },
      { key: 'maLop', label: 'Mã lớp', width: '120px' },
      { key: 'tenLop', label: 'Tên lớp' },
      { key: 'nganh', label: 'Ngành', width: '180px' },
      { key: 'khoa', label: 'Khóa', width: '100px' },
      { key: 'trangThai', label: 'Trạng thái', width: '150px' },
      { key: 'thaoTac', label: 'Thao tác', width: '100px' },
    ]

    return (
      <div className="cai-dat-content">
        <SectionHeader 
          title="QUẢN LÝ LỚP" 
          subtitle="Quản lý các lớp hành chính của sinh viên"
        />
        
        <Toolbar
          searchPlaceholder="Tìm lớp..."
          filters={
            <>
              <select className="cai-dat-toolbar__select">
                <option value="">Tất cả ngành</option>
                {MOCK_NGANH.filter(n => n.trangThai === 'Đang sử dụng').map(n => (
                  <option key={n.id} value={n.maNganh}>{n.tenNganh}</option>
                ))}
              </select>
              <select className="cai-dat-toolbar__select">
                <option value="">Tất cả khóa</option>
                {MOCK_KHOA.filter(k => k.trangThai === 'Đang sử dụng').map(k => (
                  <option key={k.id} value={k.maKhoa}>{k.tenKhoa}</option>
                ))}
              </select>
              <select className="cai-dat-toolbar__select">
                <option value="">Tất cả trạng thái</option>
                <option value="dang-su-dung">Đang sử dụng</option>
                <option value="ngung-su-dung">Ngừng sử dụng</option>
              </select>
            </>
          }
          actionButton={
            <button className="cai-dat-btn cai-dat-btn--primary" onClick={openAddModal}>
              {Icons.plus} Thêm lớp
            </button>
          }
        />

        <Table
          columns={columns}
          data={MOCK_LOP}
          renderRow={(item, index) => (
            <tr key={item.id}>
              <td className="cai-dat-table__cell cai-dat-table__cell--center">{String(index + 1).padStart(2, '0')}</td>
              <td className="cai-dat-table__cell">{item.maLop}</td>
              <td className="cai-dat-table__cell">{item.tenLop}</td>
              <td className="cai-dat-table__cell">{item.nganh}</td>
              <td className="cai-dat-table__cell">{item.khoa}</td>
              <td className="cai-dat-table__cell"><StatusBadge status={item.trangThai} /></td>
              <td className="cai-dat-table__cell cai-dat-table__cell--center">
                <button className="cai-dat-btn-action" onClick={openEditModal}>
                  {Icons.edit} Sửa
                </button>
              </td>
            </tr>
          )}
        />
      </div>
    )
  }

  // Loại giấy tờ content
  const renderLoaiGiayToContent = () => {
    const columns: TableColumn[] = [
      { key: 'stt', label: 'STT', width: '60px' },
      { key: 'maLoai', label: 'Mã loại', width: '120px' },
      { key: 'tenGiayTo', label: 'Tên giấy tờ' },
      { key: 'batBuoc', label: 'Bắt buộc', width: '110px' },
      { key: 'thuTu', label: 'Thứ tự', width: '90px' },
      { key: 'trangThai', label: 'Trạng thái', width: '150px' },
      { key: 'thaoTac', label: 'Thao tác', width: '100px' },
    ]

    return (
      <div className="cai-dat-content">
        <SectionHeader 
          title="QUẢN LÝ LOẠI GIẤY TỜ" 
          subtitle="Quản lý các loại giấy tờ được sử dụng trong hồ sơ sinh viên"
        />
        
        <Toolbar
          searchPlaceholder="Tìm giấy tờ..."
          filters={
            <select className="cai-dat-toolbar__select">
              <option value="">Tất cả trạng thái</option>
              <option value="dang-su-dung">Đang sử dụng</option>
              <option value="ngung-su-dung">Ngừng sử dụng</option>
            </select>
          }
          actionButton={
            <button className="cai-dat-btn cai-dat-btn--primary" onClick={openAddModal}>
              {Icons.plus} Thêm loại giấy tờ
            </button>
          }
        />

        <Table
          columns={columns}
          data={MOCK_LOAI_GIAY_TO}
          renderRow={(item, index) => (
            <tr key={item.id}>
              <td className="cai-dat-table__cell cai-dat-table__cell--center">{String(index + 1).padStart(2, '0')}</td>
              <td className="cai-dat-table__cell">{item.maLoai}</td>
              <td className="cai-dat-table__cell">{item.tenGiayTo}</td>
              <td className="cai-dat-table__cell cai-dat-table__cell--center">
                {item.batBuoc ? (
                  <span className="cai-dat-badge cai-dat-badge--bat-buoc">{Icons.check} Có</span>
                ) : (
                  <span className="cai-dat-badge cai-dat-badge--khong-bat-buoc">Không</span>
                )}
              </td>
              <td className="cai-dat-table__cell cai-dat-table__cell--center">{item.thuTu}</td>
              <td className="cai-dat-table__cell"><StatusBadge status={item.trangThai} /></td>
              <td className="cai-dat-table__cell cai-dat-table__cell--center">
                <button className="cai-dat-btn-action" onClick={openEditModal}>
                  {Icons.edit} Sửa
                </button>
              </td>
            </tr>
          )}
        />
      </div>
    )
  }

  // Trạng thái content
  const renderTrangThaiContent = () => {
    const tabs = [
      { id: 'trang-thai-hoc-vu', label: 'Trạng thái học vụ' },
      { id: 'trang-thai-ho-so', label: 'Trạng thái hồ sơ' },
      { id: 'trang-thai-giay-to', label: 'Trạng thái giấy tờ' },
    ]

    const renderTable = () => {
      switch (activeTrangThaiTab) {
        case 'trang-thai-hoc-vu': {
          const columns: TableColumn[] = [
            { key: 'stt', label: 'STT', width: '60px' },
            { key: 'tenTrangThai', label: 'Trạng thái' },
            { key: 'moTa', label: 'Mô tả' },
            { key: 'trangThai', label: 'Trạng thái', width: '150px' },
            { key: 'thaoTac', label: 'Thao tác', width: '100px' },
          ]
          return (
            <Table
              columns={columns}
              data={MOCK_TRANG_THAI_HOC_VU}
              renderRow={(item, index) => (
                <tr key={item.id}>
                  <td className="cai-dat-table__cell cai-dat-table__cell--center">{String(index + 1).padStart(2, '0')}</td>
                  <td className="cai-dat-table__cell">
                    <ColorBadge label={item.tenTrangThai} color={item.mauHienThi} />
                  </td>
                  <td className="cai-dat-table__cell">{item.moTa}</td>
                  <td className="cai-dat-table__cell"><StatusBadge status={item.trangThai} /></td>
                  <td className="cai-dat-table__cell cai-dat-table__cell--center">
                    <button className="cai-dat-btn-action" onClick={openEditModal}>
                      {Icons.edit} Sửa
                    </button>
                  </td>
                </tr>
              )}
            />
          )
        }
        case 'trang-thai-ho-so': {
          const columns: TableColumn[] = [
            { key: 'stt', label: 'STT', width: '60px' },
            { key: 'tenTrangThai', label: 'Trạng thái' },
            { key: 'moTa', label: 'Mô tả' },
            { key: 'trangThai', label: 'Trạng thái', width: '150px' },
            { key: 'thaoTac', label: 'Thao tác', width: '100px' },
          ]
          return (
            <Table
              columns={columns}
              data={MOCK_TRANG_THAI_HO_SO}
              renderRow={(item, index) => (
                <tr key={item.id}>
                  <td className="cai-dat-table__cell cai-dat-table__cell--center">{String(index + 1).padStart(2, '0')}</td>
                  <td className="cai-dat-table__cell">{item.tenTrangThai}</td>
                  <td className="cai-dat-table__cell">{item.moTa}</td>
                  <td className="cai-dat-table__cell"><StatusBadge status={item.trangThai} /></td>
                  <td className="cai-dat-table__cell cai-dat-table__cell--center">
                    <button className="cai-dat-btn-action" onClick={openEditModal}>
                      {Icons.edit} Sửa
                    </button>
                  </td>
                </tr>
              )}
            />
          )
        }
        case 'trang-thai-giay-to': {
          const columns: TableColumn[] = [
            { key: 'stt', label: 'STT', width: '60px' },
            { key: 'tenTrangThai', label: 'Trạng thái' },
            { key: 'moTa', label: 'Mô tả' },
            { key: 'mauHienThi', label: 'Màu hiển thị', width: '150px' },
            { key: 'trangThai', label: 'Trạng thái', width: '150px' },
            { key: 'thaoTac', label: 'Thao tác', width: '100px' },
          ]
          return (
            <Table
              columns={columns}
              data={MOCK_TRANG_THAI_GIAY_TO}
              renderRow={(item, index) => (
                <tr key={item.id}>
                  <td className="cai-dat-table__cell cai-dat-table__cell--center">{String(index + 1).padStart(2, '0')}</td>
                  <td className="cai-dat-table__cell">
                    <ColorBadge label={item.tenTrangThai} color={item.mauHienThi} />
                  </td>
                  <td className="cai-dat-table__cell">{item.moTa}</td>
                  <td className="cai-dat-table__cell">
                    <ColorBadge label={item.tenTrangThai} color={item.mauHienThi} />
                  </td>
                  <td className="cai-dat-table__cell"><StatusBadge status={item.trangThai} /></td>
                  <td className="cai-dat-table__cell cai-dat-table__cell--center">
                    <button className="cai-dat-btn-action" onClick={openEditModal}>
                      {Icons.edit} Sửa
                    </button>
                  </td>
                </tr>
              )}
            />
          )
        }
        default:
          return null
      }
    }

    return (
      <div className="cai-dat-content">
        <SectionHeader 
          title="QUẢN LÝ TRẠNG THÁI" 
          subtitle="Quản lý các trạng thái được sử dụng trong hệ thống"
        />
        
        <Tab tabs={tabs} activeTab={activeTrangThaiTab} onChange={setActiveTrangThaiTab} />
        
        <div className="cai-dat-content__section">
          {renderTable()}
        </div>
      </div>
    )
  }

  // Người dùng content
  const renderNguoiDungContent = () => {
    const columns: TableColumn[] = [
      { key: 'stt', label: 'STT', width: '60px' },
      { key: 'hoTen', label: 'Họ tên' },
      { key: 'username', label: 'Username', width: '140px' },
      { key: 'email', label: 'Email', width: '200px' },
      { key: 'vaiTro', label: 'Vai trò', width: '150px' },
      { key: 'trangThai', label: 'Trạng thái', width: '130px' },
      { key: 'thaoTac', label: 'Thao tác', width: '100px' },
    ]

    return (
      <div className="cai-dat-content">
        <SectionHeader 
          title="QUẢN LÝ NGƯỜI DÙNG" 
          subtitle="Quản lý tài khoản và quyền truy cập hệ thống"
        />
        
        <Toolbar
          searchPlaceholder="Tìm người dùng..."
          filters={
            <>
              <select className="cai-dat-toolbar__select">
                <option value="">Tất cả vai trò</option>
                <option value="quan-tri-vien">Quản trị viên</option>
                <option value="can-bo-dao-tao">Cán bộ đào tạo</option>
                <option value="can-bo-tiep-nhan">Cán bộ tiếp nhận</option>
                <option value="nguoi-xem">Người xem</option>
              </select>
              <select className="cai-dat-toolbar__select">
                <option value="">Tất cả trạng thái</option>
                <option value="hoat-dong">Hoạt động</option>
                <option value="khoa">Khóa</option>
              </select>
            </>
          }
          actionButton={
            <button className="cai-dat-btn cai-dat-btn--primary" onClick={openAddModal}>
              {Icons.plus} Thêm người dùng
            </button>
          }
        />

        <Table
          columns={columns}
          data={MOCK_NGUOI_DUNG}
          renderRow={(item, index) => (
            <tr key={item.id}>
              <td className="cai-dat-table__cell cai-dat-table__cell--center">{String(index + 1).padStart(2, '0')}</td>
              <td className="cai-dat-table__cell">{item.hoTen}</td>
              <td className="cai-dat-table__cell">{item.username}</td>
              <td className="cai-dat-table__cell">{item.email}</td>
              <td className="cai-dat-table__cell">{item.vaiTro}</td>
              <td className="cai-dat-table__cell"><StatusBadge status={item.trangThai} /></td>
              <td className="cai-dat-table__cell cai-dat-table__cell--center">
                <button className="cai-dat-btn-action" onClick={openEditModal}>
                  {Icons.edit} Sửa
                </button>
              </td>
            </tr>
          )}
        />
      </div>
    )
  }

  // Cấu hình mượn/trả content
  const renderCauHinhMuonTraContent = () => {
    return (
      <div className="cai-dat-content">
        <SectionHeader 
          title="CẤU HÌNH MƯỢN / TRẢ HỒ SƠ" 
          subtitle="Thiết lập các quy định sử dụng chức năng mượn và trả hồ sơ"
        />

        <div className="cai-dat-config-grid">
          <Card title="THỜI HẠN MƯỢN">
            <div className="cai-dat-config-item">
              <label>Thời hạn mượn mặc định:</label>
              <div className="cai-dat-config-input">
                <input 
                  type="number" 
                  value={muonTraConfig.thoiHanMacDinh}
                  onChange={(e) => setMuonTraConfig(prev => ({ ...prev, thoiHanMacDinh: parseInt(e.target.value) || 0 }))}
                />
                <span>ngày</span>
              </div>
            </div>
          </Card>

          <Card title="GIA HẠN">
            <div className="cai-dat-config-item">
              <label>Cho phép gia hạn:</label>
              <Toggle 
                checked={muonTraConfig.choPhepGiaHan}
                onChange={(checked) => setMuonTraConfig(prev => ({ ...prev, choPhepGiaHan: checked }))}
              />
            </div>
            {muonTraConfig.choPhepGiaHan && (
              <div className="cai-dat-config-item">
                <label>Số lần gia hạn tối đa:</label>
                <div className="cai-dat-config-input">
                  <input 
                    type="number"
                    value={muonTraConfig.soLanGiaHanToiDa}
                    onChange={(e) => setMuonTraConfig(prev => ({ ...prev, soLanGiaHanToiDa: parseInt(e.target.value) || 0 }))}
                  />
                  <span>lần</span>
                </div>
              </div>
            )}
          </Card>

          <Card title="QUÁ HẠN">
            <div className="cai-dat-config-item">
              <label>Cho phép tiếp tục trả hồ sơ khi quá hạn:</label>
              <Toggle 
                checked={muonTraConfig.choPhepTraQuaHan}
                onChange={(checked) => setMuonTraConfig(prev => ({ ...prev, choPhepTraQuaHan: checked }))}
              />
            </div>
            <div className="cai-dat-config-item">
              <label>Tự động đánh dấu quá hạn:</label>
              <Toggle 
                checked={muonTraConfig.tuDongDanhDauQuaHan}
                onChange={(checked) => setMuonTraConfig(prev => ({ ...prev, tuDongDanhDauQuaHan: checked }))}
              />
            </div>
          </Card>

          <Card title="THÔNG BÁO">
            <div className="cai-dat-config-item">
              <label>Thông báo khi sắp đến hạn:</label>
              <Toggle 
                checked={muonTraConfig.thongBaoGanHan}
                onChange={(checked) => setMuonTraConfig(prev => ({ ...prev, thongBaoGanHan: checked }))}
              />
            </div>
            {muonTraConfig.thongBaoGanHan && (
              <div className="cai-dat-config-item">
                <label>Số ngày trước hạn:</label>
                <div className="cai-dat-config-input">
                  <input 
                    type="number"
                    value={muonTraConfig.soNgayTruocHan}
                    onChange={(e) => setMuonTraConfig(prev => ({ ...prev, soNgayTruocHan: parseInt(e.target.value) || 0 }))}
                  />
                  <span>ngày</span>
                </div>
              </div>
            )}
          </Card>
        </div>

        <div className="cai-dat-form__actions">
          <button className="cai-dat-btn cai-dat-btn--secondary">Hủy thay đổi</button>
          <button className="cai-dat-btn cai-dat-btn--primary">Lưu cấu hình</button>
        </div>
      </div>
    )
  }

  // Cấu hình rút hồ sơ content
  const renderCauHinhRutHoSoContent = () => {
    const columns: TableColumn[] = [
      { key: 'stt', label: 'STT', width: '60px' },
      { key: 'tenLyDo', label: 'Lý do' },
      { key: 'trangThai', label: 'Trạng thái', width: '150px' },
      { key: 'thaoTac', label: 'Thao tác', width: '100px' },
    ]

    return (
      <div className="cai-dat-content">
        <SectionHeader 
          title="CẤU HÌNH RÚT HỒ SƠ" 
          subtitle="Thiết lập các quy định và lý do sử dụng khi rút hồ sơ"
        />

        <div className="cai-dat-content__section">
          <SectionHeader title="LÝ DO RÚT HỒ SƠ" />
          
          <Toolbar
            actionButton={
              <button className="cai-dat-btn cai-dat-btn--primary" onClick={openAddModal}>
                {Icons.plus} Thêm lý do
              </button>
            }
          />

          <Table
            columns={columns}
            data={MOCK_LY_DO_RUT_HO_SO}
            renderRow={(item, index) => (
              <tr key={item.id}>
                <td className="cai-dat-table__cell cai-dat-table__cell--center">{String(index + 1).padStart(2, '0')}</td>
                <td className="cai-dat-table__cell">{item.tenLyDo}</td>
                <td className="cai-dat-table__cell"><StatusBadge status={item.trangThai} /></td>
                <td className="cai-dat-table__cell cai-dat-table__cell--center">
                  <button className="cai-dat-btn-action" onClick={openEditModal}>
                    {Icons.edit} Sửa
                  </button>
                </td>
              </tr>
            )}
          />
        </div>

        <div className="cai-dat-content__section">
          <SectionHeader title="XÁC NHẬN RÚT HỒ SƠ" />
          
          <Card title="">
            <div className="cai-dat-config-item">
              <label>Yêu cầu xác nhận trước khi rút:</label>
              <Toggle 
                checked={rutHoSoConfig.yeuCauXacNhan}
                onChange={(checked) => setRutHoSoConfig(prev => ({ ...prev, yeuCauXacNhan: checked }))}
              />
            </div>
            <div className="cai-dat-config-item">
              <label>Bắt buộc nhập lý do:</label>
              <Toggle 
                checked={rutHoSoConfig.batBuocLyDo}
                onChange={(checked) => setRutHoSoConfig(prev => ({ ...prev, batBuocLyDo: checked }))}
              />
            </div>
            <div className="cai-dat-config-item">
              <label>Bắt buộc ghi chú:</label>
              <Toggle 
                checked={rutHoSoConfig.batBuocGhiChu}
                onChange={(checked) => setRutHoSoConfig(prev => ({ ...prev, batBuocGhiChu: checked }))}
              />
            </div>
          </Card>
        </div>

        <div className="cai-dat-form__actions">
          <button className="cai-dat-btn cai-dat-btn--secondary">Hủy thay đổi</button>
          <button className="cai-dat-btn cai-dat-btn--primary">Lưu cấu hình</button>
        </div>
      </div>
    )
  }

  // Thông tin hệ thống content
  const renderThongTinHeThongContent = () => {
    return (
      <div className="cai-dat-content">
        <SectionHeader 
          title="THÔNG TIN HỆ THỐNG" 
          subtitle="Cấu hình thông tin hiển thị chung của hệ thống"
        />

        <div className="cai-dat-form">
          <div className="cai-dat-form__group">
            <label className="cai-dat-form__label">Tên đơn vị</label>
            <input 
              type="text" 
              className="cai-dat-form__input" 
              value={heThongConfig.tenDonVi}
              onChange={(e) => setHeThongConfig(prev => ({ ...prev, tenDonVi: e.target.value }))}
            />
          </div>

          <div className="cai-dat-form__group">
            <label className="cai-dat-form__label">Tên hệ thống</label>
            <input 
              type="text" 
              className="cai-dat-form__input" 
              value={heThongConfig.tenHeThong}
              onChange={(e) => setHeThongConfig(prev => ({ ...prev, tenHeThong: e.target.value }))}
            />
          </div>

          <div className="cai-dat-form__row">
            <div className="cai-dat-form__group">
              <label className="cai-dat-form__label">Email liên hệ</label>
              <input 
                type="email" 
                className="cai-dat-form__input" 
                value={heThongConfig.email}
                onChange={(e) => setHeThongConfig(prev => ({ ...prev, email: e.target.value }))}
              />
            </div>

            <div className="cai-dat-form__group">
              <label className="cai-dat-form__label">Số điện thoại</label>
              <input 
                type="text" 
                className="cai-dat-form__input" 
                value={heThongConfig.soDienThoai}
                onChange={(e) => setHeThongConfig(prev => ({ ...prev, soDienThoai: e.target.value }))}
              />
            </div>
          </div>

          <div className="cai-dat-form__group">
            <label className="cai-dat-form__label">Địa chỉ</label>
            <input 
              type="text" 
              className="cai-dat-form__input" 
              value={heThongConfig.diaChi}
              onChange={(e) => setHeThongConfig(prev => ({ ...prev, diaChi: e.target.value }))}
            />
          </div>

          <div className="cai-dat-form__group">
            <label className="cai-dat-form__label">Logo</label>
            <div className="cai-dat-form__logo">
              <div className="cai-dat-form__logo-preview">
                <span className="cai-dat-form__logo-placeholder">VWA</span>
              </div>
              <button className="cai-dat-btn cai-dat-btn--secondary">
                {Icons.image} Xem logo
              </button>
              <button className="cai-dat-btn cai-dat-btn--secondary">
                {Icons.upload} Thay đổi
              </button>
            </div>
          </div>
        </div>

        <div className="cai-dat-form__actions">
          <button className="cai-dat-btn cai-dat-btn--secondary">Hủy</button>
          <button className="cai-dat-btn cai-dat-btn--primary">Lưu thay đổi</button>
        </div>
      </div>
    )
  }

  // Sao lưu dữ liệu content
  const renderSaoLuuDuLieuContent = () => {
    const columns: TableColumn[] = [
      { key: 'thoiGian', label: 'Thời gian', width: '160px' },
      { key: 'nguoiThucHien', label: 'Người thực hiện', width: '150px' },
      { key: 'loai', label: 'Loại', width: '100px' },
      { key: 'dungLuong', label: 'Dung lượng', width: '100px' },
      { key: 'trangThai', label: 'Trạng thái', width: '130px' },
    ]

    return (
      <div className="cai-dat-content">
        <SectionHeader 
          title="SAO LƯU & DỮ LIỆU" 
          subtitle="Quản lý việc sao lưu và xuất dữ liệu hệ thống"
        />

        <div className="cai-dat-backup-grid">
          <Card title="SAO LƯU DỮ LIỆU">
            <p className="cai-dat-card__description">Sao lưu dữ liệu hệ thống</p>
            <div className="cai-dat-card__info">
              <span className="cai-dat-card__info-label">{Icons.clock} Lần sao lưu gần nhất:</span>
              <span className="cai-dat-card__info-value">28/09/2026 17:30</span>
            </div>
            <button className="cai-dat-btn cai-dat-btn--primary">
              {Icons.downloadCloud} Sao lưu ngay
            </button>
          </Card>

          <Card title="XUẤT DỮ LIỆU">
            <p className="cai-dat-card__description">Xuất dữ liệu ra file</p>
            <div className="cai-dat-card__checkboxes">
              <label className="cai-dat-checkbox">
                <input type="checkbox" defaultChecked />
                <span>Sinh viên</span>
              </label>
              <label className="cai-dat-checkbox">
                <input type="checkbox" defaultChecked />
                <span>Hồ sơ</span>
              </label>
              <label className="cai-dat-checkbox">
                <input type="checkbox" defaultChecked />
                <span>Giấy tờ</span>
              </label>
              <label className="cai-dat-checkbox">
                <input type="checkbox" />
                <span>Toàn bộ dữ liệu</span>
              </label>
            </div>
            <button className="cai-dat-btn cai-dat-btn--primary">
              {Icons.upload} Xuất dữ liệu
            </button>
          </Card>
        </div>

        <div className="cai-dat-content__section">
          <SectionHeader title="LỊCH SỬ SAO LƯU" />
          
          <Table
            columns={columns}
            data={MOCK_LICH_SU_SAO_LUU}
            renderRow={(item) => (
              <tr key={item.id}>
                <td className="cai-dat-table__cell">{item.thoiGian}</td>
                <td className="cai-dat-table__cell">{item.nguoiThucHien}</td>
                <td className="cai-dat-table__cell">{item.loai}</td>
                <td className="cai-dat-table__cell">{item.dungLuong}</td>
                <td className="cai-dat-table__cell"><StatusBadge status={item.trangThai} /></td>
              </tr>
            )}
          />
        </div>
      </div>
    )
  }

  // Render modal based on active menu
  const renderModal = () => {
    let title = ''
    let content = null

    switch (activeMenu) {
      case 'nganh':
        title = modalMode === 'add' ? 'THÊM NGÀNH' : 'SỬA NGÀNH'
        content = (
          <div className="cai-dat-form">
            <div className="cai-dat-form__group">
              <label className="cai-dat-form__label">Mã ngành</label>
              <input type="text" className="cai-dat-form__input" placeholder="Ví dụ: 7480201" />
            </div>
            <div className="cai-dat-form__group">
              <label className="cai-dat-form__label">Tên ngành</label>
              <input type="text" className="cai-dat-form__input" placeholder="Ví dụ: Công nghệ thông tin" />
            </div>
            <div className="cai-dat-form__group">
              <label className="cai-dat-form__label">Trạng thái</label>
              <select className="cai-dat-form__select">
                <option value="dang-su-dung">Đang sử dụng</option>
                <option value="ngung-su-dung">Ngừng sử dụng</option>
              </select>
            </div>
          </div>
        )
        break

      case 'khoa':
        title = modalMode === 'add' ? 'THÊM KHÓA' : 'SỬA KHÓA'
        content = (
          <div className="cai-dat-form">
            <div className="cai-dat-form__row">
              <div className="cai-dat-form__group">
                <label className="cai-dat-form__label">Mã khóa</label>
                <input type="text" className="cai-dat-form__input" placeholder="Ví dụ: K14" />
              </div>
              <div className="cai-dat-form__group">
                <label className="cai-dat-form__label">Tên khóa</label>
                <input type="text" className="cai-dat-form__input" placeholder="Ví dụ: Khóa 14" />
              </div>
            </div>
            <div className="cai-dat-form__row">
              <div className="cai-dat-form__group">
                <label className="cai-dat-form__label">Năm bắt đầu</label>
                <input type="number" className="cai-dat-form__input" placeholder="Ví dụ: 2025" />
              </div>
              <div className="cai-dat-form__group">
                <label className="cai-dat-form__label">Năm kết thúc</label>
                <input type="number" className="cai-dat-form__input" placeholder="Ví dụ: 2029" />
              </div>
            </div>
            <div className="cai-dat-form__group">
              <label className="cai-dat-form__label">Trạng thái</label>
              <select className="cai-dat-form__select">
                <option value="dang-su-dung">Đang sử dụng</option>
                <option value="ngung-su-dung">Ngừng sử dụng</option>
              </select>
            </div>
          </div>
        )
        break

      case 'lop':
        title = modalMode === 'add' ? 'THÊM LỚP' : 'SỬA LỚP'
        content = (
          <div className="cai-dat-form">
            <div className="cai-dat-form__row">
              <div className="cai-dat-form__group">
                <label className="cai-dat-form__label">Mã lớp</label>
                <input type="text" className="cai-dat-form__input" placeholder="Ví dụ: CNTT14A" />
              </div>
              <div className="cai-dat-form__group">
                <label className="cai-dat-form__label">Tên lớp</label>
                <input type="text" className="cai-dat-form__input" placeholder="Ví dụ: CNTT14A" />
              </div>
            </div>
            <div className="cai-dat-form__row">
              <div className="cai-dat-form__group">
                <label className="cai-dat-form__label">Ngành</label>
                <select className="cai-dat-form__select">
                  <option value="">Chọn ngành</option>
                  {MOCK_NGANH.filter(n => n.trangThai === 'Đang sử dụng').map(n => (
                    <option key={n.id} value={n.maNganh}>{n.tenNganh}</option>
                  ))}
                </select>
              </div>
              <div className="cai-dat-form__group">
                <label className="cai-dat-form__label">Khóa</label>
                <select className="cai-dat-form__select">
                  <option value="">Chọn khóa</option>
                  {MOCK_KHOA.filter(k => k.trangThai === 'Đang sử dụng').map(k => (
                    <option key={k.id} value={k.maKhoa}>{k.tenKhoa}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="cai-dat-form__group">
              <label className="cai-dat-form__label">Trạng thái</label>
              <select className="cai-dat-form__select">
                <option value="dang-su-dung">Đang sử dụng</option>
                <option value="ngung-su-dung">Ngừng sử dụng</option>
              </select>
            </div>
          </div>
        )
        break

      case 'loai-giay-to':
        title = modalMode === 'add' ? 'THÊM LOẠI GIẤY TỜ' : 'SỬA LOẠI GIẤY TỜ'
        content = (
          <div className="cai-dat-form">
            <div className="cai-dat-form__row">
              <div className="cai-dat-form__group">
                <label className="cai-dat-form__label">Mã loại</label>
                <input type="text" className="cai-dat-form__input" placeholder="Ví dụ: CCCD" />
              </div>
              <div className="cai-dat-form__group">
                <label className="cai-dat-form__label">Thứ tự hiển thị</label>
                <input type="number" className="cai-dat-form__input" placeholder="Ví dụ: 1" />
              </div>
            </div>
            <div className="cai-dat-form__group">
              <label className="cai-dat-form__label">Tên giấy tờ</label>
              <input type="text" className="cai-dat-form__input" placeholder="Ví dụ: Căn cước công dân" />
            </div>
            <div className="cai-dat-form__group">
              <label className="cai-dat-form__label">Mô tả</label>
              <textarea className="cai-dat-form__textarea" placeholder="Mô tả ngắn về giấy tờ..." rows={3}></textarea>
            </div>
            <div className="cai-dat-form__row">
              <div className="cai-dat-form__group">
                <label className="cai-dat-form__label">Bắt buộc</label>
                <select className="cai-dat-form__select">
                  <option value="true">Có</option>
                  <option value="false">Không</option>
                </select>
              </div>
              <div className="cai-dat-form__group">
                <label className="cai-dat-form__label">Trạng thái</label>
                <select className="cai-dat-form__select">
                  <option value="dang-su-dung">Đang sử dụng</option>
                  <option value="ngung-su-dung">Ngừng sử dụng</option>
                </select>
              </div>
            </div>
          </div>
        )
        break

      case 'nguoi-dung':
        title = modalMode === 'add' ? 'THÊM NGƯỜI DÙNG' : 'SỬA NGƯỜI DÙNG'
        content = (
          <div className="cai-dat-form">
            <div className="cai-dat-form__group">
              <label className="cai-dat-form__label">Họ tên</label>
              <input type="text" className="cai-dat-form__input" placeholder="Họ và tên đầy đủ" />
            </div>
            <div className="cai-dat-form__row">
              <div className="cai-dat-form__group">
                <label className="cai-dat-form__label">Username</label>
                <input type="text" className="cai-dat-form__input" placeholder="Tên đăng nhập" />
              </div>
              <div className="cai-dat-form__group">
                <label className="cai-dat-form__label">Email</label>
                <input type="email" className="cai-dat-form__input" placeholder="email@vwa.edu.vn" />
              </div>
            </div>
            <div className="cai-dat-form__row">
              <div className="cai-dat-form__group">
                <label className="cai-dat-form__label">Vai trò</label>
                <select className="cai-dat-form__select">
                  <option value="quan-tri-vien">Quản trị viên</option>
                  <option value="can-bo-dao-tao">Cán bộ đào tạo</option>
                  <option value="can-bo-tiep-nhan">Cán bộ tiếp nhận</option>
                  <option value="nguoi-xem">Người xem</option>
                </select>
              </div>
              <div className="cai-dat-form__group">
                <label className="cai-dat-form__label">Trạng thái</label>
                <select className="cai-dat-form__select">
                  <option value="hoat-dong">Hoạt động</option>
                  <option value="khoa">Khóa</option>
                </select>
              </div>
            </div>
          </div>
        )
        break

      case 'trang-thai-hoc-vu':
      case 'trang-thai-ho-so':
      case 'trang-thai-giay-to':
        title = modalMode === 'add' ? 'THÊM TRẠNG THÁI' : 'SỬA TRẠNG THÁI'
        content = (
          <div className="cai-dat-form">
            <div className="cai-dat-form__group">
              <label className="cai-dat-form__label">Tên trạng thái</label>
              <input type="text" className="cai-dat-form__input" placeholder="Ví dụ: Đang học" />
            </div>
            <div className="cai-dat-form__group">
              <label className="cai-dat-form__label">Mô tả</label>
              <textarea className="cai-dat-form__textarea" placeholder="Mô tả ngắn..." rows={3}></textarea>
            </div>
            <div className="cai-dat-form__group">
              <label className="cai-dat-form__label">Trạng thái</label>
              <select className="cai-dat-form__select">
                <option value="dang-su-dung">Đang sử dụng</option>
                <option value="ngung-su-dung">Ngừng sử dụng</option>
              </select>
            </div>
          </div>
        )
        break

      case 'cau-hinh-rut-ho-so':
        title = modalMode === 'add' ? 'THÊM LÝ DO' : 'SỬA LÝ DO'
        content = (
          <div className="cai-dat-form">
            <div className="cai-dat-form__group">
              <label className="cai-dat-form__label">Tên lý do</label>
              <input type="text" className="cai-dat-form__input" placeholder="Ví dụ: Chuyển trường" />
            </div>
            <div className="cai-dat-form__group">
              <label className="cai-dat-form__label">Trạng thái</label>
              <select className="cai-dat-form__select">
                <option value="dang-su-dung">Đang sử dụng</option>
                <option value="ngung-su-dung">Ngừng sử dụng</option>
              </select>
            </div>
          </div>
        )
        break

      default:
        content = null
    }

    if (!content) return null

    return (
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={title}
        footer={modalFooter}
      >
        {content}
      </Modal>
    )
  }

  return (
    <div className="trang-cai-dat">
      {/* Header */}
      <div className="cai-dat-header">
        <h1 className="cai-dat-header__title">Cài đặt</h1>
        <p className="cai-dat-header__subtitle">Quản lý và cấu hình hệ thống</p>
      </div>

      <div className="cai-dat-layout">
        {/* Sidebar Menu */}
        <aside className="cai-dat-sidebar">
          <nav className="cai-dat-nav">
            {menuTree.map((item) => (
              <div key={item.id} className="cai-dat-nav__group">
                <button
                  className={`cai-dat-nav__item ${
                    (activeMenu === item.id || item.children?.some(c => c.id === activeMenu)) 
                      ? 'cai-dat-nav__item--active' 
                      : ''
                  }`}
                  onClick={() => {
                    if (item.children && item.children.length > 0) {
                      toggleMenu(item.id)
                    } else {
                      handleMenuClick(item.id)
                    }
                  }}
                >
                  <span className="cai-dat-nav__icon">{item.icon}</span>
                  <span className="cai-dat-nav__label">{item.label}</span>
                  {item.children && item.children.length > 0 && (
                    <span className="cai-dat-nav__arrow">
                      {expandedMenu.includes(item.id) ? Icons.chevronDown : Icons.chevronRight}
                    </span>
                  )}
                </button>

                {item.children && item.children.length > 0 && expandedMenu.includes(item.id) && (
                  <div className="cai-dat-nav__children">
                    {item.children.map((child) => (
                      <button
                        key={child.id}
                        className={`cai-dat-nav__child ${activeMenu === child.id ? 'cai-dat-nav__child--active' : ''}`}
                        onClick={() => handleMenuClick(child.id)}
                      >
                        {child.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="cai-dat-main">
          {renderContent()}
        </main>
      </div>

      {/* Modal */}
      {renderModal()}
    </div>
  )
}
