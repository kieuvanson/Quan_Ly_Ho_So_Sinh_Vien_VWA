import { useState } from 'react'
import './TrangLichSuAudit.css'

// Types
interface HoSoActivity {
  id: number
  thoiGian: string
  hoTen: string
  mssv: string
  noiDung: string
  giayTo: string
  trangThaiCu: string | null
  trangThaiMoi: string | null
  nguoiThucHien: string
}

interface MuonTraActivity {
  id: number
  thoiGian: string
  hoTen: string
  mssv: string
  hanhDong: string
  trangThai: string
  soPhieu: string
  canBoPhuTrach: string
  ghiChu: string
  nguoiThucHien: string
}

interface RutHoSoActivity {
  id: number
  thoiGian: string
  hoTen: string
  mssv: string
  hanhDong: string
  lyDo: string
  nguoiThucHien: string
}

interface ThongTinSVActivity {
  id: number
  thoiGian: string
  hoTen: string
  mssv: string
  truongThayDoi: string
  giaTriCu: string
  giaTriMoi: string
  nguoiThucHien: string
}

interface HeThongActivity {
  id: number
  thoiGian: string
  nguoiThucHien: string
  hanhDong: string
  noiDung: string
  ketQua: string
}

// Mock data
const MOCK_HO_SO: HoSoActivity[] = [
  { id: 1, thoiGian: '28/09/2026 14:32', hoTen: 'Nguyễn Văn A', mssv: '2151230001', noiDung: 'Cập nhật giấy tờ', giayTo: 'Căn cước công dân', trangThaiCu: 'Chưa nộp', trangThaiMoi: 'Đã nộp', nguoiThucHien: 'Nguyễn Thị B' },
  { id: 2, thoiGian: '28/09/2026 11:15', hoTen: 'Trần Thị C', mssv: '2151230002', noiDung: 'Bổ sung giấy tờ', giayTo: 'Bằng tốt nghiệp THPT', trangThaiCu: null, trangThaiMoi: 'Đã nộp', nguoiThucHien: 'Lê Văn D' },
  { id: 3, thoiGian: '27/09/2026 16:45', hoTen: 'Lê Hoàng E', mssv: '2151230003', noiDung: 'Xác nhận giấy tờ', giayTo: 'Sổ hộ khẩu', trangThaiCu: 'Thiếu', trangThaiMoi: 'Đã nộp', nguoiThucHien: 'Nguyễn Thị B' },
  { id: 4, thoiGian: '27/09/2026 09:20', hoTen: 'Phạm Thị F', mssv: '2151230004', noiDung: 'Cập nhật giấy tờ', giayTo: 'Ảnh thẻ 3x4', trangThaiCu: 'Không hợp lệ', trangThaiMoi: 'Đã nộp', nguoiThucHien: 'Trần Văn G' },
  { id: 5, thoiGian: '26/09/2026 15:30', hoTen: 'Hoàng Minh H', mssv: '2151230005', noiDung: 'Nộp giấy tờ', giayTo: 'Giấy xác nhận sinh viên', trangThaiCu: null, trangThaiMoi: 'Đã nộp', nguoiThucHien: 'Nguyễn Thị B' },
  { id: 6, thoiGian: '26/09/2026 10:00', hoTen: 'Đặng Thị I', mssv: '2151230006', noiDung: 'Cập nhật giấy tờ', giayTo: 'Căn cước công dân', trangThaiCu: 'Hết hạn', trangThaiMoi: 'Đã nộp', nguoiThucHien: 'Lê Văn D' },
  { id: 7, thoiGian: '25/09/2026 14:20', hoTen: 'Bùi Văn J', mssv: '2151230007', noiDung: 'Bổ sung giấy tờ', giayTo: 'Giấy khám sức khỏe', trangThaiCu: null, trangThaiMoi: 'Đã nộp', nguoiThucHien: 'Nguyễn Thị B' },
  { id: 8, thoiGian: '25/09/2026 09:15', hoTen: 'Vũ Thị K', mssv: '2151230008', noiDung: 'Xác nhận giấy tờ', giayTo: 'Bằng tốt nghiệp THPT', trangThaiCu: 'Chưa nộp', trangThaiMoi: 'Đã nộp', nguoiThucHien: 'Trần Văn G' },
  { id: 9, thoiGian: '24/09/2026 16:00', hoTen: 'Đỗ Văn L', mssv: '2151230009', noiDung: 'Cập nhật giấy tờ', giayTo: 'Sổ hộ khẩu', trangThaiCu: 'Thiếu', trangThaiMoi: 'Đã nộp', nguoiThucHien: 'Nguyễn Thị B' },
  { id: 10, thoiGian: '24/09/2026 11:30', hoTen: 'Trịnh Thị M', mssv: '2151230010', noiDung: 'Nộp giấy tờ', giayTo: 'Ảnh thẻ 3x4', trangThaiCu: null, trangThaiMoi: 'Đã nộp', nguoiThucHien: 'Lê Văn D' },
]

