import { useState, useMemo, useEffect, useCallback, memo } from 'react'
import { Plus, ClipboardList } from 'lucide-react'
import { useAuth } from './hooks/useAuth.js'
import { useProfile } from './hooks/useProfile.js'
import { usePlants } from './hooks/usePlants.js'
import { useActivityLogs } from './hooks/useActivityLogs.js'
import { useGardenMap } from './hooks/useGardenMap.js'
import { useNotifications } from './hooks/useNotifications.js'
import LandingPage from './components/Landing/LandingPage.jsx'
import Navbar from './components/Layout/Navbar.jsx'
import BottomNav from './components/Layout/BottomNav.jsx'
import PlantGrid from './components/Garden/PlantGrid.jsx'
import PlantDetailModal from './components/Garden/PlantDetailModal.jsx'
import AddPlantModal from './components/Garden/AddPlantModal.jsx'
import AddToInventoryModal from './components/Garden/AddToInventoryModal.jsx'
import ActivityFeed from './components/Activity/ActivityFeed.jsx'
import LogActionModal from './components/Activity/LogActionModal.jsx'
import GardenMap from './components/Map/GardenMap.jsx'
import DiscoverView from './components/Discover/DiscoverView.jsx'
import ConfirmDelete from './components/Shared/ConfirmDelete.jsx'
import NotificationPanel from './components/Layout/NotificationPanel.jsx'
import CareToast from './components/Shared/CareToast.jsx'
import './App.css'

