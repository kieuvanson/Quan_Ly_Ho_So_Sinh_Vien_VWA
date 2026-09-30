import { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight, Eye, FileX, Loader2, RotateCcw, Plus, ArrowRightLeft, AlertCircle } from 'lucide-react'
import { CustomSelect, SearchInput, Button, Toast, Modal, FormInput, FormSelect } from '../components/ui'
import './TrangMuonTra.css'

const PAGE_SIZE = 10

// Type definitions
interface SinhVien {
  mssv: string
  hoTen: string
  cccd: string
  sdt: string
  khoa: string
  lop: string
}

interface DangMuonItem {
  maPhieu: string
  mssv: string
  hoTen: string
  cccd: string
  sdt: string
  khoa: string
  lop: string
  loaiHoSo: string
  canBoPhuTrach: string
  ngayMuon: string
  hanTra: string
  trangThai: string
  ghiChu: string
}

interface LichSuItem {
  maLog: number
  mssv: string
  hoTen: string
  loaiHoSo: string
  hanhDong: string
  thoiGian: string
  nguoiThucHien: string
  ghiChu: string
}

// Mock data sinh viên đầy đủ
const MOCK_SINHVIEN: Record<string, SinhVien> = {
  'B23DCCN001': { mssv: 'B23DCCN001', hoTen: 'Nguyễn Văn An', cccd: '079205001234', sdt: '0912345678', khoa: 'K23', lop: 'CNTT-2023.1' },
  'B23DCCN002': { mssv: 'B23DCCN002', hoTen: 'Trần Thị Bình', cccd: '079205001235', sdt: '0912345679', khoa: 'K23', lop: 'CNTT-2023.1' },
  'B23DCCN003': { mssv: 'B23DCCN003', hoTen: 'Lê Minh Cường', cccd: '079205001236', sdt: '0912345680', khoa: 'K23', lop: 'QTKD-2023.1' },
  'B23DCCN004': { mssv: 'B23DCCN004', hoTen: 'Hoàng Thị E', cccd: '079205001237', sdt: '0912345681', khoa: 'K23', lop: 'KTTN-2023.1' },
  'B23DCCN005': { mssv: 'B23DCCN005', hoTen: 'Đặng Thị F', cccd: '079205001238', sdt: '0912345682', khoa: 'K23', lop: 'NNA-2023.1' },
  'B23DCCN006': { mssv: 'B23DCCN006', hoTen: 'Bùi Văn G', cccd: '079205001239', sdt: '0912345683', khoa: 'K23', lop: 'L-2023.1' },
  'B23DCCN007': { mssv: 'B23DCCN007', hoTen: 'Phạm Thị H', cccd: '079205001240', sdt: '0912345684', khoa: 'K23', lop: 'TCNH-2023.1' },
  'B23DCCN008': { mssv: 'B23DCCN008', hoTen: 'Vũ Văn I', cccd: '079205001241', sdt: '0912345685', khoa: 'K23', lop: 'QHQT-2023.1' },
  'B23DCCN009': { mssv: 'B23DCCN009', hoTen: 'Trần Văn J', cccd: '079205001242', sdt: '0912345686', khoa: 'K23', lop: 'CNTT-2023.2' },
  'B23DCCN010': { mssv: 'B23DCCN010', hoTen: 'Lê Thị L', cccd: '079205001243', sdt: '0912345687', khoa: 'K23', lop: 'QTKD-2023.2' },
}

