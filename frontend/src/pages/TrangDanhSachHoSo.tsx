import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Eye, FileUp, FileDown, FileX, Loader2, RotateCcw, CheckCircle2, AlertCircle } from 'lucide-react'
import { sinhVienApi, triggerDownload } from '../api/sinhVien'
import type { SinhVienSearchParams } from '../api/types'
import { CustomSelect, SearchInput, Button, Toast, Modal } from '../components/ui'
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
]

// Khóa: Chỉ số khóa (12, 13, 14, 15)
const KHOA_OPTIONS = [
  'Tất cả',
  'Khóa 12',
  'Khóa 13',
  'Khóa 14',
  'Khóa 15',
]

// Lớp hành chính
const LOP_OPTIONS = [
  'Tất cả',
  'K14CTXHB',
  'K13CTXHB',
  'K14L',
  'K15TCNH',
  'K14QTKD',
  'K15KTTT',
  'K13ANH',
]

// Mock data cho giao diện (sẽ thay bằng API thực tế)
// Cấu trúc phải match với interface SinhVien trong types.ts
const MOCK_SINH_VIEN = [
  {
    mssv: '2673240001',
    hoTen: 'Nguyễn Hoàng Anh',
    cccd: '001308034189',
    ngaySinh: '2008-07-22',
    nganh: 'Công nghệ thông tin',
    lop: 'K14CTXHB',
    khoa: 'Khóa 14',
    khoaNamHoc: '2026–2029',
    trangThaiHocVu: 'Đang_học',
  },
  {
    mssv: '2673240002',
    hoTen: 'Trần Minh Tuấn',
    cccd: '002308034190',
    ngaySinh: '2007-03-15',
    nganh: 'Quản trị kinh doanh',
    lop: 'K13CTXHB',
    khoa: 'Khóa 13',
    khoaNamHoc: '2025–2028',
    trangThaiHocVu: 'Đang_học',
  },
  {
    mssv: '2673240003',
    hoTen: 'Lê Thị Mai Lan',
    cccd: '003308034191',
    ngaySinh: '2008-11-08',
    nganh: 'Kế toán',
    lop: 'K14L',
    khoa: 'Khóa 14',
    khoaNamHoc: '2026–2029',
    trangThaiHocVu: 'Đang_học',
  },
  {
    mssv: '2673240004',
    hoTen: 'Phạm Đức Minh',
    cccd: '004308034192',
    ngaySinh: '2006-05-20',
    nganh: 'Tài chính - Ngân hàng',
    lop: 'K15TCNH',
    khoa: 'Khóa 12',
    khoaNamHoc: '2024–2027',
    trangThaiHocVu: 'Bảo_lưu',
  },
  {
    mssv: '2673240005',
    hoTen: 'Hoàng Văn Hùng',
    cccd: '005308034193',
    ngaySinh: '2008-09-12',
    nganh: 'Công nghệ thông tin',
    lop: 'K14QTKD',
    khoa: 'Khóa 14',
    khoaNamHoc: '2026–2029',
    trangThaiHocVu: 'Đang_học',
  },
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

  // Import modal state
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isImporting, setIsImporting] = useState(false)
  const [importResult, setImportResult] = useState<{
    successCount: number
    failureCount: number
    insertedCount: number
    updatedCount: number
    errors: Array<{ rowNumber: number; message: string }>
  } | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  // Fetch data from API (currently using mock data for UI development)
  const fetchData = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      // TODO: Replace with actual API call when backend is ready
      // Filter mock data based on current filters
      let filteredData = [...MOCK_SINH_VIEN]
      
      // Filter by search query (MSSV, Họ tên, CCCD)
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        filteredData = filteredData.filter(sv => 
          sv.mssv.toLowerCase().includes(query) ||
          sv.hoTen.toLowerCase().includes(query) ||
          sv.cccd.toLowerCase().includes(query)
        )
      }
      
      // Filter by ngành
      if (nganhFilter) {
        filteredData = filteredData.filter(sv => sv.nganh === nganhFilter)
      }
      
      // Filter by khóa (e.g., "Khóa 14")
      if (khoaFilter) {
        filteredData = filteredData.filter(sv => sv.khoa === khoaFilter)
      }
      
      // Filter by lớp
      if (lopFilter) {
        filteredData = filteredData.filter(sv => sv.lop === lopFilter)
      }
      
      // Filter by trạng thái học vụ (convert label to enum)
      if (trangThaiFilter) {
        const enumValue = TRANG_THAI_TO_ENUM[trangThaiFilter as TrangThaiHocVuType]
        filteredData = filteredData.filter(sv => sv.trangThaiHocVu === enumValue)
      }
      
      // Pagination
      const total = filteredData.length
      const totalPagesCalc = Math.ceil(total / pageSize)
      const startIndex = (currentPage - 1) * pageSize
      const paginatedData = filteredData.slice(startIndex, startIndex + pageSize)
      
      setSinhVienList(paginatedData)
      setTotalElements(total)
      setTotalPages(totalPagesCalc)
      
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

  // Lấy filter hiện tại dưới dạng params object (dùng cho cả export và import-result refresh)
  function getCurrentSearchParams(): SinhVienSearchParams {
    return {
      keyword: searchQuery || undefined,
      nganh: nganhFilter || undefined,
      khoa: khoaFilter || undefined,
      lop: lopFilter || undefined,
      trangThaiHocVu: trangThaiFilter ? TRANG_THAI_TO_ENUM[trangThaiFilter as TrangThaiHocVuType] : undefined,
      page: currentPage - 1,
      size: pageSize,
    }
  }

  function handleImportExcel() {
    setSelectedFile(null)
    setImportResult(null)
    setIsImportModalOpen(true)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function handleDownloadTemplate() {
    try {
      const blob = await sinhVienApi.downloadTemplate()
      triggerDownload(blob, 'mau-import-sinh-vien.xlsx')
      showToast('Đã tải file mẫu.', 'success')
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Không thể tải file mẫu.'
      showToast(msg, 'error')
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null
    setSelectedFile(f)
    setImportResult(null)
  }

  async function handleSubmitImport() {
    if (!selectedFile) {
      showToast('Vui lòng chọn file Excel trước.', 'error')
      return
    }
    setIsImporting(true)
    try {
      const res = await sinhVienApi.importExcel(selectedFile)
      if (res.success) {
        setImportResult(res.data)
        showToast(`Import xong: ${res.data.insertedCount} mới, ${res.data.updatedCount} cập nhật, ${res.data.failureCount} lỗi.`, res.data.failureCount > 0 ? 'info' : 'success')
        // Reload danh sách sau khi import thành công
        fetchData()
      } else {
        showToast(res.message || 'Import thất bại.', 'error')
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Đã xảy ra lỗi khi import.'
      showToast(msg, 'error')
    } finally {
      setIsImporting(false)
    }
  }

  function handleCloseImportModal() {
    setIsImportModalOpen(false)
    setSelectedFile(null)
    setImportResult(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function handleExportExcel() {
    try {
      const blob = await sinhVienApi.exportExcel(getCurrentSearchParams(), 'filtered')
      triggerDownload(blob, `danh-sach-sinh-vien-${Date.now()}.xlsx`)
      showToast('Đã xuất file Excel.', 'success')
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Không thể xuất file Excel.'
      showToast(msg, 'error')
    }
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
                  <th className="col-khoa-nam-hoc">Khóa năm học</th>
                  <th className="col-lop">Lớp</th>
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
                        <td className="col-stt col-nowrap">{pageStartIndex + index + 1}</td>
                        <td className="col-mssv col-nowrap">{sv.mssv}</td>
                        <td>{sv.hoTen}</td>
                        <td className="col-cccd col-nowrap">{sv.cccd || '-'}</td>
                        <td className="col-ngay-sinh col-nowrap">{sv.ngaySinh ? new Date(sv.ngaySinh).toLocaleDateString('vi-VN') : '-'}</td>
                        <td className="col-nganh">{sv.nganh || '-'}</td>
                        <td className="col-khoa col-nowrap">{sv.khoa || '-'}</td>
                        <td className="col-khoa-nam-hoc col-nowrap">{sv.khoaNamHoc || '-'}</td>
                        <td className="col-lop col-nowrap">{sv.lop || '-'}</td>
                        <td className="col-trang-thai col-nowrap">
                          <span className={`trang-danh-sach__badge ${badgeInfo.className}`}>
                            {badgeInfo.label}
                          </span>
                        </td>
                        <td className="col-thao-tac col-center">
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
                    <td colSpan={11}>
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

      {/* Modal Import Excel */}
      <Modal
        isOpen={isImportModalOpen}
        onClose={handleCloseImportModal}
        title="Import sinh viên từ Excel"
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={handleCloseImportModal} disabled={isImporting}>
              Đóng
            </Button>
            {!importResult && (
              <Button variant="primary" onClick={handleSubmitImport} disabled={!selectedFile || isImporting}>
                {isImporting ? 'Đang import...' : 'Import'}
              </Button>
            )}
          </>
        }
      >
        <div className="trang-danh-sach__import">
          <div className="trang-danh-sach__import-info">
            <p>
              Chọn file Excel (.xlsx) theo đúng định dạng mẫu. Hệ thống sẽ tự động <strong>cập nhật</strong> sinh viên có MSSV trùng hoặc <strong>thêm mới</strong> nếu chưa tồn tại.
            </p>
            <Button variant="ghost" size="sm" onClick={handleDownloadTemplate}>
              <FileDown size={16} /> Tải file mẫu
            </Button>
          </div>

          <div className="trang-danh-sach__import-upload">
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              disabled={isImporting}
            />
            {selectedFile && (
              <p className="trang-danh-sach__import-filename">
                <CheckCircle2 size={14} /> {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
              </p>
            )}
          </div>

          {importResult && (
            <div className="trang-danh-sach__import-result">
              <h4>Kết quả import</h4>
              <ul>
                <li><strong>Tổng thành công:</strong> {importResult.successCount}</li>
                <li><strong>Thêm mới:</strong> {importResult.insertedCount}</li>
                <li><strong>Cập nhật:</strong> {importResult.updatedCount}</li>
                <li><strong>Lỗi:</strong> {importResult.failureCount}</li>
              </ul>
              {importResult.errors.length > 0 && (
                <div className="trang-danh-sach__import-errors">
                  <h5>Chi tiết lỗi:</h5>
                  <ul>
                    {importResult.errors.slice(0, 20).map((e, i) => (
                      <li key={i}>
                        <AlertCircle size={14} /> Dòng {e.rowNumber}: {e.message}
                      </li>
                    ))}
                    {importResult.errors.length > 20 && (
                      <li>... và {importResult.errors.length - 20} lỗi khác</li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
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
