import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { ThanhBen } from './ThanhBen'
import { ThanhDau } from './ThanhDau'
import './BoCucChinh.css'

const PAGE_NAMES: Record<string, string> = {
  '/': 'Tổng quan',
  '/danh-sach-ho-so': 'Danh sách hồ sơ',
  '/muon-tra-ho-so': 'Mượn / trả hồ sơ',
  '/rut-ho-so': 'Rút hồ sơ',
  '/bao-cao-thong-ke': 'Báo cáo - Thống kê',
  '/lich-su-audit': 'Lịch sử & Audit',
  '/cai-dat': 'Cài đặt',
}

function getPageName(pathname: string): string {
  if (pathname.startsWith('/danh-sach-ho-so/')) {
    return 'Hồ sơ sinh viên'
  }
  return PAGE_NAMES[pathname] || 'Trang'
}

export function BoCucChinh({ children }: { children: React.ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const location = useLocation()

  return (
    <div className={`bo-cuc-chinh ${sidebarCollapsed ? 'bo-cuc-chinh--collapsed' : ''}`}>
      <ThanhBen isCollapsed={sidebarCollapsed} />

      <div className="bo-cuc-chinh__main">
        <ThanhDau
          onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
          pageName={getPageName(location.pathname)}
        />

        <main className="bo-cuc-chinh__content">
          {children}
        </main>
      </div>
    </div>
  )
}
