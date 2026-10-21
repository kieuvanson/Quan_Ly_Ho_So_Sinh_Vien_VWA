import { apiClient } from './client'
import type { ApiResponse, SinhVienPagedResponse, SinhVienSearchParams, SinhVien } from './types'

/**
 * Kết quả import Excel trả về từ backend.
 */
export interface ImportResult {
  successCount: number
  failureCount: number
  insertedCount: number
  updatedCount: number
  errors: Array<{ rowNumber: number; message: string }>
}

/**
 * Trạng thái dòng trong bảng preview.
 */
export type ImportRowStatus = 'VALID' | 'INVALID' | 'DUPLICATE' | 'DUPLICATE_IN_FILE'

/**
 * Thông tin đối chiếu danh mục của một dòng preview.
 */
export interface ImportDanhMucInfo {
  khoaTen: string | null
  khoaId: string | null
  nganhTen: string | null
  nganhId: string | null
  lopTen: string | null
  lopId: string | null
  khoaHocTen: string | null
  khoaHocId: string | null
}

/**
 * Một dòng trong kết quả preview.
 */
export interface ImportRowPreview {
  excelRow: number
  mssv: string | null
  hoTen: string | null
  status: ImportRowStatus
  errors: string[]
  danhMuc: ImportDanhMucInfo | null
}

/**
 * Kết quả preview import — trả về từ backend.
 */
export interface ImportPreviewResult {
  totalRows: number
  validRows: number
  invalidRows: number
  duplicateInFile: number
  rows: ImportRowPreview[]
  newCount: number
  duplicateCount: number
  /** Fail-fast mode: dừng quét khi gặp dòng lỗi đầu tiên. Mặc định false. */
  failFast?: boolean
  /** Lỗi đầu tiên gặp phải khi fail-fast=true. */
  firstError?: ImportRowPreview | null
  /** Thông báo tổng kết (chỉ có khi fail-fast=true). */
  summaryMessage?: string | null
}

/**
 * Kết quả bulk operation trả về từ backend.
 */
export interface BulkResult {
  total: number
  successCount: number
  failureCount: number
  results: Array<{
    mssv: string
    success: boolean
    code?: string
    message?: string
  }>
}

/**
 * SinhVien API client.
 * Endpoints:
 * - GET    /api/sinh-vien (search, filter, paginate)
 * - GET    /api/sinh-vien/:mssv (get detail)
 * - GET    /api/sinh-vien/export (download xlsx)
 * - GET    /api/sinh-vien/import-template (download template xlsx)
 * - POST   /api/sinh-vien/import (upload xlsx)
 * - PUT    /api/sinh-vien/bulk/trang-thai (bulk update trạng thái học vụ)
 * - DELETE /api/sinh-vien/bulk (bulk delete)
 */
