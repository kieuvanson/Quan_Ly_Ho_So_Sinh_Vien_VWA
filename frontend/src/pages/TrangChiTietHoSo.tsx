import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  PlusCircle,
  ArrowRightLeft,
  FileX,
  Printer,
  FileSearch,
  AlertCircle,
  Pencil,
  Loader2,
  Trash2,
  Save,
  ClipboardList,
  Calendar,
  Inbox,
} from 'lucide-react'
import { sinhVienApi } from '../api/sinhVien'
import { hoSoGiayToApi } from '../api/hoSoGiayTo'
import { loaiGiayToApi } from '../api/loaiGiayTo'
import { phieuMuonApi, lookupApi } from '../api/phieuMuon'
import { authStore } from '../lib/authStore'
import { apiClient } from '../api/client'
import type { SinhVien, HoSoGiayTo, LoaiGiayTo, PhieuMuon } from '../api/types'
import { Button, Modal, FormInput, FormSelect, Toast } from '../components/ui'
import './TrangChiTietHoSo.css'

/** Hạn trả mặc định = ngày mượn + 7 ngày. */
function defaultHanTra(ngayMuon: string): string {
  if (!ngayMuon) return ''
  try {
    const d = new Date(ngayMuon)
    d.setDate(d.getDate() + 7)
    return d.toISOString().split('T')[0]
  } catch {
    return ''
  }
}

type TabType = 'thong-tin' | 'giay-to'

interface FormData {
  hoTen: string
  mssv: string
  cccd: string
  ngaySinh: string
  gioiTinh: string
  soDienThoai: string
  lopHanhChinh: string
  khoa: string
  nganh: string
}

// Mapping trạng thái học vụ từ backend
const TRANG_THAI_MAPPING: Record<string, { label: string; className: string }> = {
  'Đang học': { label: 'Đang học', className: 'badge--success' },
  'Bảo lưu': { label: 'Bảo lưu', className: 'badge--warning' },
  'Đình chỉ': { label: 'Đình chỉ', className: 'badge--danger' },
  'Tốt nghiệp': { label: 'Tốt nghiệp', className: 'badge--primary' },
  'Đã rút hồ sơ': { label: 'Đã rút hồ sơ', className: 'badge--secondary' },
}

// Mapping trạng thái nộp giấy tờ
const TRANG_THAI_NOP_MAPPING: Record<string, { label: string; className: string }> = {
  'Đã nộp': { label: 'Đã nộp', className: 'badge--success' },
  'Chưa nộp': { label: 'Chưa nộp', className: 'badge--secondary' },
  'Thiếu': { label: 'Thiếu', className: 'badge--warning' },
  'Không hợp lệ': { label: 'Không hợp lệ', className: 'badge--danger' },
}

// Mapping trạng thái phiếu mượn
const TRANG_THAI_PHIEU_MAPPING: Record<string, { label: string; className: string }> = {
  'Chờ duyệt': { label: 'Chờ duyệt', className: 'badge--info' },
  'Đang mượn': { label: 'Đang mượn', className: 'badge--primary' },
  'Quá hạn': { label: 'Quá hạn', className: 'badge--danger' },
  'Đã duyệt': { label: 'Đã duyệt', className: 'badge--primary' },
  'Đã trả': { label: 'Đã trả', className: 'badge--success' },
  'Hoàn tất': { label: 'Hoàn tất', className: 'badge--success' },
  'Từ chối': { label: 'Từ chối', className: 'badge--danger' },
}

