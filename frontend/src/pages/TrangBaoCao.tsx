import './TrangBaoCao.css'

// Mock data cho UI
const MOCK_SINH_VIEN = {
  tongSo: 2458,
  dangHoc: 2210,
  baoLuu: 128,
  dinhChi: 15,
  totNghiep: 82,
  daRut: 23
}

const MOCK_NGANH = [
  { stt: 1, ten: 'Công nghệ thông tin', soLuong: 420, tyLe: 17.1 },
  { stt: 2, ten: 'Quản trị kinh doanh', soLuong: 356, tyLe: 14.5 },
  { stt: 3, ten: 'Luật', soLuong: 298, tyLe: 12.1 },
  { stt: 4, ten: 'Tài chính - Ngân hàng', soLuong: 276, tyLe: 11.2 },
  { stt: 5, ten: 'Kế toán', soLuong: 240, tyLe: 9.8 },
  { stt: 6, ten: 'Ngôn ngữ Anh', soLuong: 210, tyLe: 8.5 },
  { stt: 7, ten: 'Truyền thông đa phương tiện', soLuong: 168, tyLe: 6.8 },
  { stt: 8, ten: 'Tâm lý học', soLuong: 112, tyLe: 4.6 },
  { stt: 9, ten: 'Kinh tế quốc tế', soLuong: 98, tyLe: 4.0 },
  { stt: 10, ten: 'Công tác xã hội', soLuong: 64, tyLe: 2.6 },
  { stt: 11, ten: 'Quản trị dịch vụ du lịch và lữ hành', soLuong: 52, tyLe: 2.1 },
  { stt: 12, ten: 'Giáo dục mầm non', soLuong: 48, tyLe: 2.0 },
  { stt: 13, ten: 'Thiết kế đồ họa', soLuong: 38, tyLe: 1.5 },
  { stt: 14, ten: 'Công nghệ thực phẩm', soLuong: 32, tyLe: 1.3 },
  { stt: 15, ten: 'Kỹ thuật phần mềm', soLuong: 26, tyLe: 1.1 },
  { stt: 16, ten: 'Quan hệ công chúng', soLuong: 18, tyLe: 0.7 },
  { stt: 17, ten: 'Kỹ thuật điện - điện tử', soLuong: 12, tyLe: 0.5 }
]

const MOCK_HO_SO = {
  tongSo: 2458,
  dayDu: 2112,
  thieu: 346
}

const MOCK_MUON_TRA = {
  dangMuon: 356,
  daTra: 498,
  quaHan: 38
}

// Icons
const Icons = {
  user: (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  ),
  book: (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/>
    </svg>
  ),
  check: (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
      <polyline points="22 4 12 14.01 9 11.01"/>
    </svg>
  ),
  alert: (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="8" x2="12" y2="12"/>
      <line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  ),
  arrow: (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14"/>
      <path d="m12 5 7 7-7 7"/>
    </svg>
  ),
  chart: (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3v18h18"/>
      <path d="m19 9-5 5-4-4-3 3"/>
    </svg>
  ),
  report: (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/>
      <line x1="10" y1="9" x2="8" y2="9"/>
    </svg>
  ),
  file: (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/>
      <path d="M14 2v4a2 2 0 0 0 2 2h4"/>
    </svg>
  ),
  paper: (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 3h5v5"/>
      <path d="M8 3H3v5"/>
      <path d="M12 22v-8.3a4 4 0 0 0-1.172-2.872L3 3"/>
      <path d="m15 9 6-6"/>
    </svg>
  )
}

function formatNumber(num: number): string {
  return num.toLocaleString('vi-VN')
}

