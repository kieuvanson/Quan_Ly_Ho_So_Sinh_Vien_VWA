import { useState, useEffect } from 'react'
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
} from 'lucide-react'
import { sinhVienApi } from '../api/sinhVien'
import { hoSoGiayToApi } from '../api/hoSoGiayTo'
import { loaiGiayToApi } from '../api/loaiGiayTo'
import type { SinhVien, HoSoGiayTo, LoaiGiayTo } from '../api/types'
import { Button, Modal, FormInput, FormSelect, Toast } from '../components/ui'
import './TrangChiTietHoSo.css'

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
  }, [mssv])

  // Fetch documents when tab 'giay-to' is active
  useEffect(() => {
    if (!mssv || activeTab !== 'giay-to' || giayToList.length > 0) return

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
  }, [mssv, activeTab, giayToList.length])

  // Fetch loai giay to when needed for mapping
  useEffect(() => {
    if (activeTab !== 'giay-to') return

    // Only fetch if we have giayToList but no loaiGiayToList yet
    if (giayToList.length === 0 || loaiGiayToList.length > 0) return

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
  }, [activeTab, giayToList.length, loaiGiayToList.length])

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

  function handleBoSung() {
    showToast('Chức năng đang được phát triển.')
  }

  function handleMuonTra() {
    showToast('Chức năng đang được phát triển.')
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
        <Button variant="secondary" icon={<PlusCircle size={18} />} onClick={handleBoSung}>
          Bổ sung giấy tờ
        </Button>
        <Button variant="secondary" icon={<ArrowRightLeft size={18} />} onClick={handleMuonTra}>
          Mượn / trả hồ sơ
        </Button>
        <Button variant="danger" icon={<FileX size={18} />} onClick={handleRutHoSo}>
          Rút hồ sơ
        </Button>
        <Button variant="secondary" icon={<Printer size={18} />} onClick={handleInHoSo}>
          In / xuất hồ sơ
        </Button>
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
                        <th>STT</th>
                        <th>Tên giấy tờ</th>
                        <th>Trạng thái nộp</th>
                        <th>Bản gốc/Bản sao</th>
                        <th>Vị trí lưu kho</th>
                        <th>Ghi chú</th>
                      </tr>
                    </thead>
                    <tbody>
                      {giayToList.map((giayTo, index) => {
                        const isDaNop = giayTo.trangThaiNop === 'Đã nộp'
                        return (
                          <tr key={giayTo.maHoSo} className={isDaNop ? 'has-document' : 'no-document'}>
                            <td>{index + 1}</td>
                            <td>{getTenGiayTo(giayTo.maLoai)}</td>
                            <td>
                              <span className={`chi-tiet-ho-so__badge ${isDaNop ? 'badge--success' : 'badge--secondary'}`}>
                                {giayTo.trangThaiNop}
                              </span>
                            </td>
                            <td>{giayTo.banGocBanSao || '-'}</td>
                            <td>{giayTo.viTriLuuKho || '-'}</td>
                            <td>
                              <span className="chi-tiet-ho-so__note">
                                {isDaNop ? 'Đã tiếp nhận' : 'Chưa nộp'}
                              </span>
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
