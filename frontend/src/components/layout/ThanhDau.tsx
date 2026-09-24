import { Bell, ChevronDown, Menu } from 'lucide-react'
import { authStore } from '../../lib/authStore'
import './ThanhDau.css'

interface ThanhDauProps {
  onToggleSidebar: () => void
  pageName: string
}

function getDisplayName(): string {
  const user = authStore.getUser()
  return user?.hoTen || 'Người dùng'
}

function getDisplayRole(): string {
  const user = authStore.getUser()
  if (!user) return 'Không xác định'
  if (user.role === 'ADMIN') return 'Quản trị viên'
  if (user.role === 'STAFF') return 'Cán bộ'
  if (user.role === 'USER') return 'Người dùng'
  return user.role
}

export function ThanhDau({ onToggleSidebar, pageName }: ThanhDauProps) {
  return (
    <header className="thanh-dau">
      <div className="thanh-dau__left">
        <button className="thanh-dau__toggle" onClick={onToggleSidebar} aria-label="Thu gọn sidebar">
          <Menu size={20} />
        </button>
        <h1 className="thanh-dau__page-name">{pageName}</h1>
      </div>

      <div className="thanh-dau__right">
        <button className="thanh-dau__icon-btn" aria-label="Thông báo">
          <Bell size={20} />
        </button>

        <div className="thanh-dau__user">
          <img
            src="https://api.dicebear.com/7.x/avataaars/svg?seed=PhamThuyLinh"
            alt="Avatar"
            className="thanh-dau__avatar"
          />
          <div className="thanh-dau__user-info">
            <span className="thanh-dau__user-name">{getDisplayName()}</span>
            <span className="thanh-dau__user-role">{getDisplayRole()}</span>
          </div>
          <button className="thanh-dau__dropdown-btn" aria-label="Tùy chọn">
            <ChevronDown size={16} />
          </button>
        </div>
      </div>
    </header>
  )
}