export function TrangBaoCao() {
  const maxNganh = Math.max(...MOCK_NGANH.map(n => n.soLuong))
  const totalMuonTra = MOCK_MUON_TRA.dangMuon + MOCK_MUON_TRA.daTra + MOCK_MUON_TRA.quaHan

  // CSS conic gradient for donut
  const percentDangMuon = (MOCK_MUON_TRA.dangMuon / totalMuonTra) * 100
  const percentDaTra = (MOCK_MUON_TRA.daTra / totalMuonTra) * 100
  const conicGradient = `conic-gradient(
    var(--color-primary) 0% ${percentDangMuon}%,
    var(--color-success) ${percentDangMuon}% ${percentDangMuon + percentDaTra}%,
    var(--color-warning) ${percentDangMuon + percentDaTra}% 100%
  )`

  return (
    <div className="bao-cao">
      {/* Header */}
      <div className="bao-cao__header">
        <h1 className="bao-cao__title">Báo cáo & Thống kê</h1>
        <p className="bao-cao__subtitle">Theo dõi tổng quan tình hình sinh viên và hồ sơ</p>
      </div>

      {/* Section 1: Tổng quan sinh viên */}
      <section className="bao-cao__section">
        <h2 className="bao-cao__section-title">Tổng quan sinh viên</h2>
        <div className="bao-cao__stats-grid">
          <div className="bao-cao__stat-card bao-cao__stat-card--primary">
            <div className="bao-cao__stat-icon">{Icons.user}</div>
            <div className="bao-cao__stat-content">
              <span className="bao-cao__stat-label">Tổng số sinh viên</span>
              <span className="bao-cao__stat-value">{formatNumber(MOCK_SINH_VIEN.tongSo)}</span>
              <span className="bao-cao__stat-sub">Toàn hệ thống</span>
            </div>
          </div>

          <div className="bao-cao__stat-card bao-cao__stat-card--success">
            <div className="bao-cao__stat-icon">{Icons.book}</div>
            <div className="bao-cao__stat-content">
              <span className="bao-cao__stat-label">Đang học</span>
              <span className="bao-cao__stat-value">{formatNumber(MOCK_SINH_VIEN.dangHoc)}</span>
              <span className="bao-cao__stat-sub">{((MOCK_SINH_VIEN.dangHoc / MOCK_SINH_VIEN.tongSo) * 100).toFixed(1)}% tổng số</span>
            </div>
          </div>

          <div className="bao-cao__stat-card bao-cao__stat-card--warning">
            <div className="bao-cao__stat-icon">{Icons.alert}</div>
            <div className="bao-cao__stat-content">
              <span className="bao-cao__stat-label">Bảo lưu</span>
              <span className="bao-cao__stat-value">{formatNumber(MOCK_SINH_VIEN.baoLuu)}</span>
              <span className="bao-cao__stat-sub">{((MOCK_SINH_VIEN.baoLuu / MOCK_SINH_VIEN.tongSo) * 100).toFixed(1)}% tổng số</span>
            </div>
          </div>

          <div className="bao-cao__stat-card bao-cao__stat-card--danger">
            <div className="bao-cao__stat-icon">{Icons.alert}</div>
            <div className="bao-cao__stat-content">
              <span className="bao-cao__stat-label">Đình chỉ</span>
              <span className="bao-cao__stat-value">{formatNumber(MOCK_SINH_VIEN.dinhChi)}</span>
              <span className="bao-cao__stat-sub">{((MOCK_SINH_VIEN.dinhChi / MOCK_SINH_VIEN.tongSo) * 100).toFixed(1)}% tổng số</span>
            </div>
          </div>

          <div className="bao-cao__stat-card bao-cao__stat-card--purple">
            <div className="bao-cao__stat-icon">{Icons.check}</div>
            <div className="bao-cao__stat-content">
              <span className="bao-cao__stat-label">Tốt nghiệp</span>
              <span className="bao-cao__stat-value">{formatNumber(MOCK_SINH_VIEN.totNghiep)}</span>
              <span className="bao-cao__stat-sub">{((MOCK_SINH_VIEN.totNghiep / MOCK_SINH_VIEN.tongSo) * 100).toFixed(1)}% tổng số</span>
            </div>
          </div>

          <div className="bao-cao__stat-card bao-cao__stat-card--gray">
            <div className="bao-cao__stat-icon">{Icons.file}</div>
            <div className="bao-cao__stat-content">
              <span className="bao-cao__stat-label">Đã rút hồ sơ</span>
              <span className="bao-cao__stat-value">{formatNumber(MOCK_SINH_VIEN.daRut)}</span>
              <span className="bao-cao__stat-sub">{((MOCK_SINH_VIEN.daRut / MOCK_SINH_VIEN.tongSo) * 100).toFixed(1)}% tổng số</span>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2 & 3: Two column layout */}
      <div className="bao-cao__two-columns">
        {/* Section 2: Thống kê sinh viên theo ngành */}
        <section className="bao-cao__section bao-cao__section--nganh">
          <div className="bao-cao__section-header">
            <h2 className="bao-cao__section-title">Thống kê sinh viên theo ngành</h2>
            <select className="bao-cao__filter-select">
              <option value="all">Tất cả khóa</option>
              <option value="2024">Khóa 13</option>
              <option value="2023">Khóa 14</option>
              <option value="2022">Khóa 12</option>
            </select>
          </div>

          <div className="bao-cao__nganh-list">
            <div className="bao-cao__nganh-header">
              <span className="bao-cao__nganh-col bao-cao__nganh-col--stt">STT</span>
              <span className="bao-cao__nganh-col bao-cao__nganh-col--ten">Ngành</span>
              <span className="bao-cao__nganh-col bao-cao__nganh-col--so-luong">Số lượng</span>
              <span className="bao-cao__nganh-col bao-cao__nganh-col--ty-le">Tỷ lệ</span>
            </div>

            <div className="bao-cao__nganh-body">
              {MOCK_NGANH.map((nganh) => (
                <div key={nganh.stt} className="bao-cao__nganh-row">
                  <span className="bao-cao__nganh-col bao-cao__nganh-col--stt">{String(nganh.stt).padStart(2, '0')}</span>
                  <span className="bao-cao__nganh-col bao-cao__nganh-col--ten">{nganh.ten}</span>
                  <span className="bao-cao__nganh-col bao-cao__nganh-col--so-luong">
                    <span className="bao-cao__nganh-number">{nganh.soLuong}</span>
                    <div className="bao-cao__progress-bar">
                      <div
                        className="bao-cao__progress-fill"
                        style={{ width: `${(nganh.soLuong / maxNganh) * 100}%` }}
                      />
                    </div>
                  </span>
                  <span className="bao-cao__nganh-col bao-cao__nganh-col--ty-le">{nganh.tyLe}%</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Right column: Tổng quan hồ sơ + Mượn/Trả */}
        <div className="bao-cao__right-column">
          {/* Section 3: Tổng quan hồ sơ */}
          <section className="bao-cao__section bao-cao__section--ho-so">
            <h2 className="bao-cao__section-title">Tổng quan hồ sơ</h2>
            <div className="bao-cao__ho-so-grid">
              <div className="bao-cao__ho-so-card">
                <div className="bao-cao__ho-so-icon">{Icons.file}</div>
                <div className="bao-cao__ho-so-info">
                  <span className="bao-cao__ho-so-label">Tổng số hồ sơ</span>
                  <span className="bao-cao__ho-so-value">{formatNumber(MOCK_HO_SO.tongSo)}</span>
                </div>
              </div>

              <div className="bao-cao__ho-so-card bao-cao__ho-so-card--success">
                <div className="bao-cao__ho-so-icon">{Icons.check}</div>
                <div className="bao-cao__ho-so-info">
                  <span className="bao-cao__ho-so-label">Hồ sơ đầy đủ</span>
                  <span className="bao-cao__ho-so-value">{formatNumber(MOCK_HO_SO.dayDu)}</span>
                </div>
              </div>

              <div className="bao-cao__ho-so-card bao-cao__ho-so-card--danger">
                <div className="bao-cao__ho-so-icon">{Icons.alert}</div>
                <div className="bao-cao__ho-so-info">
                  <span className="bao-cao__ho-so-label">Hồ sơ đang thiếu</span>
                  <span className="bao-cao__ho-so-value">{formatNumber(MOCK_HO_SO.thieu)}</span>
                </div>
              </div>
            </div>
          </section>

          {/* Section 4: Tình hình mượn/trả hồ sơ */}
          <section className="bao-cao__section bao-cao__section--muon-tra">
            <h2 className="bao-cao__section-title">Tình hình mượn / trả hồ sơ</h2>

            <div className="bao-cao__donut-container">
              <div className="bao-cao__donut-chart">
                <div
                  className="bao-cao__donut-fill"
                  style={{ background: conicGradient }}
                >
                  <div className="bao-cao__donut-hole">
                    <span className="bao-cao__donut-label">Tổng số lượt</span>
                    <span className="bao-cao__donut-value">{formatNumber(totalMuonTra)}</span>
                  </div>
                </div>
              </div>

              <div className="bao-cao__donut-legend">
                <div className="bao-cao__legend-item">
                  <span className="bao-cao__legend-dot bao-cao__legend-dot--primary"></span>
                  <span className="bao-cao__legend-text">Đang mượn</span>
                  <span className="bao-cao__legend-value">{MOCK_MUON_TRA.dangMuon}</span>
                </div>
                <div className="bao-cao__legend-item">
                  <span className="bao-cao__legend-dot bao-cao__legend-dot--success"></span>
                  <span className="bao-cao__legend-text">Đã trả</span>
                  <span className="bao-cao__legend-value">{MOCK_MUON_TRA.daTra}</span>
                </div>
                <div className="bao-cao__legend-item">
                  <span className="bao-cao__legend-dot bao-cao__legend-dot--warning"></span>
                  <span className="bao-cao__legend-text">Quá hạn</span>
                  <span className="bao-cao__legend-value">{MOCK_MUON_TRA.quaHan}</span>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Section 5: Báo cáo */}
      <section className="bao-cao__section bao-cao__section--bao-cao">
        <h2 className="bao-cao__section-title">Báo cáo</h2>
        <div className="bao-cao__report-grid">
          <div className="bao-cao__report-card">
            <div className="bao-cao__report-icon">{Icons.user}</div>
            <div className="bao-cao__report-info">
              <h3 className="bao-cao__report-title">Báo cáo sinh viên</h3>
              <p className="bao-cao__report-desc">Danh sách, phân loại, thống kê</p>
            </div>
            <div className="bao-cao__report-arrow">{Icons.arrow}</div>
          </div>

          <div className="bao-cao__report-card">
            <div className="bao-cao__report-icon">{Icons.file}</div>
            <div className="bao-cao__report-info">
              <h3 className="bao-cao__report-title">Báo cáo hồ sơ</h3>
              <p className="bao-cao__report-desc">Tình trạng, tỷ lệ hoàn thiện</p>
            </div>
            <div className="bao-cao__report-arrow">{Icons.arrow}</div>
          </div>

          <div className="bao-cao__report-card">
            <div className="bao-cao__report-icon">{Icons.paper}</div>
            <div className="bao-cao__report-info">
              <h3 className="bao-cao__report-title">Báo cáo giấy tờ</h3>
              <p className="bao-cao__report-desc">Theo loại, theo trạng thái</p>
            </div>
            <div className="bao-cao__report-arrow">{Icons.arrow}</div>
          </div>
        </div>
      </section>
    </div>
  )
}
