import { apiClient } from './client'
import type { ApiResponse, Khoa, Nganh, KhoaHoc, Lop, TrangThaiHocVuItem, TrangThaiNopItem, TrangThaiPhieuItem } from './types'
import type {
  KhoaRequest,
  NganhRequest,
  KhoaHocRequest,
  LopRequest,
} from './types'

// ====================== IMPORT RESULT TYPES ======================

export interface ImportResult {
  totalRows: number
  successCount: number
  failureCount: number
  duplicateCount: number
  newCount: number
  errors: Array<{ rowNumber: number; message: string }>
}

// ====================== DOWNLOAD HELPER ======================

async function downloadFile(url: string, filename: string): Promise<void> {
  const res = await apiClient.get(url, { responseType: 'blob' })
  const blob = res.data as Blob
  const url2 = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url2
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url2)
}

/**
 * DanhMuc API client.
 * Endpoints:
 * - GET  /api/danh-muc/trang-thai-hoc-vu   (ENUM cố định, chỉ đọc)
 * - GET  /api/danh-muc/trang-thai-nop      (ENUM cố định, chỉ đọc)
 * - GET  /api/danh-muc/trang-thai-phieu    (ENUM cố định, chỉ đọc)
 * - GET  /api/danh-muc/khoa
 * - POST /api/danh-muc/khoa
 * - PUT  /api/danh-muc/khoa/{id}
 * - DEL  /api/danh-muc/khoa/{id}
 * - GET  /api/danh-muc/khoa/export
 * - GET  /api/danh-muc/khoa/template
 * - POST /api/danh-muc/khoa/import
 * - GET  /api/danh-muc/nganh?khoaId=
 * - POST /api/danh-muc/nganh
 * - PUT  /api/danh-muc/nganh/{id}
 * - DEL  /api/danh-muc/nganh/{id}
 * - GET  /api/danh-muc/nganh/export
 * - GET  /api/danh-muc/nganh/template
 * - POST /api/danh-muc/nganh/import
 * - GET  /api/danh-muc/khoa-hoc
 * - POST /api/danh-muc/khoa-hoc
 * - PUT  /api/danh-muc/khoa-hoc/{id}
 * - DEL  /api/danh-muc/khoa-hoc/{id}
 * - GET  /api/danh-muc/khoa-hoc/export
 * - GET  /api/danh-muc/khoa-hoc/template
 * - POST /api/danh-muc/khoa-hoc/import
 * - GET  /api/danh-muc/lop?nganhId=
 * - POST /api/danh-muc/lop
 * - PUT  /api/danh-muc/lop/{id}
 * - DEL  /api/danh-muc/lop/{id}
 * - GET  /api/danh-muc/lop/export
 * - GET  /api/danh-muc/lop/template
 * - POST /api/danh-muc/lop/import
 */
