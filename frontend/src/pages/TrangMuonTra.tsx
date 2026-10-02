import { useState, useMemo, useEffect, useCallback } from 'react'
import { ChevronLeft, ChevronRight, Eye, FileX, Loader2, RotateCcw, Plus, ArrowRightLeft, AlertCircle } from 'lucide-react'
import { CustomSelect, SearchInput, Button, Toast, Modal, FormInput, FormSelect } from '../components/ui'
import { phieuMuonApi } from '../api/phieuMuon'
import type { PhieuMuon } from '../api/types'
import './TrangMuonTra.css'

const PAGE_SIZE = 10

// =========================================================================
// Type definitions
// =========================================================================

/** Sinh viên dùng cho lookup MSSV ở form Mượn (backend chưa có endpoint lookup riêng → giữ mock). */
interface SinhVien {
  mssv: string
  hoTen: string
  cccd: string
  sdt: string
  khoa: string
  lop: string
}

/** Row hiển thị trên bảng "Hồ sơ đang mượn" — map từ PhieuMuon (backend) + mở rộng vài field cho UI. */
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

/** Row "Lịch sử mượn / trả" — map từ PhieuMuon (backend) + format thời gian cho UI. */
interface LichSuItem {
  maPhieu: string
  mssv: string
  hoTen: string
  loaiHoSo: string
  trangThai: string
  /** Format vi-VN: dd/MM/yyyy HH:mm */
  thoiGian: string
  nguoiThucHien: string
  ghiChu: string
  ngayMuon: string
  hanTra: string
  ngayTraThucTe: string
}

// =========================================================================
// Mock data — TODO: replace khi backend bổ sung endpoint tương ứng.
// =========================================================================

// TODO(backend): thay bằng GET /api/sinh-vien/{mssv} khi cần lookup thông tin SV trong form Mượn.
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

// =========================================================================
// Mapping constants
// =========================================================================

const TRANG_THAI_MUON_MAPPING: Record<string, { label: string; className: string }> = {
  'Đang mượn': { label: 'Đang mượn', className: 'badge--primary' },
  'Quá hạn': { label: 'Quá hạn', className: 'badge--danger' },
}

const HANH_DONG_MAPPING: Record<string, { label: string; className: string }> = {
  'Mượn': { label: 'Mượn', className: 'badge--warning' },
  'Trả': { label: 'Trả', className: 'badge--success' },
  // Mapping trạng thái phiếu (backend) → nhãn hiển thị trong tab Lịch sử.
  'Chờ duyệt': { label: 'Chờ duyệt', className: 'badge--info' },
  'Đã duyệt': { label: 'Đã duyệt', className: 'badge--primary' },
  'Từ chối': { label: 'Từ chối', className: 'badge--danger' },
  'Đang mượn': { label: 'Đang mượn', className: 'badge--primary' },
  'Đã trả': { label: 'Đã trả', className: 'badge--success' },
  'Quá hạn': { label: 'Quá hạn', className: 'badge--danger' },
  'Hoàn tất': { label: 'Hoàn tất', className: 'badge--success' },
}

const TRANG_THAI_OPTIONS = [
  { value: '', label: 'Tất cả trạng thái' },
  { value: 'Đang mượn', label: 'Đang mượn' },
  { value: 'Quá hạn', label: 'Quá hạn' },
]

const LOAI_HO_SO_OPTIONS = [
  { value: '', label: 'Tất cả loại hồ sơ' },
  { value: 'Mượn tạm thời', label: 'Mượn tạm thời' },
  { value: 'Rút vĩnh viễn', label: 'Rút vĩnh viễn' },
]

const LOAI_HO_SO_CHON_OPTIONS = [
  { value: 'Mượn tạm thời', label: 'Mượn tạm thời' },
  { value: 'Rút vĩnh viễn', label: 'Rút vĩnh viễn' },
]

