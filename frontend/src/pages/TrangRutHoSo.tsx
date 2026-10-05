import { useState, useMemo, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Eye, FileX, RotateCcw, Plus, AlertCircle } from 'lucide-react'
import { SearchInput, Button, Toast, Modal, FormInput, FormSelect } from '../components/ui'
import './TrangRutHoSo.css'

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

interface HoSoCoTheRut {
  mssv: string
  hoTen: string
  cccd: string
  sdt: string
  khoa: string
  lop: string
  ngayTiepNhan: string
  canBoPhuTrach: string
}

interface GiayToItem {
  tenGiayTo: string
  trangThai: string
}

interface LichSuRut {
  maPhieu: string
  mssv: string
  hoTen: string
  cccd: string
  lop: string
  khoa: string
  ngayRut: string
  canBoPhuTrach: string
  lyDo: string
  ghiChu: string
}

// Mock data sinh viên đầy đủ
const MOCK_SINHVIEN: Record<string, SinhVien> = {
  'B23DCCN001': { mssv: 'B23DCCN001', hoTen: 'Nguyễn Văn An', cccd: '079205001234', sdt: '0912345678', khoa: 'K23', lop: 'CNTT-2023.1' },
  'B23DCCN002': { mssv: 'B23DCCN002', hoTen: 'Trần Thị Bình', cccd: '079205001235', sdt: '0987654321', khoa: 'K23', lop: 'CNTT-2023.1' },
  'B23DCCN003': { mssv: 'B23DCCN003', hoTen: 'Lê Minh Cường', cccd: '079205001236', sdt: '0912345680', khoa: 'K23', lop: 'QTKD-2023.1' },
  'B23DCCN004': { mssv: 'B23DCCN004', hoTen: 'Hoàng Thị E', cccd: '079205001237', sdt: '0912345681', khoa: 'K23', lop: 'KTTN-2023.1' },
  'B23DCCN005': { mssv: 'B23DCCN005', hoTen: 'Đặng Thị F', cccd: '079205001238', sdt: '0912345682', khoa: 'K23', lop: 'NNA-2023.1' },
  'B23DCCN006': { mssv: 'B23DCCN006', hoTen: 'Bùi Văn G', cccd: '079205001239', sdt: '0912345683', khoa: 'K23', lop: 'L-2023.1' },
  'B23DCCN007': { mssv: 'B23DCCN007', hoTen: 'Phạm Thị H', cccd: '079205001240', sdt: '0912345684', khoa: 'K23', lop: 'TCNH-2023.1' },
  'B23DCCN008': { mssv: 'B23DCCN008', hoTen: 'Vũ Văn I', cccd: '079205001241', sdt: '0912345685', khoa: 'K23', lop: 'QHQT-2023.1' },
}

// Mock data hồ sơ có thể rút (theo sinh viên)
const MOCK_HOSO_CO_THE_RUT: HoSoCoTheRut[] = [
  { mssv: 'B23DCCN001', hoTen: 'Nguyễn Văn An', cccd: '079205001234', sdt: '0912345678', khoa: 'K23', lop: 'CNTT-2023.1', ngayTiepNhan: '2026-09-15', canBoPhuTrach: 'Nguyễn Thị A' },
  { mssv: 'B23DCCN002', hoTen: 'Trần Thị Bình', cccd: '079205001235', sdt: '0987654321', khoa: 'K23', lop: 'CNTT-2023.1', ngayTiepNhan: '2026-09-12', canBoPhuTrach: 'Trần Văn B' },
  { mssv: 'B23DCCN003', hoTen: 'Lê Minh Cường', cccd: '079205001236', sdt: '0912345680', khoa: 'K23', lop: 'QTKD-2023.1', ngayTiepNhan: '2026-09-10', canBoPhuTrach: 'Phạm Thị D' },
  { mssv: 'B23DCCN004', hoTen: 'Hoàng Thị E', cccd: '079205001237', sdt: '0912345681', khoa: 'K23', lop: 'KTTN-2023.1', ngayTiepNhan: '2026-09-08', canBoPhuTrach: 'Lê Văn E' },
  { mssv: 'B23DCCN005', hoTen: 'Đặng Thị F', cccd: '079205001238', sdt: '0912345682', khoa: 'K23', lop: 'NNA-2023.1', ngayTiepNhan: '2026-09-05', canBoPhuTrach: 'Nguyễn Văn F' },
  { mssv: 'B23DCCN006', hoTen: 'Bùi Văn G', cccd: '079205001239', sdt: '0912345683', khoa: 'K23', lop: 'L-2023.1', ngayTiepNhan: '2026-09-03', canBoPhuTrach: 'Trần Thị G' },
]

