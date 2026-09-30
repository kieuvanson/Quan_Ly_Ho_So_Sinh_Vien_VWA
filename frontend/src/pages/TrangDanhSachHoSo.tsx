import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Eye, FileUp, FileDown, FileX, Loader2, RotateCcw } from 'lucide-react'
import { sinhVienApi } from '../api/sinhVien'
import { CustomSelect, SearchInput, Button, Toast } from '../components/ui'
import './TrangDanhSachHoSo.css'

const PAGE_SIZE = 10

// Mapping trạng thái từ UI (label) -> Backend enum constant
// Backend enum: Đang_học, Bảo_lưu, Đình_chỉ, Tốt_nghiệp, Đã_rút_hồ_sơ
// UI label: "Đang học", "Bảo lưu", "Đình chỉ", "Tốt nghiệp", "Đã rút hồ sơ"

type TrangThaiHocVuType = 'Đang học' | 'Bảo lưu' | 'Đình chỉ' | 'Tốt nghiệp' | 'Đã rút hồ sơ'

// Mapping UI label -> Backend enum constant
const TRANG_THAI_TO_ENUM: Record<TrangThaiHocVuType, string> = {
  'Đang học': 'Đang_học',
  'Bảo lưu': 'Bảo_lưu',
  'Đình chỉ': 'Đình_chỉ',
  'Tốt nghiệp': 'Tốt_nghiệp',
  'Đã rút hồ sơ': 'Đã_rút_hồ_sơ',
}

const TRANG_THAI_MAPPING: Record<string, { label: string; className: string }> = {
  'Đang_học': { label: 'Đang học', className: 'badge--success' },
  'Bảo_lưu': { label: 'Bảo lưu', className: 'badge--warning' },
  'Đình_chỉ': { label: 'Đình chỉ', className: 'badge--danger' },
  'Tốt_nghiệp': { label: 'Tốt nghiệp', className: 'badge--primary' },
  'Đã_rút_hồ_sơ': { label: 'Đã rút hồ sơ', className: 'badge--secondary' },
}

const NGANH_OPTIONS = [
  'Tất cả',
  'Công nghệ thông tin',
  'Quản trị kinh doanh',
  'Kế toán',
  'Ngôn ngữ Anh',
  'Luật',
  'Tài chính - Ngân hàng',
  'Quan hệ quốc tế',
]

const KHOA_OPTIONS = [
  'Tất cả',
  'K2022',
  'K2021',
  'K2020',
  'K2019',
  'K2018',
]

const LOP_OPTIONS = [
  'Tất cả',
  'CNTT-2022.1',
  'CNTT-2022.2',
  'CNTT-2022.3',
  'QTKD-2022.1',
  'QTKD-2022.2',
  'KTTN-2022.1',
  'NNA-2022.1',
  'L-2022.1',
  'TCNH-2022.1',
  'QHQT-2022.1',
]

