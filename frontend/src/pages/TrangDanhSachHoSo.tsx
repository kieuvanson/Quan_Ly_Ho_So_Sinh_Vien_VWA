import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Eye, FileUp, FileDown, RotateCw, AlertCircle, SearchX } from 'lucide-react'
import {
  mockSinhVienList,
  NGANH_OPTIONS,
  KHOA_OPTIONS,
  TRANG_THAI_HO_SO,
  type TrangThaiHoSo,
} from '../data/duLieuMauHoSo'
import { CustomSelect, SearchInput, Button, Toast } from '../components/ui'
import './TrangDanhSachHoSo.css'

const PAGE_SIZE = 10

export function TrangDanhSachHoSo() {
  const navigate = useNavigate()

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('')
  const [nganhFilter, setNganhFilter] = useState('')
  const [khoaFilter, setKhoaFilter] = useState('')
  const [trangThaiFilter, setTrangThaiFilter] = useState<TrangThaiHoSo | ''>('')

  // Loading and Error state
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)

  // Toast state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)

  // Check if any filter is active
  const hasActiveFilters = searchQuery !== '' || nganhFilter !== '' || khoaFilter !== '' || trangThaiFilter !== ''

  // Check if original data is empty (for empty state type)
  const hasNoData = mockSinhVienList.length === 0

  // Load students function (for API integration later)
  async function loadStudents() {
    try {
      setIsLoading(true)
      setError(null)
      // Future: Call API here
      // const response = await studentsApi.getList(...)
    } catch (err) {
      setError('Đã xảy ra lỗi khi kết nối đến hệ thống.')
    } finally {
      setIsLoading(false)
    }
  }

  // Reset all filters
  function handleResetFilters() {
    setSearchQuery('')
    setNganhFilter('')
    setKhoaFilter('')
    setTrangThaiFilter('')
    setCurrentPage(1)
  }

  // Retry loading data
  function handleRetry() {
    setError(null)
    loadStudents()
  }

  // Filter data
  const filteredData = useMemo(() => {
    return mockSinhVienList.filter((sv) => {
      // Search filter
      const query = searchQuery.toLowerCase().trim()
      const matchesSearch =
        query === '' ||
        sv.hoTen.toLowerCase().includes(query) ||
        sv.cccd.includes(query) ||
        sv.mssv.toLowerCase().includes(query)

      // Ngành filter
      const matchesNganh = nganhFilter === '' || sv.nganh === nganhFilter

      // Khóa filter
      const matchesKhoa = khoaFilter === '' || sv.khoa === khoaFilter

      // Trạng thái filter
      const matchesTrangThai = trangThaiFilter === '' || sv.trangThai === trangThaiFilter

      return matchesSearch && matchesNganh && matchesKhoa && matchesTrangThai
    })
  }, [searchQuery, nganhFilter, khoaFilter, trangThaiFilter])

  // Pagination
  const totalPages = Math.ceil(filteredData.length / PAGE_SIZE)
  const startIndex = (currentPage - 1) * PAGE_SIZE
  const endIndex = startIndex + PAGE_SIZE
  const paginatedData = filteredData.slice(startIndex, endIndex)

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

  function handleTrangThaiChange(value: string) {
    setTrangThaiFilter(value as TrangThaiHoSo | '')
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
  const trangThaiOptions = [
    { value: '', label: 'Tất cả trạng thái' },
    { value: 'DAYDU', label: 'Đầy đủ' },
    { value: 'THIEU', label: 'Thiếu hồ sơ' },
    { value: 'DANG_BO_SUNG', label: 'Đang bổ sung' },
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
          <Button
            variant="ghost"
            icon={<RotateCw size={16} />}
            onClick={handleResetFilters}
            disabled={!hasActiveFilters}
            className="trang-danh-sach__reset-btn"
          >
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
                {[...Array(7)].map((_, index) => (
                  <tr key={index} className="trang-danh-sach__skeleton-row">
                    <td className="col-stt"><div className="skeleton skeleton--sm" /></td>
                    <td className="col-mssv"><div className="skeleton skeleton--md" /></td>
                    <td><div className="skeleton skeleton--lg" /></td>
                    <td className="col-cccd"><div className="skeleton skeleton--md" /></td>
                    <td className="col-ngay-sinh"><div className="skeleton skeleton--sm" /></td>
                    <td className="col-nganh"><div className="skeleton skeleton--md" /></td>
                    <td className="col-khoa"><div className="skeleton skeleton--sm" /></td>
                    <td className="col-trang-thai"><div className="skeleton skeleton--badge" /></td>
                    <td className="col-thao-tac"><div className="skeleton skeleton--btn" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Error State */}
        {!isLoading && error && (
          <div className="trang-danh-sach__error-state">
            <AlertCircle className="trang-danh-sach__error-icon" size={48} />
            <p className="trang-danh-sach__error-title">Không thể tải danh sách hồ sơ</p>
            <p className="trang-danh-sach__error-message">{error}</p>
            <Button variant="primary" onClick={handleRetry} className="trang-danh-sach__retry-btn">
              Thử lại
            </Button>
          </div>
        )}

        {/* No Data State */}
        {!isLoading && !error && hasNoData && (
          <div className="trang-danh-sach__empty-state">
            <FileDown className="trang-danh-sach__empty-icon" size={48} />
            <p className="trang-danh-sach__empty-title">Chưa có hồ sơ sinh viên</p>
            <p className="trang-danh-sach__empty-message">Hiện chưa có dữ liệu hồ sơ sinh viên.</p>
          </div>
        )}

        {/* No Results State (has data but filtered results are empty) */}
        {!isLoading && !error && !hasNoData && filteredData.length === 0 && (
          <div className="trang-danh-sach__empty-state">
            <SearchX className="trang-danh-sach__empty-icon" size={48} />
            <p className="trang-danh-sach__empty-title">Không tìm thấy hồ sơ phù hợp</p>
            <p className="trang-danh-sach__empty-message">Không có hồ sơ nào phù hợp với từ khóa hoặc bộ lọc hiện tại.</p>
            {hasActiveFilters && (
              <Button
                variant="secondary"
                icon={<RotateCw size={16} />}
                onClick={handleResetFilters}
                className="trang-danh-sach__reset-filter-btn"
              >
                Đặt lại bộ lọc
              </Button>
            )}
          </div>
        )}

        {/* Data Table */}
        {!isLoading && !error && filteredData.length > 0 && (
          <>
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
                  {paginatedData.map((sv, index) => (
                    <tr key={sv.mssv}>
                      <td className="col-stt">{startIndex + index + 1}</td>
                      <td className="col-mssv">{sv.mssv}</td>
                      <td>{sv.hoTen}</td>
                      <td className="col-cccd">{sv.cccd}</td>
                      <td className="col-ngay-sinh">{sv.ngaySinh}</td>
                      <td className="col-nganh">{sv.nganh}</td>
                      <td className="col-khoa">{sv.khoa}</td>
                      <td className="col-trang-thai">
                        <span className={`trang-danh-sach__badge ${TRANG_THAI_HO_SO[sv.trangThai].className}`}>
                          {TRANG_THAI_HO_SO[sv.trangThai].label}
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
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="trang-danh-sach__pagination">
              <span className="trang-danh-sach__pagination-info">
                Hiển thị {startIndex + 1} - {Math.min(endIndex, filteredData.length)} của {filteredData.length} kết quả
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
          </>
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
