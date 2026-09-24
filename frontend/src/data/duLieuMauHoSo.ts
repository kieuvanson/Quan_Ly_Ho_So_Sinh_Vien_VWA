/**
 * Mock data cho trang Danh sách hồ sơ sinh viên.
 * Dữ liệu hoàn toàn giả lập, không sử dụng thông tin cá nhân thật.
 */

export type TrangThaiHoSo = 'DAYDU' | 'THIEU' | 'DANG_BO_SUNG'

export interface SinhVien {
  mssv: string
  hoTen: string
  cccd: string
  ngaySinh: string
  nganh: string
  khoa: string
  trangThai: TrangThaiHoSo
  // Extended fields for detail page
  gioiTinh: string
  soDienThoai: string
  lopHanhChinh: string
}

export const TRANG_THAI_HO_SO: Record<TrangThaiHoSo, { label: string; className: string }> = {
  DAYDU: { label: 'Đầy đủ', className: 'badge--success' },
  THIEU: { label: 'Thiếu hồ sơ', className: 'badge--danger' },
  DANG_BO_SUNG: { label: 'Đang bổ sung', className: 'badge--warning' },
}

export interface GiayToItem {
  id: string
  ten: string
  coGiayTo: boolean
  soLuong: number
  ghiChu: string
}

export interface AuditLog {
  id: string
  ngay: string
  hanhDong: string
  moTa: string
  nguoiThucHien: string
}

// Danh mục 13 giấy tờ cố định
export const DANH_MUC_GIAY_TO = [
  { id: 'gt1', ten: 'Giấy KQ thi gốc' },
  { id: 'gt2', ten: 'Giấy KQ thi sao' },
  { id: 'gt3', ten: 'Bằng tốt nghiệp THPT' },
  { id: 'gt4', ten: 'Bằng tốt nghiệp THPT bản sao' },
  { id: 'gt5', ten: 'Học bạ gốc' },
  { id: 'gt6', ten: 'Học bạ sao' },
  { id: 'gt7', ten: 'CCCD' },
  { id: 'gt8', ten: 'Giấy khai sinh' },
  { id: 'gt9', ten: 'Chứng chỉ ngoại ngữ' },
  { id: 'gt10', ten: 'Chứng chỉ ngoại ngữ sao' },
  { id: 'gt11', ten: 'Giấy CN học sinh giỏi' },
  { id: 'gt12', ten: 'Giấy CN học sinh giỏi sao' },
  { id: 'gt13', ten: 'Chứng chỉ SPT/HAS' },
]

export const mockAuditLogs: Record<string, AuditLog[]> = {
  VWA20220001: [
    { id: 'a1', ngay: '15/08/2022', hanhDong: 'Tiếp nhận hồ sơ', moTa: 'Tiếp nhận hồ sơ nhập học', nguoiThucHien: 'Nguyễn Thị Lan' },
    { id: 'a2', ngay: '20/09/2022', hanhDong: 'Cập nhật', moTa: 'Cập nhật thông tin CCCD', nguoiThucHien: 'Trần Văn Nam' },
    { id: 'a3', ngay: '10/01/2023', hanhDong: 'Bổ sung', moTa: 'Bổ sung giấy tờ', nguoiThucHien: 'Nguyễn Thị Lan' },
  ],
  VWA20220002: [
    { id: 'b1', ngay: '20/08/2022', hanhDong: 'Tiếp nhận hồ sơ', moTa: 'Tiếp nhận hồ sơ nhập học', nguoiThucHien: 'Nguyễn Thị Lan' },
    { id: 'b2', ngay: '05/12/2023', hanhDong: 'Cảnh báo', moTa: 'Cảnh báo thiếu hồ sơ', nguoiThucHien: 'Trần Văn Nam' },
  ],
  default: [
    { id: 'd1', ngay: '01/09/2020', hanhDong: 'Tiếp nhận hồ sơ', moTa: 'Tiếp nhận hồ sơ nhập học', nguoiThucHien: 'Nguyễn Thị Lan' },
    { id: 'd2', ngay: '15/06/2023', hanhDong: 'Cập nhật', moTa: 'Cập nhật thông tin sinh viên', nguoiThucHien: 'Trần Văn Nam' },
  ],
}