const MOCK_MUON_TRA: MuonTraActivity[] = [
  { id: 1, thoiGian: '28/09/2026 15:20', hoTen: 'Nguyễn Văn C', mssv: '2151230003', hanhDong: 'Mượn hồ sơ', trangThai: 'Đang mượn', soPhieu: 'PX-2026-0045', canBoPhuTrach: 'Trần Thị D', ghiChu: 'Mượn để làm thủ tục xin việc', nguoiThucHien: 'Trần Thị D' },
  { id: 2, thoiGian: '27/09/2026 10:30', hoTen: 'Lê Thị M', mssv: '2151230007', hanhDong: 'Trả hồ sơ', trangThai: 'Đã trả', soPhieu: 'PX-2026-0042', canBoPhuTrach: 'Nguyễn Thị B', ghiChu: 'Đã hoàn tất thủ tục', nguoiThucHien: 'Nguyễn Thị B' },
  { id: 3, thoiGian: '26/09/2026 14:15', hoTen: 'Trần Văn N', mssv: '2151230008', hanhDong: 'Gia hạn', trangThai: 'Đang mượn', soPhieu: 'PX-2026-0038', canBoPhuTrach: 'Lê Văn D', ghiChu: 'Gia hạn thêm 7 ngày', nguoiThucHien: 'Lê Văn D' },
  { id: 4, thoiGian: '25/09/2026 09:00', hoTen: 'Phạm Văn P', mssv: '2151230009', hanhDong: 'Mượn hồ sơ', trangThai: 'Quá hạn', soPhieu: 'PX-2026-0035', canBoPhuTrach: 'Nguyễn Thị B', ghiChu: 'Mượn để xin dịch thuật', nguoiThucHien: 'Nguyễn Thị B' },
  { id: 5, thoiGian: '24/09/2026 16:45', hoTen: 'Đặng Thị Q', mssv: '2151230010', hanhDong: 'Trả hồ sơ', trangThai: 'Đã trả', soPhieu: 'PX-2026-0030', canBoPhuTrach: 'Trần Thị D', ghiChu: '', nguoiThucHien: 'Trần Thị D' },
  { id: 6, thoiGian: '23/09/2026 11:20', hoTen: 'Hoàng Văn R', mssv: '2151230011', hanhDong: 'Mượn hồ sơ', trangThai: 'Đang mượn', soPhieu: 'PX-2026-0028', canBoPhuTrach: 'Lê Văn D', ghiChu: 'Mượn để xin visa', nguoiThucHien: 'Lê Văn D' },
  { id: 7, thoiGian: '22/09/2026 14:30', hoTen: 'Ngô Thị S', mssv: '2151230012', hanhDong: 'Trả hồ sơ', trangThai: 'Đã trả', soPhieu: 'PX-2026-0025', canBoPhuTrach: 'Nguyễn Thị B', ghiChu: '', nguoiThucHien: 'Nguyễn Thị B' },
  { id: 8, thoiGian: '21/09/2026 09:45', hoTen: 'Phan Văn T', mssv: '2151230013', hanhDong: 'Mượn hồ sơ', trangThai: 'Đã trả', soPhieu: 'PX-2026-0022', canBoPhuTrach: 'Trần Văn G', ghiChu: 'Mượn để xin việc', nguoiThucHien: 'Trần Văn G' },
]

