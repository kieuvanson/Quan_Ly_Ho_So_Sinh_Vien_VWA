import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  FolderOpen,
  FileSpreadsheet,
  ClipboardList,
  FileText,
  BarChart3,
  History,
  Settings,
  LogOut,
  ChevronDown,
  ChevronRight,
} from 'lucide-react'
import { authStore } from '../../lib/authStore'
import { authApi } from '../../api/auth'
import './ThanhBen.css'

interface ThanhBenProps {
  isCollapsed: boolean
}

interface MenuChild {
  id: string
  icon: React.ComponentType<{ size?: number; className?: string }>
  label: string
  path: string
}

interface MenuItem {
  id: string
  icon: React.ComponentType<{ size?: number; className?: string }>
  label: string
  path?: string
  hasChildren?: boolean
  expanded?: boolean
  onToggle?: () => void
  children?: MenuChild[]
}

export function ThanhBen({ isCollapsed }: ThanhBenProps) {
  const navigate = useNavigate()
  const [hoSoExpanded, setHoSoExpanded] = useState(true)

  function handleLogout() {
    authStore.clearAuth()
    navigate('/login')
    authApi.logout().catch(() => {})
  }

  const menuItems: MenuItem[] = [
    {
      id: 'tong-quan',
      icon: LayoutDashboard,
      label: 'Tổng quan',
      path: '/',
    },
    {
      id: 'ho-so',
      icon: FolderOpen,
      label: 'Hồ sơ sinh viên',
      hasChildren: true,
      expanded: hoSoExpanded,
      onToggle: () => setHoSoExpanded(!hoSoExpanded),
      children: [
        { id: 'danh-sach', icon: FileSpreadsheet, label: 'Danh sách hồ sơ', path: '/danh-sach-ho-so' },
        { id: 'muon-tra', icon: ClipboardList, label: 'Mượn / trả hồ sơ', path: '/muon-tra-ho-so' },
        { id: 'rut-ho-so', icon: FileText, label: 'Rút hồ sơ', path: '/rut-ho-so' },
      ],
    },
    {
      id: 'bao-cao',
      icon: BarChart3,
      label: 'Báo cáo - Thống kê',
      path: '/bao-cao-thong-ke',
    },
    {
      id: 'lich-su',
      icon: History,
      label: 'Lịch sử & Audit',
      path: '/lich-su-audit',
    },
    {
      id: 'cai-dat',
      icon: Settings,
      label: 'Cài đặt',
      path: '/cai-dat',
    },
  ]

  return (
    <aside className={`thanh-ben ${isCollapsed ? 'thanh-ben--collapsed' : ''}`}>
      <div className="thanh-ben__brand">
        <img src="/vwa-logo.svg" alt="VWA Logo" className="thanh-ben__logo-img" />
        {!isCollapsed && (
          <div className="thanh-ben__brand-text">
            <span className="thanh-ben__brand-name">HỌC VIỆN PHỤ NỮ VIỆT NAM</span>
            <span className="thanh-ben__brand-subtitle">Hệ thống quản lý hồ sơ sinh viên VWA</span>
          </div>
        )}
      </div>

      <nav className="thanh-ben__nav">
        <ul className="thanh-ben__menu">
          {menuItems.map((item) => (
            <li key={item.id} className="thanh-ben__menu-item">
              {item.hasChildren ? (
                <>
                  <button
                    className="thanh-ben__link thanh-ben__link--parent"
                    onClick={item.onToggle}
                    aria-expanded={item.expanded}
                  >
                    <item.icon className="thanh-ben__icon" size={20} />
                    {!isCollapsed && (
                      <>
                        <span className="thanh-ben__label">{item.label}</span>
                        <span className="thanh-ben__chevron">
                          {item.expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                        </span>
                      </>
                    )}
                  </button>
                  {!isCollapsed && item.expanded && (
                    <ul className="thanh-ben__submenu">
                      {item.children?.map((child) => (
                        <li key={child.id}>
                          <NavLink
                            to={child.path}
                            className={({ isActive }) =>
                              `thanh-ben__link thanh-ben__link--child ${
                                isActive ? 'thanh-ben__link--active' : ''
                              }`
                            }
                          >
                            <child.icon className="thanh-ben__icon" size={18} />
                            <span className="thanh-ben__label">{child.label}</span>
                          </NavLink>
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              ) : item.path ? (
                <NavLink
                  to={item.path}
                  end={item.path === '/'}
                  className={({ isActive }) =>
                    `thanh-ben__link ${isActive ? 'thanh-ben__link--active' : ''}`
                  }
                >
                  <item.icon className="thanh-ben__icon" size={20} />
                  {!isCollapsed && <span className="thanh-ben__label">{item.label}</span>}
                </NavLink>
              ) : null}
            </li>
          ))}
        </ul>
      </nav>

      <div className="thanh-ben__footer">
        <button className="thanh-ben__link thanh-ben__link--logout" onClick={handleLogout}>
          <LogOut className="thanh-ben__icon" size={20} />
          {!isCollapsed && <span className="thanh-ben__label">Đăng xuất</span>}
        </button>
      </div>
    </aside>
  )
}