export function TrangDanhSachHoSo() {
  const navigate = useNavigate()

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('')
  const [nganhFilter, setNganhFilter] = useState('')
  const [khoaFilter, setKhoaFilter] = useState('')
  const [lopFilter, setLopFilter] = useState('')
  const [trangThaiFilter, setTrangThaiFilter] = useState<TrangThaiHocVuType | ''>('')

  // Pagination state (UI uses 1-based, API uses 0-based)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(PAGE_SIZE)
  const [totalElements, setTotalElements] = useState(0)
  const [totalPages, setTotalPages] = useState(0)

  // Data state
  const [sinhVienList, setSinhVienList] = useState<any[]>([])
  
  // Loading and error state
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Toast state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)

  // Fetch data from API
  const fetchData = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await sinhVienApi.getAll({
        keyword: searchQuery || undefined,
        nganh: nganhFilter || undefined,
        khoa: khoaFilter || undefined,
        lop: lopFilter || undefined,
        // Convert UI label -> Backend enum constant
        trangThaiHocVu: trangThaiFilter ? TRANG_THAI_TO_ENUM[trangThaiFilter as TrangThaiHocVuType] : undefined,
        page: currentPage - 1, // Convert 1-based to 0-based
        size: pageSize,
      })
      
      if (response.success && response.data) {
        setSinhVienList(response.data.data || [])
        setTotalElements(response.data.page?.totalElements || 0)
        setTotalPages(response.data.page?.totalPages || 0)
      } else {
        setError(response.message || 'Không thể tải dữ liệu')
        setSinhVienList([])
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Đã xảy ra lỗi khi tải dữ liệu'
      setError(errorMessage)
      setSinhVienList([])
    } finally {
      setIsLoading(false)
    }
  }, [searchQuery, nganhFilter, khoaFilter, lopFilter, trangThaiFilter, currentPage, pageSize])

  // Fetch data when filters or page change
  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Reset page when filters change
  function handleSearchChange(value: string) {
    setSearchQuery(value)
    setCurrentPage(1)
  }

  function handleNganhChange(value: string) {
    setNganhFilter(value)
    setCurrentPage(1)
  }

  function handleKhoaChange(value: string) {
    setKhoaFilter(value)
    setCurrentPage(1)
  }

  function handleLopChange(value: string) {
    setLopFilter(value)
    setCurrentPage(1)
  }

  function handleTrangThaiChange(value: string) {
    setTrangThaiFilter(value as TrangThaiHocVuType | '')
    setCurrentPage(1)
  }

  function handleResetFilters() {
    setSearchQuery('')
    setNganhFilter('')
    setKhoaFilter('')
    setLopFilter('')
    setTrangThaiFilter('')
    setCurrentPage(1)
  }

  function handleViewStudent(mssv: string) {
    navigate(`/danh-sach-ho-so/${mssv}`)
  }

  function showToast(message: string, type: 'success' | 'error' | 'info' = 'info') {
    setToast({ message, type })
  }

  function handleImportExcel() {
    showToast('Chức năng đang được phát triển.', 'info')
  }

  function handleExportExcel() {
    showToast('Chức năng đang được phát triển.', 'info')
  }

  // Generate page numbers
  function getPageNumbers() {
    const pages: (number | '...')[] = []
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      if (currentPage <= 4) {
        for (let i = 1; i <= 5; i++) {
          pages.push(i)
        }
        pages.push('...')
        pages.push(totalPages)
      } else if (currentPage >= totalPages - 3) {
        pages.push(1)
        pages.push('...')
        for (let i = totalPages - 4; i <= totalPages; i++) {
          pages.push(i)
        }
      } else {
        pages.push(1)
        pages.push('...')
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i)
        }
        pages.push('...')
        pages.push(totalPages)
      }
    }
    return pages
  }

  // Custom Select options
  const nganhOptions = NGANH_OPTIONS.map((nganh) => ({
    value: nganh === 'Tất cả' ? '' : nganh,
    label: nganh,
  }))
  const khoaOptions = KHOA_OPTIONS.map((khoa) => ({
    value: khoa === 'Tất cả' ? '' : khoa,
    label: khoa,
  }))
  const lopOptions = LOP_OPTIONS.map((lop) => ({
    value: lop === 'Tất cả' ? '' : lop,
    label: lop,
  }))
  const trangThaiOptions = [
    { value: '', label: 'Tất cả trạng thái' },
    { value: 'Đang học', label: 'Đang học' },
    { value: 'Bảo lưu', label: 'Bảo lưu' },
    { value: 'Đình chỉ', label: 'Đình chỉ' },
    { value: 'Tốt nghiệp', label: 'Tốt nghiệp' },
    { value: 'Đã rút hồ sơ', label: 'Đã rút hồ sơ' },
  ]

  return (
    <div className="trang-danh-sach">
      {/* Header */}
      <div className="trang-danh-sach__header">
        <h2 className="trang-danh-sach__title">Danh sách hồ sơ sinh viên</h2>
        <p className="trang-danh-sach__subtitle">Quản lý và tra cứu hồ sơ sinh viên</p>
      </div>

      {/* Toolbar */}
      <div className="trang-danh-sach__toolbar">
        {/* Search and Filters */}
        <div className="trang-danh-sach__filters">
          <SearchInput
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Tìm theo họ tên, CCCD hoặc MSSV..."
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
              value={khoaFilter}
              options={khoaOptions}
              onChange={handleKhoaChange}
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

          <div className="trang-danh-sach__select-wrapper trang-danh-sach__select-wrapper--trang-thai">
            <CustomSelect
              value={trangThaiFilter}
              options={trangThaiOptions}
              onChange={handleTrangThaiChange}
              placeholder="Tất cả trạng thái"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="trang-danh-sach__actions">
          <Button variant="secondary" icon={<RotateCcw size={16} />} onClick={handleResetFilters}>
            Đặt lại
          </Button>
          <Button variant="secondary" icon={<FileUp size={16} />} onClick={handleImportExcel}>
            Import
          </Button>
          <Button variant="secondary" icon={<FileDown size={16} />} onClick={handleExportExcel}>
            Export
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="trang-danh-sach__table-card">
        {/* Loading State */}
        {isLoading && (
          <div className="trang-danh-sach__loading">
            <Loader2 className="trang-danh-sach__loading-icon" size={32} />
            <p>Đang tải dữ liệu...</p>
          </div>
        )}

        {/* Error State */}
        {!isLoading && error && (
          <div className="trang-danh-sach__error">
            <p className="trang-danh-sach__error-text">{error}</p>
            <Button variant="secondary" onClick={fetchData}>
              Thử lại
            </Button>
          </div>
        )}

        {/* Table Content */}
        {!isLoading && !error && (
          <div className="trang-danh-sach__table-wrapper">
            <table className="trang-danh-sach__table">
              <thead>
                <tr>
                  <th className="col-stt">STT</th>
                  <th className="col-mssv">MSSV</th>
                  <th>Họ và tên</th>
                  <th className="col-cccd">CCCD</th>
                  <th className="col-ngay-sinh">Ngày sinh</th>
                  <th className="col-nganh">Ngành</th>
                  <th className="col-khoa">Khóa</th>
                  <th className="col-trang-thai">Trạng thái</th>
                  <th className="col-thao-tac">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {sinhVienList.length > 0 ? (
                  sinhVienList.map((sv, index) => {
                    const pageStartIndex = (currentPage - 1) * pageSize
                    const badgeInfo = TRANG_THAI_MAPPING[sv.trangThaiHocVu] || { label: sv.trangThaiHocVu, className: '' }
                    return (
                      <tr key={sv.mssv}>
                        <td className="col-stt">{pageStartIndex + index + 1}</td>
                        <td className="col-mssv">{sv.mssv}</td>
                        <td>{sv.hoTen}</td>
                        <td className="col-cccd">{sv.cccd || '-'}</td>
                        <td className="col-ngay-sinh">{sv.ngaySinh ? new Date(sv.ngaySinh).toLocaleDateString('vi-VN') : '-'}</td>
                        <td className="col-nganh">{sv.nganh || '-'}</td>
                        <td className="col-khoa">{sv.khoa || '-'}</td>
                        <td className="col-trang-thai">
                          <span className={`trang-danh-sach__badge ${badgeInfo.className}`}>
                            {badgeInfo.label}
                          </span>
                        </td>
                        <td className="col-thao-tac">
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={<Eye size={16} />}
                            onClick={() => handleViewStudent(sv.mssv)}
                            title="Xem chi tiết"
                          >
                            Xem
                          </Button>
                        </td>
                      </tr>
                    )
                  })
                ) : (
                  <tr>
                    <td colSpan={9}>
                      <div className="trang-danh-sach__empty">
                        <FileX className="trang-danh-sach__empty-icon" size={48} />
                        <p className="trang-danh-sach__empty-text">Không tìm thấy sinh viên nào</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!isLoading && !error && totalElements > 0 && (
          <div className="trang-danh-sach__pagination">
            <span className="trang-danh-sach__pagination-info">
              Hiển thị {(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, totalElements)} của {totalElements} kết quả
            </span>
            <div className="trang-danh-sach__pagination-controls">
              <button
                className="trang-danh-sach__page-btn"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft size={16} />
              </button>
              {getPageNumbers().map((page, index) =>
                page === '...' ? (
                  <span key={`ellipsis-${index}`} className="trang-danh-sach__page-btn" style={{ cursor: 'default' }}>
                    ...
                  </span>
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
