import { useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  LayoutDashboard,
  Users,
  UserRound,
  ShoppingBag,
  Route,
  MapPinned,
  Compass,
  CreditCard,
  Wallet,
  FileText,
  Car,
  Tags,
  Gift,
  Headphones,
  BarChart3,
  FileBarChart,
  Bell,
  Settings,
  Shield,
  ScrollText,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Menu,
  X,
} from 'lucide-react'
import './Sidebar.css'

const menuItems = [
  { label: 'Dashboard', path: '/', icon: LayoutDashboard },
  { label: 'Drivers', path: '/drivers', icon: Users },
  { label: 'Customers', path: '/customers', icon: UserRound },
  { label: 'Orders', path: '/orders', icon: ShoppingBag },
  { label: 'Trips', path: '/trips', icon: Route },
  { label: 'Live Tracking', path: '/live-tracking', icon: MapPinned },
  { label: 'Zonal Maps', path: '/zonal-maps', icon: Compass },
  { label: 'Payments', path: '/payments', icon: CreditCard },
  { label: 'Wallet', path: '/wallet', icon: Wallet },
  { label: 'Documents', path: '/documents', icon: FileText },
  { label: 'Vehicle Types', path: '/vehicles', icon: Car },
  { label: 'Pricing', path: '/pricing', icon: Tags },
  { label: 'Incentives', path: '/incentives', icon: Gift },
  { label: 'Support', path: '/support', icon: Headphones },
  { label: 'Analytics', path: '/analytics', icon: BarChart3 },
  { label: 'Reports', path: '/reports', icon: FileBarChart },
  { label: 'Notifications', path: '/notifications', icon: Bell },
  { label: 'Settings', path: '/settings', icon: Settings },
  { label: 'Admin Users', path: '/admin-users', icon: Shield },
  { label: 'System Logs', path: '/system-logs', icon: ScrollText },
]

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
  mobileOpen: boolean
  onMobileClose: () => void
}

export default function Sidebar({
  collapsed,
  onToggle,
  mobileOpen,
  onMobileClose,
}: SidebarProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  return (
    <>
      {mobileOpen && (
        <div className="sidebar-overlay" onClick={onMobileClose} aria-hidden />
      )}

      <aside
        className={`sidebar ${collapsed ? 'sidebar--collapsed' : ''} ${mobileOpen ? 'sidebar--mobile-open' : ''}`}
      >
        <div className="sidebar__header">
          <div className="sidebar__brand">
            <div className="sidebar__logo" aria-hidden>
              <span>C</span>
            </div>
            <div className="sidebar__brand-text">
              <span className="sidebar__brand-name">Carryoo</span>
              <span className="sidebar__brand-sub">Admin Panel</span>
            </div>
          </div>
          <button
            type="button"
            className="sidebar__collapse-btn"
            onClick={onToggle}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={collapsed ? 'Expand' : 'Collapse'}
          >
            {collapsed ? <PanelLeftOpen size={18} strokeWidth={1.75} /> : <PanelLeftClose size={18} strokeWidth={1.75} />}
          </button>
          <button
            type="button"
            className="sidebar__mobile-close"
            onClick={onMobileClose}
            aria-label="Close menu"
          >
            <X size={18} strokeWidth={1.75} />
          </button>
        </div>

        <nav className="sidebar__nav" aria-label="Main navigation">
          <ul className="sidebar__menu">
            {menuItems.map((item) => {
              const Icon = item.icon
              const isActive =
                item.path === '/'
                  ? location.pathname === '/'
                  : location.pathname.startsWith(item.path)

              return (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    end={item.path === '/'}
                    className={`sidebar__link ${isActive ? 'sidebar__link--active' : ''}`}
                    onClick={onMobileClose}
                    title={collapsed ? item.label : undefined}
                  >
                    <span className="sidebar__link-icon">
                      <Icon size={18} strokeWidth={1.75} />
                    </span>
                    <span className="sidebar__link-label">{item.label}</span>
                  </NavLink>
                </li>
              )
            })}
          </ul>
        </nav>

        <div className="sidebar__footer">
          <div className="sidebar__profile" title={collapsed ? 'Admin User' : undefined}>
            <div className="sidebar__avatar" aria-hidden>
              {(user?.phone ?? 'A').replace(/\D/g, '').slice(-2) || 'A'}
            </div>
            <div className="sidebar__profile-info">
              <span className="sidebar__profile-name">{user?.phone ?? 'Admin'}</span>
              <span className="sidebar__profile-email">{user?.role ?? 'admin'}</span>
            </div>
          </div>
          <button
            type="button"
            className="sidebar__logout"
            title={collapsed ? 'Logout' : undefined}
            onClick={() => {
              logout()
              navigate('/login')
            }}
          >
            <LogOut size={18} strokeWidth={1.75} />
            <span className="sidebar__link-label">Logout</span>
          </button>
        </div>
      </aside>
    </>
  )
}

export function MobileMenuButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      className="mobile-menu-btn"
      onClick={onClick}
      aria-label="Open menu"
    >
      <Menu size={20} strokeWidth={1.75} />
    </button>
  )
}

export function useSidebarState() {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  return {
    collapsed,
    mobileOpen,
    toggleCollapsed: () => setCollapsed((c) => !c),
    openMobile: () => setMobileOpen(true),
    closeMobile: () => setMobileOpen(false),
  }
}