const HANH_DONG_OPTIONS = [
  { value: '', label: 'Tất cả trạng thái' },
  { value: 'Chờ duyệt', label: 'Chờ duyệt' },
  { value: 'Đã duyệt', label: 'Đã duyệt' },
  { value: 'Đang mượn', label: 'Đang mượn' },
  { value: 'Đã trả', label: 'Đã trả' },
  { value: 'Quá hạn', label: 'Quá hạn' },
  { value: 'Hoàn tất', label: 'Hoàn tất' },
  { value: 'Từ chối', label: 'Từ chối' },
]

// TODO(backend): danh sách cán bộ — cần endpoint /api/users (lọc role=STAFF/ADMIN) để chọn từ DB.
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

// =========================================================================
// Component
// =========================================================================

export function TrangMuonTra() {
  // ----- Tab state -----
  const [activeTab, setActiveTab] = useState<'dangmuon' | 'lichsu'>('dangmuon')

  // ----- Data: tab "Đang mượn" — fetch từ API thật -----
  const [dangMuonList, setDangMuonList] = useState<DangMuonItem[]>([])
  const [isLoadingDangMuon, setIsLoadingDangMuon] = useState(false)
  const [errorDangMuon, setErrorDangMuon] = useState<string | null>(null)
  const [totalElements, setTotalElements] = useState(0)

  // ----- Data: tab "Lịch sử" — fetch từ API thật (GET /api/phieu-muon/lich-su) -----
  const [lichSuList, setLichSuList] = useState<LichSuItem[]>([])
  const [isLoadingLichSu, setIsLoadingLichSu] = useState(false)
  const [errorLichSu, setErrorLichSu] = useState<string | null>(null)
  const [totalElementsLichSu, setTotalElementsLichSu] = useState(0)

  // ----- Filter state: tab 1 -----
  const [searchDangMuon, setSearchDangMuon] = useState('')
  const [trangThaiDangMuon, setTrangThaiDangMuon] = useState('')
  const [loaiHoSoDangMuon, setLoaiHoSoDangMuon] = useState('')

  // ----- Filter state: tab 2 -----
  const [searchLichSu, setSearchLichSu] = useState('')
  const [hanhDongLichSu, setHanhDongLichSu] = useState('')
  const [tuNgay, setTuNgay] = useState('')
  const [denNgay, setDenNgay] = useState('')

  // ----- Pagination (server-side cho tab 1, client-side cho tab 2) -----
  const [currentPage, setCurrentPage] = useState(0) // 0-based cho server

  // ----- Modal state -----
  const [modalMuonOpen, setModalMuonOpen] = useState(false)
  const [modalTraOpen, setModalTraOpen] = useState(false)
  const [modalChiTietOpen, setModalChiTietOpen] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState<DangMuonItem | null>(null)

  // ----- Student info (form Mượn) — giữ mock cho đến khi có endpoint lookup -----
  const [sinhVienInfo, setSinhVienInfo] = useState<SinhVien | null>(null)
  const [mssvError, setMssvError] = useState('')

  // ----- Form state: Mượn -----
  const [muonForm, setMuonForm] = useState({
    mssv: '',
    loaiHoSo: '',
    canBoPhuTrach: '',
    ngayMuon: new Date().toISOString().split('T')[0],
    hanTra: '',
    ghiChu: '',
  })

  // ----- Form state: Trả -----
  const [traForm, setTraForm] = useState({
    ghiChuTra: '',
  })

  // ----- Toast -----
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)

  // =========================================================================
  // Map PhieuMuon (backend DTO) → DangMuonItem (UI row)
  // =========================================================================
  function mapPhieuMuonToRow(p: PhieuMuon): DangMuonItem {
    // Backend không trả cccd/sdt/khoa/lop trong PhieuMuonResponse (chỉ có hoTenSinhVien).
    // Những field này UI đang hiển thị — tạm để rỗng; nếu cần, bổ sung endpoint detail phiếu.
    // canBoPhuTrach: backend không có — dùng nguoiTao làm proxy.
    return {
      maPhieu: p.maPhieu,
      mssv: p.mssv,
      hoTen: p.hoTenSinhVien || '',
      cccd: '',
      sdt: '',
      khoa: '',
      lop: '',
      loaiHoSo: p.loaiPhieu,
      canBoPhuTrach: p.nguoiTao || '',
      ngayMuon: p.ngayMuon || '',
      hanTra: p.ngayTraDuKien || '',
      trangThai: p.trangThai,
      ghiChu: p.ghiChu || p.lyDo || '',
    }
  }

  // =========================================================================
  // Effects: gọi backend mỗi khi filter / page đổi
  // =========================================================================

  const fetchDangMuon = useCallback(async () => {
    setIsLoadingDangMuon(true)
    setErrorDangMuon(null)
    try {
      const res = await phieuMuonApi.getDangMuon({
        keyword: searchDangMuon.trim() || undefined,
        trangThai: trangThaiDangMuon || undefined,
        loaiHoSo: loaiHoSoDangMuon || undefined,
        page: currentPage,
        size: PAGE_SIZE,
      })

      if (res.success && res.data) {
        const items: DangMuonItem[] = (res.data.data || []).map(mapPhieuMuonToRow)
        setDangMuonList(items)
        setTotalElements(res.data.page?.totalElements ?? items.length)
      } else {
        setErrorDangMuon(res.message || 'Không thể tải danh sách hồ sơ đang mượn.')
        setDangMuonList([])
        setTotalElements(0)
      }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } }
      setErrorDangMuon(
        e.response?.data?.message ||
            'Không thể kết nối đến máy chủ. Vui lòng kiểm tra backend đang chạy ở http://localhost:8081.'
      )
      setDangMuonList([])
      setTotalElements(0)
    } finally {
      setIsLoadingDangMuon(false)
    }
  }, [searchDangMuon, trangThaiDangMuon, loaiHoSoDangMuon, currentPage])

  const fetchLichSu = useCallback(async () => {
    setIsLoadingLichSu(true)
    setErrorLichSu(null)
    try {
      const res = await phieuMuonApi.getLichSu({
        keyword: searchLichSu.trim() || undefined,
        trangThai: hanhDongLichSu || undefined,
        loaiHoSo: loaiHoSoDangMuon || undefined,
        fromDate: tuNgay || undefined,
        toDate: denNgay || undefined,
        page: currentPage,
        size: PAGE_SIZE,
      })

      if (res.success && res.data) {
        const items: LichSuItem[] = (res.data.data || []).map(mapPhieuMuonToLichSu)
        setLichSuList(items)
        setTotalElementsLichSu(res.data.page?.totalElements ?? items.length)
      } else {
        setErrorLichSu(res.message || 'Không thể tải lịch sử mượn trả.')
        setLichSuList([])
        setTotalElementsLichSu(0)
      }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } }
      setErrorLichSu(
        e.response?.data?.message ||
            'Không thể kết nối đến máy chủ. Vui lòng kiểm tra backend đang chạy ở http://localhost:8081.'
      )
      setLichSuList([])
      setTotalElementsLichSu(0)
    } finally {
      setIsLoadingLichSu(false)
    }
  }, [searchLichSu, hanhDongLichSu, loaiHoSoDangMuon, tuNgay, denNgay, currentPage])

  useEffect(() => {
    if (activeTab === 'dangmuon') {
      // setState bên trong fetchDangMuon là async (sau await) nên đây là pattern hợp lệ.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchDangMuon()
    } else if (activeTab === 'lichsu') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchLichSu()
    }
  }, [activeTab, fetchDangMuon, fetchLichSu])

  // =========================================================================
  // Map PhieuMuon (backend DTO) → LichSuItem (UI row)
  // =========================================================================
  function mapPhieuMuonToLichSu(p: PhieuMuon): LichSuItem {
    return {
      maPhieu: p.maPhieu,
      mssv: p.mssv,
      hoTen: p.hoTenSinhVien || '',
      loaiHoSo: p.loaiPhieu,
      trangThai: p.trangThai,
      // Lấy ngày tạo phiếu làm "thời gian" trong tab lịch sử.
      thoiGian: p.ngayTao || '',
      nguoiThucHien: p.nguoiTao || '',
      ghiChu: p.ghiChu || p.lyDo || '',
      ngayMuon: p.ngayMuon || '',
      hanTra: p.ngayTraDuKien || '',
      ngayTraThucTe: p.ngayTraThucTe || '',
    }
  }

  // Pagination cho UI (server-side cho cả 2 tab)
  const lichSuTotalPages = Math.max(1, Math.ceil(totalElementsLichSu / PAGE_SIZE))
  const dangMuonTotalPages = Math.max(1, Math.ceil(totalElements / PAGE_SIZE))
  const totalPages = activeTab === 'dangmuon' ? dangMuonTotalPages : lichSuTotalPages
  const paginatedData =
    activeTab === 'dangmuon'
      ? dangMuonList // server đã trả đúng trang
      : lichSuList // server đã trả đúng trang

  // =========================================================================
  // Handlers
  // =========================================================================
  function handleResetFilters() {
    setSearchDangMuon('')
    setTrangThaiDangMuon('')
    setLoaiHoSoDangMuon('')
    setSearchLichSu('')
    setHanhDongLichSu('')
    setTuNgay('')
    setDenNgay('')
    setCurrentPage(0)
  }

  function showToast(message: string, type: 'success' | 'error' | 'info' = 'info') {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  function openModalChiTiet(record: DangMuonItem) {
    setSelectedRecord(record)
    setModalChiTietOpen(true)
  }

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
    setMuonForm((prev) => ({ ...prev, mssv: value }))

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

  /**
   * TODO(backend): chức năng Mượn hồ sơ.
   * Hiện KHÔNG có endpoint POST /api/phieu-muon trong backend (đã verify PhieuXuatHoSoController).
   * Khi backend sẵn sàng, thay bằng:
   *   await phieuMuonApi.create({ mssv, loaiPhieu, lyDo, ngayMuon, ngayTraDuKien, danhSachMaHoSo })
   * rồi gọi fetchDangMuon() để refresh.
   */
  function handleSubmitMuon() {
    if (!muonForm.mssv || !sinhVienInfo) {
      showToast('Vui lòng nhập MSSV hợp lệ', 'error')
      return
    }
    if (!muonForm.loaiHoSo || !muonForm.canBoPhuTrach || !muonForm.hanTra) {
      showToast('Vui lòng điền đầy đủ thông tin bắt buộc', 'error')
      return
    }

    showToast(
      'Chức năng tạo phiếu mượn chưa được backend hỗ trợ. Sẽ hoạt động khi bổ sung POST /api/phieu-muon.',
      'info'
    )
    setModalMuonOpen(false)
  }

  function openModalTra(record: DangMuonItem) {
    setSelectedRecord(record)
    setTraForm({ ghiChuTra: '' })
    setModalTraOpen(true)
    setModalChiTietOpen(false)
  }

  /**
   * TODO(backend): chức năng Trả hồ sơ.
   * Backend chưa có endpoint PUT /api/phieu-muon/{maPhieu}/tra.
   * Hiện chỉ là demo local; refresh trang sẽ mất thay đổi.
   */
  function handleSubmitTra() {
    if (!selectedRecord) return

    showToast(
      'Chức năng trả hồ sơ chưa được backend hỗ trợ. Sẽ hoạt động khi bổ sung PUT /api/phieu-muon/{id}/tra.',
      'info'
    )
    setModalTraOpen(false)
    setSelectedRecord(null)
  }

  // Page numbers cho pagination UI
  function getPageNumbers(): (number | '...')[] {
    const pages: (number | '...')[] = []
    if (totalPages <= 7) {
      for (let i = 0; i < totalPages; i++) pages.push(i + 1)
    } else if (currentPage + 1 <= 4) {
      for (let i = 0; i < 5; i++) pages.push(i + 1)
      pages.push('...')
      pages.push(totalPages)
    } else if (currentPage + 1 >= totalPages - 3) {
      pages.push(1)
      pages.push('...')
      for (let i = totalPages - 5; i < totalPages; i++) pages.push(i + 1)
    } else {
      pages.push(1)
      pages.push('...')
      pages.push(currentPage)
      pages.push(currentPage + 1)
      pages.push(currentPage + 2)
      pages.push('...')
      pages.push(totalPages)
    }
    return pages
  }

  // Format date ISO → vi-VN
  function formatDate(dateStr: string) {
    if (!dateStr) return '—'
    try {
      return new Date(dateStr).toLocaleDateString('vi-VN')
    } catch {
      return dateStr
    }
  }

  // Format datetime ISO → vi-VN (dd/MM/yyyy HH:mm)
  function formatDateTime(dateStr: string) {
    if (!dateStr) return '—'
    try {
      const d = new Date(dateStr)
      const pad = (n: number) => String(n).padStart(2, '0')
      return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`
    } catch {
      return dateStr
    }
  }

  function getTrangThaiBadge(trangThai: string) {
    const info = TRANG_THAI_MUON_MAPPING[trangThai] || { label: trangThai, className: '' }
    return (
      <span className={`trang-muon-tra__badge ${info.className}`}>
        {info.label}
      </span>
    )
  }

  // =========================================================================
  // Render
  // =========================================================================
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
          onClick={() => {
            setActiveTab('dangmuon')
            setCurrentPage(0)
          }}
        >
          <ArrowRightLeft size={18} />
          Hồ sơ đang mượn
        </button>
        <button
          className={`trang-muon-tra__tab ${activeTab === 'lichsu' ? 'trang-muon-tra__tab--active' : ''}`}
          onClick={() => {
            setActiveTab('lichsu')
            setCurrentPage(0)
          }}
        >
          <FileX size={18} />
          Lịch sử mượn / trả
        </button>
      </div>

      {/* Content */}
      <div className="trang-muon-tra__content">
        {/* Tab 1: Hồ sơ đang mượn — DATA TỪ API THẬT */}
        {activeTab === 'dangmuon' && (
          <>
            <div className="trang-muon-tra__toolbar">
              <div className="trang-muon-tra__filters">
                <SearchInput
                  value={searchDangMuon}
                  onChange={(v) => {
                    setSearchDangMuon(v)
                    setCurrentPage(0)
                  }}
                  placeholder="Tìm theo MSSV / mã phiếu / họ tên / lý do..."
                  className="trang-muon-tra__search"
                />
                <div className="trang-muon-tra__select-wrapper">
                  <CustomSelect
                    value={trangThaiDangMuon}
                    options={TRANG_THAI_OPTIONS}
                    onChange={(v) => {
                      setTrangThaiDangMuon(v)
                      setCurrentPage(0)
                    }}
                    placeholder="Tất cả trạng thái"
                  />
                </div>
                <div className="trang-muon-tra__select-wrapper">
                  <CustomSelect
                    value={loaiHoSoDangMuon}
                    options={LOAI_HO_SO_OPTIONS}
                    onChange={(v) => {
                      setLoaiHoSoDangMuon(v)
                      setCurrentPage(0)
                    }}
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

            <div className="trang-muon-tra__table-card">
              {isLoadingDangMuon ? (
                <div className="trang-muon-tra__loading">
                  <Loader2 className="trang-muon-tra__loading-icon" size={32} />
                  <p>Đang tải dữ liệu từ máy chủ...</p>
                </div>
              ) : errorDangMuon ? (
                <div className="trang-muon-tra__empty">
                  <AlertCircle className="trang-muon-tra__empty-icon" size={48} color="#dc2626" />
                  <p className="trang-muon-tra__empty-text">{errorDangMuon}</p>
                  <Button variant="secondary" onClick={fetchDangMuon} style={{ marginTop: 12 }}>
                    Thử lại
                  </Button>
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
                          const badgeInfo = TRANG_THAI_MUON_MAPPING[item.trangThai] || {
                            label: item.trangThai,
                            className: '',
                          }
                          const sttNum = currentPage * PAGE_SIZE + index + 1
                          return (
                            <tr key={item.maPhieu}>
                              <td className="col-stt">{sttNum}</td>
                              <td className="col-mssv">{item.mssv}</td>
                              <td>{item.hoTen || '-'}</td>
                              <td className="col-lop">{item.lop || '-'}</td>
                              <td className="col-loai">{item.loaiHoSo}</td>
                              <td className="col-date">{formatDate(item.ngayMuon)}</td>
                              <td className="col-nguoi">{item.canBoPhuTrach || '-'}</td>
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
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    icon={<Eye size={16} />}
                                    onClick={() => openModalChiTiet(item)}
                                  >
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

                  {totalPages > 1 && (
                    <div className="trang-muon-tra__pagination">
                      <span className="trang-muon-tra__pagination-info">
                        Hiển thị {currentPage * PAGE_SIZE + 1} -{' '}
                        {Math.min((currentPage + 1) * PAGE_SIZE, totalElements)} của {totalElements} kết quả
                      </span>
                      <div className="trang-muon-tra__pagination-controls">
                        <button
                          className="trang-muon-tra__page-btn"
                          onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                          disabled={currentPage === 0}
                        >
                          <ChevronLeft size={16} />
                        </button>
                        {getPageNumbers().map((page, index) =>
                          page === '...' ? (
                            <span
                              key={`ellipsis-${index}`}
                              className="trang-muon-tra__page-btn"
                              style={{ cursor: 'default' }}
                            >
                              ...
                            </span>
                          ) : (
                            <button
                              key={page}
                              className={`trang-muon-tra__page-btn ${
                                currentPage + 1 === page ? 'trang-muon-tra__page-btn--active' : ''
                              }`}
                              onClick={() => setCurrentPage(page - 1)}
                            >
                              {page}
                            </button>
                          )
                        )}
                        <button
                          className="trang-muon-tra__page-btn"
                          onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
                          disabled={currentPage + 1 >= totalPages}
                        >
                          <ChevronRight size={16} />
                        </button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="trang-muon-tra__empty">
                  <FileX className="trang-muon-tra__empty-icon" size={48} />
                  <p className="trang-muon-tra__empty-text">
                    Không có hồ sơ nào đang được mượn
                    {searchDangMuon || trangThaiDangMuon || loaiHoSoDangMuon
                      ? ' khớp với bộ lọc hiện tại'
                      : ''}
                    .
                  </p>
                </div>
              )}
            </div>
          </>
        )}

        {/* Tab 2: Lịch sử mượn / trả — DATA TỪ API THẬT (GET /api/phieu-muon/lich-su) */}
        {activeTab === 'lichsu' && (
          <>
            <div className="trang-muon-tra__toolbar">
              <div className="trang-muon-tra__filters">
                <SearchInput
                  value={searchLichSu}
                  onChange={(v) => {
                    setSearchLichSu(v)
                    setCurrentPage(0)
                  }}
                  placeholder="Tìm theo MSSV / mã phiếu / họ tên / lý do..."
                  className="trang-muon-tra__search"
                />
                <div className="trang-muon-tra__select-wrapper">
                  <CustomSelect
                    value={hanhDongLichSu}
                    options={HANH_DONG_OPTIONS}
                    onChange={(v) => {
                      setHanhDongLichSu(v)
                      setCurrentPage(0)
                    }}
                    placeholder="Tất cả trạng thái"
                  />
                </div>
                <div className="trang-muon-tra__select-wrapper">
                  <CustomSelect
                    value={loaiHoSoDangMuon}
                    options={LOAI_HO_SO_OPTIONS}
                    onChange={(v) => {
                      setLoaiHoSoDangMuon(v)
                      setCurrentPage(0)
                    }}
                    placeholder="Tất cả loại hồ sơ"
                  />
                </div>
                <FormInput
                  type="date"
                  value={tuNgay}
                  onChange={(e) => {
                    setTuNgay(e.target.value)
                    setCurrentPage(0)
                  }}
                  placeholder="Từ ngày"
                />
                <FormInput
                  type="date"
                  value={denNgay}
                  onChange={(e) => {
                    setDenNgay(e.target.value)
                    setCurrentPage(0)
                  }}
                  placeholder="Đến ngày"
                />
                <Button variant="secondary" icon={<RotateCcw size={16} />} onClick={handleResetFilters}>
                  Đặt lại
                </Button>
              </div>
            </div>

            <div className="trang-muon-tra__table-card">
              {isLoadingLichSu ? (
                <div className="trang-muon-tra__loading">
                  <Loader2 className="trang-muon-tra__loading-icon" size={32} />
                  <p>Đang tải dữ liệu từ máy chủ...</p>
                </div>
              ) : errorLichSu ? (
                <div className="trang-muon-tra__empty">
                  <AlertCircle className="trang-muon-tra__empty-icon" size={48} color="#dc2626" />
                  <p className="trang-muon-tra__empty-text">{errorLichSu}</p>
                  <Button variant="secondary" onClick={fetchLichSu} style={{ marginTop: 12 }}>
                    Thử lại
                  </Button>
                </div>
              ) : (paginatedData as LichSuItem[]).length > 0 ? (
                <>
                  <div className="trang-muon-tra__table-wrapper">
                    <table className="trang-muon-tra__table">
                      <thead>
                        <tr>
                          <th className="col-stt">STT</th>
                          <th className="col-mssv">Mã phiếu</th>
                          <th className="col-mssv">MSSV</th>
                          <th>Họ và tên</th>
                          <th className="col-loai">Loại hồ sơ</th>
                          <th className="col-hanhdong">Trạng thái</th>
                          <th className="col-datetime">Thời gian tạo</th>
                          <th className="col-date">Ngày mượn</th>
                          <th className="col-date">Hạn trả</th>
                          <th className="col-nguoi">Người tạo</th>
                          <th className="col-ghichu">Ghi chú</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(paginatedData as LichSuItem[]).map((item, index) => {
                          const badgeInfo = HANH_DONG_MAPPING[item.trangThai] || {
                            label: item.trangThai,
                            className: '',
                          }
                          const sttNum = currentPage * PAGE_SIZE + index + 1
                          return (
                            <tr key={item.maPhieu}>
                              <td className="col-stt">{sttNum}</td>
                              <td className="col-mssv">{item.maPhieu}</td>
                              <td className="col-mssv">{item.mssv}</td>
                              <td>{item.hoTen || '-'}</td>
                              <td className="col-loai">{item.loaiHoSo}</td>
                              <td className="col-hanhdong">
                                <span className={`trang-muon-tra__badge ${badgeInfo.className}`}>
                                  {badgeInfo.label}
                                </span>
                              </td>
                              <td className="col-datetime">{formatDateTime(item.thoiGian)}</td>
                              <td className="col-date">{formatDate(item.ngayMuon)}</td>
                              <td className="col-date">{formatDate(item.hanTra)}</td>
                              <td className="col-nguoi">{item.nguoiThucHien || '-'}</td>
                              <td className="col-ghichu">{item.ghiChu || '-'}</td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>

                  {totalPages > 1 && (
                    <div className="trang-muon-tra__pagination">
                      <span className="trang-muon-tra__pagination-info">
                        Hiển thị {currentPage * PAGE_SIZE + 1} -{' '}
                        {Math.min((currentPage + 1) * PAGE_SIZE, totalElementsLichSu)} của{' '}
                        {totalElementsLichSu} kết quả
                      </span>
                      <div className="trang-muon-tra__pagination-controls">
                        <button
                          className="trang-muon-tra__page-btn"
                          onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                          disabled={currentPage === 0}
                        >
                          <ChevronLeft size={16} />
                        </button>
                        {getPageNumbers().map((page, index) =>
                          page === '...' ? (
                            <span
                              key={`ellipsis-${index}`}
                              className="trang-muon-tra__page-btn"
                              style={{ cursor: 'default' }}
                            >
                              ...
                            </span>
                          ) : (
                            <button
                              key={page}
                              className={`trang-muon-tra__page-btn ${
                                currentPage + 1 === page ? 'trang-muon-tra__page-btn--active' : ''
                              }`}
                              onClick={() => setCurrentPage(page - 1)}
                            >
                              {page}
                            </button>
                          )
                        )}
                        <button
                          className="trang-muon-tra__page-btn"
                          onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
                          disabled={currentPage + 1 >= totalPages}
                        >
                          <ChevronRight size={16} />
                        </button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="trang-muon-tra__empty">
                  <FileX className="trang-muon-tra__empty-icon" size={48} />
                  <p className="trang-muon-tra__empty-text">
                    Không có lịch sử nào
                    {searchLichSu || hanhDongLichSu || tuNgay || denNgay
                      ? ' khớp với bộ lọc hiện tại'
                      : ''}
                    .
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Modal Mượn hồ sơ — TODO: chưa nối backend */}
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

          <div className="trang-muon-tra__form-section">
            <h3 className="trang-muon-tra__form-section-title">Thông tin phiếu mượn</h3>
            <div className="trang-muon-tra__form-grid">
              <FormSelect
                label="Loại hồ sơ *"
                value={muonForm.loaiHoSo}
                onChange={(e) => setMuonForm((prev) => ({ ...prev, loaiHoSo: e.target.value }))}
                options={LOAI_HO_SO_CHON_OPTIONS}
                placeholder="Chọn loại hồ sơ"
              />
              <FormSelect
                label="Cán bộ phụ trách *"
                value={muonForm.canBoPhuTrach}
                onChange={(e) =>
                  setMuonForm((prev) => ({ ...prev, canBoPhuTrach: e.target.value }))
                }
                options={CAN_BO_OPTIONS}
                placeholder="Chọn cán bộ phụ trách"
              />
              <FormInput
                label="Ngày mượn *"
                type="date"
                value={muonForm.ngayMuon}
                onChange={(e) => setMuonForm((prev) => ({ ...prev, ngayMuon: e.target.value }))}
              />
              <FormInput
                label="Hạn trả *"
                type="date"
                value={muonForm.hanTra}
                onChange={(e) => setMuonForm((prev) => ({ ...prev, hanTra: e.target.value }))}
              />
              <div className="trang-muon-tra__form-full">
                <FormInput
                  label="Ghi chú"
                  value={muonForm.ghiChu}
                  onChange={(e) => setMuonForm((prev) => ({ ...prev, ghiChu: e.target.value }))}
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
            {(selectedRecord?.trangThai === 'Đang mượn' ||
              selectedRecord?.trangThai === 'Quá hạn') && (
              <Button variant="primary" onClick={() => openModalTra(selectedRecord)}>
                Trả hồ sơ
              </Button>
            )}
          </>
        }
      >
        {selectedRecord && (
          <div className="trang-muon-tra__modal-content">
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
                    <span className="trang-muon-tra__info-value">{selectedRecord.hoTen || '-'}</span>
                  </div>
                  <div className="trang-muon-tra__info-item">
                    <span className="trang-muon-tra__info-label">Số CCCD</span>
                    <span className="trang-muon-tra__info-value">{selectedRecord.cccd || '-'}</span>
                  </div>
                  <div className="trang-muon-tra__info-item">
                    <span className="trang-muon-tra__info-label">Số điện thoại</span>
                    <span className="trang-muon-tra__info-value">{selectedRecord.sdt || '-'}</span>
                  </div>
                  <div className="trang-muon-tra__info-item">
                    <span className="trang-muon-tra__info-label">Khóa</span>
                    <span className="trang-muon-tra__info-value">{selectedRecord.khoa || '-'}</span>
                  </div>
                  <div className="trang-muon-tra__info-item">
                    <span className="trang-muon-tra__info-label">Lớp</span>
                    <span className="trang-muon-tra__info-value">{selectedRecord.lop || '-'}</span>
                  </div>
                </div>
              </div>
            </div>

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
                    <span className="trang-muon-tra__info-value">{selectedRecord.canBoPhuTrach || '-'}</span>
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

      {/* Modal Trả hồ sơ — TODO: chưa nối backend */}
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
              <span className="trang-muon-tra__info-value">{selectedRecord.hoTen || '-'}</span>
            </div>
            <div className="trang-muon-tra__info-row">
              <span className="trang-muon-tra__info-label">Loại hồ sơ:</span>
              <span className="trang-muon-tra__info-value">{selectedRecord.loaiHoSo}</span>
            </div>
            <div className="trang-muon-tra__info-row">
              <span className="trang-muon-tra__info-label">Cán bộ phụ trách:</span>
              <span className="trang-muon-tra__info-value">{selectedRecord.canBoPhuTrach || '-'}</span>
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
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}