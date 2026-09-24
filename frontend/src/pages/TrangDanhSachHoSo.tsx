import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Eye, FileUp, FileDown, FileX } from 'lucide-react'
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

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)

  // Toast state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)

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
              {paginatedData.length > 0 ? (
                paginatedData.map((sv, index) => (
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
                ))
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

        {/* Pagination */}
        {filteredData.length > 0 && (
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