export const NGANH_OPTIONS = [
  'Tất cả',
  'Công nghệ thông tin',
  'Quản trị kinh doanh',
  'Kế toán',
  'Ngôn ngữ Anh',
  'Luật',
  'Tài chính - Ngân hàng',
  'Quan hệ quốc tế',
]

export const KHOA_OPTIONS = [
  'Tất cả',
  'K2022',
  'K2021',
  'K2020',
  'K2019',
  'K2018',
]

export const mockSinhVienList: SinhVien[] = [
  {
    mssv: 'VWA20220001',
    hoTen: 'Nguyễn Thị Hương Giang',
    cccd: '025891234567',
    ngaySinh: '15/03/2004',
    nganh: 'Công nghệ thông tin',
    khoa: 'K2022',
    trangThai: 'DAYDU',
    gioiTinh: 'Nữ',
    soDienThoai: '0912345678',
    lopHanhChinh: 'CNTT-2022.1',
  },
  {
    mssv: 'VWA20220002',
    hoTen: 'Trần Văn Minh',
    cccd: '031456789012',
    ngaySinh: '22/07/2004',
    nganh: 'Quản trị kinh doanh',
    khoa: 'K2022',
    trangThai: 'THIEU',
    gioiTinh: 'Nam',
    soDienThoai: '0923456789',
    lopHanhChinh: 'QTKD-2022.2',
  },
  {
    mssv: 'VWA20210015',
    hoTen: 'Lê Thị Mai Lan',
    cccd: '042123456789',
    ngaySinh: '08/11/2003',
    nganh: 'Kế toán',
    khoa: 'K2021',
    trangThai: 'DAYDU',
    gioiTinh: 'Nữ',
    soDienThoai: '0934567890',
    lopHanhChinh: 'KT-2021.1',
  },
  {
    mssv: 'VWA20210022',
    hoTen: 'Phạm Đức Anh',
    cccd: '056789012345',
    ngaySinh: '30/04/2003',
    nganh: 'Công nghệ thông tin',
    khoa: 'K2021',
    trangThai: 'DANG_BO_SUNG',
    gioiTinh: 'Nam',
    soDienThoai: '0945678901',
    lopHanhChinh: 'CNTT-2021.1',
  },
  {
    mssv: 'VWA20200008',
    hoTen: 'Hoàng Thị Thu Hà',
    cccd: '063012345678',
    ngaySinh: '12/09/2002',
    nganh: 'Ngôn ngữ Anh',
    khoa: 'K2020',
    trangThai: 'DAYDU',
    gioiTinh: 'Nữ',
    soDienThoai: '0956789012',
    lopHanhChinh: 'NN-2020.1',
  },
  {
    mssv: 'VWA20200019',
    hoTen: 'Đặng Quang Huy',
    cccd: '079345678901',
    ngaySinh: '25/12/2002',
    nganh: 'Luật',
    khoa: 'K2020',
    trangThai: 'THIEU',
    gioiTinh: 'Nam',
    soDienThoai: '0967890123',
    lopHanhChinh: 'Luat-2020.1',
  },
  {
    mssv: 'VWA20190033',
    hoTen: 'Vũ Thị Ngọc Bích',
    cccd: '082678901234',
    ngaySinh: '03/06/2001',
    nganh: 'Tài chính - Ngân hàng',
    khoa: 'K2019',
    trangThai: 'DAYDU',
    gioiTinh: 'Nữ',
    soDienThoai: '0978901234',
    lopHanhChinh: 'TCNH-2019.1',
  },
  {
    mssv: 'VWA20190045',
    hoTen: 'Bùi Minh Tuấn',
    cccd: '095901234567',
    ngaySinh: '18/01/2001',
    nganh: 'Quan hệ quốc tế',
    khoa: 'K2019',
    trangThai: 'DANG_BO_SUNG',
    gioiTinh: 'Nam',
    soDienThoai: '0989012345',
    lopHanhChinh: 'QHQT-2019.1',
  },
  {
    mssv: 'VWA20220035',
    hoTen: 'Ngô Thị Hồng Nhung',
    cccd: '018234567890',
    ngaySinh: '07/08/2004',
    nganh: 'Quản trị kinh doanh',
    khoa: 'K2022',
    trangThai: 'DAYDU',
    gioiTinh: 'Nữ',
    soDienThoai: '0990123456',
    lopHanhChinh: 'QTKD-2022.3',
  },
  {
    mssv: 'VWA20210056',
    hoTen: 'Lý Thanh Long',
    cccd: '023567890123',
    ngaySinh: '19/02/2003',
    nganh: 'Công nghệ thông tin',
    khoa: 'K2021',
    trangThai: 'THIEU',
    gioiTinh: 'Nam',
    soDienThoai: '0901234567',
    lopHanhChinh: 'CNTT-2021.2',
  },
  {
    mssv: 'VWA20200067',
    hoTen: 'Trịnh Thị Phương Thảo',
    cccd: '036890123456',
    ngaySinh: '28/05/2002',
    nganh: 'Kế toán',
    khoa: 'K2020',
    trangThai: 'DAYDU',
    gioiTinh: 'Nữ',
    soDienThoai: '0912345670',
    lopHanhChinh: 'KT-2020.2',
  },
  {
    mssv: 'VWA20180012',
    hoTen: 'Phan Văn Đức',
    cccd: '049123456789',
    ngaySinh: '14/10/2000',
    nganh: 'Luật',
    khoa: 'K2018',
    trangThai: 'DAYDU',
    gioiTinh: 'Nam',
    soDienThoai: '0923456780',
    lopHanhChinh: 'Luat-2018.1',
  },
  {
    mssv: 'VWA20220078',
    hoTen: 'Đào Minh Châu',
    cccd: '062345678901',
    ngaySinh: '21/11/2004',
    nganh: 'Tài chính - Ngân hàng',
    khoa: 'K2022',
    trangThai: 'DANG_BO_SUNG',
    gioiTinh: 'Nữ',
    soDienThoai: '0934567891',
    lopHanhChinh: 'TCNH-2022.1',
  },
  {
    mssv: 'VWA20210089',
    hoTen: 'Cao Thị Lan Anh',
    cccd: '075678901234',
    ngaySinh: '05/04/2003',
    nganh: 'Ngôn ngữ Anh',
    khoa: 'K2021',
    trangThai: 'DAYDU',
    gioiTinh: 'Nữ',
    soDienThoai: '0945678902',
    lopHanhChinh: 'NN-2021.2',
  },
  {
    mssv: 'VWA20190091',
    hoTen: 'Hồ Văn Phong',
    cccd: '088901234567',
    ngaySinh: '11/07/2001',
    nganh: 'Quan hệ quốc tế',
    khoa: 'K2019',
    trangThai: 'THIEU',
    gioiTinh: 'Nam',
    soDienThoai: '0956789013',
    lopHanhChinh: 'QHQT-2019.2',
  },
]

