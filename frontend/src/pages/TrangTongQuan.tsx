import './TrangTongQuan.css'

// Types
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

interface HoatDong {
  id: number
  thoiGian: string
  nguoiThucHien: string
  noiDung: string
  icon: 'file' | 'download' | 'upload' | 'plus' | 'user'
}

// Mock Data
const MOCK_SINH_VIEN_STATS: SinhVienStats = {
  tongSo: 2486,
  dangHoc: 2312,
  baoLuu: 48,
  dinhChi: 12,
  totNghiep: 96,
  daRutHoSo: 18,
}

const MOCK_HO_SO_STATS: HoSoStats = {
  tongHoSo: 2486,
  hoSoDayDu: 2156,
  hoSoThieu: 330,
}

const MOCK_NGANH: NganhData[] = [
  { tenNganh: 'Quản trị kinh doanh', soLuong: 386 },
  { tenNganh: 'Công nghệ thông tin', soLuong: 324 },
  { tenNganh: 'Luật', soLuong: 298 },
  { tenNganh: 'Luật kinh tế', soLuong: 276 },
  { tenNganh: 'Công tác xã hội', soLuong: 245 },
  { tenNganh: 'Kinh tế quốc tế', soLuong: 218 },
  { tenNganh: 'Truyền thông đa phương tiện', soLuong: 196 },
  { tenNganh: 'Các ngành khác', soLuong: 543 },
]

const MOCK_MUON_TRA_STATS: MuonTraStats = {
  dangMuon: 42,
  daTra: 71,
  quaHan: 15,
}

const MOCK_HOAT_DONG: HoatDong[] = [
  {
    id: 1,
    thoiGian: '14:32',
    nguoiThucHien: 'Nguyễn Văn A',
    noiDung: 'Cập nhật trạng thái giấy tờ của SV 24D10001',
    icon: 'file',
  },
  {
    id: 2,
    thoiGian: '14:18',
    nguoiThucHien: 'Trần Thị B',
    noiDung: 'Mượn hồ sơ SV 24D10025',
    icon: 'download',
  },
  {
    id: 3,
    thoiGian: '13:56',
    nguoiThucHien: 'Nguyễn Văn A',
    noiDung: 'Bổ sung giấy tờ cho SV 24D10018',
    icon: 'plus',
  },
  {
    id: 4,
    thoiGian: '13:21',
    nguoiThucHien: 'Lê Thị C',
    noiDung: 'Trả hồ sơ SV 24D10007',
    icon: 'upload',
  },
  {
    id: 5,
    thoiGian: '12:45',
    nguoiThucHien: 'Phạm Văn D',
    noiDung: 'Cập nhật thông tin sinh viên SV 24D10012',
    icon: 'user',
  },
]

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
  file: (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
      <polyline points="14 2 14 8 20 8"/>
    </svg>
  ),
  upload: (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="17 8 12 3 7 8"/>
      <line x1="12" y1="3" x2="12" y2="15"/>
    </svg>
  ),
  plus: (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14"/>
      <path d="M12 5v14"/>
    </svg>
  ),
  user: (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  ),
  arrowRight: (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14"/>
      <path d="m12 5 7 7-7 7"/>
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
function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
  return (
    <div className="tq-stat-card">
      <div className="tq-stat-card__icon" style={{ color }}>
        {icon}
      </div>
      <div className="tq-stat-card__content">
        <span className="tq-stat-card__value">{value.toLocaleString()}</span>
        <span className="tq-stat-card__label">{label}</span>
      </div>
    </div>
  )
}

