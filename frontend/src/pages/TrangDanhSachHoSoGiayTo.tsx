import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ChevronLeft, ChevronRight, Eye, FileX, Loader2, AlertCircle,
  RotateCcw, X, Search as SearchIcon,
} from 'lucide-react'
import { hoSoGiayToApi } from '../api/hoSoGiayTo'
import { loaiGiayToApi } from '../api/hoSoGiayTo'
import { danhMucApi } from '../api/danhMuc'
import type {
  HoSoGiayToListItem, HoSoGiayToSearchParams,
  LoaiGiayTo, Nganh, KhoaHoc, Lop,
} from '../api/types'
import { CustomSelect, SearchInput, Button, Toast } from '../components/ui'
import './TrangDanhSachHoSoGiayTo.css'

// UI label (giống dấu cách) → DB ENUM literal (dấu gạch dưới)
const TRANG_THAI_HOC_VU_LABEL_TO_ENUM: Record<string, string> = {
  'Đang học': 'Đang_học',
  'Bảo lưu': 'Bảo_lưu',
  'Đình chỉ': 'Đình_chỉ',
  'Tốt nghiệp': 'Tốt_nghiệp',
  'Đã rút hồ sơ': 'Đã_rút_hồ_sơ',
}

const TRANG_THAI_HOC_VU_OPTIONS = [
  { value: '', label: 'Tất cả trạng thái' },
  { value: 'Đang học', label: 'Đang học' },
  { value: 'Bảo lưu', label: 'Bảo lưu' },
  { value: 'Đình chỉ', label: 'Đình chỉ' },
  { value: 'Tốt nghiệp', label: 'Tốt nghiệp' },
  { value: 'Đã rút hồ sơ', label: 'Đã rút hồ sơ' },
]

const TRANG_THAI_NOP_OPTIONS = [
  { value: '', label: 'Tất cả trạng thái nộp' },
  { value: 'Chưa nộp', label: 'Chưa nộp' },
  { value: 'Đã nộp', label: 'Đã nộp' },
  { value: 'Thiếu', label: 'Thiếu' },
  { value: 'Không hợp lệ', label: 'Không hợp lệ' },
]

const TRANG_THAI_NOP_BADGE: Record<string, { label: string; className: string }> = {
  'Chưa nộp': { label: 'Chưa nộp', className: 'badge--secondary' },
  'Đã nộp': { label: 'Đã nộp', className: 'badge--success' },
  'Thiếu': { label: 'Thiếu', className: 'badge--warning' },
  'Không hợp lệ': { label: 'Không hợp lệ', className: 'badge--danger' },
}

const PAGE_SIZE = 25
const PAGE_SIZE_OPTIONS = [
  { value: 25, label: '25 / trang' },
  { value: 50, label: '50 / trang' },
  { value: 100, label: '100 / trang' },
]

const ALL_LABEL = ''
const toOptionValue = (id: number | null | undefined): string =>
  id === null || id === undefined ? ALL_LABEL : String(id)
const parseOptionId = (value: string): number | undefined => {
  if (!value) return undefined
  const n = Number(value)
  return Number.isInteger(n) && n > 0 ? n : undefined
}

