import { Sprout, Map, Compass, ClipboardList } from 'lucide-react'
import './BottomNav.css'

const TABS = [
  { id: 'garden',   label: 'Garden',   Icon: Sprout },
  { id: 'map',      label: 'Map',      Icon: Map },
  { id: 'discover', label: 'Discover', Icon: Compass },
  { id: 'activity', label: 'Activity', Icon: ClipboardList },
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