export const sinhVienApi = {
  /**
   * Get paginated list of students with search and filter.
   *
   * <p>Ưu tiên truyền {@code *_id} (Integer) khi UI đã chọn id danh mục.
   * Backend tự fallback resolve từ String nếu client cũ chỉ gửi tên.</p>
   */
  getAll: async (params: SinhVienSearchParams = {}): Promise<ApiResponse<SinhVienPagedResponse>> => {
    const searchParams = new URLSearchParams()

    if (params.keyword) searchParams.append('keyword', params.keyword)
    if (params.trangThaiHocVu) searchParams.append('trangThaiHocVu', params.trangThaiHocVu)
    // *_id là filter chính xác theo FK; chỉ gửi khi là số nguyên hợp lệ.
    if (isPositiveInt(params.nganhId)) searchParams.append('nganhId', String(params.nganhId))
    if (isPositiveInt(params.lopId)) searchParams.append('lopId', String(params.lopId))
    if (isPositiveInt(params.khoaHocId)) searchParams.append('khoaHocId', String(params.khoaHocId))
    if (isPositiveInt(params.khoaId)) searchParams.append('khoaId', String(params.khoaId))
    // String filters là fallback cho client cũ; backend cũng nhận để resolve.
    if (params.nganh) searchParams.append('nganh', params.nganh)
    if (params.lop) searchParams.append('lop', params.lop)
    if (params.khoaNamNhapHoc) searchParams.append('khoaNamNhapHoc', params.khoaNamNhapHoc)
    if (params.khoa) searchParams.append('khoa', params.khoa)
    if (params.heDaoTao) searchParams.append('heDaoTao', params.heDaoTao)
    if (params.page !== undefined) searchParams.append('page', String(params.page))
    if (params.size !== undefined) searchParams.append('size', String(params.size))
    if (params.sortDirection !== undefined) searchParams.append('sortDirection', String(params.sortDirection))

    const queryString = searchParams.toString()
    const url = queryString ? `/api/sinh-vien?${queryString}` : '/api/sinh-vien'

    const res = await apiClient.get<ApiResponse<SinhVienPagedResponse>>(url)
    return res.data
  },

  /**
   * Get student detail by MSSV.
   */
  getByMssv: async (mssv: string): Promise<ApiResponse<SinhVien>> => {
    const res = await apiClient.get<ApiResponse<SinhVien>>(`/api/sinh-vien/${mssv}`)
    return res.data
  },

  /**
   * Download Excel.
   * - `scope='filtered'` (mặc định): toàn bộ kết quả lọc.
   * - `scope='page'`: chỉ trang hiện tại.
   * - `scope='selected'`: chỉ những MSSV đã chọn trên UI.
   *
   * Backend nhận `mssv` (List<String>) và `mssvs` (CSV) — gửi cả 2 để tương thích.
   */
  exportExcel: async (
    params: SinhVienSearchParams = {},
    scope: 'filtered' | 'page' | 'selected' = 'filtered',
    selectedMssv?: string[]
  ): Promise<Blob> => {
    const searchParams = new URLSearchParams()
    if (params.keyword) searchParams.append('keyword', params.keyword)
    if (params.trangThaiHocVu) searchParams.append('trangThaiHocVu', params.trangThaiHocVu)
    // Gửi *_id (ưu tiên) — backend đã nhận và dùng FK.
    if (isPositiveInt(params.nganhId)) searchParams.append('nganhId', String(params.nganhId))
    if (isPositiveInt(params.lopId)) searchParams.append('lopId', String(params.lopId))
    if (isPositiveInt(params.khoaHocId)) searchParams.append('khoaHocId', String(params.khoaHocId))
    if (isPositiveInt(params.khoaId)) searchParams.append('khoaId', String(params.khoaId))
    if (params.nganh) searchParams.append('nganh', params.nganh)
    if (params.lop) searchParams.append('lop', params.lop)
    if (params.khoaNamNhapHoc) searchParams.append('khoaNamNhapHoc', params.khoaNamNhapHoc)
    if (params.khoa) searchParams.append('khoa', params.khoa)
    if (params.heDaoTao) searchParams.append('heDaoTao', params.heDaoTao)
    if (scope === 'page') {
      if (params.page !== undefined) searchParams.append('page', String(params.page))
      if (params.size !== undefined) searchParams.append('size', String(params.size))
    }
    searchParams.append('scope', scope)

    if (scope === 'selected') {
      if (!selectedMssv || selectedMssv.length === 0) {
        throw new Error('Danh sách MSSV được chọn đang trống.')
      }
      // Backend nhận nhiều param `mssv=A&mssv=B` (Spring List<String>)
      // HOẶC 1 param `mssvs=A,B,C` (CSV) — gửi cả 2.
      selectedMssv.forEach((m) => searchParams.append('mssv', m))
      searchParams.append('mssvs', selectedMssv.join(','))
    }

    const res = await apiClient.get(`/api/sinh-vien/export?${searchParams.toString()}`, {
      responseType: 'blob',
    })
    return res.data as Blob
  },

  /**
   * Download file Excel mẫu để import.
   */
  downloadTemplate: async (): Promise<Blob> => {
    const res = await apiClient.get('/api/sinh-vien/import-template', {
      responseType: 'blob',
    })
    return res.data as Blob
  },

  /**
   * Upload file Excel để import.
   * Phương thức cũ: upload trực tiếp và ghi ngay.
   * NÊN dùng preview + confirm thay thế.
   */
  importExcel: async (file: File): Promise<ApiResponse<ImportResult>> => {
    const form = new FormData()
    form.append('file', file)
    const res = await apiClient.post<ApiResponse<ImportResult>>('/api/sinh-vien/import', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return res.data
  },

  /**
   * Bước 1: Preview — upload file Excel để kiểm tra & xem trước dữ liệu.
   * CHƯA ghi vào database.
   */
  previewImport: async (file: File): Promise<ApiResponse<ImportPreviewResult>> => {
    const form = new FormData()
    form.append('file', file)
    const res = await apiClient.post<ApiResponse<ImportPreviewResult>>(
      '/api/sinh-vien/import/preview',
      form,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    )
    return res.data
  },

  /**
   * Bước 2: Confirm — xác nhận import các MSSV đã được preview.
   * GHI dữ liệu vào database.
   */
  confirmImport: async (mssvList: string[]): Promise<ApiResponse<ImportResult>> => {
    const res = await apiClient.post<ApiResponse<ImportResult>>(
      '/api/sinh-vien/import/confirm',
      { mssvList }
    )
    return res.data
  },

  /**
   * Cập nhật trạng thái học vụ cho NHIỀU sinh viên (bulk).
   *
   * Backend: PUT /api/sinh-vien/bulk/trang-thai
   * Body: { mssvList, trangThaiHocVu, ghiChu? }
   * Trả về: { total, successCount, failureCount, results: [{mssv, success, code?, message?}] }
   */
  bulkUpdateTrangThaiHocVu: async (
    mssvList: string[],
    trangThaiHocVu: string,
    ghiChu?: string
  ): Promise<ApiResponse<BulkResult>> => {
    const res = await apiClient.put<ApiResponse<BulkResult>>(
      '/api/sinh-vien/bulk/trang-thai',
      { mssvList, trangThaiHocVu, ghiChu }
    )
    return res.data
  },

  /**
   * Xóa hàng loạt sinh viên theo danh sách MSSV.
   *
   * Backend: DELETE /api/sinh-vien/bulk
   * Body: { mssvList, ghiChu? }
   * Trả về: { total, successCount, failureCount, results: [{mssv, success, code?, message?}] }
   *
   * Quy tắc xóa (backend):
   * - SV phải tồn tại.
   * - SV không còn hồ sơ giấy tờ.
   * - SV không có phiếu mượn đang hoạt động.
   */
  bulkDelete: async (
    mssvList: string[],
    ghiChu?: string
  ): Promise<ApiResponse<BulkResult>> => {
    const res = await apiClient.delete<ApiResponse<BulkResult>>(
      '/api/sinh-vien/bulk',
      { data: { mssvList, ghiChu } }
    )
    return res.data
  },
}

/**
 * Helper: kiểm tra giá trị id hợp lệ (số nguyên dương, không phải NaN/undefined/null/0).
 */
function isPositiveInt(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 && Number.isInteger(value)
}

/**
 * Helper: trigger browser download cho Blob (Excel/PDF/...).
 */
export function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
