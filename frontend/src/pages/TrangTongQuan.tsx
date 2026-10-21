import { useState, useEffect } from 'react'
import { thongKeApi, type SinhVienStatsResponse, type ThongKeNganhResponse, type ThongKeHoSoResponse, type ThongKeMuonTraResponse } from '../api/thongKe'
import './TrangTongQuan.css'

// Types for local state
interface SinhVienStats {
  tongSo: number
  dangHoc: number
  baoLuu: number
  dinhChi: number
  totNghiep: number
  daRutHoSo: number
}

interface HoSoStats {
  tongHoSo: number
  hoSoDayDu: number
  hoSoThieu: number
}

interface NganhData {
  tenNganh: string
  soLuong: number
}

interface MuonTraStats {
  dangMuon: number
  daTra: number
  quaHan: number
}

// Default empty states
const DEFAULT_SINH_VIEN_STATS: SinhVienStats = {
  tongSo: 0,
  dangHoc: 0,
  baoLuu: 0,
  dinhChi: 0,
  totNghiep: 0,
  daRutHoSo: 0,
}

const DEFAULT_HO_SO_STATS: HoSoStats = {
  tongHoSo: 0,
  hoSoDayDu: 0,
  hoSoThieu: 0,
}

const DEFAULT_NGANH: NganhData[] = []

const DEFAULT_MUON_TRA_STATS: MuonTraStats = {
  dangMuon: 0,
  daTra: 0,
  quaHan: 0,
}