const MOCK_RUT_HO_SO: RutHoSoActivity[] = [
  { id: 1, thoiGian: '27/09/2026 10:20', hoTen: 'Nguyễn Văn F', mssv: '2151230005', hanhDong: 'Yêu cầu rút hồ sơ', lyDo: 'Chuyển trường', nguoiThucHien: 'Nguyễn Thị B' },
  { id: 2, thoiGian: '25/09/2026 14:30', hoTen: 'Lê Thị R', mssv: '2151230011', hanhDong: 'Phê duyệt rút hồ sơ', lyDo: 'Hoàn tất thủ tục tốt nghiệp', nguoiThucHien: 'Trần Văn G' },
  { id: 3, thoiGian: '20/09/2026 11:00', hoTen: 'Trần Văn S', mssv: '2151230012', hanhDong: 'Yêu cầu rút hồ sơ', lyDo: 'Chuyển nghề', nguoiThucHien: 'Nguyễn Thị B' },
  { id: 4, thoiGian: '18/09/2026 09:15', hoTen: 'Phạm Thị T', mssv: '2151230013', hanhDong: 'Hủy yêu cầu rút hồ sơ', lyDo: 'Hủy bỏ', nguoiThucHien: 'Phạm Thị T' },
  { id: 5, thoiGian: '15/09/2026 16:00', hoTen: 'Hoàng Văn U', mssv: '2151230014', hanhDong: 'Yêu cầu rút hồ sơ', lyDo: 'Đi du học', nguoiThucHien: 'Lê Văn D' },
  { id: 6, thoiGian: '12/09/2026 10:30', hoTen: 'Vũ Thị V', mssv: '2151230015', hanhDong: 'Phê duyệt rút hồ sơ', lyDo: 'Chuyển trường', nguoiThucHien: 'Trần Văn G' },
]

const MOCK_THONG_TIN_SV: ThongTinSVActivity[] = [
  { id: 1, thoiGian: '26/09/2026 09:30', hoTen: 'Nguyễn Văn G', mssv: '2151230006', truongThayDoi: 'Số điện thoại', giaTriCu: '0912345678', giaTriMoi: '0987654321', nguoiThucHien: 'Nguyễn Thị B' },
  { id: 2, thoiGian: '25/09/2026 14:20', hoTen: 'Trần Thị H', mssv: '2151230015', truongThayDoi: 'Địa chỉ email', giaTriCu: 'tran.h@email.com', giaTriMoi: 'tran.h.nm@email.com', nguoiThucHien: 'Trần Thị H' },
  { id: 3, thoiGian: '24/09/2026 11:45', hoTen: 'Lê Văn I', mssv: '2151230016', truongThayDoi: 'Trạng thái học vụ', giaTriCu: 'Đang học', giaTriMoi: 'Bảo lưu', nguoiThucHien: 'Nguyễn Thị B' },
  { id: 4, thoiGian: '23/09/2026 16:30', hoTen: 'Phạm Văn J', mssv: '2151230017', truongThayDoi: 'Lớp', giaTriCu: 'CNTT-2021.1', giaTriMoi: 'CNTT-2021.2', nguoiThucHien: 'Lê Văn D' },
  { id: 5, thoiGian: '22/09/2026 08:00', hoTen: 'Hoàng Thị K', mssv: '2151230018', truongThayDoi: 'Số CCCD', giaTriCu: '012345678901', giaTriMoi: '012345678902', nguoiThucHien: 'Hoàng Thị K' },
  { id: 6, thoiGian: '20/09/2026 10:15', hoTen: 'Đặng Văn L', mssv: '2151230019', truongThayDoi: 'Địa chỉ', giaTriCu: '123 Nguyễn Trãi, Hà Nội', giaTriMoi: '456 Lê Lợi, HCM', nguoiThucHien: 'Nguyễn Thị B' },
]

const MOCK_HE_THONG: HeThongActivity[] = [
  { id: 1, thoiGian: '28/09/2026 08:00', nguoiThucHien: 'Nguyễn Thị B', hanhDong: 'Đăng nhập', noiDung: 'Đăng nhập hệ thống từ 192.168.1.100', ketQua: 'Thành công' },
  { id: 2, thoiGian: '27/09/2026 17:30', nguoiThucHien: 'Lê Văn D', hanhDong: 'Đăng xuất', noiDung: 'Đăng xuất khỏi hệ thống', ketQua: 'Thành công' },
  { id: 3, thoiGian: '27/09/2026 10:15', nguoiThucHien: 'Trần Văn G', hanhDong: 'Đăng nhập', noiDung: 'Đăng nhập hệ thống từ 192.168.1.105', ketQua: 'Thành công' },
  { id: 4, thoiGian: '26/09/2026 14:00', nguoiThucHien: 'Nguyễn Thị B', hanhDong: 'Thay đổi mật khẩu', noiDung: 'Thay đổi mật khẩu tài khoản', ketQua: 'Thành công' },
  { id: 5, thoiGian: '25/09/2026 09:00', nguoiThucHien: 'System', hanhDong: 'Backup dữ liệu', noiDung: 'Tự động backup dữ liệu hàng ngày', ketQua: 'Hoàn tất' },
  { id: 6, thoiGian: '24/09/2026 08:00', nguoiThucHien: 'Nguyễn Thị B', hanhDong: 'Đăng nhập', noiDung: 'Đăng nhập hệ thống từ 192.168.1.100', ketQua: 'Thành công' },
  { id: 7, thoiGian: '23/09/2026 17:45', nguoiThucHien: 'Lê Văn D', hanhDong: 'Đăng xuất', noiDung: 'Đăng xuất khỏi hệ thống', ketQua: 'Thành công' },
  { id: 8, thoiGian: '22/09/2026 11:30', nguoiThucHien: 'Trần Văn G', hanhDong: 'Đăng nhập', noiDung: 'Đăng nhập hệ thống từ 192.168.1.108', ketQua: 'Thành công' },
]

