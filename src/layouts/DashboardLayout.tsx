import { useEffect, useMemo, useState } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  Bell,
  MessageSquare,
  Search,
  Moon,
  Sun,
  Settings,
  LogOut,
} from 'lucide-react'
import Sidebar, { MobileMenuButton, useSidebarState } from '../components/Sidebar'
import { useAuth } from '../context/AuthContext'
import './DashboardLayout.css'

const pageTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/drivers': 'Drivers',
  '/customers': 'Customers',
  '/orders': 'Orders',
  '/trips': 'Trips',
  '/live-tracking': 'Live Tracking',
  '/zonal-maps': 'Zonal Maps & Polygons',
  '/payments': 'Payments',
  '/wallet': 'Wallet',
  '/documents': 'Documents',
  '/vehicles': 'Vehicle Types',
  '/pricing': 'Pricing',
  '/driver-offers': 'Driver Offers',
  '/incentives': 'Incentives',
  '/support': 'Support',
  '/analytics': 'Analytics',
  '/reports': 'Reports',
  '/notifications': 'Notifications',
  '/settings': 'Settings',
  '/admin-users': 'Admin Users',
  '/system-logs': 'System Logs',
}

function formatCurrentDate() {
  return new Intl.DateTimeFormat('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date())
}

export default function DashboardLayout() {
  const {
    collapsed,
    mobileOpen,
    toggleCollapsed,
    openMobile,
    closeMobile,
  } = useSidebarState()
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout, isAdmin } = useAuth()
  const title = pageTitles[location.pathname] ?? 'Carryoo Admin'
  const [searchQuery, setSearchQuery] = useState('')
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('carryoo-theme')
    return saved === 'dark' ? 'dark' : 'light'
  })
  const currentDate = useMemo(() => formatCurrentDate(), [])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('carryoo-theme', theme)
  }, [theme])

  const handleGlobalSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const q = searchQuery.trim().toLowerCase()
    if (!q) return
    if (q.startsWith('cry-') || q.includes('order')) navigate('/orders')
    else if (q.startsWith('drv-') || q.includes('driver')) navigate('/drivers')
    else if (q.includes('customer') || q.includes('cust')) navigate('/customers')
    else if (q.includes('wallet') || q.includes('payout')) navigate('/wallet')
    else if (q.includes('ticket') || q.includes('support')) navigate('/support')
    else navigate('/orders')
  }

  return (
    <div
      className={`dashboard-layout ${collapsed ? 'dashboard-layout--collapsed' : ''}`}
    >
      <Sidebar
        collapsed={collapsed}
        onToggle={toggleCollapsed}
        mobileOpen={mobileOpen}
        onMobileClose={closeMobile}
      />

      <div className="dashboard-main">
        <header className="dashboard-topbar">
          <div className="dashboard-topbar__left">
            <MobileMenuButton onClick={openMobile} />
            <div className="dashboard-topbar__title-block">
              <h1 className="dashboard-topbar__title">{title}</h1>
              <span className="dashboard-topbar__date">{currentDate}</span>
            </div>
          </div>

          <form className="dashboard-topbar__center" onSubmit={handleGlobalSearch}>
            <label className="dashboard-search">
              <Search size={16} className="dashboard-search__icon" strokeWidth={1.75} aria-hidden />
              <input
                type="search"
                placeholder="Search drivers, customers, orders, vehicles…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Global search"
              />
            </label>
          </form>

          <div className="dashboard-topbar__right">
            <button
              type="button"
              className="dashboard-icon-btn"
              aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
              title="Theme"
              onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
            >
              {theme === 'dark' ? (
                <Sun size={18} strokeWidth={1.75} />
              ) : (
                <Moon size={18} strokeWidth={1.75} />
              )}
            </button>

            <Link
              to="/settings"
              className="dashboard-icon-btn"
              aria-label="Settings"
              title="Settings"
            >
              <Settings size={18} strokeWidth={1.75} />
            </Link>

            <Link
              to="/notifications"
              className="dashboard-icon-btn"
              aria-label="Notifications"
              title="Notifications"
            >
              <Bell size={18} strokeWidth={1.75} />
              <span className="dashboard-icon-btn__badge">5</span>
            </Link>

            <Link
              to="/support"
              className="dashboard-icon-btn"
              aria-label="Messages"
              title="Messages"
            >
              <MessageSquare size={18} strokeWidth={1.75} />
              <span className="dashboard-icon-btn__badge">3</span>
            </Link>

            <button
              type="button"
              className="dashboard-profile-btn"
              onClick={() => {
                logout()
                navigate('/login')
              }}
              title="Sign out"
            >
              <span className="dashboard-profile-btn__avatar" aria-hidden>
                {(user?.phone ?? 'A').replace(/\D/g, '').slice(-2) || 'A'}
              </span>
              <span className="dashboard-profile-btn__meta">
                <span className="dashboard-profile-btn__name">{user?.phone ?? 'Admin'}</span>
                <span className="dashboard-profile-btn__role">{isAdmin ? 'Admin' : user?.role ?? 'User'}</span>
              </span>
              <LogOut size={14} className="dashboard-profile-btn__chevron" strokeWidth={1.75} aria-hidden />
            </button>
          </div>
        </header>

        <main className="dashboard-content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
