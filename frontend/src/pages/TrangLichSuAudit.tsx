import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Eye,
  FileText,
  History,
  Loader2,
  RotateCcw,
  Search,
  ShieldCheck,
  UserCog,
  ArrowLeftRight,
  Download,
} from 'lucide-react'
import { Modal } from '../components/ui'
import { lichSuNopApi, type LichSuNop } from '../api/lichSuNop'
import { auditLogApi, type AuditLog } from '../api/auditLog'
import { phieuMuonApi } from '../api/phieuMuon'
import type { PhieuMuon } from '../api/types'
import './TrangLichSuAudit.css'

const PAGE_SIZE = 10

// =========================================================================
// Types
// =========================================================================

type TabId = 'ho-so' | 'muon-tra' | 'rut-ho-so' | 'thong-tin-sv' | 'he-thong'

interface TabDef {
  id: TabId
  label: string
  icon: React.ReactNode
  description: string
}

const TABS: TabDef[] = [
  {
    id: 'ho-so',
    label: 'Lịch sử hồ sơ & giấy tờ',
    icon: <FileText size={16} />,
    description: 'Tiếp nhận, bổ sung và cập nhật trạng thái giấy tờ (bảng lich_su_nop)',
  },
  {
    id: 'muon-tra',
    label: 'Lịch sử mượn / trả hồ sơ',
    icon: <ArrowLeftRight size={16} />,
    description: 'Phiếu mượn tạm thời: tạo, duyệt, trả, quá hạn',
  },
  {
    id: 'rut-ho-so',
    label: 'Lịch sử rút hồ sơ',
    icon: <Download size={16} />,
    description: 'Phiếu rút hồ sơ vĩnh viễn: yêu cầu, duyệt, hoàn tất',
  },
  {
    id: 'thong-tin-sv',
    label: 'Thay đổi thông tin sinh viên',
    icon: <UserCog size={16} />,
    description: 'Audit thay đổi dữ liệu bảng sinhvien',
  },
  {
    id: 'he-thong',
    label: 'Nhật ký hệ thống',
    icon: <ShieldCheck size={16} />,
    description: 'Các hoạt động hệ thống khác (phiếu xuất hồ sơ, tài khoản…)',
  },
]

/** Chi tiết đang mở trong modal — hợp nhất 3 nguồn dữ liệu. */
type DetailItem =
  | { kind: 'lich-su-nop'; data: LichSuNop }
  | { kind: 'phieu'; data: PhieuMuon }
  | { kind: 'audit-log'; data: AuditLog }

// =========================================================================
// Helpers
// =========================================================================