// Tab type
type TabType = 'ho-so' | 'muon-tra' | 'rut-ho-so' | 'thong-tin-sv' | 'he-thong'

// Icons
const Icons = {
  file: (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
      <polyline points="14 2 14 8 20 8"/>
    </svg>
  ),
  exchange: (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 3 4 7l4 4"/>
      <path d="M4 7h16"/>
      <path d="m16 21 4-4-4-4"/>
      <path d="M20 17H4"/>
    </svg>
  ),
  download: (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="7 10 12 15 17 10"/>
      <line x1="12" y1="15" x2="12" y2="3"/>
    </svg>
  ),
  user: (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  ),
  shield: (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  ),
  search: (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/>
      <path d="m21 21-4.3-4.3"/>
    </svg>
  ),
  calendar: (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  ),
  reset: (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
      <path d="M3 3v5h5"/>
    </svg>
  ),
  chevronLeft: (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m15 18-6-6 6-6"/>
    </svg>
  ),
  chevronRight: (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m9 18 6-6-6-6"/>
    </svg>
  ),
  x: (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6 6 18"/>
      <path d="m6 6 12 12"/>
    </svg>
  ),
  eye: (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  )
}

const TABS: { id: TabType; label: string; icon: React.ReactNode }[] = [
  { id: 'ho-so', label: 'Lịch sử hồ sơ & giấy tờ', icon: Icons.file },
  { id: 'muon-tra', label: 'Lịch sử mượn / trả hồ sơ', icon: Icons.exchange },
  { id: 'rut-ho-so', label: 'Lịch sử rút hồ sơ', icon: Icons.download },
  { id: 'thong-tin-sv', label: 'Thay đổi thông tin sinh viên', icon: Icons.user },
  { id: 'he-thong', label: 'Nhật ký hệ thống', icon: Icons.shield }
]

// Modal Component
interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}

function Modal({ isOpen, onClose, title, children }: ModalProps) {
  if (!isOpen) return null

  return (
    <div className="audit-modal-overlay" onClick={onClose}>
      <div className="audit-modal" onClick={(e) => e.stopPropagation()}>
        <div className="audit-modal__header">
          <h3 className="audit-modal__title">{title}</h3>
          <button className="audit-modal__close" onClick={onClose}>
            {Icons.x}
          </button>
        </div>
        <div className="audit-modal__body">
          {children}
        </div>
      </div>
    </div>
  )
}

// Badge Component
function StatusBadge({ status }: { status: string }) {
  const statusClass = status.toLowerCase().replace(/ /g, '-')
  return (
    <span className={`audit-badge audit-badge--${statusClass}`}>
      {status}
    </span>
  )
}

