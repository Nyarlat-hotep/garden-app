import { Search, Bell } from 'lucide-react'
import './Navbar.css'

export default function Navbar({ searchQuery, onSearch, view, hasOverdue }) {
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
        <button className="navbar-bell" aria-label="Notifications">
          <Bell size={17} strokeWidth={1.8} />
          {hasOverdue && <span className="navbar-bell-dot" />}
        </button>
      </div>
    </nav>
  )
}
