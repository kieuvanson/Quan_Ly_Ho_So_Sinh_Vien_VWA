import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Eye, FileX, RotateCcw, Plus, AlertCircle, Loader2, History } from 'lucide-react'
import { SearchInput, Button, Toast, Modal, FormInput } from '../components/ui'
import { phieuMuonApi, lookupApi } from '../api/phieuMuon'
import type { PhieuMuon } from '../api/types'
import './TrangRutHoSo.css'

const PAGE_SIZE = 10

// =========================================================================
// Type definitions
// =========================================================================

/** Sinh viên dùng cho form Rút — lấy từ API /api/sinh-vien/{mssv}. */
interface SinhVien {
  mssv: string
  hoTen: string
  cccd: string
  sdt: string
  khoa: string
  lop: string
}

/** Row "Hồ sơ đã rút" — map từ PhieuMuon (backend). */
interface HoSoDaRutItem {
  maPhieu: string
  mssv: string
  hoTen: string
  cccd: string
  sdt: string
  khoa: string
  lop: string
  ngayRut: string
  canBoPhuTrach: string
  lyDo: string
  ghiChu: string
  trangThai: string
  ngayTao: string
}

/** Row "Lịch sử rút hồ sơ" — map từ PhieuMuon (backend). */
interface LichSuRutItem {
  maPhieu: string
  mssv: string
  hoTen: string
  ngayRut: string
  canBoPhuTrach: string
  lyDo: string
  ghiChu: string
  trangThai: string
  ngayTao: string
}

// =========================================================================
// Mapping constants
// =========================================================================

const TRANG_THAI_MAPPING: Record<string, { label: string; className: string }> = {
  'Chờ duyệt': { label: 'Chờ duyệt', className: 'badge--info' },
  'Đã duyệt': { label: 'Đã duyệt', className: 'badge--primary' },
  'Từ chối': { label: 'Từ chối', className: 'badge--danger' },
  'Đang mượn': { label: 'Đang mượn', className: 'badge--primary' },
  'Đã trả': { label: 'Đã trả', className: 'badge--success' },
  'Quá hạn': { label: 'Quá hạn', className: 'badge--danger' },
  'Hoàn tất': { label: 'Hoàn tất', className: 'badge--success' },
}

const LOAI_PHIEU_RUT = 'Rút vĩnh viễn'

// =========================================================================
// Component
// =========================================================================

