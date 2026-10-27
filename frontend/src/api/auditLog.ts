import { apiClient } from './client'
import type { ApiResponse, PagedResponse } from './types'

/**
 * AuditLog (nhật ký hệ thống) API client.
 *
 * Endpoints (backend — AuditLogController):
 * - GET /api/audit-log?bang=&bangKhac=&hanhDong=&keyword=&nguoiThucHien=&fromDate=&toDate=&page=&size=
 *       — danh sách bản ghi nhật ký, có lọc + phân trang.
 * - GET /api/audit-log/{id}  — chi tiết một bản ghi.
 *
 * Quyền: ADMIN (backend chặn STAFF).
 */

/** Một bản ghi nhật ký hệ thống — ánh xạ backend AuditLogResponse. */
export interface AuditLog {
  id: number
  /** Mã hành động: CREATE_PHIEU, DUYET_PHIEU, TRA_PHIEU, RUT_VINH_VIEN, ... */
  hanhDong: string
  /** Tên bảng bị tác động: "phieu_xuat_ho_so", "sinhvien". */
  bang: string
  /** Khoá chính của bản ghi bị tác động (mã phiếu hoặc MSSV). */
  khoaChinh: string | null
  /** Trường dữ liệu bị thay đổi (VD: "trang_thai_hoc_vu"). */
  truongThayDoi: string | null
  /** Giá trị trước khi thay đổi (null nếu không có). */
  giaTriCu: string | null
  /** Giá trị sau khi thay đổi (null nếu không có). */
  giaTriMoi: string | null
  /** Username cán bộ thực hiện. */
  nguoiThucHien: string | null
  /** ISO-8601 timestamp. */
  thoiGian: string
  /** MSSV sinh viên — chỉ có khi bản ghi tác động bảng `sinhvien`. */
  mssv?: string | null
  /** Họ tên sinh viên — chỉ có khi bản ghi tác động bảng `sinhvien`. */
  hoTenSinhVien?: string | null
}

/** Filter cho {@link auditLogApi.search}. */
export interface AuditLogSearchParams {
  /** Tên bảng bị tác động. VD: "sinhvien" cho tab thay đổi thông tin SV. */
  bang?: string
  /** Tên bảng cần loại trừ. VD: "sinhvien" cho tab nhật ký hệ thống. */
  bangKhac?: string
  /** Mã hành động. */
  hanhDong?: string
  /** Từ khoá: MSSV, họ tên SV, khoá chính, trường, giá trị, người thực hiện. */
  keyword?: string
  /** Username cán bộ thực hiện. */
  nguoiThucHien?: string
  /** Ngày bắt đầu (yyyy-MM-dd). */
  fromDate?: string
  /** Ngày kết thúc (yyyy-MM-dd). */
  toDate?: string
  /** Trang 0-based. */
  page?: number
  /** Số bản ghi mỗi trang. */
  size?: number
}

export const auditLogApi = {
  /** Lấy danh sách bản ghi nhật ký hệ thống, có lọc + phân trang. */
  search: async (
    params: AuditLogSearchParams = {}
  ): Promise<ApiResponse<PagedResponse<AuditLog[]>>> => {
    const sp = new URLSearchParams()
    if (params.bang) sp.append('bang', params.bang)
    if (params.bangKhac) sp.append('bangKhac', params.bangKhac)
    if (params.hanhDong) sp.append('hanhDong', params.hanhDong)
    if (params.keyword) sp.append('keyword', params.keyword)
    if (params.nguoiThucHien) sp.append('nguoiThucHien', params.nguoiThucHien)
    if (params.fromDate) sp.append('fromDate', params.fromDate)
    if (params.toDate) sp.append('toDate', params.toDate)
    sp.append('page', String(params.page ?? 0))
    sp.append('size', String(params.size ?? 20))

    const res = await apiClient.get<ApiResponse<PagedResponse<AuditLog[]>>>(
      `/api/audit-log?${sp.toString()}`
    )
    return res.data
  },

  /** Lấy chi tiết một bản ghi nhật ký hệ thống theo id. */
  getById: async (id: number): Promise<ApiResponse<AuditLog>> => {
    const res = await apiClient.get<ApiResponse<AuditLog>>(`/api/audit-log/${id}`)
    return res.data
  },
}