// Progress Bar Component
function ProgressBar({ value, maxValue, label }: { value: number; maxValue: number; label: string }) {
  const percentage = (value / maxValue) * 100
  
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
  const percentage = (soLuong / maxSoLuong) * 100
  
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

// Hoat Dong Item Component
function HoatDongItem({ hoatDong }: { hoatDong: HoatDong }) {
  const getIcon = (iconType: string) => {
    switch (iconType) {
      case 'file': return Icons.file
      case 'download': return Icons.download
      case 'upload': return Icons.upload
      case 'plus': return Icons.plus
      case 'user': return Icons.user
      default: return Icons.file
    }
  }

  return (
    <div className="tq-activity-item">
      <div className="tq-activity-item__icon">
        {getIcon(hoatDong.icon)}
      </div>
      <div className="tq-activity-item__content">
        <div className="tq-activity-item__header">
          <span className="tq-activity-item__time">{hoatDong.thoiGian}</span>
          <span className="tq-activity-item__user">{hoatDong.nguoiThucHien}</span>
        </div>
        <p className="tq-activity-item__desc">{hoatDong.noiDung}</p>
      </div>
    </div>
  )
}

export function TrangTongQuan() {
  const maxSoLuongNganh = Math.max(...MOCK_NGANH.map(n => n.soLuong))
  const hoSoDayDuPercent = (MOCK_HO_SO_STATS.hoSoDayDu / MOCK_HO_SO_STATS.tongHoSo) * 100
  const totalMuonTra = MOCK_MUON_TRA_STATS.dangMuon + MOCK_MUON_TRA_STATS.daTra + MOCK_MUON_TRA_STATS.quaHan

  const donutData = [
    { label: 'Đang mượn', value: MOCK_MUON_TRA_STATS.dangMuon, color: 'var(--color-primary)' },
    { label: 'Đã trả', value: MOCK_MUON_TRA_STATS.daTra, color: 'var(--color-success)' },
    { label: 'Quá hạn', value: MOCK_MUON_TRA_STATS.quaHan, color: 'var(--color-danger)' },
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
        <StatCard icon={Icons.users} label="Tổng sinh viên" value={MOCK_SINH_VIEN_STATS.tongSo} color="var(--color-primary)" />
        <StatCard icon={Icons.book} label="Đang học" value={MOCK_SINH_VIEN_STATS.dangHoc} color="var(--color-success)" />
        <StatCard icon={Icons.alert} label="Bảo lưu" value={MOCK_SINH_VIEN_STATS.baoLuu} color="var(--color-warning)" />
        <StatCard icon={Icons.alertTriangle} label="Đình chỉ" value={MOCK_SINH_VIEN_STATS.dinhChi} color="var(--color-danger)" />
        <StatCard icon={Icons.award} label="Tốt nghiệp" value={MOCK_SINH_VIEN_STATS.totNghiep} color="#8b5cf6" />
        <StatCard icon={Icons.download} label="Đã rút hồ sơ" value={MOCK_SINH_VIEN_STATS.daRutHoSo} color="#6b7280" />
      </div>

      {/* Ho so section */}
      <div className="tq-section">
        <h2 className="tq-section__title">Tổng quan hồ sơ</h2>
        
        <div className="tq-ho-so-cards">
          <div className="tq-ho-so-card">
            <span className="tq-ho-so-card__value">{MOCK_HO_SO_STATS.tongHoSo.toLocaleString()}</span>
            <span className="tq-ho-so-card__label">Tổng hồ sơ</span>
          </div>
          <div className="tq-ho-so-card tq-ho-so-card--success">
            <span className="tq-ho-so-card__value">{MOCK_HO_SO_STATS.hoSoDayDu.toLocaleString()}</span>
            <span className="tq-ho-so-card__label">Hồ sơ đầy đủ</span>
          </div>
          <div className="tq-ho-so-card tq-ho-so-card--warning">
            <span className="tq-ho-so-card__value">{MOCK_HO_SO_STATS.hoSoThieu.toLocaleString()}</span>
            <span className="tq-ho-so-card__label">Hồ sơ thiếu</span>
          </div>
        </div>

        <div className="tq-ho-so-progress">
          <ProgressBar 
            value={MOCK_HO_SO_STATS.hoSoDayDu} 
            maxValue={MOCK_HO_SO_STATS.tongHoSo}
            label="Hồ sơ đầy đủ"
          />
          <span className="tq-ho-so-progress__text">
            {hoSoDayDuPercent.toFixed(1)}% hồ sơ đầy đủ
          </span>
        </div>
      </div>

      {/* Two columns: Nganh + Muon Tra */}
      <div className="tq-two-columns">
        {/* Sinh vien theo nganh */}
        <div className="tq-card">
          <div className="tq-card__header">
            <h2 className="tq-card__title">Sinh viên theo ngành</h2>
          </div>
          <div className="tq-nganh-list">
            {MOCK_NGANH.map((nganh, index) => (
              <NganhItem 
                key={index} 
                tenNganh={nganh.tenNganh} 
                soLuong={nganh.soLuong} 
                maxSoLuong={maxSoLuongNganh}
              />
            ))}
          </div>
          <button className="tq-card__link">
            Xem tất cả {Icons.arrowRight}
          </button>
        </div>

        {/* Muon tra ho so */}
        <div className="tq-card">
          <div className="tq-card__header">
            <h2 className="tq-card__title">Tình trạng mượn / trả hồ sơ</h2>
          </div>
          <DonutChart 
            data={donutData}
            centerText={totalMuonTra.toString()}
            centerSubtext="Phiếu mượn"
          />
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
          {MOCK_HOAT_DONG.map((hoatDong) => (
            <HoatDongItem key={hoatDong.id} hoatDong={hoatDong} />
          ))}
        </div>
      </div>
    </div>
  )
}