// Mock data giấy tờ của sinh viên
const MOCK_GIAYTO: Record<string, GiayToItem[]> = {
  'B23DCCN001': [
    { tenGiayTo: 'Giấy chứng nhận kết quả thi gốc', trangThai: 'Đã nộp' },
    { tenGiayTo: 'Bằng tốt nghiệp THPT', trangThai: 'Đã nộp' },
    { tenGiayTo: 'Học bạ', trangThai: 'Đã nộp' },
    { tenGiayTo: 'CCCD', trangThai: 'Đã nộp' },
    { tenGiayTo: 'Giấy khai sinh', trangThai: 'Đã nộp' },
    { tenGiayTo: 'Hộ chiếu', trangThai: 'Chưa nộp' },
    { tenGiayTo: 'Giấy xác nhận dân sự', trangThai: 'Đã nộp' },
  ],
  'B23DCCN002': [
    { tenGiayTo: 'Giấy chứng nhận kết quả thi gốc', trangThai: 'Đã nộp' },
    { tenGiayTo: 'Bằng tốt nghiệp THPT', trangThai: 'Đã nộp' },
    { tenGiayTo: 'Học bạ', trangThai: 'Thiếu' },
    { tenGiayTo: 'CCCD', trangThai: 'Đã nộp' },
    { tenGiayTo: 'Giấy khai sinh', trangThai: 'Đã nộp' },
  ],
  'B23DCCN003': [
    { tenGiayTo: 'Giấy chứng nhận kết quả thi gốc', trangThai: 'Đã nộp' },
    { tenGiayTo: 'Bằng tốt nghiệp THPT', trangThai: 'Đã nộp' },
    { tenGiayTo: 'Học bạ', trangThai: 'Đã nộp' },
    { tenGiayTo: 'CCCD', trangThai: 'Đã nộp' },
  ],
  'B23DCCN004': [
    { tenGiayTo: 'Giấy chứng nhận kết quả thi gốc', trangThai: 'Đã nộp' },
    { tenGiayTo: 'Bằng tốt nghiệp THPT', trangThai: 'Chưa nộp' },
    { tenGiayTo: 'Học bạ', trangThai: 'Đã nộp' },
    { tenGiayTo: 'CCCD', trangThai: 'Đã nộp' },
    { tenGiayTo: 'Giấy khai sinh', trangThai: 'Đã nộp' },
  ],
  'B23DCCN005': [
    { tenGiayTo: 'Giấy chứng nhận kết quả thi gốc', trangThai: 'Đã nộp' },
    { tenGiayTo: 'Bằng tốt nghiệp THPT', trangThai: 'Đã nộp' },
    { tenGiayTo: 'CCCD', trangThai: 'Đã nộp' },
  ],
  'B23DCCN006': [
    { tenGiayTo: 'Giấy chứng nhận kết quả thi gốc', trangThai: 'Đã nộp' },
    { tenGiayTo: 'Bằng tốt nghiệp THPT', trangThai: 'Đã nộp' },
    { tenGiayTo: 'Học bạ', trangThai: 'Đã nộp' },
    { tenGiayTo: 'CCCD', trangThai: 'Đã nộp' },
    { tenGiayTo: 'Giấy khai sinh', trangThai: 'Đã nộp' },
  ],
}

// Mock data lịch sử rút hồ sơ
const MOCK_LICHSU_RUT: LichSuRut[] = [
  { maPhieu: 'PR101', mssv: 'B23DCCN007', hoTen: 'Phạm Thị H', cccd: '079205001240', lop: 'TCNH-2023.1', khoa: 'K23', ngayRut: '2026-09-28', canBoPhuTrach: 'Bùi Văn H', lyDo: 'Tốt nghiệp', ghiChu: 'Rút để hoàn tất thủ tục' },
  { maPhieu: 'PR102', mssv: 'B23DCCN008', hoTen: 'Vũ Văn I', cccd: '079205001241', lop: 'QHQT-2023.1', khoa: 'K23', ngayRut: '2026-09-25', canBoPhuTrach: 'Đặng Văn I', lyDo: 'Chuyển trường', ghiChu: '' },
  { maPhieu: 'PR103', mssv: 'B23DCCN009', hoTen: 'Trần Văn J', cccd: '079205001242', lop: 'CNTT-2023.2', khoa: 'K23', ngayRut: '2026-09-20', canBoPhuTrach: 'Nguyễn Thị A', lyDo: 'Tự thôi học', ghiChu: 'Đã kiểm tra đủ giấy tờ' },
  { maPhieu: 'PR104', mssv: 'B23DCCN010', hoTen: 'Lê Thị L', cccd: '079205001243', lop: 'QTKD-2023.2', khoa: 'K23', ngayRut: '2026-09-15', canBoPhuTrach: 'Trần Văn B', lyDo: 'Tốt nghiệp', ghiChu: '' },
]

// Options
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