function App() {
  const { user, loading, login, logout, signup, loginWithGoogle } = useAuth()
  const { profile, saveProfile } = useProfile(user?.id)
  const { logs, latestLogsMap, addLog }  = useActivityLogs(user?.id)
  const {
    plants, healthMap, filtered, saving,
    searchQuery, setSearchQuery,
    categoryFilter, setCategoryFilter,
    addPlant, editPlant, removePlant,
  } = usePlants(user?.id, latestLogsMap)
  const todayISO = () => new Date().toISOString().slice(0, 10)

  const { cells: gardenCells, saving: mapSaving, paintCells, clearCells, moveCells } = useGardenMap(user?.id)
  const { hasOverdue, overdueItems, permission, enableNotifications } = useNotifications(user?.id, healthMap, plants)

  const [view, setView]                 = useState('map')
  const [selected, setSelected]         = useState(null)
  const [adding, setAdding]             = useState(false)
  const [addingFromDiscover, setAddingFromDiscover] = useState(null)
  const [pendingPlant, setPendingPlant] = useState(null)
  const [logTarget, setLogTarget]       = useState(null)
  const [logPresetActivity, setLogPresetActivity] = useState(null)
  const [showLog, setShowLog]           = useState(false)
  const [deleting, setDeleting]         = useState(null)
  const [showNotifications, setShowNotifications] = useState(false)
  const [seenOverdueCount, setSeenOverdueCount] = useState(() => {
    const v = Number(localStorage.getItem('garden-seen-overdue-count'))
    return Number.isFinite(v) ? v : 0
  })
  const [showToast, setShowToast]               = useState(false)

  const unseenOverdueCount = Math.max(overdueItems.length - seenOverdueCount, 0)

  const handleBellClick = () => {
    setShowNotifications(v => {
      const next = !v
      if (next) {
        setSeenOverdueCount(overdueItems.length)
        localStorage.setItem('garden-seen-overdue-count', String(overdueItems.length))
      }
      return next
    })
  }

  useEffect(() => {
    if (overdueItems.length < seenOverdueCount) {
      setSeenOverdueCount(overdueItems.length)
      localStorage.setItem('garden-seen-overdue-count', String(overdueItems.length))
    }
  }, [overdueItems.length, seenOverdueCount])

  useEffect(() => {
    if (overdueItems.length > 0) setShowToast(true)
  }, [overdueItems.length])

  const plantsMap = useMemo(() => new Map(plants.map(p => [p.id, p])), [plants])

  const handleAddFromDiscover = useCallback((prefill) => {
    setAddingFromDiscover(prefill)
    setAdding(true)
  }, [])

  const handlePlantIt = useCallback((plant) => {
    setSelected(null)
    setView('map')
    setPendingPlant(plant)
  }, [])

  const handlePendingPlantConsumed = useCallback(() => setPendingPlant(null), [])

  const wrappedPaintCells = useCallback((keys, tool, plantId) => {
    paintCells(keys, tool, plantId)
    if (tool === 'plant' && plantId) {
      const plant = plants.find(p => p.id === plantId)
      if (plant && !plant.is_planted) {
        editPlant({ ...plant, is_planted: true, date_planted: todayISO() })
      }
    } else if (tool === 'erase') {
      const erasedSet = new Set(keys)
      const remainingPlantIds = new Set()
      for (const [k, v] of Object.entries(gardenCells)) {
        if (!erasedSet.has(k) && v?.plantId) remainingPlantIds.add(v.plantId)
      }
      const orphanedPlantIds = new Set()
      for (const k of erasedSet) {
        const pid = gardenCells[k]?.plantId
        if (pid && !remainingPlantIds.has(pid)) orphanedPlantIds.add(pid)
      }
      for (const pid of orphanedPlantIds) {
        const plant = plants.find(p => p.id === pid)
        if (plant?.is_planted) editPlant({ ...plant, is_planted: false, date_planted: null })
      }
    }
  }, [paintCells, plants, editPlant, gardenCells])

  const wrappedClearCells = useCallback(() => {
    clearCells()
    const plantedIds = new Set()
    for (const v of Object.values(gardenCells)) {
      if (v?.plantId) plantedIds.add(v.plantId)
    }
    for (const pid of plantedIds) {
      const plant = plants.find(p => p.id === pid)
      if (plant?.is_planted) editPlant({ ...plant, is_planted: false, date_planted: null })
    }
  }, [clearCells, plants, editPlant, gardenCells])

  if (loading) return null
  if (!user) {
    return <LandingPage onLogin={login} onSignup={signup} onGoogleLogin={loginWithGoogle} />
  }

  const handleSavePlant = async (plant) => {
    await addPlant({ ...plant, is_planted: true })
    setAdding(false)
  }

  const handleSaveInventory = async (plant) => {
    await addPlant({ ...plant, is_planted: false, date_planted: null })
    setAdding(false)
    setAddingFromDiscover(null)
  }

  const handleSaveLog = async (entries) => {
    for (const entry of entries) {
      await addLog({ ...entry, user_id: user.id })
    }
    setShowLog(false)
    setLogTarget(null)
    setLogPresetActivity(null)
  }

  const handleDelete = async (plant) => {
    const cellKeys = Object.entries(gardenCells)
      .filter(([, c]) => c?.plantId === plant.id)
      .map(([k]) => k)
    if (cellKeys.length > 0) paintCells(cellKeys, 'erase')
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
        overdueCount={unseenOverdueCount}
        onBellClick={handleBellClick}
        onLogout={logout}
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
            paintCells={wrappedPaintCells}
            clearCells={wrappedClearCells}
            moveCells={moveCells}
            saving={mapSaving}
            plants={plants}
            healthMap={healthMap}
            logsMap={logsMap}
            onSelectPlant={setSelected}
            onLogActivity={(p, type) => { setLogTarget(p.id); setLogPresetActivity(type); setShowLog(true) }}
            pendingPlant={pendingPlant}
            onPendingPlantConsumed={handlePendingPlantConsumed}
          />
        )}

        {view === 'discover' && (
          <DiscoverView
            ownedPlants={plants}
            profile={profile}
            saveProfile={saveProfile}
            onAddPlant={handleAddFromDiscover}
          />
        )}
      </main>

      {/* FAB — add plant (garden view) or log activity (activity view) */}
      {view === 'inventory' && (
        <button className="fab-add" aria-label="Add plant" onClick={() => setAdding(true)}>
          <Plus size={22} strokeWidth={2.5} />
        </button>
      )}

      {(view === 'activity' || view === 'map') && (
        <button className={`fab-add${view === 'map' ? ' fab-add--left' : ''}`} aria-label="Log activity" onClick={() => setShowLog(true)}>
          <ClipboardList size={20} strokeWidth={2} />
        </button>
      )}

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
          onPlantIt={handlePlantIt}
        />
      )}

      {adding && addingFromDiscover && (
        <AddToInventoryModal
          prefill={addingFromDiscover}
          onSave={handleSaveInventory}
          onClose={() => { setAdding(false); setAddingFromDiscover(null) }}
        />
      )}

      {adding && !addingFromDiscover && (
        <AddPlantModal
          prefill={null}
          onSave={handleSavePlant}
          onClose={() => setAdding(false)}
        />
      )}

      {showLog && plants.length > 0 && (
        <LogActionModal
          plants={plants}
          preselectedPlantId={logTarget}
          preselectedActivity={logPresetActivity}
          onSave={handleSaveLog}
          onClose={() => { setShowLog(false); setLogTarget(null); setLogPresetActivity(null) }}
        />
      )}

      <ConfirmDelete item={deleting} onConfirm={handleDelete} onCancel={() => setDeleting(null)} />

      {showToast && (
        <CareToast
          overdueItems={overdueItems}
          onDismiss={() => setShowToast(false)}
        />
      )}

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
