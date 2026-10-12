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
}

/**
 * SinhVien API client.
 * Endpoints:
 * - GET    /api/sinh-vien (search, filter, paginate)
 * - GET    /api/sinh-vien/:mssv (get detail)
 * - GET    /api/sinh-vien/export (download xlsx)
 * - GET    /api/sinh-vien/import-template (download template xlsx)
 * - POST   /api/sinh-vien/import (upload xlsx)
 */
export const sinhVienApi = {
  /**
   * Get paginated list of students with search and filter.
   */
  getAll: async (params: SinhVienSearchParams = {}): Promise<ApiResponse<SinhVienPagedResponse>> => {
    const searchParams = new URLSearchParams()

    if (params.keyword) searchParams.append('keyword', params.keyword)
    if (params.trangThaiHocVu) searchParams.append('trangThaiHocVu', params.trangThaiHocVu)
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
   * Download Excel theo filter hiện tại.
   * @param scope 'filtered' = toàn bộ kết quả lọc, 'page' = chỉ trang hiện tại
   */
  exportExcel: async (params: SinhVienSearchParams = {}, scope: 'filtered' | 'page' = 'filtered'): Promise<Blob> => {
    const searchParams = new URLSearchParams()
    if (params.keyword) searchParams.append('keyword', params.keyword)
    if (params.trangThaiHocVu) searchParams.append('trangThaiHocVu', params.trangThaiHocVu)
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