export function TrangRutHoSo() {
  // Get MSSV from URL if passed from Danh sach ho so
  const [searchParams] = useSearchParams()
  const mssvFromUrl = searchParams.get('mssv')

  // Tab state
  const [activeTab, setActiveTab] = useState<'coTheRut' | 'lichSu'>('coTheRut')
  
  // Data state - Tab 1
  const [hoSoCoTheRutList, setHoSoCoTheRutList] = useState<HoSoCoTheRut[]>(MOCK_HOSO_CO_THE_RUT)
  
  // Data state - Tab 2
  const [lichSuRutList, setLichSuRutList] = useState<LichSuRut[]>(MOCK_LICHSU_RUT)
  
  // Filter state - Tab 1
  const [searchCoTheRut, setSearchCoTheRut] = useState('')
  const [tuNgayCoTheRut, setTuNgayCoTheRut] = useState('')
  const [denNgayCoTheRut, setDenNgayCoTheRut] = useState('')
  
  // Filter state - Tab 2
  const [searchLichSu, setSearchLichSu] = useState('')
  const [tuNgayLichSu, setTuNgayLichSu] = useState('')
  const [denNgayLichSu, setDenNgayLichSu] = useState('')
  
  // Pagination
  const [currentPageCoTheRut, setCurrentPageCoTheRut] = useState(1)
  const [currentPageLichSu, setCurrentPageLichSu] = useState(1)
  
  // Modal state
  const [modalRutFromListOpen, setModalRutFromListOpen] = useState(false)  // From row button
  const [modalRutFromTopOpen, setModalRutFromTopOpen] = useState(false)   // From top button
  const [modalChiTietHoSoOpen, setModalChiTietHoSoOpen] = useState(false) // Xem chi tiết hồ sơ
  const [modalChiTietRutOpen, setModalChiTietRutOpen] = useState(false)   // Chi tiết rút hồ sơ
  const [modalXacNhanOpen, setModalXacNhanOpen] = useState(false)
  
  const [selectedSinhVien, setSelectedSinhVien] = useState<HoSoCoTheRut | null>(null)
  const [selectedLichSu, setSelectedLichSu] = useState<LichSuRut | null>(null)
  
  // Student info state (for top button form)
  const [sinhVienInfo, setSinhVienInfo] = useState<SinhVien | null>(null)
  const [mssvError, setMssvError] = useState('')
  
  // Form state - Rút hồ sơ (from top button)
  const [rutFormTop, setRutFormTop] = useState({
    mssv: '',
    ngayRut: new Date().toISOString().split('T')[0],
    canBoPhuTrach: '',
    lyDo: '',
    ghiChu: '',
  })
  
  // Form state - Rút hồ sơ (from row button)
  const [rutFormRow, setRutFormRow] = useState({
    ngayRut: new Date().toISOString().split('T')[0],
    canBoPhuTrach: '',
    lyDo: '',
    ghiChu: '',
  })
  
  // Toast state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)

  // Effect to handle MSSV from URL
  useEffect(() => {
    if (mssvFromUrl) {
      const sv = MOCK_SINHVIEN[mssvFromUrl.toUpperCase()]
      if (sv) {
        setSinhVienInfo(sv)
        setRutFormTop(prev => ({ ...prev, mssv: sv.mssv }))
        // Open the modal automatically
        setModalRutFromTopOpen(true)
      }
    }
  }, [mssvFromUrl])

  // Filter data - Tab 1
  const filteredCoTheRut = useMemo(() => {
    return hoSoCoTheRutList.filter(item => {
      const matchSearch = !searchCoTheRut || 
        item.mssv.toLowerCase().includes(searchCoTheRut.toLowerCase()) ||
        item.hoTen.toLowerCase().includes(searchCoTheRut.toLowerCase())
      const matchTuNgay = !tuNgayCoTheRut || new Date(item.ngayTiepNhan) >= new Date(tuNgayCoTheRut)
      const matchDenNgay = !denNgayCoTheRut || new Date(item.ngayTiepNhan) <= new Date(denNgayCoTheRut)
      return matchSearch && matchTuNgay && matchDenNgay
    })
  }, [hoSoCoTheRutList, searchCoTheRut, tuNgayCoTheRut, denNgayCoTheRut])

  // Filter data - Tab 2
  const filteredLichSu = useMemo(() => {
    return lichSuRutList.filter(item => {
      const matchSearch = !searchLichSu || 
        item.mssv.toLowerCase().includes(searchLichSu.toLowerCase()) ||
        item.hoTen.toLowerCase().includes(searchLichSu.toLowerCase())
      const matchTuNgay = !tuNgayLichSu || new Date(item.ngayRut) >= new Date(tuNgayLichSu)
      const matchDenNgay = !denNgayLichSu || new Date(item.ngayRut) <= new Date(denNgayLichSu)
      return matchSearch && matchTuNgay && matchDenNgay
    })
  }, [lichSuRutList, searchLichSu, tuNgayLichSu, denNgayLichSu])

  // Pagination
  const totalElementsCoTheRut = filteredCoTheRut.length
  const totalPagesCoTheRut = Math.ceil(totalElementsCoTheRut / PAGE_SIZE)
  const paginatedCoTheRut = filteredCoTheRut.slice((currentPageCoTheRut - 1) * PAGE_SIZE, currentPageCoTheRut * PAGE_SIZE)

  const totalElementsLichSu = filteredLichSu.length
  const totalPagesLichSu = Math.ceil(totalElementsLichSu / PAGE_SIZE)
  const paginatedLichSu = filteredLichSu.slice((currentPageLichSu - 1) * PAGE_SIZE, currentPageLichSu * PAGE_SIZE)

  // Handlers
  function handleResetFilters(tab: 'coTheRut' | 'lichSu') {
    if (tab === 'coTheRut') {
      setSearchCoTheRut('')
      setTuNgayCoTheRut('')
      setDenNgayCoTheRut('')
      setCurrentPageCoTheRut(1)
    } else {
      setSearchLichSu('')
      setTuNgayLichSu('')
      setDenNgayLichSu('')
      setCurrentPageLichSu(1)
    }
  }

  function showToast(message: string, type: 'success' | 'error' | 'info' = 'info') {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  // Open modal "Rút hồ sơ" từ nút trong dòng (đã có sinh viên)
  function openModalRutFromRow(sv: HoSoCoTheRut) {
    setSelectedSinhVien(sv)
    setRutFormRow({
      ngayRut: new Date().toISOString().split('T')[0],
      canBoPhuTrach: '',
      lyDo: '',
      ghiChu: '',
    })
    setModalRutFromListOpen(true)
  }

  // Open modal "Rút hồ sơ" từ nút + ở đầu trang (chưa có sinh viên)
  function openModalRutFromTop() {
    setRutFormTop({
      mssv: '',
      ngayRut: new Date().toISOString().split('T')[0],
      canBoPhuTrach: '',
      lyDo: '',
      ghiChu: '',
    })
    setSinhVienInfo(null)
    setMssvError('')
    setModalRutFromTopOpen(true)
  }

  function handleMssvChange(value: string) {
    setRutFormTop(prev => ({ ...prev, mssv: value }))
    
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

  // Open modal "Thông tin hồ sơ sinh viên" (Xem)
  function openModalChiTietHoSo(sv: HoSoCoTheRut) {
    setSelectedSinhVien(sv)
    setModalChiTietHoSoOpen(true)
  }

  // Open modal "Chi tiết rút hồ sơ" (Xem ở lịch sử)
  function openModalChiTietRut(record: LichSuRut) {
    setSelectedLichSu(record)
    setModalChiTietRutOpen(true)
  }

  // Open modal Xác nhận
  function openModalXacNhan() {
    if (selectedSinhVien) {
      // From row button
      if (!rutFormRow.lyDo || !rutFormRow.canBoPhuTrach) {
        showToast('Vui lòng điền đầy đủ thông tin bắt buộc', 'error')
        return
      }
    } else if (sinhVienInfo) {
      // From top button
      if (!rutFormTop.lyDo || !rutFormTop.canBoPhuTrach) {
        showToast('Vui lòng điền đầy đủ thông tin bắt buộc', 'error')
        return
      }
    } else {
      return
    }
    setModalXacNhanOpen(true)
  }

  function handleSubmitRut() {
    if (selectedSinhVien) {
      // From row button
      const newLichSu: LichSuRut = {
        maPhieu: `PR${String(lichSuRutList.length + 101).padStart(3, '0')}`,
        mssv: selectedSinhVien.mssv,
        hoTen: selectedSinhVien.hoTen,
        cccd: selectedSinhVien.cccd,
        lop: selectedSinhVien.lop,
        khoa: selectedSinhVien.khoa,
        ngayRut: rutFormRow.ngayRut,
        canBoPhuTrach: rutFormRow.canBoPhuTrach,
        lyDo: rutFormRow.lyDo,
        ghiChu: rutFormRow.ghiChu,
      }

      // Update lists
      setHoSoCoTheRutList(prev => prev.filter(item => item.mssv !== selectedSinhVien.mssv))
      setLichSuRutList(prev => [newLichSu, ...prev])
    } else if (sinhVienInfo) {
      // From top button
      const newLichSu: LichSuRut = {
        maPhieu: `PR${String(lichSuRutList.length + 101).padStart(3, '0')}`,
        mssv: sinhVienInfo.mssv,
        hoTen: sinhVienInfo.hoTen,
        cccd: sinhVienInfo.cccd,
        lop: sinhVienInfo.lop,
        khoa: sinhVienInfo.khoa,
        ngayRut: rutFormTop.ngayRut,
        canBoPhuTrach: rutFormTop.canBoPhuTrach,
        lyDo: rutFormTop.lyDo,
        ghiChu: rutFormTop.ghiChu,
      }

      // Update lists
      setHoSoCoTheRutList(prev => prev.filter(item => item.mssv !== sinhVienInfo.mssv))
      setLichSuRutList(prev => [newLichSu, ...prev])
    }

    // Close all modals
    setModalXacNhanOpen(false)
    setModalRutFromListOpen(false)
    setModalRutFromTopOpen(false)
    setSelectedSinhVien(null)
    setSinhVienInfo(null)
    setMssvError('')
    
    showToast('Rút hồ sơ thành công', 'success')
  }

  // Generate page numbers
  function getPageNumbers(totalPages: number, currentPage: number) {
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

  // Get giay to list for a student
  function getGiayToList(mssv: string): GiayToItem[] {
    return MOCK_GIAYTO[mssv] || []
  }

  // Get current student for rut form (either from row or from top)
  function getCurrentRutSinhVien() {
    if (selectedSinhVien) {
      return selectedSinhVien
    }
    if (sinhVienInfo) {
      return {
        mssv: sinhVienInfo.mssv,
        hoTen: sinhVienInfo.hoTen,
        cccd: sinhVienInfo.cccd,
        sdt: sinhVienInfo.sdt,
        khoa: sinhVienInfo.khoa,
        lop: sinhVienInfo.lop,
        ngayTiepNhan: '',
        canBoPhuTrach: '',
      }
    }
    return null
  }

  return (
    <div className="trang-rut-ho-so">
      {/* Header */}
      <div className="trang-rut-ho-so__header">
        <h2 className="trang-rut-ho-so__title">Rút hồ sơ</h2>
        <p className="trang-rut-ho-so__subtitle">Quản lý việc rút hồ sơ của sinh viên</p>
      </div>

      {/* Tabs */}
      <div className="trang-rut-ho-so__tabs">
        <button
          className={`trang-rut-ho-so__tab ${activeTab === 'coTheRut' ? 'trang-rut-ho-so__tab--active' : ''}`}
          onClick={() => { setActiveTab('coTheRut'); setCurrentPageCoTheRut(1); }}
        >
          Hồ sơ có thể rút
        </button>
        <button
          className={`trang-rut-ho-so__tab ${activeTab === 'lichSu' ? 'trang-rut-ho-so__tab--active' : ''}`}
          onClick={() => { setActiveTab('lichSu'); setCurrentPageLichSu(1); }}
        >
          Lịch sử rút hồ sơ
        </button>
      </div>

      {/* Content */}
      <div className="trang-rut-ho-so__content">
        {/* Tab 1: Hồ sơ có thể rút */}
        {activeTab === 'coTheRut' && (
          <>
            {/* Toolbar */}
            <div className="trang-rut-ho-so__toolbar">
              <div className="trang-rut-ho-so__filters">
                <SearchInput
                  value={searchCoTheRut}
                  onChange={(v) => { setSearchCoTheRut(v); setCurrentPageCoTheRut(1); }}
                  placeholder="Tìm theo MSSV hoặc họ tên..."
                  className="trang-rut-ho-so__search"
                />
                <div className="trang-rut-ho-so__date-range">
                  <FormInput
                    type="date"
                    value={tuNgayCoTheRut}
                    onChange={(e) => { setTuNgayCoTheRut(e.target.value); setCurrentPageCoTheRut(1); }}
                    placeholder="Từ ngày"
                  />
                  <span className="trang-rut-ho-so__date-separator">→</span>
                  <FormInput
                    type="date"
                    value={denNgayCoTheRut}
                    onChange={(e) => { setDenNgayCoTheRut(e.target.value); setCurrentPageCoTheRut(1); }}
                    placeholder="Đến ngày"
                  />
                </div>
                <Button variant="secondary" icon={<RotateCcw size={16} />} onClick={() => handleResetFilters('coTheRut')}>
                  Đặt lại
                </Button>
              </div>
              <Button variant="primary" icon={<Plus size={16} />} onClick={openModalRutFromTop}>
                Rút hồ sơ
              </Button>
            </div>

            {/* Table */}
            <div className="trang-rut-ho-so__table-card">
              {paginatedCoTheRut.length > 0 ? (
                <>
                  <div className="trang-rut-ho-so__table-wrapper">
                    <table className="trang-rut-ho-so__table">
                      <thead>
                        <tr>
                          <th className="col-stt">STT</th>
                          <th className="col-mssv">MSSV</th>
                          <th>Họ và tên</th>
                          <th className="col-cccd">CCCD</th>
                          <th className="col-sdt">Số điện thoại</th>
                          <th className="col-lop">Lớp</th>
                          <th className="col-khoa">Khóa</th>
                          <th className="col-date">Ngày tiếp nhận</th>
                          <th className="col-thaotac">Thao tác</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedCoTheRut.map((item, index) => {
                          const pageStartIndex = (currentPageCoTheRut - 1) * PAGE_SIZE
                          return (
                            <tr key={item.mssv}>
                              <td className="col-stt">{pageStartIndex + index + 1}</td>
                              <td className="col-mssv">{item.mssv}</td>
                              <td>{item.hoTen}</td>
                              <td className="col-cccd">{item.cccd}</td>
                              <td className="col-sdt">{item.sdt}</td>
                              <td className="col-lop">{item.lop}</td>
                              <td className="col-khoa">{item.khoa}</td>
                              <td className="col-date">{formatDate(item.ngayTiepNhan)}</td>
                              <td className="col-thaotac">
                                <div className="trang-rut-ho-so__actions">
                                  <Button variant="secondary" size="sm" onClick={() => openModalRutFromRow(item)}>
                                    Rút hồ sơ
                                  </Button>
                                  <Button variant="ghost" size="sm" icon={<Eye size={16} />} onClick={() => openModalChiTietHoSo(item)}>
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
                  {totalPagesCoTheRut > 1 && (
                    <div className="trang-rut-ho-so__pagination">
                      <span className="trang-rut-ho-so__pagination-info">
                        Hiển thị {(currentPageCoTheRut - 1) * PAGE_SIZE + 1} - {Math.min(currentPageCoTheRut * PAGE_SIZE, totalElementsCoTheRut)} của {totalElementsCoTheRut} kết quả
                      </span>
                      <div className="trang-rut-ho-so__pagination-controls">
                        <button className="trang-rut-ho-so__page-btn" onClick={() => setCurrentPageCoTheRut(p => Math.max(1, p - 1))} disabled={currentPageCoTheRut === 1}>
                          <ChevronLeft size={16} />
                        </button>
                        {getPageNumbers(totalPagesCoTheRut, currentPageCoTheRut).map((page, index) =>
                          page === '...' ? (
                            <span key={`ellipsis-${index}`} className="trang-rut-ho-so__page-btn" style={{ cursor: 'default' }}>...</span>
                          ) : (
                            <button
                              key={page}
                              className={`trang-rut-ho-so__page-btn ${currentPageCoTheRut === page ? 'trang-rut-ho-so__page-btn--active' : ''}`}
                              onClick={() => setCurrentPageCoTheRut(page)}
                            >
                              {page}
                            </button>
                          )
                        )}
                        <button className="trang-rut-ho-so__page-btn" onClick={() => setCurrentPageCoTheRut(p => Math.min(totalPagesCoTheRut, p + 1))} disabled={currentPageCoTheRut === totalPagesCoTheRut}>
                          <ChevronRight size={16} />
                        </button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="trang-rut-ho-so__empty">
                  <FileX className="trang-rut-ho-so__empty-icon" size={48} />
                  <p className="trang-rut-ho-so__empty-text">Không tìm thấy hồ sơ phù hợp</p>
                  <Button variant="secondary" icon={<RotateCcw size={16} />} onClick={() => handleResetFilters('coTheRut')}>
                    Đặt lại bộ lọc
                  </Button>
                </div>
              )}
            </div>
          </>
        )}

        {/* Tab 2: Lịch sử rút hồ sơ */}
        {activeTab === 'lichSu' && (
          <>
            {/* Toolbar */}
            <div className="trang-rut-ho-so__toolbar">
              <div className="trang-rut-ho-so__filters">
                <SearchInput
                  value={searchLichSu}
                  onChange={(v) => { setSearchLichSu(v); setCurrentPageLichSu(1); }}
                  placeholder="Tìm theo MSSV hoặc họ tên..."
                  className="trang-rut-ho-so__search"
                />
                <div className="trang-rut-ho-so__date-range">
                  <FormInput
                    type="date"
                    value={tuNgayLichSu}
                    onChange={(e) => { setTuNgayLichSu(e.target.value); setCurrentPageLichSu(1); }}
                    placeholder="Từ ngày"
                  />
                  <span className="trang-rut-ho-so__date-separator">→</span>
                  <FormInput
                    type="date"
                    value={denNgayLichSu}
                    onChange={(e) => { setDenNgayLichSu(e.target.value); setCurrentPageLichSu(1); }}
                    placeholder="Đến ngày"
                  />
                </div>
                <Button variant="secondary" icon={<RotateCcw size={16} />} onClick={() => handleResetFilters('lichSu')}>
                  Đặt lại
                </Button>
              </div>
            </div>

            {/* Table */}
            <div className="trang-rut-ho-so__table-card">
              {paginatedLichSu.length > 0 ? (
                <>
                  <div className="trang-rut-ho-so__table-wrapper">
                    <table className="trang-rut-ho-so__table">
                      <thead>
                        <tr>
                          <th className="col-stt">STT</th>
                          <th className="col-mssv">MSSV</th>
                          <th>Họ và tên</th>
                          <th className="col-cccd">CCCD</th>
                          <th className="col-lop">Lớp</th>
                          <th className="col-khoa">Khóa</th>
                          <th className="col-date">Ngày rút</th>
                          <th className="col-cbpt">Cán bộ phụ trách</th>
                          <th className="col-lydo">Lý do</th>
                          <th className="col-thaotac">Thao tác</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedLichSu.map((item, index) => {
                          const pageStartIndex = (currentPageLichSu - 1) * PAGE_SIZE
                          return (
                            <tr key={item.maPhieu}>
                              <td className="col-stt">{pageStartIndex + index + 1}</td>
                              <td className="col-mssv">{item.mssv}</td>
                              <td>{item.hoTen}</td>
                              <td className="col-cccd">{item.cccd}</td>
                              <td className="col-lop">{item.lop}</td>
                              <td className="col-khoa">{item.khoa}</td>
                              <td className="col-date">{formatDate(item.ngayRut)}</td>
                              <td className="col-cbpt">{item.canBoPhuTrach}</td>
                              <td className="col-lydo">{item.lyDo}</td>
                              <td className="col-thaotac">
                                <div className="trang-rut-ho-so__actions">
                                  <Button variant="ghost" size="sm" icon={<Eye size={16} />} onClick={() => openModalChiTietRut(item)}>
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
                  {totalPagesLichSu > 1 && (
                    <div className="trang-rut-ho-so__pagination">
                      <span className="trang-rut-ho-so__pagination-info">
                        Hiển thị {(currentPageLichSu - 1) * PAGE_SIZE + 1} - {Math.min(currentPageLichSu * PAGE_SIZE, totalElementsLichSu)} của {totalElementsLichSu} kết quả
                      </span>
                      <div className="trang-rut-ho-so__pagination-controls">
                        <button className="trang-rut-ho-so__page-btn" onClick={() => setCurrentPageLichSu(p => Math.max(1, p - 1))} disabled={currentPageLichSu === 1}>
                          <ChevronLeft size={16} />
                        </button>
                        {getPageNumbers(totalPagesLichSu, currentPageLichSu).map((page, index) =>
                          page === '...' ? (
                            <span key={`ellipsis-${index}`} className="trang-rut-ho-so__page-btn" style={{ cursor: 'default' }}>...</span>
                          ) : (
                            <button
                              key={page}
                              className={`trang-rut-ho-so__page-btn ${currentPageLichSu === page ? 'trang-rut-ho-so__page-btn--active' : ''}`}
                              onClick={() => setCurrentPageLichSu(page)}
                            >
                              {page}
                            </button>
                          )
                        )}
                        <button className="trang-rut-ho-so__page-btn" onClick={() => setCurrentPageLichSu(p => Math.min(totalPagesLichSu, p + 1))} disabled={currentPageLichSu === totalPagesLichSu}>
                          <ChevronRight size={16} />
                        </button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="trang-rut-ho-so__empty">
                  <FileX className="trang-rut-ho-so__empty-icon" size={48} />
                  <p className="trang-rut-ho-so__empty-text">Không tìm thấy hồ sơ phù hợp</p>
                  <Button variant="secondary" icon={<RotateCcw size={16} />} onClick={() => handleResetFilters('lichSu')}>
                    Đặt lại bộ lọc
                  </Button>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Modal Rút hồ sơ (từ nút trong dòng - đã có sinh viên) */}
      <Modal
        isOpen={modalRutFromListOpen}
        onClose={() => setModalRutFromListOpen(false)}
        title="Rút hồ sơ"
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalRutFromListOpen(false)}>
              Hủy
            </Button>
            <Button variant="primary" onClick={openModalXacNhan}>
              Xác nhận rút
            </Button>
          </>
        }
      >
        {selectedSinhVien && (
          <div className="trang-rut-ho-so__modal-content">
            {/* Section 1: Thông tin sinh viên (read-only) */}
            <div className="trang-rut-ho-so__form-section">
              <h3 className="trang-rut-ho-so__form-section-title">Thông tin sinh viên</h3>
              <div className="trang-rut-ho-so__info-card">
                <div className="trang-rut-ho-so__info-grid">
                  <div className="trang-rut-ho-so__info-item">
                    <span className="trang-rut-ho-so__info-label">MSSV</span>
                    <span className="trang-rut-ho-so__info-value">{selectedSinhVien.mssv}</span>
                  </div>
                  <div className="trang-rut-ho-so__info-item">
                    <span className="trang-rut-ho-so__info-label">Họ và tên</span>
                    <span className="trang-rut-ho-so__info-value">{selectedSinhVien.hoTen}</span>
                  </div>
                  <div className="trang-rut-ho-so__info-item">
                    <span className="trang-rut-ho-so__info-label">Số CCCD</span>
                    <span className="trang-rut-ho-so__info-value">{selectedSinhVien.cccd}</span>
                  </div>
                  <div className="trang-rut-ho-so__info-item">
                    <span className="trang-rut-ho-so__info-label">Số điện thoại</span>
                    <span className="trang-rut-ho-so__info-value">{selectedSinhVien.sdt}</span>
                  </div>
                  <div className="trang-rut-ho-so__info-item">
                    <span className="trang-rut-ho-so__info-label">Khóa</span>
                    <span className="trang-rut-ho-so__info-value">{selectedSinhVien.khoa}</span>
                  </div>
                  <div className="trang-rut-ho-so__info-item">
                    <span className="trang-rut-ho-so__info-label">Lớp</span>
                    <span className="trang-rut-ho-so__info-value">{selectedSinhVien.lop}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: Thông tin rút hồ sơ */}
            <div className="trang-rut-ho-so__form-section">
              <h3 className="trang-rut-ho-so__form-section-title">Thông tin rút hồ sơ</h3>
              <div className="trang-rut-ho-so__form-grid">
                <FormInput
                  label="Ngày rút *"
                  type="date"
                  value={rutFormRow.ngayRut}
                  onChange={(e) => setRutFormRow(prev => ({ ...prev, ngayRut: e.target.value }))}
                />
                <FormSelect
                  label="Cán bộ phụ trách *"
                  value={rutFormRow.canBoPhuTrach}
                  onChange={(e) => setRutFormRow(prev => ({ ...prev, canBoPhuTrach: e.target.value }))}
                  options={CAN_BO_OPTIONS}
                  placeholder="Chọn cán bộ phụ trách"
                />
                <div className="trang-rut-ho-so__form-full">
                  <FormInput
                    label="Lý do rút hồ sơ *"
                    value={rutFormRow.lyDo}
                    onChange={(e) => setRutFormRow(prev => ({ ...prev, lyDo: e.target.value }))}
                    placeholder="Nhập lý do rút hồ sơ"
                  />
                </div>
                <div className="trang-rut-ho-so__form-full">
                  <FormInput
                    label="Ghi chú"
                    value={rutFormRow.ghiChu}
                    onChange={(e) => setRutFormRow(prev => ({ ...prev, ghiChu: e.target.value }))}
                    placeholder="Nhập ghi chú (nếu có)"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Rút hồ sơ (từ nút + ở đầu trang - cần nhập MSSV) */}
      <Modal
        isOpen={modalRutFromTopOpen}
        onClose={() => setModalRutFromTopOpen(false)}
        title="Rút hồ sơ"
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalRutFromTopOpen(false)}>
              Hủy
            </Button>
            <Button variant="primary" onClick={openModalXacNhan}>
              Xác nhận rút
            </Button>
          </>
        }
      >
        <div className="trang-rut-ho-so__modal-content">
          {/* Section 1: Nhập MSSV */}
          <div className="trang-rut-ho-so__form-section">
            <h3 className="trang-rut-ho-so__form-section-title">MSSV *</h3>
            <div className="trang-rut-ho-so__form-field">
              <FormInput
                value={rutFormTop.mssv}
                onChange={(e) => handleMssvChange(e.target.value)}
                placeholder="Nhập MSSV (VD: B23DCCN001)"
              />
            </div>
            {mssvError && (
              <div className="trang-rut-ho-so__error-message">
                <AlertCircle size={14} />
                <span>{mssvError}</span>
              </div>
            )}
          </div>

          {/* Section 2: Thông tin sinh viên (read-only, hiển thị khi tìm thấy) */}
          {sinhVienInfo && (
            <div className="trang-rut-ho-so__form-section">
              <h3 className="trang-rut-ho-so__form-section-title">Thông tin sinh viên</h3>
              <div className="trang-rut-ho-so__info-card">
                <div className="trang-rut-ho-so__info-grid">
                  <div className="trang-rut-ho-so__info-item">
                    <span className="trang-rut-ho-so__info-label">Họ và tên</span>
                    <span className="trang-rut-ho-so__info-value">{sinhVienInfo.hoTen}</span>
                  </div>
                  <div className="trang-rut-ho-so__info-item">
                    <span className="trang-rut-ho-so__info-label">Số CCCD</span>
                    <span className="trang-rut-ho-so__info-value">{sinhVienInfo.cccd}</span>
                  </div>
                  <div className="trang-rut-ho-so__info-item">
                    <span className="trang-rut-ho-so__info-label">Số điện thoại</span>
                    <span className="trang-rut-ho-so__info-value">{sinhVienInfo.sdt}</span>
                  </div>
                  <div className="trang-rut-ho-so__info-item">
                    <span className="trang-rut-ho-so__info-label">Khóa</span>
                    <span className="trang-rut-ho-so__info-value">{sinhVienInfo.khoa}</span>
                  </div>
                  <div className="trang-rut-ho-so__info-item">
                    <span className="trang-rut-ho-so__info-label">Lớp</span>
                    <span className="trang-rut-ho-so__info-value">{sinhVienInfo.lop}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Section 3: Thông tin rút hồ sơ */}
          <div className="trang-rut-ho-so__form-section">
            <h3 className="trang-rut-ho-so__form-section-title">Thông tin rút hồ sơ</h3>
            <div className="trang-rut-ho-so__form-grid">
              <FormInput
                label="Ngày rút *"
                type="date"
                value={rutFormTop.ngayRut}
                onChange={(e) => setRutFormTop(prev => ({ ...prev, ngayRut: e.target.value }))}
              />
              <FormSelect
                label="Cán bộ phụ trách *"
                value={rutFormTop.canBoPhuTrach}
                onChange={(e) => setRutFormTop(prev => ({ ...prev, canBoPhuTrach: e.target.value }))}
                options={CAN_BO_OPTIONS}
                placeholder="Chọn cán bộ phụ trách"
              />
              <div className="trang-rut-ho-so__form-full">
                <FormInput
                  label="Lý do rút hồ sơ *"
                  value={rutFormTop.lyDo}
                  onChange={(e) => setRutFormTop(prev => ({ ...prev, lyDo: e.target.value }))}
                  placeholder="Nhập lý do rút hồ sơ"
                />
              </div>
              <div className="trang-rut-ho-so__form-full">
                <FormInput
                  label="Ghi chú"
                  value={rutFormTop.ghiChu}
                  onChange={(e) => setRutFormTop(prev => ({ ...prev, ghiChu: e.target.value }))}
                  placeholder="Nhập ghi chú (nếu có)"
                />
              </div>
            </div>
          </div>
        </div>
      </Modal>

      {/* Modal Thông tin hồ sơ sinh viên (Xem) */}
      <Modal
        isOpen={modalChiTietHoSoOpen}
        onClose={() => setModalChiTietHoSoOpen(false)}
        title="Thông tin hồ sơ sinh viên"
        size="lg"
        footer={
          <Button variant="secondary" onClick={() => setModalChiTietHoSoOpen(false)}>
            Đóng
          </Button>
        }
      >
        {selectedSinhVien && (
          <div className="trang-rut-ho-so__modal-content">
            {/* Section 1: Thông tin cá nhân */}
            <div className="trang-rut-ho-so__form-section">
              <h3 className="trang-rut-ho-so__form-section-title">Thông tin cá nhân</h3>
              <div className="trang-rut-ho-so__info-card">
                <div className="trang-rut-ho-so__info-grid">
                  <div className="trang-rut-ho-so__info-item">
                    <span className="trang-rut-ho-so__info-label">MSSV</span>
                    <span className="trang-rut-ho-so__info-value">{selectedSinhVien.mssv}</span>
                  </div>
                  <div className="trang-rut-ho-so__info-item">
                    <span className="trang-rut-ho-so__info-label">Họ và tên</span>
                    <span className="trang-rut-ho-so__info-value">{selectedSinhVien.hoTen}</span>
                  </div>
                  <div className="trang-rut-ho-so__info-item">
                    <span className="trang-rut-ho-so__info-label">Số CCCD</span>
                    <span className="trang-rut-ho-so__info-value">{selectedSinhVien.cccd}</span>
                  </div>
                  <div className="trang-rut-ho-so__info-item">
                    <span className="trang-rut-ho-so__info-label">Số điện thoại</span>
                    <span className="trang-rut-ho-so__info-value">{selectedSinhVien.sdt}</span>
                  </div>
                  <div className="trang-rut-ho-so__info-item">
                    <span className="trang-rut-ho-so__info-label">Khóa</span>
                    <span className="trang-rut-ho-so__info-value">{selectedSinhVien.khoa}</span>
                  </div>
                  <div className="trang-rut-ho-so__info-item">
                    <span className="trang-rut-ho-so__info-label">Lớp</span>
                    <span className="trang-rut-ho-so__info-value">{selectedSinhVien.lop}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: Hồ sơ / Giấy tờ hiện có */}
            <div className="trang-rut-ho-so__form-section">
              <h3 className="trang-rut-ho-so__form-section-title">Hồ sơ / Giấy tờ hiện có</h3>
              <div className="trang-rut-ho-so__giayto-list">
                {getGiayToList(selectedSinhVien.mssv).map((giayTo, index) => (
                  <div key={index} className="trang-rut-ho-so__giayto-item">
                    <div className="trang-rut-ho-so__giayto-content">
                      <span className="trang-rut-ho-so__giayto-stt">{index + 1}.</span>
                      <span className="trang-rut-ho-so__giayto-name">{giayTo.tenGiayTo}</span>
                    </div>
                    <span className={`trang-rut-ho-so__giayto-status trang-rut-ho-so__giayto-status--${giayTo.trangThai.toLowerCase().replace(' ', '-')}`}>
                      {giayTo.trangThai}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Chi tiết rút hồ sơ (Xem ở lịch sử) */}
      <Modal
        isOpen={modalChiTietRutOpen}
        onClose={() => setModalChiTietRutOpen(false)}
        title="Chi tiết rút hồ sơ"
        size="lg"
        footer={
          <Button variant="secondary" onClick={() => setModalChiTietRutOpen(false)}>
            Đóng
          </Button>
        }
      >
        {selectedLichSu && (
          <div className="trang-rut-ho-so__modal-content">
            {/* Section 1: Thông tin sinh viên */}
            <div className="trang-rut-ho-so__form-section">
              <h3 className="trang-rut-ho-so__form-section-title">Thông tin sinh viên</h3>
              <div className="trang-rut-ho-so__info-card">
                <div className="trang-rut-ho-so__info-grid">
                  <div className="trang-rut-ho-so__info-item">
                    <span className="trang-rut-ho-so__info-label">MSSV</span>
                    <span className="trang-rut-ho-so__info-value">{selectedLichSu.mssv}</span>
                  </div>
                  <div className="trang-rut-ho-so__info-item">
                    <span className="trang-rut-ho-so__info-label">Họ và tên</span>
                    <span className="trang-rut-ho-so__info-value">{selectedLichSu.hoTen}</span>
                  </div>
                  <div className="trang-rut-ho-so__info-item">
                    <span className="trang-rut-ho-so__info-label">Số CCCD</span>
                    <span className="trang-rut-ho-so__info-value">{selectedLichSu.cccd}</span>
                  </div>
                  <div className="trang-rut-ho-so__info-item">
                    <span className="trang-rut-ho-so__info-label">Số điện thoại</span>
                    <span className="trang-rut-ho-so__info-value">{MOCK_SINHVIEN[selectedLichSu.mssv]?.sdt || '-'}</span>
                  </div>
                  <div className="trang-rut-ho-so__info-item">
                    <span className="trang-rut-ho-so__info-label">Khóa</span>
                    <span className="trang-rut-ho-so__info-value">{selectedLichSu.khoa}</span>
                  </div>
                  <div className="trang-rut-ho-so__info-item">
                    <span className="trang-rut-ho-so__info-label">Lớp</span>
                    <span className="trang-rut-ho-so__info-value">{selectedLichSu.lop}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: Thông tin rút hồ sơ */}
            <div className="trang-rut-ho-so__form-section">
              <h3 className="trang-rut-ho-so__form-section-title">Thông tin rút hồ sơ</h3>
              <div className="trang-rut-ho-so__info-card">
                <div className="trang-rut-ho-so__info-grid">
                  <div className="trang-rut-ho-so__info-item">
                    <span className="trang-rut-ho-so__info-label">Mã phiếu rút</span>
                    <span className="trang-rut-ho-so__info-value">{selectedLichSu.maPhieu}</span>
                  </div>
                  <div className="trang-rut-ho-so__info-item">
                    <span className="trang-rut-ho-so__info-label">Ngày rút</span>
                    <span className="trang-rut-ho-so__info-value">{formatDate(selectedLichSu.ngayRut)}</span>
                  </div>
                  <div className="trang-rut-ho-so__info-item">
                    <span className="trang-rut-ho-so__info-label">Cán bộ phụ trách</span>
                    <span className="trang-rut-ho-so__info-value">{selectedLichSu.canBoPhuTrach}</span>
                  </div>
                  <div className="trang-rut-ho-so__info-item">
                    <span className="trang-rut-ho-so__info-label">Lý do</span>
                    <span className="trang-rut-ho-so__info-value">{selectedLichSu.lyDo}</span>
                  </div>
                  <div className="trang-rut-ho-so__info-item trang-rut-ho-so__info-item--full">
                    <span className="trang-rut-ho-so__info-label">Ghi chú</span>
                    <span className="trang-rut-ho-so__info-value">{selectedLichSu.ghiChu || '-'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Xác nhận rút hồ sơ */}
      <Modal
        isOpen={modalXacNhanOpen}
        onClose={() => setModalXacNhanOpen(false)}
        title="Xác nhận rút hồ sơ"
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalXacNhanOpen(false)}>
              Hủy
            </Button>
            <Button variant="primary" onClick={handleSubmitRut}>
              Xác nhận
            </Button>
          </>
        }
      >
        {getCurrentRutSinhVien() && (
          <div className="trang-rut-ho-so__xac-nhan-content">
            <p className="trang-rut-ho-so__xac-nhan-text">
              Bạn có chắc chắn muốn rút hồ sơ của sinh viên <strong>{getCurrentRutSinhVien()?.hoTen}</strong> ({getCurrentRutSinhVien()?.mssv})?
            </p>
            <div className="trang-rut-ho-so__xac-nhan-info">
              {selectedSinhVien ? (
                <>
                  <div className="trang-rut-ho-so__xac-nhan-row">
                    <span className="trang-rut-ho-so__xac-nhan-label">Ngày rút:</span>
                    <span className="trang-rut-ho-so__xac-nhan-value">{formatDate(rutFormRow.ngayRut)}</span>
                  </div>
                  <div className="trang-rut-ho-so__xac-nhan-row">
                    <span className="trang-rut-ho-so__xac-nhan-label">Cán bộ phụ trách:</span>
                    <span className="trang-rut-ho-so__xac-nhan-value">{rutFormRow.canBoPhuTrach}</span>
                  </div>
                  <div className="trang-rut-ho-so__xac-nhan-row">
                    <span className="trang-rut-ho-so__xac-nhan-label">Lý do:</span>
                    <span className="trang-rut-ho-so__xac-nhan-value">{rutFormRow.lyDo}</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="trang-rut-ho-so__xac-nhan-row">
                    <span className="trang-rut-ho-so__xac-nhan-label">Ngày rút:</span>
                    <span className="trang-rut-ho-so__xac-nhan-value">{formatDate(rutFormTop.ngayRut)}</span>
                  </div>
                  <div className="trang-rut-ho-so__xac-nhan-row">
                    <span className="trang-rut-ho-so__xac-nhan-label">Cán bộ phụ trách:</span>
                    <span className="trang-rut-ho-so__xac-nhan-value">{rutFormTop.canBoPhuTrach}</span>
                  </div>
                  <div className="trang-rut-ho-so__xac-nhan-row">
                    <span className="trang-rut-ho-so__xac-nhan-label">Lý do:</span>
                    <span className="trang-rut-ho-so__xac-nhan-value">{rutFormTop.lyDo}</span>
                  </div>
                </>
              )}
            </div>
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
