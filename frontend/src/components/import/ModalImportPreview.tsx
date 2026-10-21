import { useState, useRef, useMemo } from 'react'
import {
  FileUp, FileDown, Loader2, CheckCheck, AlertCircle, X,
  CheckCircle2, XCircle, FileX, ListChecks,
} from 'lucide-react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import {
  hoSoGiayToImportApi,
  type ImportPreviewResponse,
  type ImportConfirmResponse,
  type SheetPreview,
  type ImportRowError,
  type ImportMode,
} from '../../api/hoSoGiayToImport'
import { triggerDownload } from '../../api/sinhVien'
import './ModalImportPreview.css'

type Step = 'upload' | 'preview' | 'confirm'

interface Props {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
  /** Thông báo toast (parent xử lý). */
  onShowToast?: (message: string, type: 'success' | 'error' | 'info') => void
}

// ============================================================
// Helpers
// ============================================================

const MODE_LABEL: Record<ImportMode, string> = {
  SINH_VIEN: 'Sinh viên',
  HO_SO_GIAY_TO: 'Hồ sơ giấy tờ',
  GOP: 'Sinh viên + Hồ sơ',
}

const MODE_BADGE: Record<ImportMode, string> = {
  SINH_VIEN: 'badge--primary',
  HO_SO_GIAY_TO: 'badge--info',
  GOP: 'badge--success',
}

