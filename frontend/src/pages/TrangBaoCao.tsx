import { useState, useEffect, useCallback } from 'react'
import { thongKeApi } from '../api/thongKe'
import type { SinhVienStatsResponse, ThongKeNganhItem, ThongKeHoSoResponse, ThongKeMuonTraResponse } from '../api/thongKe'
import { danhMucApi } from '../api/danhMuc'
import type { KhoaHoc } from '../api/types'
import './TrangBaoCao.css'

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
  ),
  loading: (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="spinner">
      <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
    </svg>
  ),
  empty: (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
      <path d="M12 12v4"/>
      <path d="M8 12v4"/>
      <path d="M16 12v4"/>
    </svg>
  )
}

function formatNumber(num: number): string {
  if (num === null || num === undefined) return '0'
  return num.toLocaleString('vi-VN')
}

// Trạng thái loading/error cho từng section
interface LoadingState {
  sinhVienStats: boolean
  nganhStats: boolean
  hoSoStats: boolean
  muonTraStats: boolean
}

interface ErrorState {
  sinhVienStats: string | null
  nganhStats: string | null
  hoSoStats: string | null
  muonTraStats: string | null
}

export function TrangBaoCao() {
  // State cho Tổng quan sinh viên (từ API)
  const [sinhVienStats, setSinhVienStats] = useState<SinhVienStatsResponse | null>(null)
  
  // State cho thống kê theo ngành (từ API)
  const [nganhData, setNganhData] = useState<ThongKeNganhItem[]>([])
  const [tongSoTrongLoc, setTongSoTrongLoc] = useState(0)
  
  // State cho tổng quan hồ sơ (từ API)
  const [hoSoStats, setHoSoStats] = useState<ThongKeHoSoResponse | null>(null)
  
  // State cho mượn/trả (từ API)
  const [muonTraStats, setMuonTraStats] = useState<ThongKeMuonTraResponse | null>(null)
  
  // State cho khóa học filter
  const [khoaHocList, setKhoaHocList] = useState<KhoaHoc[]>([])
  const [selectedKhoaHocId, setSelectedKhoaHocId] = useState<number | 'all'>('all')
  
  // Loading states
  const [loading, setLoading] = useState<LoadingState>({
    sinhVienStats: true,
    nganhStats: true,
    hoSoStats: true,
    muonTraStats: true
  })
  
  // Error states
  const [errors, setErrors] = useState<ErrorState>({
    sinhVienStats: null,
    nganhStats: null,
    hoSoStats: null,
    muonTraStats: null
  })

  // Load tổng quan sinh viên
  useEffect(() => {
    const loadSinhVienStats = async () => {
      setLoading(prev => ({ ...prev, sinhVienStats: true }))
      setErrors(prev => ({ ...prev, sinhVienStats: null }))
      
      try {
        const response = await thongKeApi.getSinhVienStats()
        if (response.success && response.data) {
          setSinhVienStats(response.data)
        } else {
          setErrors(prev => ({ ...prev, sinhVienStats: response.message || 'Không thể tải dữ liệu' }))
        }
      } catch (error) {
        console.error('Lỗi khi tải thống kê sinh viên:', error)
        setErrors(prev => ({ ...prev, sinhVienStats: 'Lỗi kết nối server' }))
      } finally {
        setLoading(prev => ({ ...prev, sinhVienStats: false }))
      }
    }
    
    loadSinhVienStats()
  }, [])

  // Load thống kê theo ngành
  const loadNganhStats = useCallback(async (khoaHocId?: number) => {
    setLoading(prev => ({ ...prev, nganhStats: true }))
    setErrors(prev => ({ ...prev, nganhStats: null }))
    
    try {
      const response = await thongKeApi.getSinhVienTheoNganh(khoaHocId)
      if (response.success && response.data) {
        setNganhData(response.data.nganhList || [])
        setTongSoTrongLoc(response.data.tongSoTrongLoc || 0)
      } else {
        setErrors(prev => ({ ...prev, nganhStats: response.message || 'Không thể tải dữ liệu' }))
        setNganhData([])
      }
    } catch (error) {
      console.error('Lỗi khi tải thống kê ngành:', error)
      setErrors(prev => ({ ...prev, nganhStats: 'Lỗi kết nối server' }))
      setNganhData([])
    } finally {
      setLoading(prev => ({ ...prev, nganhStats: false }))
    }
  }, [])

  // Load tổng quan hồ sơ
  useEffect(() => {
    const loadHoSoStats = async () => {
      setLoading(prev => ({ ...prev, hoSoStats: true }))
      setErrors(prev => ({ ...prev, hoSoStats: null }))
      
      try {
        const response = await thongKeApi.getThongKeHoSo()
        if (response.success && response.data) {
          setHoSoStats(response.data)
        } else {
          setErrors(prev => ({ ...prev, hoSoStats: response.message || 'Không thể tải dữ liệu' }))
        }
      } catch (error) {
        console.error('Lỗi khi tải thống kê hồ sơ:', error)
        setErrors(prev => ({ ...prev, hoSoStats: 'Lỗi kết nối server' }))
      } finally {
        setLoading(prev => ({ ...prev, hoSoStats: false }))
      }
    }
    
    loadHoSoStats()
  }, [])

  // Load thống kê mượn/trả
  useEffect(() => {
    const loadMuonTraStats = async () => {
      setLoading(prev => ({ ...prev, muonTraStats: true }))
      setErrors(prev => ({ ...prev, muonTraStats: null }))
      
      try {
        const response = await thongKeApi.getThongKeMuonTra()
        if (response.success && response.data) {
          setMuonTraStats(response.data)
        } else {
          setErrors(prev => ({ ...prev, muonTraStats: response.message || 'Không thể tải dữ liệu' }))
        }
      } catch (error) {
        console.error('Lỗi khi tải thống kê mượn/trả:', error)
        setErrors(prev => ({ ...prev, muonTraStats: 'Lỗi kết nối server' }))
      } finally {
        setLoading(prev => ({ ...prev, muonTraStats: false }))
      }
    }
    
    loadMuonTraStats()
  }, [])

  // Load danh sách khóa học cho filter
  useEffect(() => {
    const loadKhoaHoc = async () => {
      try {
        const response = await danhMucApi.getKhoaHoc()
        if (response.success && response.data) {
          setKhoaHocList(response.data)
        }
      } catch (error) {
        console.error('Lỗi khi tải danh sách khóa học:', error)
      }
    }
    
    loadKhoaHoc()
    // Load ngành stats lần đầu (không filter)
    loadNganhStats()
  }, [loadNganhStats])

  // Handle filter khóa học thay đổi
  const handleKhoaHocChange = async (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value
    const newKhoaHocId = value === 'all' ? 'all' : parseInt(value, 10)
    setSelectedKhoaHocId(newKhoaHocId)
    
    // Gọi API với filter
    const khoaHocId = newKhoaHocId === 'all' ? undefined : newKhoaHocId
    await loadNganhStats(khoaHocId)
  }

  // Tính toán cho biểu đồ donut mượn/trả
  const totalMuonTra = (muonTraStats?.dangMuon || 0) + (muonTraStats?.daTra || 0) + (muonTraStats?.quaHan || 0)
  const percentDangMuon = totalMuonTra > 0 ? ((muonTraStats?.dangMuon || 0) / totalMuonTra) * 100 : 0
  const percentDaTra = totalMuonTra > 0 ? ((muonTraStats?.daTra || 0) / totalMuonTra) * 100 : 0
  const conicGradient = `conic-gradient(
    var(--color-primary) 0% ${percentDangMuon}%,
    var(--color-success) ${percentDangMuon}% ${percentDangMuon + percentDaTra}%,
    var(--color-warning) ${percentDangMuon + percentDaTra}% 100%
  )`

  // Tính max ngành cho progress bar
  const maxNganh = nganhData.length > 0 ? Math.max(...nganhData.map(n => n.soLuong)) : 1

  // Tính tổng sinh viên cho tỷ lệ
  const tongSoSinhVien = sinhVienStats?.tongSoSinhVien ?? 0

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
          {/* Tổng số sinh viên */}
          <div className="bao-cao__stat-card bao-cao__stat-card--primary">
            <div className="bao-cao__stat-icon">{Icons.user}</div>
            <div className="bao-cao__stat-content">
              <span className="bao-cao__stat-label">Tổng số sinh viên</span>
              {loading.sinhVienStats ? (
                <span className="bao-cao__stat-value bao-cao__stat-value--loading">{Icons.loading}</span>
              ) : errors.sinhVienStats ? (
                <span className="bao-cao__stat-value bao-cao__stat-value--error">-</span>
              ) : (
                <span className="bao-cao__stat-value">{formatNumber(sinhVienStats?.tongSoSinhVien ?? 0)}</span>
              )}
              <span className="bao-cao__stat-sub">Toàn hệ thống</span>
            </div>
          </div>

          {/* Đang học */}
          <div className="bao-cao__stat-card bao-cao__stat-card--success">
            <div className="bao-cao__stat-icon">{Icons.book}</div>
            <div className="bao-cao__stat-content">
              <span className="bao-cao__stat-label">Đang học</span>
              {loading.sinhVienStats ? (
                <span className="bao-cao__stat-value bao-cao__stat-value--loading">{Icons.loading}</span>
              ) : errors.sinhVienStats ? (
                <span className="bao-cao__stat-value bao-cao__stat-value--error">-</span>
              ) : (
                <span className="bao-cao__stat-value">{formatNumber(sinhVienStats?.dangHoc ?? 0)}</span>
              )}
              <span className="bao-cao__stat-sub">
                {tongSoSinhVien > 0 && sinhVienStats
                  ? ((sinhVienStats.dangHoc / tongSoSinhVien) * 100).toFixed(1)
                  : '0.0'}% tổng số
              </span>
            </div>
          </div>

          {/* Bảo lưu */}
          <div className="bao-cao__stat-card bao-cao__stat-card--warning">
            <div className="bao-cao__stat-icon">{Icons.alert}</div>
            <div className="bao-cao__stat-content">
              <span className="bao-cao__stat-label">Bảo lưu</span>
              {loading.sinhVienStats ? (
                <span className="bao-cao__stat-value bao-cao__stat-value--loading">{Icons.loading}</span>
              ) : errors.sinhVienStats ? (
                <span className="bao-cao__stat-value bao-cao__stat-value--error">-</span>
              ) : (
                <span className="bao-cao__stat-value">{formatNumber(sinhVienStats?.baoLuu ?? 0)}</span>
              )}
              <span className="bao-cao__stat-sub">
                {tongSoSinhVien > 0 && sinhVienStats
                  ? ((sinhVienStats.baoLuu / tongSoSinhVien) * 100).toFixed(1)
                  : '0.0'}% tổng số
              </span>
            </div>
          </div>

          {/* Đình chỉ */}
          <div className="bao-cao__stat-card bao-cao__stat-card--danger">
            <div className="bao-cao__stat-icon">{Icons.alert}</div>
            <div className="bao-cao__stat-content">
              <span className="bao-cao__stat-label">Đình chỉ</span>
              {loading.sinhVienStats ? (
                <span className="bao-cao__stat-value bao-cao__stat-value--loading">{Icons.loading}</span>
              ) : errors.sinhVienStats ? (
                <span className="bao-cao__stat-value bao-cao__stat-value--error">-</span>
              ) : (
                <span className="bao-cao__stat-value">{formatNumber(sinhVienStats?.dinhChi ?? 0)}</span>
              )}
              <span className="bao-cao__stat-sub">
                {tongSoSinhVien > 0 && sinhVienStats
                  ? ((sinhVienStats.dinhChi / tongSoSinhVien) * 100).toFixed(1)
                  : '0.0'}% tổng số
              </span>
            </div>
          </div>

          {/* Tốt nghiệp */}
          <div className="bao-cao__stat-card bao-cao__stat-card--purple">
            <div className="bao-cao__stat-icon">{Icons.check}</div>
            <div className="bao-cao__stat-content">
              <span className="bao-cao__stat-label">Tốt nghiệp</span>
              {loading.sinhVienStats ? (
                <span className="bao-cao__stat-value bao-cao__stat-value--loading">{Icons.loading}</span>
              ) : errors.sinhVienStats ? (
                <span className="bao-cao__stat-value bao-cao__stat-value--error">-</span>
              ) : (
                <span className="bao-cao__stat-value">{formatNumber(sinhVienStats?.totNghiep ?? 0)}</span>
              )}
              <span className="bao-cao__stat-sub">
                {tongSoSinhVien > 0 && sinhVienStats
                  ? ((sinhVienStats.totNghiep / tongSoSinhVien) * 100).toFixed(1)
                  : '0.0'}% tổng số
              </span>
            </div>
          </div>

          {/* Đã rút hồ sơ */}
          <div className="bao-cao__stat-card bao-cao__stat-card--gray">
            <div className="bao-cao__stat-icon">{Icons.file}</div>
            <div className="bao-cao__stat-content">
              <span className="bao-cao__stat-label">Đã rút hồ sơ</span>
              {loading.sinhVienStats ? (
                <span className="bao-cao__stat-value bao-cao__stat-value--loading">{Icons.loading}</span>
              ) : errors.sinhVienStats ? (
                <span className="bao-cao__stat-value bao-cao__stat-value--error">-</span>
              ) : (
                <span className="bao-cao__stat-value">{formatNumber(sinhVienStats?.daRutHoSo ?? 0)}</span>
              )}
              <span className="bao-cao__stat-sub">
                {tongSoSinhVien > 0 && sinhVienStats
                  ? ((sinhVienStats.daRutHoSo / tongSoSinhVien) * 100).toFixed(1)
                  : '0.0'}% tổng số
              </span>
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
            <select 
              className="bao-cao__filter-select"
              value={selectedKhoaHocId === 'all' ? 'all' : String(selectedKhoaHocId)}
              onChange={handleKhoaHocChange}
            >
              <option value="all">Tất cả khóa</option>
              {khoaHocList.map((kh) => (
                <option key={kh.id} value={kh.id}>
                  {kh.tenKhoaHoc}
                </option>
              ))}
            </select>
          </div>

          {/* Loading state */}
          {loading.nganhStats ? (
            <div className="bao-cao__loading-state">
              {Icons.loading}
              <span>Đang tải dữ liệu...</span>
            </div>
          ) : errors.nganhStats ? (
            /* Error state */
            <div className="bao-cao__error-state">
              <span>{errors.nganhStats}</span>
            </div>
          ) : nganhData.length === 0 ? (
            /* Empty state */
            <div className="bao-cao__empty-state">
              {Icons.empty}
              <span>Chưa có dữ liệu sinh viên theo ngành</span>
            </div>
          ) : (
            /* Data table */
            <div className="bao-cao__nganh-list">
              <div className="bao-cao__nganh-header">
                <span className="bao-cao__nganh-col bao-cao__nganh-col--stt">STT</span>
                <span className="bao-cao__nganh-col bao-cao__nganh-col--ten">Ngành</span>
                <span className="bao-cao__nganh-col bao-cao__nganh-col--so-luong">Số lượng</span>
                <span className="bao-cao__nganh-col bao-cao__nganh-col--ty-le">Tỷ lệ</span>
              </div>

              <div className="bao-cao__nganh-body">
                {nganhData.map((nganh, index) => (
                  <div key={nganh.tenNganh} className="bao-cao__nganh-row">
                    <span className="bao-cao__nganh-col bao-cao__nganh-col--stt">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <span className="bao-cao__nganh-col bao-cao__nganh-col--ten">{nganh.tenNganh}</span>
                    <span className="bao-cao__nganh-col bao-cao__nganh-col--so-luong">
                      <span className="bao-cao__nganh-number">{nganh.soLuong}</span>
                      <div className="bao-cao__progress-bar">
                        <div
                          className="bao-cao__progress-fill"
                          style={{ width: `${(nganh.soLuong / maxNganh) * 100}%` }}
                        />
                      </div>
                    </span>
                    <span className="bao-cao__nganh-col bao-cao__nganh-col--ty-le">
                      {nganh.tyLePhanTram.toFixed(1)}%
                    </span>
                  </div>
                ))}
              </div>
              
              {/* Summary footer */}
              <div className="bao-cao__nganh-footer">
                <span>Tổng số: {formatNumber(tongSoTrongLoc)} sinh viên</span>
              </div>
            </div>
          )}
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
                  <span className="bao-cao__ho-so-label">Tổng số sinh viên</span>
                  {loading.hoSoStats ? (
                    <span className="bao-cao__ho-so-value bao-cao__stat-value--loading">{Icons.loading}</span>
                  ) : errors.hoSoStats ? (
                    <span className="bao-cao__ho-so-value bao-cao__stat-value--error">-</span>
                  ) : (
                    <span className="bao-cao__ho-so-value">
                      {formatNumber(hoSoStats?.tongSoSinhVien ?? 0)}
                    </span>
                  )}
                </div>
              </div>

              <div className="bao-cao__ho-so-card bao-cao__ho-so-card--success">
                <div className="bao-cao__ho-so-icon">{Icons.check}</div>
                <div className="bao-cao__ho-so-info">
                  <span className="bao-cao__ho-so-label">Hồ sơ đầy đủ</span>
                  {loading.hoSoStats ? (
                    <span className="bao-cao__ho-so-value bao-cao__stat-value--loading">{Icons.loading}</span>
                  ) : errors.hoSoStats ? (
                    <span className="bao-cao__ho-so-value bao-cao__stat-value--error">-</span>
                  ) : (
                    <span className="bao-cao__ho-so-value">
                      {formatNumber(hoSoStats?.hoSoDayDu ?? 0)}
                    </span>
                  )}
                  <span className="bao-cao__ho-so-sub">
                    {hoSoStats && hoSoStats.tongSoSinhVien > 0
                      ? ((hoSoStats.hoSoDayDu / hoSoStats.tongSoSinhVien) * 100).toFixed(1) + '%'
                      : '0%'}
                  </span>
                </div>
              </div>

              <div className="bao-cao__ho-so-card bao-cao__ho-so-card--danger">
                <div className="bao-cao__ho-so-icon">{Icons.alert}</div>
                <div className="bao-cao__ho-so-info">
                  <span className="bao-cao__ho-so-label">Hồ sơ đang thiếu</span>
                  {loading.hoSoStats ? (
                    <span className="bao-cao__ho-so-value bao-cao__stat-value--loading">{Icons.loading}</span>
                  ) : errors.hoSoStats ? (
                    <span className="bao-cao__ho-so-value bao-cao__stat-value--error">-</span>
                  ) : (
                    <span className="bao-cao__ho-so-value">
                      {formatNumber(hoSoStats?.hoSoConThieu ?? 0)}
                    </span>
                  )}
                  <span className="bao-cao__ho-so-sub">
                    {hoSoStats && hoSoStats.tongSoSinhVien > 0
                      ? ((hoSoStats.hoSoConThieu / hoSoStats.tongSoSinhVien) * 100).toFixed(1) + '%'
                      : '0%'}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Thông tin về giấy tờ bắt buộc */}
            <p className="bao-cao__note bao-cao__note--info">
              Hồ sơ đầy đủ: có đủ {hoSoStats?.soGiayToBatBuoc || 8} giấy tờ bắt buộc với trạng thái "Đã nộp"
            </p>
          </section>

          {/* Section 4: Tình hình mượn/trả hồ sơ */}
          <section className="bao-cao__section bao-cao__section--muon-tra">
            <h2 className="bao-cao__section-title">Tình hình mượn / trả hồ sơ</h2>

            <div className="bao-cao__donut-container">
              <div className="bao-cao__donut-chart">
                {loading.muonTraStats ? (
                  <div className="bao-cao__donut-loading">
                    {Icons.loading}
                  </div>
                ) : errors.muonTraStats ? (
                  <div className="bao-cao__donut-error">
                    <span>{errors.muonTraStats}</span>
                  </div>
                ) : (
                  <div
                    className="bao-cao__donut-fill"
                    style={{ background: conicGradient }}
                  >
                    <div className="bao-cao__donut-hole">
                      <span className="bao-cao__donut-label">Tổng số lượt</span>
                      <span className="bao-cao__donut-value">{formatNumber(totalMuonTra)}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="bao-cao__donut-legend">
                <div className="bao-cao__legend-item">
                  <span className="bao-cao__legend-dot bao-cao__legend-dot--primary"></span>
                  <span className="bao-cao__legend-text">Đang mượn</span>
                  <span className="bao-cao__legend-value">
                    {loading.muonTraStats ? '-' : formatNumber(muonTraStats?.dangMuon || 0)}
                  </span>
                </div>
                <div className="bao-cao__legend-item">
                  <span className="bao-cao__legend-dot bao-cao__legend-dot--success"></span>
                  <span className="bao-cao__legend-text">Đã trả</span>
                  <span className="bao-cao__legend-value">
                    {loading.muonTraStats ? '-' : formatNumber(muonTraStats?.daTra || 0)}
                  </span>
                </div>
                <div className="bao-cao__legend-item">
                  <span className="bao-cao__legend-dot bao-cao__legend-dot--warning"></span>
                  <span className="bao-cao__legend-text">Quá hạn</span>
                  <span className="bao-cao__legend-value">
                    {loading.muonTraStats ? '-' : formatNumber(muonTraStats?.quaHan || 0)}
                  </span>
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
        
        <p className="bao-cao__note">
          Chức năng xuất báo cáo đang được phát triển
        </p>
      </section>
    </div>
  )
}