// Mock data cho hồ sơ đang mượn (đầy đủ thông tin)
const MOCK_DANGMUON: DangMuonItem[] = [
  { maPhieu: 'PM001', mssv: 'B23DCCN001', hoTen: 'Nguyễn Văn An', cccd: '079205001234', sdt: '0912345678', khoa: 'K23', lop: 'CNTT-2023.1', loaiHoSo: 'Hồ sơ sinh viên', ngayMuon: '2026-09-30', canBoPhuTrach: 'Nguyễn Thị A', hanTra: '2026-10-05', trangThai: 'Đang mượn', ghiChu: 'Phục vụ đối chiếu hồ sơ' },
  { maPhieu: 'PM002', mssv: 'B23DCCN002', hoTen: 'Trần Thị Bình', cccd: '079205001235', sdt: '0912345679', khoa: 'K23', lop: 'CNTT-2023.1', loaiHoSo: 'Giấy tờ gốc', ngayMuon: '2026-09-28', canBoPhuTrach: 'Trần Văn B', hanTra: '2026-10-02', trangThai: 'Quá hạn', ghiChu: '' },
  { maPhieu: 'PM003', mssv: 'B23DCCN003', hoTen: 'Lê Minh Cường', cccd: '079205001236', sdt: '0912345680', khoa: 'K23', lop: 'QTKD-2023.1', loaiHoSo: 'Hồ sơ sinh viên', ngayMuon: '2026-09-25', canBoPhuTrach: 'Phạm Thị D', hanTra: '2026-09-30', trangThai: 'Quá hạn', ghiChu: 'Mượn gấp' },
  { maPhieu: 'PM004', mssv: 'B23DCCN004', hoTen: 'Hoàng Thị E', cccd: '079205001237', sdt: '0912345681', khoa: 'K23', lop: 'KTTN-2023.1', loaiHoSo: 'Hồ sơ khác', ngayMuon: '2026-09-29', canBoPhuTrach: 'Lê Văn E', hanTra: '2026-10-06', trangThai: 'Đang mượn', ghiChu: '' },
  { maPhieu: 'PM005', mssv: 'B23DCCN005', hoTen: 'Đặng Thị F', cccd: '079205001238', sdt: '0912345682', khoa: 'K23', lop: 'NNA-2023.1', loaiHoSo: 'Giấy tờ gốc', ngayMuon: '2026-09-27', canBoPhuTrach: 'Nguyễn Văn F', hanTra: '2026-10-01', trangThai: 'Quá hạn', ghiChu: '' },
  { maPhieu: 'PM006', mssv: 'B23DCCN006', hoTen: 'Bùi Văn G', cccd: '079205001239', sdt: '0912345683', khoa: 'K23', lop: 'L-2023.1', loaiHoSo: 'Hồ sơ sinh viên', ngayMuon: '2026-09-29', canBoPhuTrach: 'Trần Thị G', hanTra: '2026-10-07', trangThai: 'Đang mượn', ghiChu: 'Photo hồ sơ' },
  { maPhieu: 'PM007', mssv: 'B23DCCN007', hoTen: 'Phạm Thị H', cccd: '079205001240', sdt: '0912345684', khoa: 'K23', lop: 'TCNH-2023.1', loaiHoSo: 'Hồ sơ sinh viên', ngayMuon: '2026-09-30', canBoPhuTrach: 'Bùi Văn H', hanTra: '2026-10-08', trangThai: 'Đang mượn', ghiChu: '' },
  { maPhieu: 'PM008', mssv: 'B23DCCN008', hoTen: 'Vũ Văn I', cccd: '079205001241', sdt: '0912345685', khoa: 'K23', lop: 'QHQT-2023.1', loaiHoSo: 'Giấy tờ gốc', ngayMuon: '2026-09-26', canBoPhuTrach: 'Đặng Văn I', hanTra: '2026-09-29', trangThai: 'Quá hạn', ghiChu: '' },
]

// Mock data cho lịch sử mượn/trả
const MOCK_LICHSU: LichSuItem[] = [
  { maLog: 1, mssv: 'B23DCCN001', hoTen: 'Nguyễn Văn An', loaiHoSo: 'Hồ sơ sinh viên', hanhDong: 'Mượn', thoiGian: '2026-09-30 09:15', nguoiThucHien: 'Nguyễn Thị A', ghiChu: 'Mượn để photo' },
  { maLog: 2, mssv: 'B23DCCN009', hoTen: 'Trần Văn J', loaiHoSo: 'Hồ sơ sinh viên', hanhDong: 'Trả', thoiGian: '2026-09-29 16:30', nguoiThucHien: 'Phạm Thị K', ghiChu: 'Trả đúng hạn' },
  { maLog: 3, mssv: 'B23DCCN010', hoTen: 'Lê Thị L', loaiHoSo: 'Giấy tờ gốc', hanhDong: 'Mượn', thoiGian: '2026-09-29 10:00', nguoiThucHien: 'Trần Văn L', ghiChu: 'Mượn gấp' },
  { maLog: 4, mssv: 'B23DCCN011', hoTen: 'Nguyễn Văn M', loaiHoSo: 'Hồ sơ khác', hanhDong: 'Trả', thoiGian: '2026-09-28 14:45', nguoiThucHien: 'Nguyễn Thị M', ghiChu: 'Trả trễ 2 ngày' },
  { maLog: 5, mssv: 'B23DCCN012', hoTen: 'Phạm Thị N', loaiHoSo: 'Hồ sơ sinh viên', hanhDong: 'Mượn', thoiGian: '2026-09-28 08:30', nguoiThucHien: 'Lê Văn N', ghiChu: '' },
  { maLog: 6, mssv: 'B23DCCN013', hoTen: 'Bùi Văn O', loaiHoSo: 'Giấy tờ gốc', hanhDong: 'Trả', thoiGian: '2026-09-27 11:20', nguoiThucHien: 'Vũ Văn O', ghiChu: 'Đã kiểm tra đủ giấy tờ' },
  { maLog: 7, mssv: 'B23DCCN014', hoTen: 'Đặng Thị P', loaiHoSo: 'Hồ sơ sinh viên', hanhDong: 'Mượn', thoiGian: '2026-09-27 09:00', nguoiThucHien: 'Hoàng Văn P', ghiChu: 'Mượn hồ sơ gốc' },
  { maLog: 8, mssv: 'B23DCCN015', hoTen: 'Trần Văn Q', loaiHoSo: 'Hồ sơ khác', hanhDong: 'Trả', thoiGian: '2026-09-26 15:00', nguoiThucHien: 'Phạm Thị Q', ghiChu: '' },
]

// Badge styling
const TRANG_THAI_MUON_MAPPING: Record<string, { label: string; className: string }> = {
  'Đang mượn': { label: 'Đang mượn', className: 'badge--primary' },
  'Quá hạn': { label: 'Quá hạn', className: 'badge--danger' },
}