function formatMs(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(2)}s`
}

// ============================================================
// Component
// ============================================================

export function ModalImportPreview({ isOpen, onClose, onSuccess, onShowToast }: Props) {
  const [step, setStep] = useState<Step>('upload')
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<ImportPreviewResponse | null>(null)
  const [confirmResult, setConfirmResult] = useState<ImportConfirmResponse | null>(null)
  const [isPreviewing, setIsPreviewing] = useState(false)
  const [isConfirming, setIsConfirming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeSheet, setActiveSheet] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  // Reset state khi modal đóng/mở
  function handleClose() {
    if (isPreviewing || isConfirming) return
    setStep('upload')
    setFile(null)
    setPreview(null)
    setConfirmResult(null)
    setError(null)
    setActiveSheet(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
    onClose()
  }

  // Mở tab đầu tiên khi có preview
  useMemo(() => {
    if (preview && preview.theoSheet.length > 0 && !activeSheet) {
      setActiveSheet(preview.theoSheet[0].tenSheet)
    }
  }, [preview, activeSheet])

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null
    setFile(f)
    setError(null)
    setPreview(null)
    setConfirmResult(null)
    if (step !== 'upload') setStep('upload')
  }

  async function handleDownloadTemplate() {
    try {
      const blob = await hoSoGiayToImportApi.downloadTemplate()
      triggerDownload(blob, 'mau-import-ho-so.xlsx')
      onShowToast?.('Đã tải file mẫu (3 sheet: SV, HS, SV+HS).', 'success')
    } catch (err: any) {
      onShowToast?.(
        err?.response?.data?.message || err?.message || 'Không thể tải file mẫu.',
        'error'
      )
    }
  }

  // =================== BƯỚC 1: PREVIEW ===================
  async function handlePreview() {
    if (!file) {
      onShowToast?.('Vui lòng chọn file Excel trước.', 'error')
      return
    }
    setIsPreviewing(true)
    setError(null)
    try {
      const res = await hoSoGiayToImportApi.preview(file)
      if (!res.success) {
        setError(res.message || 'Kiểm tra file thất bại.')
        onShowToast?.(res.message || 'Kiểm tra file thất bại.', 'error')
        return
      }
      const data = res.data
      if (data.failFast) {
        // Fail-fast: hiển thị lỗi, KHÔNG cho confirm
        setError(data.summaryMessage || 'File có lỗi — vui lòng sửa.')
        onShowToast?.(
          data.summaryMessage || 'File có lỗi. Vui lòng sửa và upload lại.',
          'error'
        )
        setStep('upload')
        return
      }
      setPreview(data)
      setActiveSheet(data.theoSheet[0]?.tenSheet ?? null)
      setStep('preview')
      onShowToast?.(`Đọc thành công ${data.tongSoDong} dòng.`, 'success')
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Đã xảy ra lỗi khi kiểm tra file.'
      setError(msg)
      onShowToast?.(msg, 'error')
    } finally {
      setIsPreviewing(false)
    }
  }

  // =================== BƯỚC 2: CONFIRM ===================
  async function handleConfirm() {
    if (!preview?.token) return
    setIsConfirming(true)
    setError(null)
    try {
      const res = await hoSoGiayToImportApi.confirm(preview.token)
      if (!res.success) {
        setError(res.message || 'Import thất bại.')
        onShowToast?.(res.message || 'Import thất bại.', 'error')
        return
      }
      setConfirmResult(res.data)
      setStep('confirm')
      const { tongThanhCong, tongThatBai } = res.data
      if (tongThatBai === 0) {
        onShowToast?.(`Import thành công ${tongThanhCong} dòng.`, 'success')
      } else if (tongThanhCong === 0) {
        onShowToast?.(`Import thất bại ${tongThatBai} dòng.`, 'error')
      } else {
        onShowToast?.(
          `Import thành công ${tongThanhCong}/${tongThanhCong + tongThatBai} dòng.`,
          'info'
        )
      }
      onSuccess?.()
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Đã xảy ra lỗi khi import.'
      setError(msg)
      onShowToast?.(msg, 'error')
    } finally {
      setIsConfirming(false)
    }
  }

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Import hồ sơ sinh viên từ Excel"
      size="lg"
      footer={renderFooter()}
    >
      {step === 'upload' && renderUploadStep()}
      {step === 'preview' && preview && renderPreviewStep(preview)}
      {step === 'confirm' && confirmResult && renderConfirmStep(confirmResult)}
    </Modal>
  )

  // ----- Footer theo step -----
  function renderFooter() {
    if (step === 'upload') {
      return (
        <>
          <Button variant="secondary" onClick={handleClose} disabled={isPreviewing}>
            Đóng
          </Button>
          <Button
            variant="primary"
            onClick={handlePreview}
            disabled={!file || isPreviewing}
            icon={isPreviewing ? <Loader2 size={16} className="spin" /> : <FileUp size={16} />}
          >
            {isPreviewing ? 'Đang kiểm tra...' : 'Kiểm tra file'}
          </Button>
        </>
      )
    }
    if (step === 'preview') {
      return (
        <>
          <Button
            variant="secondary"
            onClick={() => {
              setStep('upload')
              setFile(null)
              setPreview(null)
              setActiveSheet(null)
              if (fileInputRef.current) fileInputRef.current.value = ''
            }}
            disabled={isConfirming}
          >
            Chọn file khác
          </Button>
          <Button
            variant="primary"
            onClick={handleConfirm}
            disabled={isConfirming || !preview || preview.tongDongHopLe === 0}
            icon={isConfirming ? <Loader2 size={16} className="spin" /> : <CheckCheck size={16} />}
          >
            {isConfirming
              ? 'Đang import...'
              : `Xác nhận import (${preview?.tongDongHopLe ?? 0} dòng)`}
          </Button>
        </>
      )
    }
    // step === 'confirm'
    return (
      <Button variant="secondary" onClick={handleClose}>
        Đóng
      </Button>
    )
  }

  // ----- BƯỚC 1: Upload -----
  function renderUploadStep() {
    return (
      <div className="modal-import">
        <div className="modal-import__info">
          <p>
            <strong>Bước 1:</strong> Chọn file Excel (.xlsx). Hệ thống chấp nhận cả{' '}
            <strong>1 sheet</strong> (SV / HS / SV+HS) lẫn <strong>nhiều sheet</strong> trong cùng 1 file.
            Tên sheet sẽ được nhận diện tự động.
          </p>
          <p>
            Tên sheet hỗ trợ: <code>SV</code>, <code>HS</code>, <code>SV+HS</code> (và các biến thể như "TT Sinh viên", "Hồ sơ giấy tờ").
          </p>
          <Button variant="ghost" size="sm" onClick={handleDownloadTemplate}>
            <FileDown size={16} /> Tải file mẫu
          </Button>
        </div>

        <div className="modal-import__upload">
          <label className="modal-import__upload-area">
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx"
              onChange={handleFileChange}
              disabled={isPreviewing}
              className="modal-import__file-input"
            />
            <div className="modal-import__upload-content">
              <FileUp size={32} />
              <span className="modal-import__upload-text">
                {file ? file.name : 'Nhấn để chọn file .xlsx'}
              </span>
              {file && (
                <span className="modal-import__upload-size">
                  {(file.size / 1024).toFixed(1)} KB
                </span>
              )}
            </div>
          </label>
        </div>

        {error && (
          <div className="modal-import__error">
            <AlertCircle size={18} />
            <pre className="modal-import__error-text">{error}</pre>
          </div>
        )}

        <div className="modal-import__help">
          <h4>Quy tắc</h4>
          <ul>
            <li>Giới hạn: 10MB, 10.000 dòng tổng các sheet.</li>
            <li>Hệ thống đọc theo fail-fast: nếu 1 dòng lỗi → dừng, yêu cầu sửa file.</li>
            <li>Sheet HS yêu cầu <strong>MSSV đã tồn tại trong hệ thống</strong>.</li>
            <li>Sheet SV+HS: dòng HS phải đặt sau dòng SV cùng MSSV (cùng sheet).</li>
          </ul>
        </div>
      </div>
    )
  }

  // ----- BƯỚC 2: Preview -----
  function renderPreviewStep(data: ImportPreviewResponse) {
    return (
      <div className="modal-import__preview">
        <div className="modal-import__stats">
          <div className="modal-import__stat modal-import__stat--success">
            <CheckCircle2 size={20} />
            <div>
              <span className="modal-import__stat-value">{data.tongDongHopLe}</span>
              <span className="modal-import__stat-label">Sẽ ghi</span>
            </div>
          </div>
          <div className="modal-import__stat modal-import__stat--error">
            <XCircle size={20} />
            <div>
              <span className="modal-import__stat-value">{data.tongDongLoi}</span>
              <span className="modal-import__stat-label">Lỗi</span>
            </div>
          </div>
          <div className="modal-import__stat modal-import__stat--info">
            <ListChecks size={20} />
            <div>
              <span className="modal-import__stat-value">{data.tongSoDong}</span>
              <span className="modal-import__stat-label">Tổng dòng</span>
            </div>
          </div>
          <div className="modal-import__stat modal-import__stat--muted">
            <FileUp size={20} />
            <div>
              <span className="modal-import__stat-value">{data.tongSoSheet}</span>
              <span className="modal-import__stat-label">Sheet</span>
            </div>
          </div>
        </div>

        {/* Tabs sheet */}
        {data.theoSheet.length > 1 && (
          <div className="modal-import__tabs" role="tablist">
            {data.theoSheet.map((s) => (
              <button
                key={s.tenSheet}
                type="button"
                role="tab"
                aria-selected={activeSheet === s.tenSheet}
                className={`modal-import__tab ${activeSheet === s.tenSheet ? 'is-active' : ''}`}
                onClick={() => setActiveSheet(s.tenSheet)}
              >
                {s.tenSheet}
                {s.mode && <span className={`badge ${MODE_BADGE[s.mode]}`}>{MODE_LABEL[s.mode]}</span>}
                {s.dongLoi > 0 && <span className="badge badge--danger">{s.dongLoi}</span>}
              </button>
            ))}
          </div>
        )}

        {/* Nội dung sheet đang chọn */}
        {data.theoSheet
          .filter((s) => !activeSheet || s.tenSheet === activeSheet)
          .map((s) => (
            <SheetPreviewTable key={s.tenSheet} sheet={s} />
          ))}

        {data.tongDongHopLe > 0 && (
          <p className="modal-import__confirm-hint">
            <CheckCircle2 size={14} />
            Nhấn <strong>"Xác nhận import"</strong> để ghi <strong>{data.tongDongHopLe}</strong> dòng vào DB.
            Mỗi sheet chạy 1 transaction riêng; 1 sheet lỗi không ảnh hưởng sheet khác.
          </p>
        )}
      </div>
    )
  }

  // ----- BƯỚC 3: Kết quả confirm -----
  function renderConfirmStep(result: ImportConfirmResponse) {
    const allOk = result.tongThatBai === 0
    return (
      <div className="modal-import__result">
        <div className={`modal-import__result-summary ${allOk ? 'is-success' : 'is-warning'}`}>
          {allOk ? <CheckCircle2 size={32} /> : <AlertCircle size={32} />}
          <h4>{allOk ? 'Import hoàn tất!' : 'Import có lỗi'}</h4>
          <p>
            Thành công: <strong>{result.tongThanhCong}</strong>
            {' • '}
            Thất bại: <strong>{result.tongThatBai}</strong>
            {' • '}
            Thời gian: <strong>{formatMs(result.thoiGianXuLyMs)}</strong>
          </p>
        </div>

        {result.theoSheet.length > 0 && (
          <div className="modal-import__sheet-stats">
            <h5>Chi tiết theo sheet:</h5>
            <table className="modal-import__sheet-table">
              <thead>
                <tr>
                  <th>Sheet</th>
                  <th>Mode</th>
                  <th>Tổng dòng</th>
                  <th>Thành công</th>
                  <th>Thất bại</th>
                  <th>Thời gian</th>
                </tr>
              </thead>
              <tbody>
                {result.theoSheet.map((s, i) => (
                  <tr key={i}>
                    <td>{s.tenSheet}</td>
                    <td>{s.mode ? MODE_LABEL[s.mode] : '—'}</td>
                    <td>{s.tongDong}</td>
                    <td className="text-success">{s.thanhCong}</td>
                    <td className={s.thatBai > 0 ? 'text-error' : ''}>{s.thatBai}</td>
                    <td>{formatMs(s.thoiGianXuLyMs)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {result.errors.length > 0 && (
          <div className="modal-import__errors">
            <h5>Lỗi runtime ({result.errors.length}):</h5>
            <ul>
              {result.errors.slice(0, 30).map((e, i) => (
                <li key={i}>
                  <AlertCircle size={14} /> {e}
                </li>
              ))}
              {result.errors.length > 30 && (
                <li>... và {result.errors.length - 30} lỗi khác.</li>
              )}
            </ul>
          </div>
        )}
      </div>
    )
  }
}

// ============================================================
// Sheet preview table
// ============================================================
function SheetPreviewTable({ sheet }: { sheet: SheetPreview }) {
  const [showAllErrors, setShowAllErrors] = useState(false)
  const errorsToShow = showAllErrors ? sheet.danhSachLoi : sheet.danhSachLoi.slice(0, 5)

  return (
    <div className="modal-import__sheet">
      <div className="modal-import__sheet-header">
        <h4>
          Sheet: <code>{sheet.tenSheet}</code>
          {sheet.mode && <span className={`badge ${MODE_BADGE[sheet.mode]}`}>{MODE_LABEL[sheet.mode]}</span>}
        </h4>
        <div className="modal-import__sheet-stats-row">
          <span className="text-success">✓ {sheet.dongHopLe} hợp lệ</span>
          <span className={sheet.dongLoi > 0 ? 'text-error' : 'text-muted'}>
            ✕ {sheet.dongLoi} lỗi
          </span>
        </div>
      </div>

      {sheet.danhSachLoi.length === 0 ? (
        <div className="modal-import__empty">
          <CheckCircle2 size={20} />
          <span>Tất cả {sheet.dongHopLe} dòng hợp lệ.</span>
        </div>
      ) : (
        <div className="modal-import__error-list">
          <table className="modal-import__error-table">
            <thead>
              <tr>
                <th>Dòng</th>
                <th>Loại</th>
                <th>MSSV</th>
                <th>Lý do</th>
              </tr>
            </thead>
            <tbody>
              {errorsToShow.map((err: ImportRowError, i: number) => (
                <tr key={i}>
                  <td className="col-center">{err.dong}</td>
                  <td>
                    {err.loaiDong ? (
                      <span className={`badge ${err.loaiDong === 'SV' ? 'badge--primary' : 'badge--info'}`}>
                        {err.loaiDong}
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td>{err.mssv ?? <span className="text-muted">(trống)</span>}</td>
                  <td>
                    {err.lyDo.map((r, j) => (
                      <div key={j} className="modal-import__error-reason">• {r}</div>
                    ))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {sheet.danhSachLoi.length > 5 && (
            <button
              type="button"
              className="modal-import__show-more"
              onClick={() => setShowAllErrors(!showAllErrors)}
            >
              {showAllErrors ? 'Thu gọn' : `Xem thêm ${sheet.danhSachLoi.length - 5} lỗi`}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
