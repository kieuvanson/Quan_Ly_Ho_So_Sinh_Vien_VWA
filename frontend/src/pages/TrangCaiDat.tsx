import { useState, useCallback, useRef } from 'react'
import './TrangCaiDat.css'
import { danhMucApi } from '../api/danhMuc'
import { loaiGiayToApi } from '../api/loaiGiayTo'
import { userApi, type UserResponse } from '../api/user'
import type {
  Khoa, Nganh, KhoaHoc, Lop,
  TrangThaiHocVuItem, TrangThaiNopItem, TrangThaiPhieuItem,
  KhoaRequest, NganhRequest, KhoaHocRequest, LopRequest,
} from '../api/types'

// ============ MOCK CÒN LẠI ============
interface LyDoRutHoSo { id: number; tenLyDo: string; trangThai: string }
interface LichSuSaoLuu { id: number; thoiGian: string; nguoiThucHien: string; loai: string; dungLuong: string; trangThai: string }

const MOCK_LY_DO_RUT_HO_SO: LyDoRutHoSo[] = [
  { id: 1, tenLyDo: 'Chuyển trường', trangThai: 'Đang sử dụng' },
  { id: 2, tenLyDo: 'Thôi học', trangThai: 'Đang sử dụng' },
  { id: 3, tenLyDo: 'Hoàn thành chương trình', trangThai: 'Đang sử dụng' },
  { id: 4, tenLyDo: 'Lý do cá nhân', trangThai: 'Đang sử dụng' },
  { id: 5, tenLyDo: 'Khác', trangThai: 'Đang sử dụng' },
]
const MOCK_LICH_SU_SAO_LUU: LichSuSaoLuu[] = [
  { id: 1, thoiGian: '28/09/2026 17:30', nguoiThucHien: 'System', loai: 'Tự động', dungLuong: '125 MB', trangThai: 'Thành công' },
  { id: 2, thoiGian: '27/09/2026 17:30', nguoiThucHien: 'System', loai: 'Tự động', dungLuong: '124 MB', trangThai: 'Thành công' },
  { id: 3, thoiGian: '26/09/2026 17:30', nguoiThucHien: 'System', loai: 'Tự động', dungLuong: '123 MB', trangThai: 'Thành công' },
  { id: 4, thoiGian: '25/09/2026 10:00', nguoiThucHien: 'Nguyễn Thị A', loai: 'Thủ công', dungLuong: '122 MB', trangThai: 'Thành công' },
]

// ============ ICONS ============
const Icons = {
  book: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>,
  file: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>,
  tag: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z"/><circle cx="7.5" cy="7.5" r=".5"/></svg>,
  users: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  refresh: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3 4 7l4 4"/><path d="M4 7h16"/><path d="m16 21 4-4-4-4"/><path d="M20 17H4"/></svg>,
  download: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
  building: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/></svg>,
  database: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5V19A9 3 0 0 0 21 19V5"/><path d="M3 12A9 3 0 0 0 21 12"/></svg>,
  chevronRight: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>,
  chevronDown: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>,
  plus: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>,
  search: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>,
  edit: <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>,
  trash: <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>,
  x: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>,
  check: <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  downloadCloud: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"/><path d="M12 12v9"/><path d="m16 16-4-4-4 4"/></svg>,
  upload: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>,
  clock: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  lock: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
  unlock: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></svg>,
  image: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>,
  alertCircle: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
  refreshCw: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/></svg>,
  warning: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
}

// ============ MENU ============
interface MenuItem { id: string; label: string; icon: React.ReactNode; parentId?: string }
const MENU_ITEMS: MenuItem[] = [
  { id: 'danh-muc-dao-tao', label: 'Danh mục đào tạo', icon: Icons.book },
  { id: 'khoa', label: 'Khoa chuyên môn', icon: Icons.book, parentId: 'danh-muc-dao-tao' },
  { id: 'nganh', label: 'Ngành', icon: Icons.book, parentId: 'danh-muc-dao-tao' },
  { id: 'khoa-nam-hoc', label: 'Khóa năm học', icon: Icons.book, parentId: 'danh-muc-dao-tao' },
  { id: 'lop', label: 'Lớp hành chính', icon: Icons.book, parentId: 'danh-muc-dao-tao' },
  { id: 'danh-muc-ho-so', label: 'Danh mục hồ sơ', icon: Icons.file },
  { id: 'loai-giay-to', label: 'Loại giấy tờ', icon: Icons.file, parentId: 'danh-muc-ho-so' },
  { id: 'trang-thai', label: 'Trạng thái', icon: Icons.tag },
  { id: 'trang-thai-hoc-vu', label: 'Trạng thái học vụ', icon: Icons.tag, parentId: 'trang-thai' },
  { id: 'trang-thai-ho-so', label: 'Trạng thái hồ sơ', icon: Icons.tag, parentId: 'trang-thai' },
  { id: 'trang-thai-giay-to', label: 'Trạng thái giấy tờ', icon: Icons.tag, parentId: 'trang-thai' },
  { id: 'nguoi-dung', label: 'Người dùng & Phân quyền', icon: Icons.users },
  { id: 'cau-hinh-muon-tra', label: 'Mượn / trả hồ sơ', icon: Icons.refresh },
  { id: 'cau-hinh-rut-ho-so', label: 'Rút hồ sơ', icon: Icons.download },
  { id: 'thong-tin-he-thong', label: 'Thông tin hệ thống', icon: Icons.building },
  { id: 'sao-luu-du-lieu', label: 'Sao lưu & dữ liệu', icon: Icons.database },
]
const getMenuTree = () => {
  const parents = MENU_ITEMS.filter(m => !m.parentId)
  return parents.map(parent => ({ ...parent, children: MENU_ITEMS.filter(m => m.parentId === parent.id) }))
}

// ============ SHARED COMPONENTS ============
function Modal({ isOpen, onClose, title, children, footer }: { isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode; footer?: React.ReactNode }) {
  if (!isOpen) return null
  return (
    <div className="cai-dat-modal-overlay" onClick={onClose}>
      <div className="cai-dat-modal" onClick={(e) => e.stopPropagation()}>
        <div className="cai-dat-modal__header">
          <h3 className="cai-dat-modal__title">{title}</h3>
          <button className="cai-dat-modal__close" onClick={onClose}>{Icons.x}</button>
        </div>
        <div className="cai-dat-modal__body">{children}</div>
        {footer && <div className="cai-dat-modal__footer">{footer}</div>}
      </div>
    </div>
  )
}
function StatusBadge({ status }: { status: string }) {
  const statusClass = status.toLowerCase().replace(/ /g, '-')
  return <span className={`cai-dat-badge cai-dat-badge--${statusClass}`}>{status}</span>
}
function ColorBadge({ label, color }: { label: string; color: string }) {
  return <span className={`cai-dat-color-badge cai-dat-color-badge--${color}`}>{label}</span>
}
function Toggle({ checked, onChange }: { checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <label className="cai-dat-toggle">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="cai-dat-toggle__slider"></span>
    </label>
  )
}
interface TableColumn { key: string; label: string; width?: string }
interface TableProps<T> { columns: TableColumn[]; data: T[]; renderRow: (item: T, index: number) => React.ReactNode }
function Table<T>({ columns, data, renderRow }: TableProps<T>) {
  return (
    <div className="cai-dat-table-wrapper">
      <table className="cai-dat-table">
        <thead><tr>{columns.map(col => <th key={col.key} className="cai-dat-table__header" style={{ width: col.width }}>{col.label}</th>)}</tr></thead>
        <tbody>{data.map((item, index) => renderRow(item, index))}</tbody>
      </table>
    </div>
  )
}
function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="cai-dat-section-header">
      <h2 className="cai-dat-section-header__title">{title}</h2>
      {subtitle && <p className="cai-dat-section-header__subtitle">{subtitle}</p>}
    </div>
  )
}
function Toolbar({ searchPlaceholder, filters, actionButton, showImportExport = true, onImport, onExport }: {
  searchPlaceholder?: string
  filters?: React.ReactNode
  actionButton?: React.ReactNode
  showImportExport?: boolean
  onImport?: () => void
  onExport?: () => void
}) {
  return (
    <div className="cai-dat-toolbar">
      <div className="cai-dat-toolbar__left">
        {searchPlaceholder && (
          <div className="cai-dat-toolbar__search">{Icons.search}<input type="text" placeholder={searchPlaceholder} /></div>
        )}
        {filters}
      </div>
      <div className="cai-dat-toolbar__right">
        {showImportExport && (
          <>
            {onImport && <button className="cai-dat-btn cai-dat-btn--outline" onClick={onImport}>Import</button>}
            {onExport && <button className="cai-dat-btn cai-dat-btn--outline" onClick={onExport}>Export</button>}
          </>
        )}
        {actionButton}
      </div>
    </div>
  )
}
function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="cai-dat-card">
      {title && <h3 className="cai-dat-card__title">{title}</h3>}
      <div className="cai-dat-card__content">{children}</div>
    </div>
  )
}
function DataStateHandler({ loading, error, onRetry, emptyMessage = 'Chưa có dữ liệu.', children }: { loading: boolean; error: string | null; onRetry: () => void; emptyMessage?: string; children: React.ReactNode }) {
  if (loading) return <div className="cai-dat-state"><div className="cai-dat-state__spinner"></div><p>Đang tải dữ liệu...</p></div>
  if (error) return <div className="cai-dat-state cai-dat-state--error"><div className="cai-dat-state__icon">{Icons.alertCircle}</div><p className="cai-dat-state__message">{error}</p><button className="cai-dat-btn cai-dat-btn--primary" onClick={onRetry}>{Icons.refreshCw} Thử tải lại</button></div>
  if (Array.isArray(children) && children.length === 0) return <div className="cai-dat-state"><div className="cai-dat-state__icon">{Icons.file}</div><p className="cai-dat-state__message">{emptyMessage}</p></div>
  return <>{children}</>
}
function trangThaiLabel(dangSuDung: boolean) { return dangSuDung ? 'Đang sử dụng' : 'Ngừng sử dụng' }
function vaiTroLabel(role: string) {
  switch (role) { case 'ADMIN': return 'Quản trị viên'; case 'STAFF': return 'Cán bộ đào tạo'; default: return role }
}
function trangThaiHoatDongLabel(isActive: boolean) { return isActive ? 'Hoạt động' : 'Khóa' }

// ============ CRUD HOOK ============
type CrudStatus = 'idle' | 'loading' | 'error'

interface UseCrudResult<T> {
  items: T[]
  loading: boolean
  fetchError: string | null
  crudStatus: CrudStatus
  crudError: string | null
  fetch: () => void
  create: (data: unknown) => Promise<boolean>
  update: (id: number, data: unknown) => Promise<boolean>
  remove: (id: number) => Promise<boolean>
  clearError: () => void
}

function useCrudData<T>(
  fetchFn: () => Promise<T[]>,
  createFn: (data: unknown) => Promise<unknown>,
  updateFn: (id: number, data: unknown) => Promise<unknown>,
  deleteFn: (id: number) => Promise<unknown>,
): UseCrudResult<T> {
  const [items, setItems] = useState<T[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [crudStatus, setCrudStatus] = useState<CrudStatus>('idle')
  const [crudError, setCrudError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    setFetchError(null)
    try {
      const result = await fetchFn()
      setItems(result)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Đã xảy ra lỗi khi tải dữ liệu.'
      setFetchError(msg)
    } finally {
      setLoading(false)
    }
  }, [fetchFn])

  const create = useCallback(async (data: unknown): Promise<boolean> => {
    setCrudStatus('loading')
    setCrudError(null)
    try {
      await createFn(data)
      await fetch()
      setCrudStatus('idle')
      return true
    } catch (err: unknown) {
      let msg = 'Đã xảy ra lỗi khi tạo dữ liệu.'
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as { response?: { data?: { message?: string; code?: string } } }
        msg = axiosErr.response?.data?.message || msg
      } else if (err instanceof Error) {
        msg = err.message
      }
      setCrudError(msg)
      setCrudStatus('error')
      return false
    }
  }, [createFn, fetch])

  const update = useCallback(async (id: number, data: unknown): Promise<boolean> => {
    setCrudStatus('loading')
    setCrudError(null)
    try {
      await updateFn(id, data)
      await fetch()
      setCrudStatus('idle')
      return true
    } catch (err: unknown) {
      let msg = 'Đã xảy ra lỗi khi cập nhật dữ liệu.'
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as { response?: { data?: { message?: string; code?: string } } }
        msg = axiosErr.response?.data?.message || msg
      } else if (err instanceof Error) {
        msg = err.message
      }
      setCrudError(msg)
      setCrudStatus('error')
      return false
    }
  }, [updateFn, fetch])

  const remove = useCallback(async (id: number): Promise<boolean> => {
    setCrudStatus('loading')
    setCrudError(null)
    try {
      await deleteFn(id)
      await fetch()
      setCrudStatus('idle')
      return true
    } catch (err: unknown) {
      let msg = 'Đã xảy ra lỗi khi xóa dữ liệu.'
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as { response?: { data?: { message?: string; code?: string } } }
        msg = axiosErr.response?.data?.message || msg
      } else if (err instanceof Error) {
        msg = err.message
      }
      setCrudError(msg)
      setCrudStatus('error')
      return false
    }
  }, [deleteFn, fetch])

  const clearError = useCallback(() => {
    setCrudError(null)
    setCrudStatus('idle')
  }, [])

  // Initial fetch
  useState(() => { fetch() })

  return { items, loading, fetchError, crudStatus, crudError, fetch, create, update, remove, clearError }
}

