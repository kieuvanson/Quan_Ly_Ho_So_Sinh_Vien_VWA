/**
 * API client cho Import HOSOGIAYTO (hỗ trợ 1 hoặc nhiều sheet).
 *
 * Endpoint:
 * - POST /api/ho-so-giay-to/import/preview — Upload file → kiểm tra, fail-fast.
 * - POST /api/ho-so-giay-to/import/confirm — Xác nhận bằng token → ghi DB.
 * - GET  /api/ho-so-giay-to/import/mau    — Tải file mẫu (3 sheet: SV, HS, SV+HS).
 */

import { apiClient } from './client'
import type { ApiResponse } from './types'

// ============================================================
// TYPES
// ============================================================

export type ImportMode = 'SINH_VIEN' | 'HO_SO_GIAY_TO' | 'GOP'

export interface ImportRowError {
  sheet: string
  dong: number
  loaiDong?: string | null
  mssv?: string | null
  truong?: string | null
  lyDo: string[]
}

export interface PreviewRowData {
  dong: number
  loaiDong?: string | null
  data: Record<string, unknown>
}

export interface SheetPreview {
  tenSheet: string
  mode: ImportMode | null
  tongDong: number
  dongHopLe: number
  dongLoi: number
  danhSachLoi: ImportRowError[]
  rows: PreviewRowData[]
}

export interface ImportPreviewResponse {
  failFast: boolean
  sheetLoiDauTien?: string | null
  dongLoiDauTien?: number
  summaryMessage?: string | null
  token: string | null
  tongSoSheet: number
  tongSoDong: number
  tongDongHopLe: number
  tongDongLoi: number
  theoSheet: SheetPreview[]
}

export interface ImportSheetConfirmStats {
  tenSheet: string
  mode: ImportMode | null
  tongDong: number
  thanhCong: number
  thatBai: number
  thoiGianXuLyMs: number
}

export interface ImportConfirmResponse {
  token: string
  tongSoSheet: number
  tongThanhCong: number
  tongThatBai: number
  thoiGianXuLyMs: number
  theoSheet: ImportSheetConfirmStats[]
  errors: string[]
}

// ============================================================
// API
// ============================================================

export const hoSoGiayToImportApi = {
  /**
   * Bước 1: Upload file Excel → kiểm tra. Trả về token nếu OK, failFast=true nếu lỗi.
   */
  preview: async (file: File): Promise<ApiResponse<ImportPreviewResponse>> => {
    const form = new FormData()
    form.append('file', file)
    const res = await apiClient.post<ApiResponse<ImportPreviewResponse>>(
      '/api/ho-so-giay-to/import/preview',
      form,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    )
    return res.data
  },

  /**
   * Bước 2: Xác nhận bằng token → ghi vào DB.
   */
  confirm: async (token: string): Promise<ApiResponse<ImportConfirmResponse>> => {
    const res = await apiClient.post<ApiResponse<ImportConfirmResponse>>(
      '/api/ho-so-giay-to/import/confirm',
      { token }
    )
    return res.data
  },

  /**
   * Tải file mẫu (3 sheet).
   */
  downloadTemplate: async (): Promise<Blob> => {
    const res = await apiClient.get('/api/ho-so-giay-to/import/mau', {
      responseType: 'blob',
    })
    return res.data as Blob
  },
}