// Icons
const Icons = {
  users: (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  book: (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/>
    </svg>
  ),
  check: (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 11 12 14 22 4"/>
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
    </svg>
  ),
  alert: (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="8" x2="12" y2="12"/>
      <line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  ),
  alertTriangle: (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/>
      <line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  ),
  award: (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="6"/>
      <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/>
    </svg>
  ),
  download: (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="7 10 12 15 17 10"/>
      <line x1="12" y1="15" x2="12" y2="3"/>
    </svg>
  ),
  arrowRight: (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14"/>
      <path d="m12 5 7 7-7 7"/>
    </svg>
  ),
  loading: (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="tq-spin">
      <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
    </svg>
  ),
  error: (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="8" x2="12" y2="12"/>
      <line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  ),
}

// Donut Chart Component
function DonutChart({ data, centerText, centerSubtext }: { 
  data: { label: string; value: number; color: string }[]; 
  centerText: string; 
  centerSubtext: string 
}) {
  const total = data.reduce((sum, item) => sum + item.value, 0)
  const radius = 70
  const strokeWidth = 20
  const circumference = 2 * Math.PI * radius
  let offset = 0

  if (total === 0) {
    return (
      <div className="tq-donut tq-donut--empty">
        <svg viewBox="0 0 200 200" className="tq-donut__chart">
          <circle
            cx="100"
            cy="100"
            r={radius}
            fill="none"
            stroke="var(--color-border)"
            strokeWidth={strokeWidth}
          />
          <text x="100" y="90" textAnchor="middle" className="tq-donut__center-text">
            0
          </text>
          <text x="100" y="115" textAnchor="middle" className="tq-donut__center-subtext">
            Không có dữ liệu
          </text>
        </svg>
        <div className="tq-donut__legend">
          {data.map((item, index) => (
            <div key={index} className="tq-donut__legend-item">
              <span className="tq-donut__legend-color" style={{ backgroundColor: item.color }}></span>
              <span className="tq-donut__legend-label">{item.label}</span>
              <span className="tq-donut__legend-value">0</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="tq-donut">
      <svg viewBox="0 0 200 200" className="tq-donut__chart">
        {data.map((item, index) => {
          const percentage = (item.value / total) * 100
          const dashLength = (percentage / 100) * circumference
          const currentOffset = offset
          offset += dashLength
          
          return (
            <circle
              key={index}
              className="tq-donut__segment"
              cx="100"
              cy="100"
              r={radius}
              fill="none"
              stroke={item.color}
              strokeWidth={strokeWidth}
              strokeDasharray={`${dashLength} ${circumference - dashLength}`}
              strokeDashoffset={-currentOffset}
              transform="rotate(-90 100 100)"
            />
          )
        })}
        <text x="100" y="90" textAnchor="middle" className="tq-donut__center-text">
          {centerText}
        </text>
        <text x="100" y="115" textAnchor="middle" className="tq-donut__center-subtext">
          {centerSubtext}
        </text>
      </svg>
      <div className="tq-donut__legend">
        {data.map((item, index) => (
          <div key={index} className="tq-donut__legend-item">
            <span className="tq-donut__legend-color" style={{ backgroundColor: item.color }}></span>
            <span className="tq-donut__legend-label">{item.label}</span>
            <span className="tq-donut__legend-value">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// Stat Card Component
function StatCard({ icon, label, value, color, loading }: { 
  icon: React.ReactNode; 
  label: string; 
  value: number; 
  color: string;
  loading?: boolean;
}) {
  return (
    <div className="tq-stat-card">
      <div className="tq-stat-card__icon" style={{ color }}>
        {loading ? Icons.loading : icon}
      </div>
      <div className="tq-stat-card__content">
        <span className="tq-stat-card__value">
          {loading ? '—' : value.toLocaleString()}
        </span>
        <span className="tq-stat-card__label">{label}</span>
      </div>
    </div>
  )
}

// Progress Bar Component
function ProgressBar({ value, maxValue, label }: { value: number; maxValue: number; label: string }) {
  const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0
  
  return (
    <div className="tq-progress">
      <div className="tq-progress__header">
        <span className="tq-progress__label">{label}</span>
        <span className="tq-progress__percentage">{percentage.toFixed(1)}%</span>
      </div>
      <div className="tq-progress__bar">
        <div 
          className="tq-progress__fill" 
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  )
}

// Nganh Item Component
function NganhItem({ tenNganh, soLuong, maxSoLuong }: { tenNganh: string; soLuong: number; maxSoLuong: number }) {
  const percentage = maxSoLuong > 0 ? (soLuong / maxSoLuong) * 100 : 0
  
  return (
    <div className="tq-nganh-item">
      <div className="tq-nganh-item__header">
        <span className="tq-nganh-item__name">{tenNganh}</span>
        <span className="tq-nganh-item__value">{soLuong}</span>
      </div>
      <div className="tq-nganh-item__bar">
        <div 
          className="tq-nganh-item__fill" 
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  )
}

// Loading Skeleton for Nganh List
function NganhListSkeleton() {
  return (
    <div className="tq-nganh-list">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="tq-nganh-item tq-nganh-item--skeleton">
          <div className="tq-nganh-item__header">
            <span className="tq-skeleton" style={{ width: '60%' }}></span>
            <span className="tq-skeleton" style={{ width: '15%' }}></span>
          </div>
          <div className="tq-nganh-item__bar">
            <div className="tq-skeleton" style={{ width: `${30 + Math.random() * 50}%` }}></div>
          </div>
        </div>
      ))}
    </div>
  )
}

// Error State Component
function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="tq-error-state">
      <div className="tq-error-state__icon">{Icons.error}</div>
      <p className="tq-error-state__message">{message}</p>
      <button className="tq-error-state__retry" onClick={onRetry}>
        Thử lại
      </button>
    </div>
  )
}

export function TrangTongQuan() {
  // State cho dữ liệu thống kê
  const [sinhVienStats, setSinhVienStats] = useState<SinhVienStats>(DEFAULT_SINH_VIEN_STATS)
  const [hoSoStats, setHoSoStats] = useState<HoSoStats>(DEFAULT_HO_SO_STATS)
  const [nganhList, setNganhList] = useState<NganhData[]>(DEFAULT_NGANH)
  const [muonTraStats, setMuonTraStats] = useState<MuonTraStats>(DEFAULT_MUON_TRA_STATS)

  // State cho loading/error
  const [loadingSV, setLoadingSV] = useState(true)
  const [loadingHS, setLoadingHS] = useState(true)
  const [loadingNganh, setLoadingNganh] = useState(true)
  const [loadingMT, setLoadingMT] = useState(true)

  const [errorSV, setErrorSV] = useState<string | null>(null)
  const [errorHS, setErrorHS] = useState<string | null>(null)
  const [errorNganh, setErrorNganh] = useState<string | null>(null)
  const [errorMT, setErrorMT] = useState<string | null>(null)

  // Fetch thống kê sinh viên
  const fetchSinhVienStats = async () => {
    try {
      setLoadingSV(true)
      setErrorSV(null)
      const response = await thongKeApi.getSinhVienStats()
      if (response.success && response.data) {
        // Dữ liệu đã được normalize trong API
        const data: SinhVienStatsResponse = response.data
        setSinhVienStats({
          tongSo: data.tongSoSinhVien || 0,
          dangHoc: data.dangHoc || 0,
          baoLuu: data.baoLuu || 0,
          dinhChi: data.dinhChi || 0,
          totNghiep: data.totNghiep || 0,
          daRutHoSo: data.daRutHoSo || 0,
        })
      }
    } catch (err) {
      console.error('Lỗi khi tải thống kê sinh viên:', err)
      setErrorSV('Không thể tải dữ liệu sinh viên')
    } finally {
      setLoadingSV(false)
    }
  }

  // Fetch thống kê hồ sơ
  const fetchHoSoStats = async () => {
    try {
      setLoadingHS(true)
      setErrorHS(null)
      const response = await thongKeApi.getThongKeHoSo()
      if (response.success && response.data) {
        const data = response.data as unknown as ThongKeHoSoResponse
        setHoSoStats({
          tongHoSo: data.tongSoSinhVien || 0,
          hoSoDayDu: data.hoSoDayDu || 0,
          hoSoThieu: data.hoSoConThieu || 0,
        })
      }
    } catch (err) {
      console.error('Lỗi khi tải thống kê hồ sơ:', err)
      setErrorHS('Không thể tải dữ liệu hồ sơ')
    } finally {
      setLoadingHS(false)
    }
  }

  // Fetch thống kê theo ngành
  const fetchNganhStats = async () => {
    try {
      setLoadingNganh(true)
      setErrorNganh(null)
      const response = await thongKeApi.getSinhVienTheoNganh()
      if (response.success && response.data) {
        const data = response.data as unknown as ThongKeNganhResponse
        // Map từ response backend sang định dạng UI cần
        const mapped = (data.nganhList || []).map((item) => ({
          tenNganh: item.tenNganh || item.nganh || 'Không xác định',
          soLuong: item.soLuong || 0,
        }))
        setNganhList(mapped)
      }
    } catch (err) {
      console.error('Lỗi khi tải thống kê ngành:', err)
      setErrorNganh('Không thể tải dữ liệu ngành')
    } finally {
      setLoadingNganh(false)
    }
  }

  // Fetch thống kê mượn/trả
  const fetchMuonTraStats = async () => {
    try {
      setLoadingMT(true)
      setErrorMT(null)
      const response = await thongKeApi.getThongKeMuonTra()
      if (response.success && response.data) {
        const data = response.data as unknown as ThongKeMuonTraResponse
        setMuonTraStats({
          dangMuon: data.dangMuon || 0,
          daTra: data.daTra || 0,
          quaHan: data.quaHan || 0,
        })
      }
    } catch (err) {
      console.error('Lỗi khi tải thống kê mượn/trả:', err)
      setErrorMT('Không thể tải dữ liệu mượn/trả')
    } finally {
      setLoadingMT(false)
    }
  }

  // Load all data on mount
  useEffect(() => {
    fetchSinhVienStats()
    fetchHoSoStats()
    fetchNganhStats()
    fetchMuonTraStats()
  }, [])

  // Tính toán giá trị cho biểu đồ
  const maxSoLuongNganh = nganhList.length > 0 ? Math.max(...nganhList.map(n => n.soLuong)) : 0
  const hoSoDayDuPercent = hoSoStats.tongHoSo > 0 
    ? (hoSoStats.hoSoDayDu / hoSoStats.tongHoSo) * 100 
    : 0
  const totalMuonTra = muonTraStats.dangMuon + muonTraStats.daTra + muonTraStats.quaHan

  const donutData = [
    { label: 'Đang mượn', value: muonTraStats.dangMuon, color: 'var(--color-primary)' },
    { label: 'Đã trả', value: muonTraStats.daTra, color: 'var(--color-success)' },
    { label: 'Quá hạn', value: muonTraStats.quaHan, color: 'var(--color-danger)' },
  ]

  return (
    <div className="trang-tong-quan">
      {/* Header */}
      <div className="tq-header">
        <div className="tq-header__text">
          <h1 className="tq-header__title">Tổng quan</h1>
          <p className="tq-header__subtitle">Theo dõi nhanh tình hình sinh viên và hồ sơ trong hệ thống</p>
        </div>
      </div>

      {/* Summary Cards - Sinh viên */}
      <div className="tq-stats-grid">
        <StatCard 
          icon={Icons.users} 
          label="Tổng sinh viên" 
          value={sinhVienStats.tongSo} 
          color="var(--color-primary)"
          loading={loadingSV}
        />
        <StatCard 
          icon={Icons.book} 
          label="Đang học" 
          value={sinhVienStats.dangHoc} 
          color="var(--color-success)"
          loading={loadingSV}
        />
        <StatCard 
          icon={Icons.alert} 
          label="Bảo lưu" 
          value={sinhVienStats.baoLuu} 
          color="var(--color-warning)"
          loading={loadingSV}
        />
        <StatCard 
          icon={Icons.alertTriangle} 
          label="Đình chỉ" 
          value={sinhVienStats.dinhChi} 
          color="var(--color-danger)"
          loading={loadingSV}
        />
        <StatCard 
          icon={Icons.award} 
          label="Tốt nghiệp" 
          value={sinhVienStats.totNghiep} 
          color="#8b5cf6"
          loading={loadingSV}
        />
        <StatCard 
          icon={Icons.download} 
          label="Đã rút hồ sơ" 
          value={sinhVienStats.daRutHoSo} 
          color="#6b7280"
          loading={loadingSV}
        />
      </div>

      {/* Ho so section */}
      <div className="tq-section">
        <h2 className="tq-section__title">Tổng quan hồ sơ</h2>
        
        {errorHS ? (
          <ErrorState message={errorHS} onRetry={fetchHoSoStats} />
        ) : (
          <>
            <div className="tq-ho-so-cards">
              <div className="tq-ho-so-card">
                <span className="tq-ho-so-card__value">
                  {loadingHS ? '—' : hoSoStats.tongHoSo.toLocaleString()}
                </span>
                <span className="tq-ho-so-card__label">Tổng hồ sơ</span>
              </div>
              <div className="tq-ho-so-card tq-ho-so-card--success">
                <span className="tq-ho-so-card__value">
                  {loadingHS ? '—' : hoSoStats.hoSoDayDu.toLocaleString()}
                </span>
                <span className="tq-ho-so-card__label">Hồ sơ đầy đủ</span>
              </div>
              <div className="tq-ho-so-card tq-ho-so-card--warning">
                <span className="tq-ho-so-card__value">
                  {loadingHS ? '—' : hoSoStats.hoSoThieu.toLocaleString()}
                </span>
                <span className="tq-ho-so-card__label">Hồ sơ thiếu</span>
              </div>
            </div>

            <div className="tq-ho-so-progress">
              <ProgressBar 
                value={hoSoStats.hoSoDayDu} 
                maxValue={hoSoStats.tongHoSo}
                label="Hồ sơ đầy đủ"
              />
              <span className="tq-ho-so-progress__text">
                {hoSoDayDuPercent.toFixed(1)}% hồ sơ đầy đủ
              </span>
            </div>
          </>
        )}
      </div>

      {/* Two columns: Nganh + Muon Tra */}
      <div className="tq-two-columns">
        {/* Sinh vien theo nganh */}
        <div className="tq-card">
          <div className="tq-card__header">
            <h2 className="tq-card__title">Sinh viên theo ngành</h2>
            {loadingNganh && <span className="tq-loading-indicator">{Icons.loading}</span>}
          </div>
          
          {errorNganh ? (
            <ErrorState message={errorNganh} onRetry={fetchNganhStats} />
          ) : loadingNganh ? (
            <NganhListSkeleton />
          ) : nganhList.length === 0 ? (
            <div className="tq-empty-state">
              <p>Chưa có dữ liệu sinh viên theo ngành</p>
            </div>
          ) : (
            <div className="tq-nganh-list">
              {nganhList.slice(0, 8).map((nganh, index) => (
                <NganhItem 
                  key={index} 
                  tenNganh={nganh.tenNganh} 
                  soLuong={nganh.soLuong} 
                  maxSoLuong={maxSoLuongNganh}
                />
              ))}
            </div>
          )}
          
          <button className="tq-card__link">
            Xem tất cả {Icons.arrowRight}
          </button>
        </div>

        {/* Muon tra ho so */}
        <div className="tq-card">
          <div className="tq-card__header">
            <h2 className="tq-card__title">Tình trạng mượn / trả hồ sơ</h2>
            {loadingMT && <span className="tq-loading-indicator">{Icons.loading}</span>}
          </div>
          
          {errorMT ? (
            <ErrorState message={errorMT} onRetry={fetchMuonTraStats} />
          ) : (
            <DonutChart 
              data={donutData}
              centerText={totalMuonTra.toString()}
              centerSubtext="Phiếu mượn"
            />
          )}
        </div>
      </div>

      {/* Hoat dong gan day */}
      <div className="tq-section">
        <div className="tq-section__header">
          <h2 className="tq-section__title">Hoạt động gần đây</h2>
          <button className="tq-card__link">
            Xem tất cả {Icons.arrowRight}
          </button>
        </div>
        
        <div className="tq-activity-list">
          <div className="tq-empty-state">
            <p>Tính năng đang được phát triển</p>
          </div>
        </div>
      </div>
    </div>
  )
}
