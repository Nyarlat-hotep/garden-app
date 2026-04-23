import { Search, Bell, LogOut } from 'lucide-react'
import './Navbar.css'

export default function Navbar({ searchQuery, onSearch, view, hasOverdue, overdueCount, onBellClick, onLogout }) {
  const TITLES = { map: 'Garden', inventory: 'Inventory', discover: 'Discover', activity: 'Activity' }

  return (
    <nav className="navbar">
      <div className="navbar-title">{TITLES[view] ?? 'Garden'}</div>

      {view === 'inventory' && (
        <div className="navbar-search-wrap">
          <Search size={14} className="navbar-search-icon" />
          <input
            className="navbar-search"
            type="text"
            placeholder="Search plants..."
            value={searchQuery}
            onChange={e => onSearch(e.target.value)}
          />
        </div>
      )}

      <div className="navbar-right">
        <button className="navbar-bell" aria-label="Notifications" onClick={onBellClick}>
          <Bell size={17} strokeWidth={1.8} />
          {overdueCount > 0 && <span className="navbar-bell-badge">{overdueCount > 9 ? '9+' : overdueCount}</span>}
        </button>
        <button className="navbar-logout" aria-label="Log out" onClick={onLogout}>
          <LogOut size={17} strokeWidth={1.8} />
        </button>
      </div>
    </nav>
  )
}