export const danhMucApi = {

  // ====================== TRANG THAI HOC VU (ENUM, chỉ đọc) ======================

  getTrangThaiHocVu: async (): Promise<ApiResponse<TrangThaiHocVuItem[]>> => {
    const response = await apiClient.get<ApiResponse<TrangThaiHocVuItem[]>>('/api/danh-muc/trang-thai-hoc-vu')
    return response.data
  },

  // ====================== TRANG THAI NOP GIAY TO (ENUM, chỉ đọc) ======================

  getTrangThaiNop: async (): Promise<ApiResponse<TrangThaiNopItem[]>> => {
    const response = await apiClient.get<ApiResponse<TrangThaiNopItem[]>>('/api/danh-muc/trang-thai-nop')
    return response.data
  },

  // ====================== TRANG THAI PHIEU (ENUM, chỉ đọc) ======================

  getTrangThaiPhieu: async (): Promise<ApiResponse<TrangThaiPhieuItem[]>> => {
    const response = await apiClient.get<ApiResponse<TrangThaiPhieuItem[]>>('/api/danh-muc/trang-thai-phieu')
    return response.data
  },

  // ====================== KHOA ======================

  getKhoa: async (): Promise<ApiResponse<Khoa[]>> => {
    const response = await apiClient.get<ApiResponse<Khoa[]>>('/api/danh-muc/khoa')
    return response.data
  },

  createKhoa: async (data: KhoaRequest): Promise<ApiResponse<Khoa>> => {
    const response = await apiClient.post<ApiResponse<Khoa>>('/api/danh-muc/khoa', data)
    return response.data
  },

  updateKhoa: async (id: number, data: KhoaRequest): Promise<ApiResponse<Khoa>> => {
    const response = await apiClient.put<ApiResponse<Khoa>>(`/api/danh-muc/khoa/${id}`, data)
    return response.data
  },

  deleteKhoa: async (id: number): Promise<ApiResponse<void>> => {
    const response = await apiClient.delete<ApiResponse<void>>(`/api/danh-muc/khoa/${id}`)
    return response.data
  },

  // ====================== NGANH ======================

  getNganh: async (khoaId?: number): Promise<ApiResponse<Nganh[]>> => {
    const params = khoaId !== undefined ? { khoaId } : undefined
    const response = await apiClient.get<ApiResponse<Nganh[]>>('/api/danh-muc/nganh', { params })
    return response.data
  },

  createNganh: async (data: NganhRequest): Promise<ApiResponse<Nganh>> => {
    const response = await apiClient.post<ApiResponse<Nganh>>('/api/danh-muc/nganh', data)
    return response.data
  },

  updateNganh: async (id: number, data: NganhRequest): Promise<ApiResponse<Nganh>> => {
    const response = await apiClient.put<ApiResponse<Nganh>>(`/api/danh-muc/nganh/${id}`, data)
    return response.data
  },

  deleteNganh: async (id: number): Promise<ApiResponse<void>> => {
    const response = await apiClient.delete<ApiResponse<void>>(`/api/danh-muc/nganh/${id}`)
    return response.data
  },

  // ====================== KHOA HOC ======================

  getKhoaHoc: async (): Promise<ApiResponse<KhoaHoc[]>> => {
    const response = await apiClient.get<ApiResponse<KhoaHoc[]>>('/api/danh-muc/khoa-hoc')
    return response.data
  },

  createKhoaHoc: async (data: KhoaHocRequest): Promise<ApiResponse<KhoaHoc>> => {
    const response = await apiClient.post<ApiResponse<KhoaHoc>>('/api/danh-muc/khoa-hoc', data)
    return response.data
  },

  updateKhoaHoc: async (id: number, data: KhoaHocRequest): Promise<ApiResponse<KhoaHoc>> => {
    const response = await apiClient.put<ApiResponse<KhoaHoc>>(`/api/danh-muc/khoa-hoc/${id}`, data)
    return response.data
  },

  deleteKhoaHoc: async (id: number): Promise<ApiResponse<void>> => {
    const response = await apiClient.delete<ApiResponse<void>>(`/api/danh-muc/khoa-hoc/${id}`)
    return response.data
  },

  // ====================== LOP ======================

  getLop: async (nganhId?: number): Promise<ApiResponse<Lop[]>> => {
    const params = nganhId !== undefined ? { nganhId } : undefined
    const response = await apiClient.get<ApiResponse<Lop[]>>('/api/danh-muc/lop', { params })
    return response.data
  },

  createLop: async (data: LopRequest): Promise<ApiResponse<Lop>> => {
    const response = await apiClient.post<ApiResponse<Lop>>('/api/danh-muc/lop', data)
    return response.data
  },

  updateLop: async (id: number, data: LopRequest): Promise<ApiResponse<Lop>> => {
    const response = await apiClient.put<ApiResponse<Lop>>(`/api/danh-muc/lop/${id}`, data)
    return response.data
  },

  deleteLop: async (id: number): Promise<ApiResponse<void>> => {
    const response = await apiClient.delete<ApiResponse<void>>(`/api/danh-muc/lop/${id}`)
    return response.data
  },

  // ====================== KHOA IMPORT/EXPORT ======================

  exportKhoa: async (): Promise<void> => {
    await downloadFile('/api/danh-muc/khoa/export', 'danh-muc-khoa.xlsx')
  },

  downloadKhoaTemplate: async (): Promise<void> => {
    await downloadFile('/api/danh-muc/khoa/template', 'mau-import-khoa.xlsx')
  },

  importKhoa: async (file: File): Promise<ApiResponse<ImportResult>> => {
    const form = new FormData()
    form.append('file', file)
    const res = await apiClient.post<ApiResponse<ImportResult>>('/api/danh-muc/khoa/import', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return res.data
  },

  // ====================== NGANH IMPORT/EXPORT ======================

  exportNganh: async (): Promise<void> => {
    await downloadFile('/api/danh-muc/nganh/export', 'danh-muc-nganh.xlsx')
  },

  downloadNganhTemplate: async (): Promise<void> => {
    await downloadFile('/api/danh-muc/nganh/template', 'mau-import-nganh.xlsx')
  },

  importNganh: async (file: File): Promise<ApiResponse<ImportResult>> => {
    const form = new FormData()
    form.append('file', file)
    const res = await apiClient.post<ApiResponse<ImportResult>>('/api/danh-muc/nganh/import', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return res.data
  },

  // ====================== KHOA HOC IMPORT/EXPORT ======================

  exportKhoaHoc: async (): Promise<void> => {
    await downloadFile('/api/danh-muc/khoa-hoc/export', 'danh-muc-khoa-hoc.xlsx')
  },

  downloadKhoaHocTemplate: async (): Promise<void> => {
    await downloadFile('/api/danh-muc/khoa-hoc/template', 'mau-import-khoa-hoc.xlsx')
  },

  importKhoaHoc: async (file: File): Promise<ApiResponse<ImportResult>> => {
    const form = new FormData()
    form.append('file', file)
    const res = await apiClient.post<ApiResponse<ImportResult>>('/api/danh-muc/khoa-hoc/import', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return res.data
  },

  // ====================== LOP IMPORT/EXPORT ======================

  exportLop: async (): Promise<void> => {
    await downloadFile('/api/danh-muc/lop/export', 'danh-muc-lop.xlsx')
  },

  downloadLopTemplate: async (): Promise<void> => {
    await downloadFile('/api/danh-muc/lop/template', 'mau-import-lop.xlsx')
  },

  importLop: async (file: File): Promise<ApiResponse<ImportResult>> => {
    const form = new FormData()
    form.append('file', file)
    const res = await apiClient.post<ApiResponse<ImportResult>>('/api/danh-muc/lop/import', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return res.data
  },
}