export function TrangChiTietHoSo() {
  const { mssv } = useParams<{ mssv: string }>()
  const navigate = useNavigate()

  // Tab state
  const [activeTab, setActiveTab] = useState<TabType>('thong-tin')

  // Data state
  const [sinhVien, setSinhVien] = useState<SinhVien | null>(null)
  const [giayToList, setGiayToList] = useState<HoSoGiayTo[]>([])
  const [loaiGiayToList, setLoaiGiayToList] = useState<LoaiGiayTo[]>([])

  // Loading state
  const [isLoadingSv, setIsLoadingSv] = useState(true)
  const [isLoadingGt, setIsLoadingGt] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Error state
  const [errorSv, setErrorSv] = useState<string | null>(null)
  const [errorGt, setErrorGt] = useState<string | null>(null)

  // Toast state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false)
  // Modal Bổ sung giấy tờ
  const [isBoSungModalOpen, setIsBoSungModalOpen] = useState(false)
  const [isSubmittingBoSung, setIsSubmittingBoSung] = useState(false)
  /** Loại giấy tờ CHƯA có trong hồ sơ SV (để user chọn khi bổ sung). */
  const [availableLoaiGiayTo, setAvailableLoaiGiayTo] = useState<LoaiGiayTo[]>([])
  const [boSungForm, setBoSungForm] = useState({
    maLoai: '',
    trangThaiNop: 'Đã nộp',
    banGocBanSao: 'Bản sao',
    viTriLuuKho: '',
    ghiChu: '',
  })
  const [formData, setFormData] = useState<FormData>({
    hoTen: '',
    mssv: '',
    cccd: '',
    ngaySinh: '',
    gioiTinh: '',
    soDienThoai: '',
    lopHanhChinh: '',
    khoa: '',
    nganh: '',
  })

  // ============================================================
  // Phiếu mượn / trả đang hoạt động của sinh viên này
  // ============================================================
  const [activePhieuMuonList, setActivePhieuMuonList] = useState<PhieuMuon[]>([])
  const [isLoadingPhieuMuon, setIsLoadingPhieuMuon] = useState(false)

  /** Fetch danh sách phiếu đang hoạt động (Chờ duyệt / Đang mượn / Quá hạn) của SV. */
  const fetchActivePhieuMuon = useCallback(async (mssvVal: string) => {
    setIsLoadingPhieuMuon(true)
    try {
      const res = await phieuMuonApi.getActiveByMssv(mssvVal)
      if (res.success && Array.isArray(res.data)) {
        setActivePhieuMuonList(res.data)
      } else {
        setActivePhieuMuonList([])
      }
    } catch {
      setActivePhieuMuonList([])
    } finally {
      setIsLoadingPhieuMuon(false)
    }
  }, [])

  // ============================================================
  // Modal Mượn / trả hồ sơ
  // ============================================================
  const [isMuonTraModalOpen, setIsMuonTraModalOpen] = useState(false)
  const [isSubmittingMuonTra, setIsSubmittingMuonTra] = useState(false)
  /** Hồ sơ giấy tờ load khi mở modal Mượn/Trả. */
  const [muonTraHoSoList, setMuonTraHoSoList] = useState<HoSoGiayTo[]>([])
  const [isLoadingMuonTraHoSo, setIsLoadingMuonTraHoSo] = useState(false)
  const [selectedMaHoSo, setSelectedMaHoSo] = useState<string[]>([])
  const [muonTraForm, setMuonTraForm] = useState({
    loaiPhieu: 'Mượn tạm thời',
    ngayMuon: new Date().toISOString().split('T')[0],
    ngayTraDuKien: defaultHanTra(new Date().toISOString().split('T')[0]),
    lyDo: '',
  })

  // Fetch student data
  useEffect(() => {
    if (!mssv) return

    setIsLoadingSv(true)
    setErrorSv(null)

    sinhVienApi.getByMssv(mssv)
      .then((response) => {
        if (response.success && response.data) {
          setSinhVien(response.data)
          // Pre-fill form data
          setFormData({
            hoTen: response.data.hoTen || '',
            mssv: response.data.mssv || '',
            cccd: response.data.cccd || '',
            ngaySinh: response.data.ngaySinh ? formatDate(response.data.ngaySinh) : '',
            gioiTinh: response.data.gioiTinh || '',
            soDienThoai: response.data.sdt || '',
            lopHanhChinh: response.data.lop || '',
            khoa: response.data.khoa || '',
            nganh: response.data.nganh || '',
          })
        } else {
          setErrorSv(response.message || 'Không thể tải thông tin sinh viên')
        }
      })
      .catch((err) => {
        const message = err.response?.data?.message || err.message || 'Đã xảy ra lỗi'
        setErrorSv(message)
      })
      .finally(() => {
        setIsLoadingSv(false)
      })

    // Đồng thời load danh sách phiếu mượn đang hoạt động của SV này
    fetchActivePhieuMuon(mssv)
  }, [mssv, fetchActivePhieuMuon])

  // Fetch documents when tab 'giay-to' is active
  useEffect(() => {
    if (!mssv || activeTab !== 'giay-to') return

    // Reset list khi đổi mssv để tránh hiển thị data của SV cũ
    setGiayToList([])
    setLoaiGiayToList([])
    setIsLoadingGt(true)
    setErrorGt(null)

    hoSoGiayToApi.getByMssv(mssv)
      .then((response) => {
        if (response.success && response.data) {
          setGiayToList(response.data)
        } else {
          setErrorGt(response.message || 'Không thể tải danh sách giấy tờ')
        }
      })
      .catch((err) => {
        const message = err.response?.data?.message || err.message || 'Đã xảy ra lỗi'
        setErrorGt(message)
      })
      .finally(() => {
        setIsLoadingGt(false)
      })
  }, [mssv, activeTab])

  // Fetch loai giay to khi mở tab giay-to
  useEffect(() => {
    if (activeTab !== 'giay-to') return
    if (loaiGiayToList.length > 0) return // cache

    loaiGiayToApi.getAll()
      .then((response) => {
        if (response.success && response.data) {
          setLoaiGiayToList(response.data)
        } else {
          // Non-critical error - we can fallback to maLoai
          console.warn('Không thể tải danh sách loại giấy tờ:', response.message)
        }
      })
      .catch((err) => {
        // Non-critical error - fallback to maLoai
        console.warn('Lỗi khi tải loại giấy tờ:', err.message)
      })
  }, [activeTab, loaiGiayToList.length])

  // Format date from ISO string to DD/MM/YYYY
  function formatDate(dateStr: string): string {
    if (!dateStr) return ''
    try {
      const date = new Date(dateStr)
      return date.toLocaleDateString('vi-VN')
    } catch {
      return dateStr
    }
  }

  // Get document name from maLoai
  function getTenGiayTo(maLoai: string): string {
    const loai = loaiGiayToList.find((lgt) => lgt.maLoai === maLoai)
    return loai?.tenGiayTo || `Mã loại: ${maLoai}`
  }

  // Get badge info for status
  function getBadgeInfo(trangThai: string) {
    return TRANG_THAI_MAPPING[trangThai] || { label: trangThai, className: '' }
  }

  function showToast(message: string, type: 'success' | 'error' | 'info' = 'info') {
    setToast({ message, type })
  }

  /** Mở modal Bổ sung giấy tờ — load loại giấy tờ chưa có trong hồ sơ SV. */
  function handleOpenBoSungModal() {
    if (!sinhVien) return

    // Lấy loại giấy tờ CHƯA có trong giayToList
    const existingMaLoai = new Set(giayToList.map((g) => g.maLoai))
    const available = loaiGiayToList.filter(
      (lgt) => lgt.dangSuDung && !existingMaLoai.has(lgt.maLoai)
    )
    setAvailableLoaiGiayTo(available)
    setBoSungForm({
      maLoai: available[0]?.maLoai || '',
      trangThaiNop: 'Đã nộp',
      banGocBanSao: 'Bản sao',
      viTriLuuKho: '',
      ghiChu: '',
    })
    setIsBoSungModalOpen(true)
  }

  function handleCloseBoSungModal() {
    setIsBoSungModalOpen(false)
  }

  /** Submit form Bổ sung — gọi POST /api/ho-so-giay-to. */
  async function handleSubmitBoSung() {
    if (!mssv) return
    if (!boSungForm.maLoai) {
      showToast('Vui lòng chọn loại giấy tờ', 'error')
      return
    }

    setIsSubmittingBoSung(true)
    try {
      const res = await hoSoGiayToApi.create(mssv, boSungForm.maLoai, {
        trangThaiNop: boSungForm.trangThaiNop,
        banGocBanSao: boSungForm.banGocBanSao,
        viTriLuuKho: boSungForm.viTriLuuKho || undefined,
        ghiChu: boSungForm.ghiChu || undefined,
      })
      if (res.success) {
        showToast(
          `Bổ sung giấy tờ thành công. Mã hồ sơ: ${res.data?.maHoSo || ''}`,
          'success'
        )
        setIsBoSungModalOpen(false)
        // Refresh danh sách giấy tờ
        setGiayToList([])
      } else {
        showToast(res.message || 'Bổ sung giấy tờ thất bại', 'error')
      }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } }
      showToast(
        e.response?.data?.message || 'Lỗi kết nối máy chủ. Vui lòng thử lại.',
        'error'
      )
    } finally {
      setIsSubmittingBoSung(false)
    }
  }

  /** Tick / bỏ tick nhanh trạng thái nộp — gọi PATCH /trang-thai. */
  async function handleToggleTrangThaiNop(giayTo: HoSoGiayTo) {
    const newTrangThai = giayTo.trangThaiNop === 'Đã nộp' ? 'Chưa nộp' : 'Đã nộp'
    try {
      const res = await hoSoGiayToApi.capNhatTrangThai(giayTo.maHoSo, newTrangThai)
      if (res.success) {
        // Update local state
        setGiayToList((prev) =>
          prev.map((g) =>
            g.maHoSo === giayTo.maHoSo ? { ...g, trangThaiNop: newTrangThai } : g
          )
        )
        showToast(
          newTrangThai === 'Đã nộp'
            ? 'Đã đánh dấu ĐÃ NỘP. Lịch sử nộp đã được ghi.'
            : 'Đã đánh dấu CHƯA NỘP. Lịch sử nộp đã được ghi.',
          'success'
        )
      } else {
        showToast(res.message || 'Cập nhật trạng thái thất bại', 'error')
      }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } }
      showToast(e.response?.data?.message || 'Lỗi kết nối máy chủ', 'error')
    }
  }

  /** Xóa 1 hồ sơ giấy tờ — gọi DELETE. */
  async function handleDeleteGiayTo(giayTo: HoSoGiayTo) {
    if (!confirm(`Bạn có chắc chắn muốn xóa hồ sơ ${giayTo.maHoSo}?`)) return
    try {
      await apiClient.delete(`/api/ho-so-giay-to/${encodeURIComponent(giayTo.maHoSo)}`)
      setGiayToList((prev) => prev.filter((g) => g.maHoSo !== giayTo.maHoSo))
      showToast('Xóa hồ sơ giấy tờ thành công', 'success')
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } }
      showToast(e.response?.data?.message || 'Xóa thất bại', 'error')
    }
  }

  /** Mở modal Mượn / trả hồ sơ. Auto-load danh sách hồ sơ giấy tờ của SV đang xem. */
  const handleMuonTra = useCallback(async () => {
    if (!sinhVien || !mssv) return
    setIsMuonTraModalOpen(true)
    setIsLoadingMuonTraHoSo(true)
    setSelectedMaHoSo([])
    setMuonTraForm({
      loaiPhieu: 'Mượn tạm thời',
      ngayMuon: new Date().toISOString().split('T')[0],
      ngayTraDuKien: defaultHanTra(new Date().toISOString().split('T')[0]),
      lyDo: '',
    })
    try {
      const list = await lookupApi.getHoSoGiayTo(mssv)
      setMuonTraHoSoList(list)
    } catch {
      setMuonTraHoSoList([])
    } finally {
      setIsLoadingMuonTraHoSo(false)
    }
  }, [sinhVien, mssv])

  function handleCloseMuonTraModal() {
    setIsMuonTraModalOpen(false)
    setSelectedMaHoSo([])
    setMuonTraForm((prev) => ({ ...prev, lyDo: '' }))
  }

  /** Submit tạo phiếu mượn / rút — gọi POST /api/phieu-muon. */
  async function handleSubmitMuonTra() {
    if (!sinhVien || !mssv) return
    if (selectedMaHoSo.length === 0) {
      showToast('Vui lòng chọn ít nhất 1 hồ sơ giấy tờ', 'error')
      return
    }
    if (!muonTraForm.lyDo.trim()) {
      showToast('Vui lòng nhập lý do mượn / rút', 'error')
      return
    }
    if (muonTraForm.loaiPhieu === 'Mượn tạm thời' && !muonTraForm.ngayTraDuKien) {
      showToast('Phiếu mượn tạm thời phải có hạn trả', 'error')
      return
    }

    setIsSubmittingMuonTra(true)
    try {
      const res = await phieuMuonApi.create({
        mssv,
        loaiPhieu: muonTraForm.loaiPhieu,
        ngayMuon: muonTraForm.ngayMuon,
        ngayTraDuKien:
          muonTraForm.loaiPhieu === 'Mượn tạm thời' ? muonTraForm.ngayTraDuKien : undefined,
        lyDo: muonTraForm.lyDo.trim(),
        danhSachMaHoSo: selectedMaHoSo,
      })
      if (res.success) {
        showToast(
          `Tạo phiếu thành công. Mã phiếu: ${res.data?.maPhieu || ''}`,
          'success'
        )
        handleCloseMuonTraModal()
        // Refresh lại tab giấy tờ + danh sách phiếu đang hoạt động
        setGiayToList([])
        if (mssv) fetchActivePhieuMuon(mssv)
      } else {
        showToast(res.message || 'Tạo phiếu thất bại', 'error')
      }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } }
      showToast(e.response?.data?.message || 'Lỗi kết nối máy chủ', 'error')
    } finally {
      setIsSubmittingMuonTra(false)
    }
  }

  function handleRutHoSo() {
    showToast('Chức năng đang được phát triển.')
  }

  function handleInHoSo() {
    showToast('Chức năng đang được phát triển.')
  }

  function handleBack() {
    navigate('/danh-sach-ho-so')
  }

  function handleRetrySv() {
    // Trigger refetch by updating mssv dependency
    setSinhVien(null)
    setIsLoadingSv(true)
    setErrorSv(null)
    sinhVienApi.getByMssv(mssv!)
      .then((response) => {
        if (response.success && response.data) {
          setSinhVien(response.data)
        } else {
          setErrorSv(response.message || 'Không thể tải thông tin sinh viên')
        }
      })
      .catch((err) => {
        setErrorSv(err.message || 'Đã xảy ra lỗi')
      })
      .finally(() => {
        setIsLoadingSv(false)
      })
  }

  function handleRetryGt() {
    setGiayToList([])
    setIsLoadingGt(true)
    setErrorGt(null)
    hoSoGiayToApi.getByMssv(mssv!)
      .then((response) => {
        if (response.success && response.data) {
          setGiayToList(response.data)
        } else {
          setErrorGt(response.message || 'Không thể tải danh sách giấy tờ')
        }
      })
      .catch((err) => {
        setErrorGt(err.message || 'Đã xảy ra lỗi')
      })
      .finally(() => {
        setIsLoadingGt(false)
      })
  }

  function handleOpenEditModal() {
    if (sinhVien) {
      setFormData({
        hoTen: sinhVien.hoTen || '',
        mssv: sinhVien.mssv || '',
        cccd: sinhVien.cccd || '',
        ngaySinh: sinhVien.ngaySinh ? formatDate(sinhVien.ngaySinh) : '',
        gioiTinh: sinhVien.gioiTinh || '',
        soDienThoai: sinhVien.sdt || '',
        lopHanhChinh: sinhVien.lop || '',
        khoa: sinhVien.khoa || '',
        nganh: sinhVien.nganh || '',
      })
      setIsModalOpen(true)
    }
  }

  function handleCloseModal() {
    setIsModalOpen(false)
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  function handleSelectChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  function handleSave() {
    setIsSaving(true)
    // TODO: Call update API when available
    setTimeout(() => {
      setIsSaving(false)
      setIsModalOpen(false)
      showToast('Cập nhật thông tin thành công', 'success')
    }, 500)
  }

  // Form options
  const gioiTinhOptions = [
    { value: 'Nam', label: 'Nam' },
    { value: 'Nữ', label: 'Nữ' },
  ]

  const khoaOptions = [
    { value: 'K2022', label: 'K2022' },
    { value: 'K2021', label: 'K2021' },
    { value: 'K2020', label: 'K2020' },
    { value: 'K2019', label: 'K2019' },
    { value: 'K2018', label: 'K2018' },
  ]

  const nganhOptions = [
    'Công nghệ thông tin',
    'Quản trị kinh doanh',
    'Kế toán',
    'Ngôn ngữ Anh',
    'Luật',
    'Tài chính - Ngân hàng',
    'Quan hệ quốc tế',
  ].map((nganh) => ({ value: nganh, label: nganh }))

  // Not found state (after loading)
  if (!isLoadingSv && !sinhVien && errorSv) {
    return (
      <div className="chi-tiet-ho-so">
        <div className="chi-tiet-ho-so__empty">
          <AlertCircle className="chi-tiet-ho-so__empty-icon" size={64} />
          <h2 className="chi-tiet-ho-so__empty-title">Không tìm thấy hồ sơ sinh viên</h2>
          <p className="chi-tiet-ho-so__empty-desc">
            {errorSv}
          </p>
          <div className="chi-tiet-ho-so__empty-actions">
            <Button variant="primary" icon={<ArrowLeft size={18} />} onClick={handleBack}>
              Quay lại danh sách
            </Button>
            <Button variant="secondary" onClick={handleRetrySv}>
              Thử lại
            </Button>
          </div>
        </div>
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

  // Loading state
  if (isLoadingSv && !sinhVien) {
    return (
      <div className="chi-tiet-ho-so">
        <Button variant="secondary" icon={<ArrowLeft size={18} />} onClick={handleBack}>
          Quay lại danh sách
        </Button>
        <div className="chi-tiet-ho-so__loading">
          <Loader2 className="chi-tiet-ho-so__loading-icon" size={48} />
          <p>Đang tải thông tin sinh viên...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="chi-tiet-ho-so">
      {/* Back Button */}
      <Button variant="secondary" icon={<ArrowLeft size={18} />} onClick={handleBack}>
        Quay lại danh sách
      </Button>

      {/* Header Card */}
      <div className="chi-tiet-ho-so__header-card">
        <div className="chi-tiet-ho-so__header-top">
          <div>
            <h1 className="chi-tiet-ho-so__header-title">Hồ sơ sinh viên</h1>
            <div className="chi-tiet-ho-so__header-info">
              <div className="chi-tiet-ho-so__header-name">
                <span className="chi-tiet-ho-so__header-messv">{sinhVien?.hoTen}</span>
                <span className="chi-tiet-ho-so__header-mssv-label">MSSV: {sinhVien?.mssv}</span>
              </div>
              <span className={`chi-tiet-ho-so__badge ${getBadgeInfo(sinhVien?.trangThaiHocVu || '').className}`}>
                {getBadgeInfo(sinhVien?.trangThaiHocVu || '').label}
              </span>
            </div>
          </div>
          <Button variant="secondary" icon={<Pencil size={16} />} onClick={handleOpenEditModal}>
            Chỉnh sửa thông tin
          </Button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="chi-tiet-ho-so__actions">
        <Button variant="secondary" icon={<PlusCircle size={18} />} onClick={handleOpenBoSungModal}>
          Bổ sung giấy tờ
        </Button>
        <Button
          variant="secondary"
          icon={<ArrowRightLeft size={18} />}
          onClick={handleMuonTra}
          disabled={sinhVien?.trangThaiHocVu === 'Đã rút hồ sơ'}
          title={
            sinhVien?.trangThaiHocVu === 'Đã rút hồ sơ'
              ? 'Sinh viên đã rút hồ sơ — không thể tạo phiếu mượn.'
              : ''
          }
        >
          Mượn / trả hồ sơ
        </Button>
        <Button variant="danger" icon={<FileX size={18} />} onClick={handleRutHoSo}>
          Rút hồ sơ
        </Button>
        <Button variant="secondary" icon={<Printer size={18} />} onClick={handleInHoSo}>
          In / xuất hồ sơ
        </Button>
      </div>

      {/* Phiếu mượn / trả đang hoạt động của sinh viên này */}
      <div className="chi-tiet-ho-so__phieu-muon-card">
        <div className="chi-tiet-ho-so__phieu-muon-header">
          <div className="chi-tiet-ho-so__phieu-muon-title">
            <ClipboardList size={18} />
            <span>Phiếu mượn / trả đang hoạt động</span>
            <span className="chi-tiet-ho-so__phieu-muon-count">
              {isLoadingPhieuMuon ? '...' : `(${activePhieuMuonList.length})`}
            </span>
          </div>
        </div>

        {isLoadingPhieuMuon ? (
          <div className="chi-tiet-ho-so__phieu-muon-loading">
            <Loader2 size={20} className="chi-tiet-ho-so__loading-icon" />
            <span>Đang tải danh sách phiếu...</span>
          </div>
        ) : activePhieuMuonList.length === 0 ? (
          <div className="chi-tiet-ho-so__phieu-muon-empty">
            <Inbox size={20} />
            <span>Sinh viên hiện không có phiếu mượn / trả nào đang hoạt động.</span>
          </div>
        ) : (
          <div className="chi-tiet-ho-so__phieu-muon-list">
            {activePhieuMuonList.map((pm) => {
              const trangThaiInfo = TRANG_THAI_PHIEU_MAPPING[pm.trangThai] || {
                label: pm.trangThai,
                className: 'badge--secondary',
              }
              return (
                <div key={pm.maPhieu} className="chi-tiet-ho-so__phieu-muon-item">
                  <div className="chi-tiet-ho-so__phieu-muon-item-top">
                    <div className="chi-tiet-ho-so__phieu-muon-item-left">
                      <span className="chi-tiet-ho-so__phieu-muon-code">{pm.maPhieu}</span>
                      <span className={`chi-tiet-ho-so__badge ${trangThaiInfo.className}`}>
                        {trangThaiInfo.label}
                      </span>
                    </div>
                    <div className="chi-tiet-ho-so__phieu-muon-item-right">
                      <span className="chi-tiet-ho-so__phieu-muon-loai">
                        {pm.loaiPhieu}
                      </span>
                    </div>
                  </div>
                  <div className="chi-tiet-ho-so__phieu-muon-item-body">
                    <div className="chi-tiet-ho-so__phieu-muon-field">
                      <Calendar size={14} />
                      <span className="chi-tiet-ho-so__phieu-muon-label">Ngày mượn:</span>
                      <span>{formatDate(pm.ngayMuon || '')}</span>
                    </div>
                    {pm.loaiPhieu === 'Mượn tạm thời' && (
                      <div className="chi-tiet-ho-so__phieu-muon-field">
                        <Calendar size={14} />
                        <span className="chi-tiet-ho-so__phieu-muon-label">Hạn trả:</span>
                        <span>{formatDate(pm.ngayTraDuKien || '')}</span>
                      </div>
                    )}
                    <div className="chi-tiet-ho-so__phieu-muon-field">
                      <span className="chi-tiet-ho-so__phieu-muon-label">Cán bộ:</span>
                      <span>{pm.nguoiTao || '-'}</span>
                    </div>
                    <div className="chi-tiet-ho-so__phieu-muon-field chi-tiet-ho-so__phieu-muon-field--hoso">
                      <span className="chi-tiet-ho-so__phieu-muon-label">Hồ sơ:</span>
                      {pm.danhSachMaHoSo && pm.danhSachMaHoSo.length > 0 ? (
                        <div className="chi-tiet-ho-so__phieu-muon-hoso-tags">
                          {pm.danhSachMaHoSo.map((ma) => (
                            <span key={ma} className="chi-tiet-ho-so__phieu-muon-hoso-tag">
                              {ma}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span style={{ color: '#6b7280' }}>—</span>
                      )}
                    </div>
                    {pm.lyDo && (
                      <div className="chi-tiet-ho-so__phieu-muon-field chi-tiet-ho-so__phieu-muon-field--full">
                        <span className="chi-tiet-ho-so__phieu-muon-label">Lý do:</span>
                        <span>{pm.lyDo}</span>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="chi-tiet-ho-so__tabs-wrapper">
        <div className="chi-tiet-ho-so__tabs">
          <button
            className={`chi-tiet-ho-so__tab ${activeTab === 'thong-tin' ? 'chi-tiet-ho-so__tab--active' : ''}`}
            onClick={() => setActiveTab('thong-tin')}
          >
            Thông tin cá nhân & Học vụ
          </button>
          <button
            className={`chi-tiet-ho-so__tab ${activeTab === 'giay-to' ? 'chi-tiet-ho-so__tab--active' : ''}`}
            onClick={() => setActiveTab('giay-to')}
          >
            Hồ sơ giấy tờ
          </button>
        </div>

        {/* Tab Content */}
        <div className="chi-tiet-ho-so__tab-content">
          {/* Tab 1: Thông tin cá nhân & Học vụ */}
          {activeTab === 'thong-tin' && sinhVien && (
            <div className="chi-tiet-ho-so__info-grid">
              <div className="chi-tiet-ho-so__info-item">
                <span className="chi-tiet-ho-so__info-label">Họ và tên</span>
                <span className="chi-tiet-ho-so__info-value">{sinhVien.hoTen || '-'}</span>
              </div>
              <div className="chi-tiet-ho-so__info-item">
                <span className="chi-tiet-ho-so__info-label">MSSV</span>
                <span className="chi-tiet-ho-so__info-value">{sinhVien.mssv}</span>
              </div>
              <div className="chi-tiet-ho-so__info-item">
                <span className="chi-tiet-ho-so__info-label">CCCD</span>
                <span className="chi-tiet-ho-so__info-value">{sinhVien.cccd || '-'}</span>
              </div>
              <div className="chi-tiet-ho-so__info-item">
                <span className="chi-tiet-ho-so__info-label">Ngày sinh</span>
                <span className="chi-tiet-ho-so__info-value">{formatDate(sinhVien.ngaySinh || '')}</span>
              </div>
              <div className="chi-tiet-ho-so__info-item">
                <span className="chi-tiet-ho-so__info-label">Giới tính</span>
                <span className="chi-tiet-ho-so__info-value">{sinhVien.gioiTinh || '-'}</span>
              </div>
              <div className="chi-tiet-ho-so__info-item">
                <span className="chi-tiet-ho-so__info-label">Số điện thoại</span>
                <span className="chi-tiet-ho-so__info-value">{sinhVien.sdt || '-'}</span>
              </div>
              <div className="chi-tiet-ho-so__info-item">
                <span className="chi-tiet-ho-so__info-label">Email</span>
                <span className="chi-tiet-ho-so__info-value">{sinhVien.email || '-'}</span>
              </div>
              <div className="chi-tiet-ho-so__info-item">
                <span className="chi-tiet-ho-so__info-label">Quê quán</span>
                <span className="chi-tiet-ho-so__info-value">{sinhVien.queQuan || '-'}</span>
              </div>
              <div className="chi-tiet-ho-so__info-item">
                <span className="chi-tiet-ho-so__info-label">Lớp hành chính</span>
                <span className="chi-tiet-ho-so__info-value">{sinhVien.lop || '-'}</span>
              </div>
              <div className="chi-tiet-ho-so__info-item">
                <span className="chi-tiet-ho-so__info-label">Khóa</span>
                <span className="chi-tiet-ho-so__info-value">{sinhVien.khoa || '-'}</span>
              </div>
              <div className="chi-tiet-ho-so__info-item">
                <span className="chi-tiet-ho-so__info-label">Khóa năm nhập học</span>
                <span className="chi-tiet-ho-so__info-value">{sinhVien.khoaNamNhapHoc || '-'}</span>
              </div>
              <div className="chi-tiet-ho-so__info-item">
                <span className="chi-tiet-ho-so__info-label">Ngành</span>
                <span className="chi-tiet-ho-so__info-value">{sinhVien.nganh || '-'}</span>
              </div>
              <div className="chi-tiet-ho-so__info-item">
                <span className="chi-tiet-ho-so__info-label">Hệ đào tạo</span>
                <span className="chi-tiet-ho-so__info-value">{sinhVien.heDaoTao || '-'}</span>
              </div>
              <div className="chi-tiet-ho-so__info-item">
                <span className="chi-tiet-ho-so__info-label">Trạng thái học vụ</span>
                <span className={`chi-tiet-ho-so__badge ${getBadgeInfo(sinhVien.trangThaiHocVu).className}`}>
                  {getBadgeInfo(sinhVien.trangThaiHocVu).label}
                </span>
              </div>
            </div>
          )}

          {/* Tab 2: Hồ sơ giấy tờ */}
          {activeTab === 'giay-to' && (
            <>
              {/* Loading state */}
              {isLoadingGt && (
                <div className="chi-tiet-ho-so__loading">
                  <Loader2 className="chi-tiet-ho-so__loading-icon" size={32} />
                  <p>Đang tải danh sách giấy tờ...</p>
                </div>
              )}

              {/* Error state */}
              {!isLoadingGt && errorGt && (
                <div className="chi-tiet-ho-so__error">
                  <p className="chi-tiet-ho-so__error-text">{errorGt}</p>
                  <Button variant="secondary" onClick={handleRetryGt}>
                    Thử lại
                  </Button>
                </div>
              )}

              {/* Empty state */}
              {!isLoadingGt && !errorGt && giayToList.length === 0 && (
                <div className="chi-tiet-ho-so__empty">
                  <FileSearch className="chi-tiet-ho-so__empty-icon" size={48} />
                  <p className="chi-tiet-ho-so__empty-text">Chưa có giấy tờ nào được ghi nhận</p>
                </div>
              )}

              {/* Table */}
              {!isLoadingGt && !errorGt && giayToList.length > 0 && (
                <div className="chi-tiet-ho-so__table-wrapper">
                  <table className="chi-tiet-ho-so__table">
                    <thead>
                      <tr>
                        <th style={{ width: 40 }}>Đã nộp</th>
                        <th style={{ width: 90 }}>Mã hồ sơ</th>
                        <th>Tên giấy tờ</th>
                        <th style={{ width: 130 }}>Trạng thái nộp</th>
                        <th style={{ width: 120 }}>Bản gốc/Bản sao</th>
                        <th style={{ width: 140 }}>Vị trí lưu kho</th>
                        <th>Ghi chú</th>
                        <th style={{ width: 80 }}>Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {giayToList.map((giayTo, index) => {
                        const isDaNop = giayTo.trangThaiNop === 'Đã nộp'
                        const trangThaiInfo = TRANG_THAI_NOP_MAPPING[giayTo.trangThaiNop] || {
                          label: giayTo.trangThaiNop,
                          className: 'badge--secondary',
                        }
                        return (
                          <tr key={giayTo.maHoSo} className={isDaNop ? 'has-document' : 'no-document'}>
                            <td>
                              <input
                                type="checkbox"
                                checked={isDaNop}
                                onChange={() => handleToggleTrangThaiNop(giayTo)}
                                aria-label={`Đánh dấu ${giayTo.maHoSo} đã nộp`}
                                style={{ width: 18, height: 18, cursor: 'pointer' }}
                              />
                            </td>
                            <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>
                              {giayTo.maHoSo}
                            </td>
                            <td>{getTenGiayTo(giayTo.maLoai)}</td>
                            <td>
                              <span className={`chi-tiet-ho-so__badge ${trangThaiInfo.className}`}>
                                {trangThaiInfo.label}
                              </span>
                            </td>
                            <td>{giayTo.banGocBanSao || '-'}</td>
                            <td>{giayTo.viTriLuuKho || '-'}</td>
                            <td>
                              <span className="chi-tiet-ho-so__note">
                                {isDaNop ? 'Đã tiếp nhận' : 'Chưa nộp'}
                              </span>
                            </td>
                            <td>
                              <button
                                type="button"
                                onClick={() => handleDeleteGiayTo(giayTo)}
                                style={{
                                  background: 'transparent',
                                  border: '1px solid #dc2626',
                                  color: '#dc2626',
                                  borderRadius: 6,
                                  padding: '4px 8px',
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 4,
                                  fontSize: 12,
                                }}
                                title="Xóa hồ sơ giấy tờ"
                              >
                                <Trash2 size={14} />
                                Xóa
                              </button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title="Chỉnh sửa thông tin sinh viên"
        footer={
          <>
            <Button variant="secondary" onClick={handleCloseModal}>
              Hủy
            </Button>
            <Button variant="primary" onClick={handleSave} disabled={isSaving}>
              {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
            </Button>
          </>
        }
      >
        <div className="chi-tiet-ho-so__form-grid">
          <div className="chi-tiet-ho-so__form-group chi-tiet-ho-so__form-group--full">
            <FormInput
              label="Họ và tên"
              name="hoTen"
              value={formData.hoTen}
              onChange={handleInputChange}
            />
          </div>
          <FormInput
            label="MSSV"
            name="mssv"
            value={formData.mssv}
            disabled
          />
          <FormInput
            label="CCCD"
            name="cccd"
            value={formData.cccd}
            onChange={handleInputChange}
          />
          <FormInput
            label="Ngày sinh"
            name="ngaySinh"
            value={formData.ngaySinh}
            onChange={handleInputChange}
            placeholder="DD/MM/YYYY"
          />
          <FormSelect
            label="Giới tính"
            name="gioiTinh"
            value={formData.gioiTinh}
            onChange={handleSelectChange}
            options={gioiTinhOptions}
            placeholder="-- Chọn --"
          />
          <FormInput
            label="Số điện thoại"
            name="soDienThoai"
            value={formData.soDienThoai}
            onChange={handleInputChange}
          />
          <FormInput
            label="Lớp hành chính"
            name="lopHanhChinh"
            value={formData.lopHanhChinh}
            onChange={handleInputChange}
          />
          <FormSelect
            label="Khóa"
            name="khoa"
            value={formData.khoa}
            onChange={handleSelectChange}
            options={khoaOptions}
            placeholder="-- Chọn --"
          />
          <div className="chi-tiet-ho-so__form-group chi-tiet-ho-so__form-group--full">
            <FormSelect
              label="Ngành"
              name="nganh"
              value={formData.nganh}
              onChange={handleSelectChange}
              options={nganhOptions}
              placeholder="-- Chọn --"
            />
          </div>
        </div>
      </Modal>

      {/* Modal Bổ sung giấy tờ */}
      <Modal
        isOpen={isBoSungModalOpen}
        onClose={handleCloseBoSungModal}
        title="Bổ sung giấy tờ"
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={handleCloseBoSungModal}>
              Hủy
            </Button>
            <Button
              variant="primary"
              onClick={handleSubmitBoSung}
              disabled={isSubmittingBoSung}
              icon={isSubmittingBoSung ? <Loader2 size={16} /> : <Save size={16} />}
            >
              {isSubmittingBoSung ? 'Đang lưu...' : 'Bổ sung'}
            </Button>
          </>
        }
      >
        <div className="chi-tiet-ho-so__form-grid">
          <div className="chi-tiet-ho-so__form-group chi-tiet-ho-so__form-group--full">
            <FormSelect
              label="Loại giấy tờ *"
              name="maLoai"
              value={boSungForm.maLoai}
              onChange={(e) => setBoSungForm((prev) => ({ ...prev, maLoai: e.target.value }))}
              options={availableLoaiGiayTo.map((lgt) => ({
                value: lgt.maLoai,
                label: `${lgt.maLoai} - ${lgt.tenGiayTo}${lgt.batBuoc ? ' (Bắt buộc)' : ''}`,
              }))}
              placeholder="-- Chọn loại giấy tờ --"
            />
            {availableLoaiGiayTo.length === 0 && (
              <p style={{ color: '#dc2626', fontSize: 13, marginTop: 6 }}>
                Sinh viên đã có đủ tất cả 13 loại giấy tờ trong hệ thống.
              </p>
            )}
          </div>

          <FormSelect
            label="Trạng thái nộp *"
            name="trangThaiNop"
            value={boSungForm.trangThaiNop}
            onChange={(e) => setBoSungForm((prev) => ({ ...prev, trangThaiNop: e.target.value }))}
            options={[
              { value: 'Đã nộp', label: 'Đã nộp' },
              { value: 'Chưa nộp', label: 'Chưa nộp' },
              { value: 'Thiếu', label: 'Thiếu' },
              { value: 'Không hợp lệ', label: 'Không hợp lệ' },
            ]}
          />

          <FormSelect
            label="Bản gốc / Bản sao"
            name="banGocBanSao"
            value={boSungForm.banGocBanSao}
            onChange={(e) => setBoSungForm((prev) => ({ ...prev, banGocBanSao: e.target.value }))}
            options={[
              { value: 'Bản gốc', label: 'Bản gốc' },
              { value: 'Bản sao', label: 'Bản sao' },
            ]}
          />

          <div className="chi-tiet-ho-so__form-group chi-tiet-ho-so__form-group--full">
            <FormInput
              label="Vị trí lưu kho"
              name="viTriLuuKho"
              value={boSungForm.viTriLuuKho}
              onChange={(e) => setBoSungForm((prev) => ({ ...prev, viTriLuuKho: e.target.value }))}
              placeholder="VD: Kệ A-01-05"
            />
          </div>

          <div className="chi-tiet-ho-so__form-group chi-tiet-ho-so__form-group--full">
            <FormInput
              label="Ghi chú"
              name="ghiChu"
              value={boSungForm.ghiChu}
              onChange={(e) => setBoSungForm((prev) => ({ ...prev, ghiChu: e.target.value }))}
              placeholder="VD: Bổ sung giấy khai sinh bản sao có công chứng"
            />
          </div>
        </div>
      </Modal>

      {/* Modal Mượn / trả hồ sơ (sinh viên đang được chọn) */}
      <Modal
        isOpen={isMuonTraModalOpen}
        onClose={handleCloseMuonTraModal}
        title="Mượn / trả hồ sơ"
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={handleCloseMuonTraModal} disabled={isSubmittingMuonTra}>
              Hủy
            </Button>
            <Button
              variant="primary"
              onClick={handleSubmitMuonTra}
              disabled={isSubmittingMuonTra}
              icon={isSubmittingMuonTra ? <Loader2 size={16} /> : <ArrowRightLeft size={16} />}
            >
              {isSubmittingMuonTra ? 'Đang tạo phiếu...' : 'Tạo phiếu'}
            </Button>
          </>
        }
      >
        <div className="chi-tiet-ho-so__form-grid">
          {/* Thông tin sinh viên (read-only) */}
          <div className="chi-tiet-ho-so__form-group chi-tiet-ho-so__form-group--full">
            <h3 className="trang-muon-tra__form-section-title" style={{ margin: 0, padding: 0, border: 'none' }}>
              Sinh viên
            </h3>
            <div
              className="trang-muon-tra__info-card"
              style={{ background: '#f8fafc', border: '1px solid var(--color-border)', borderRadius: 8, padding: 12 }}
            >
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: 8,
                  fontSize: 14,
                }}
              >
                <div>
                  <span style={{ color: '#6b7280' }}>Họ tên: </span>
                  <strong>{sinhVien?.hoTen || '-'}</strong>
                </div>
                <div>
                  <span style={{ color: '#6b7280' }}>MSSV: </span>
                  <strong>{sinhVien?.mssv || mssv}</strong>
                </div>
                <div>
                  <span style={{ color: '#6b7280' }}>Lớp: </span>
                  <span>{sinhVien?.lop || '-'}</span>
                </div>
                <div>
                  <span style={{ color: '#6b7280' }}>Khóa: </span>
                  <span>{sinhVien?.khoa || '-'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Loại phiếu + cán bộ phụ trách */}
          <FormSelect
            label="Loại hồ sơ *"
            name="loaiPhieu"
            value={muonTraForm.loaiPhieu}
            onChange={(e) => {
              const v = e.target.value
              setMuonTraForm((prev) => ({
                ...prev,
                loaiPhieu: v,
                ngayTraDuKien:
                  v === 'Mượn tạm thời' ? defaultHanTra(prev.ngayMuon) : '',
              }))
            }}
            options={[
              { value: 'Mượn tạm thời', label: 'Mượn tạm thời' },
              { value: 'Rút vĩnh viễn', label: 'Rút vĩnh viễn' },
            ]}
          />
          <div className="chi-tiet-ho-so__form-group">
            <label
              className="chi-tiet-ho-so__form-label"
              style={{
                fontSize: 14,
                fontWeight: 500,
                color: 'var(--color-text-secondary)',
              }}
            >
              Cán bộ phụ trách
            </label>
            <input
              className="chi-tiet-ho-so__form-input"
              type="text"
              value={authStore.getUser()?.hoTen || authStore.getUser()?.username || '—'}
              disabled
              style={{
                padding: '10px 12px',
                border: '1px solid var(--color-border)',
                borderRadius: 6,
                fontSize: 14,
                background: '#f8fafc',
                color: 'var(--color-text-secondary)',
              }}
            />
          </div>

          <FormInput
            label="Ngày mượn *"
            name="ngayMuon"
            type="date"
            value={muonTraForm.ngayMuon}
            onChange={(e) => {
              const v = e.target.value
              setMuonTraForm((prev) => ({
                ...prev,
                ngayMuon: v,
                ngayTraDuKien:
                  prev.loaiPhieu === 'Mượn tạm thời' ? defaultHanTra(v) : prev.ngayTraDuKien,
              }))
            }}
          />
          {muonTraForm.loaiPhieu === 'Mượn tạm thời' && (
            <FormInput
              label="Hạn trả *"
              name="ngayTraDuKien"
              type="date"
              value={muonTraForm.ngayTraDuKien}
              onChange={(e) =>
                setMuonTraForm((prev) => ({ ...prev, ngayTraDuKien: e.target.value }))
              }
            />
          )}

          {/* Lý do mượn / rút */}
          <div className="chi-tiet-ho-so__form-group chi-tiet-ho-so__form-group--full">
            <FormInput
              label="Lý do mượn / rút *"
              name="lyDo"
              value={muonTraForm.lyDo}
              onChange={(e) => setMuonTraForm((prev) => ({ ...prev, lyDo: e.target.value }))}
              placeholder="Nhập lý do mượn hoặc rút hồ sơ"
            />
          </div>

          {/* Danh sách hồ sơ giấy tờ - cho phép tick chọn */}
          <div className="chi-tiet-ho-so__form-group chi-tiet-ho-so__form-group--full">
            <h3 className="trang-muon-tra__form-section-title" style={{ margin: 0, padding: 0, border: 'none' }}>
              Chọn hồ sơ giấy tờ * ({selectedMaHoSo.length}/{muonTraHoSoList.length} đã chọn)
            </h3>
            {isLoadingMuonTraHoSo ? (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  color: '#6b7280',
                  padding: 12,
                }}
              >
                <Loader2 size={16} className="chi-tiet-ho-so__loading-icon" />
                <span>Đang tải hồ sơ giấy tờ...</span>
              </div>
            ) : muonTraHoSoList.length === 0 ? (
              <p style={{ color: '#6b7280', fontSize: 14 }}>
                Sinh viên chưa có hồ sơ giấy tờ nào trong hệ thống. Hãy bổ sung giấy tờ trước.
              </p>
            ) : (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                  maxHeight: 240,
                  overflowY: 'auto',
                  border: '1px solid var(--color-border-light)',
                  borderRadius: 6,
                  padding: 8,
                  background: '#fafafa',
                }}
              >
                {muonTraHoSoList.map((hs) => {
                  const loai = loaiGiayToList.find((l) => l.maLoai === hs.maLoai)
                  return (
                    <label
                      key={hs.maHoSo}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'auto 90px 1fr 110px 110px',
                        gap: 8,
                        alignItems: 'center',
                        padding: '6px 8px',
                        borderRadius: 4,
                        cursor: 'pointer',
                        fontSize: 13,
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedMaHoSo.includes(hs.maHoSo)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedMaHoSo((prev) => [...prev, hs.maHoSo])
                          } else {
                            setSelectedMaHoSo((prev) =>
                              prev.filter((id) => id !== hs.maHoSo)
                            )
                          }
                        }}
                        style={{ cursor: 'pointer', width: 16, height: 16 }}
                      />
                      <span
                        style={{
                          fontFamily: 'monospace',
                          fontWeight: 600,
                          color: 'var(--color-primary)',
                        }}
                      >
                        {hs.maHoSo}
                      </span>
                      <span>{loai ? loai.tenGiayTo : hs.maLoai}</span>
                      <span style={{ color: '#6b7280' }}>{hs.trangThaiNop}</span>
                      <span style={{ color: '#6b7280', fontStyle: 'italic' }}>
                        {hs.viTriLuuKho || '-'}
                      </span>
                    </label>
                  )
                })}
              </div>
            )}
            <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
              <button
                type="button"
                onClick={() => setSelectedMaHoSo(muonTraHoSoList.map((h) => h.maHoSo))}
                style={{
                  fontSize: 12,
                  padding: '4px 10px',
                  border: '1px solid var(--color-border)',
                  borderRadius: 4,
                  background: 'var(--color-surface)',
                  cursor: 'pointer',
                }}
                disabled={muonTraHoSoList.length === 0}
              >
                Chọn tất cả
              </button>
              <button
                type="button"
                onClick={() => setSelectedMaHoSo([])}
                style={{
                  fontSize: 12,
                  padding: '4px 10px',
                  border: '1px solid var(--color-border)',
                  borderRadius: 4,
                  background: 'var(--color-surface)',
                  cursor: 'pointer',
                }}
                disabled={selectedMaHoSo.length === 0}
              >
                Bỏ chọn
              </button>
            </div>
          </div>
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
