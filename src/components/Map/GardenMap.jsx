import { useState, useRef, useCallback, useEffect } from 'react'
import { Paintbrush, Sprout, Eraser, Droplets, Scissors } from 'lucide-react'
import { FOOD_PLANTS } from '../../data/foodPlants.js'
import './GardenMap.css'

// ── Color helpers ────────────────────────────────────────────────────────────

const PLANT_PALETTE = [
  '#5b9bd5','#e07b39','#c47ec2','#d4a843','#5bbfb5',
  '#e06b6b','#9ec4a0','#8b5e3c','#7eb8d4','#b5a05b',
  '#d4709a','#6b8fd4',
]

function hashPlantId(id) {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0
  return h
}

function plantColorFor(plantId) {
  return PLANT_PALETTE[hashPlantId(plantId) % PLANT_PALETTE.length]
}

function emojiForPlant(plant) {
  const match = FOOD_PLANTS.find(fp => fp.common_name.toLowerCase() === plant.name.toLowerCase())
  return match?.emoji ?? '🌱'
}

// ── Component ────────────────────────────────────────────────────────────────

export default function GardenMap({ gardenData, paintCells, plants, saving }) {
  const { gridWidth = 20, gridHeight = 15, cells = {} } = gardenData ?? {}

  const [tool, setTool]                       = useState('area')
  const [selectedPlantId, setSelectedPlantId] = useState(null)
  const [popover, setPopover]                 = useState(null)
  const isDrawingRef                          = useRef(false)
  const pendingCellsRef                       = useRef(new Set())
  const gridWrapperRef                        = useRef(null)

  // Auto-select first plant when switching to plant mode
  useEffect(() => {
    if (tool === 'plant' && !selectedPlantId && plants.length > 0) {
      setSelectedPlantId(plants[0].id)
    }
  }, [tool, plants, selectedPlantId])

  const paint = useCallback((key) => {
    if (pendingCellsRef.current.has(key)) return
    pendingCellsRef.current.add(key)
    paintCells([key], tool, tool === 'plant' ? selectedPlantId : undefined)
  }, [paintCells, tool, selectedPlantId])

  const stopDrawing = useCallback(() => {
    isDrawingRef.current = false
    pendingCellsRef.current.clear()
  }, [])

  const hasCells = Object.keys(cells).length > 0

  return (
    <div className="garden-map-view">
      {/* Toolbar */}
      <div className="map-toolbar">
        <div className="map-tool-btns">
          <button
            className={`map-tool-btn ${tool === 'area' ? 'active' : ''}`}
            onClick={() => setTool('area')}
            title="Paint garden area"
          >
            <Paintbrush size={15} />
            <span>Area</span>
          </button>
          <button
            className={`map-tool-btn ${tool === 'plant' ? 'active' : ''}`}
            onClick={() => setTool('plant')}
            title="Paint plant"
            disabled={plants.length === 0}
          >
            <Sprout size={15} />
            <span>Plant</span>
          </button>
          <button
            className={`map-tool-btn ${tool === 'erase' ? 'active' : ''}`}
            onClick={() => setTool('erase')}
            title="Erase cells"
          >
            <Eraser size={15} />
            <span>Erase</span>
          </button>
        </div>

        {saving === 'saving' && <span className="map-saving-dot">saving…</span>}
      </div>

      {/* Plant chips — only in plant mode */}
      {tool === 'plant' && plants.length > 0 && (
        <div className="map-plant-chips">
          {plants.map(p => (
            <button
              key={p.id}
              className={`map-plant-chip ${selectedPlantId === p.id ? 'active' : ''}`}
              style={selectedPlantId === p.id ? {
                borderColor: plantColorFor(p.id),
                background: plantColorFor(p.id) + '33',
                color: plantColorFor(p.id),
              } : {}}
              onClick={() => setSelectedPlantId(p.id)}
            >
              {emojiForPlant(p)} {p.name}
            </button>
          ))}
        </div>
      )}

      {tool === 'plant' && plants.length === 0 && (
        <div className="map-hint-banner">
          🌱 Add plants in the Garden tab to paint them onto the map.
        </div>
      )}

      {/* Grid */}
      <div
        ref={gridWrapperRef}
        className={`grid-wrapper${tool === 'erase' ? ' erase-mode' : ''}`}
        onPointerUp={stopDrawing}
        onPointerLeave={stopDrawing}
      >
        <div
          className="garden-grid"
          style={{ gridTemplateColumns: `repeat(${gridWidth}, 1fr)` }}
        >
          {Array.from({ length: gridWidth * gridHeight }, (_, i) => {
            const x = i % gridWidth
            const y = Math.floor(i / gridWidth)
            const key = `${x},${y}`
            const cell = cells[key]
            const isGarden = cell !== undefined
            const plantId = cell?.plantId
            const bgColor = plantId ? plantColorFor(plantId) + 'cc' : undefined

            return (
              <div
                key={key}
                className={`grid-cell${isGarden ? ' is-garden' : ''}`}
                style={bgColor ? { backgroundColor: bgColor } : undefined}
                onPointerDown={(e) => {
                  e.preventDefault()
                  isDrawingRef.current = true
                  pendingCellsRef.current.clear()
                  paint(key)
                }}
                onPointerEnter={() => {
                  if (!isDrawingRef.current) return
                  paint(key)
                }}
                onMouseEnter={(e) => {
                  if (isDrawingRef.current || !plantId) return
                  const plant = plants.find(p => p.id === plantId)
                  const rect = e.currentTarget.getBoundingClientRect()
                  const wrapperRect = gridWrapperRef.current.getBoundingClientRect()
                  const relTop = rect.top - wrapperRect.top
                  const below = relTop < 90
                  setPopover({
                    x: rect.left - wrapperRect.left + rect.width / 2,
                    y: below ? rect.bottom - wrapperRect.top + 8 : rect.top - wrapperRect.top,
                    below,
                    plant: plant ?? null,
                    orphaned: !plant,
                  })
                }}
                onMouseLeave={() => setPopover(null)}
              />
            )
          })}
        </div>

        {popover && (
          <div
            className={`plant-popover${popover.below ? ' plant-popover--below' : ''}`}
            style={{ left: popover.x, top: popover.y }}
          >
            {popover.orphaned ? (
              <div className="popover-orphan">Removed plant</div>
            ) : (
              <>
                <div className="popover-header">
                  <span className="popover-emoji">{emojiForPlant(popover.plant)}</span>
                  <div>
                    <div className="popover-name">{popover.plant.name}</div>
                    {popover.plant.variety && (
                      <div className="popover-variety">{popover.plant.variety}</div>
                    )}
                  </div>
                </div>
                <div className="popover-care">
                  {popover.plant.water_interval_days && (
                    <span><Droplets size={11} /> Every {popover.plant.water_interval_days}d</span>
                  )}
                  {popover.plant.fertilize_interval_days && (
                    <span>🌿 Every {popover.plant.fertilize_interval_days}d</span>
                  )}
                  {popover.plant.prune_interval_days && (
                    <span><Scissors size={11} /> Every {popover.plant.prune_interval_days}d</span>
                  )}
                  {popover.plant.days_to_harvest && (
                    <span>🌾 {popover.plant.days_to_harvest}d harvest</span>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {!hasCells && (
          <div className="grid-hint-overlay">
            <Paintbrush size={22} strokeWidth={1.5} />
            <span>Click and drag to paint your garden shape</span>
          </div>
        )}
      </div>
    </div>
  )
}