const HANH_DONG_MAPPING: Record<string, { label: string; className: string }> = {
  'Mượn': { label: 'Mượn', className: 'badge--warning' },
  'Trả': { label: 'Trả', className: 'badge--success' },
}

// Options cho dropdown
const TRANG_THAI_OPTIONS = [
  { value: '', label: 'Tất cả trạng thái' },
  { value: 'Đang mượn', label: 'Đang mượn' },
  { value: 'Quá hạn', label: 'Quá hạn' },
]

const LOAI_HO_SO_OPTIONS = [
  { value: '', label: 'Tất cả loại hồ sơ' },
  { value: 'Hồ sơ sinh viên', label: 'Hồ sơ sinh viên' },
  { value: 'Giấy tờ gốc', label: 'Giấy tờ gốc' },
  { value: 'Hồ sơ khác', label: 'Hồ sơ khác' },
]

const LOAI_HO_SO_CHON_OPTIONS = [
  { value: 'Hồ sơ sinh viên', label: 'Hồ sơ sinh viên' },
  { value: 'Giấy tờ gốc', label: 'Giấy tờ gốc' },
  { value: 'Hồ sơ khác', label: 'Hồ sơ khác' },
]

const HANH_DONG_OPTIONS = [
  { value: '', label: 'Tất cả' },
  { value: 'Mượn', label: 'Mượn' },
  { value: 'Trả', label: 'Trả' },
]

const CAN_BO_OPTIONS = [
  { value: '', label: 'Chọn cán bộ phụ trách' },
  { value: 'Nguyễn Thị A', label: 'Nguyễn Thị A' },
  { value: 'Trần Văn B', label: 'Trần Văn B' },
  { value: 'Phạm Thị D', label: 'Phạm Thị D' },
  { value: 'Lê Văn E', label: 'Lê Văn E' },
  { value: 'Nguyễn Văn F', label: 'Nguyễn Văn F' },
  { value: 'Trần Thị G', label: 'Trần Thị G' },
  { value: 'Bùi Văn H', label: 'Bùi Văn H' },
  { value: 'Đặng Văn I', label: 'Đặng Văn I' },
]

