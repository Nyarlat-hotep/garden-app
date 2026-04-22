import { useState, useMemo } from 'react'
import { Plus, LogOut, ClipboardList } from 'lucide-react'
import { useAuth } from './hooks/useAuth.js'
import { useProfile } from './hooks/useProfile.js'
import { usePlants } from './hooks/usePlants.js'
import { useActivityLogs } from './hooks/useActivityLogs.js'
import { useGardenMap } from './hooks/useGardenMap.js'
import { useNotifications } from './hooks/useNotifications.js'
import LoginOverlay from './components/Auth/LoginOverlay.jsx'
import Navbar from './components/Layout/Navbar.jsx'
import BottomNav from './components/Layout/BottomNav.jsx'
import PlantGrid from './components/Garden/PlantGrid.jsx'
import PlantDetailModal from './components/Garden/PlantDetailModal.jsx'
import AddPlantModal from './components/Garden/AddPlantModal.jsx'
import ActivityFeed from './components/Activity/ActivityFeed.jsx'
import LogActionModal from './components/Activity/LogActionModal.jsx'
import GardenMap from './components/Map/GardenMap.jsx'
import DiscoverView from './components/Discover/DiscoverView.jsx'
import ConfirmDelete from './components/Shared/ConfirmDelete.jsx'
import NotificationPanel from './components/Layout/NotificationPanel.jsx'
import './App.css'

function App() {
  const { user, loading, login, logout } = useAuth()
  const { profile, saveProfile } = useProfile(user?.id)
  const { logs, latestLogsMap, addLog }  = useActivityLogs(user?.id)
  const {
    plants, healthMap, filtered, saving,
    searchQuery, setSearchQuery,
    categoryFilter, setCategoryFilter,
    addPlant, editPlant, removePlant,
  } = usePlants(user?.id, latestLogsMap)

  const { cells: gardenCells, saving: mapSaving, paintCells, clearCells, moveCells } = useGardenMap(user?.id)
  const { hasOverdue, overdueItems, permission, enableNotifications } = useNotifications(user?.id, healthMap, plants)

  const [view, setView]                 = useState('map')
  const [selected, setSelected]         = useState(null)
  const [adding, setAdding]             = useState(false)
  const [addingFromDiscover, setAddingFromDiscover] = useState(null)
  const [logTarget, setLogTarget]       = useState(null)
  const [showLog, setShowLog]           = useState(false)
  const [deleting, setDeleting]         = useState(null)
  const [showNotifications, setShowNotifications] = useState(false)

  const plantsMap = useMemo(() => new Map(plants.map(p => [p.id, p])), [plants])

  if (loading) return null
  if (!user) return <LoginOverlay onLogin={login} />

  const handleSavePlant = async (plant) => {
    await addPlant(plant)
    setAdding(false)
    setAddingFromDiscover(null)
  }

  const handleSaveLog = async (entry) => {
    await addLog({ ...entry, user_id: user.id })
    setShowLog(false)
    setLogTarget(null)
  }

  const handleDelete = async (plant) => {
    await removePlant(plant.id)
    setDeleting(null)
    setSelected(null)
  }

  const logsMap = latestLogsMap()

  return (
    <>
      <Navbar
        searchQuery={searchQuery}
        onSearch={setSearchQuery}
        view={view}
        hasOverdue={hasOverdue}
        onBellClick={() => setShowNotifications(v => !v)}
      />

      <main className="main-content">
        {view === 'inventory' && (
          <PlantGrid
            plants={filtered}
            healthMap={healthMap}
            latestLogsMap={latestLogsMap}
            onSelect={setSelected}
          />
        )}

        {view === 'activity' && (
          <ActivityFeed logs={logs} plantsMap={plantsMap} />
        )}

        {view === 'map' && (
          <GardenMap
            cells={gardenCells}
            paintCells={paintCells}
            clearCells={clearCells}
            moveCells={moveCells}
            saving={mapSaving}
            plants={plants}
            healthMap={healthMap}
            onSelectPlant={setSelected}
          />
        )}

        {view === 'discover' && (
          <DiscoverView
            onAddPlant={(prefill) => { setAddingFromDiscover(prefill); setAdding(true) }}
          />
        )}
      </main>

      {/* FAB — add plant (garden view) or log activity (activity view) */}
      {view === 'inventory' && (
        <button className="fab-add" aria-label="Add plant" onClick={() => setAdding(true)}>
          <Plus size={24} strokeWidth={2.5} />
        </button>
      )}

      {(view === 'activity' || view === 'map') && (
        <button className={`fab-add${view === 'map' ? ' fab-add--left' : ''}`} aria-label="Log activity" onClick={() => setShowLog(true)}>
          {view === 'map' ? <ClipboardList size={22} strokeWidth={2} /> : <Plus size={24} strokeWidth={2.5} />}
        </button>
      )}

      <button className="fab-logout" aria-label="Logout" onClick={logout}>
        <LogOut size={15} strokeWidth={2} />
      </button>

      <BottomNav view={view} onViewChange={setView} />

      {/* Modals */}
      {selected && (
        <PlantDetailModal
          plant={selected}
          health={healthMap?.get(selected.id)}
          plantLogs={logsMap.get(selected.id)}
          onClose={() => setSelected(null)}
          onEdit={(p) => { setSelected(null); /* TODO: edit modal */ }}
          onDelete={(p) => { setSelected(null); setDeleting(p) }}
          onLogActivity={(p) => { setSelected(null); setLogTarget(p.id); setShowLog(true) }}
        />
      )}

      {adding && (
        <AddPlantModal
          prefill={addingFromDiscover}
          onSave={handleSavePlant}
          onClose={() => { setAdding(false); setAddingFromDiscover(null) }}
        />
      )}

      {showLog && plants.length > 0 && (
        <LogActionModal
          plants={plants}
          preselectedPlantId={logTarget}
          onSave={handleSaveLog}
          onClose={() => { setShowLog(false); setLogTarget(null) }}
        />
      )}

      <ConfirmDelete item={deleting} onConfirm={handleDelete} onCancel={() => setDeleting(null)} />

      {showNotifications && (
        <NotificationPanel
          overdueItems={overdueItems}
          permission={permission}
          onEnable={enableNotifications}
          onClose={() => setShowNotifications(false)}
        />
      )}

      {saving === 'saving' && (
        <div className="saving-toast">Saving...</div>
      )}
    </>
  )
}

export default App