export function TrangDanhSachHoSoGiayTo() {
  const navigate = useNavigate()

  // Filter state
  const [searchQuery, setSearchQuery] = useState('')
  const [nganhFilter, setNganhFilter] = useState(ALL_LABEL)
  const [khoaHocFilter, setKhoaHocFilter] = useState(ALL_LABEL)
  const [lopFilter, setLopFilter] = useState(ALL_LABEL)
  const [loaiGiayToFilter, setLoaiGiayToFilter] = useState(ALL_LABEL)
  const [trangThaiNopFilter, setTrangThaiNopFilter] = useState(ALL_LABEL)
  const [trangThaiHocVuFilter, setTrangThaiHocVuFilter] = useState<keyof typeof TRANG_THAI_HOC_VU_LABEL_TO_ENUM | ''>('')

  // Danh mục (Ngành / Khóa / Lớp / Loại giấy tờ)
  const [nganhList, setNganhList] = useState<Nganh[]>([])
  const [khoaHocList, setKhoaHocList] = useState<KhoaHoc[]>([])
  const [lopList, setLopList] = useState<Lop[]>([])
  const [loaiGiayToList, setLoaiGiayToList] = useState<LoaiGiayTo[]>([])
  const [danhMucLoading, setDanhMucLoading] = useState(true)
  const [danhMucError, setDanhMucError] = useState<string | null>(null)

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(PAGE_SIZE)
  const [totalElements, setTotalElements] = useState(0)
  const [totalPages, setTotalPages] = useState(0)

  // Data
  const [hoSoList, setHoSoList] = useState<HoSoGiayToListItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)

  // ============================================================
  // TẢI DANH MỤC
  // ============================================================
  const fetchDanhMuc = useCallback(async () => {
    setDanhMucLoading(true)
    setDanhMucError(null)
    try {
      const [nganhRes, khoaHocRes, lopRes, loaiRes] = await Promise.all([
        danhMucApi.getNganh(),
        danhMucApi.getKhoaHoc(),
        danhMucApi.getLop(),
        loaiGiayToApi.getAll(),
      ])
      if (nganhRes.success) setNganhList(nganhRes.data || [])
      if (khoaHocRes.success) setKhoaHocList(khoaHocRes.data || [])
      if (lopRes.success) setLopList(lopRes.data || [])
      if (loaiRes.success) setLoaiGiayToList(loaiRes.data || [])
      const errs: string[] = []
      if (!nganhRes.success) errs.push('ngành')
      if (!khoaHocRes.success) errs.push('khóa học')
      if (!lopRes.success) errs.push('lớp')
      if (!loaiRes.success) errs.push('loại giấy tờ')
      if (errs.length > 0) {
        setDanhMucError(`Không tải được danh mục: ${errs.join(', ')}. Vui lòng thử lại.`)
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Không kết nối được máy chủ danh mục.'
      setDanhMucError(msg)
      setNganhList([])
      setKhoaHocList([])
      setLopList([])
      setLoaiGiayToList([])
    } finally {
      setDanhMucLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDanhMuc()
  }, [fetchDanhMuc])

  // ============================================================
  // TẢI DỮ LIỆU
  // ============================================================
  const fetchData = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    const nganhId = parseOptionId(nganhFilter)
    const khoaHocId = parseOptionId(khoaHocFilter)
    const lopId = parseOptionId(lopFilter)

    const params: HoSoGiayToSearchParams = {
      keyword: searchQuery || undefined,
      maLoai: loaiGiayToFilter || undefined,
      trangThaiNop: trangThaiNopFilter || undefined,
      nganhId,
      lopId,
      khoaHocId,
      trangThaiHocVu: trangThaiHocVuFilter
        ? TRANG_THAI_HOC_VU_LABEL_TO_ENUM[trangThaiHocVuFilter]
        : undefined,
      page: currentPage - 1,
      size: pageSize,
    }

    try {
      const response = await hoSoGiayToApi.searchList(params)
      if (response.success && response.data) {
        setHoSoList(response.data.data || [])
        setTotalElements(response.data.page?.totalElements || 0)
        setTotalPages(response.data.page?.totalPages || 0)
      } else {
        throw new Error(response.message || 'Không thể tải danh sách hồ sơ giấy tờ')
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Đã xảy ra lỗi khi tải dữ liệu'
      setError(errorMessage)
      setHoSoList([])
      setTotalElements(0)
      setTotalPages(0)
    } finally {
      setIsLoading(false)
    }
  }, [
    searchQuery, nganhFilter, khoaHocFilter, lopFilter,
    loaiGiayToFilter, trangThaiNopFilter, trangThaiHocVuFilter,
    currentPage, pageSize,
  ])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // ============================================================
  // HANDLERS
  // ============================================================
  function handleSearchChange(value: string) {
    setSearchQuery(value)
    setCurrentPage(1)
  }
  function handleNganhChange(value: string) {
    setNganhFilter(value)
    setKhoaHocFilter(ALL_LABEL)
    setLopFilter(ALL_LABEL)
    setCurrentPage(1)
  }
  function handleKhoaHocChange(value: string) {
    setKhoaHocFilter(value)
    setLopFilter(ALL_LABEL)
    setCurrentPage(1)
  }
  function handleLopChange(value: string) {
    setLopFilter(value)
    setCurrentPage(1)
  }
  function handleLoaiGiayToChange(value: string) {
    setLoaiGiayToFilter(value)
    setCurrentPage(1)
  }
  function handleTrangThaiNopChange(value: string) {
    setTrangThaiNopFilter(value)
    setCurrentPage(1)
  }
  function handleTrangThaiHocVuChange(value: string) {
    setTrangThaiHocVuFilter(value as keyof typeof TRANG_THAI_HOC_VU_LABEL_TO_ENUM | '')
    setCurrentPage(1)
  }
  function handleResetFilters() {
    setSearchQuery('')
    setNganhFilter(ALL_LABEL)
    setKhoaHocFilter(ALL_LABEL)
    setLopFilter(ALL_LABEL)
    setLoaiGiayToFilter(ALL_LABEL)
    setTrangThaiNopFilter(ALL_LABEL)
    setTrangThaiHocVuFilter('')
    setCurrentPage(1)
  }
  function handlePageSizeChange(newSize: number) {
    setPageSize(newSize)
    setCurrentPage(1)
  }
  function handleViewStudent(mssv: string) {
    navigate(`/danh-sach-ho-so/${mssv}`)
  }
  function showToast(message: string, type: 'success' | 'error' | 'info' = 'info') {
    setToast({ message, type })
  }

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

  // ============================================================
  // OPTIONS
  // ============================================================
  const nganhOptions = useMemo(
    () => [
      { value: ALL_LABEL, label: 'Tất cả ngành' },
      ...nganhList
        .filter((n) => n.dangSuDung !== false)
        .sort((a, b) => a.tenNganh.localeCompare(b.tenNganh))
        .map((n) => ({ value: String(n.id), label: n.tenNganh })),
    ],
    [nganhList]
  )
  const khoaHocOptions = useMemo(
    () => [
      { value: ALL_LABEL, label: 'Tất cả khóa' },
      ...khoaHocList
        .filter((k) => k.dangSuDung !== false)
        .sort((a, b) => (a.namBatDau ?? 0) - (b.namBatDau ?? 0))
        .map((k) => ({ value: String(k.id), label: k.tenKhoaHoc })),
    ],
    [khoaHocList]
  )
  const lopOptions = useMemo(
    () => [
      { value: ALL_LABEL, label: 'Tất cả lớp' },
      ...lopList
        .filter((l) => l.dangSuDung !== false)
        .sort((a, b) => a.tenLop.localeCompare(b.tenLop))
        .map((l) => ({ value: String(l.id), label: l.tenLop })),
    ],
    [lopList]
  )
  const loaiGiayToOptions = useMemo(
    () => [
      { value: ALL_LABEL, label: 'Tất cả loại' },
      ...loaiGiayToList
        .filter((l) => l.dangSuDung !== false)
        .sort((a, b) => a.maLoai.localeCompare(b.maLoai))
        .map((l) => ({ value: l.maLoai, label: `${l.maLoai} — ${l.tenGiayTo}` })),
    ],
    [loaiGiayToList]
  )

  function formatDate(iso: string | null | undefined): string {
    if (!iso) return '-'
    try {
      return new Date(iso).toLocaleDateString('vi-VN', {
        year: 'numeric', month: '2-digit', day: '2-digit',
      })
    } catch {
      return iso
    }
  }

  return (
    <div className="trang-danh-sach-giay-to">
      {/* Toolbar */}
      <div className="trang-danh-sach__toolbar">
        <div className="trang-danh-sach__filters">
          <SearchInput
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Tìm theo MSSV hoặc họ tên..."
            className="trang-danh-sach__search"
          />

          <div className="trang-danh-sach__select-wrapper trang-danh-sach__select-wrapper--nganh">
            <CustomSelect
              value={nganhFilter}
              options={nganhOptions}
              onChange={handleNganhChange}
              placeholder="Chọn ngành"
            />
          </div>

          <div className="trang-danh-sach__select-wrapper trang-danh-sach__select-wrapper--khoa">
            <CustomSelect
              value={khoaHocFilter}
              options={khoaHocOptions}
              onChange={handleKhoaHocChange}
              placeholder="Chọn khóa"
            />
          </div>

          <div className="trang-danh-sach__select-wrapper trang-danh-sach__select-wrapper--lop">
            <CustomSelect
              value={lopFilter}
              options={lopOptions}
              onChange={handleLopChange}
              placeholder="Chọn lớp"
            />
          </div>

          <div className="trang-danh-sach__select-wrapper trang-danh-sach__select-wrapper--loai-giay-to">
            <CustomSelect
              value={loaiGiayToFilter}
              options={loaiGiayToOptions}
              onChange={handleLoaiGiayToChange}
              placeholder="Chọn loại giấy tờ"
            />
          </div>

          <div className="trang-danh-sach__select-wrapper trang-danh-sach__select-wrapper--trang-thai-nop">
            <CustomSelect
              value={trangThaiNopFilter}
              options={TRANG_THAI_NOP_OPTIONS}
              onChange={handleTrangThaiNopChange}
              placeholder="Trạng thái nộp"
            />
          </div>

          <div className="trang-danh-sach__select-wrapper trang-danh-sach__select-wrapper--trang-thai-hoc-vu">
            <CustomSelect
              value={trangThaiHocVuFilter}
              options={TRANG_THAI_HOC_VU_OPTIONS}
              onChange={handleTrangThaiHocVuChange}
              placeholder="Trạng thái học vụ"
            />
          </div>
        </div>

        <div className="trang-danh-sach__actions">
          <Button variant="secondary" icon={<RotateCcw size={16} />} onClick={handleResetFilters}>
            Đặt lại
          </Button>
        </div>
      </div>

      {danhMucError && (
        <div className="trang-danh-sach__toolbar-banner" role="alert">
          <AlertCircle size={18} />
          <span>{danhMucError}</span>
          <Button variant="secondary" onClick={fetchDanhMuc}>Tải lại danh mục</Button>
        </div>
      )}

      {/* Table */}
      <div className="trang-danh-sach__table-card">
        {isLoading && (
          <div className="trang-danh-sach__loading">
            <Loader2 className="trang-danh-sach__loading-icon" size={32} />
            <p>Đang tải dữ liệu...</p>
          </div>
        )}

        {!isLoading && error && (
          <div className="trang-danh-sach__error">
            <p className="trang-danh-sach__error-text">{error}</p>
            <Button variant="secondary" onClick={fetchData}>Thử lại</Button>
          </div>
        )}

        {!isLoading && !error && (
          <div className="trang-danh-sach__table-wrapper">
            <table className="trang-danh-sach__table trang-danh-sach__table--hs">
              <thead>
                <tr>
                  <th className="col-stt">STT</th>
                  <th className="col-mssv">MSSV</th>
                  <th className="col-hoten">Họ và tên</th>
                  <th className="col-nganh">Ngành</th>
                  <th className="col-lop">Lớp</th>
                  <th className="col-khoa">Khóa</th>
                  <th className="col-loai-giay-to">Loại giấy tờ</th>
                  <th className="col-trang-thai-nop">Trạng thái nộp</th>
                  <th className="col-ban-goc">Bản gốc / sao</th>
                  <th className="col-vi-tri">Vị trí lưu kho</th>
                  <th className="col-ngay-tao">Ngày tạo</th>
                  <th className="col-thao-tac">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {hoSoList.length > 0 ? (
                  hoSoList.map((hs, index) => {
                    const pageStartIndex = (currentPage - 1) * pageSize
                    const badge = TRANG_THAI_NOP_BADGE[hs.trangThaiNop] || {
                      label: hs.trangThaiNop,
                      className: '',
                    }
                    return (
                      <tr key={hs.maHoSo}>
                        <td className="col-stt col-nowrap">{pageStartIndex + index + 1}</td>
                        <td className="col-mssv col-nowrap">{hs.mssv}</td>
                        <td>{hs.hoTen}</td>
                        <td className="col-nganh">{hs.tenNganh || '-'}</td>
                        <td className="col-lop col-nowrap">{hs.tenLop || '-'}</td>
                        <td className="col-khoa col-nowrap">{hs.tenKhoa || '-'}</td>
                        <td className="col-loai-giay-to">
                          <div className="hs-loai-cell">
                            <span className="hs-loai-cell__ma">{hs.maLoai}</span>
                            <span className="hs-loai-cell__ten">{hs.tenLoai}</span>
                          </div>
                        </td>
                        <td className="col-trang-thai-nop col-nowrap">
                          <span className={`trang-danh-sach__badge ${badge.className}`}>
                            {badge.label}
                          </span>
                        </td>
                        <td className="col-ban-goc col-nowrap">{hs.banGocBanSao || '-'}</td>
                        <td className="col-vi-tri">{hs.viTriLuuKho || '-'}</td>
                        <td className="col-ngay-tao col-nowrap">{formatDate(hs.ngayTao)}</td>
                        <td className="col-thao-tac col-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={<Eye size={16} />}
                            onClick={() => handleViewStudent(hs.mssv)}
                            title="Xem chi tiết sinh viên"
                          >
                            Xem SV
                          </Button>
                        </td>
                      </tr>
                    )
                  })
                ) : (
                  <tr>
                    <td colSpan={12}>
                      <div className="trang-danh-sach__empty">
                        <FileX className="trang-danh-sach__empty-icon" size={48} />
                        <p className="trang-danh-sach__empty-text">
                          Không tìm thấy hồ sơ giấy tờ nào
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {!isLoading && !error && totalElements > 0 && (
          <div className="trang-danh-sach__pagination">
            <span className="trang-danh-sach__pagination-info">
              Hiển thị {(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, totalElements)} của {totalElements} kết quả
            </span>
            <div className="trang-danh-sach__pagination-controls">
              <select
                className="trang-danh-sach__page-size-select"
                value={pageSize}
                onChange={(e) => handlePageSizeChange(Number(e.target.value))}
              >
                {PAGE_SIZE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
              <button
                className="trang-danh-sach__page-btn"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft size={16} />
              </button>
              {getPageNumbers().map((page, index) =>
                page === '...' ? (
                  <span key={`ellipsis-${index}`} className="trang-danh-sach__page-btn" style={{ cursor: 'default' }}>...</span>
                ) : (
                  <button
                    key={page}
                    className={`trang-danh-sach__page-btn ${currentPage === page ? 'trang-danh-sach__page-btn--active' : ''}`}
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </button>
                )
              )}
              <button
                className="trang-danh-sach__page-btn"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  )
}