// ============ CONFIRM DIALOG ============
function ConfirmDialog({ isOpen, onConfirm, onCancel, title, message, loading }: { isOpen: boolean; onConfirm: () => void; onCancel: () => void; title: string; message: string; loading: boolean }) {
  if (!isOpen) return null
  return (
    <div className="cai-dat-modal-overlay" onClick={onCancel}>
      <div className="cai-dat-modal" style={{ maxWidth: '400px' }} onClick={(e) => e.stopPropagation()}>
        <div className="cai-dat-modal__header">
          <h3 className="cai-dat-modal__title">{title}</h3>
          <button className="cai-dat-modal__close" onClick={onCancel}>{Icons.x}</button>
        </div>
        <div className="cai-dat-modal__body">
          <p style={{ margin: 0, color: 'var(--color-text)' }}>{message}</p>
        </div>
        <div className="cai-dat-modal__footer">
          <button className="cai-dat-btn cai-dat-btn--secondary" onClick={onCancel} disabled={loading}>Hủy</button>
          <button className="cai-dat-btn cai-dat-btn--danger" onClick={onConfirm} disabled={loading}>
            {loading ? 'Đang xóa...' : 'Xóa'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ============ FORM FIELD HELPERS ============
interface FormFieldProps { label: string; required?: boolean; error?: string; children: React.ReactNode }
function FormField({ label, required, error, children }: FormFieldProps) {
  return (
    <div className="cai-dat-form__group">
      <label className="cai-dat-form__label">
        {label}{required && <span style={{ color: 'red' }}> *</span>}
      </label>
      {children}
      {error && <p style={{ color: 'var(--color-danger)', fontSize: '12px', margin: '4px 0 0' }}>{error}</p>}
    </div>
  )
}

interface SelectOption { value: string | number; label: string }

// ============ CONTENT: KHOA CHUYÊN MÔN ============
function KhoaContent() {
  const [modalOpen, setModalOpen] = useState(false)
  const [editItem, setEditItem] = useState<Khoa | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Khoa | null>(null)

  const [form, setForm] = useState({ tenKhoa: '', moTa: '', dangSuDung: true })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  // Import modal state
  const [importOpen, setImportOpen] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importLoading, setImportLoading] = useState(false)
  const [importResult, setImportResult] = useState<import('../api/danhMuc').ImportResult | null>(null)
  const [importError, setImportError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { items, loading, fetchError, crudStatus, crudError, fetch, create, update, remove, clearError } = useCrudData<Khoa>(
    () => danhMucApi.getKhoa().then(r => r.data),
    (data) => danhMucApi.createKhoa(data as KhoaRequest),
    (id, data) => danhMucApi.updateKhoa(id, data as KhoaRequest),
    (id) => danhMucApi.deleteKhoa(id),
  )

  const openAdd = () => { setEditItem(null); setForm({ tenKhoa: '', moTa: '', dangSuDung: true }); setFormErrors({}); clearError(); setModalOpen(true) }
  const openEdit = (item: Khoa) => { setEditItem(item); setForm({ tenKhoa: item.tenKhoa, moTa: item.moTa || '', dangSuDung: item.dangSuDung }); setFormErrors({}); clearError(); setModalOpen(true) }
  const closeModal = () => { setModalOpen(false); clearError() }

  const validate = () => {
    const errors: Record<string, string> = {}
    if (!form.tenKhoa.trim()) errors.tenKhoa = 'Tên khoa không được để trống.'
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return
    const data: KhoaRequest = { tenKhoa: form.tenKhoa.trim(), moTa: form.moTa.trim() || null, dangSuDung: form.dangSuDung }
    let ok: boolean
    if (editItem) ok = await update(editItem.id, data)
    else ok = await create(data)
    if (ok) closeModal()
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    const ok = await remove(deleteTarget.id)
    if (ok) setDeleteTarget(null)
  }

  // Import/Export handlers
  const handleExport = () => { danhMucApi.exportKhoa() }
  const handleDownloadTemplate = () => { danhMucApi.downloadKhoaTemplate() }
  const openImport = () => { setImportFile(null); setImportResult(null); setImportError(null); setImportOpen(true) }
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null
    setImportFile(f)
    setImportResult(null)
    setImportError(null)
  }
  const handleImport = async () => {
    if (!importFile) return
    setImportLoading(true)
    setImportError(null)
    try {
      const r = await danhMucApi.importKhoa(importFile)
      setImportResult(r.data)
      if (r.data.failureCount === 0) { await fetch() }
    } catch (err: unknown) {
      let msg = 'Đã xảy ra lỗi khi import.'
      if (err && typeof err === 'object' && 'response' in err) {
        const e = err as { response?: { data?: { message?: string } } }
        msg = e.response?.data?.message || msg
      }
      setImportError(msg)
    } finally { setImportLoading(false) }
  }

  const columns = [
    { key: 'stt', label: 'STT', width: '55px' },
    { key: 'maKhoa', label: 'Mã khoa', width: '100px' },
    { key: 'tenKhoa', label: 'Tên khoa', width: '' },
    { key: 'trangThai', label: 'Trạng thái', width: '' },
    { key: 'thaoTac', label: 'Thao tác', width: '130px' },
  ]

  return (
    <div className="cai-dat-content">
      <SectionHeader title="QUẢN LÝ KHOA CHUYÊN MÔN" subtitle="Quản lý các khoa chuyên môn trong trường" />
      <Toolbar
        searchPlaceholder="Tìm khoa..."
        onImport={openImport}
        onExport={handleExport}
        actionButton={<button className="cai-dat-btn cai-dat-btn--primary" onClick={openAdd}>{Icons.plus} Thêm khoa</button>}
      />
      <DataStateHandler loading={loading} error={fetchError} onRetry={fetch} emptyMessage="Chưa có khoa nào.">
        {items.length > 0 && (
          <Table columns={columns} data={items} renderRow={(item, index) => (
            <tr key={item.id}>
              <td className="cai-dat-table__cell cai-dat-table__cell--center cai-dat-table__cell--nowrap">{String(index + 1).padStart(2, '0')}</td>
              <td className="cai-dat-table__cell cai-dat-table__cell--nowrap">{item.maKhoa}</td>
              <td className="cai-dat-table__cell">{item.tenKhoa}</td>
              <td className="cai-dat-table__cell cai-dat-table__cell--nowrap"><StatusBadge status={trangThaiLabel(item.dangSuDung)} /></td>
              <td className="cai-dat-table__cell cai-dat-table__cell--center cai-dat-table__cell--nowrap">
                <button className="cai-dat-btn-action" onClick={() => openEdit(item)}>{Icons.edit} Sửa</button>
                <button className="cai-dat-btn-action cai-dat-btn-action--danger" style={{ marginLeft: '4px' }} onClick={() => setDeleteTarget(item)}>{Icons.trash} Xóa</button>
              </td>
            </tr>
          )} />
        )}
      </DataStateHandler>

      {/* Form Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={closeModal}
        title={editItem ? 'SỬA KHOA' : 'THÊM KHOA'}
        footer={
          <>
            <button className="cai-dat-btn cai-dat-btn--secondary" onClick={closeModal}>Hủy</button>
            <button className="cai-dat-btn cai-dat-btn--primary" onClick={handleSubmit} disabled={crudStatus === 'loading'}>
              {crudStatus === 'loading' ? 'Đang lưu...' : 'Lưu'}
            </button>
          </>
        }
      >
        <div className="cai-dat-form">
          <FormField label="Tên khoa" required error={formErrors.tenKhoa}>
            <input className="cai-dat-form__input" value={form.tenKhoa} onChange={e => setForm(p => ({ ...p, tenKhoa: e.target.value }))} placeholder="Ví dụ: Khoa Công nghệ thông tin" />
          </FormField>
          <FormField label="Mô tả" error={formErrors.moTa}>
            <textarea className="cai-dat-form__textarea" value={form.moTa} onChange={e => setForm(p => ({ ...p, moTa: e.target.value }))} placeholder="Mô tả ngắn (tùy chọn)" rows={3} />
          </FormField>
          <FormField label="Trạng thái sử dụng" error={formErrors.dangSuDung}>
            <select className="cai-dat-form__select" value={form.dangSuDung ? 'true' : 'false'} onChange={e => setForm(p => ({ ...p, dangSuDung: e.target.value === 'true' }))}>
              <option value="true">Đang sử dụng</option>
              <option value="false">Ngừng sử dụng</option>
            </select>
          </FormField>
          {crudError && <p style={{ color: 'var(--color-danger)', margin: '0 0 12px', fontSize: '13px' }}>{Icons.warning} {crudError}</p>}
        </div>
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        title="Xác nhận xóa"
        message={`Bạn có chắc chắn muốn xóa khoa "${deleteTarget?.tenKhoa}"? Hành động này không thể hoàn tác.`}
        loading={crudStatus === 'loading'}
      />

      {/* Import Modal */}
      <Modal
        isOpen={importOpen}
        onClose={() => setImportOpen(false)}
        title="Import khoa từ Excel"
        footer={
          <>
            <button className="cai-dat-btn cai-dat-btn--secondary" onClick={() => setImportOpen(false)}>Đóng</button>
            {!importResult && (
              <button
                className="cai-dat-btn cai-dat-btn--primary"
                onClick={handleImport}
                disabled={!importFile || importLoading}
              >
                {importLoading ? 'Đang import...' : 'Import'}
              </button>
            )}
            {importResult && (
              <button className="cai-dat-btn cai-dat-btn--primary" onClick={() => setImportOpen(false)}>Đóng</button>
            )}
          </>
        }
      >
        {!importResult ? (
          <div className="cai-dat-import">
            <p style={{ margin: '0 0 12px', color: 'var(--color-text-muted)', fontSize: '13px' }}>
              Chỉ chấp nhận file .xlsx hoặc .xls. <button className="cai-dat-btn-link" onClick={handleDownloadTemplate}>Tải file mẫu</button>
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              style={{ marginBottom: '12px' }}
            />
            {importFile && <p style={{ fontSize: '13px', color: 'var(--color-text)' }}>{Icons.file} {importFile.name} ({(importFile.size / 1024).toFixed(1)} KB)</p>}
            {importError && <p style={{ color: 'var(--color-danger)', fontSize: '13px' }}>{Icons.warning} {importError}</p>}
          </div>
        ) : (
          <div className="cai-dat-import-result">
            <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
              <div className="cai-dat-import-stat cai-dat-import-stat--success">
                <strong>{importResult.newCount}</strong><br /><span>Đã thêm mới</span>
              </div>
              <div className="cai-dat-import-stat cai-dat-import-stat--danger">
                <strong>{importResult.failureCount}</strong><br /><span>Bị lỗi</span>
              </div>
              <div className="cai-dat-import-stat">
                <strong>{importResult.totalRows}</strong><br /><span>Tổng dòng</span>
              </div>
            </div>
            {importResult.errors.length > 0 && (
              <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid var(--color-border)', borderRadius: '4px', padding: '8px' }}>
                <p style={{ margin: '0 0 8px', fontWeight: 600, fontSize: '13px' }}>Lỗi theo dòng:</p>
                <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '12px' }}>
                  {importResult.errors.map((err, i) => (
                    <li key={i}>Dòng {err.rowNumber}: {err.message}</li>
                  ))}
                </ul>
              </div>
            )}
            {importResult.failureCount === 0 && (
              <p style={{ color: 'var(--color-success)', fontSize: '13px', marginTop: '8px' }}>
                {Icons.check} Import thành công!
              </p>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}

// ============ CONTENT: NGÀNH ============
function NganhContent() {
  const [modalOpen, setModalOpen] = useState(false)
  const [editItem, setEditItem] = useState<Nganh | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Nganh | null>(null)

  // Load danh sách khoa cho dropdown
  const [khoaList, setKhoaList] = useState<Khoa[]>([])
  const [khoaLoading, setKhoaLoading] = useState(true)

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  useState(() => {
    danhMucApi.getKhoa()
      .then(r => setKhoaList(r.data))
      .catch(() => { })
      .finally(() => setKhoaLoading(false))
  })

  const [form, setForm] = useState({ khoaId: 0, tenNganh: '', moTa: '', dangSuDung: true })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  // Import modal state
  const [importOpen, setImportOpen] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importLoading, setImportLoading] = useState(false)
  const [importResult, setImportResult] = useState<import('../api/danhMuc').ImportResult | null>(null)
  const [importError, setImportError] = useState<string | null>(null)
  const nganhFileRef = useRef<HTMLInputElement>(null)

  const { items, loading, fetchError, crudStatus, crudError, fetch, create, update, remove, clearError } = useCrudData<Nganh>(
    () => danhMucApi.getNganh().then(r => r.data),
    (data) => danhMucApi.createNganh(data as NganhRequest),
    (id, data) => danhMucApi.updateNganh(id, data as NganhRequest),
    (id) => danhMucApi.deleteNganh(id),
  )

  const openAdd = () => {
    setEditItem(null)
    setForm({ khoaId: khoaList[0]?.id || 0, tenNganh: '', moTa: '', dangSuDung: true })
    setFormErrors({})
    clearError()
    setModalOpen(true)
  }
  const openEdit = (item: Nganh) => {
    setEditItem(item)
    setForm({ khoaId: item.khoa?.id || 0, tenNganh: item.tenNganh, moTa: item.moTa || '', dangSuDung: item.dangSuDung })
    setFormErrors({})
    clearError()
    setModalOpen(true)
  }
  const closeModal = () => { setModalOpen(false); clearError() }

  const validate = () => {
    const errors: Record<string, string> = {}
    if (!form.khoaId) errors.khoaId = 'Vui lòng chọn khoa.'
    if (!form.tenNganh.trim()) errors.tenNganh = 'Tên ngành không được để trống.'
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return
    // Khoa là bắt buộc
    const data: NganhRequest = { khoaId: form.khoaId, tenNganh: form.tenNganh.trim(), moTa: form.moTa.trim() || null, dangSuDung: form.dangSuDung }
    let ok: boolean
    if (editItem) ok = await update(editItem.id, data)
    else ok = await create(data)
    if (ok) closeModal()
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    const ok = await remove(deleteTarget.id)
    if (ok) setDeleteTarget(null)
  }

  // Import/Export handlers
  const handleExport = () => { danhMucApi.exportNganh() }
  const handleDownloadTemplate = () => { danhMucApi.downloadNganhTemplate() }
  const openImport = () => { setImportFile(null); setImportResult(null); setImportError(null); setImportOpen(true) }
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null
    setImportFile(f); setImportResult(null); setImportError(null)
  }
  const handleImport = async () => {
    if (!importFile) return
    setImportLoading(true); setImportError(null)
    try {
      const r = await danhMucApi.importNganh(importFile)
      setImportResult(r.data)
      if (r.data.failureCount === 0) { await fetch() }
    } catch (err: unknown) {
      let msg = 'Đã xảy ra lỗi khi import.'
      if (err && typeof err === 'object' && 'response' in err) {
        const e = err as { response?: { data?: { message?: string } } }
        msg = e.response?.data?.message || msg
      }
      setImportError(msg)
    } finally { setImportLoading(false) }
  }

  const columns = [
    { key: 'stt', label: 'STT', width: '55px' },
    { key: 'maNganh', label: 'Mã ngành', width: '110px' },
    { key: 'tenNganh', label: 'Tên ngành', width: '' },
    { key: 'khoa', label: 'Khoa', width: '' },
    { key: 'trangThai', label: 'Trạng thái', width: '' },
    { key: 'thaoTac', label: 'Thao tác', width: '130px' },
  ]

  return (
    <div className="cai-dat-content">
      <SectionHeader title="QUẢN LÝ NGÀNH" subtitle="Quản lý các ngành đào tạo thuộc các khoa chuyên môn" />
      <Toolbar
        searchPlaceholder="Tìm ngành..."
        onImport={openImport}
        onExport={handleExport}
        actionButton={<button className="cai-dat-btn cai-dat-btn--primary" onClick={openAdd} disabled={khoaLoading}>{Icons.plus} Thêm ngành</button>}
      />
      <DataStateHandler loading={loading} error={fetchError} onRetry={fetch} emptyMessage="Chưa có ngành nào.">
        {items.length > 0 && (
          <Table columns={columns} data={items} renderRow={(item, index) => (
            <tr key={item.id}>
              <td className="cai-dat-table__cell cai-dat-table__cell--center cai-dat-table__cell--nowrap">{String(index + 1).padStart(2, '0')}</td>
              <td className="cai-dat-table__cell cai-dat-table__cell--nowrap">{item.maNganh}</td>
              <td className="cai-dat-table__cell">{item.tenNganh}</td>
              <td className="cai-dat-table__cell">{item.khoa?.tenKhoa || '-'}</td>
              <td className="cai-dat-table__cell cai-dat-table__cell--nowrap"><StatusBadge status={trangThaiLabel(item.dangSuDung)} /></td>
              <td className="cai-dat-table__cell cai-dat-table__cell--center cai-dat-table__cell--nowrap">
                <button className="cai-dat-btn-action" onClick={() => openEdit(item)}>{Icons.edit} Sửa</button>
                <button className="cai-dat-btn-action cai-dat-btn-action--danger" style={{ marginLeft: '4px' }} onClick={() => setDeleteTarget(item)}>{Icons.trash} Xóa</button>
              </td>
            </tr>
          )} />
        )}
      </DataStateHandler>

      <Modal
        isOpen={modalOpen}
        onClose={closeModal}
        title={editItem ? 'SỬA NGÀNH' : 'THÊM NGÀNH'}
        footer={<><button className="cai-dat-btn cai-dat-btn--secondary" onClick={closeModal}>Hủy</button><button className="cai-dat-btn cai-dat-btn--primary" onClick={handleSubmit} disabled={crudStatus === 'loading'}>{crudStatus === 'loading' ? 'Đang lưu...' : 'Lưu'}</button></>}
      >
        <div className="cai-dat-form">
          <FormField label="Khoa" required error={formErrors.khoaId}>
            <select className="cai-dat-form__select" value={form.khoaId || ''} onChange={e => setForm(p => ({ ...p, khoaId: Number(e.target.value) }))}>
              <option value="">-- Chọn khoa --</option>
              {khoaList.map(k => <option key={k.id} value={k.id}>{k.tenKhoa}</option>)}
            </select>
          </FormField>
          <FormField label="Tên ngành" required error={formErrors.tenNganh}>
            <input className="cai-dat-form__input" value={form.tenNganh} onChange={e => setForm(p => ({ ...p, tenNganh: e.target.value }))} placeholder="Ví dụ: Công nghệ thông tin" />
          </FormField>
          <FormField label="Mô tả" error={formErrors.moTa}>
            <textarea className="cai-dat-form__textarea" value={form.moTa} onChange={e => setForm(p => ({ ...p, moTa: e.target.value }))} rows={3} />
          </FormField>
          <FormField label="Trạng thái sử dụng">
            <select className="cai-dat-form__select" value={form.dangSuDung ? 'true' : 'false'} onChange={e => setForm(p => ({ ...p, dangSuDung: e.target.value === 'true' }))}>
              <option value="true">Đang sử dụng</option>
              <option value="false">Ngừng sử dụng</option>
            </select>
          </FormField>
          {crudError && <p style={{ color: 'var(--color-danger)', margin: '0 0 12px', fontSize: '13px' }}>{Icons.warning} {crudError}</p>}
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        title="Xác nhận xóa"
        message={`Bạn có chắc chắn muốn xóa ngành "${deleteTarget?.tenNganh}"? Hành động này không thể hoàn tác.`}
        loading={crudStatus === 'loading'}
      />

      {/* Import Modal */}
      <Modal
        isOpen={importOpen}
        onClose={() => setImportOpen(false)}
        title="Import ngành từ Excel"
        footer={
          <>
            <button className="cai-dat-btn cai-dat-btn--secondary" onClick={() => setImportOpen(false)}>Đóng</button>
            {!importResult && (
              <button className="cai-dat-btn cai-dat-btn--primary" onClick={handleImport} disabled={!importFile || importLoading}>
                {importLoading ? 'Đang import...' : 'Import'}
              </button>
            )}
            {importResult && (
              <button className="cai-dat-btn cai-dat-btn--primary" onClick={() => setImportOpen(false)}>Đóng</button>
            )}
          </>
        }
      >
        {!importResult ? (
          <div className="cai-dat-import">
            <p style={{ margin: '0 0 12px', color: 'var(--color-text-muted)', fontSize: '13px' }}>
              Chỉ chấp nhận file .xlsx hoặc .xls. <button className="cai-dat-btn-link" onClick={handleDownloadTemplate}>Tải file mẫu</button>
            </p>
            <p style={{ margin: '0 0 12px', color: 'var(--color-text-muted)', fontSize: '12px' }}>
              <strong>Lưu ý:</strong> Cột "Tên khoa" là bắt buộc. Ngành phải thuộc một khoa chuyên môn.
            </p>
            <input ref={nganhFileRef} type="file" accept=".xlsx,.xls" onChange={handleFileChange} style={{ marginBottom: '12px' }} />
            {importFile && <p style={{ fontSize: '13px' }}>{Icons.file} {importFile.name} ({(importFile.size / 1024).toFixed(1)} KB)</p>}
            {importError && <p style={{ color: 'var(--color-danger)', fontSize: '13px' }}>{Icons.warning} {importError}</p>}
          </div>
        ) : (
          <div className="cai-dat-import-result">
            <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
              <div className="cai-dat-import-stat cai-dat-import-stat--success"><strong>{importResult.newCount}</strong><br /><span>Đã thêm mới</span></div>
              <div className="cai-dat-import-stat cai-dat-import-stat--danger"><strong>{importResult.failureCount}</strong><br /><span>Bị lỗi</span></div>
              <div className="cai-dat-import-stat"><strong>{importResult.totalRows}</strong><br /><span>Tổng dòng</span></div>
            </div>
            {importResult.errors.length > 0 && (
              <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid var(--color-border)', borderRadius: '4px', padding: '8px' }}>
                <p style={{ margin: '0 0 8px', fontWeight: 600, fontSize: '13px' }}>Lỗi theo dòng:</p>
                <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '12px' }}>
                  {importResult.errors.map((err, i) => <li key={i}>Dòng {err.rowNumber}: {err.message}</li>)}
                </ul>
              </div>
            )}
            {importResult.failureCount === 0 && (
              <p style={{ color: 'var(--color-success)', fontSize: '13px', marginTop: '8px' }}>{Icons.check} Import thành công!</p>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}

// ============ CONTENT: KHÓA NĂM HỌC ============
function KhoaHocContent() {
  const [modalOpen, setModalOpen] = useState(false)
  const [editItem, setEditItem] = useState<KhoaHoc | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<KhoaHoc | null>(null)
  const [form, setForm] = useState({ tenKhoaHoc: '', namBatDau: '', namKetThuc: '', moTa: '', dangSuDung: true })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  // Import modal state
  const [importOpen, setImportOpen] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importLoading, setImportLoading] = useState(false)
  const [importResult, setImportResult] = useState<import('../api/danhMuc').ImportResult | null>(null)
  const [importError, setImportError] = useState<string | null>(null)
  const khFileRef = useRef<HTMLInputElement>(null)

  const { items, loading, fetchError, crudStatus, crudError, fetch, create, update, remove, clearError } = useCrudData<KhoaHoc>(
    () => danhMucApi.getKhoaHoc().then(r => r.data),
    (data) => danhMucApi.createKhoaHoc(data as KhoaHocRequest),
    (id, data) => danhMucApi.updateKhoaHoc(id, data as KhoaHocRequest),
    (id) => danhMucApi.deleteKhoaHoc(id),
  )

  const openAdd = () => { setEditItem(null); setForm({ tenKhoaHoc: '', namBatDau: '', namKetThuc: '', moTa: '', dangSuDung: true }); setFormErrors({}); clearError(); setModalOpen(true) }
  const openEdit = (item: KhoaHoc) => {
    setEditItem(item)
    setForm({ tenKhoaHoc: item.tenKhoaHoc, namBatDau: String(item.namBatDau ?? ''), namKetThuc: String(item.namKetThuc ?? ''), moTa: item.moTa || '', dangSuDung: item.dangSuDung })
    setFormErrors({}); clearError(); setModalOpen(true)
  }
  const closeModal = () => { setModalOpen(false); clearError() }

  const validate = () => {
    const errors: Record<string, string> = {}
    if (!form.tenKhoaHoc.trim()) errors.tenKhoaHoc = 'Tên khóa học không được để trống.'
    if (form.namBatDau && isNaN(Number(form.namBatDau))) errors.namBatDau = 'Năm bắt đầu phải là số.'
    if (form.namKetThuc && isNaN(Number(form.namKetThuc))) errors.namKetThuc = 'Năm kết thúc phải là số.'
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return
    const data: KhoaHocRequest = {
      tenKhoaHoc: form.tenKhoaHoc.trim(),
      namBatDau: form.namBatDau ? Number(form.namBatDau) : null,
      namKetThuc: form.namKetThuc ? Number(form.namKetThuc) : null,
      moTa: form.moTa.trim() || null,
      dangSuDung: form.dangSuDung,
    }
    let ok: boolean
    if (editItem) ok = await update(editItem.id, data)
    else ok = await create(data)
    if (ok) closeModal()
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    const ok = await remove(deleteTarget.id)
    if (ok) setDeleteTarget(null)
  }

  // Import/Export handlers
  const handleExport = () => { danhMucApi.exportKhoaHoc() }
  const handleDownloadTemplate = () => { danhMucApi.downloadKhoaHocTemplate() }
  const openImport = () => { setImportFile(null); setImportResult(null); setImportError(null); setImportOpen(true) }
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null
    setImportFile(f); setImportResult(null); setImportError(null)
  }
  const handleImport = async () => {
    if (!importFile) return
    setImportLoading(true); setImportError(null)
    try {
      const r = await danhMucApi.importKhoaHoc(importFile)
      setImportResult(r.data)
      if (r.data.failureCount === 0) { await fetch() }
    } catch (err: unknown) {
      let msg = 'Đã xảy ra lỗi khi import.'
      if (err && typeof err === 'object' && 'response' in err) {
        const e = err as { response?: { data?: { message?: string } } }
        msg = e.response?.data?.message || msg
      }
      setImportError(msg)
    } finally { setImportLoading(false) }
  }

  const columns = [
    { key: 'stt', label: 'STT', width: '55px' },
    { key: 'maKhoaHoc', label: 'Mã khóa năm học', width: '130px' },
    { key: 'tenKhoaHoc', label: 'Tên khóa năm học', width: '' },
    { key: 'namBatDau', label: 'Năm bắt đầu', width: '130px' },
    { key: 'namKetThuc', label: 'Năm kết thúc', width: '130px' },
    { key: 'trangThai', label: 'Trạng thái', width: '' },
    { key: 'thaoTac', label: 'Thao tác', width: '130px' },
  ]

  return (
    <div className="cai-dat-content">
      <SectionHeader title="QUẢN LÝ KHÓA NĂM HỌC" subtitle="Quản lý khoảng thời gian đào tạo theo từng khóa" />
      <Toolbar
        searchPlaceholder="Tìm khóa năm học..."
        onImport={openImport}
        onExport={handleExport}
        actionButton={<button className="cai-dat-btn cai-dat-btn--primary" onClick={openAdd}>{Icons.plus} Thêm khóa năm học</button>}
      />
      <DataStateHandler loading={loading} error={fetchError} onRetry={fetch} emptyMessage="Chưa có khóa năm học nào.">
        {items.length > 0 && (
          <Table columns={columns} data={items} renderRow={(item, index) => (
            <tr key={item.id}>
              <td className="cai-dat-table__cell cai-dat-table__cell--center cai-dat-table__cell--nowrap">{String(index + 1).padStart(2, '0')}</td>
              <td className="cai-dat-table__cell cai-dat-table__cell--nowrap">{item.maKhoaHoc}</td>
              <td className="cai-dat-table__cell">{item.tenKhoaHoc}</td>
              <td className="cai-dat-table__cell cai-dat-table__cell--nowrap">{item.namBatDau ?? '-'}</td>
              <td className="cai-dat-table__cell cai-dat-table__cell--nowrap">{item.namKetThuc ?? '-'}</td>
              <td className="cai-dat-table__cell cai-dat-table__cell--nowrap"><StatusBadge status={trangThaiLabel(item.dangSuDung)} /></td>
              <td className="cai-dat-table__cell cai-dat-table__cell--center cai-dat-table__cell--nowrap">
                <button className="cai-dat-btn-action" onClick={() => openEdit(item)}>{Icons.edit} Sửa</button>
                <button className="cai-dat-btn-action cai-dat-btn-action--danger" style={{ marginLeft: '4px' }} onClick={() => setDeleteTarget(item)}>{Icons.trash} Xóa</button>
              </td>
            </tr>
          )} />
        )}
      </DataStateHandler>

      <Modal
        isOpen={modalOpen}
        onClose={closeModal}
        title={editItem ? 'SỬA KHÓA NĂM HỌC' : 'THÊM KHÓA NĂM HỌC'}
        footer={<><button className="cai-dat-btn cai-dat-btn--secondary" onClick={closeModal}>Hủy</button><button className="cai-dat-btn cai-dat-btn--primary" onClick={handleSubmit} disabled={crudStatus === 'loading'}>{crudStatus === 'loading' ? 'Đang lưu...' : 'Lưu'}</button></>}
      >
        <div className="cai-dat-form">
          <FormField label="Tên khóa học" required error={formErrors.tenKhoaHoc}>
            <input className="cai-dat-form__input" value={form.tenKhoaHoc} onChange={e => setForm(p => ({ ...p, tenKhoaHoc: e.target.value }))} placeholder="Ví dụ: Khóa 2024" />
          </FormField>
          <div className="cai-dat-form__row">
            <FormField label="Năm bắt đầu" error={formErrors.namBatDau}>
              <input className="cai-dat-form__input" type="number" value={form.namBatDau} onChange={e => setForm(p => ({ ...p, namBatDau: e.target.value }))} placeholder="Ví dụ: 2024" />
            </FormField>
            <FormField label="Năm kết thúc" error={formErrors.namKetThuc}>
              <input className="cai-dat-form__input" type="number" value={form.namKetThuc} onChange={e => setForm(p => ({ ...p, namKetThuc: e.target.value }))} placeholder="Ví dụ: 2028" />
            </FormField>
          </div>
          <FormField label="Mô tả" error={formErrors.moTa}>
            <textarea className="cai-dat-form__textarea" value={form.moTa} onChange={e => setForm(p => ({ ...p, moTa: e.target.value }))} rows={3} />
          </FormField>
          <FormField label="Trạng thái sử dụng">
            <select className="cai-dat-form__select" value={form.dangSuDung ? 'true' : 'false'} onChange={e => setForm(p => ({ ...p, dangSuDung: e.target.value === 'true' }))}>
              <option value="true">Đang sử dụng</option>
              <option value="false">Ngừng sử dụng</option>
            </select>
          </FormField>
          {crudError && <p style={{ color: 'var(--color-danger)', margin: '0 0 12px', fontSize: '13px' }}>{Icons.warning} {crudError}</p>}
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        title="Xác nhận xóa"
        message={`Bạn có chắc chắn muốn xóa khóa học "${deleteTarget?.tenKhoaHoc}"? Hành động này không thể hoàn tác.`}
        loading={crudStatus === 'loading'}
      />

      {/* Import Modal */}
      <Modal
        isOpen={importOpen}
        onClose={() => setImportOpen(false)}
        title="Import khóa học từ Excel"
        footer={
          <>
            <button className="cai-dat-btn cai-dat-btn--secondary" onClick={() => setImportOpen(false)}>Đóng</button>
            {!importResult && (
              <button className="cai-dat-btn cai-dat-btn--primary" onClick={handleImport} disabled={!importFile || importLoading}>
                {importLoading ? 'Đang import...' : 'Import'}
              </button>
            )}
            {importResult && (
              <button className="cai-dat-btn cai-dat-btn--primary" onClick={() => setImportOpen(false)}>Đóng</button>
            )}
          </>
        }
      >
        {!importResult ? (
          <div className="cai-dat-import">
            <p style={{ margin: '0 0 12px', color: 'var(--color-text-muted)', fontSize: '13px' }}>
              Chỉ chấp nhận file .xlsx hoặc .xls. <button className="cai-dat-btn-link" onClick={handleDownloadTemplate}>Tải file mẫu</button>
            </p>
            <input ref={khFileRef} type="file" accept=".xlsx,.xls" onChange={handleFileChange} style={{ marginBottom: '12px' }} />
            {importFile && <p style={{ fontSize: '13px' }}>{Icons.file} {importFile.name} ({(importFile.size / 1024).toFixed(1)} KB)</p>}
            {importError && <p style={{ color: 'var(--color-danger)', fontSize: '13px' }}>{Icons.warning} {importError}</p>}
          </div>
        ) : (
          <div className="cai-dat-import-result">
            <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
              <div className="cai-dat-import-stat cai-dat-import-stat--success"><strong>{importResult.newCount}</strong><br /><span>Đã thêm mới</span></div>
              <div className="cai-dat-import-stat cai-dat-import-stat--danger"><strong>{importResult.failureCount}</strong><br /><span>Bị lỗi</span></div>
              <div className="cai-dat-import-stat"><strong>{importResult.totalRows}</strong><br /><span>Tổng dòng</span></div>
            </div>
            {importResult.errors.length > 0 && (
              <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid var(--color-border)', borderRadius: '4px', padding: '8px' }}>
                <p style={{ margin: '0 0 8px', fontWeight: 600, fontSize: '13px' }}>Lỗi theo dòng:</p>
                <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '12px' }}>
                  {importResult.errors.map((err, i) => <li key={i}>Dòng {err.rowNumber}: {err.message}</li>)}
                </ul>
              </div>
            )}
            {importResult.failureCount === 0 && (
              <p style={{ color: 'var(--color-success)', fontSize: '13px', marginTop: '8px' }}>{Icons.check} Import thành công!</p>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}

// ============ CONTENT: LỚP HÀNH CHÍNH ============
function LopContent() {
  const [modalOpen, setModalOpen] = useState(false)
  const [editItem, setEditItem] = useState<Lop | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Lop | null>(null)
  const [nganhList, setNganhList] = useState<Nganh[]>([])
  const [khoaHocList, setKhoaHocList] = useState<KhoaHoc[]>([])
  const [depsLoading, setDepsLoading] = useState(true)

  const [form, setForm] = useState({ tenLop: '', nganhId: 0, khoaHocId: 0, moTa: '', dangSuDung: true })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  // Import modal state
  const [importOpen, setImportOpen] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importLoading, setImportLoading] = useState(false)
  const [importResult, setImportResult] = useState<import('../api/danhMuc').ImportResult | null>(null)
  const [importError, setImportError] = useState<string | null>(null)
  const lopFileRef = useRef<HTMLInputElement>(null)

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  useState(() => {
    Promise.all([
      danhMucApi.getNganh().then(r => setNganhList(r.data)).catch(() => { }),
      danhMucApi.getKhoaHoc().then(r => setKhoaHocList(r.data)).catch(() => { }),
    ]).finally(() => setDepsLoading(false))
  })

  const { items, loading, fetchError, crudStatus, crudError, fetch, create, update, remove, clearError } = useCrudData<Lop>(
    () => danhMucApi.getLop().then(r => r.data),
    (data) => danhMucApi.createLop(data as LopRequest),
    (id, data) => danhMucApi.updateLop(id, data as LopRequest),
    (id) => danhMucApi.deleteLop(id),
  )

  const openAdd = () => {
    setEditItem(null)
    setForm({ tenLop: '', nganhId: nganhList[0]?.id || 0, khoaHocId: khoaHocList[0]?.id || 0, moTa: '', dangSuDung: true })
    setFormErrors({}); clearError(); setModalOpen(true)
  }
  const openEdit = (item: Lop) => {
    setEditItem(item)
    setForm({ tenLop: item.tenLop, nganhId: item.nganh?.id || 0, khoaHocId: item.khoaHoc?.id || 0, moTa: item.moTa || '', dangSuDung: item.dangSuDung })
    setFormErrors({}); clearError(); setModalOpen(true)
  }
  const closeModal = () => { setModalOpen(false); clearError() }

  const validate = () => {
    const errors: Record<string, string> = {}
    if (!form.tenLop.trim()) errors.tenLop = 'Tên lớp không được để trống.'
    if (!form.nganhId) errors.nganhId = 'Vui lòng chọn ngành.'
    if (!form.khoaHocId) errors.khoaHocId = 'Vui lòng chọn khóa học.'
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return
    const data: LopRequest = { tenLop: form.tenLop.trim(), nganhId: form.nganhId, khoaHocId: form.khoaHocId, moTa: form.moTa.trim() || null, dangSuDung: form.dangSuDung }
    let ok: boolean
    if (editItem) ok = await update(editItem.id, data)
    else ok = await create(data)
    if (ok) closeModal()
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    const ok = await remove(deleteTarget.id)
    if (ok) setDeleteTarget(null)
  }

  // Import/Export handlers
  const handleExport = () => { danhMucApi.exportLop() }
  const handleDownloadTemplate = () => { danhMucApi.downloadLopTemplate() }
  const openImport = () => { setImportFile(null); setImportResult(null); setImportError(null); setImportOpen(true) }
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null
    setImportFile(f); setImportResult(null); setImportError(null)
  }
  const handleImport = async () => {
    if (!importFile) return
    setImportLoading(true); setImportError(null)
    try {
      const r = await danhMucApi.importLop(importFile)
      setImportResult(r.data)
      if (r.data.failureCount === 0) { await fetch() }
    } catch (err: unknown) {
      let msg = 'Đã xảy ra lỗi khi import.'
      if (err && typeof err === 'object' && 'response' in err) {
        const e = err as { response?: { data?: { message?: string } } }
        msg = e.response?.data?.message || msg
      }
      setImportError(msg)
    } finally { setImportLoading(false) }
  }

  const columns = [
    { key: 'stt', label: 'STT', width: '55px' },
    { key: 'maLop', label: 'Mã lớp', width: '110px' },
    { key: 'tenLop', label: 'Tên lớp', width: '' },
    { key: 'khoa', label: 'Khoa', width: '' },
    { key: 'nganh', label: 'Ngành', width: '' },
    { key: 'khoaHoc', label: 'Khóa năm học', width: '150px' },
    { key: 'trangThai', label: 'Trạng thái', width: '' },
    { key: 'thaoTac', label: 'Thao tác', width: '130px' },
  ]

  return (
    <div className="cai-dat-content">
      <SectionHeader title="QUẢN LÝ LỚP HÀNH CHÍNH" subtitle="Quản lý các lớp hành chính của sinh viên" />
      <Toolbar
        searchPlaceholder="Tìm lớp..."
        onImport={openImport}
        onExport={handleExport}
        actionButton={<button className="cai-dat-btn cai-dat-btn--primary" onClick={openAdd} disabled={depsLoading}>{Icons.plus} Thêm lớp</button>}
      />
      <DataStateHandler loading={loading} error={fetchError} onRetry={fetch} emptyMessage="Chưa có lớp nào.">
        {items.length > 0 && (
          <Table columns={columns} data={items} renderRow={(item, index) => (
            <tr key={item.id}>
              <td className="cai-dat-table__cell cai-dat-table__cell--center cai-dat-table__cell--nowrap">{String(index + 1).padStart(2, '0')}</td>
              <td className="cai-dat-table__cell cai-dat-table__cell--nowrap">{item.maLop}</td>
              <td className="cai-dat-table__cell">{item.tenLop}</td>
              <td className="cai-dat-table__cell">{item.nganh?.khoa?.tenKhoa || '-'}</td>
              <td className="cai-dat-table__cell">{item.nganh?.tenNganh || '-'}</td>
              <td className="cai-dat-table__cell cai-dat-table__cell--nowrap">
                {item.khoaHoc?.namBatDau && item.khoaHoc?.namKetThuc
                  ? `${item.khoaHoc.namBatDau} – ${item.khoaHoc.namKetThuc}`
                  : item.khoaHoc?.tenKhoaHoc || '-'}
              </td>
              <td className="cai-dat-table__cell cai-dat-table__cell--nowrap"><StatusBadge status={trangThaiLabel(item.dangSuDung)} /></td>
              <td className="cai-dat-table__cell cai-dat-table__cell--center cai-dat-table__cell--nowrap">
                <button className="cai-dat-btn-action" onClick={() => openEdit(item)}>{Icons.edit} Sửa</button>
                <button className="cai-dat-btn-action cai-dat-btn-action--danger" style={{ marginLeft: '4px' }} onClick={() => setDeleteTarget(item)}>{Icons.trash} Xóa</button>
              </td>
            </tr>
          )} />
        )}
      </DataStateHandler>

      <Modal
        isOpen={modalOpen}
        onClose={closeModal}
        title={editItem ? 'SỬA LỚP' : 'THÊM LỚP'}
        footer={<><button className="cai-dat-btn cai-dat-btn--secondary" onClick={closeModal}>Hủy</button><button className="cai-dat-btn cai-dat-btn--primary" onClick={handleSubmit} disabled={crudStatus === 'loading'}>{crudStatus === 'loading' ? 'Đang lưu...' : 'Lưu'}</button></>}
      >
        <div className="cai-dat-form">
          <FormField label="Tên lớp" required error={formErrors.tenLop}>
            <input className="cai-dat-form__input" value={form.tenLop} onChange={e => setForm(p => ({ ...p, tenLop: e.target.value }))} placeholder="Ví dụ: CNTT 14A" />
          </FormField>
          <div className="cai-dat-form__row">
            <FormField label="Ngành" required error={formErrors.nganhId}>
              <select className="cai-dat-form__select" value={form.nganhId || ''} onChange={e => setForm(p => ({ ...p, nganhId: Number(e.target.value) }))}>
                <option value="">-- Chọn ngành --</option>
                {nganhList.map(n => <option key={n.id} value={n.id}>{n.tenNganh}</option>)}
              </select>
            </FormField>
            <FormField label="Khóa học" required error={formErrors.khoaHocId}>
              <select className="cai-dat-form__select" value={form.khoaHocId || ''} onChange={e => setForm(p => ({ ...p, khoaHocId: Number(e.target.value) }))}>
                <option value="">-- Chọn khóa năm học --</option>
                {khoaHocList.map(kh => <option key={kh.id} value={kh.id}>{kh.tenKhoaHoc}</option>)}
              </select>
            </FormField>
          </div>
          <FormField label="Mô tả" error={formErrors.moTa}>
            <textarea className="cai-dat-form__textarea" value={form.moTa} onChange={e => setForm(p => ({ ...p, moTa: e.target.value }))} rows={3} />
          </FormField>
          <FormField label="Trạng thái sử dụng">
            <select className="cai-dat-form__select" value={form.dangSuDung ? 'true' : 'false'} onChange={e => setForm(p => ({ ...p, dangSuDung: e.target.value === 'true' }))}>
              <option value="true">Đang sử dụng</option>
              <option value="false">Ngừng sử dụng</option>
            </select>
          </FormField>
          {crudError && <p style={{ color: 'var(--color-danger)', margin: '0 0 12px', fontSize: '13px' }}>{Icons.warning} {crudError}</p>}
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        title="Xác nhận xóa"
        message={`Bạn có chắc chắn muốn xóa lớp "${deleteTarget?.tenLop}"? Hành động này không thể hoàn tác.`}
        loading={crudStatus === 'loading'}
      />

      {/* Import Modal */}
      <Modal
        isOpen={importOpen}
        onClose={() => setImportOpen(false)}
        title="Import lớp từ Excel"
        footer={
          <>
            <button className="cai-dat-btn cai-dat-btn--secondary" onClick={() => setImportOpen(false)}>Đóng</button>
            {!importResult && (
              <button className="cai-dat-btn cai-dat-btn--primary" onClick={handleImport} disabled={!importFile || importLoading}>
                {importLoading ? 'Đang import...' : 'Import'}
              </button>
            )}
            {importResult && (
              <button className="cai-dat-btn cai-dat-btn--primary" onClick={() => setImportOpen(false)}>Đóng</button>
            )}
          </>
        }
      >
        {!importResult ? (
          <div className="cai-dat-import">
            <p style={{ margin: '0 0 12px', color: 'var(--color-text-muted)', fontSize: '13px' }}>
              Chỉ chấp nhận file .xlsx hoặc .xls. <button className="cai-dat-btn-link" onClick={handleDownloadTemplate}>Tải file mẫu</button>
            </p>
            <p style={{ margin: '0 0 12px', color: 'var(--color-text-muted)', fontSize: '12px' }}>
              <strong>Lưu ý:</strong> Cần tạo đầy đủ Khoa, Ngành, Khóa năm học trước khi import Lớp. Hệ thống sẽ báo lỗi nếu thiếu danh mục.
            </p>
            <input ref={lopFileRef} type="file" accept=".xlsx,.xls" onChange={handleFileChange} style={{ marginBottom: '12px' }} />
            {importFile && <p style={{ fontSize: '13px' }}>{Icons.file} {importFile.name} ({(importFile.size / 1024).toFixed(1)} KB)</p>}
            {importError && <p style={{ color: 'var(--color-danger)', fontSize: '13px' }}>{Icons.warning} {importError}</p>}
          </div>
        ) : (
          <div className="cai-dat-import-result">
            <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
              <div className="cai-dat-import-stat cai-dat-import-stat--success"><strong>{importResult.newCount}</strong><br /><span>Đã thêm mới</span></div>
              <div className="cai-dat-import-stat cai-dat-import-stat--danger"><strong>{importResult.failureCount}</strong><br /><span>Bị lỗi</span></div>
              <div className="cai-dat-import-stat"><strong>{importResult.totalRows}</strong><br /><span>Tổng dòng</span></div>
            </div>
            {importResult.errors.length > 0 && (
              <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid var(--color-border)', borderRadius: '4px', padding: '8px' }}>
                <p style={{ margin: '0 0 8px', fontWeight: 600, fontSize: '13px' }}>Lỗi theo dòng:</p>
                <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '12px' }}>
                  {importResult.errors.map((err, i) => <li key={i}>Dòng {err.rowNumber}: {err.message}</li>)}
                </ul>
              </div>
            )}
            {importResult.failureCount === 0 && (
              <p style={{ color: 'var(--color-success)', fontSize: '13px', marginTop: '8px' }}>{Icons.check} Import thành công!</p>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}

// ============ CONTENT: LOẠI GIẤY TỜ ============
function LoaiGiayToContent() {
  const [modalOpen, setModalOpen] = useState(false)
  const [editItem, setEditItem] = useState<import('../api/types').LoaiGiayTo | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<import('../api/types').LoaiGiayTo | null>(null)

  const [form, setForm] = useState({ tenGiayTo: '', moTa: '', batBuoc: false, dangSuDung: true, thuTuHienThi: '' })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  // Import modal state
  const [importOpen, setImportOpen] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importLoading, setImportLoading] = useState(false)
  const [importResult, setImportResult] = useState<import('../api/danhMuc').ImportResult | null>(null)
  const [importError, setImportError] = useState<string | null>(null)
  const lgtFileRef = useRef<HTMLInputElement>(null)

  const { data, loading, error, crudStatus, crudError, refetch, create, update, remove, clearError } = (() => {
    const [data, setData] = useState<import('../api/types').LoaiGiayTo[]>([])
    const [loading, setLoading] = useState(true)
    const [fetchError, setFetchError] = useState<string | null>(null)
    const [crudStatus, setCrudStatus] = useState<CrudStatus>('idle')
    const [crudError, setCrudError] = useState<string | null>(null)

    const fetch = () => {
      setLoading(true)
      setFetchError(null)
      loaiGiayToApi.getAll()
        .then(r => { setData(r.data); setFetchError(null) })
        .catch((err: unknown) => {
          let msg = 'Đã xảy ra lỗi khi tải dữ liệu.'
          if (err && typeof err === 'object' && 'response' in err) {
            const e = err as { response?: { data?: { message?: string } } }
            msg = e.response?.data?.message || msg
          }
          setFetchError(msg)
        })
        .finally(() => setLoading(false))
    }

    const createItem = async (d: unknown) => {
      setCrudStatus('loading')
      setCrudError(null)
      try {
        await loaiGiayToApi.create(d as import('../api/types').LoaiGiayToRequest)
        setCrudStatus('idle')
      } catch (err: unknown) {
        let msg = 'Đã xảy ra lỗi khi tạo dữ liệu.'
        if (err && typeof err === 'object' && 'response' in err) {
          const e = err as { response?: { data?: { message?: string } } }
          msg = e.response?.data?.message || msg
        }
        setCrudError(msg)
        setCrudStatus('error')
        throw err
      }
    }

    const updateItem = async (id: unknown, d: unknown) => {
      setCrudStatus('loading')
      setCrudError(null)
      try {
        await loaiGiayToApi.update(id as string, d as import('../api/types').LoaiGiayToRequest)
        setCrudStatus('idle')
      } catch (err: unknown) {
        let msg = 'Đã xảy ra lỗi khi cập nhật dữ liệu.'
        if (err && typeof err === 'object' && 'response' in err) {
          const e = err as { response?: { data?: { message?: string } } }
          msg = e.response?.data?.message || msg
        }
        setCrudError(msg)
        setCrudStatus('error')
        throw err
      }
    }

    const deleteItem = async (id: unknown) => {
      setCrudStatus('loading')
      setCrudError(null)
      try {
        await loaiGiayToApi.delete(id as string)
        setCrudStatus('idle')
      } catch (err: unknown) {
        let msg = 'Đã xảy ra lỗi khi xóa dữ liệu.'
        if (err && typeof err === 'object' && 'response' in err) {
          const e = err as { response?: { data?: { message?: string } } }
          msg = e.response?.data?.message || msg
        }
        setCrudError(msg)
        setCrudStatus('error')
        throw err
      }
    }

    const clearErr = () => { setCrudError(null); setCrudStatus('idle') }

    useState(() => { fetch() })

    return {
      data, loading, error: fetchError,
      crudStatus, crudError,
      refetch: fetch,
      create: createItem,
      update: updateItem,
      remove: deleteItem,
      clearError: clearErr,
    }
  })()

  const openAdd = () => {
    setEditItem(null)
    setForm({ tenGiayTo: '', moTa: '', batBuoc: false, dangSuDung: true, thuTuHienThi: '' })
    setFormErrors({})
    clearError()
    setModalOpen(true)
  }
  const openEdit = (item: import('../api/types').LoaiGiayTo) => {
    setEditItem(item)
    setForm({
      tenGiayTo: item.tenGiayTo,
      moTa: item.moTa || '',
      batBuoc: item.batBuoc,
      dangSuDung: item.dangSuDung,
      thuTuHienThi: item.thuTuHienThi != null ? String(item.thuTuHienThi) : '',
    })
    setFormErrors({})
    clearError()
    setModalOpen(true)
  }
  const closeModal = () => { setModalOpen(false); clearError() }

  const validate = () => {
    const errors: Record<string, string> = {}
    if (!form.tenGiayTo.trim()) errors.tenGiayTo = 'Tên giấy tờ không được để trống.'
    if (form.thuTuHienThi && isNaN(Number(form.thuTuHienThi))) errors.thuTuHienThi = 'Thứ tự phải là số.'
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return
    const data: import('../api/types').LoaiGiayToRequest = {
      tenGiayTo: form.tenGiayTo.trim(),
      moTa: form.moTa.trim() || null,
      batBuoc: form.batBuoc,
      dangSuDung: form.dangSuDung,
      thuTuHienThi: form.thuTuHienThi ? Number(form.thuTuHienThi) : null,
    }
    try {
      if (editItem) await update(editItem.maLoai, data)
      else await create(data)
      await refetch()
      closeModal()
    } catch { /* error already set in crudError */ }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await remove(deleteTarget.maLoai)
      await refetch()
      setDeleteTarget(null)
    } catch { /* error already set in crudError */ }
  }

  // Import/Export handlers
  const handleExport = () => { loaiGiayToApi.exportExcel() }
  const handleDownloadTemplate = () => { loaiGiayToApi.downloadTemplate() }
  const openImport = () => { setImportFile(null); setImportResult(null); setImportError(null); setImportOpen(true) }
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null
    setImportFile(f); setImportResult(null); setImportError(null)
  }
  const handleImport = async () => {
    if (!importFile) return
    setImportLoading(true); setImportError(null)
    try {
      const r = await loaiGiayToApi.importExcel(importFile)
      setImportResult(r.data)
      if (r.data.failureCount === 0) { await refetch() }
    } catch (err: unknown) {
      let msg = 'Đã xảy ra lỗi khi import.'
      if (err && typeof err === 'object' && 'response' in err) {
        const e = err as { response?: { data?: { message?: string } } }
        msg = e.response?.data?.message || msg
      }
      setImportError(msg)
    } finally { setImportLoading(false) }
  }

  const columns = [
    { key: 'stt', label: 'STT', width: '55px' },
    { key: 'maLoai', label: 'Mã giấy tờ', width: '130px' },
    { key: 'tenGiayTo', label: 'Tên giấy tờ', width: '' },
    { key: 'batBuoc', label: 'Bắt buộc', width: '100px' },
    { key: 'thuTu', label: 'Thứ tự', width: '70px' },
    { key: 'trangThai', label: 'Trạng thái', width: '' },
    { key: 'thaoTac', label: 'Thao tác', width: '130px' },
  ]

  return (
    <div className="cai-dat-content">
      <SectionHeader title="QUẢN LÝ LOẠI GIẤY TỜ" subtitle="Quản lý các loại giấy tờ được sử dụng trong hồ sơ sinh viên" />
      <Toolbar
        searchPlaceholder="Tìm giấy tờ..."
        onImport={openImport}
        onExport={handleExport}
        actionButton={<button className="cai-dat-btn cai-dat-btn--primary" onClick={openAdd}>{Icons.plus} Thêm loại giấy tờ</button>}
      />
      <DataStateHandler loading={loading} error={error} onRetry={refetch} emptyMessage="Chưa có loại giấy tờ nào.">
        {data.length > 0 && (
          <Table columns={columns} data={data} renderRow={(item, index) => (
            <tr key={item.maLoai}>
              <td className="cai-dat-table__cell cai-dat-table__cell--center cai-dat-table__cell--nowrap">{String(index + 1).padStart(2, '0')}</td>
              <td className="cai-dat-table__cell cai-dat-table__cell--nowrap">{item.maLoai}</td>
              <td className="cai-dat-table__cell">{item.tenGiayTo}</td>
              <td className="cai-dat-table__cell cai-dat-table__cell--center">
                {item.batBuoc
                  ? <span className="cai-dat-badge cai-dat-badge--bat-buoc">{Icons.check} Có</span>
                  : <span className="cai-dat-badge cai-dat-badge--khong-bat-buoc">Không</span>}
              </td>
              <td className="cai-dat-table__cell cai-dat-table__cell--center cai-dat-table__cell--nowrap">{item.thuTuHienThi ?? '-'}</td>
              <td className="cai-dat-table__cell cai-dat-table__cell--nowrap"><StatusBadge status={trangThaiLabel(item.dangSuDung)} /></td>
              <td className="cai-dat-table__cell cai-dat-table__cell--center cai-dat-table__cell--nowrap">
                <button className="cai-dat-btn-action" onClick={() => openEdit(item)}>{Icons.edit} Sửa</button>
                <button className="cai-dat-btn-action cai-dat-btn-action--danger" style={{ marginLeft: '4px' }} onClick={() => setDeleteTarget(item)}>{Icons.trash} Xóa</button>
              </td>
            </tr>
          )} />
        )}
      </DataStateHandler>

      {/* Form Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={closeModal}
        title={editItem ? 'SỬA LOẠI GIẤY TỜ' : 'THÊM LOẠI GIẤY TỜ'}
        footer={
          <>
            <button className="cai-dat-btn cai-dat-btn--secondary" onClick={closeModal}>Hủy</button>
            <button className="cai-dat-btn cai-dat-btn--primary" onClick={handleSubmit} disabled={crudStatus === 'loading'}>
              {crudStatus === 'loading' ? 'Đang lưu...' : 'Lưu'}
            </button>
          </>
        }
      >
        <div className="cai-dat-form">
          <FormField label="Tên giấy tờ" required error={formErrors.tenGiayTo}>
            <input className="cai-dat-form__input" value={form.tenGiayTo} onChange={e => setForm(p => ({ ...p, tenGiayTo: e.target.value }))} placeholder="Ví dụ: Giấy xác nhận công tác" />
          </FormField>
          <div className="cai-dat-form__row">
            <FormField label="Bắt buộc" error={formErrors.batBuoc}>
              <select className="cai-dat-form__select" value={form.batBuoc ? 'true' : 'false'} onChange={e => setForm(p => ({ ...p, batBuoc: e.target.value === 'true' }))}>
                <option value="true">Có</option>
                <option value="false">Không</option>
              </select>
            </FormField>
            <FormField label="Thứ tự hiển thị" error={formErrors.thuTuHienThi}>
              <input className="cai-dat-form__input" type="number" min="0" value={form.thuTuHienThi} onChange={e => setForm(p => ({ ...p, thuTuHienThi: e.target.value }))} placeholder="Số thứ tự" />
            </FormField>
          </div>
          <FormField label="Mô tả" error={formErrors.moTa}>
            <textarea className="cai-dat-form__textarea" value={form.moTa} onChange={e => setForm(p => ({ ...p, moTa: e.target.value }))} placeholder="Mô tả ngắn (tùy chọn)" rows={3} />
          </FormField>
          <FormField label="Trạng thái sử dụng">
            <select className="cai-dat-form__select" value={form.dangSuDung ? 'true' : 'false'} onChange={e => setForm(p => ({ ...p, dangSuDung: e.target.value === 'true' }))}>
              <option value="true">Đang sử dụng</option>
              <option value="false">Ngừng sử dụng</option>
            </select>
          </FormField>
          {crudError && <p style={{ color: 'var(--color-danger)', margin: '0 0 12px', fontSize: '13px' }}>{Icons.warning} {crudError}</p>}
        </div>
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        title="Xác nhận xóa"
        message={`Bạn có chắc chắn muốn xóa loại giấy tờ "${deleteTarget?.tenGiayTo}" (${deleteTarget?.maLoai})? Hành động này không thể hoàn tác.`}
        loading={crudStatus === 'loading'}
      />

      {/* Import Modal */}
      <Modal
        isOpen={importOpen}
        onClose={() => setImportOpen(false)}
        title="Import loại giấy tờ từ Excel"
        footer={
          <>
            <button className="cai-dat-btn cai-dat-btn--secondary" onClick={() => setImportOpen(false)}>Đóng</button>
            {!importResult && (
              <button className="cai-dat-btn cai-dat-btn--primary" onClick={handleImport} disabled={!importFile || importLoading}>
                {importLoading ? 'Đang import...' : 'Import'}
              </button>
            )}
            {importResult && (
              <button className="cai-dat-btn cai-dat-btn--primary" onClick={() => setImportOpen(false)}>Đóng</button>
            )}
          </>
        }
      >
        {!importResult ? (
          <div className="cai-dat-import">
            <p style={{ margin: '0 0 12px', color: 'var(--color-text-muted)', fontSize: '13px' }}>
              Chỉ chấp nhận file .xlsx hoặc .xls. <button className="cai-dat-btn-link" onClick={handleDownloadTemplate}>Tải file mẫu</button>
            </p>
            <input ref={lgtFileRef} type="file" accept=".xlsx,.xls" onChange={handleFileChange} style={{ marginBottom: '12px' }} />
            {importFile && <p style={{ fontSize: '13px' }}>{Icons.file} {importFile.name} ({(importFile.size / 1024).toFixed(1)} KB)</p>}
            {importError && <p style={{ color: 'var(--color-danger)', fontSize: '13px' }}>{Icons.warning} {importError}</p>}
          </div>
        ) : (
          <div className="cai-dat-import-result">
            <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
              <div className="cai-dat-import-stat cai-dat-import-stat--success"><strong>{importResult.newCount}</strong><br /><span>Đã thêm mới</span></div>
              <div className="cai-dat-import-stat cai-dat-import-stat--danger"><strong>{importResult.failureCount}</strong><br /><span>Bị lỗi</span></div>
              <div className="cai-dat-import-stat"><strong>{importResult.totalRows}</strong><br /><span>Tổng dòng</span></div>
            </div>
            {importResult.errors.length > 0 && (
              <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid var(--color-border)', borderRadius: '4px', padding: '8px' }}>
                <p style={{ margin: '0 0 8px', fontWeight: 600, fontSize: '13px' }}>Lỗi theo dòng:</p>
                <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '12px' }}>
                  {importResult.errors.map((err, i) => <li key={i}>Dòng {err.rowNumber}: {err.message}</li>)}
                </ul>
              </div>
            )}
            {importResult.failureCount === 0 && (
              <p style={{ color: 'var(--color-success)', fontSize: '13px', marginTop: '8px' }}>{Icons.check} Import thành công!</p>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}

// ============ CONTENT: NGƯỜI DÙNG (chỉ GET - giai đoạn 2) ============
function NguoiDungContent() {
  const [modalOpen, setModalOpen] = useState(false)
  const [editItem, setEditItem] = useState<UserResponse | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<UserResponse | null>(null)

  const [form, setForm] = useState({ hoTen: '', email: '', role: 'STAFF' as 'ADMIN' | 'STAFF', password: '' })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  const { data, loading, error, crudStatus, crudError, refetch, create, update, remove, clearError } = (() => {
    const [data, setData] = useState<UserResponse[]>([])
    const [loading, setLoading] = useState(true)
    const [fetchError, setFetchError] = useState<string | null>(null)
    const [crudStatus, setCrudStatus] = useState<CrudStatus>('idle')
    const [crudError, setCrudError] = useState<string | null>(null)

    const fetch = () => {
      setLoading(true)
      setFetchError(null)
      userApi.getAll()
        .then(r => { setData(r.data); setFetchError(null) })
        .catch((err: unknown) => {
          let msg = 'Đã xảy ra lỗi khi tải dữ liệu.'
          if (err && typeof err === 'object' && 'response' in err) {
            const e = err as { response?: { data?: { message?: string } } }
            msg = e.response?.data?.message || msg
          }
          setFetchError(msg)
        })
        .finally(() => setLoading(false))
    }

    const apiCreate = async (d: unknown) => {
      setCrudStatus('loading')
      setCrudError(null)
      try {
        // register -> POST /api/auth/register
        await import('../api/client').then(m => m.apiClient.post('/api/auth/register', d))
        setCrudStatus('idle')
      } catch (err: unknown) {
        let msg = 'Đã xảy ra lỗi khi tạo tài khoản.'
        if (err && typeof err === 'object' && 'response' in err) {
          const e = err as { response?: { data?: { message?: string } } }
          msg = e.response?.data?.message || msg
        }
        setCrudError(msg)
        setCrudStatus('error')
        throw err
      }
    }

    const apiUpdate = async (id: unknown, d: unknown) => {
      setCrudStatus('loading')
      setCrudError(null)
      try {
        await userApi.updateProfile(id as string, d as import('../api/user').UserProfileRequest)
        setCrudStatus('idle')
      } catch (err: unknown) {
        let msg = 'Đã xảy ra lỗi khi cập nhật.'
        if (err && typeof err === 'object' && 'response' in err) {
          const e = err as { response?: { data?: { message?: string } } }
          msg = e.response?.data?.message || msg
        }
        setCrudError(msg)
        setCrudStatus('error')
        throw err
      }
    }

    const apiDelete = async (id: unknown) => {
      setCrudStatus('loading')
      setCrudError(null)
      try {
        await userApi.deactivate(id as string)
        setCrudStatus('idle')
      } catch (err: unknown) {
        let msg = 'Đã xảy ra lỗi khi vô hiệu hóa tài khoản.'
        if (err && typeof err === 'object' && 'response' in err) {
          const e = err as { response?: { data?: { message?: string } } }
          msg = e.response?.data?.message || msg
        }
        setCrudError(msg)
        setCrudStatus('error')
        throw err
      }
    }

    const clearErr = () => { setCrudError(null); setCrudStatus('idle') }
    useState(() => { fetch() })

    return {
      data, loading, error: fetchError,
      crudStatus, crudError,
      refetch: fetch,
      create: apiCreate,
      update: apiUpdate,
      remove: apiDelete,
      clearError: clearErr,
    }
  })()

  const openAdd = () => {
    setEditItem(null)
    setForm({ hoTen: '', email: '', role: 'STAFF', password: '' })
    setFormErrors({})
    clearError()
    setModalOpen(true)
  }

  const openEdit = (item: UserResponse) => {
    setEditItem(item)
    setForm({ hoTen: item.hoTen, email: item.email || '', role: item.role as 'ADMIN' | 'STAFF', password: '' })
    setFormErrors({})
    clearError()
    setModalOpen(true)
  }

  const closeModal = () => { setModalOpen(false); clearError() }

  const validateAdd = () => {
    const errors: Record<string, string> = {}
    if (!form.hoTen.trim()) errors.hoTen = 'Họ tên không được để trống.'
    if (!form.password || form.password.length < 8) errors.password = 'Mật khẩu phải có ít nhất 8 ký tự.'
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.email = 'Email không hợp lệ.'
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const validateEdit = () => {
    const errors: Record<string, string> = {}
    if (!form.hoTen.trim()) errors.hoTen = 'Họ tên không được để trống.'
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.email = 'Email không hợp lệ.'
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async () => {
    if (editItem) {
      if (!validateEdit()) return
      const payload: import('../api/user').UserProfileRequest = {
        hoTen: form.hoTen.trim(),
        email: form.email.trim() || null,
      }
      try {
        await update(editItem.username, payload)
        await refetch()
        closeModal()
      } catch { /* crudError set */ }
    } else {
      if (!validateAdd()) return
      const payload = {
        username: (document.querySelector('[data-username]') as HTMLInputElement)?.value?.trim() || '',
        password: form.password,
        hoTen: form.hoTen.trim(),
        email: form.email.trim() || null,
      }
      if (!payload.username) { setFormErrors(e => ({ ...e, username: 'Username không được để trống.' })); return }
      try {
        await create(payload)
        await refetch()
        closeModal()
      } catch { /* crudError set */ }
    }
  }

  const handleDeactivate = async () => {
    if (!deleteTarget) return
    try {
      await remove(deleteTarget.username)
      await refetch()
      setDeleteTarget(null)
    } catch { /* crudError set */ }
  }

  const columns = [
    { key: 'stt', label: 'STT', width: '60px' },
    { key: 'hoTen', label: 'Họ tên' },
    { key: 'username', label: 'Username', width: '140px' },
    { key: 'email', label: 'Email', width: '200px' },
    { key: 'vaiTro', label: 'Vai trò', width: '150px' },
    { key: 'trangThai', label: 'Trạng thái', width: '130px' },
    { key: 'thaoTac', label: 'Thao tác', width: '180px' },
  ]

  return (
    <div className="cai-dat-content">
      <SectionHeader title="QUẢN LÝ NGƯỜI DÙNG" subtitle="Quản lý tài khoản và quyền truy cập hệ thống" />
      <Toolbar
        searchPlaceholder="Tìm người dùng..."
        actionButton={<button className="cai-dat-btn cai-dat-btn--primary" onClick={openAdd}>{Icons.plus} Thêm người dùng</button>}
      />
      <DataStateHandler loading={loading} error={error} onRetry={refetch} emptyMessage="Chưa có người dùng nào.">
        {data.length > 0 && (
          <Table columns={columns} data={data} renderRow={(item, index) => (
            <tr key={item.id}>
              <td className="cai-dat-table__cell cai-dat-table__cell--center">{String(index + 1).padStart(2, '0')}</td>
              <td className="cai-dat-table__cell">{item.hoTen}</td>
              <td className="cai-dat-table__cell">{item.username}</td>
              <td className="cai-dat-table__cell">{item.email || '-'}</td>
              <td className="cai-dat-table__cell">{vaiTroLabel(item.role)}</td>
              <td className="cai-dat-table__cell"><StatusBadge status={trangThaiHoatDongLabel(item.isActive)} /></td>
              <td className="cai-dat-table__cell cai-dat-table__cell--center cai-dat-table__cell--nowrap">
                <button className="cai-dat-btn-action" onClick={() => openEdit(item)}>{Icons.edit} Sửa</button>
                {item.isActive
                  ? <button className="cai-dat-btn-action cai-dat-btn-action--danger" style={{ marginLeft: '4px' }} onClick={() => setDeleteTarget(item)}>{Icons.lock} Khóa</button>
                  : <button className="cai-dat-btn-action" style={{ marginLeft: '4px', color: 'var(--color-success)' }} onClick={async () => { try { await userApi.activate(item.username); await refetch() } catch {} }}>{Icons.unlock} Mở khóa</button>
                }
              </td>
            </tr>
          )} />
        )}
      </DataStateHandler>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={closeModal}
        title={editItem ? 'SỬA TÀI KHOẢN' : 'THÊM NGƯỜI DÙNG'}
        footer={
          <>
            <button className="cai-dat-btn cai-dat-btn--secondary" onClick={closeModal}>Hủy</button>
            <button className="cai-dat-btn cai-dat-btn--primary" onClick={handleSubmit} disabled={crudStatus === 'loading'}>
              {crudStatus === 'loading' ? 'Đang lưu...' : 'Lưu'}
            </button>
          </>
        }
      >
        <div className="cai-dat-form">
          {editItem && <p style={{ fontSize: '12px', color: '#666', marginBottom: '12px' }}>Sửa hồ sơ của <strong>{editItem.username}</strong>. Mật khẩu không đổi.</p>}
          {!editItem && (
            <FormField label="Username" required error={formErrors.username as string | undefined}>
              <input data-username className="cai-dat-form__input" placeholder="Tên đăng nhập" />
            </FormField>
          )}
          <FormField label="Họ tên" required error={formErrors.hoTen as string | undefined}>
            <input className="cai-dat-form__input" value={form.hoTen} onChange={e => setForm(p => ({ ...p, hoTen: e.target.value }))} placeholder="Họ và tên đầy đủ" />
          </FormField>
          <FormField label="Email" error={formErrors.email as string | undefined}>
            <input className="cai-dat-form__input" type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="email@example.com" />
          </FormField>
          {!editItem && (
            <FormField label="Mật khẩu" required error={formErrors.password as string | undefined}>
              <input className="cai-dat-form__input" type="password" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} placeholder="Ít nhất 8 ký tự" />
            </FormField>
          )}
          {editItem && (
            <FormField label="Vai trò hiện tại">
              <input className="cai-dat-form__input" value={vaiTroLabel(editItem.role)} disabled style={{ opacity: 0.6 }} />
            </FormField>
          )}
          {crudError && <p style={{ color: 'var(--color-danger)', margin: '0 0 12px', fontSize: '13px' }}>{Icons.warning} {crudError}</p>}
        </div>
      </Modal>

      {/* Deactivate Confirm */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onConfirm={handleDeactivate}
        onCancel={() => setDeleteTarget(null)}
        title="Xác nhận khóa tài khoản"
        message={`Bạn có chắc muốn khóa tài khoản "${deleteTarget?.hoTen}" (${deleteTarget?.username})? Tài khoản sẽ không thể đăng nhập sau khi bị khóa.`}
        loading={crudStatus === 'loading'}
      />
    </div>
  )
}

// ============ MOCK CONTENTS (giữ nguyên từ giai đoạn 1) ============
function TrangThaiHocVuContent() {
  // Trạng thái học vụ là ENUM cố định trong PostgreSQL — chỉ đọc từ backend, không CRUD.
  const { data, loading, error, refetch } = (() => {
    const [data, setData] = useState<TrangThaiHocVuItem[]>([])
    const [loading, setLoading] = useState(true)
    const [fetchError, setFetchError] = useState<string | null>(null)

    const fetch = () => {
      setLoading(true)
      setFetchError(null)
      danhMucApi.getTrangThaiHocVu()
        .then(r => { setData(r.data); setFetchError(null) })
        .catch((err: unknown) => {
          let msg = 'Đã xảy ra lỗi khi tải dữ liệu.'
          if (err && typeof err === 'object' && 'response' in err) {
            const e = err as { response?: { data?: { message?: string } } }
            msg = e.response?.data?.message || msg
          }
          setFetchError(msg)
        })
        .finally(() => setLoading(false))
    }

    useState(() => fetch())
    return { data, loading, error: fetchError, refetch: fetch }
  })()

  const columns: TableColumn[] = [
    { key: 'stt', label: 'STT', width: '55px' },
    { key: 'tenTrangThai', label: 'Trạng thái', width: '160px' },
    { key: 'moTa', label: 'Mô tả', width: '' },
  ]

  return (
    <div className="cai-dat-content">
      <SectionHeader
        title="QUẢN LÝ TRẠNG THÁI HỌC VỤ"
        subtitle="Danh sách trạng thái học vụ được hệ thống định nghĩa — chỉ đọc"
      />
      <DataStateHandler loading={loading} error={error} onRetry={refetch} emptyMessage="Không có trạng thái học vụ.">
        {data.length > 0 && (
          <Table columns={columns} data={data} renderRow={(item, index) => (
            <tr key={item.ma}>
              <td className="cai-dat-table__cell cai-dat-table__cell--center cai-dat-table__cell--nowrap">{String(index + 1).padStart(2, '0')}</td>
              <td className="cai-dat-table__cell cai-dat-table__cell--nowrap"><ColorBadge label={item.ten} color={item.mauHienThi} /></td>
              <td className="cai-dat-table__cell">{item.moTa}</td>
            </tr>
          )} />
        )}
      </DataStateHandler>
      <p style={{ marginTop: '12px', fontSize: '12px', color: 'var(--color-text-muted)' }}>
        ⚠ Các trạng thái học vụ được định nghĩa cố định bởi hệ thống, không thể thêm, sửa hoặc xóa.
      </p>
    </div>
  )
}

function TrangThaiHoSoContent() {
  // Trạng thái hồ sơ = Trạng thái phiếu xuất hồ sơ (ENUM trangthaiphieu) — chỉ đọc từ backend.
  // Mapping: 'Chờ duyệt'/'Đã duyệt'/'Từ chối'/'Đang mượn'/'Đã trả'/'Quá hạn'/'Hoàn tất'
  const { data, loading, error, refetch } = (() => {
    const [data, setData] = useState<TrangThaiPhieuItem[]>([])
    const [loading, setLoading] = useState(true)
    const [fetchError, setFetchError] = useState<string | null>(null)

    const fetch = () => {
      setLoading(true)
      setFetchError(null)
      danhMucApi.getTrangThaiPhieu()
        .then(r => { setData(r.data); setFetchError(null) })
        .catch((err: unknown) => {
          let msg = 'Đã xảy ra lỗi khi tải dữ liệu.'
          if (err && typeof err === 'object' && 'response' in err) {
            const e = err as { response?: { data?: { message?: string } } }
            msg = e.response?.data?.message || msg
          }
          setFetchError(msg)
        })
        .finally(() => setLoading(false))
    }

    useState(() => fetch())
    return { data, loading, error: fetchError, refetch: fetch }
  })()

  const columns: TableColumn[] = [
    { key: 'stt', label: 'STT', width: '55px' },
    { key: 'tenTrangThai', label: 'Trạng thái', width: '160px' },
    { key: 'moTa', label: 'Mô tả', width: '' },
  ]

  return (
    <div className="cai-dat-content">
      <SectionHeader
        title="QUẢN LÝ TRẠNG THÁI PHIẾU XUẤT HỒ SƠ"
        subtitle="Danh sách trạng thái phiếu xuất hồ sơ — được hệ thống định nghĩa, chỉ đọc"
      />
      <DataStateHandler loading={loading} error={error} onRetry={refetch} emptyMessage="Không có trạng thái phiếu.">
        {data.length > 0 && (
          <Table columns={columns} data={data} renderRow={(item, index) => (
            <tr key={item.ma}>
              <td className="cai-dat-table__cell cai-dat-table__cell--center cai-dat-table__cell--nowrap">{String(index + 1).padStart(2, '0')}</td>
              <td className="cai-dat-table__cell cai-dat-table__cell--nowrap"><ColorBadge label={item.ten} color={item.mauHienThi} /></td>
              <td className="cai-dat-table__cell">{item.moTa}</td>
            </tr>
          )} />
        )}
      </DataStateHandler>
      <p style={{ marginTop: '12px', fontSize: '12px', color: 'var(--color-text-muted)' }}>
        ⚠ Trạng thái phiếu xuất hồ sơ được định nghĩa cố định bởi hệ thống, không thể thêm, sửa hoặc xóa.
      </p>
    </div>
  )
}

function TrangThaiGiayToContent() {
  // Trạng thái giấy tờ = Trạng thái nộp giấy tờ (ENUM trangthainop) — chỉ đọc từ backend.
  // Các giá trị: 'Chưa nộp', 'Đã nộp', 'Thiếu', 'Không hợp lệ'.
  // NOTE: 'Bản gốc'/'Bản sao' KHÔNG phải trạng thái — đó là loại bản, thuộc HoSoGiayTo.banGocBanSao.
  const { data, loading, error, refetch } = (() => {
    const [data, setData] = useState<TrangThaiNopItem[]>([])
    const [loading, setLoading] = useState(true)
    const [fetchError, setFetchError] = useState<string | null>(null)

    const fetch = () => {
      setLoading(true)
      setFetchError(null)
      danhMucApi.getTrangThaiNop()
        .then(r => { setData(r.data); setFetchError(null) })
        .catch((err: unknown) => {
          let msg = 'Đã xảy ra lỗi khi tải dữ liệu.'
          if (err && typeof err === 'object' && 'response' in err) {
            const e = err as { response?: { data?: { message?: string } } }
            msg = e.response?.data?.message || msg
          }
          setFetchError(msg)
        })
        .finally(() => setLoading(false))
    }

    useState(() => fetch())
    return { data, loading, error: fetchError, refetch: fetch }
  })()

  const columns: TableColumn[] = [
    { key: 'stt', label: 'STT', width: '55px' },
    { key: 'tenTrangThai', label: 'Trạng thái', width: '160px' },
    { key: 'moTa', label: 'Mô tả', width: '' },
  ]

  return (
    <div className="cai-dat-content">
      <SectionHeader
        title="QUẢN LÝ TRẠNG THÁI NỘP GIẤY TỜ"
        subtitle="Danh sách trạng thái nộp giấy tờ — được hệ thống định nghĩa, chỉ đọc. NOTE: Bản gốc/Bản sao là loại bản, không phải trạng thái."
      />
      <DataStateHandler loading={loading} error={error} onRetry={refetch} emptyMessage="Không có trạng thái nộp giấy tờ.">
        {data.length > 0 && (
          <Table columns={columns} data={data} renderRow={(item, index) => (
            <tr key={item.ma}>
              <td className="cai-dat-table__cell cai-dat-table__cell--center cai-dat-table__cell--nowrap">{String(index + 1).padStart(2, '0')}</td>
              <td className="cai-dat-table__cell cai-dat-table__cell--nowrap"><ColorBadge label={item.ten} color={item.mauHienThi} /></td>
              <td className="cai-dat-table__cell">{item.moTa}</td>
            </tr>
          )} />
        )}
      </DataStateHandler>
      <p style={{ marginTop: '12px', fontSize: '12px', color: 'var(--color-text-muted)' }}>
        ⚠ Trạng thái nộp giấy tờ được định nghĩa cố định bởi hệ thống, không thể thêm, sửa hoặc xóa. Loại bản (Bản gốc / Bản sao) là thuộc tính của từng hồ sơ giấy tờ.
      </p>
    </div>
  )
}

function CauHinhMuonTraContent() {
  const [config, setConfig] = useState({ thoiHanMacDinh: 7, choPhepGiaHan: true, soLanGiaHanToiDa: 2, choPhepTraQuaHan: true, tuDongDanhDauQuaHan: true, thongBaoGanHan: true, soNgayTruocHan: 1 })
  return (
    <div className="cai-dat-content">
      <SectionHeader title="CẤU HÌNH MƯỢN / TRẢ HỒ SƠ" subtitle="Thiết lập các quy định sử dụng chức năng mượn và trả hồ sơ" />
      <div className="cai-dat-config-grid">
        <Card title="THỜI HẠN MƯỢN">
          <div className="cai-dat-config-item"><label>Thời hạn mượn mặc định:</label><div className="cai-dat-config-input"><input type="number" value={config.thoiHanMacDinh} onChange={e => setConfig(p => ({ ...p, thoiHanMacDinh: parseInt(e.target.value) || 0 }))} /><span>ngày</span></div></div>
        </Card>
        <Card title="GIA HẠN">
          <div className="cai-dat-config-item"><label>Cho phép gia hạn:</label><Toggle checked={config.choPhepGiaHan} onChange={v => setConfig(p => ({ ...p, choPhepGiaHan: v }))} /></div>
          {config.choPhepGiaHan && <div className="cai-dat-config-item"><label>Số lần gia hạn tối đa:</label><div className="cai-dat-config-input"><input type="number" value={config.soLanGiaHanToiDa} onChange={e => setConfig(p => ({ ...p, soLanGiaHanToiDa: parseInt(e.target.value) || 0 }))} /><span>lần</span></div></div>}
        </Card>
        <Card title="QUÁ HẠN">
          <div className="cai-dat-config-item"><label>Cho phép tiếp tục trả hồ sơ khi quá hạn:</label><Toggle checked={config.choPhepTraQuaHan} onChange={v => setConfig(p => ({ ...p, choPhepTraQuaHan: v }))} /></div>
          <div className="cai-dat-config-item"><label>Tự động đánh dấu quá hạn:</label><Toggle checked={config.tuDongDanhDauQuaHan} onChange={v => setConfig(p => ({ ...p, tuDongDanhDauQuaHan: v }))} /></div>
        </Card>
        <Card title="THÔNG BÁO">
          <div className="cai-dat-config-item"><label>Thông báo khi sắp đến hạn:</label><Toggle checked={config.thongBaoGanHan} onChange={v => setConfig(p => ({ ...p, thongBaoGanHan: v }))} /></div>
          {config.thongBaoGanHan && <div className="cai-dat-config-item"><label>Số ngày trước hạn:</label><div className="cai-dat-config-input"><input type="number" value={config.soNgayTruocHan} onChange={e => setConfig(p => ({ ...p, soNgayTruocHan: parseInt(e.target.value) || 0 }))} /><span>ngày</span></div></div>}
        </Card>
      </div>
      <div className="cai-dat-form__actions"><button className="cai-dat-btn cai-dat-btn--secondary">Hủy thay đổi</button><button className="cai-dat-btn cai-dat-btn--primary">Lưu cấu hình</button></div>
    </div>
  )
}

function CauHinhRutHoSoContent() {
  const [config, setConfig] = useState({ yeuCauXacNhan: true, batBuocLyDo: true, batBuocGhiChu: false })
  const columns: TableColumn[] = [
    { key: 'stt', label: 'STT', width: '60px' },
    { key: 'tenLyDo', label: 'Lý do' },
    { key: 'trangThai', label: 'Trạng thái', width: '150px' },
    { key: 'thaoTac', label: 'Thao tác', width: '100px' },
  ]
  return (
    <div className="cai-dat-content">
      <SectionHeader title="CẤU HÌNH RÚT HỒ SƠ" subtitle="Thiết lập các quy định và lý do sử dụng khi rút hồ sơ" />
      <div className="cai-dat-content__section">
        <SectionHeader title="LÝ DO RÚT HỒ SƠ" />
        <Toolbar actionButton={<button className="cai-dat-btn cai-dat-btn--primary" onClick={() => {}}>{Icons.plus} Thêm lý do</button>} />
        <Table columns={columns} data={MOCK_LY_DO_RUT_HO_SO} renderRow={(item, index) => (
          <tr key={item.id}>
            <td className="cai-dat-table__cell cai-dat-table__cell--center">{String(index + 1).padStart(2, '0')}</td>
            <td className="cai-dat-table__cell">{item.tenLyDo}</td>
            <td className="cai-dat-table__cell"><StatusBadge status={item.trangThai} /></td>
            <td className="cai-dat-table__cell cai-dat-table__cell--center"><button className="cai-dat-btn-action" onClick={() => {}}>{Icons.edit} Sửa</button></td>
          </tr>
        )} />
      </div>
      <div className="cai-dat-content__section">
        <SectionHeader title="XÁC NHẬN RÚT HỒ SƠ" />
        <Card title="">
          <div className="cai-dat-config-item"><label>Yêu cầu xác nhận trước khi rút:</label><Toggle checked={config.yeuCauXacNhan} onChange={v => setConfig(p => ({ ...p, yeuCauXacNhan: v }))} /></div>
          <div className="cai-dat-config-item"><label>Bắt buộc nhập lý do:</label><Toggle checked={config.batBuocLyDo} onChange={v => setConfig(p => ({ ...p, batBuocLyDo: v }))} /></div>
          <div className="cai-dat-config-item"><label>Bắt buộc ghi chú:</label><Toggle checked={config.batBuocGhiChu} onChange={v => setConfig(p => ({ ...p, batBuocGhiChu: v }))} /></div>
        </Card>
      </div>
      <div className="cai-dat-form__actions"><button className="cai-dat-btn cai-dat-btn--secondary">Hủy thay đổi</button><button className="cai-dat-btn cai-dat-btn--primary">Lưu cấu hình</button></div>
    </div>
  )
}

function ThongTinHeThongContent() {
  const [config, setConfig] = useState({ tenDonVi: 'HỌC VIỆN PHỤ NỮ VIỆT NAM', tenHeThong: 'Hệ thống quản lý hồ sơ sinh viên VWA', email: 'contact@vwa.edu.vn', soDienThoai: '0243.XXX.XXXX', diaChi: 'Hà Nội, Việt Nam' })
  return (
    <div className="cai-dat-content">
      <SectionHeader title="THÔNG TIN HỆ THỐNG" subtitle="Cấu hình thông tin hiển thị chung của hệ thống" />
      <div className="cai-dat-form">
        <div className="cai-dat-form__group"><label className="cai-dat-form__label">Tên đơn vị</label><input type="text" className="cai-dat-form__input" value={config.tenDonVi} onChange={e => setConfig(p => ({ ...p, tenDonVi: e.target.value }))} /></div>
        <div className="cai-dat-form__group"><label className="cai-dat-form__label">Tên hệ thống</label><input type="text" className="cai-dat-form__input" value={config.tenHeThong} onChange={e => setConfig(p => ({ ...p, tenHeThong: e.target.value }))} /></div>
        <div className="cai-dat-form__row">
          <div className="cai-dat-form__group"><label className="cai-dat-form__label">Email liên hệ</label><input type="email" className="cai-dat-form__input" value={config.email} onChange={e => setConfig(p => ({ ...p, email: e.target.value }))} /></div>
          <div className="cai-dat-form__group"><label className="cai-dat-form__label">Số điện thoại</label><input type="text" className="cai-dat-form__input" value={config.soDienThoai} onChange={e => setConfig(p => ({ ...p, soDienThoai: e.target.value }))} /></div>
        </div>
        <div className="cai-dat-form__group"><label className="cai-dat-form__label">Địa chỉ</label><input type="text" className="cai-dat-form__input" value={config.diaChi} onChange={e => setConfig(p => ({ ...p, diaChi: e.target.value }))} /></div>
        <div className="cai-dat-form__group">
          <label className="cai-dat-form__label">Logo</label>
          <div className="cai-dat-form__logo">
            <div className="cai-dat-form__logo-preview"><span className="cai-dat-form__logo-placeholder">VWA</span></div>
            <button className="cai-dat-btn cai-dat-btn--secondary">{Icons.image} Xem logo</button>
            <button className="cai-dat-btn cai-dat-btn--secondary">{Icons.upload} Thay đổi</button>
          </div>
        </div>
      </div>
      <div className="cai-dat-form__actions"><button className="cai-dat-btn cai-dat-btn--secondary">Hủy</button><button className="cai-dat-btn cai-dat-btn--primary">Lưu thay đổi</button></div>
    </div>
  )
}

function SaoLuuDuLieuContent() {
  const columns: TableColumn[] = [
    { key: 'thoiGian', label: 'Thời gian', width: '160px' },
    { key: 'nguoiThucHien', label: 'Người thực hiện', width: '150px' },
    { key: 'loai', label: 'Loại', width: '100px' },
    { key: 'dungLuong', label: 'Dung lượng', width: '100px' },
    { key: 'trangThai', label: 'Trạng thái', width: '130px' },
  ]
  return (
    <div className="cai-dat-content">
      <SectionHeader title="SAO LƯU & DỮ LIỆU" subtitle="Quản lý việc sao lưu và xuất dữ liệu hệ thống" />
      <div className="cai-dat-backup-grid">
        <Card title="SAO LƯU DỮ LIỆU">
          <p className="cai-dat-card__description">Sao lưu dữ liệu hệ thống</p>
          <div className="cai-dat-card__info"><span className="cai-dat-card__info-label">{Icons.clock} Lần sao lưu gần nhất:</span><span className="cai-dat-card__info-value">28/09/2026 17:30</span></div>
          <button className="cai-dat-btn cai-dat-btn--primary">{Icons.downloadCloud} Sao lưu ngay</button>
        </Card>
        <Card title="XUẤT DỮ LIỆU">
          <p className="cai-dat-card__description">Xuất dữ liệu ra file</p>
          <div className="cai-dat-card__checkboxes">
            <label className="cai-dat-checkbox"><input type="checkbox" defaultChecked /><span>Sinh viên</span></label>
            <label className="cai-dat-checkbox"><input type="checkbox" defaultChecked /><span>Hồ sơ</span></label>
            <label className="cai-dat-checkbox"><input type="checkbox" defaultChecked /><span>Giấy tờ</span></label>
            <label className="cai-dat-checkbox"><input type="checkbox" /><span>Toàn bộ dữ liệu</span></label>
          </div>
          <button className="cai-dat-btn cai-dat-btn--primary">{Icons.upload} Xuất dữ liệu</button>
        </Card>
      </div>
      <div className="cai-dat-content__section">
        <SectionHeader title="LỊCH SỬ SAO LƯU" />
        <Table columns={columns} data={MOCK_LICH_SU_SAO_LUU} renderRow={(item) => (
          <tr key={item.id}>
            <td className="cai-dat-table__cell">{item.thoiGian}</td>
            <td className="cai-dat-table__cell">{item.nguoiThucHien}</td>
            <td className="cai-dat-table__cell">{item.loai}</td>
            <td className="cai-dat-table__cell">{item.dungLuong}</td>
            <td className="cai-dat-table__cell"><StatusBadge status={item.trangThai} /></td>
          </tr>
        )} />
      </div>
    </div>
  )
}

// ============ MAIN COMPONENT ============
export function TrangCaiDat() {
  const [activeMenu, setActiveMenu] = useState<string>('khoa')
  const [expandedMenu, setExpandedMenu] = useState<string[]>(['danh-muc-dao-tao', 'danh-muc-ho-so', 'trang-thai'])
  const menuTree = getMenuTree()

  const toggleMenu = (menuId: string) => {
    setExpandedMenu(prev => prev.includes(menuId) ? prev.filter(id => id !== menuId) : [...prev, menuId])
  }
  const handleMenuClick = (menuId: string) => {
    setActiveMenu(menuId)
    const item = MENU_ITEMS.find(m => m.id === menuId)
    if (item?.parentId && !expandedMenu.includes(item.parentId)) setExpandedMenu(prev => [...prev, item.parentId!])
  }

  const renderContent = () => {
    switch (activeMenu) {
      case 'nganh': return <NganhContent />
      case 'khoa': return <KhoaContent />
      case 'khoa-nam-hoc': return <KhoaHocContent />
      case 'lop': return <LopContent />
      case 'loai-giay-to': return <LoaiGiayToContent />
      case 'nguoi-dung': return <NguoiDungContent />
      case 'trang-thai-hoc-vu': return <TrangThaiHocVuContent />
      case 'trang-thai-ho-so': return <TrangThaiHoSoContent />
      case 'trang-thai-giay-to': return <TrangThaiGiayToContent />
      case 'cau-hinh-muon-tra': return <CauHinhMuonTraContent />
      case 'cau-hinh-rut-ho-so': return <CauHinhRutHoSoContent />
      case 'thong-tin-he-thong': return <ThongTinHeThongContent />
      case 'sao-luu-du-lieu': return <SaoLuuDuLieuContent />
      default: return null
    }
  }

  return (
    <div className="trang-cai-dat">
      <div className="cai-dat-header">
        <h1 className="cai-dat-header__title">Cài đặt</h1>
        <p className="cai-dat-header__subtitle">Quản lý và cấu hình hệ thống</p>
      </div>
      <div className="cai-dat-layout">
        <aside className="cai-dat-sidebar">
          <nav className="cai-dat-nav">
            {menuTree.map((item) => (
              <div key={item.id} className="cai-dat-nav__group">
                <button
                  className={`cai-dat-nav__item ${(activeMenu === item.id || item.children?.some(c => c.id === activeMenu)) ? 'cai-dat-nav__item--active' : ''}`}
                  onClick={() => item.children && item.children.length > 0 ? toggleMenu(item.id) : handleMenuClick(item.id)}
                >
                  <span className="cai-dat-nav__icon">{item.icon}</span>
                  <span className="cai-dat-nav__label">{item.label}</span>
                  {item.children && item.children.length > 0 && <span className="cai-dat-nav__arrow">{expandedMenu.includes(item.id) ? Icons.chevronDown : Icons.chevronRight}</span>}
                </button>
                {item.children && item.children.length > 0 && expandedMenu.includes(item.id) && (
                  <div className="cai-dat-nav__children">
                    {item.children.map((child) => (
                      <button key={child.id} className={`cai-dat-nav__child ${activeMenu === child.id ? 'cai-dat-nav__child--active' : ''}`} onClick={() => handleMenuClick(child.id)}>
                        {child.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>
        </aside>
        <main className="cai-dat-main">{renderContent()}</main>
      </div>
    </div>
  )
}
