import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ChevronLeft, ChevronRight, Eye, FileUp, FileDown, FileX,
  Loader2, RotateCcw, CheckCircle2, AlertCircle, X, CheckCheck,
  Square, CheckSquare, MinusSquare, ListChecks, Trash2, Edit3,
  Users, FileText,
} from 'lucide-react'
import { sinhVienApi, triggerDownload } from '../api/sinhVien'
import type { SinhVienSearchParams } from '../api/types'
import { phieuMuonApi } from '../api/phieuMuon'
import { useStudentSelection } from '../hooks/useStudentSelection'
import { CustomSelect, SearchInput, Button, Toast, Modal } from '../components/ui'
import { ModalImportPreview } from '../components/import/ModalImportPreview'
import { danhMucApi } from '../api/danhMuc'
import type { Nganh, KhoaHoc, Lop } from '../api/types'
import { TrangDanhSachHoSoGiayTo } from './TrangDanhSachHoSoGiayTo'
import './TrangDanhSachHoSo.css'

/**
 * Tab key cho trang "Danh sách hồ sơ sinh viên".
 * - {@code sinhVien}: tab mặc định, danh sách sinh viên với bulk action
 *   (cập nhật trạng thái, mượn/rút lô, xóa, xuất Excel).
 * - {@code hoSoGiayTo}: danh sách phẳng tất cả hồ sơ giấy tờ
 *   (kèm MSSV + họ tên), phục vụ tra cứu nhanh tình trạng nộp theo SV.
 */
type ActiveTab = 'sinhVien' | 'hoSoGiayTo'

const PAGE_SIZE = 10

const PAGE_SIZE_OPTIONS = [
  { value: 10, label: '10 / trang' },
  { value: 25, label: '25 / trang' },
  { value: 50, label: '50 / trang' },
  { value: 100, label: '100 / trang' },
]

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

// Cờ chung cho nhãn "Tất cả" — UI dùng chuỗi rỗng để biểu thị "không lọc".
// CustomSelect yêu cầu value: string, nên cần ép id thành chuỗi.
const ALL_LABEL = ''
const toOptionValue = (id: number | null | undefined): string =>
  id === null || id === undefined ? ALL_LABEL : String(id)
const parseOptionId = (value: string): number | undefined => {
  if (!value) return undefined
  const n = Number(value)
  return Number.isInteger(n) && n > 0 ? n : undefined
}

// ===== Bulk action types =====
interface BulkUpdatePreviewRow {
  mssv: string
  hoTen: string
  currentTrangThai: string
  allowed: boolean
  reason?: string
}

interface BulkDeleteReportRow {
  mssv: string
  hoTen: string
  deletable: boolean
  reason?: string
}