// Mock giấy tờ cho từng sinh viên (13 giấy tờ cố định)
export const mockGiayToList: Record<string, GiayToItem[]> = {
  VWA20220001: [
    { id: 'gt1', ten: 'Giấy KQ thi gốc', coGiayTo: true, soLuong: 1, ghiChu: '' },
    { id: 'gt2', ten: 'Giấy KQ thi sao', coGiayTo: true, soLuong: 2, ghiChu: '' },
    { id: 'gt3', ten: 'Bằng tốt nghiệp THPT', coGiayTo: true, soLuong: 1, ghiChu: '' },
    { id: 'gt4', ten: 'Bằng tốt nghiệp THPT bản sao', coGiayTo: true, soLuong: 1, ghiChu: '' },
    { id: 'gt5', ten: 'Học bạ gốc', coGiayTo: true, soLuong: 1, ghiChu: '' },
    { id: 'gt6', ten: 'Học bạ sao', coGiayTo: true, soLuong: 1, ghiChu: '' },
    { id: 'gt7', ten: 'CCCD', coGiayTo: true, soLuong: 1, ghiChu: '' },
    { id: 'gt8', ten: 'Giấy khai sinh', coGiayTo: true, soLuong: 1, ghiChu: '' },
    { id: 'gt9', ten: 'Chứng chỉ ngoại ngữ', coGiayTo: true, soLuong: 1, ghiChu: 'IELTS 6.5' },
    { id: 'gt10', ten: 'Chứng chỉ ngoại ngữ sao', coGiayTo: false, soLuong: 0, ghiChu: '' },
    { id: 'gt11', ten: 'Giấy CN học sinh giỏi', coGiayTo: false, soLuong: 0, ghiChu: '' },
    { id: 'gt12', ten: 'Giấy CN học sinh giỏi sao', coGiayTo: false, soLuong: 0, ghiChu: '' },
    { id: 'gt13', ten: 'Chứng chỉ SPT/HAS', coGiayTo: false, soLuong: 0, ghiChu: '' },
  ],
  VWA20220002: [
    { id: 'gt1', ten: 'Giấy KQ thi gốc', coGiayTo: true, soLuong: 1, ghiChu: '' },
    { id: 'gt2', ten: 'Giấy KQ thi sao', coGiayTo: false, soLuong: 0, ghiChu: '' },
    { id: 'gt3', ten: 'Bằng tốt nghiệp THPT', coGiayTo: true, soLuong: 1, ghiChu: '' },
    { id: 'gt4', ten: 'Bằng tốt nghiệp THPT bản sao', coGiayTo: false, soLuong: 0, ghiChu: '' },
    { id: 'gt5', ten: 'Học bạ gốc', coGiayTo: true, soLuong: 1, ghiChu: '' },
    { id: 'gt6', ten: 'Học bạ sao', coGiayTo: false, soLuong: 0, ghiChu: '' },
    { id: 'gt7', ten: 'CCCD', coGiayTo: true, soLuong: 1, ghiChu: '' },
    { id: 'gt8', ten: 'Giấy khai sinh', coGiayTo: false, soLuong: 0, ghiChu: '' },
    { id: 'gt9', ten: 'Chứng chỉ ngoại ngữ', coGiayTo: false, soLuong: 0, ghiChu: '' },
    { id: 'gt10', ten: 'Chứng chỉ ngoại ngữ sao', coGiayTo: false, soLuong: 0, ghiChu: '' },
    { id: 'gt11', ten: 'Giấy CN học sinh giỏi', coGiayTo: false, soLuong: 0, ghiChu: '' },
    { id: 'gt12', ten: 'Giấy CN học sinh giỏi sao', coGiayTo: false, soLuong: 0, ghiChu: '' },
    { id: 'gt13', ten: 'Chứng chỉ SPT/HAS', coGiayTo: false, soLuong: 0, ghiChu: '' },
  ],
  VWA20210015: [
    { id: 'gt1', ten: 'Giấy KQ thi gốc', coGiayTo: true, soLuong: 1, ghiChu: '' },
    { id: 'gt2', ten: 'Giấy KQ thi sao', coGiayTo: true, soLuong: 1, ghiChu: '' },
    { id: 'gt3', ten: 'Bằng tốt nghiệp THPT', coGiayTo: true, soLuong: 1, ghiChu: '' },
    { id: 'gt4', ten: 'Bằng tốt nghiệp THPT bản sao', coGiayTo: true, soLuong: 1, ghiChu: '' },
    { id: 'gt5', ten: 'Học bạ gốc', coGiayTo: true, soLuong: 1, ghiChu: '' },
    { id: 'gt6', ten: 'Học bạ sao', coGiayTo: true, soLuong: 1, ghiChu: '' },
    { id: 'gt7', ten: 'CCCD', coGiayTo: true, soLuong: 1, ghiChu: '' },
    { id: 'gt8', ten: 'Giấy khai sinh', coGiayTo: true, soLuong: 1, ghiChu: '' },
    { id: 'gt9', ten: 'Chứng chỉ ngoại ngữ', coGiayTo: true, soLuong: 1, ghiChu: 'TOIEC 750' },
    { id: 'gt10', ten: 'Chứng chỉ ngoại ngữ sao', coGiayTo: true, soLuong: 1, ghiChu: '' },
    { id: 'gt11', ten: 'Giấy CN học sinh giỏi', coGiayTo: true, soLuong: 1, ghiChu: 'Học sinh giỏi cấp tỉnh' },
    { id: 'gt12', ten: 'Giấy CN học sinh giỏi sao', coGiayTo: true, soLuong: 1, ghiChu: '' },
    { id: 'gt13', ten: 'Chứng chỉ SPT/HAS', coGiayTo: false, soLuong: 0, ghiChu: '' },
  ],
  VWA20210022: [
    { id: 'gt1', ten: 'Giấy KQ thi gốc', coGiayTo: true, soLuong: 1, ghiChu: '' },
    { id: 'gt2', ten: 'Giấy KQ thi sao', coGiayTo: true, soLuong: 1, ghiChu: '' },
    { id: 'gt3', ten: 'Bằng tốt nghiệp THPT', coGiayTo: true, soLuong: 1, ghiChu: '' },
    { id: 'gt4', ten: 'Bằng tốt nghiệp THPT bản sao', coGiayTo: false, soLuong: 0, ghiChu: 'Cần bổ sung' },
    { id: 'gt5', ten: 'Học bạ gốc', coGiayTo: true, soLuong: 1, ghiChu: '' },
    { id: 'gt6', ten: 'Học bạ sao', coGiayTo: false, soLuong: 0, ghiChu: '' },
    { id: 'gt7', ten: 'CCCD', coGiayTo: true, soLuong: 1, ghiChu: '' },
    { id: 'gt8', ten: 'Giấy khai sinh', coGiayTo: true, soLuong: 1, ghiChu: '' },
    { id: 'gt9', ten: 'Chứng chỉ ngoại ngữ', coGiayTo: false, soLuong: 0, ghiChu: '' },
    { id: 'gt10', ten: 'Chứng chỉ ngoại ngữ sao', coGiayTo: false, soLuong: 0, ghiChu: '' },
    { id: 'gt11', ten: 'Giấy CN học sinh giỏi', coGiayTo: false, soLuong: 0, ghiChu: '' },
    { id: 'gt12', ten: 'Giấy CN học sinh giỏi sao', coGiayTo: false, soLuong: 0, ghiChu: '' },
    { id: 'gt13', ten: 'Chứng chỉ SPT/HAS', coGiayTo: false, soLuong: 0, ghiChu: '' },
  ],
  default: [
    { id: 'gt1', ten: 'Giấy KQ thi gốc', coGiayTo: true, soLuong: 1, ghiChu: '' },
    { id: 'gt2', ten: 'Giấy KQ thi sao', coGiayTo: true, soLuong: 1, ghiChu: '' },
    { id: 'gt3', ten: 'Bằng tốt nghiệp THPT', coGiayTo: true, soLuong: 1, ghiChu: '' },
    { id: 'gt4', ten: 'Bằng tốt nghiệp THPT bản sao', coGiayTo: true, soLuong: 1, ghiChu: '' },
    { id: 'gt5', ten: 'Học bạ gốc', coGiayTo: true, soLuong: 1, ghiChu: '' },
    { id: 'gt6', ten: 'Học bạ sao', coGiayTo: true, soLuong: 1, ghiChu: '' },
    { id: 'gt7', ten: 'CCCD', coGiayTo: true, soLuong: 1, ghiChu: '' },
    { id: 'gt8', ten: 'Giấy khai sinh', coGiayTo: true, soLuong: 1, ghiChu: '' },
    { id: 'gt9', ten: 'Chứng chỉ ngoại ngữ', coGiayTo: false, soLuong: 0, ghiChu: '' },
    { id: 'gt10', ten: 'Chứng chỉ ngoại ngữ sao', coGiayTo: false, soLuong: 0, ghiChu: '' },
    { id: 'gt11', ten: 'Giấy CN học sinh giỏi', coGiayTo: false, soLuong: 0, ghiChu: '' },
    { id: 'gt12', ten: 'Giấy CN học sinh giỏi sao', coGiayTo: false, soLuong: 0, ghiChu: '' },
    { id: 'gt13', ten: 'Chứng chỉ SPT/HAS', coGiayTo: false, soLuong: 0, ghiChu: '' },
  ],
}

// Helper functions
export function getSinhVienByMssv(mssv: string): SinhVien | undefined {
  return mockSinhVienList.find((sv) => sv.mssv === mssv)
}

export function updateSinhVien(mssv: string, updates: Partial<SinhVien>): SinhVien | undefined {
  const index = mockSinhVienList.findIndex((sv) => sv.mssv === mssv)
  if (index === -1) return undefined
  mockSinhVienList[index] = { ...mockSinhVienList[index], ...updates }
  return mockSinhVienList[index]
}

export function getGiayToByMssv(mssv: string): GiayToItem[] {
  return mockGiayToList[mssv] || mockGiayToList.default
}

export function getAuditLogsByMssv(mssv: string): AuditLog[] {
  return mockAuditLogs[mssv] || mockAuditLogs.default
}