export function TrangLichSuAudit() {
  const [activeTab, setActiveTab] = useState<TabType>('ho-so')
  const [searchTerm, setSearchTerm] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [actor, setActor] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedItem, setSelectedItem] = useState<unknown>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const itemsPerPage = 10

  const handleReset = () => {
    setSearchTerm('')
    setFromDate('')
    setToDate('')
    setActor('')
    setCurrentPage(1)
  }

  const handleViewDetail = (item: unknown) => {
    setSelectedItem(item)
    setIsModalOpen(true)
  }

  const getTabTitle = () => {
    const tab = TABS.find((t) => t.id === activeTab)
    return tab?.label || ''
  }

  // Get current data based on tab
  const getCurrentData = () => {
    switch (activeTab) {
      case 'ho-so': return MOCK_HO_SO
      case 'muon-tra': return MOCK_MUON_TRA
      case 'rut-ho-so': return MOCK_RUT_HO_SO
      case 'thong-tin-sv': return MOCK_THONG_TIN_SV
      case 'he-thong': return MOCK_HE_THONG
      default: return []
    }
  }

  const totalItems = getCurrentData().length
  const totalPages = Math.ceil(totalItems / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems)

  // Render table rows based on active tab
  const renderTableRows = () => {
    const data = getCurrentData().slice(startIndex, endIndex)

    switch (activeTab) {
      case 'ho-so':
        return (data as HoSoActivity[]).map((item) => (
          <tr key={item.id}>
            <td className="audit-table__cell audit-table__cell--time">{item.thoiGian}</td>
            <td className="audit-table__cell audit-table__cell--student">
              <div className="audit-student">
                <span className="audit-student__name">{item.hoTen}</span>
                <span className="audit-student__mssv">MSSV: {item.mssv}</span>
              </div>
            </td>
            <td className="audit-table__cell">
              <div className="audit-content">
                <span className="audit-content__action">{item.noiDung}</span>
                <span className="audit-content__detail">{item.giayTo}</span>
              </div>
            </td>
            <td className="audit-table__cell audit-table__cell--status">
              {item.trangThaiCu && item.trangThaiMoi ? (
                <div className="audit-status-change">
                  <span className="audit-status-change__old">{item.trangThaiCu}</span>
                  <span className="audit-status-change__arrow">→</span>
                  <span className="audit-status-change__new">{item.trangThaiMoi}</span>
                </div>
              ) : (
                <span className="audit-text-muted">-</span>
              )}
            </td>
            <td className="audit-table__cell audit-table__cell--actor">{item.nguoiThucHien}</td>
            <td className="audit-table__cell audit-table__cell--action">
              <button className="audit-btn-view" onClick={() => handleViewDetail(item)}>
                {Icons.eye} Xem
              </button>
            </td>
          </tr>
        ))

      case 'muon-tra':
        return (data as MuonTraActivity[]).map((item) => (
          <tr key={item.id}>
            <td className="audit-table__cell audit-table__cell--time">{item.thoiGian}</td>
            <td className="audit-table__cell audit-table__cell--student">
              <div className="audit-student">
                <span className="audit-student__name">{item.hoTen}</span>
                <span className="audit-student__mssv">MSSV: {item.mssv}</span>
              </div>
            </td>
            <td className="audit-table__cell audit-table__cell--action">
              <span className="audit-action-text">{item.hanhDong}</span>
              <span className="audit-action-detail">Số phiếu: {item.soPhieu}</span>
            </td>
            <td className="audit-table__cell">
              <StatusBadge status={item.trangThai} />
            </td>
            <td className="audit-table__cell audit-table__cell--actor">{item.nguoiThucHien}</td>
            <td className="audit-table__cell audit-table__cell--action">
              <button className="audit-btn-view" onClick={() => handleViewDetail(item)}>
                {Icons.eye} Xem
              </button>
            </td>
          </tr>
        ))

      case 'rut-ho-so':
        return (data as RutHoSoActivity[]).map((item) => (
          <tr key={item.id}>
            <td className="audit-table__cell audit-table__cell--time">{item.thoiGian}</td>
            <td className="audit-table__cell audit-table__cell--student">
              <div className="audit-student">
                <span className="audit-student__name">{item.hoTen}</span>
                <span className="audit-student__mssv">MSSV: {item.mssv}</span>
              </div>
            </td>
            <td className="audit-table__cell audit-table__cell--action">
              <span className="audit-action-text">{item.hanhDong}</span>
            </td>
            <td className="audit-table__cell audit-table__cell--reason">
              <span className="audit-reason">Lý do: {item.lyDo}</span>
            </td>
            <td className="audit-table__cell audit-table__cell--actor">{item.nguoiThucHien}</td>
            <td className="audit-table__cell audit-table__cell--action">
              <button className="audit-btn-view" onClick={() => handleViewDetail(item)}>
                {Icons.eye} Xem
              </button>
            </td>
          </tr>
        ))

      case 'thong-tin-sv':
        return (data as ThongTinSVActivity[]).map((item) => (
          <tr key={item.id}>
            <td className="audit-table__cell audit-table__cell--time">{item.thoiGian}</td>
            <td className="audit-table__cell audit-table__cell--student">
              <div className="audit-student">
                <span className="audit-student__name">{item.hoTen}</span>
                <span className="audit-student__mssv">MSSV: {item.mssv}</span>
              </div>
            </td>
            <td className="audit-table__cell audit-table__cell--action">
              <span className="audit-action-text">{item.truongThayDoi}</span>
            </td>
            <td className="audit-table__cell audit-table__cell--value">
              <span className="audit-value audit-value--old">{item.giaTriCu}</span>
            </td>
            <td className="audit-table__cell audit-table__cell--value">
              <span className="audit-value audit-value--new">{item.giaTriMoi}</span>
            </td>
            <td className="audit-table__cell audit-table__cell--actor">{item.nguoiThucHien}</td>
          </tr>
        ))

      case 'he-thong':
        return (data as HeThongActivity[]).map((item) => (
          <tr key={item.id}>
            <td className="audit-table__cell audit-table__cell--time">{item.thoiGian}</td>
            <td className="audit-table__cell audit-table__cell--actor">{item.nguoiThucHien}</td>
            <td className="audit-table__cell audit-table__cell--action">
              <span className="audit-action-text">{item.hanhDong}</span>
            </td>
            <td className="audit-table__cell">
              <span className="audit-content-text">{item.noiDung}</span>
            </td>
            <td className="audit-table__cell">
              <StatusBadge status={item.ketQua} />
            </td>
            <td className="audit-table__cell audit-table__cell--action">
              <button className="audit-btn-view" onClick={() => handleViewDetail(item)}>
                {Icons.eye} Xem
              </button>
            </td>
          </tr>
        ))

      default:
        return null
    }
  }

  // Render modal content based on selected item
  const renderModalContent = () => {
    if (!selectedItem) return null

    switch (activeTab) {
      case 'ho-so': {
        const item = selectedItem as HoSoActivity
        return (
          <div className="audit-modal__content">
            <div className="audit-modal__row">
              <span className="audit-modal__label">Thời gian</span>
              <span className="audit-modal__value">{item.thoiGian}</span>
            </div>
            <div className="audit-modal__row">
              <span className="audit-modal__label">Loại hoạt động</span>
              <span className="audit-modal__value">Cập nhật hồ sơ & giấy tờ</span>
            </div>
            <div className="audit-modal__row">
              <span className="audit-modal__label">Sinh viên</span>
              <span className="audit-modal__value">{item.hoTen}</span>
            </div>
            <div className="audit-modal__row">
              <span className="audit-modal__label">MSSV</span>
              <span className="audit-modal__value">{item.mssv}</span>
            </div>
            <div className="audit-modal__row">
              <span className="audit-modal__label">Nội dung thao tác</span>
              <span className="audit-modal__value">{item.noiDung}</span>
            </div>
            <div className="audit-modal__row">
              <span className="audit-modal__label">Giấy tờ</span>
              <span className="audit-modal__value">{item.giayTo}</span>
            </div>
            {item.trangThaiCu && (
              <div className="audit-modal__row">
                <span className="audit-modal__label">Dữ liệu trước</span>
                <span className="audit-modal__value audit-modal__value--old">{item.trangThaiCu}</span>
              </div>
            )}
            {item.trangThaiMoi && (
              <div className="audit-modal__row">
                <span className="audit-modal__label">Dữ liệu sau</span>
                <span className="audit-modal__value audit-modal__value--new">{item.trangThaiMoi}</span>
              </div>
            )}
            <div className="audit-modal__row">
              <span className="audit-modal__label">Người thực hiện</span>
              <span className="audit-modal__value">{item.nguoiThucHien}</span>
            </div>
          </div>
        )
      }
      case 'muon-tra': {
        const item = selectedItem as MuonTraActivity
        return (
          <div className="audit-modal__content">
            <div className="audit-modal__row">
              <span className="audit-modal__label">Thời gian</span>
              <span className="audit-modal__value">{item.thoiGian}</span>
            </div>
            <div className="audit-modal__row">
              <span className="audit-modal__label">Loại hoạt động</span>
              <span className="audit-modal__value">Mượn / trả hồ sơ</span>
            </div>
            <div className="audit-modal__row">
              <span className="audit-modal__label">Sinh viên</span>
              <span className="audit-modal__value">{item.hoTen}</span>
            </div>
            <div className="audit-modal__row">
              <span className="audit-modal__label">MSSV</span>
              <span className="audit-modal__value">{item.mssv}</span>
            </div>
            <div className="audit-modal__row">
              <span className="audit-modal__label">Hành động</span>
              <span className="audit-modal__value">{item.hanhDong}</span>
            </div>
            <div className="audit-modal__row">
              <span className="audit-modal__label">Số phiếu</span>
              <span className="audit-modal__value">{item.soPhieu}</span>
            </div>
            <div className="audit-modal__row">
              <span className="audit-modal__label">Trạng thái</span>
              <StatusBadge status={item.trangThai} />
            </div>
            <div className="audit-modal__row">
              <span className="audit-modal__label">Cán bộ phụ trách</span>
              <span className="audit-modal__value">{item.canBoPhuTrach}</span>
            </div>
            {item.ghiChu && (
              <div className="audit-modal__row">
                <span className="audit-modal__label">Ghi chú</span>
                <span className="audit-modal__value">{item.ghiChu}</span>
              </div>
            )}
            <div className="audit-modal__row">
              <span className="audit-modal__label">Người thực hiện</span>
              <span className="audit-modal__value">{item.nguoiThucHien}</span>
            </div>
          </div>
        )
      }
      case 'rut-ho-so': {
        const item = selectedItem as RutHoSoActivity
        return (
          <div className="audit-modal__content">
            <div className="audit-modal__row">
              <span className="audit-modal__label">Thời gian</span>
              <span className="audit-modal__value">{item.thoiGian}</span>
            </div>
            <div className="audit-modal__row">
              <span className="audit-modal__label">Loại hoạt động</span>
              <span className="audit-modal__value">Rút hồ sơ</span>
            </div>
            <div className="audit-modal__row">
              <span className="audit-modal__label">Sinh viên</span>
              <span className="audit-modal__value">{item.hoTen}</span>
            </div>
            <div className="audit-modal__row">
              <span className="audit-modal__label">MSSV</span>
              <span className="audit-modal__value">{item.mssv}</span>
            </div>
            <div className="audit-modal__row">
              <span className="audit-modal__label">Hành động</span>
              <span className="audit-modal__value">{item.hanhDong}</span>
            </div>
            <div className="audit-modal__row">
              <span className="audit-modal__label">Lý do</span>
              <span className="audit-modal__value">{item.lyDo}</span>
            </div>
            <div className="audit-modal__row">
              <span className="audit-modal__label">Người thực hiện</span>
              <span className="audit-modal__value">{item.nguoiThucHien}</span>
            </div>
          </div>
        )
      }
      case 'thong-tin-sv': {
        const item = selectedItem as ThongTinSVActivity
        return (
          <div className="audit-modal__content">
            <div className="audit-modal__row">
              <span className="audit-modal__label">Thời gian</span>
              <span className="audit-modal__value">{item.thoiGian}</span>
            </div>
            <div className="audit-modal__row">
              <span className="audit-modal__label">Loại hoạt động</span>
              <span className="audit-modal__value">Thay đổi thông tin sinh viên</span>
            </div>
            <div className="audit-modal__row">
              <span className="audit-modal__label">Sinh viên</span>
              <span className="audit-modal__value">{item.hoTen}</span>
            </div>
            <div className="audit-modal__row">
              <span className="audit-modal__label">MSSV</span>
              <span className="audit-modal__value">{item.mssv}</span>
            </div>
            <div className="audit-modal__row">
              <span className="audit-modal__label">Trường thay đổi</span>
              <span className="audit-modal__value">{item.truongThayDoi}</span>
            </div>
            <div className="audit-modal__row">
              <span className="audit-modal__label">Giá trị cũ</span>
              <span className="audit-modal__value audit-modal__value--old">{item.giaTriCu}</span>
            </div>
            <div className="audit-modal__row">
              <span className="audit-modal__label">Giá trị mới</span>
              <span className="audit-modal__value audit-modal__value--new">{item.giaTriMoi}</span>
            </div>
            <div className="audit-modal__row">
              <span className="audit-modal__label">Người thực hiện</span>
              <span className="audit-modal__value">{item.nguoiThucHien}</span>
            </div>
          </div>
        )
      }
      case 'he-thong': {
        const item = selectedItem as HeThongActivity
        return (
          <div className="audit-modal__content">
            <div className="audit-modal__row">
              <span className="audit-modal__label">Thời gian</span>
              <span className="audit-modal__value">{item.thoiGian}</span>
            </div>
            <div className="audit-modal__row">
              <span className="audit-modal__label">Loại hoạt động</span>
              <span className="audit-modal__value">Nhật ký hệ thống</span>
            </div>
            <div className="audit-modal__row">
              <span className="audit-modal__label">Người thực hiện</span>
              <span className="audit-modal__value">{item.nguoiThucHien}</span>
            </div>
            <div className="audit-modal__row">
              <span className="audit-modal__label">Hành động</span>
              <span className="audit-modal__value">{item.hanhDong}</span>
            </div>
            <div className="audit-modal__row">
              <span className="audit-modal__label">Nội dung</span>
              <span className="audit-modal__value">{item.noiDung}</span>
            </div>
            <div className="audit-modal__row">
              <span className="audit-modal__label">Kết quả</span>
              <StatusBadge status={item.ketQua} />
            </div>
          </div>
        )
      }
      default:
        return null
    }
  }

  // Get table columns based on active tab
  const getTableColumns = () => {
    switch (activeTab) {
      case 'ho-so':
        return ['Thời gian', 'Sinh viên / MSSV', 'Nội dung thao tác', 'Trạng thái thay đổi', 'Người thực hiện', 'Chi tiết']
      case 'muon-tra':
        return ['Thời gian', 'Sinh viên / MSSV', 'Hành động', 'Trạng thái', 'Người thực hiện', 'Chi tiết']
      case 'rut-ho-so':
        return ['Thời gian', 'Sinh viên / MSSV', 'Hành động', 'Lý do', 'Người thực hiện', 'Chi tiết']
      case 'thong-tin-sv':
        return ['Thời gian', 'Sinh viên / MSSV', 'Nội dung thay đổi', 'Giá trị cũ', 'Giá trị mới', 'Người thực hiện']
      case 'he-thong':
        return ['Thời gian', 'Người thực hiện', 'Hành động', 'Nội dung', 'Kết quả', 'Chi tiết']
      default:
        return []
    }
  }

  // Render pagination
  const renderPagination = () => {
    const pages: (number | string)[] = []
    const maxVisiblePages = 5

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      pages.push(1)
      if (currentPage > 3) pages.push('...')
      for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
        pages.push(i)
      }
      if (currentPage < totalPages - 2) pages.push('...')
      pages.push(totalPages)
    }

    return (
      <div className="audit-pagination">
        <span className="audit-pagination__info">
          Hiển thị {startIndex + 1}-{endIndex} / {totalItems}
        </span>
        <div className="audit-pagination__controls">
          <button
            className="audit-pagination__btn"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(currentPage - 1)}
          >
            {Icons.chevronLeft}
          </button>
          {pages.map((page, index) => (
            typeof page === 'number' ? (
              <button
                key={index}
                className={`audit-pagination__btn ${currentPage === page ? 'audit-pagination__btn--active' : ''}`}
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </button>
            ) : (
              <span key={index} className="audit-pagination__ellipsis">{page}</span>
            )
          ))}
          <button
            className="audit-pagination__btn"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(currentPage + 1)}
          >
            {Icons.chevronRight}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="trang-lich-su-audit">
      {/* Header */}
      <div className="audit-header">
        <h1 className="audit-header__title">Lịch sử & Audit</h1>
        <p className="audit-header__subtitle">Theo dõi toàn bộ hoạt động phát sinh trong hệ thống</p>
      </div>

      {/* Filters */}
      <div className="audit-filters">
        <div className="audit-filters__row">
          <select className="audit-filters__select">
            <option value="">Tất cả loại hoạt động</option>
            <option value="ho-so">Hồ sơ & giấy tờ</option>
            <option value="muon-tra">Mượn / trả hồ sơ</option>
            <option value="rut-ho-so">Rút hồ sơ</option>
            <option value="thong-tin-sv">Thay đổi thông tin</option>
            <option value="he-thong">Nhật ký hệ thống</option>
          </select>

          <div className="audit-filters__search">
            {Icons.search}
            <input
              type="text"
              placeholder="Tìm kiếm theo tên sinh viên, MSSV, nội dung..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="audit-filters__date">
            {Icons.calendar}
            <input
              type="date"
              placeholder="Từ ngày"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
            />
          </div>

          <div className="audit-filters__date">
            {Icons.calendar}
            <input
              type="date"
              placeholder="Đến ngày"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
            />
          </div>

          <select
            className="audit-filters__select"
            value={actor}
            onChange={(e) => setActor(e.target.value)}
          >
            <option value="">Người thực hiện</option>
            <option value="nguyen-thi-b">Nguyễn Thị B</option>
            <option value="le-van-d">Lê Văn D</option>
            <option value="tran-van-g">Trần Văn G</option>
          </select>

          <button className="audit-btn audit-btn--reset" onClick={handleReset}>
            {Icons.reset} Đặt lại
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="audit-tabs">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={`audit-tab ${activeTab === tab.id ? 'audit-tab--active' : ''}`}
            onClick={() => {
              setActiveTab(tab.id)
              setCurrentPage(1)
            }}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="audit-table-card">
        <div className="audit-table-card__header">
          <h3 className="audit-table-card__title">
            {TABS.find((t) => t.id === activeTab)?.icon}
            Danh sách {getTabTitle().toLowerCase()}
          </h3>
          <select className="audit-filters__select audit-filters__select--sm">
            <option value="">Tất cả</option>
          </select>
        </div>

        <div className="audit-table-wrapper">
          <table className="audit-table">
            <thead>
              <tr>
                {getTableColumns().map((col, index) => (
                  <th key={index} className="audit-table__header">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {renderTableRows()}
            </tbody>
          </table>
        </div>

        {renderPagination()}
      </div>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Chi tiết hoạt động"
      >
        {renderModalContent()}
      </Modal>
    </div>
  )
}