export function TrangDanhSachHoSo() {
  const navigate = useNavigate()

  // Tab hiện tại: 'sinhVien' (mặc định) hoặc 'hoSoGiayTo'.
  // Khi đổi tab, các state SV (filter, selection, modal) được giữ nguyên trong
  // memory — nếu user quay lại tab SV sẽ thấy đúng filter cũ. Các effect tải
  // dữ liệu chỉ re-fetch khi các dependency tương ứng đổi.
  const [activeTab, setActiveTab] = useState<ActiveTab>('sinhVien')

  // Search and filter state
  // Lưu giá trị dropdown ở dạng id (chuỗi) để truyền nguyên vẹn cho CustomSelect.
  // Chuỗi rỗng = "Tất cả" (không lọc theo danh mục đó).
  const [searchQuery, setSearchQuery] = useState('')
  const [nganhFilter, setNganhFilter] = useState(ALL_LABEL)
  const [khoaHocFilter, setKhoaHocFilter] = useState(ALL_LABEL)
  const [lopFilter, setLopFilter] = useState(ALL_LABEL)
  const [trangThaiFilter, setTrangThaiFilter] = useState<TrangThaiHocVuType | ''>('')

  // Danh mục tải từ API (danhMucApi). Mỗi lần tải trang sẽ refetch để đồng bộ
  // với những thay đổi trong phần Cài đặt (thêm/sửa/xóa).
  const [nganhList, setNganhList] = useState<Nganh[]>([])
  const [khoaHocList, setKhoaHocList] = useState<KhoaHoc[]>([])
  const [lopList, setLopList] = useState<Lop[]>([])
  const [danhMucLoading, setDanhMucLoading] = useState(true)
  const [danhMucError, setDanhMucError] = useState<string | null>(null)

  // Pagination state (UI uses 1-based, API uses 0-based)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(PAGE_SIZE)
  const [totalElements, setTotalElements] = useState(0)
  const [totalPages, setTotalPages] = useState(0)

  // Data state
  const [sinhVienList, setSinhVienList] = useState<any[]>([])
  
  // Loading and error state
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Toast state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)

  // Import modal state (sử dụng component ModalImportPreview mới - hỗ trợ đa sheet)
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)

  // ===== Bulk selection state =====
  // Lưu snapshot filter hiện tại (đã chuẩn hoá) để nhận biết khi filter đổi.
  const filterSignature = useMemo(
    () =>
      JSON.stringify({
        q: searchQuery,
        n: nganhFilter,
        k: khoaHocFilter,
        l: lopFilter,
        t: trangThaiFilter,
      }),
    [searchQuery, nganhFilter, khoaHocFilter, lopFilter, trangThaiFilter]
  )
  const prevFilterSignatureRef = useRef(filterSignature)
  const [filterChanged, setFilterChanged] = useState(false)

  // State cho modal cập nhật trạng thái hàng loạt
  const [isBulkUpdateModalOpen, setIsBulkUpdateModalOpen] = useState(false)
  const [bulkNewTrangThai, setBulkNewTrangThai] = useState<TrangThaiHocVuType | ''>('')
  const [isBulkProcessing, setIsBulkProcessing] = useState(false)
  const [bulkUpdatePreview, setBulkUpdatePreview] = useState<BulkUpdatePreviewRow[]>([])

  // State xóa hàng loạt — đã chuyển sang thực hiện xóa ngay không qua modal.
  const [isBulkDeleting, setIsBulkDeleting] = useState(false)

  // State cho modal tạo phiếu Mượn/Trả hoặc Rút hồ sơ lô
  const [bulkPhieuModal, setBulkPhieuModal] = useState<{
    open: boolean
    loaiPhieu: 'Mượn tạm thời' | 'Rút vĩnh viễn' | null
  }>({ open: false, loaiPhieu: null })
  const [bulkPhieuNgayMuon, setBulkPhieuNgayMuon] = useState(() => {
    const d = new Date()
    return d.toISOString().slice(0, 10)
  })
  const [bulkPhieuNgayTraDuKien, setBulkPhieuNgayTraDuKien] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() + 7)
    return d.toISOString().slice(0, 10)
  })
  const [bulkPhieuLyDo, setBulkPhieuLyDo] = useState('')
  const [bulkPhieuGhiChu, setBulkPhieuGhiChu] = useState('')
  const [isBulkPhieuSubmitting, setIsBulkPhieuSubmitting] = useState(false)
  const [bulkPhieuResult, setBulkPhieuResult] = useState<{
    success: number
    failure: number
    failedDetails: string[]
  } | null>(null)

  // ===== Tùy chọn hiển thị cột =====
  // Mặc định ẩn các cột phụ (CCCD, Khóa năm học) để bảng gọn hơn.
  // Người dùng bấm "Xem thêm" để mở rộng.
  const [showExtraColumns, setShowExtraColumns] = useState(false)

  // ====================== TẢI DANH MỤC (Ngành / Khóa học / Lớp) ======================
  // Tải song song 3 danh mục khi vào trang. Nếu lỗi thì KHÔNG âm thầm dùng
  // dữ liệu cũ — dropdown sẽ hiển thị chỉ "Tất cả" và banner cảnh báo.
  const fetchDanhMuc = useCallback(async () => {
    setDanhMucLoading(true)
    setDanhMucError(null)
    try {
      const [nganhRes, khoaHocRes, lopRes] = await Promise.all([
        danhMucApi.getNganh(),
        danhMucApi.getKhoaHoc(),
        danhMucApi.getLop(),
      ])
      if (nganhRes.success) setNganhList(nganhRes.data || [])
      if (khoaHocRes.success) setKhoaHocList(khoaHocRes.data || [])
      if (lopRes.success) setLopList(lopRes.data || [])
      const errs: string[] = []
      if (!nganhRes.success) errs.push('ngành')
      if (!khoaHocRes.success) errs.push('khóa học')
      if (!lopRes.success) errs.push('lớp')
      if (errs.length > 0) {
        setDanhMucError(`Không tải được danh mục: ${errs.join(', ')}. Vui lòng thử lại.`)
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Không kết nối được máy chủ danh mục.'
      setDanhMucError(msg)
      // KHÔNG giữ dữ liệu cũ nếu lỗi — để trống, UI hiển thị banner.
      setNganhList([])
      setKhoaHocList([])
      setLopList([])
    } finally {
      setDanhMucLoading(false)
    }
  }, [])

  // Hàm phụ: refetch lớp theo ngành (nếu backend hỗ trợ) hoặc lấy tất cả.
  // Backend DanhMucController.listLop(@RequestParam Integer nganhId) đã có sẵn.
  const fetchLopList = useCallback(async (nganhId?: number) => {
    try {
      const res = await danhMucApi.getLop(nganhId)
      if (res.success) {
        setLopList(res.data || [])
        // Nếu lớp đang chọn không còn thuộc danh sách mới → reset
        const currentLopId = parseOptionId(lopFilter)
        if (currentLopId && !(res.data || []).some((l) => l.id === currentLopId)) {
          setLopFilter(ALL_LABEL)
        }
      }
    } catch {
      // Lỗi im lặng: giữ nguyên lopList cũ, dropdown hiển thị như cũ.
    }
  }, [lopFilter])

  // Tải danh mục khi mount trang.
  useEffect(() => {
    fetchDanhMuc()
  }, [fetchDanhMuc])

  // Fetch data from API.
  // Mỗi lần build searchParams, ta ép id về số nguyên dương; null khi không chọn.
  // Backend nhận trực tiếp *_id (Integer) và filter theo FK trong bảng sinhvien.
  const fetchData = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    const nganhId = parseOptionId(nganhFilter)
    const khoaHocId = parseOptionId(khoaHocFilter)
    const lopId = parseOptionId(lopFilter)

    try {
      // Build search params for API
      const searchParams: SinhVienSearchParams = {
        keyword: searchQuery || undefined,
        nganhId,
        lopId,
        khoaHocId,
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
  }, [searchQuery, nganhFilter, khoaHocFilter, lopFilter, trangThaiFilter, currentPage, pageSize])

  // Fetch data when filters or page change
  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Khi filter thay đổi, đánh dấu để hiển thị cảnh báo phạm vi chọn.
  useEffect(() => {
    if (prevFilterSignatureRef.current !== filterSignature) {
      setFilterChanged(true)
      prevFilterSignatureRef.current = filterSignature
    }
  }, [filterSignature])

  // Reset page when filters change
  function handleSearchChange(value: string) {
    setSearchQuery(value)
    setCurrentPage(1)
  }

  function handleNganhChange(value: string) {
    setNganhFilter(value)
    setKhoaHocFilter(ALL_LABEL) // Reset khóa khi đổi ngành
    setLopFilter(ALL_LABEL)      // Reset lớp khi đổi ngành
    setCurrentPage(1)
    // Refetch lớp theo ngành mới
    const nganhId = parseOptionId(value)
    fetchLopList(nganhId ?? undefined)
  }

  function handleKhoaHocChange(value: string) {
    setKhoaHocFilter(value)
    setLopFilter(ALL_LABEL) // Reset lớp khi đổi khóa
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
    setNganhFilter(ALL_LABEL)
    setKhoaHocFilter(ALL_LABEL)
    setLopFilter(ALL_LABEL)
    setTrangThaiFilter('')
    setCurrentPage(1)
  }

  function handleViewStudent(mssv: string) {
    navigate(`/danh-sach-ho-so/${mssv}`)
  }

  function showToast(message: string, type: 'success' | 'error' | 'info' = 'info') {
    setToast({ message, type })
  }

  // Xử lý thay đổi số lượng bản ghi mỗi trang
  function handlePageSizeChange(newSize: number) {
    setPageSize(newSize)
    setCurrentPage(1)
  }

  // Lấy filter hiện tại dưới dạng params object (dùng cho cả export và import-result refresh)
  function getCurrentSearchParams(): SinhVienSearchParams {
    return {
      keyword: searchQuery || undefined,
      nganhId: parseOptionId(nganhFilter) ?? undefined,
      lopId: parseOptionId(lopFilter) ?? undefined,
      khoaHocId: parseOptionId(khoaHocFilter) ?? undefined,
      trangThaiHocVu: trangThaiFilter ? TRANG_THAI_TO_ENUM[trangThaiFilter as TrangThaiHocVuType] : undefined,
      page: currentPage - 1,
      size: pageSize,
    }
  }

  function handleImportExcel() {
    setIsImportModalOpen(true)
  }

  function handleCloseImportModal() {
    setIsImportModalOpen(false)
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

  // ============================================================
  // BULK ACTIONS
  // ============================================================

  /** Xuất Excel chỉ những MSSV đã chọn. */
  async function handleExportSelected() {
    const mssvs = selection.getSelectedArray()
    if (mssvs.length === 0) {
      showToast('Chưa có sinh viên nào được chọn.', 'error')
      return
    }
    try {
      const blob = await sinhVienApi.exportExcel(
        getCurrentSearchParams(),
        'selected',
        mssvs
      )
      triggerDownload(blob, `danh-sach-sinh-vien-da-chon-${Date.now()}.xlsx`)
      showToast(`Đã xuất ${mssvs.length} sinh viên đã chọn.`, 'success')
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        'Không thể xuất file Excel. Backend có thể chưa hỗ trợ export theo danh sách MSSV.'
      showToast(msg, 'error')
    }
  }

  /**
   * Mở modal cập nhật trạng thái học vụ hàng loạt.
   * - Tải chi tiết từng MSSV đã chọn (chỉ trang hiện tại + đã chọn) để build preview.
   * - Đánh dấu SV nào được phép đổi sang trạng thái mới (theo rule nghiệp vụ).
   */
  async function handleOpenBulkUpdate() {
    const mssvs = selection.getSelectedArray()
    if (mssvs.length === 0) {
      showToast('Chưa có sinh viên nào được chọn.', 'error')
      return
    }
    setIsBulkUpdateModalOpen(true)
    setBulkNewTrangThai('')

    // Build preview từ dữ liệu hiện có trên UI + cache lookup nếu cần.
    // Vì chỉ có data trong `sinhVienList` (trang hiện tại), ta lấy nhanh:
    const map = new Map<string, any>()
    sinhVienList.forEach((sv) => map.set(sv.mssv, sv))
    // Với MSSV không có trong trang hiện tại, ta không fetch chi tiết để tránh N+1.
    // User sẽ thấy cảnh báo "chỉ xem được SV trong trang hiện tại".
    const preview: BulkUpdatePreviewRow[] = mssvs.map((m) => {
      const sv = map.get(m)
      if (!sv) {
        return {
          mssv: m,
          hoTen: '(ngoài trang hiện tại)',
          currentTrangThai: '—',
          allowed: true,
          reason: 'Không có dữ liệu chi tiết trong trang hiện tại.',
        }
      }
      return {
        mssv: m,
        hoTen: sv.hoTen || '(không tên)',
        currentTrangThai: sv.trangThaiHocVu || '—',
        allowed: true,
      }
    })
    setBulkUpdatePreview(preview)
  }

  /**
   * Thực thi cập nhật trạng thái hàng loạt bằng cách gọi API cập nhật từng SV.
   * Vì backend PUT /api/sinh-vien/{mssv} đang trả 501, ta fallback an toàn:
   * gọi từng cái, đếm success/failure, hiển thị báo cáo.
   */
  async function handleConfirmBulkUpdate() {
    if (!bulkNewTrangThai) {
      showToast('Vui lòng chọn trạng thái mới.', 'error')
      return
    }
    setIsBulkProcessing(true)
    const mssvs = selection.getSelectedArray()
    const targetEnum = TRANG_THAI_TO_ENUM[bulkNewTrangThai as TrangThaiHocVuType]

    const results: Array<{ mssv: string; ok: boolean; message: string }> = []
    try {
      const res = await sinhVienApi.bulkUpdateTrangThaiHocVu(mssvs, targetEnum)
      if (res.success && res.data) {
        res.data.results.forEach((r) => {
          results.push({ mssv: r.mssv, ok: r.success, message: r.message || (r.success ? 'OK' : 'Lỗi') })
        })
      } else {
        mssvs.forEach((mssv) => {
          results.push({ mssv, ok: false, message: res.message || 'Thất bại' })
        })
      }
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        'Lỗi không xác định'
      mssvs.forEach((mssv) => {
        results.push({ mssv, ok: false, message: msg })
      })
    }
    setIsBulkProcessing(false)

    const successCount = results.filter((r) => r.ok).length
    const failCount = results.length - successCount

    if (successCount === mssvs.length) {
      showToast(`Đã cập nhật ${successCount} sinh viên.`, 'success')
      setIsBulkUpdateModalOpen(false)
      selection.clearSelection()
      fetchData()
    } else if (successCount === 0) {
      showToast(
        `Không thể cập nhật sinh viên nào. Có thể backend chưa hỗ trợ bulk update.`,
        'error'
      )
    } else {
      showToast(
        `Cập nhật thành công ${successCount}/${mssvs.length}. Vui lòng kiểm tra lại.`,
        'info'
      )
      fetchData()
    }
  }

  /**
   * Mở modal xóa và xóa NGAY các sinh viên đã chọn.
   * - Theo yêu cầu: KHÔNG hiển thị hộp thoại xác nhận, KHÔNG yêu cầu nhập lại
   *   thông tin; chỉ cần kiểm tra "Có/Không" đúng đối tượng đã chọn.
   * - Backend đã có rule: SV còn hồ sơ giấy tờ / còn phiếu đang mượn sẽ trả
   *   success=false kèm mã lỗi rõ ràng.
   * - Kết quả thành công được thông báo chính xác (số lượng, mã lỗi).
   */
  async function handleOpenBulkDelete() {
    const mssvs = selection.getSelectedArray()
    if (mssvs.length === 0) {
      showToast('Chưa có sinh viên nào được chọn.', 'error')
      return
    }
    // Theo yêu cầu: bỏ hộp thoại xác nhận và bước nhập "XOA".
    // Thực hiện xóa ngay lập tức.
    await executeBulkDelete(mssvs)
  }

  async function executeBulkDelete(mssvs: string[]) {
    if (mssvs.length === 0) {
      showToast('Chưa có sinh viên nào được chọn.', 'error')
      return
    }
    setIsBulkDeleting(true)
    let deletedCount = 0
    const failedMssvs: string[] = []
    const failedMessages: string[] = []
    try {
      const res = await sinhVienApi.bulkDelete(mssvs)
      if (res.success && res.data) {
        deletedCount = res.data.successCount
        res.data.results
          .filter((r) => !r.success)
          .forEach((r) => {
            failedMssvs.push(r.mssv)
            failedMssvs.push(r.mssv) // đánh dấu
            failedMessages.push(`${r.mssv}: ${r.message || r.code || 'lỗi'}`)
          })
        // Xoá khỏi selection các SV xóa thành công.
        const successMssvs = res.data.results
          .filter((r) => r.success)
          .map((r) => r.mssv)
        selection.removeMssv(successMssvs)

        // Cập nhật danh sách + total ngay lập tức (không bắt user tải lại).
        if (successMssvs.length > 0) {
          setTotalElements((prev) => Math.max(0, prev - successMssvs.length))
          setSinhVienList((prev) =>
            prev.filter((sv) => !successMssvs.includes(sv.mssv))
          )
        }

        if (failedMssvs.length === 0) {
          showToast(`Đã xóa ${deletedCount} sinh viên.`, 'success')
        } else if (deletedCount === 0) {
          showToast(
            `Không thể xóa sinh viên nào. ${failedMessages.length} lỗi — ${failedMessages.slice(0, 3).join('; ')}`,
            'error'
          )
        } else {
          showToast(
            `Đã xóa ${deletedCount}/${mssvs.length}. ` +
              `${failedMssvs.length} SV không thể xóa (ràng buộc dữ liệu).`,
            'info'
          )
        }
        // Re-fetch trang hiện tại để đồng bộ (tránh trang trống sau khi xóa).
        fetchData()
      } else {
        showToast(res.message || 'Xóa thất bại.', 'error')
      }
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        'Không thể xóa. Backend có thể chưa hỗ trợ xóa hàng loạt.'
      showToast(msg, 'error')
    } finally {
      setIsBulkDeleting(false)
    }
  }

  /**
   * Mở modal tạo phiếu Mượn tạm thời lô cho các sinh viên đã chọn.
   * Gọi thẳng API bulk đã có ở backend.
   */
  function handleBulkMuon() {
    const mssvs = selection.getSelectedArray()
    if (mssvs.length === 0) {
      showToast('Chưa có sinh viên nào được chọn.', 'error')
      return
    }
    setBulkPhieuResult(null)
    setBulkPhieuLyDo('Mượn tạm thời (bulk)')
    setBulkPhieuGhiChu('')
    setBulkPhieuModal({ open: true, loaiPhieu: 'Mượn tạm thời' })
  }

  function handleBulkRutHoSo() {
    const mssvs = selection.getSelectedArray()
    if (mssvs.length === 0) {
      showToast('Chưa có sinh viên nào được chọn.', 'error')
      return
    }
    setBulkPhieuResult(null)
    setBulkPhieuLyDo('Rút hồ sơ vĩnh viễn (bulk)')
    setBulkPhieuGhiChu('')
    setBulkPhieuModal({ open: true, loaiPhieu: 'Rút vĩnh viễn' })
  }

  async function handleConfirmBulkPhieu() {
    if (!bulkPhieuModal.loaiPhieu) return
    const mssvs = selection.getSelectedArray()
    if (mssvs.length === 0) {
      showToast('Chưa có sinh viên nào được chọn.', 'error')
      return
    }
    if (!bulkPhieuNgayMuon) {
      showToast('Vui lòng chọn ngày mượn.', 'error')
      return
    }
    if (bulkPhieuModal.loaiPhieu === 'Mượn tạm thời' && !bulkPhieuNgayTraDuKien) {
      showToast('Phiếu mượn tạm thời phải có hạn trả dự kiến.', 'error')
      return
    }
    if (!bulkPhieuLyDo.trim()) {
      showToast('Vui lòng nhập lý do.', 'error')
      return
    }
    setIsBulkPhieuSubmitting(true)
    setBulkPhieuResult(null)
    try {
      const res = await phieuMuonApi.bulkCreate({
        mssvList: mssvs,
        loaiPhieu: bulkPhieuModal.loaiPhieu,
        ngayMuon: bulkPhieuNgayMuon,
        ngayTraDuKien:
          bulkPhieuModal.loaiPhieu === 'Mượn tạm thời'
            ? bulkPhieuNgayTraDuKien
            : undefined,
        lyDo: bulkPhieuLyDo,
        ghiChu: bulkPhieuGhiChu || undefined,
        danhSachMaHoSo: [],
      })
      if (res.success && res.data) {
        const success = res.data.successCount
        const failure = res.data.failureCount
        const failedDetails = res.data.results
          .filter((r) => !r.success)
          .map((r) => `${r.mssv}: ${r.message || r.code || 'lỗi'}`)
        setBulkPhieuResult({ success, failure, failedDetails })
        if (failure === 0) {
          showToast(
            `Đã tạo phiếu cho ${success} sinh viên.`,
            'success'
          )
        } else if (success === 0) {
          showToast(
            `Không thể tạo phiếu cho SV nào. ${failure} lỗi.`,
            'error'
          )
        } else {
          showToast(
            `Đã tạo phiếu cho ${success}/${mssvs.length} sinh viên. ` +
              `${failure} SV không đủ điều kiện.`,
            'info'
          )
        }
        // Reload danh sách để cập nhật trạng thái (Rút vĩnh viễn đổi trạng thái SV).
        if (
          bulkPhieuModal.loaiPhieu === 'Rút vĩnh viễn'
          || success > 0
        ) {
          fetchData()
        }
      } else {
        showToast(res.message || 'Tạo phiếu hàng loạt thất bại.', 'error')
      }
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        'Không thể tạo phiếu hàng loạt. Backend có thể chưa hỗ trợ endpoint này.'
      showToast(msg, 'error')
    } finally {
      setIsBulkPhieuSubmitting(false)
    }
  }

  function handleCloseBulkPhieuModal() {
    if (isBulkPhieuSubmitting) return
    setBulkPhieuModal({ open: false, loaiPhieu: null })
    setBulkPhieuResult(null)
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

  // Custom Select options — build từ danh mục đã tải từ API.
  // CustomSelect yêu cầu value: string; ta dùng String(id) làm internal value.
  const nganhOptions = useMemo(
    () => [
      { value: ALL_LABEL, label: 'Tất cả ngành' },
      ...nganhList
        .filter((n) => n.dangSuDung !== false) // ẩn ngành không dùng
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

  const trangThaiOptions = [
    { value: ALL_LABEL, label: 'Tất cả trạng thái' },
    { value: 'Đang học', label: 'Đang học' },
    { value: 'Bảo lưu', label: 'Bảo lưu' },
    { value: 'Đình chỉ', label: 'Đình chỉ' },
    { value: 'Tốt nghiệp', label: 'Tốt nghiệp' },
    { value: 'Đã rút hồ sơ', label: 'Đã rút hồ sơ' },
  ]

  // ===== Bulk selection: hook dùng chung =====
  const visibleMssvArray = useMemo(() => sinhVienList.map((sv) => sv.mssv), [sinhVienList])

  const selection = useStudentSelection({
    getVisibleMssv: () => visibleMssvArray,
    getAllMatchingMssv: async () => {
      // Lấy toàn bộ MSSV thuộc filter hiện tại bằng cách gọi search với size lớn.
      try {
        const res = await sinhVienApi.getAll({
          keyword: searchQuery || undefined,
          nganhId: parseOptionId(nganhFilter) ?? undefined,
          khoaHocId: parseOptionId(khoaHocFilter) ?? undefined,
          lopId: parseOptionId(lopFilter) ?? undefined,
          trangThaiHocVu: trangThaiFilter
            ? TRANG_THAI_TO_ENUM[trangThaiFilter as TrangThaiHocVuType]
            : undefined,
          page: 0,
          size: 10000,
        })
        if (res.success && res.data) {
          return (res.data.data || []).map((sv: any) => sv.mssv)
        }
      } catch {
        // ignore - fallback xuống visibleMssv
      }
      return visibleMssvArray
    },
  })

  // Khi filter đổi, prune các MSSV không còn thuộc filter.
  useEffect(() => {
    if (!filterChanged) return
    // Gọi lại để lấy tập MSSV hợp lệ của filter hiện tại (chỉ trang hiện tại
    // là chưa đủ — ta dùng tập từ getAllMatchingMssv để prune chính xác).
    let isMounted = true
    ;(async () => {
      try {
        const res = await sinhVienApi.getAll({
          keyword: searchQuery || undefined,
          nganhId: parseOptionId(nganhFilter) ?? undefined,
          khoaHocId: parseOptionId(khoaHocFilter) ?? undefined,
          lopId: parseOptionId(lopFilter) ?? undefined,
          trangThaiHocVu: trangThaiFilter
            ? TRANG_THAI_TO_ENUM[trangThaiFilter as TrangThaiHocVuType]
            : undefined,
          page: 0,
          size: 10000,
        })
        if (isMounted && res.success && res.data) {
          const valid = new Set((res.data.data || []).map((sv: any) => sv.mssv))
          selection.pruneToFilter(valid)
        }
      } catch {
        // ignore
      } finally {
        if (isMounted) setFilterChanged(false)
      }
    })()
    return () => {
      isMounted = false
    }
  }, [filterChanged]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="trang-danh-sach">
      {/* Header */}
      <div className="trang-danh-sach__header">
        <h2 className="trang-danh-sach__title">Danh sách hồ sơ sinh viên</h2>
        <p className="trang-danh-sach__subtitle">Quản lý và tra cứu hồ sơ sinh viên</p>
      </div>

      {/* TabBar — chuyển giữa "Sinh viên" và "Hồ sơ giấy tờ" trong cùng 1 trang */}
      <div className="trang-danh-sach__tabs" role="tablist" aria-label="Loại danh sách">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'sinhVien'}
          className={`trang-danh-sach__tab ${activeTab === 'sinhVien' ? 'trang-danh-sach__tab--active' : ''}`}
          onClick={() => setActiveTab('sinhVien')}
        >
          <Users size={16} />
          <span>Sinh viên</span>
          <span className="trang-danh-sach__tab-count">{totalElements}</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'hoSoGiayTo'}
          className={`trang-danh-sach__tab ${activeTab === 'hoSoGiayTo' ? 'trang-danh-sach__tab--active' : ''}`}
          onClick={() => setActiveTab('hoSoGiayTo')}
        >
          <FileText size={16} />
          <span>Hồ sơ giấy tờ</span>
        </button>
      </div>

      {/* ==== TAB: HỒ SƠ GIẤY TỜ ==== */}
      {activeTab === 'hoSoGiayTo' && <TrangDanhSachHoSoGiayTo />}

      {/* ==== TAB: SINH VIÊN (giữ nguyên logic cũ) ==== */}
      {activeTab === 'sinhVien' && (
      <>
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

      {/* Banner cảnh báo khi tải danh mục thất bại. KHÔNG dùng dữ liệu giả để che. */}
      {danhMucError && (
        <div className="trang-danh-sach__toolbar-banner" role="alert">
          <AlertCircle size={18} />
          <span>{danhMucError}</span>
          <Button variant="secondary" onClick={fetchDanhMuc}>Tải lại danh mục</Button>
        </div>
      )}

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
                  <th className="col-checkbox">
                    {(() => {
                      const allSelected = selection.isAllVisibleSelected(visibleMssvArray)
                      const someSelected = selection.isSomeVisibleSelected(visibleMssvArray)
                      if (allSelected) {
                        return (
                          <button
                            type="button"
                            className="trang-danh-sach__checkbox-btn"
                            onClick={() => selection.toggleAllVisible(visibleMssvArray)}
                            title="Bỏ chọn tất cả (trang hiện tại)"
                            aria-label="Bỏ chọn tất cả"
                          >
                            <CheckSquare size={18} className="trang-danh-sach__checkbox trang-danh-sach__checkbox--checked" />
                          </button>
                        )
                      }
                      if (someSelected) {
                        return (
                          <button
                            type="button"
                            className="trang-danh-sach__checkbox-btn"
                            onClick={() => selection.toggleAllVisible(visibleMssvArray)}
                            title="Chọn tất cả (trang hiện tại)"
                            aria-label="Chọn tất cả"
                          >
                            <MinusSquare size={18} className="trang-danh-sach__checkbox trang-danh-sach__checkbox--indeterminate" />
                          </button>
                        )
                      }
                      return (
                        <button
                          type="button"
                          className="trang-danh-sach__checkbox-btn"
                          onClick={() => selection.toggleAllVisible(visibleMssvArray)}
                          title="Chọn tất cả (trang hiện tại)"
                          aria-label="Chọn tất cả"
                        >
                          <Square size={18} className="trang-danh-sach__checkbox" />
                        </button>
                      )
                    })()}
                  </th>
                  <th className="col-stt">STT</th>
                  <th className="col-mssv">MSSV</th>
                  <th>Họ và tên</th>
                  <th className="col-nganh">Ngành</th>
                  <th className="col-khoa">Khóa</th>
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
                    const checked = selection.isSelected(sv.mssv)
                    return (
                      <tr
                        key={sv.mssv}
                        className={checked ? 'trang-danh-sach__row--selected' : ''}
                      >
                        <td className="col-checkbox col-center">
                          <button
                            type="button"
                            className="trang-danh-sach__checkbox-btn"
                            onClick={() => selection.toggleMssv(sv.mssv)}
                            title={checked ? 'Bỏ chọn' : 'Chọn'}
                            aria-label={checked ? `Bỏ chọn ${sv.mssv}` : `Chọn ${sv.mssv}`}
                            aria-pressed={checked}
                          >
                            {checked ? (
                              <CheckSquare size={18} className="trang-danh-sach__checkbox trang-danh-sach__checkbox--checked" />
                            ) : (
                              <Square size={18} className="trang-danh-sach__checkbox" />
                            )}
                          </button>
                        </td>
                        <td className="col-stt col-nowrap">{pageStartIndex + index + 1}</td>
                        <td className="col-mssv col-nowrap">{sv.mssv}</td>
                        <td>{sv.hoTen}</td>
                        <td className="col-nganh">{sv.nganh || '-'}</td>
                        <td className="col-khoa col-nowrap">{sv.khoa || '-'}</td>
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
              <select
                className="trang-danh-sach__page-size-select"
                value={pageSize}
                onChange={(e) => handlePageSizeChange(Number(e.target.value))}
              >
                {PAGE_SIZE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
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

      {/* Thanh thao tác hàng loạt — chỉ hiển thị khi có selection */}
      {selection.hasSelection && (
        <div className="trang-danh-sach__bulk-bar" role="region" aria-label="Thao tác hàng loạt">
          <div className="trang-danh-sach__bulk-info">
            <ListChecks size={18} />
            <span className="trang-danh-sach__bulk-count">
              Đã chọn <strong>{selection.selectedCount}</strong> sinh viên
            </span>
            {filterChanged && (
              <span className="trang-danh-sach__bulk-warn" title="Bộ lọc đã thay đổi — các SV không còn thuộc filter đã được loại bỏ khỏi lựa chọn.">
                <AlertCircle size={14} /> Phạm vi đã cập nhật theo bộ lọc hiện tại
              </span>
            )}
            <Button
              variant="ghost"
              size="sm"
              icon={<X size={14} />}
              onClick={() => selection.clearSelection()}
              title="Bỏ chọn toàn bộ"
            >
              Bỏ chọn
            </Button>
          </div>
          <div className="trang-danh-sach__bulk-actions">
            <Button
              variant="secondary"
              size="sm"
              icon={<FileDown size={14} />}
              onClick={handleExportSelected}
              disabled={isLoading}
            >
              Xuất đã chọn
            </Button>
            <Button
              variant="secondary"
              size="sm"
              icon={<Edit3 size={14} />}
              onClick={handleOpenBulkUpdate}
              disabled={isLoading}
              title="Đổi trạng thái học vụ cho các sinh viên đã chọn"
            >
              Cập nhật trạng thái
            </Button>
            <Button
              variant="secondary"
              size="sm"
              icon={<FileUp size={14} />}
              onClick={handleBulkMuon}
              disabled={isLoading}
              title="Tạo phiếu mượn tạm thời cho các sinh viên đã chọn"
            >
              Mượn lô
            </Button>
            <Button
              variant="secondary"
              size="sm"
              icon={<FileX size={14} />}
              onClick={handleBulkRutHoSo}
              disabled={isLoading}
              title="Tạo phiếu rút hồ sơ vĩnh viễn cho các sinh viên đã chọn"
            >
              Rút hồ sơ lô
            </Button>
            <Button
              variant="danger"
              size="sm"
              icon={<Trash2 size={14} />}
              onClick={handleOpenBulkDelete}
              disabled={isLoading}
              title="Xóa các sinh viên đã chọn (chỉ khi đủ điều kiện)"
            >
              Xóa đã chọn
            </Button>
          </div>
        </div>
      )}

      {/* Modal Import Excel — Hỗ trợ 1 hoặc nhiều sheet (SV/HS/SV+HS). */}
      <ModalImportPreview
        isOpen={isImportModalOpen}
        onClose={handleCloseImportModal}
        onSuccess={fetchData}
        onShowToast={showToast}
      />

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* ===== Modal cập nhật trạng thái học vụ hàng loạt ===== */}
      <Modal
        isOpen={isBulkUpdateModalOpen}
        onClose={() => {
          if (!isBulkProcessing) setIsBulkUpdateModalOpen(false)
        }}
        title={`Cập nhật trạng thái học vụ (${selection.selectedCount} SV)`}
        size="lg"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setIsBulkUpdateModalOpen(false)}
              disabled={isBulkProcessing}
            >
              Hủy
            </Button>
            <Button
              variant="primary"
              onClick={handleConfirmBulkUpdate}
              disabled={isBulkProcessing || !bulkNewTrangThai}
              icon={isBulkProcessing ? <Loader2 size={16} /> : <CheckCheck size={16} />}
            >
              {isBulkProcessing
                ? 'Đang cập nhật...'
                : `Cập nhật ${selection.selectedCount} SV`}
            </Button>
          </>
        }
      >
        <div className="trang-danh-sach__bulk-update">
          <p className="trang-danh-sach__bulk-update-help">
            Chọn trạng thái học vụ mới cho <strong>{selection.selectedCount}</strong>{' '}
            sinh viên đã chọn. Mỗi sinh viên sẽ được cập nhật tuần tự; nếu backend
            chưa hỗ trợ bulk, từng yêu cầu sẽ trả lỗi rõ ràng và bạn có thể xử lý sau.
          </p>

          <div className="trang-danh-sach__bulk-update-field">
            <label className="trang-danh-sach__bulk-update-label">
              Trạng thái mới:
            </label>
            <div className="trang-danh-sach__select-wrapper">
              <CustomSelect
                value={bulkNewTrangThai}
                options={trangThaiOptions.filter((o) => o.value !== '')}
                onChange={(v) => setBulkNewTrangThai(v as TrangThaiHocVuType)}
                placeholder="-- Chọn trạng thái --"
              />
            </div>
          </div>

          <div className="trang-danh-sach__bulk-update-preview-wrapper">
            <h4 className="trang-danh-sach__bulk-update-preview-title">
              Xem trước ({bulkUpdatePreview.length} SV)
            </h4>
            <div className="trang-danh-sach__bulk-update-preview-table-wrapper">
              <table className="trang-danh-sach__import-preview-table">
                <thead>
                  <tr>
                    <th>MSSV</th>
                    <th>Họ tên</th>
                    <th>Trạng thái hiện tại</th>
                    <th>Sẽ chuyển thành</th>
                  </tr>
                </thead>
                <tbody>
                  {bulkUpdatePreview.map((row) => (
                    <tr key={row.mssv}>
                      <td>{row.mssv}</td>
                      <td>{row.hoTen}</td>
                      <td>
                        {row.currentTrangThai === '—' ? (
                          <span className="badge badge--warning">Không rõ</span>
                        ) : (
                          <span className="badge badge--info">
                            {TRANG_THAI_MAPPING[row.currentTrangThai]?.label ||
                              row.currentTrangThai}
                          </span>
                        )}
                      </td>
                      <td>
                        {bulkNewTrangThai ? (
                          <span className="badge badge--success">
                            {TRANG_THAI_MAPPING[
                              TRANG_THAI_TO_ENUM[bulkNewTrangThai]
                            ]?.label || bulkNewTrangThai}
                          </span>
                        ) : (
                          <span className="badge badge--warning">Chưa chọn</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {bulkUpdatePreview.some((r) => r.currentTrangThai === '—') && (
              <p className="trang-danh-sach__bulk-update-hint">
                <AlertCircle size={14} /> Một số MSSV nằm ngoài trang hiện tại nên
                không có dữ liệu chi tiết. Bạn vẫn có thể thực hiện; backend sẽ tự
                kiểm tra quy tắc nghiệp vụ.
              </p>
            )}
          </div>
        </div>
      </Modal>

      {/* ===== Modal xóa hàng loạt — đã thay bằng thực hiện xóa ngay ===== */}
      {/*
        Theo yêu cầu: bỏ hộp thoại xác nhận và bước nhập "XOA".
        Hành động "Xóa đã chọn" thực hiện ngay khi bấm.
        Giữ lại block này (rỗng) để tránh tham chiếu biến không dùng —
        biến state liên quan (isBulkDeleteModalOpen, bulkDeleteReport,
        bulkDeleteConfirmText) sẽ được dọn trong commit tiếp theo.
      */}

      {/* ===== Modal tạo phiếu hàng loạt (Mượn tạm thời / Rút vĩnh viễn) ===== */}
      <Modal
        isOpen={bulkPhieuModal.open}
        onClose={handleCloseBulkPhieuModal}
        title={
          bulkPhieuModal.loaiPhieu === 'Rút vĩnh viễn'
            ? `Rút hồ sơ lô (${selection.selectedCount} SV)`
            : `Mượn tạm thời lô (${selection.selectedCount} SV)`
        }
        size="lg"
        footer={
          bulkPhieuResult ? (
            <Button variant="secondary" onClick={handleCloseBulkPhieuModal}>
              Đóng
            </Button>
          ) : (
            <>
              <Button
                variant="secondary"
                onClick={handleCloseBulkPhieuModal}
                disabled={isBulkPhieuSubmitting}
              >
                Hủy
              </Button>
              <Button
                variant="primary"
                onClick={handleConfirmBulkPhieu}
                disabled={isBulkPhieuSubmitting}
                icon={isBulkPhieuSubmitting ? <Loader2 size={16} /> : <CheckCheck size={16} />}
              >
                {isBulkPhieuSubmitting
                  ? 'Đang tạo phiếu...'
                  : `Tạo phiếu cho ${selection.selectedCount} SV`}
              </Button>
            </>
          )
        }
      >
        <div className="trang-danh-sach__bulk-update">
          {!bulkPhieuResult && (
            <>
              <p className="trang-danh-sach__bulk-update-help">
                Tạo phiếu <strong>{bulkPhieuModal.loaiPhieu}</strong> cho{' '}
                <strong>{selection.selectedCount}</strong> sinh viên đã chọn.
                {bulkPhieuModal.loaiPhieu === 'Rút vĩnh viễn' && (
                  <>
                    {' '}
                    Hệ thống sẽ tự áp dụng <strong>toàn bộ giấy tờ</strong> hiện có
                    của từng sinh viên. SV còn phiếu mượn tạm thời chưa trả sẽ bị
                    bỏ qua.
                  </>
                )}
                {bulkPhieuModal.loaiPhieu === 'Mượn tạm thời' && (
                  <>
                    {' '}
                    Phiếu được tạo ở trạng thái <strong>Chờ duyệt</strong>; bạn cần
                    duyệt thủ công ở trang Mượn/Trả. SV đang ở trạng thái{' '}
                    <em>Đã rút hồ sơ</em> sẽ bị bỏ qua.
                  </>
                )}
              </p>

              <div className="trang-danh-sach__bulk-update-field">
                <label className="trang-danh-sach__bulk-update-label">Ngày mượn:</label>
                <input
                  type="date"
                  className="input"
                  value={bulkPhieuNgayMuon}
                  onChange={(e) => setBulkPhieuNgayMuon(e.target.value)}
                  disabled={isBulkPhieuSubmitting}
                />
              </div>

              {bulkPhieuModal.loaiPhieu === 'Mượn tạm thời' && (
                <div className="trang-danh-sach__bulk-update-field">
                  <label className="trang-danh-sach__bulk-update-label">
                    Hạn trả dự kiến:
                  </label>
                  <input
                    type="date"
                    className="input"
                    value={bulkPhieuNgayTraDuKien}
                    onChange={(e) => setBulkPhieuNgayTraDuKien(e.target.value)}
                    disabled={isBulkPhieuSubmitting}
                  />
                </div>
              )}

              <div className="trang-danh-sach__bulk-update-field">
                <label className="trang-danh-sach__bulk-update-label">Lý do:</label>
                <input
                  type="text"
                  className="input"
                  value={bulkPhieuLyDo}
                  onChange={(e) => setBulkPhieuLyDo(e.target.value)}
                  placeholder={
                    bulkPhieuModal.loaiPhieu === 'Rút vĩnh viễn'
                      ? 'Lý do rút hồ sơ (áp dụng cho tất cả SV)'
                      : 'Lý do mượn (áp dụng cho tất cả SV)'
                  }
                  disabled={isBulkPhieuSubmitting}
                />
              </div>

              <div className="trang-danh-sach__bulk-update-field">
                <label className="trang-danh-sach__bulk-update-label">Ghi chú:</label>
                <input
                  type="text"
                  className="input"
                  value={bulkPhieuGhiChu}
                  onChange={(e) => setBulkPhieuGhiChu(e.target.value)}
                  placeholder="(tùy chọn)"
                  disabled={isBulkPhieuSubmitting}
                />
              </div>
            </>
          )}

          {bulkPhieuResult && (
            <div className="trang-danh-sach__bulk-delete">
              <div
                className={`trang-danh-sach__bulk-delete-warning`}
                style={
                  bulkPhieuResult.failure === 0
                    ? { background: '#f0fdf4', borderColor: '#bbf7d0', color: '#166534' }
                    : { background: '#fffbeb', borderColor: '#fde68a', color: '#92400e' }
                }
              >
                {bulkPhieuResult.failure === 0 ? (
                  <CheckCircle2 size={20} />
                ) : (
                  <AlertCircle size={20} />
                )}
                <div>
                  <strong>Kết quả:</strong> Tạo thành công{' '}
                  <strong>{bulkPhieuResult.success}</strong> phiếu.{' '}
                  {bulkPhieuResult.failure > 0 && (
                    <>
                      Có <strong>{bulkPhieuResult.failure}</strong> SV không thể tạo
                      phiếu (xem chi tiết bên dưới).
                    </>
                  )}
                </div>
              </div>

              {bulkPhieuResult.failedDetails.length > 0 && (
                <div className="trang-danh-sach__bulk-update-preview-wrapper">
                  <h4 className="trang-danh-sach__bulk-update-preview-title">
                    Chi tiết lỗi ({bulkPhieuResult.failedDetails.length})
                  </h4>
                  <ul
                    style={{
                      margin: 0,
                      padding: 0,
                      listStyle: 'none',
                      maxHeight: 280,
                      overflowY: 'auto',
                      border: '1px solid var(--color-border)',
                      borderRadius: 8,
                    }}
                  >
                    {bulkPhieuResult.failedDetails.map((line, i) => (
                      <li
                        key={i}
                        style={{
                          padding: '8px 12px',
                          borderBottom: '1px solid var(--color-border-light)',
                          color: '#dc2626',
                          fontSize: 13,
                        }}
                      >
                        {line}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </Modal>
      </>
      )}
    </div>
  )
}