export function TrangRutHoSo() {
  // Get MSSV from URL if passed from Danh sach ho so or Chi tiet ho so
  const [searchParams] = useSearchParams()
  const mssvFromUrl = searchParams.get('mssv')

  // ----- Tab state -----
  const [activeTab, setActiveTab] = useState<'daRut' | 'lichSu'>('daRut')

  // ===== TAB 1: Hồ sơ đã rút =====
  const [hoSoDaRutList, setHoSoDaRutList] = useState<HoSoDaRutItem[]>([])
  const [isLoadingDaRut, setIsLoadingDaRut] = useState(false)
  const [errorDaRut, setErrorDaRut] = useState<string | null>(null)
  const [totalElementsDaRut, setTotalElementsDaRut] = useState(0)

  // Filter tab 1
  const [searchDaRut, setSearchDaRut] = useState('')
  const [tuNgayDaRut, setTuNgayDaRut] = useState('')
  const [denNgayDaRut, setDenNgayDaRut] = useState('')
  const [currentPageDaRut, setCurrentPageDaRut] = useState(0)

  // ===== TAB 2: Lịch sử rút hồ sơ =====
  const [lichSuList, setLichSuList] = useState<LichSuRutItem[]>([])
  const [isLoadingLichSu, setIsLoadingLichSu] = useState(false)
  const [errorLichSu, setErrorLichSu] = useState<string | null>(null)
  const [totalElementsLichSu, setTotalElementsLichSu] = useState(0)

  // Filter tab 2
  const [searchLichSu, setSearchLichSu] = useState('')
  const [tuNgayLichSu, setTuNgayLichSu] = useState('')
  const [denNgayLichSu, setDenNgayLichSu] = useState('')
  const [currentPageLichSu, setCurrentPageLichSu] = useState(0)

  // ----- Modal state -----
  const [modalRutOpen, setModalRutOpen] = useState(false)
  const [modalChiTietOpen, setModalChiTietOpen] = useState(false)
  const [modalXacNhanOpen, setModalXacNhanOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // ----- Student info (form Rút) -----
  const [sinhVienInfo, setSinhVienInfo] = useState<SinhVien | null>(null)
  const [isLookingUpSv, setIsLookingUpSv] = useState(false)
  const [mssvError, setMssvError] = useState('')

  // ----- Selected record for modal -----
  const [selectedRecord, setSelectedRecord] = useState<HoSoDaRutItem | LichSuRutItem | null>(null)

  // ----- Form state -----
  const [rutForm, setRutForm] = useState({
    mssv: '',
    ngayRut: new Date().toISOString().split('T')[0],
    lyDo: '',
    ghiChu: '',
  })

  // ----- Toast -----
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)

  // =========================================================================
  // Map functions
  // =========================================================================
  function mapPhieuMuonToDaRut(p: PhieuMuon): HoSoDaRutItem {
    return {
      maPhieu: p.maPhieu,
      mssv: p.mssv,
      hoTen: p.hoTenSinhVien || '',
      cccd: '',
      sdt: '',
      khoa: '',
      lop: '',
      ngayRut: p.ngayMuon || p.ngayTao ? (p.ngayMuon || p.ngayTao?.split('T')[0] || '') : '',
      canBoPhuTrach: p.nguoiTao || '',
      lyDo: p.lyDo || '',
      ghiChu: p.ghiChu || '',
      trangThai: p.trangThai,
      ngayTao: p.ngayTao || '',
    }
  }

  function mapPhieuMuonToLichSu(p: PhieuMuon): LichSuRutItem {
    return {
      maPhieu: p.maPhieu,
      mssv: p.mssv,
      hoTen: p.hoTenSinhVien || '',
      ngayRut: p.ngayMuon || p.ngayTao ? (p.ngayMuon || p.ngayTao?.split('T')[0] || '') : '',
      canBoPhuTrach: p.nguoiTao || '',
      lyDo: p.lyDo || '',
      ghiChu: p.ghiChu || '',
      trangThai: p.trangThai,
      ngayTao: p.ngayTao || '',
    }
  }

  // =========================================================================
  // Fetch data functions
  // =========================================================================
  const fetchHoSoDaRut = useCallback(async () => {
    setIsLoadingDaRut(true)
    setErrorDaRut(null)
    try {
      const res = await phieuMuonApi.getLichSu({
        keyword: searchDaRut.trim() || undefined,
        loaiHoSo: LOAI_PHIEU_RUT,
        fromDate: tuNgayDaRut || undefined,
        toDate: denNgayDaRut || undefined,
        page: currentPageDaRut,
        size: PAGE_SIZE,
      })

      if (res.success && res.data) {
        const items: HoSoDaRutItem[] = (res.data.data || [])
          .filter(p => p.loaiPhieu === LOAI_PHIEU_RUT)
          .map(mapPhieuMuonToDaRut)
        setHoSoDaRutList(items)
        setTotalElementsDaRut(res.data.page?.totalElements ?? items.length)
      } else {
        setErrorDaRut(res.message || 'Không thể tải danh sách hồ sơ đã rút.')
        setHoSoDaRutList([])
        setTotalElementsDaRut(0)
      }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } }
      setErrorDaRut(
        e.response?.data?.message ||
          'Không thể kết nối đến máy chủ. Vui lòng kiểm tra backend đang chạy ở http://localhost:8081.'
      )
      setHoSoDaRutList([])
      setTotalElementsDaRut(0)
    } finally {
      setIsLoadingDaRut(false)
    }
  }, [searchDaRut, tuNgayDaRut, denNgayDaRut, currentPageDaRut])

  const fetchLichSu = useCallback(async () => {
    setIsLoadingLichSu(true)
    setErrorLichSu(null)
    try {
      const res = await phieuMuonApi.getLichSu({
        keyword: searchLichSu.trim() || undefined,
        loaiHoSo: LOAI_PHIEU_RUT,
        fromDate: tuNgayLichSu || undefined,
        toDate: denNgayLichSu || undefined,
        page: currentPageLichSu,
        size: PAGE_SIZE,
      })

      if (res.success && res.data) {
        const items: LichSuRutItem[] = (res.data.data || [])
          .filter(p => p.loaiPhieu === LOAI_PHIEU_RUT)
          .map(mapPhieuMuonToLichSu)
        setLichSuList(items)
        setTotalElementsLichSu(res.data.page?.totalElements ?? items.length)
      } else {
        setErrorLichSu(res.message || 'Không thể tải lịch sử rút hồ sơ.')
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
  }, [searchLichSu, tuNgayLichSu, denNgayLichSu, currentPageLichSu])

  useEffect(() => {
    if (activeTab === 'daRut') {
      fetchHoSoDaRut()
    } else {
      fetchLichSu()
    }
  }, [activeTab, fetchHoSoDaRut, fetchLichSu])

  // =========================================================================
  // Handle MSSV from URL
  // =========================================================================
  useEffect(() => {
    if (!mssvFromUrl) return

    const lookupMssv = async () => {
      setRutForm((prev) => ({ ...prev, mssv: mssvFromUrl }))
      setIsLookingUpSv(true)
      setMssvError('')
      try {
        const sv = await lookupApi.getSinhVien(mssvFromUrl.trim())
        if (sv) {
          setSinhVienInfo({
            mssv: sv.mssv,
            hoTen: sv.hoTen,
            cccd: sv.cccd || '',
            sdt: sv.sdt || '',
            khoa: sv.khoa || '',
            lop: sv.lop || '',
          })
          setModalRutOpen(true)
        } else {
          setMssvError('Không tìm thấy sinh viên với MSSV này.')
        }
      } catch {
        setMssvError('Lỗi tra cứu sinh viên. Vui lòng thử lại.')
      } finally {
        setIsLookingUpSv(false)
      }
    }

    lookupMssv()
  }, [mssvFromUrl])

  // =========================================================================
  // Handlers
  // =========================================================================
  function handleResetFilters() {
    if (activeTab === 'daRut') {
      setSearchDaRut('')
      setTuNgayDaRut('')
      setDenNgayDaRut('')
      setCurrentPageDaRut(0)
    } else {
      setSearchLichSu('')
      setTuNgayLichSu('')
      setDenNgayLichSu('')
      setCurrentPageLichSu(0)
    }
  }

  function showToast(message: string, type: 'success' | 'error' | 'info' = 'info') {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  function openModalChiTiet(record: HoSoDaRutItem | LichSuRutItem) {
    setSelectedRecord(record)
    setModalChiTietOpen(true)
  }

  function openModalRut() {
    setRutForm({
      mssv: '',
      ngayRut: new Date().toISOString().split('T')[0],
      lyDo: '',
      ghiChu: '',
    })
    setSinhVienInfo(null)
    setMssvError('')
    setModalRutOpen(true)
  }

  const handleMssvChange = useCallback(async (value: string) => {
    setRutForm((prev) => ({ ...prev, mssv: value }))

    if (!value.trim()) {
      setSinhVienInfo(null)
      setMssvError('')
      return
    }

    setIsLookingUpSv(true)
    setMssvError('')
    try {
      const sv = await lookupApi.getSinhVien(value.trim())
      if (sv) {
        setSinhVienInfo({
          mssv: sv.mssv,
          hoTen: sv.hoTen,
          cccd: sv.cccd || '',
          sdt: sv.sdt || '',
          khoa: sv.khoa || '',
          lop: sv.lop || '',
        })
      } else {
        setSinhVienInfo(null)
        setMssvError('Không tìm thấy sinh viên với MSSV này.')
      }
    } catch {
      setSinhVienInfo(null)
      setMssvError('Lỗi tra cứu sinh viên. Vui lòng thử lại.')
    } finally {
      setIsLookingUpSv(false)
    }
  }, [])

  function openModalXacNhan() {
    if (!rutForm.mssv || !sinhVienInfo) {
      showToast('Vui lòng nhập MSSV hợp lệ', 'error')
      return
    }
    if (!rutForm.lyDo.trim()) {
      showToast('Vui lòng nhập lý do rút', 'error')
      return
    }
    setModalXacNhanOpen(true)
  }

  async function handleSubmitRut() {
    if (!sinhVienInfo) return

    setIsSubmitting(true)
    try {
      const res = await phieuMuonApi.create({
        mssv: rutForm.mssv,
        loaiPhieu: LOAI_PHIEU_RUT,
        ngayMuon: rutForm.ngayRut,
        lyDo: rutForm.lyDo,
        ghiChu: rutForm.ghiChu || undefined,
        danhSachMaHoSo: [],
      })

      if (res.success) {
        showToast('Tạo phiếu rút hồ sơ thành công. Mã phiếu: ' + (res.data?.maPhieu || ''), 'success')
        setModalXacNhanOpen(false)
        setModalRutOpen(false)
        setRutForm({
          mssv: '',
          ngayRut: new Date().toISOString().split('T')[0],
          lyDo: '',
          ghiChu: '',
        })
        setSinhVienInfo(null)
        setMssvError('')
        // Refresh both tabs
        fetchHoSoDaRut()
        fetchLichSu()
      } else {
        showToast(res.message || 'Tạo phiếu rút hồ sơ thất bại', 'error')
      }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } }
      showToast(e.response?.data?.message || 'Lỗi kết nối máy chủ', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Page numbers
  function getPageNumbers(total: number, current: number): (number | '...')[] {
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
    const pages: (number | '...')[] = []
    if (totalPages <= 7) {
      for (let i = 0; i < totalPages; i++) pages.push(i + 1)
    } else if (current + 1 <= 4) {
      for (let i = 0; i < 5; i++) pages.push(i + 1)
      pages.push('...')
      pages.push(totalPages)
    } else if (current + 1 >= totalPages - 3) {
      pages.push(1)
      pages.push('...')
      for (let i = totalPages - 5; i < totalPages; i++) pages.push(i + 1)
    } else {
      pages.push(1)
      pages.push('...')
      pages.push(current)
      pages.push(current + 1)
      pages.push(current + 2)
      pages.push('...')
      pages.push(totalPages)
    }
    return pages
  }

  const totalPagesDaRut = Math.max(1, Math.ceil(totalElementsDaRut / PAGE_SIZE))
  const totalPagesLichSu = Math.max(1, Math.ceil(totalElementsLichSu / PAGE_SIZE))

  function formatDate(dateStr: string) {
    if (!dateStr) return '—'
    try {
      const d = new Date(dateStr.includes('T') ? dateStr : dateStr + 'T00:00:00')
      return d.toLocaleDateString('vi-VN')
    } catch {
      return dateStr
    }
  }

  function getTrangThaiBadge(trangThai: string) {
    const info = TRANG_THAI_MAPPING[trangThai] || { label: trangThai, className: '' }
    return (
      <span className={`trang-rut-ho-so__badge ${info.className}`}>
        {info.label}
      </span>
    )
  }

  // =========================================================================
  // Render - Tab content
  // =========================================================================
  function renderTabDaRut() {
    return (
      <>
        <div className="trang-rut-ho-so__toolbar">
          <div className="trang-rut-ho-so__filters">
            <SearchInput
              value={searchDaRut}
              onChange={(v) => {
                setSearchDaRut(v)
                setCurrentPageDaRut(0)
              }}
              placeholder="Tìm theo MSSV / mã phiếu / họ tên..."
              className="trang-rut-ho-so__search"
            />
            <FormInput
              type="date"
              value={tuNgayDaRut}
              onChange={(e) => {
                setTuNgayDaRut(e.target.value)
                setCurrentPageDaRut(0)
              }}
              placeholder="Từ ngày"
            />
            <FormInput
              type="date"
              value={denNgayDaRut}
              onChange={(e) => {
                setDenNgayDaRut(e.target.value)
                setCurrentPageDaRut(0)
              }}
              placeholder="Đến ngày"
            />
            <Button variant="secondary" icon={<RotateCcw size={16} />} onClick={handleResetFilters}>
              Đặt lại
            </Button>
          </div>
          <Button variant="primary" icon={<Plus size={16} />} onClick={openModalRut}>
            Rút hồ sơ
          </Button>
        </div>

        <div className="trang-rut-ho-so__table-card">
          {isLoadingDaRut ? (
            <div className="trang-rut-ho-so__loading">
              <Loader2 className="trang-rut-ho-so__loading-icon" size={32} />
              <p>Đang tải dữ liệu từ máy chủ...</p>
            </div>
          ) : errorDaRut ? (
            <div className="trang-rut-ho-so__empty">
              <AlertCircle className="trang-rut-ho-so__empty-icon" size={48} color="#dc2626" />
              <p className="trang-rut-ho-so__empty-text">{errorDaRut}</p>
              <Button variant="secondary" onClick={fetchHoSoDaRut} style={{ marginTop: 12 }}>
                Thử lại
              </Button>
            </div>
          ) : hoSoDaRutList.length > 0 ? (
            <>
              <div className="trang-rut-ho-so__table-wrapper">
                <table className="trang-rut-ho-so__table">
                  <thead>
                    <tr>
                      <th className="col-stt">STT</th>
                      <th className="col-mssv">Mã phiếu</th>
                      <th className="col-mssv">MSSV</th>
                      <th>Họ và tên</th>
                      <th className="col-lop">Lớp</th>
                      <th className="col-date">Ngày rút</th>
                      <th className="col-cbpt">Người tạo</th>
                      <th className="col-trangthai">Trạng thái</th>
                      <th className="col-thaotac">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {hoSoDaRutList.map((item, index) => {
                      const sttNum = currentPageDaRut * PAGE_SIZE + index + 1
                      const badgeInfo = TRANG_THAI_MAPPING[item.trangThai] || {
                        label: item.trangThai,
                        className: '',
                      }
                      return (
                        <tr key={item.maPhieu}>
                          <td className="col-stt">{sttNum}</td>
                          <td className="col-mssv">{item.maPhieu}</td>
                          <td className="col-mssv">{item.mssv}</td>
                          <td>{item.hoTen || '-'}</td>
                          <td className="col-lop">{item.lop || '-'}</td>
                          <td className="col-date">{formatDate(item.ngayRut)}</td>
                          <td className="col-cbpt">{item.canBoPhuTrach || '-'}</td>
                          <td className="col-trangthai">
                            <span className={`trang-rut-ho-so__badge ${badgeInfo.className}`}>
                              {badgeInfo.label}
                            </span>
                          </td>
                          <td className="col-thaotac">
                            <Button
                              variant="ghost"
                              size="sm"
                              icon={<Eye size={16} />}
                              onClick={() => openModalChiTiet(item)}
                            >
                              Xem
                            </Button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {totalPagesDaRut > 1 && (
                <div className="trang-rut-ho-so__pagination">
                  <span className="trang-rut-ho-so__pagination-info">
                    Hiển thị {currentPageDaRut * PAGE_SIZE + 1} -{' '}
                    {Math.min((currentPageDaRut + 1) * PAGE_SIZE, totalElementsDaRut)} của{' '}
                    {totalElementsDaRut} kết quả
                  </span>
                  <div className="trang-rut-ho-so__pagination-controls">
                    <button
                      className="trang-rut-ho-so__page-btn"
                      onClick={() => setCurrentPageDaRut((p) => Math.max(0, p - 1))}
                      disabled={currentPageDaRut === 0}
                    >
                      <ChevronLeft size={16} />
                    </button>
                    {getPageNumbers(totalElementsDaRut, currentPageDaRut).map((page, index) =>
                      page === '...' ? (
                        <span key={`ellipsis-${index}`} className="trang-rut-ho-so__page-btn" style={{ cursor: 'default' }}>
                          ...
                        </span>
                      ) : (
                        <button
                          key={page}
                          className={`trang-rut-ho-so__page-btn ${
                            currentPageDaRut + 1 === page ? 'trang-rut-ho-so__page-btn--active' : ''
                          }`}
                          onClick={() => setCurrentPageDaRut(page - 1)}
                        >
                          {page}
                        </button>
                      )
                    )}
                    <button
                      className="trang-rut-ho-so__page-btn"
                      onClick={() => setCurrentPageDaRut((p) => Math.min(totalPagesDaRut - 1, p + 1))}
                      disabled={currentPageDaRut + 1 >= totalPagesDaRut}
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="trang-rut-ho-so__empty">
              <FileX className="trang-rut-ho-so__empty-icon" size={48} />
              <p className="trang-rut-ho-so__empty-text">
                Không có hồ sơ đã rút nào
                {searchDaRut || tuNgayDaRut || denNgayDaRut ? ' khớp với bộ lọc hiện tại' : ''}
                .
              </p>
            </div>
          )}
        </div>
      </>
    )
  }

  function renderTabLichSu() {
    return (
      <>
        <div className="trang-rut-ho-so__toolbar">
          <div className="trang-rut-ho-so__filters">
            <SearchInput
              value={searchLichSu}
              onChange={(v) => {
                setSearchLichSu(v)
                setCurrentPageLichSu(0)
              }}
              placeholder="Tìm theo MSSV / mã phiếu / họ tên / lý do..."
              className="trang-rut-ho-so__search"
            />
            <FormInput
              type="date"
              value={tuNgayLichSu}
              onChange={(e) => {
                setTuNgayLichSu(e.target.value)
                setCurrentPageLichSu(0)
              }}
              placeholder="Từ ngày"
            />
            <FormInput
              type="date"
              value={denNgayLichSu}
              onChange={(e) => {
                setDenNgayLichSu(e.target.value)
                setCurrentPageLichSu(0)
              }}
              placeholder="Đến ngày"
            />
            <Button variant="secondary" icon={<RotateCcw size={16} />} onClick={handleResetFilters}>
              Đặt lại
            </Button>
          </div>
        </div>

        <div className="trang-rut-ho-so__table-card">
          {isLoadingLichSu ? (
            <div className="trang-rut-ho-so__loading">
              <Loader2 className="trang-rut-ho-so__loading-icon" size={32} />
              <p>Đang tải dữ liệu từ máy chủ...</p>
            </div>
          ) : errorLichSu ? (
            <div className="trang-rut-ho-so__empty">
              <AlertCircle className="trang-rut-ho-so__empty-icon" size={48} color="#dc2626" />
              <p className="trang-rut-ho-so__empty-text">{errorLichSu}</p>
              <Button variant="secondary" onClick={fetchLichSu} style={{ marginTop: 12 }}>
                Thử lại
              </Button>
            </div>
          ) : lichSuList.length > 0 ? (
            <>
              <div className="trang-rut-ho-so__table-wrapper">
                <table className="trang-rut-ho-so__table">
                  <thead>
                    <tr>
                      <th className="col-stt">STT</th>
                      <th className="col-mssv">Mã phiếu</th>
                      <th className="col-mssv">MSSV</th>
                      <th>Họ và tên</th>
                      <th className="col-date">Ngày rút</th>
                      <th className="col-cbpt">Người tạo</th>
                      <th className="col-trangthai">Trạng thái</th>
                      <th className="col-thaotac">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lichSuList.map((item, index) => {
                      const sttNum = currentPageLichSu * PAGE_SIZE + index + 1
                      const badgeInfo = TRANG_THAI_MAPPING[item.trangThai] || {
                        label: item.trangThai,
                        className: '',
                      }
                      return (
                        <tr key={item.maPhieu}>
                          <td className="col-stt">{sttNum}</td>
                          <td className="col-mssv">{item.maPhieu}</td>
                          <td className="col-mssv">{item.mssv}</td>
                          <td>{item.hoTen || '-'}</td>
                          <td className="col-date">{formatDate(item.ngayRut)}</td>
                          <td className="col-cbpt">{item.canBoPhuTrach || '-'}</td>
                          <td className="col-trangthai">
                            <span className={`trang-rut-ho-so__badge ${badgeInfo.className}`}>
                              {badgeInfo.label}
                            </span>
                          </td>
                          <td className="col-thaotac">
                            <Button
                              variant="ghost"
                              size="sm"
                              icon={<Eye size={16} />}
                              onClick={() => openModalChiTiet(item)}
                            >
                              Xem
                            </Button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {totalPagesLichSu > 1 && (
                <div className="trang-rut-ho-so__pagination">
                  <span className="trang-rut-ho-so__pagination-info">
                    Hiển thị {currentPageLichSu * PAGE_SIZE + 1} -{' '}
                    {Math.min((currentPageLichSu + 1) * PAGE_SIZE, totalElementsLichSu)} của{' '}
                    {totalElementsLichSu} kết quả
                  </span>
                  <div className="trang-rut-ho-so__pagination-controls">
                    <button
                      className="trang-rut-ho-so__page-btn"
                      onClick={() => setCurrentPageLichSu((p) => Math.max(0, p - 1))}
                      disabled={currentPageLichSu === 0}
                    >
                      <ChevronLeft size={16} />
                    </button>
                    {getPageNumbers(totalElementsLichSu, currentPageLichSu).map((page, index) =>
                      page === '...' ? (
                        <span key={`ellipsis-${index}`} className="trang-rut-ho-so__page-btn" style={{ cursor: 'default' }}>
                          ...
                        </span>
                      ) : (
                        <button
                          key={page}
                          className={`trang-rut-ho-so__page-btn ${
                            currentPageLichSu + 1 === page ? 'trang-rut-ho-so__page-btn--active' : ''
                          }`}
                          onClick={() => setCurrentPageLichSu(page - 1)}
                        >
                          {page}
                        </button>
                      )
                    )}
                    <button
                      className="trang-rut-ho-so__page-btn"
                      onClick={() => setCurrentPageLichSu((p) => Math.min(totalPagesLichSu - 1, p + 1))}
                      disabled={currentPageLichSu + 1 >= totalPagesLichSu}
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="trang-rut-ho-so__empty">
              <FileX className="trang-rut-ho-so__empty-icon" size={48} />
              <p className="trang-rut-ho-so__empty-text">
                Không có lịch sử rút hồ sơ nào
                {searchLichSu || tuNgayLichSu || denNgayLichSu ? ' khớp với bộ lọc hiện tại' : ''}
                .
              </p>
            </div>
          )}
        </div>
      </>
    )
  }

  // =========================================================================
  // Render
  // =========================================================================
  return (
    <div className="trang-rut-ho-so">
      {/* Header */}
      <div className="trang-rut-ho-so__header">
        <h2 className="trang-rut-ho-so__title">Rút hồ sơ</h2>
        <p className="trang-rut-ho-so__subtitle">
          {activeTab === 'daRut'
            ? 'Quản lý danh sách sinh viên đã rút hồ sơ'
            : 'Theo dõi lịch sử thực hiện rút hồ sơ'}
        </p>
      </div>

      {/* Tabs */}
      <div className="trang-rut-ho-so__tabs">
        <button
          className={`trang-rut-ho-so__tab ${activeTab === 'daRut' ? 'trang-rut-ho-so__tab--active' : ''}`}
          onClick={() => {
            setActiveTab('daRut')
            setCurrentPageDaRut(0)
          }}
        >
          <FileX size={18} />
          Hồ sơ đã rút
        </button>
        <button
          className={`trang-rut-ho-so__tab ${activeTab === 'lichSu' ? 'trang-rut-ho-so__tab--active' : ''}`}
          onClick={() => {
            setActiveTab('lichSu')
            setCurrentPageLichSu(0)
          }}
        >
          <History size={18} />
          Lịch sử rút hồ sơ
        </button>
      </div>

      {/* Content */}
      <div className="trang-rut-ho-so__content">
        {activeTab === 'daRut' && renderTabDaRut()}
        {activeTab === 'lichSu' && renderTabLichSu()}
      </div>

      {/* Modal Rút hồ sơ */}
      <Modal
        isOpen={modalRutOpen}
        onClose={() => setModalRutOpen(false)}
        title="Rút hồ sơ"
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalRutOpen(false)}>
              Hủy
            </Button>
            <Button variant="primary" onClick={openModalXacNhan}>
              Xác nhận rút
            </Button>
          </>
        }
      >
        <div className="trang-rut-ho-so__modal-content">
          <div className="trang-rut-ho-so__form-section">
            <h3 className="trang-rut-ho-so__form-section-title">MSSV *</h3>
            <FormInput
              value={rutForm.mssv}
              onChange={(e) => handleMssvChange(e.target.value)}
              placeholder="Nhập MSSV (VD: B23DCCN001)"
            />
            {isLookingUpSv && (
              <div className="trang-rut-ho-so__info-row" style={{ marginTop: 6, color: '#6b7280' }}>
                <Loader2 size={14} className="trang-rut-ho-so__loading-icon" />
                <span>Đang tra cứu sinh viên...</span>
              </div>
            )}
            {mssvError && (
              <div className="trang-rut-ho-so__error-message">
                <AlertCircle size={14} />
                <span>{mssvError}</span>
              </div>
            )}
          </div>

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
                    <span className="trang-rut-ho-so__info-value">{sinhVienInfo.cccd || '—'}</span>
                  </div>
                  <div className="trang-rut-ho-so__info-item">
                    <span className="trang-rut-ho-so__info-label">Số điện thoại</span>
                    <span className="trang-rut-ho-so__info-value">{sinhVienInfo.sdt || '—'}</span>
                  </div>
                  <div className="trang-rut-ho-so__info-item">
                    <span className="trang-rut-ho-so__info-label">Khóa</span>
                    <span className="trang-rut-ho-so__info-value">{sinhVienInfo.khoa || '—'}</span>
                  </div>
                  <div className="trang-rut-ho-so__info-item">
                    <span className="trang-rut-ho-so__info-label">Lớp</span>
                    <span className="trang-rut-ho-so__info-value">{sinhVienInfo.lop || '—'}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="trang-rut-ho-so__form-section">
            <h3 className="trang-rut-ho-so__form-section-title">Thông tin rút hồ sơ</h3>
            <div className="trang-rut-ho-so__form-grid">
              <FormInput
                label="Ngày rút *"
                type="date"
                value={rutForm.ngayRut}
                onChange={(e) => setRutForm((prev) => ({ ...prev, ngayRut: e.target.value }))}
              />
              <div className="trang-rut-ho-so__form-full">
                <FormInput
                  label="Lý do rút hồ sơ *"
                  value={rutForm.lyDo}
                  onChange={(e) => setRutForm((prev) => ({ ...prev, lyDo: e.target.value }))}
                  placeholder="Nhập lý do rút hồ sơ (VD: Tốt nghiệp, Chuyển trường, Tự thôi học...)"
                />
              </div>
              <div className="trang-rut-ho-so__form-full">
                <FormInput
                  label="Ghi chú"
                  value={rutForm.ghiChu}
                  onChange={(e) => setRutForm((prev) => ({ ...prev, ghiChu: e.target.value }))}
                  placeholder="Nhập ghi chú (nếu có)"
                />
              </div>
            </div>
          </div>
        </div>
      </Modal>

      {/* Modal Chi tiết */}
      <Modal
        isOpen={modalChiTietOpen}
        onClose={() => setModalChiTietOpen(false)}
        title="Chi tiết rút hồ sơ"
        size="lg"
        footer={
          <Button variant="secondary" onClick={() => setModalChiTietOpen(false)}>
            Đóng
          </Button>
        }
      >
        {selectedRecord && (
          <div className="trang-rut-ho-so__modal-content">
            <div className="trang-rut-ho-so__form-section">
              <h3 className="trang-rut-ho-so__form-section-title">Thông tin sinh viên</h3>
              <div className="trang-rut-ho-so__info-card">
                <div className="trang-rut-ho-so__info-grid">
                  <div className="trang-rut-ho-so__info-item">
                    <span className="trang-rut-ho-so__info-label">MSSV</span>
                    <span className="trang-rut-ho-so__info-value">{selectedRecord.mssv}</span>
                  </div>
                  <div className="trang-rut-ho-so__info-item">
                    <span className="trang-rut-ho-so__info-label">Họ và tên</span>
                    <span className="trang-rut-ho-so__info-value">{selectedRecord.hoTen || '-'}</span>
                  </div>
                  <div className="trang-rut-ho-so__info-item">
                    <span className="trang-rut-ho-so__info-label">Ngày rút</span>
                    <span className="trang-rut-ho-so__info-value">{formatDate(selectedRecord.ngayRut)}</span>
                  </div>
                  <div className="trang-rut-ho-so__info-item">
                    <span className="trang-rut-ho-so__info-label">Người tạo</span>
                    <span className="trang-rut-ho-so__info-value">{selectedRecord.canBoPhuTrach || '-'}</span>
                  </div>
                  <div className="trang-rut-ho-so__info-item trang-rut-ho-so__info-item--full">
                    <span className="trang-rut-ho-so__info-label">Lý do</span>
                    <span className="trang-rut-ho-so__info-value">{selectedRecord.lyDo || '-'}</span>
                  </div>
                  <div className="trang-rut-ho-so__info-item trang-rut-ho-so__info-item--full">
                    <span className="trang-rut-ho-so__info-label">Ghi chú</span>
                    <span className="trang-rut-ho-so__info-value">{selectedRecord.ghiChu || '-'}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="trang-rut-ho-so__form-section">
              <h3 className="trang-rut-ho-so__form-section-title">Thông tin phiếu</h3>
              <div className="trang-rut-ho-so__info-card">
                <div className="trang-rut-ho-so__info-grid">
                  <div className="trang-rut-ho-so__info-item">
                    <span className="trang-rut-ho-so__info-label">Mã phiếu rút</span>
                    <span className="trang-rut-ho-so__info-value">{selectedRecord.maPhieu}</span>
                  </div>
                  <div className="trang-rut-ho-so__info-item">
                    <span className="trang-rut-ho-so__info-label">Trạng thái</span>
                    <span className="trang-rut-ho-so__info-value">
                      {getTrangThaiBadge(selectedRecord.trangThai)}
                    </span>
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
            <Button variant="secondary" onClick={() => setModalXacNhanOpen(false)} disabled={isSubmitting}>
              Hủy
            </Button>
            <Button
              variant="primary"
              onClick={handleSubmitRut}
              disabled={isSubmitting}
              icon={isSubmitting ? <Loader2 size={16} /> : undefined}
            >
              {isSubmitting ? 'Đang xử lý...' : 'Xác nhận'}
            </Button>
          </>
        }
      >
        {sinhVienInfo && (
          <div className="trang-rut-ho-so__xac-nhan-content">
            <p className="trang-rut-ho-so__xac-nhan-text">
              Bạn có chắc chắn muốn rút hồ sơ của sinh viên{' '}
              <strong>{sinhVienInfo.hoTen}</strong> ({sinhVienInfo.mssv})?
            </p>
            <div className="trang-rut-ho-so__xac-nhan-warning">
              <AlertCircle size={18} />
              <span>
                Hành động này sẽ tạo phiếu rút hồ sơ vĩnh viễn. Toàn bộ giấy tờ hiện có của
                sinh viên sẽ được rút. Sau khi duyệt, trạng thái học vụ sẽ chuyển thành "Đã rút hồ sơ".
              </span>
            </div>
            <div className="trang-rut-ho-so__xac-nhan-info">
              <div className="trang-rut-ho-so__xac-nhan-row">
                <span className="trang-rut-ho-so__xac-nhan-label">Ngày rút:</span>
                <span className="trang-rut-ho-so__xac-nhan-value">{formatDate(rutForm.ngayRut)}</span>
              </div>
              <div className="trang-rut-ho-so__xac-nhan-row">
                <span className="trang-rut-ho-so__xac-nhan-label">Lý do:</span>
                <span className="trang-rut-ho-so__xac-nhan-value">{rutForm.lyDo}</span>
              </div>
              {rutForm.ghiChu && (
                <div className="trang-rut-ho-so__xac-nhan-row">
                  <span className="trang-rut-ho-so__xac-nhan-label">Ghi chú:</span>
                  <span className="trang-rut-ho-so__xac-nhan-value">{rutForm.ghiChu}</span>
                </div>
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
