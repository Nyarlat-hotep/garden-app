import { Sprout, Archive, Compass, ClipboardList } from 'lucide-react'
import './BottomNav.css'

const TABS = [
  { id: 'map',       label: 'Garden',    Icon: Sprout },
  { id: 'inventory', label: 'Inventory', Icon: Archive },
  { id: 'discover',  label: 'Discover',  Icon: Compass },
  { id: 'activity',  label: 'Activity',  Icon: ClipboardList },
]

export default function BottomNav({ view, onViewChange }) {
  return (
    <nav className="bottom-nav">
      {TABS.map(({ id, label, Icon }) => (
        <button
          key={id}
          className={`bottom-nav-tab ${view === id ? 'active' : ''}`}
          onClick={() => onViewChange(id)}
        >
          <Icon size={20} strokeWidth={1.8} />
          <span>{label}</span>
        </button>
      ))}
    </nav>
  )
}
