import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { BoCucChinh } from './components/layout/BoCucChinh'
import { LoginPage } from './pages/LoginPage'
import { TrangTongQuan } from './pages/TrangTongQuan'
import { TrangDanhSachHoSo } from './pages/TrangDanhSachHoSo'
import { TrangChiTietHoSo } from './pages/TrangChiTietHoSo'
import { TrangMuonTra } from './pages/TrangMuonTra'
import { TrangRutHoSo } from './pages/TrangRutHoSo'
import { TrangLichSuAudit } from './pages/TrangLichSuAudit'
import { TrangBaoCao } from './pages/TrangBaoCao'
import { TrangCaiDat } from './pages/TrangCaiDat'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { PublicRoute } from './components/auth/PublicRoute'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          }
        />

        <Route element={<ProtectedRoute />}>
          <Route
            path="/"
            element={
              <BoCucChinh>
                <TrangTongQuan />
              </BoCucChinh>
            }
          />

          <Route
            path="/danh-sach-ho-so"
            element={
              <BoCucChinh>
                <TrangDanhSachHoSo />
              </BoCucChinh>
            }
          />
          <Route
            path="/danh-sach-ho-so/:mssv"
            element={
              <BoCucChinh>
                <TrangChiTietHoSo />
              </BoCucChinh>
            }
          />

          <Route
            path="/muon-tra-ho-so"
            element={
              <BoCucChinh>
                <TrangMuonTra />
              </BoCucChinh>
            }
          />

          <Route
            path="/rut-ho-so"
            element={
              <BoCucChinh>
                <TrangRutHoSo />
              </BoCucChinh>
            }
          />

          <Route
            path="/lich-su-audit"
            element={
              <BoCucChinh>
                <TrangLichSuAudit />
              </BoCucChinh>
            }
          />

          <Route
            path="/bao-cao-thong-ke"
            element={
              <BoCucChinh>
                <TrangBaoCao />
              </BoCucChinh>
            }
          />

          <Route
            path="/cai-dat"
            element={
              <BoCucChinh>
                <TrangCaiDat />
              </BoCucChinh>
            }
          />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
