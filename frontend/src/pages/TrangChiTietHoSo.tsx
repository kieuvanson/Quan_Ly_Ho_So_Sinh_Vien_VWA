import { useState } from 'react'
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
} from 'lucide-react'
import {
  getSinhVienByMssv,
  getGiayToByMssv,
  getAuditLogsByMssv,
  updateSinhVien,
  NGANH_OPTIONS,
  TRANG_THAI_HO_SO,
  type SinhVien,
  type GiayToItem,
  type AuditLog,
} from '../data/duLieuMauHoSo'
import { Button, Modal, FormInput, FormSelect, Toast } from '../components/ui'
import './TrangChiTietHoSo.css'

type TabType = 'thong-tin' | 'giay-to' | 'lich-su'

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

export function TrangChiTietHoSo() {
  const { mssv } = useParams<{ mssv: string }>()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<TabType>('thong-tin')
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)
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

  // Get current student data
  const sinhVien: SinhVien | undefined = mssv ? getSinhVienByMssv(mssv) : undefined
  const giayToList: GiayToItem[] = mssv ? getGiayToByMssv(mssv) : []
  const auditLogs: AuditLog[] = mssv ? getAuditLogsByMssv(mssv) : []

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

  function handleOpenEditModal() {
    if (sinhVien) {
      setFormData({
        hoTen: sinhVien.hoTen,
        mssv: sinhVien.mssv,
        cccd: sinhVien.cccd,
        ngaySinh: sinhVien.ngaySinh,
        gioiTinh: sinhVien.gioiTinh,
        soDienThoai: sinhVien.soDienThoai,
        lopHanhChinh: sinhVien.lopHanhChinh,
        khoa: sinhVien.khoa,
        nganh: sinhVien.nganh,
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
    if (mssv) {
      updateSinhVien(mssv, {
        hoTen: formData.hoTen,
        cccd: formData.cccd,
        ngaySinh: formData.ngaySinh,
        gioiTinh: formData.gioiTinh,
        soDienThoai: formData.soDienThoai,
        lopHanhChinh: formData.lopHanhChinh,
        khoa: formData.khoa,
        nganh: formData.nganh,
      })
      setIsModalOpen(false)
      showToast('Cập nhật thông tin thành công', 'success')
      // Force re-render by updating state
      setTimeout(() => {
        window.location.reload()
      }, 500)
    }
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

  const nganhOptions = NGANH_OPTIONS.filter((n) => n !== 'Tất cả').map((nganh) => ({
    value: nganh,
    label: nganh,
  }))

  // Not found state
  if (!sinhVien) {
    return (
      <div className="chi-tiet-ho-so">
        <div className="chi-tiet-ho-so__empty">
          <AlertCircle className="chi-tiet-ho-so__empty-icon" size={64} />
          <h2 className="chi-tiet-ho-so__empty-title">Không tìm thấy hồ sơ sinh viên</h2>
          <p className="chi-tiet-ho-so__empty-desc">
            Mã số sinh viên "{mssv}" không tồn tại trong hệ thống.
          </p>
          <Button variant="primary" icon={<ArrowLeft size={18} />} onClick={handleBack}>
            Quay lại danh sách
          </Button>
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
                <span className="chi-tiet-ho-so__header-messv">{sinhVien.hoTen}</span>
                <span className="chi-tiet-ho-so__header-mssv-label">MSSV: {sinhVien.mssv}</span>
              </div>
              <span className={`chi-tiet-ho-so__badge ${TRANG_THAI_HO_SO[sinhVien.trangThai].className}`}>
                {TRANG_THAI_HO_SO[sinhVien.trangThai].label}
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
          <button
            className={`chi-tiet-ho-so__tab ${activeTab === 'lich-su' ? 'chi-tiet-ho-so__tab--active' : ''}`}
            onClick={() => setActiveTab('lich-su')}
          >
            Lịch sử & Audit
          </button>
        </div>

        {/* Tab Content */}
        <div className="chi-tiet-ho-so__tab-content">
          {/* Tab 1: Thông tin cá nhân & Học vụ */}
          {activeTab === 'thong-tin' && (
            <div className="chi-tiet-ho-so__info-grid">
              <div className="chi-tiet-ho-so__info-item">
                <span className="chi-tiet-ho-so__info-label">Họ và tên</span>
                <span className="chi-tiet-ho-so__info-value">{sinhVien.hoTen}</span>
              </div>
              <div className="chi-tiet-ho-so__info-item">
                <span className="chi-tiet-ho-so__info-label">MSSV</span>
                <span className="chi-tiet-ho-so__info-value">{sinhVien.mssv}</span>
              </div>
              <div className="chi-tiet-ho-so__info-item">
                <span className="chi-tiet-ho-so__info-label">CCCD</span>
                <span className="chi-tiet-ho-so__info-value">{sinhVien.cccd}</span>
              </div>
              <div className="chi-tiet-ho-so__info-item">
                <span className="chi-tiet-ho-so__info-label">Ngày sinh</span>
                <span className="chi-tiet-ho-so__info-value">{sinhVien.ngaySinh}</span>
              </div>
              <div className="chi-tiet-ho-so__info-item">
                <span className="chi-tiet-ho-so__info-label">Giới tính</span>
                <span className="chi-tiet-ho-so__info-value">{sinhVien.gioiTinh}</span>
              </div>
              <div className="chi-tiet-ho-so__info-item">
                <span className="chi-tiet-ho-so__info-label">Số điện thoại</span>
                <span className="chi-tiet-ho-so__info-value">{sinhVien.soDienThoai}</span>
              </div>
              <div className="chi-tiet-ho-so__info-item">
                <span className="chi-tiet-ho-so__info-label">Lớp hành chính</span>
                <span className="chi-tiet-ho-so__info-value">{sinhVien.lopHanhChinh}</span>
              </div>
              <div className="chi-tiet-ho-so__info-item">
                <span className="chi-tiet-ho-so__info-label">Khóa</span>
                <span className="chi-tiet-ho-so__info-value">{sinhVien.khoa}</span>
              </div>
              <div className="chi-tiet-ho-so__info-item">
                <span className="chi-tiet-ho-so__info-label">Ngành</span>
                <span className="chi-tiet-ho-so__info-value">{sinhVien.nganh}</span>
              </div>
              <div className="chi-tiet-ho-so__info-item">
                <span className="chi-tiet-ho-so__info-label">Trạng thái hồ sơ</span>
                <span className={`chi-tiet-ho-so__badge ${TRANG_THAI_HO_SO[sinhVien.trangThai].className}`}>
                  {TRANG_THAI_HO_SO[sinhVien.trangThai].label}
                </span>
              </div>
            </div>
          )}

          {/* Tab 2: Hồ sơ giấy tờ */}
          {activeTab === 'giay-to' && (
            <div className="chi-tiet-ho-so__table-wrapper">
              <table className="chi-tiet-ho-so__table">
                <thead>
                  <tr>
                    <th>STT</th>
                    <th>Tên giấy tờ</th>
                    <th>Số lượng tiếp nhận</th>
                    <th>Ghi chú</th>
                  </tr>
                </thead>
                <tbody>
                  {giayToList.map((giayTo, index) => (
                    <tr key={giayTo.id} className={giayTo.coGiayTo ? 'has-document' : 'no-document'}>
                      <td>{index + 1}</td>
                      <td>{giayTo.ten}</td>
                      <td>
                        {giayTo.coGiayTo ? (
                          <span className="chi-tiet-ho-so__badge badge--success">
                            {giayTo.soLuong}
                          </span>
                        ) : (
                          <span className="chi-tiet-ho-so__badge badge--secondary">0</span>
                        )}
                      </td>
                      <td>
                        <span className="chi-tiet-ho-so__note">
                          {giayTo.ghiChu || (giayTo.coGiayTo ? 'Đã tiếp nhận' : 'Chưa có')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Tab 3: Lịch sử & Audit */}
          {activeTab === 'lich-su' && (
            <>
              <div className="chi-tiet-ho-so__timeline">
                {auditLogs.map((log) => (
                  <div key={log.id} className="chi-tiet-ho-so__timeline-item">
                    <div className="chi-tiet-ho-so__timeline-dot" />
                    <div className="chi-tiet-ho-so__timeline-content">
                      <div className="chi-tiet-ho-so__timeline-header">
                        <span className="chi-tiet-ho-so__timeline-action">{log.hanhDong}</span>
                        <span className="chi-tiet-ho-so__timeline-date">{log.ngay}</span>
                      </div>
                      <p className="chi-tiet-ho-so__timeline-desc">{log.moTa}</p>
                      <span className="chi-tiet-ho-so__timeline-user">Người thực hiện: {log.nguoiThucHien}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="chi-tiet-ho-so__timeline-notice">
                <FileSearch size={16} />
                Đây là dữ liệu mẫu. Lịch sử thực tế sẽ được cập nhật khi kết nối API.
              </div>
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
            <Button variant="primary" onClick={handleSave}>
              Lưu thay đổi
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
