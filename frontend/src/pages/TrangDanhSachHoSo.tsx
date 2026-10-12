import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ChevronLeft, ChevronRight, Eye, FileUp, FileDown, FileX,
  Loader2, RotateCcw, CheckCircle2, AlertCircle, X, CheckCheck,
} from 'lucide-react'
import { sinhVienApi, triggerDownload } from '../api/sinhVien'
import type { SinhVienSearchParams } from '../api/types'
import type { ImportPreviewResult, ImportRowPreview } from '../api/sinhVien'
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

  // Import 2-step: preview
  const [previewStep, setPreviewStep] = useState<'upload' | 'preview' | 'confirm'>('upload')
  const [isPreviewing, setIsPreviewing] = useState(false)
  const [previewResult, setPreviewResult] = useState<ImportPreviewResult | null>(null)
  const [previewError, setPreviewError] = useState<string | null>(null)

  // Import confirm result
  const [importResult, setImportResult] = useState<{
    successCount: number
    failureCount: number
    insertedCount: number
    updatedCount: number
    errors: Array<{ rowNumber: number; message: string }>
  } | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  // Fetch data from API
  const fetchData = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      // Build search params for API
      const searchParams: SinhVienSearchParams = {
        keyword: searchQuery || undefined,
        nganh: nganhFilter || undefined,
        khoa: khoaFilter || undefined,
        lop: lopFilter || undefined,
        trangThaiHocVu: trangThaiFilter ? TRANG_THAI_TO_ENUM[trangThaiFilter as TrangThaiHocVuType] : undefined,
        page: currentPage - 1, // API uses 0-based pagination
        size: pageSize,
      }

      // Call API to fetch student list
      const response = await sinhVienApi.getAll(searchParams)
      
      if (response.success && response.data) {
        setSinhVienList(response.data.data || [])
        setTotalElements(response.data.page?.totalElements || 0)
        setTotalPages(response.data.page?.totalPages || 0)
      } else {
        throw new Error(response.message || 'Không thể tải danh sách sinh viên')
      }
      
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Đã xảy ra lỗi khi tải dữ liệu'
      setError(errorMessage)
      setSinhVienList([])
      setTotalElements(0)
      setTotalPages(0)
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
    setPreviewResult(null)
    setPreviewError(null)
    setPreviewStep('upload')
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
    setPreviewResult(null)
    setPreviewError(null)
    // Nếu đã ở bước confirm → quay về upload
    if (previewStep !== 'upload') {
      setPreviewStep('upload')
    }
  }

  /** Bước 1: Preview — gọi API kiểm tra file */
  async function handlePreviewFile() {
    if (!selectedFile) {
      showToast('Vui lòng chọn file Excel trước.', 'error')
      return
    }
    setIsPreviewing(true)
    setPreviewError(null)
    try {
      const res = await sinhVienApi.previewImport(selectedFile)
      if (res.success) {
        setPreviewResult(res.data)
        setPreviewStep('preview')
      } else {
        setPreviewError(res.message || 'Kiểm tra file thất bại.')
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Đã xảy ra lỗi khi kiểm tra file.'
      setPreviewError(msg)
    } finally {
      setIsPreviewing(false)
    }
  }

  /** Bước 2: Confirm — gọi API xác nhận import */
  async function handleConfirmImport() {
    if (!previewResult) return
    // Lấy danh sách MSSV hợp lệ từ preview
    const validMssvList = previewResult.rows
      .filter((r) => r.status === 'VALID')
      .map((r) => r.mssv)
      .filter((mssv): mssv is string => mssv !== null)

    if (validMssvList.length === 0) {
      showToast('Không có sinh viên hợp lệ nào để import.', 'error')
      return
    }

    setIsImporting(true)
    try {
      const res = await sinhVienApi.confirmImport(validMssvList)
      if (res.success) {
        setImportResult(res.data)
        setPreviewStep('confirm')
        showToast(
          `Import thành công: ${res.data.insertedCount} sinh viên.`,
          'success'
        )
        // Reload danh sách
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
    setPreviewResult(null)
    setPreviewError(null)
    setPreviewStep('upload')
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

      {/* Modal Import Excel — 2 bước: Upload → Preview → Confirm → Kết quả */}
      <Modal
        isOpen={isImportModalOpen}
        onClose={handleCloseImportModal}
        title="Import sinh viên từ Excel"
        size="lg"
        footer={
          <>
            {previewStep === 'upload' && (
              <>
                <Button variant="secondary" onClick={handleCloseImportModal}>
                  Đóng
                </Button>
                <Button
                  variant="primary"
                  onClick={handlePreviewFile}
                  disabled={!selectedFile || isPreviewing}
                  icon={isPreviewing ? <Loader2 size={16} /> : <FileUp size={16} />}
                >
                  {isPreviewing ? 'Đang kiểm tra...' : 'Kiểm tra file'}
                </Button>
              </>
            )}
            {previewStep === 'preview' && (
              <>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setPreviewStep('upload')
                    setPreviewResult(null)
                  }}
                  disabled={isImporting}
                >
                  Chọn file khác
                </Button>
                <Button
                  variant="primary"
                  onClick={handleConfirmImport}
                  disabled={
                    isImporting ||
                    !previewResult ||
                    previewResult.validRows === 0
                  }
                  icon={isImporting ? <Loader2 size={16} /> : <CheckCheck size={16} />}
                >
                  {isImporting ? 'Đang import...' : `Xác nhận import (${previewResult?.validRows ?? 0})`}
                </Button>
              </>
            )}
            {previewStep === 'confirm' && (
              <Button variant="secondary" onClick={handleCloseImportModal}>
                Đóng
              </Button>
            )}
          </>
        }
      >
        {/* ===== BƯỚC 1: UPLOAD ===== */}
        {previewStep === 'upload' && (
          <div className="trang-danh-sach__import">
            <div className="trang-danh-sach__import-info">
              <p>
                <strong>Bước 1:</strong> Chọn file Excel (.xlsx) theo đúng định dạng mẫu.
                Hệ thống sẽ kiểm tra dữ liệu trước khi ghi vào database.
                Chỉ thêm mới sinh viên — <strong>không ghi đè</strong> dữ liệu cũ.
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
                disabled={isPreviewing}
              />
              {selectedFile && (
                <p className="trang-danh-sach__import-filename">
                  <CheckCircle2 size={14} /> {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                </p>
              )}
            </div>

            {previewError && (
              <div className="trang-danh-sach__import-error">
                <AlertCircle size={16} />
                <span>{previewError}</span>
              </div>
            )}
          </div>
        )}

        {/* ===== BƯỚC 2: PREVIEW ===== */}
        {previewStep === 'preview' && previewResult && (
          <div className="trang-danh-sach__import-preview">
            {/* Thống kê */}
            <div className="trang-danh-sach__import-preview-stats">
              <div className="stat-item stat-item--success">
                <CheckCircle2 size={20} />
                <div>
                  <span className="stat-value">{previewResult.validRows}</span>
                  <span className="stat-label">Sẽ thêm mới</span>
                </div>
              </div>
              <div className="stat-item stat-item--warning">
                <AlertCircle size={20} />
                <div>
                  <span className="stat-value">{previewResult.invalidRows}</span>
                  <span className="stat-label">Bị lỗi / trùng</span>
                </div>
              </div>
              <div className="stat-item stat-item--info">
                <FileX size={20} />
                <div>
                  <span className="stat-value">{previewResult.totalRows}</span>
                  <span className="stat-label">Tổng dòng</span>
                </div>
              </div>
            </div>

            {/* Bảng preview */}
            <div className="trang-danh-sach__import-preview-table-wrapper">
              <table className="trang-danh-sach__import-preview-table">
                <thead>
                  <tr>
                    <th>Dòng</th>
                    <th>MSSV</th>
                    <th>Họ tên</th>
                    <th>Trạng thái</th>
                    <th>Thông tin</th>
                  </tr>
                </thead>
                <tbody>
                  {previewResult.rows.map((row, idx) => (
                    <tr
                      key={idx}
                      className={
                        row.status === 'VALID'
                          ? 'row--valid'
                          : row.status === 'DUPLICATE' || row.status === 'DUPLICATE_IN_FILE'
                          ? 'row--duplicate'
                          : 'row--invalid'
                      }
                    >
                      <td className="col-center">{row.excelRow}</td>
                      <td>{row.mssv ?? '—'}</td>
                      <td>{row.hoTen ?? '—'}</td>
                      <td>
                        {row.status === 'VALID' && (
                          <span className="badge badge--success">Hợp lệ</span>
                        )}
                        {row.status === 'DUPLICATE' && (
                          <span className="badge badge--warning">Trùng DB</span>
                        )}
                        {row.status === 'DUPLICATE_IN_FILE' && (
                          <span className="badge badge--warning">Trùng file</span>
                        )}
                        {row.status === 'INVALID' && (
                          <span className="badge badge--danger">Lỗi</span>
                        )}
                      </td>
                      <td className="col-error">
                        {row.errors.length > 0 && (
                          <span className="error-text" title={row.errors.join('; ')}>
                            {row.errors[0]}
                          </span>
                        )}
                        {row.status === 'VALID' && row.danhMuc && (
                          <span className="info-text">
                            Khoa: <strong>{row.danhMuc.khoaTen ?? '—'}</strong>
                            {row.danhMuc.nganhTen ? ` | Ngành: ${row.danhMuc.nganhTen}` : ''}
                            {row.danhMuc.lopTen ? ` | Lớp: ${row.danhMuc.lopTen}` : ''}
                            {row.danhMuc.khoaHocTen ? ` | Khóa: ${row.danhMuc.khoaHocTen}` : ''}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {previewResult.validRows > 0 && (
              <p className="trang-danh-sach__import-preview-note">
                <CheckCircle2 size={14} />
                Nhấn <strong>"Xác nhận import"</strong> để thêm {previewResult.validRows} sinh viên mới.
                Dữ liệu cũ không bị ảnh hưởng.
              </p>
            )}
            {previewResult.validRows === 0 && (
              <p className="trang-danh-sach__import-preview-note trang-danh-sach__import-preview-note--error">
                <AlertCircle size={14} />
                Không có sinh viên hợp lệ nào để import. Vui lòng kiểm tra lại file Excel.
              </p>
            )}
          </div>
        )}

        {/* ===== BƯỚC 3: KẾT QUẢ ===== */}
        {previewStep === 'confirm' && importResult && (
          <div className="trang-danh-sach__import-result">
            <div className="result-summary result-summary--success">
              <CheckCircle2 size={32} />
              <h4>Import hoàn tất!</h4>
              <p>Đã thêm thành công <strong>{importResult.insertedCount}</strong> sinh viên.</p>
            </div>
            {importResult.failureCount > 0 && (
              <div className="result-summary result-summary--warning">
                <AlertCircle size={24} />
                <p>
                  <strong>{importResult.failureCount}</strong> dòng bị lỗi và không được ghi.
                </p>
              </div>
            )}
            {importResult.errors.length > 0 && (
              <div className="trang-danh-sach__import-errors">
                <h5>Chi tiết lỗi:</h5>
                <ul>
                  {importResult.errors.slice(0, 30).map((e, i) => (
                    <li key={i}>
                      <AlertCircle size={14} /> {e.message}
                    </li>
                  ))}
                  {importResult.errors.length > 30 && (
                    <li>... và {importResult.errors.length - 30} lỗi khác.</li>
                  )}
                </ul>
              </div>
            )}
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