/** Format ISO timestamp → dd/MM/yyyy HH:mm. */
function formatDateTime(value?: string | null): string {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/** Format ISO date → dd/MM/yyyy. */
function formatDate(value?: string | null): string {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

/** Chuẩn hoá chuỗi để so sánh/hiển thị: null/undefined/rỗng → '—'. */
function orDash(value?: string | null): string {
  if (value === null || value === undefined) return '—'
  const trimmed = String(value).trim()
  return trimmed.length === 0 ? '—' : trimmed
}

/** Class badge theo trạng thái phiếu (tiếng Việt, có dấu). */
function statusClass(status?: string | null): string {
  if (!status) return 'audit-badge--neutral'
  return 'audit-badge--' + status.toLowerCase().replace(/\s+/g, '-')
}

/**
 * Ánh xạ mã hành động (audit_log.hanh_dong / lich_su_nop.hanh_dong) sang nhãn
 * tiếng Việt thân thiện. Mã gốc vẫn được hiển thị phụ để tra cứu kỹ thuật.
 */
const ACTION_LABELS: Record<string, string> = {
  // lich_su_nop — hồ sơ & giấy tờ
  TAO_MOI: 'Tạo mới hồ sơ',
  CAP_NHAT: 'Cập nhật hồ sơ',
  'Tạo hồ sơ': 'Tạo hồ sơ',
  'Nộp giấy tờ': 'Nộp giấy tờ',
  'Hủy nộp': 'Hủy nộp',
  'Đánh dấu thiếu': 'Đánh dấu thiếu',
  'Bổ sung đầy đủ': 'Bổ sung đầy đủ',
  'Đánh dấu không hợp lệ': 'Đánh dấu không hợp lệ',
  'Hợp lệ trở lại': 'Hợp lệ trở lại',
  'Cập nhật trạng thái': 'Cập nhật trạng thái',
  // audit_log — sinh viên
  BULK_UPDATE_TRANG_THAI: 'Cập nhật trạng thái học vụ',
  BULK_UPDATE_TRANG_THAI_NOTE: 'Ghi chú cập nhật trạng thái',
  BULK_DELETE_SINHVIEN: 'Xóa sinh viên',
  RUT_VINH_VIEN: 'Rút hồ sơ vĩnh viễn',
  // audit_log — phiếu
  CREATE_PHIEU: 'Tạo phiếu',
  CREATE_PHIEU_BULK: 'Tạo phiếu hàng loạt',
  DUYET_PHIEU: 'Duyệt phiếu',
  TU_CHOI_PHIEU: 'Từ chối phiếu',
  TRA_PHIEU: 'Trả phiếu',
  AUTO_QUA_HAN: 'Tự động đánh dấu quá hạn',
  // audit_log — tài khoản
  LOGIN_SUCCESS: 'Đăng nhập',
  LOGIN_FAILED: 'Đăng nhập thất bại',
  LOGOUT: 'Đăng xuất',
  CREATE_USER: 'Tạo tài khoản',
  UPDATE_ROLE: 'Đổi vai trò',
  ACTIVATE_USER: 'Kích hoạt tài khoản',
  DEACTIVATE_USER: 'Vô hiệu hoá tài khoản',
  UPDATE_PROFILE: 'Cập nhật hồ sơ cá nhân',
}

/** Nhãn tiếng Việt của hành động; nếu không có trong bảng thì trả về chính mã gốc. */
function actionLabel(action?: string | null): string {
  if (!action) return '—'
  return ACTION_LABELS[action] ?? action
}

// =========================================================================
// Component
// =========================================================================

export function TrangLichSuAudit() {
  const [activeTab, setActiveTab] = useState<TabId>('ho-so')

  // Bộ lọc (dùng chung cho mọi tab — mỗi tab ánh xạ sang tham số API riêng)
  const [keyword, setKeyword] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [actor, setActor] = useState('')
  const [actionFilter, setActionFilter] = useState('')
  const [currentPage, setCurrentPage] = useState(0)

  const [rows, setRows] = useState<unknown[]>([])
  const [totalElements, setTotalElements] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [detail, setDetail] = useState<DetailItem | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState<string | null>(null)

  const activeTabDef = useMemo(() => TABS.find((t) => t.id === activeTab)!, [activeTab])

  // ---------------------------------------------------------------------
  // Tải dữ liệu theo tab (server-side search + filter + pagination)
  // ---------------------------------------------------------------------
  const fetchData = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const common = {
        keyword: keyword.trim() || undefined,
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
        nguoiThucHien: actor.trim() || undefined,
        page: currentPage,
        size: PAGE_SIZE,
      }

      switch (activeTab) {
        case 'ho-so': {
          const res = await lichSuNopApi.searchAll({ ...common, hanhDong: actionFilter || undefined })
          if (res.success && res.data) {
            setRows(res.data.data ?? [])
            setTotalElements(res.data.page?.totalElements ?? 0)
          } else {
            setRows([])
            setTotalElements(0)
            setError(res.message || 'Không thể tải lịch sử hồ sơ & giấy tờ.')
          }
          break
        }
        case 'muon-tra':
        case 'rut-ho-so': {
          const res = await phieuMuonApi.getLichSu({
            ...common,
            loaiHoSo: activeTab === 'muon-tra' ? 'Mượn tạm thời' : 'Rút vĩnh viễn',
            trangThai: actionFilter || undefined,
          })
          if (res.success && res.data) {
            setRows(res.data.data ?? [])
            setTotalElements(res.data.page?.totalElements ?? 0)
          } else {
            setRows([])
            setTotalElements(0)
            setError(res.message || 'Không thể tải lịch sử phiếu xuất hồ sơ.')
          }
          break
        }
        case 'thong-tin-sv': {
          const res = await auditLogApi.search({ ...common, bang: 'sinhvien', hanhDong: actionFilter || undefined })
          if (res.success && res.data) {
            setRows(res.data.data ?? [])
            setTotalElements(res.data.page?.totalElements ?? 0)
          } else {
            setRows([])
            setTotalElements(0)
            setError(res.message || 'Không thể tải thay đổi thông tin sinh viên.')
          }
          break
        }
        case 'he-thong': {
          const res = await auditLogApi.search({
            ...common,
            bangKhac: 'sinhvien',
            hanhDong: actionFilter || undefined,
          })
          if (res.success && res.data) {
            setRows(res.data.data ?? [])
            setTotalElements(res.data.page?.totalElements ?? 0)
          } else {
            setRows([])
            setTotalElements(0)
            setError(res.message || 'Không thể tải nhật ký hệ thống.')
          }
          break
        }
      }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } }
      setError(
        e.response?.data?.message ||
          'Không thể kết nối đến máy chủ. Vui lòng kiểm tra backend đang chạy ở http://localhost:8081.'
      )
      setRows([])
      setTotalElements(0)
    } finally {
      setIsLoading(false)
    }
  }, [activeTab, keyword, fromDate, toDate, actor, actionFilter, currentPage])

  // Debounce 350ms cho ô tìm kiếm + người thực hiện để không gọi API liên tục.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      fetchData()
    }, 350)
    return () => window.clearTimeout(timer)
  }, [fetchData])

  // ---------------------------------------------------------------------
  // Handler
  // ---------------------------------------------------------------------
  const handleReset = () => {
    setKeyword('')
    setFromDate('')
    setToDate('')
    setActor('')
    setActionFilter('')
    setCurrentPage(0)
  }

  const handleTabChange = (id: TabId) => {
    setActiveTab(id)
    setActionFilter('')
    setCurrentPage(0)
  }

  /** Mở modal chi tiết — gọi API chi tiết nếu endpoint có hỗ trợ. */
  const handleViewDetail = async (row: unknown) => {
    setIsDetailOpen(true)
    setDetailLoading(true)
    setDetailError(null)
    setDetail(null)

    try {
      if (activeTab === 'ho-so') {
        const res = await lichSuNopApi.getByMaLog((row as LichSuNop).maLog)
        if (res.success && res.data) setDetail({ kind: 'lich-su-nop', data: res.data })
        else setDetailError(res.message || 'Không tìm thấy bản ghi lịch sử.')
      } else if (activeTab === 'muon-tra' || activeTab === 'rut-ho-so') {
        const res = await phieuMuonApi.getByMaPhieu((row as PhieuMuon).maPhieu)
        if (res.success && res.data) setDetail({ kind: 'phieu', data: res.data })
        else setDetailError(res.message || 'Không tìm thấy phiếu.')
      } else {
        const res = await auditLogApi.getById((row as AuditLog).id)
        if (res.success && res.data) setDetail({ kind: 'audit-log', data: res.data })
        else setDetailError(res.message || 'Không tìm thấy bản ghi nhật ký.')
      }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } }
      setDetailError(e.response?.data?.message || 'Không thể tải chi tiết bản ghi.')
    } finally {
      setDetailLoading(false)
    }
  }

  // ---------------------------------------------------------------------
  // Render helpers
  // ---------------------------------------------------------------------
  const renderTable = () => {
    if (isLoading) {
      return (
        <div className="audit-state">
          <Loader2 className="audit-state__icon audit-state__icon--spin" size={32} />
          <p className="audit-state__text">Đang tải dữ liệu từ máy chủ...</p>
        </div>
      )
    }

    if (error) {
      return (
        <div className="audit-state">
          <AlertCircle className="audit-state__icon" size={32} color="#dc2626" />
          <p className="audit-state__text">{error}</p>
        </div>
      )
    }

    if (rows.length === 0) {
      return (
        <div className="audit-state">
          <History className="audit-state__icon" size={32} color="#94a3b8" />
          <p className="audit-state__text">Không có bản ghi nào khớp bộ lọc hiện tại.</p>
        </div>
      )
    }

    switch (activeTab) {
      case 'ho-so':
        return (
          <table className="audit-table">
            <thead>
              <tr>
                <th>Thời gian</th>
                <th>Sinh viên / MSSV</th>
                <th>Loại giấy tờ</th>
                <th>Hành động</th>
                <th>Trạng thái</th>
                <th>Người thực hiện</th>
                <th className="audit-table__cell--action">Chi tiết</th>
              </tr>
            </thead>
            <tbody>
              {(rows as LichSuNop[]).map((item) => (
                <tr key={item.maLog}>
                  <td className="audit-table__cell--time">{formatDateTime(item.thoiGian)}</td>
                  <td>
                    <div className="audit-student">
                      <span className="audit-student__name">{orDash(item.hoTenSinhVien)}</span>
                      <span className="audit-student__mssv">MSSV: {orDash(item.mssv)}</span>
                    </div>
                  </td>
                  <td>{orDash(item.tenGiayTo)}</td>
                  <td>
                    <span className="audit-action-text">{actionLabel(item.hanhDong)}</span>
                    <span className="audit-action-detail">Mã hồ sơ: {orDash(item.maHoSo)}</span>
                  </td>
                  <td>
                    {item.trangThaiCu || item.trangThaiMoi ? (
                      <div className="audit-status-change">
                        <span className="audit-status-change__old">{orDash(item.trangThaiCu)}</span>
                        <span className="audit-status-change__arrow">→</span>
                        <span className="audit-status-change__new">{orDash(item.trangThaiMoi)}</span>
                      </div>
                    ) : (
                      <span className="audit-text-muted">—</span>
                    )}
                  </td>
                  <td className="audit-table__cell--actor">{orDash(item.nguoiThucHien)}</td>
                  <td className="audit-table__cell--action">
                    <button className="audit-btn-view" onClick={() => handleViewDetail(item)}>
                      <Eye size={14} /> Xem
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )

      case 'muon-tra':
      case 'rut-ho-so':
        return (
          <table className="audit-table">
            <thead>
              <tr>
                <th>Thời gian</th>
                <th>Sinh viên / MSSV</th>
                <th>Số phiếu</th>
                <th>Loại phiếu</th>
                <th>Trạng thái</th>
                <th>Người thực hiện</th>
                <th className="audit-table__cell--action">Chi tiết</th>
              </tr>
            </thead>
            <tbody>
              {(rows as PhieuMuon[]).map((item) => (
                <tr key={item.maPhieu}>
                  <td className="audit-table__cell--time">{formatDateTime(item.ngayTao)}</td>
                  <td>
                    <div className="audit-student">
                      <span className="audit-student__name">{orDash(item.hoTenSinhVien)}</span>
                      <span className="audit-student__mssv">MSSV: {orDash(item.mssv)}</span>
                    </div>
                  </td>
                  <td>
                    <span className="audit-action-text">{orDash(item.maPhieu)}</span>
                    <span className="audit-action-detail">{orDash(item.lyDo)}</span>
                  </td>
                  <td>{orDash(item.loaiPhieu)}</td>
                  <td>
                    <span className={`audit-badge ${statusClass(item.trangThai)}`}>
                      {orDash(item.trangThai)}
                    </span>
                  </td>
                  <td className="audit-table__cell--actor">{orDash(item.nguoiTao)}</td>
                  <td className="audit-table__cell--action">
                    <button className="audit-btn-view" onClick={() => handleViewDetail(item)}>
                      <Eye size={14} /> Xem
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )

      case 'thong-tin-sv':
      case 'he-thong':
        return (
          <table className="audit-table">
            <thead>
              <tr>
                <th>Thời gian</th>
                <th>Sinh viên / MSSV</th>
                <th>Hành động</th>
                <th>Trường / Bảng</th>
                <th>Giá trị</th>
                <th>Người thực hiện</th>
                <th className="audit-table__cell--action">Chi tiết</th>
              </tr>
            </thead>
            <tbody>
              {(rows as AuditLog[]).map((item) => (
                <tr key={item.id}>
                  <td className="audit-table__cell--time">{formatDateTime(item.thoiGian)}</td>
                  <td>
                    <div className="audit-student">
                      <span className="audit-student__name">{orDash(item.hoTenSinhVien)}</span>
                      <span className="audit-student__mssv">MSSV: {orDash(item.mssv ?? item.khoaChinh)}</span>
                    </div>
                  </td>
                  <td>
                    <span className="audit-action-text">{actionLabel(item.hanhDong)}</span>
                    <span className="audit-action-detail">Mã: {orDash(item.hanhDong)}</span>
                  </td>
                  <td>
                    <span className="audit-action-text">{orDash(item.truongThayDoi)}</span>
                    <span className="audit-action-detail">Bảng: {orDash(item.bang)}</span>
                  </td>
                  <td>
                    <div className="audit-status-change">
                      <span className="audit-status-change__old">{orDash(item.giaTriCu)}</span>
                      <span className="audit-status-change__arrow">→</span>
                      <span className="audit-status-change__new">{orDash(item.giaTriMoi)}</span>
                    </div>
                  </td>
                  <td className="audit-table__cell--actor">{orDash(item.nguoiThucHien)}</td>
                  <td className="audit-table__cell--action">
                    <button className="audit-btn-view" onClick={() => handleViewDetail(item)}>
                      <Eye size={14} /> Xem
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )
    }
  }

  const renderDetailBody = () => {
    if (detailLoading) {
      return (
        <div className="audit-state">
          <Loader2 className="audit-state__icon audit-state__icon--spin" size={28} />
          <p className="audit-state__text">Đang tải chi tiết...</p>
        </div>
      )
    }
    if (detailError) {
      return (
        <div className="audit-state">
          <AlertCircle className="audit-state__icon" size={28} color="#dc2626" />
          <p className="audit-state__text">{detailError}</p>
        </div>
      )
    }
    if (!detail) return null

    if (detail.kind === 'lich-su-nop') {
      const d = detail.data
      return (
        <div className="audit-detail">
          <DetailRow label="Mã log" value={d.maLog} />
          <DetailRow label="Thời gian" value={formatDateTime(d.thoiGian)} />
          <DetailRow label="Loại hoạt động" value="Cập nhật hồ sơ & giấy tờ" />
          <DetailRow label="Sinh viên" value={orDash(d.hoTenSinhVien)} />
          <DetailRow label="MSSV" value={orDash(d.mssv)} />
          <DetailRow label="Mã hồ sơ" value={orDash(d.maHoSo)} />
          <DetailRow label="Loại giấy tờ" value={orDash(d.tenGiayTo)} />
          <DetailRow label="Hành động" value={actionLabel(d.hanhDong)} />
          <DetailRow label="Trạng thái trước" value={orDash(d.trangThaiCu)} />
          <DetailRow label="Trạng thái sau" value={orDash(d.trangThaiMoi)} />
          <DetailRow label="Ghi chú" value={orDash(d.ghiChu)} />
          <DetailRow label="Người thực hiện" value={orDash(d.nguoiThucHien)} />
        </div>
      )
    }

    if (detail.kind === 'phieu') {
      const d = detail.data
      return (
        <div className="audit-detail">
          <DetailRow label="Số phiếu" value={orDash(d.maPhieu)} />
          <DetailRow label="Thời gian tạo" value={formatDateTime(d.ngayTao)} />
          <DetailRow label="Cập nhật lần cuối" value={formatDateTime(d.ngayCapNhat)} />
          <DetailRow label="Sinh viên" value={orDash(d.hoTenSinhVien)} />
          <DetailRow label="MSSV" value={orDash(d.mssv)} />
          <DetailRow label="Lớp" value={orDash(d.tenLop)} />
          <DetailRow label="Ngành" value={orDash(d.tenNganh)} />
          <DetailRow label="Loại phiếu" value={orDash(d.loaiPhieu)} />
          <DetailRow label="Trạng thái" value={orDash(d.trangThai)} />
          <DetailRow label="Ngày mượn" value={formatDate(d.ngayMuon)} />
          <DetailRow label="Hạn trả" value={formatDate(d.ngayTraDuKien)} />
          <DetailRow label="Ngày trả thực tế" value={formatDate(d.ngayTraThucTe)} />
          <DetailRow label="Lý do" value={orDash(d.lyDo)} />
          <DetailRow label="Ghi chú" value={orDash(d.ghiChu)} />
          <DetailRow label="Số giấy tờ trong phiếu" value={String(d.soLuongHoSo ?? 0)} />
          <DetailRow label="Người thực hiện" value={orDash(d.nguoiTao)} />
        </div>
      )
    }

    const d = detail.data
    return (
      <div className="audit-detail">
        <DetailRow label="Mã bản ghi" value={String(d.id)} />
        <DetailRow label="Thời gian" value={formatDateTime(d.thoiGian)} />
        <DetailRow label="Hành động" value={actionLabel(d.hanhDong)} />
        <DetailRow label="Mã hành động" value={orDash(d.hanhDong)} />
        <DetailRow label="Bảng" value={orDash(d.bang)} />
        <DetailRow label="Khoá chính" value={orDash(d.khoaChinh)} />
        <DetailRow label="Sinh viên" value={orDash(d.hoTenSinhVien)} />
        <DetailRow label="MSSV" value={orDash(d.mssv)} />
        <DetailRow label="Trường thay đổi" value={orDash(d.truongThayDoi)} />
        <DetailRow label="Giá trị cũ" value={orDash(d.giaTriCu)} />
        <DetailRow label="Giá trị mới" value={orDash(d.giaTriMoi)} />
        <DetailRow label="Người thực hiện" value={orDash(d.nguoiThucHien)} />
      </div>
    )
  }

  const totalPages = Math.max(1, Math.ceil(totalElements / PAGE_SIZE))
  const startIndex = totalElements === 0 ? 0 : currentPage * PAGE_SIZE + 1
  const endIndex = Math.min((currentPage + 1) * PAGE_SIZE, totalElements)

  const pageNumbers: (number | '...')[] = []
  if (totalPages <= 7) {
    for (let i = 0; i < totalPages; i++) pageNumbers.push(i)
  } else if (currentPage < 4) {
    for (let i = 0; i < 5; i++) pageNumbers.push(i)
    pageNumbers.push('...')
    pageNumbers.push(totalPages - 1)
  } else if (currentPage >= totalPages - 3) {
    pageNumbers.push(0)
    pageNumbers.push('...')
    for (let i = totalPages - 5; i < totalPages; i++) pageNumbers.push(i)
  } else {
    pageNumbers.push(0)
    pageNumbers.push('...')
    pageNumbers.push(currentPage)
    pageNumbers.push(currentPage + 1)
    pageNumbers.push(currentPage + 2)
    pageNumbers.push('...')
    pageNumbers.push(totalPages - 1)
  }

  return (
    <div className="trang-lich-su-audit">
      {/* Header */}
      <div className="audit-header">
        <h1 className="audit-header__title">Lịch sử hoạt động</h1>
        <p className="audit-header__subtitle">
          Theo dõi toàn bộ hoạt động phát sinh trong hệ thống — dữ liệu lấy trực tiếp từ máy chủ
        </p>
      </div>

      {/* Tabs */}
      <div className="audit-tabs" role="tablist">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            className={`audit-tab ${activeTab === tab.id ? 'audit-tab--active' : ''}`}
            onClick={() => handleTabChange(tab.id)}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="audit-filters">
        <div className="audit-filters__row">
          <div className="audit-filters__search">
            <Search size={16} />
            <input
              type="text"
              placeholder="Tìm theo MSSV, họ tên, mã hồ sơ, mã phiếu..."
              value={keyword}
              onChange={(e) => {
                setKeyword(e.target.value)
                setCurrentPage(0)
              }}
            />
          </div>

          <select
            className="audit-filters__select"
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value)
              setCurrentPage(0)
            }}
            aria-label="Lọc theo loại hoạt động"
          >
            <option value="">Tất cả loại hoạt động</option>
            {activeTab === 'ho-so' && (
              <>
                <option value="TAO_MOI">TAO_MOI — Tạo mới hồ sơ (nhập Excel)</option>
                <option value="CAP_NHAT">CAP_NHAT — Cập nhật hồ sơ (nhập Excel)</option>
                <option value="Tạo hồ sơ">Tạo hồ sơ</option>
                <option value="Nộp giấy tờ">Nộp giấy tờ</option>
                <option value="Hủy nộp">Hủy nộp</option>
                <option value="Đánh dấu thiếu">Đánh dấu thiếu</option>
                <option value="Bổ sung đầy đủ">Bổ sung đầy đủ</option>
                <option value="Đánh dấu không hợp lệ">Đánh dấu không hợp lệ</option>
                <option value="Hợp lệ trở lại">Hợp lệ trở lại</option>
                <option value="Cập nhật trạng thái">Cập nhật trạng thái</option>
              </>
            )}
            {(activeTab === 'muon-tra' || activeTab === 'rut-ho-so') && (
              <>
                <option value="Chờ duyệt">Chờ duyệt</option>
                <option value="Đã duyệt">Đã duyệt</option>
                <option value="Đang mượn">Đang mượn</option>
                <option value="Đã trả">Đã trả</option>
                <option value="Quá hạn">Quá hạn</option>
                <option value="Hoàn tất">Hoàn tất</option>
                <option value="Từ chối">Từ chối</option>
              </>
            )}
            {(activeTab === 'thong-tin-sv' || activeTab === 'he-thong') && (
              <>
                <option value="BULK_UPDATE_TRANG_THAI">Cập nhật trạng thái học vụ</option>
                <option value="BULK_UPDATE_TRANG_THAI_NOTE">Ghi chú cập nhật trạng thái</option>
                <option value="BULK_DELETE_SINHVIEN">Xóa sinh viên (bulk)</option>
                <option value="RUT_VINH_VIEN">Rút hồ sơ vĩnh viễn</option>
                <option value="CREATE_PHIEU">Tạo phiếu</option>
                <option value="CREATE_PHIEU_BULK">Tạo phiếu hàng loạt</option>
                <option value="DUYET_PHIEU">Duyệt phiếu</option>
                <option value="TU_CHOI_PHIEU">Từ chối phiếu</option>
                <option value="TRA_PHIEU">Trả phiếu</option>
                <option value="AUTO_QUA_HAN">Tự động đánh dấu quá hạn</option>
                <option value="LOGIN_SUCCESS">Đăng nhập thành công</option>
                <option value="LOGIN_FAILED">Đăng nhập thất bại</option>
                <option value="LOGOUT">Đăng xuất</option>
                <option value="CREATE_USER">Tạo tài khoản</option>
                <option value="UPDATE_ROLE">Đổi vai trò</option>
                <option value="ACTIVATE_USER">Kích hoạt tài khoản</option>
                <option value="DEACTIVATE_USER">Vô hiệu hoá tài khoản</option>
                <option value="UPDATE_PROFILE">Cập nhật hồ sơ cá nhân</option>
              </>
            )}
          </select>

          <div className="audit-filters__date">
            <input
              type="date"
              aria-label="Từ ngày"
              value={fromDate}
              onChange={(e) => {
                setFromDate(e.target.value)
                setCurrentPage(0)
              }}
            />
          </div>

          <div className="audit-filters__date">
            <input
              type="date"
              aria-label="Đến ngày"
              value={toDate}
              onChange={(e) => {
                setToDate(e.target.value)
                setCurrentPage(0)
              }}
            />
          </div>

          <div className="audit-filters__search audit-filters__search--actor">
            <input
              type="text"
              placeholder="Người thực hiện (username)"
              value={actor}
              onChange={(e) => {
                setActor(e.target.value)
                setCurrentPage(0)
              }}
            />
          </div>

          <button className="audit-btn audit-btn--reset" onClick={handleReset}>
            <RotateCcw size={16} /> Đặt lại
          </button>
        </div>
      </div>

      {/* Table card */}
      <div className="audit-table-card">
        <div className="audit-table-card__header">
          <h3 className="audit-table-card__title">
            {activeTabDef.icon}
            {activeTabDef.label}
          </h3>
          <span className="audit-table-card__hint">{activeTabDef.description}</span>
        </div>

        <div className="audit-table-wrapper">{renderTable()}</div>

        <div className="audit-pagination">
          <span className="audit-pagination__info">
            {totalElements === 0
              ? 'Không có kết quả'
              : `Hiển thị ${startIndex}-${endIndex} của ${totalElements} kết quả`}
          </span>
          <div className="audit-pagination__controls">
            <button
              className="audit-pagination__btn"
              disabled={currentPage === 0 || isLoading}
              onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
              aria-label="Trang trước"
            >
              <ChevronLeft size={16} />
            </button>
            {pageNumbers.map((page, index) =>
              typeof page === 'number' ? (
                <button
                  key={index}
                  className={`audit-pagination__btn ${currentPage === page ? 'audit-pagination__btn--active' : ''}`}
                  onClick={() => setCurrentPage(page)}
                >
                  {page + 1}
                </button>
              ) : (
                <span key={index} className="audit-pagination__ellipsis">
                  ...
                </span>
              )
            )}
            <button
              className="audit-pagination__btn"
              disabled={currentPage >= totalPages - 1 || isLoading}
              onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
              aria-label="Trang sau"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Detail modal */}
      <Modal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        title={`Chi tiết — ${activeTabDef.label}`}
        size="md"
      >
        {renderDetailBody()}
      </Modal>
    </div>
  )
}

/** Một dòng chi tiết trong modal. */
function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="audit-detail__row">
      <span className="audit-detail__label">{label}</span>
      <span className="audit-detail__value">{value}</span>
    </div>
  )
}