export function TrangMuonTra() {
  // Tab state
  const [activeTab, setActiveTab] = useState<'dangmuon' | 'lichsu'>('dangmuon')
  
  // Data state - Tab 1
  const [dangMuonList, setDangMuonList] = useState<DangMuonItem[]>(MOCK_DANGMUON)
  const [isLoading] = useState(false)
  
  // Data state - Tab 2
  const [lichSuList] = useState<LichSuItem[]>(MOCK_LICHSU)
  
  // Filter state - Tab 1
  const [searchDangMuon, setSearchDangMuon] = useState('')
  const [trangThaiDangMuon, setTrangThaiDangMuon] = useState('')
  const [loaiHoSoDangMuon, setLoaiHoSoDangMuon] = useState('')
  
  // Filter state - Tab 2
  const [searchLichSu, setSearchLichSu] = useState('')
  const [hanhDongLichSu, setHanhDongLichSu] = useState('')
  const [tuNgay, setTuNgay] = useState('')
  const [denNgay, setDenNgay] = useState('')
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  
  // Modal state
  const [modalMuonOpen, setModalMuonOpen] = useState(false)
  const [modalTraOpen, setModalTraOpen] = useState(false)
  const [modalChiTietOpen, setModalChiTietOpen] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState<DangMuonItem | null>(null)
  
  // Student info state (for MSSV lookup)
  const [sinhVienInfo, setSinhVienInfo] = useState<SinhVien | null>(null)
  const [mssvError, setMssvError] = useState('')
  
  // Form state - Mượn
  const [muonForm, setMuonForm] = useState({
    mssv: '',
    loaiHoSo: '',
    canBoPhuTrach: '',
    ngayMuon: new Date().toISOString().split('T')[0],
    hanTra: '',
    ghiChu: '',
  })
  
  // Form state - Trả
  const [traForm, setTraForm] = useState({
    ghiChuTra: '',
  })
  
  // Toast state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)

  // Filter data - Tab 1
  const filteredDangMuon = useMemo(() => {
    return dangMuonList.filter(item => {
      const matchSearch = !searchDangMuon || 
        item.mssv.toLowerCase().includes(searchDangMuon.toLowerCase()) ||
        item.hoTen.toLowerCase().includes(searchDangMuon.toLowerCase())
      const matchTrangThai = !trangThaiDangMuon || item.trangThai === trangThaiDangMuon
      const matchLoaiHoSo = !loaiHoSoDangMuon || item.loaiHoSo === loaiHoSoDangMuon
      return matchSearch && matchTrangThai && matchLoaiHoSo
    })
  }, [dangMuonList, searchDangMuon, trangThaiDangMuon, loaiHoSoDangMuon])

  // Filter data - Tab 2
  const filteredLichSu = useMemo(() => {
    return lichSuList.filter(item => {
      const matchSearch = !searchLichSu || 
        item.mssv.toLowerCase().includes(searchLichSu.toLowerCase()) ||
        item.hoTen.toLowerCase().includes(searchLichSu.toLowerCase())
      const matchHanhDong = !hanhDongLichSu || item.hanhDong === hanhDongLichSu
      return matchSearch && matchHanhDong
    })
  }, [lichSuList, searchLichSu, hanhDongLichSu])

  // Pagination
  const totalElements = activeTab === 'dangmuon' ? filteredDangMuon.length : filteredLichSu.length
  const totalPages = Math.ceil(totalElements / PAGE_SIZE)
  const paginatedData = activeTab === 'dangmuon' 
    ? filteredDangMuon.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
    : filteredLichSu.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  // Handlers
  function handleResetFilters() {
    setSearchDangMuon('')
    setTrangThaiDangMuon('')
    setLoaiHoSoDangMuon('')
    setSearchLichSu('')
    setHanhDongLichSu('')
    setTuNgay('')
    setDenNgay('')
    setCurrentPage(1)
  }

  function showToast(message: string, type: 'success' | 'error' | 'info' = 'info') {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  // Xem chi tiết phiếu mượn (mở modal)
  function openModalChiTiet(record: DangMuonItem) {
    setSelectedRecord(record)
    setModalChiTietOpen(true)
  }

  // Mượn hồ sơ
  function openModalMuon() {
    setMuonForm({
      mssv: '',
      loaiHoSo: '',
      canBoPhuTrach: '',
      ngayMuon: new Date().toISOString().split('T')[0],
      hanTra: '',
      ghiChu: '',
    })
    setSinhVienInfo(null)
    setMssvError('')
    setModalMuonOpen(true)
  }

  function handleMssvChange(value: string) {
    setMuonForm(prev => ({ ...prev, mssv: value }))
    
    if (!value.trim()) {
      setSinhVienInfo(null)
      setMssvError('')
      return
    }
    
    const sv = MOCK_SINHVIEN[value.toUpperCase()]
    if (sv) {
      setSinhVienInfo(sv)
      setMssvError('')
    } else {
      setSinhVienInfo(null)
      setMssvError('Không tìm thấy sinh viên với MSSV này.')
    }
  }

  function handleSubmitMuon() {
    if (!muonForm.mssv || !sinhVienInfo) {
      showToast('Vui lòng nhập MSSV hợp lệ', 'error')
      return
    }
    if (!muonForm.loaiHoSo || !muonForm.canBoPhuTrach || !muonForm.hanTra) {
      showToast('Vui lòng điền đầy đủ thông tin bắt buộc', 'error')
      return
    }

    const newRecord: DangMuonItem = {
      maPhieu: `PM${String(dangMuonList.length + 1).padStart(3, '0')}`,
      mssv: sinhVienInfo.mssv,
      hoTen: sinhVienInfo.hoTen,
      cccd: sinhVienInfo.cccd,
      sdt: sinhVienInfo.sdt,
      khoa: sinhVienInfo.khoa,
      lop: sinhVienInfo.lop,
      loaiHoSo: muonForm.loaiHoSo,
      ngayMuon: muonForm.ngayMuon,
      canBoPhuTrach: muonForm.canBoPhuTrach,
      hanTra: muonForm.hanTra,
      trangThai: 'Đang mượn',
      ghiChu: muonForm.ghiChu,
    }

    setDangMuonList(prev => [newRecord, ...prev])
    setModalMuonOpen(false)
    showToast('Mượn hồ sơ thành công', 'success')
    setCurrentPage(1)
  }

  // Trả hồ sơ
  function openModalTra(record: DangMuonItem) {
    setSelectedRecord(record)
    setTraForm({ ghiChuTra: '' })
    setModalTraOpen(true)
    setModalChiTietOpen(false) // Close chi tiết modal if open
  }

  function handleSubmitTra() {
    if (!selectedRecord) return

    // Xóa khỏi danh sách đang mượn
    setDangMuonList(prev => prev.filter(item => item.maPhieu !== selectedRecord.maPhieu))
    
    setModalTraOpen(false)
    setSelectedRecord(null)
    showToast('Trả hồ sơ thành công', 'success')
    setCurrentPage(1)
  }

  // Generate page numbers
  function getPageNumbers() {
    const pages: (number | '...')[] = []
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      if (currentPage <= 4) {
        for (let i = 1; i <= 5; i++) pages.push(i)
        pages.push('...')
        pages.push(totalPages)
      } else if (currentPage >= totalPages - 3) {
        pages.push(1)
        pages.push('...')
        for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i)
      } else {
        pages.push(1)
        pages.push('...')
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i)
        pages.push('...')
        pages.push(totalPages)
      }
    }
    return pages
  }

  // Format date
  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('vi-VN')
  }

  // Get badge for trangThai
  function getTrangThaiBadge(trangThai: string) {
    const info = TRANG_THAI_MUON_MAPPING[trangThai] || { label: trangThai, className: '' }
    return (
      <span className={`trang-muon-tra__badge ${info.className}`}>
        {info.label}
      </span>
    )
  }

  return (
    <div className="trang-muon-tra">
      {/* Header */}
      <div className="trang-muon-tra__header">
        <h2 className="trang-muon-tra__title">Mượn / trả hồ sơ</h2>
        <p className="trang-muon-tra__subtitle">Quản lý tình trạng mượn và trả hồ sơ sinh viên</p>
      </div>

      {/* Tabs */}
      <div className="trang-muon-tra__tabs">
        <button
          className={`trang-muon-tra__tab ${activeTab === 'dangmuon' ? 'trang-muon-tra__tab--active' : ''}`}
          onClick={() => { setActiveTab('dangmuon'); setCurrentPage(1); }}
        >
          <ArrowRightLeft size={18} />
          Hồ sơ đang mượn
        </button>
        <button
          className={`trang-muon-tra__tab ${activeTab === 'lichsu' ? 'trang-muon-tra__tab--active' : ''}`}
          onClick={() => { setActiveTab('lichsu'); setCurrentPage(1); }}
        >
          <FileX size={18} />
          Lịch sử mượn / trả
        </button>
      </div>

      {/* Content */}
      <div className="trang-muon-tra__content">
        {/* Tab 1: Hồ sơ đang mượn */}
        {activeTab === 'dangmuon' && (
          <>
            {/* Toolbar */}
            <div className="trang-muon-tra__toolbar">
              <div className="trang-muon-tra__filters">
                <SearchInput
                  value={searchDangMuon}
                  onChange={(v) => { setSearchDangMuon(v); setCurrentPage(1); }}
                  placeholder="Tìm theo MSSV hoặc họ tên..."
                  className="trang-muon-tra__search"
                />
                <div className="trang-muon-tra__select-wrapper">
                  <CustomSelect
                    value={trangThaiDangMuon}
                    options={TRANG_THAI_OPTIONS}
                    onChange={(v) => { setTrangThaiDangMuon(v); setCurrentPage(1); }}
                    placeholder="Tất cả trạng thái"
                  />
                </div>
                <div className="trang-muon-tra__select-wrapper">
                  <CustomSelect
                    value={loaiHoSoDangMuon}
                    options={LOAI_HO_SO_OPTIONS}
                    onChange={(v) => { setLoaiHoSoDangMuon(v); setCurrentPage(1); }}
                    placeholder="Tất cả loại hồ sơ"
                  />
                </div>
                <Button variant="secondary" icon={<RotateCcw size={16} />} onClick={handleResetFilters}>
                  Đặt lại
                </Button>
              </div>
              <Button variant="primary" icon={<Plus size={16} />} onClick={openModalMuon}>
                Mượn hồ sơ
              </Button>
            </div>

            {/* Table */}
            <div className="trang-muon-tra__table-card">
              {isLoading ? (
                <div className="trang-muon-tra__loading">
                  <Loader2 className="trang-muon-tra__loading-icon" size={32} />
                  <p>Đang tải dữ liệu...</p>
                </div>
              ) : paginatedData.length > 0 ? (
                <>
                  <div className="trang-muon-tra__table-wrapper">
                    <table className="trang-muon-tra__table">
                      <thead>
                        <tr>
                          <th className="col-stt">STT</th>
                          <th className="col-mssv">MSSV</th>
                          <th>Họ và tên</th>
                          <th className="col-lop">Lớp</th>
                          <th className="col-loai">Loại hồ sơ</th>
                          <th className="col-date">Ngày mượn</th>
                          <th className="col-nguoi">Cán bộ phụ trách</th>
                          <th className="col-date">Hạn trả</th>
                          <th className="col-trangthai">Trạng thái</th>
                          <th className="col-thaotac">Thao tác</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(paginatedData as DangMuonItem[]).map((item, index) => {
                          const badgeInfo = TRANG_THAI_MUON_MAPPING[item.trangThai] || { label: item.trangThai, className: '' }
                          const pageStartIndex = (currentPage - 1) * PAGE_SIZE
                          return (
                            <tr key={item.maPhieu}>
                              <td className="col-stt">{pageStartIndex + index + 1}</td>
                              <td className="col-mssv">{item.mssv}</td>
                              <td>{item.hoTen}</td>
                              <td className="col-lop">{item.lop}</td>
                              <td className="col-loai">{item.loaiHoSo}</td>
                              <td className="col-date">{formatDate(item.ngayMuon)}</td>
                              <td className="col-nguoi">{item.canBoPhuTrach}</td>
                              <td className="col-date">{formatDate(item.hanTra)}</td>
                              <td className="col-trangthai">
                                <span className={`trang-muon-tra__badge ${badgeInfo.className}`}>
                                  {badgeInfo.label}
                                </span>
                              </td>
                              <td className="col-thaotac">
                                <div className="trang-muon-tra__actions">
                                  <Button variant="secondary" size="sm" onClick={() => openModalTra(item)}>
                                    Trả hồ sơ
                                  </Button>
                                  <Button variant="ghost" size="sm" icon={<Eye size={16} />} onClick={() => openModalChiTiet(item)}>
                                    Xem
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="trang-muon-tra__pagination">
                      <span className="trang-muon-tra__pagination-info">
                        Hiển thị {(currentPage - 1) * PAGE_SIZE + 1} - {Math.min(currentPage * PAGE_SIZE, totalElements)} của {totalElements} kết quả
                      </span>
                      <div className="trang-muon-tra__pagination-controls">
                        <button className="trang-muon-tra__page-btn" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
                          <ChevronLeft size={16} />
                        </button>
                        {getPageNumbers().map((page, index) =>
                          page === '...' ? (
                            <span key={`ellipsis-${index}`} className="trang-muon-tra__page-btn" style={{ cursor: 'default' }}>...</span>
                          ) : (
                            <button
                              key={page}
                              className={`trang-muon-tra__page-btn ${currentPage === page ? 'trang-muon-tra__page-btn--active' : ''}`}
                              onClick={() => setCurrentPage(page)}
                            >
                              {page}
                            </button>
                          )
                        )}
                        <button className="trang-muon-tra__page-btn" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
                          <ChevronRight size={16} />
                        </button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="trang-muon-tra__empty">
                  <FileX className="trang-muon-tra__empty-icon" size={48} />
                  <p className="trang-muon-tra__empty-text">Không có hồ sơ nào đang được mượn</p>
                </div>
              )}
            </div>
          </>
        )}

        {/* Tab 2: Lịch sử mượn / trả */}
        {activeTab === 'lichsu' && (
          <>
            {/* Toolbar */}
            <div className="trang-muon-tra__toolbar">
              <div className="trang-muon-tra__filters">
                <SearchInput
                  value={searchLichSu}
                  onChange={(v) => { setSearchLichSu(v); setCurrentPage(1); }}
                  placeholder="Tìm theo MSSV hoặc họ tên..."
                  className="trang-muon-tra__search"
                />
                <div className="trang-muon-tra__select-wrapper">
                  <CustomSelect
                    value={hanhDongLichSu}
                    options={HANH_DONG_OPTIONS}
                    onChange={(v) => { setHanhDongLichSu(v); setCurrentPage(1); }}
                    placeholder="Hành động"
                  />
                </div>
                <FormInput
                  type="date"
                  value={tuNgay}
                  onChange={(e) => { setTuNgay(e.target.value); setCurrentPage(1); }}
                  placeholder="Từ ngày"
                />
                <FormInput
                  type="date"
                  value={denNgay}
                  onChange={(e) => { setDenNgay(e.target.value); setCurrentPage(1); }}
                  placeholder="Đến ngày"
                />
                <Button variant="secondary" icon={<RotateCcw size={16} />} onClick={handleResetFilters}>
                  Đặt lại
                </Button>
              </div>
            </div>

            {/* Table */}
            <div className="trang-muon-tra__table-card">
              {(paginatedData as LichSuItem[]).length > 0 ? (
                <>
                  <div className="trang-muon-tra__table-wrapper">
                    <table className="trang-muon-tra__table">
                      <thead>
                        <tr>
                          <th className="col-stt">STT</th>
                          <th className="col-mssv">MSSV</th>
                          <th>Họ và tên</th>
                          <th className="col-loai">Loại hồ sơ</th>
                          <th className="col-hanhdong">Hành động</th>
                          <th className="col-datetime">Thời gian</th>
                          <th className="col-nguoi">Người thực hiện</th>
                          <th className="col-ghichu">Ghi chú</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(paginatedData as LichSuItem[]).map((item, index) => {
                          const badgeInfo = HANH_DONG_MAPPING[item.hanhDong] || { label: item.hanhDong, className: '' }
                          const pageStartIndex = (currentPage - 1) * PAGE_SIZE
                          return (
                            <tr key={item.maLog}>
                              <td className="col-stt">{pageStartIndex + index + 1}</td>
                              <td className="col-mssv">{item.mssv}</td>
                              <td>{item.hoTen}</td>
                              <td className="col-loai">{item.loaiHoSo}</td>
                              <td className="col-hanhdong">
                                <span className={`trang-muon-tra__badge ${badgeInfo.className}`}>
                                  {badgeInfo.label}
                                </span>
                              </td>
                              <td className="col-datetime">{item.thoiGian}</td>
                              <td className="col-nguoi">{item.nguoiThucHien}</td>
                              <td className="col-ghichu">{item.ghiChu || '-'}</td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="trang-muon-tra__pagination">
                      <span className="trang-muon-tra__pagination-info">
                        Hiển thị {(currentPage - 1) * PAGE_SIZE + 1} - {Math.min(currentPage * PAGE_SIZE, totalElements)} của {totalElements} kết quả
                      </span>
                      <div className="trang-muon-tra__pagination-controls">
                        <button className="trang-muon-tra__page-btn" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
                          <ChevronLeft size={16} />
                        </button>
                        {getPageNumbers().map((page, index) =>
                          page === '...' ? (
                            <span key={`ellipsis-${index}`} className="trang-muon-tra__page-btn" style={{ cursor: 'default' }}>...</span>
                          ) : (
                            <button
                              key={page}
                              className={`trang-muon-tra__page-btn ${currentPage === page ? 'trang-muon-tra__page-btn--active' : ''}`}
                              onClick={() => setCurrentPage(page)}
                            >
                              {page}
                            </button>
                          )
                        )}
                        <button className="trang-muon-tra__page-btn" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
                          <ChevronRight size={16} />
                        </button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="trang-muon-tra__empty">
                  <FileX className="trang-muon-tra__empty-icon" size={48} />
                  <p className="trang-muon-tra__empty-text">Không có lịch sử nào</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Modal Mượn hồ sơ */}
      <Modal
        isOpen={modalMuonOpen}
        onClose={() => setModalMuonOpen(false)}
        title="Mượn hồ sơ"
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalMuonOpen(false)}>
              Hủy
            </Button>
            <Button variant="primary" onClick={handleSubmitMuon}>
              Xác nhận mượn
            </Button>
          </>
        }
      >
        <div className="trang-muon-tra__modal-content">
          {/* Section 1: MSSV */}
          <div className="trang-muon-tra__form-section">
            <h3 className="trang-muon-tra__form-section-title">MSSV *</h3>
            <FormInput
              value={muonForm.mssv}
              onChange={(e) => handleMssvChange(e.target.value)}
              placeholder="Nhập MSSV (VD: B23DCCN001)"
            />
            {mssvError && (
              <div className="trang-muon-tra__error-message">
                <AlertCircle size={14} />
                <span>{mssvError}</span>
              </div>
            )}
          </div>

          {/* Section 2: Thông tin sinh viên (read-only) */}
          {sinhVienInfo && (
            <div className="trang-muon-tra__form-section">
              <h3 className="trang-muon-tra__form-section-title">Thông tin sinh viên</h3>
              <div className="trang-muon-tra__info-card">
                <div className="trang-muon-tra__info-grid">
                  <div className="trang-muon-tra__info-item">
                    <span className="trang-muon-tra__info-label">Họ và tên</span>
                    <span className="trang-muon-tra__info-value">{sinhVienInfo.hoTen}</span>
                  </div>
                  <div className="trang-muon-tra__info-item">
                    <span className="trang-muon-tra__info-label">Số CCCD</span>
                    <span className="trang-muon-tra__info-value">{sinhVienInfo.cccd}</span>
                  </div>
                  <div className="trang-muon-tra__info-item">
                    <span className="trang-muon-tra__info-label">Số điện thoại</span>
                    <span className="trang-muon-tra__info-value">{sinhVienInfo.sdt}</span>
                  </div>
                  <div className="trang-muon-tra__info-item">
                    <span className="trang-muon-tra__info-label">Khóa</span>
                    <span className="trang-muon-tra__info-value">{sinhVienInfo.khoa}</span>
                  </div>
                  <div className="trang-muon-tra__info-item">
                    <span className="trang-muon-tra__info-label">Lớp</span>
                    <span className="trang-muon-tra__info-value">{sinhVienInfo.lop}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Section 3: Thông tin phiếu mượn */}
          <div className="trang-muon-tra__form-section">
            <h3 className="trang-muon-tra__form-section-title">Thông tin phiếu mượn</h3>
            <div className="trang-muon-tra__form-grid">
              <FormSelect
                label="Loại hồ sơ *"
                value={muonForm.loaiHoSo}
                onChange={(e) => setMuonForm(prev => ({ ...prev, loaiHoSo: e.target.value }))}
                options={LOAI_HO_SO_CHON_OPTIONS}
                placeholder="Chọn loại hồ sơ"
              />
              <FormSelect
                label="Cán bộ phụ trách *"
                value={muonForm.canBoPhuTrach}
                onChange={(e) => setMuonForm(prev => ({ ...prev, canBoPhuTrach: e.target.value }))}
                options={CAN_BO_OPTIONS}
                placeholder="Chọn cán bộ phụ trách"
              />
              <FormInput
                label="Ngày mượn *"
                type="date"
                value={muonForm.ngayMuon}
                onChange={(e) => setMuonForm(prev => ({ ...prev, ngayMuon: e.target.value }))}
              />
              <FormInput
                label="Hạn trả *"
                type="date"
                value={muonForm.hanTra}
                onChange={(e) => setMuonForm(prev => ({ ...prev, hanTra: e.target.value }))}
              />
              <div className="trang-muon-tra__form-full">
                <FormInput
                  label="Ghi chú"
                  value={muonForm.ghiChu}
                  onChange={(e) => setMuonForm(prev => ({ ...prev, ghiChu: e.target.value }))}
                  placeholder="Nhập ghi chú (nếu có)"
                />
              </div>
            </div>
          </div>
        </div>
      </Modal>

      {/* Modal Chi tiết phiếu mượn */}
      <Modal
        isOpen={modalChiTietOpen}
        onClose={() => setModalChiTietOpen(false)}
        title="Chi tiết phiếu mượn"
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalChiTietOpen(false)}>
              Đóng
            </Button>
            {(selectedRecord?.trangThai === 'Đang mượn' || selectedRecord?.trangThai === 'Quá hạn') && (
              <Button variant="primary" onClick={() => openModalTra(selectedRecord)}>
                Trả hồ sơ
              </Button>
            )}
          </>
        }
      >
        {selectedRecord && (
          <div className="trang-muon-tra__modal-content">
            {/* Thông tin sinh viên */}
            <div className="trang-muon-tra__form-section">
              <h3 className="trang-muon-tra__form-section-title">Thông tin sinh viên</h3>
              <div className="trang-muon-tra__info-card">
                <div className="trang-muon-tra__info-grid">
                  <div className="trang-muon-tra__info-item">
                    <span className="trang-muon-tra__info-label">MSSV</span>
                    <span className="trang-muon-tra__info-value">{selectedRecord.mssv}</span>
                  </div>
                  <div className="trang-muon-tra__info-item">
                    <span className="trang-muon-tra__info-label">Họ và tên</span>
                    <span className="trang-muon-tra__info-value">{selectedRecord.hoTen}</span>
                  </div>
                  <div className="trang-muon-tra__info-item">
                    <span className="trang-muon-tra__info-label">Số CCCD</span>
                    <span className="trang-muon-tra__info-value">{selectedRecord.cccd}</span>
                  </div>
                  <div className="trang-muon-tra__info-item">
                    <span className="trang-muon-tra__info-label">Số điện thoại</span>
                    <span className="trang-muon-tra__info-value">{selectedRecord.sdt}</span>
                  </div>
                  <div className="trang-muon-tra__info-item">
                    <span className="trang-muon-tra__info-label">Khóa</span>
                    <span className="trang-muon-tra__info-value">{selectedRecord.khoa}</span>
                  </div>
                  <div className="trang-muon-tra__info-item">
                    <span className="trang-muon-tra__info-label">Lớp</span>
                    <span className="trang-muon-tra__info-value">{selectedRecord.lop}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Thông tin phiếu mượn */}
            <div className="trang-muon-tra__form-section">
              <h3 className="trang-muon-tra__form-section-title">Thông tin phiếu mượn</h3>
              <div className="trang-muon-tra__info-card">
                <div className="trang-muon-tra__info-grid">
                  <div className="trang-muon-tra__info-item">
                    <span className="trang-muon-tra__info-label">Mã phiếu mượn</span>
                    <span className="trang-muon-tra__info-value">{selectedRecord.maPhieu}</span>
                  </div>
                  <div className="trang-muon-tra__info-item">
                    <span className="trang-muon-tra__info-label">Loại hồ sơ</span>
                    <span className="trang-muon-tra__info-value">{selectedRecord.loaiHoSo}</span>
                  </div>
                  <div className="trang-muon-tra__info-item">
                    <span className="trang-muon-tra__info-label">Cán bộ phụ trách</span>
                    <span className="trang-muon-tra__info-value">{selectedRecord.canBoPhuTrach}</span>
                  </div>
                  <div className="trang-muon-tra__info-item">
                    <span className="trang-muon-tra__info-label">Ngày mượn</span>
                    <span className="trang-muon-tra__info-value">{formatDate(selectedRecord.ngayMuon)}</span>
                  </div>
                  <div className="trang-muon-tra__info-item">
                    <span className="trang-muon-tra__info-label">Hạn trả</span>
                    <span className="trang-muon-tra__info-value">{formatDate(selectedRecord.hanTra)}</span>
                  </div>
                  <div className="trang-muon-tra__info-item">
                    <span className="trang-muon-tra__info-label">Trạng thái</span>
                    <span className="trang-muon-tra__info-value">
                      {getTrangThaiBadge(selectedRecord.trangThai)}
                    </span>
                  </div>
                  <div className="trang-muon-tra__info-item trang-muon-tra__info-item--full">
                    <span className="trang-muon-tra__info-label">Ghi chú</span>
                    <span className="trang-muon-tra__info-value">{selectedRecord.ghiChu || '-'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Trả hồ sơ */}
      <Modal
        isOpen={modalTraOpen}
        onClose={() => setModalTraOpen(false)}
        title="Trả hồ sơ"
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalTraOpen(false)}>
              Hủy
            </Button>
            <Button variant="primary" onClick={handleSubmitTra}>
              Xác nhận trả
            </Button>
          </>
        }
      >
        {selectedRecord && (
          <div className="trang-muon-tra__form">
            <div className="trang-muon-tra__info-row">
              <span className="trang-muon-tra__info-label">MSSV:</span>
              <span className="trang-muon-tra__info-value">{selectedRecord.mssv}</span>
            </div>
            <div className="trang-muon-tra__info-row">
              <span className="trang-muon-tra__info-label">Họ và tên:</span>
              <span className="trang-muon-tra__info-value">{selectedRecord.hoTen}</span>
            </div>
            <div className="trang-muon-tra__info-row">
              <span className="trang-muon-tra__info-label">Loại hồ sơ:</span>
              <span className="trang-muon-tra__info-value">{selectedRecord.loaiHoSo}</span>
            </div>
            <div className="trang-muon-tra__info-row">
              <span className="trang-muon-tra__info-label">Cán bộ phụ trách:</span>
              <span className="trang-muon-tra__info-value">{selectedRecord.canBoPhuTrach}</span>
            </div>
            <div className="trang-muon-tra__info-row">
              <span className="trang-muon-tra__info-label">Ngày mượn:</span>
              <span className="trang-muon-tra__info-value">{formatDate(selectedRecord.ngayMuon)}</span>
            </div>
            <div className="trang-muon-tra__info-row">
              <span className="trang-muon-tra__info-label">Hạn trả:</span>
              <span className="trang-muon-tra__info-value">{formatDate(selectedRecord.hanTra)}</span>
            </div>
            <FormInput
              label="Ghi chú trả"
              value={traForm.ghiChuTra}
              onChange={(e) => setTraForm({ ghiChuTra: e.target.value })}
              placeholder="Nhập ghi chú (nếu có)"
            />
          </div>
        )}
      </Modal>

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  )
}
