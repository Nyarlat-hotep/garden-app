import { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { MousePointer2, Sprout, Eraser, Droplets, Scissors, Leaf, FlaskConical, Wheat, ChevronDown, Trash2, Hand } from 'lucide-react'
import { FOOD_PLANTS } from '../../data/foodPlants.js'
import { dueIn, formatDueIn } from '../../utils/careTime.js'
import Emoji from '../Shared/Emoji.jsx'
import './GardenMap.css'

// ── Color helpers ────────────────────────────────────────────────────────────

const PLANT_COLORS = {
  // Reds
  'tomato': '#a03535', 'cherry tomato': '#a03535', 'roma tomato': '#a03535',
  'strawberry': '#a03050', 'raspberry': '#963060', 'watermelon': '#a83545',
  'bell pepper': '#a04030', 'hot pepper': '#b04025', 'chili pepper': '#b04025',
  'radish': '#903548',
  // Oranges
  'carrot': '#b06025', 'pumpkin': '#a85a18', 'butternut squash': '#a06820',
  'sweet potato': '#9a5828', 'acorn squash': '#8a6030',
  // Yellows
  'corn': '#a88a20', 'summer squash': '#9a8020', 'yellow squash': '#9a8020',
  'lemon': '#a08818', 'banana pepper': '#a08030',
  // Deep greens
  'cucumber': '#3d7535', 'zucchini': '#3a6c30', 'broccoli': '#3a6830',
  'kale': '#2e5e30', 'spinach': '#306030', 'chard': '#386835',
  'arugula': '#4a6c38', 'collard greens': '#2e5e30',
  // Medium greens
  'lettuce': '#5a8040', 'pea': '#4a7838', 'green bean': '#4a7035',
  'edamame': '#4a7838', 'brussels sprouts': '#3a6830',
  // Herbs (grey-greens)
  'basil': '#3d6835', 'mint': '#458840', 'cilantro': '#4a7038',
  'parsley': '#4a7035', 'rosemary': '#3d5e40', 'thyme': '#3d5838',
  'oregano': '#4a5838', 'chive': '#4a7538', 'dill': '#4a7038',
  'sage': '#5a6e48', 'lavender': '#6a5888',
  // Blues / purples
  'blueberry': '#404888', 'eggplant': '#602878', 'purple basil': '#622870',
  'blackberry': '#503868',
  // Browns / neutrals
  'potato': '#7a5e30', 'sweet potato': '#8a5025', 'garlic': '#8a7850',
  'onion': '#8a7040', 'shallot': '#8a6848', 'ginger': '#8a6030',
  'beet': '#7a2845', 'turnip': '#7a3848',
}

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

function plantColorFor(plantId, plantName) {
  if (plantName) {
    const lc = plantName.toLowerCase()
    if (PLANT_COLORS[lc]) return PLANT_COLORS[lc]
  }
  return PLANT_PALETTE[hashPlantId(plantId) % PLANT_PALETTE.length]
}

function emojiForPlant(plant) {
  const match = FOOD_PLANTS.find(fp => fp.common_name.toLowerCase() === plant.name.toLowerCase())
  return match?.emoji ?? '🌱'
}

const OVERDUE_ICONS = {
  watered:    { Icon: Droplets,    color: '#5b9bd5' },
  pruned:     { Icon: Scissors,    color: '#7fb069' },
  fertilized: { Icon: FlaskConical, color: '#8b5e3c' },
  harvested:  { Icon: Wheat,       color: '#d4a843' },
}

// ── Crop panel item ───────────────────────────────────────────────────────────

function CropItem({ plant, health, onSelect }) {
  const status      = health?.status ?? 'healthy'
  const overdueTypes = health?.overdueTypes ?? []

  return (
    <button className="crop-item" onClick={() => onSelect(plant)}>
      <span className="crop-item-emoji"><Emoji>{emojiForPlant(plant)}</Emoji></span>
      <div className="crop-item-body">
        <span className="crop-item-name">{plant.name}</span>
        {overdueTypes.length > 0 && (
          <span className="crop-item-overdue">
            {overdueTypes.map(t => {
              const cfg = OVERDUE_ICONS[t]
              if (!cfg) return null
              const { Icon, color } = cfg
              return <Icon key={t} size={11} strokeWidth={2} style={{ color }} />
            })}
            overdue
          </span>
        )}
      </div>
      <span className={`crop-status-dot crop-status-dot--${status}`} />
    </button>
  )
}

// ── Panel content (shared by desktop panel + mobile sheet) ───────────────────

function CropList({ plants, healthMap, onSelect }) {
  const critical  = plants.filter(p => healthMap?.get(p.id)?.status === 'critical').length
  const attention = plants.filter(p => healthMap?.get(p.id)?.status === 'attention').length
  const overdue   = plants.filter(p => (healthMap?.get(p.id)?.overdueTypes ?? []).length > 0).length

  return (
    <>
      {(critical > 0 || attention > 0) && (
        <div className="crop-panel-stats">
          {critical  > 0 && <span className="crop-stat crop-stat--critical">{critical} critical</span>}
          {attention > 0 && <span className="crop-stat crop-stat--attention">{attention} attention</span>}
          {overdue   > 0 && <span className="crop-stat crop-stat--overdue">{overdue} overdue</span>}
        </div>
      )}

      <div className="crop-list">
        {plants.length === 0
          ? <p className="crop-list-empty">No crops yet.<br/>Add plants in the Garden tab.</p>
          : plants.map(p => (
              <CropItem key={p.id} plant={p} health={healthMap?.get(p.id)} onSelect={onSelect} />
            ))
        }
      </div>
    </>
  )
}

function floodFill(cells, startKey, plantId, cols, rows) {
  const visited = new Set()
  const queue = [startKey]
  visited.add(startKey)
  while (queue.length) {
    const key = queue.shift()
    const [x, y] = key.split(',').map(Number)
    for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]]) {
      const nx = x + dx, ny = y + dy
      if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) continue
      const nk = `${nx},${ny}`
      if (!visited.has(nk) && cells[nk]?.plantId === plantId) {
        visited.add(nk)
        queue.push(nk)
      }
    }
  }
  return visited
}

// ── Main component ────────────────────────────────────────────────────────────

const CELL_SIZE        = 28
const CELL_SIZE_MOBILE = 22
const CANVAS_MIN_COLS  = 80
const CANVAS_MIN_ROWS  = 55

export default function GardenMap({ cells = {}, paintCells, clearCells, moveCells, plants, saving, healthMap, logsMap, onSelectPlant }) {
  const [tool, setTool]                       = useState(() => window.innerWidth <= 480 ? 'pan' : 'select')
  const [selectedPlantId, setSelectedPlantId] = useState(null)
  const [popover, setPopover]                 = useState(null)
  const [dims, setDims]                       = useState({ cols: CANVAS_MIN_COLS, rows: CANVAS_MIN_ROWS, isMobile: false })
  const [sheetOpen, setSheetOpen]             = useState(false)
  const [plantPickerOpen, setPlantPickerOpen] = useState(false)
  const [plantBtnRect, setPlantBtnRect]       = useState(null)
  const [selection, setSelection]             = useState(null)   // Set<string> | null
  const [rubberRect, setRubberRect]           = useState(null)   // {x1,y1,x2,y2} | null
  const [moveOffset, setMoveOffset]           = useState(null)   // {dx,dy} | null
  const isDrawingRef                          = useRef(false)
  const pendingCellsRef                       = useRef(new Set())
  const gridWrapperRef                        = useRef(null)
  const hoveredGroupRef                       = useRef(null)
  const plantBtnWrapRef                       = useRef(null)
  const plantDropdownRef                      = useRef(null)
  const selectPhaseRef                        = useRef('idle')   // 'idle'|'rubber'|'moving'
  const rubberStartRef                        = useRef(null)
  const rubberRectRef                         = useRef(null)
  const moveStartRef                          = useRef(null)
  const moveOffsetRef                         = useRef(null)
  const selectionRef                          = useRef(null)
  const didCenterRef                          = useRef(false)


  useEffect(() => {
    const el = gridWrapperRef.current
    if (!el) return
    const compute = () => {
      const isMobile = el.clientWidth <= 480
      const cellPx   = isMobile ? CELL_SIZE_MOBILE : CELL_SIZE
      const vpCols   = Math.max(Math.floor(el.clientWidth  / cellPx), 1)
      const vpRows   = Math.max(Math.floor(el.clientHeight / cellPx), 1)
      setDims({
        cols:     isMobile ? Math.max(vpCols, CANVAS_MIN_COLS) : vpCols,
        rows:     isMobile ? Math.max(vpRows, CANVAS_MIN_ROWS) : vpRows,
        isMobile,
      })
    }
    compute()
    const ro = new ResizeObserver(compute)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // On mobile, scroll grid to center the painted crop area on first load
  useEffect(() => {
    if (!dims.isMobile || didCenterRef.current) return
    const keys = Object.keys(cells)
    if (!keys.length) return
    didCenterRef.current = true
    const xs = keys.map(k => Number(k.split(',')[0]))
    const ys = keys.map(k => Number(k.split(',')[1]))
    const cx = (Math.min(...xs) + Math.max(...xs)) / 2
    const cy = (Math.min(...ys) + Math.max(...ys)) / 2
    const el = gridWrapperRef.current
    if (!el) return
    requestAnimationFrame(() => {
      el.scrollLeft = cx * CELL_SIZE_MOBILE - el.clientWidth  / 2
      el.scrollTop  = cy * CELL_SIZE_MOBILE - el.clientHeight / 2
    })
  }, [dims.isMobile, cells])

  useEffect(() => { selectionRef.current = selection }, [selection])

  useEffect(() => {
    if (!plantPickerOpen) return
    const close = (e) => {
      if (!plantBtnWrapRef.current?.contains(e.target) && !plantDropdownRef.current?.contains(e.target)) setPlantPickerOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [plantPickerOpen])

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') { setSelection(null); setMoveOffset(null); selectPhaseRef.current = 'idle' }
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectionRef.current?.size) {
        paintCells([...selectionRef.current], 'erase')
        setSelection(null)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [paintCells])

  const previewMap = useMemo(() => {
    if (!moveOffset || !selection) return null
    const map = new Map()
    for (const key of selection) {
      const [kx, ky] = key.split(',').map(Number)
      const nx = kx + moveOffset.dx, ny = ky + moveOffset.dy
      if (nx >= 0 && ny >= 0 && nx < dims.cols && ny < dims.rows) map.set(`${nx},${ny}`, cells[key])
    }
    return map
  }, [moveOffset, selection, cells, dims])

  const paint = useCallback((key) => {
    if (tool === 'plant' && !selectedPlantId) return
    if (pendingCellsRef.current.has(key)) return
    pendingCellsRef.current.add(key)
    paintCells([key], tool, tool === 'plant' ? selectedPlantId : undefined)
  }, [paintCells, tool, selectedPlantId])

  const stopInteraction = useCallback(() => {
    if (tool === 'select' || tool === 'erase') {
      if (selectPhaseRef.current === 'rubber' && rubberRectRef.current) {
        const { x1, y1, x2, y2 } = rubberRectRef.current
        const isSingleClick = x1 === x2 && y1 === y2
        if (tool === 'erase' && isSingleClick) {
          // Single click in erase mode → erase immediately
          const k = `${x1},${y1}`
          if (cells[k] !== undefined) paintCells([k], 'erase')
        } else {
          const keys = new Set()
          for (let cy = y1; cy <= y2; cy++)
            for (let cx = x1; cx <= x2; cx++) {
              const k = `${cx},${cy}`
              if (cells[k] !== undefined) keys.add(k)
            }
          setSelection(keys.size > 0 ? keys : null)
        }
        setRubberRect(null); rubberRectRef.current = null
      } else if (selectPhaseRef.current === 'moving' && moveOffsetRef.current && selectionRef.current) {
        const { dx, dy } = moveOffsetRef.current
        moveCells([...selectionRef.current], dx, dy, dims.cols, dims.rows)
        const newKeys = new Set()
        for (const key of selectionRef.current) {
          const [kx, ky] = key.split(',').map(Number)
          const nx = kx + dx, ny = ky + dy
          if (nx >= 0 && ny >= 0 && nx < dims.cols && ny < dims.rows) newKeys.add(`${nx},${ny}`)
        }
        setSelection(newKeys.size > 0 ? newKeys : null)
        setMoveOffset(null); moveOffsetRef.current = null
      }
      selectPhaseRef.current = 'idle'
    } else {
      isDrawingRef.current = false
      pendingCellsRef.current.clear()
    }
  }, [tool, cells, dims, moveCells, paintCells])

  const handleSelectPlant = useCallback((plant) => {
    setSheetOpen(false)
    onSelectPlant?.(plant)
  }, [onSelectPlant])

  const hasCells = Object.keys(cells).length > 0

  return (
    <div className="garden-map-view">

      {/* Toolbar */}
      <div className="map-toolbar">
        <div className="map-tool-btns">
          <button className={`map-tool-btn map-tool-btn--pan ${tool === 'pan' ? 'active' : ''}`} onClick={() => setTool('pan')} title="Pan"><Hand size={15} /><span>Pan</span></button>
          <button className={`map-tool-btn ${tool === 'select' ? 'active' : ''}`} onClick={() => setTool('select')} title="Select and move"><MousePointer2 size={15} /><span>Select</span></button>
          <div className="plant-btn-wrap" ref={plantBtnWrapRef}>
            <button
              className={`map-tool-btn ${tool === 'plant' ? 'active' : ''}`}
              disabled={plants.length === 0}
              onClick={() => { setTool('plant'); const r = plantBtnWrapRef.current?.getBoundingClientRect(); setPlantBtnRect(r ?? null); setPlantPickerOpen(v => !v) }}
            >
              {selectedPlantId && plants.find(p => p.id === selectedPlantId)
                ? <><Emoji>{emojiForPlant(plants.find(p => p.id === selectedPlantId))}</Emoji><span>{plants.find(p => p.id === selectedPlantId).name}</span></>
                : <><Sprout size={15} /><span>Plant</span></>
              }
              <ChevronDown size={11} className={plantPickerOpen ? 'rotated' : ''} />
            </button>
            {plantPickerOpen && plants.length > 0 && plantBtnRect && createPortal(
              <div ref={plantDropdownRef} className="plant-picker-dropdown" style={{ position: 'fixed', top: plantBtnRect.bottom + 6, left: plantBtnRect.left, zIndex: 9999 }}>
                {plants.map(p => (
                  <button key={p.id}
                    className={`plant-picker-item ${selectedPlantId === p.id ? 'active' : ''}`}
                    style={{ '--pc': plantColorFor(p.id, p.name) }}
                    onClick={() => { setSelectedPlantId(p.id); setPlantPickerOpen(false) }}
                  >
                    <Emoji>{emojiForPlant(p)}</Emoji>
                    <span>{p.name}</span>
                  </button>
                ))}
              </div>,
              document.body
            )}
          </div>
          <button className={`map-tool-btn ${tool === 'erase' ? 'active' : ''}`} onClick={() => setTool('erase')} title="Erase cells"><Eraser size={15} /><span>Erase</span></button>
          {hasCells && (
            <button className="map-tool-btn map-tool-btn--clear" onClick={clearCells} title="Clear all"><Trash2 size={13} /><span>Clear</span></button>
          )}
        </div>
        {saving === 'saving' && <span className="map-saving-dot">saving…</span>}
        {!hasCells && <span className="map-grid-hint">Select a plant and click to paint</span>}
      </div>

      {/* Body: grid + right panel */}
      <div className="map-body">

        {/* Grid */}
        <div ref={gridWrapperRef}
          className={`grid-wrapper${tool === 'erase' ? ' erase-mode' : ''}${tool === 'select' ? ' select-mode' : ''}${tool === 'pan' ? ' pan-mode' : ''}`}
          onPointerUp={stopInteraction} onPointerLeave={stopInteraction}
          onMouseLeave={() => { hoveredGroupRef.current = null; setPopover(null) }}
        >
          <div className="garden-grid" style={{
            gridTemplateColumns: dims.isMobile ? `repeat(${dims.cols}, ${CELL_SIZE_MOBILE}px)` : `repeat(${dims.cols}, 1fr)`,
            gridTemplateRows:    dims.isMobile ? `repeat(${dims.rows}, ${CELL_SIZE_MOBILE}px)` : `repeat(${dims.rows}, 1fr)`,
          }}>
            {Array.from({ length: dims.cols * dims.rows }, (_, i) => {
              const x = i % dims.cols
              const y = Math.floor(i / dims.cols)
              const key = `${x},${y}`
              const cell = cells[key]
              const plantId = cell?.plantId
              const plantName = plantId ? plants.find(p => p.id === plantId)?.name : undefined
              const baseColor = plantId ? plantColorFor(plantId, plantName) : null
              const overdueTypes = plantId ? (healthMap?.get(plantId)?.overdueTypes ?? []) : []
              const needsWater = overdueTypes.includes('watered')
              const needsFertilize = overdueTypes.includes('fertilized')

              const isSelected   = (tool === 'select' || tool === 'erase') && !!selection?.has(key)
              const isMovingSrc  = isSelected && !!moveOffset
              const previewCell  = moveOffset ? previewMap?.get(key) : null
              const inRubber     = rubberRect && x >= rubberRect.x1 && x <= rubberRect.x2 && y >= rubberRect.y1 && y <= rubberRect.y2

              let bg
              if (previewCell) {
                const pn = previewCell.plantId ? plants.find(p => p.id === previewCell.plantId)?.name : undefined
                bg = previewCell.plantId ? plantColorFor(previewCell.plantId, pn) + 'cc' : 'rgba(127,176,105,0.4)'
              } else if (isMovingSrc) {
                bg = baseColor ? baseColor + '33' : undefined
              } else if (baseColor) {
                bg = baseColor + 'cc'
              }

              let cls = 'grid-cell'
              if (cell !== undefined && !isMovingSrc) cls += ' is-garden'
              if (isSelected && !moveOffset) cls += ' is-selected'
              if (inRubber) cls += ' in-rubber'
              if (plantId && needsWater && !needsFertilize)    cls += ' overdue-water'
              if (plantId && needsFertilize && !needsWater)    cls += ' overdue-fertilize'
              if (plantId && needsWater && needsFertilize)     cls += ' overdue-both'

              return (
                <div key={key} className={cls}
                  style={bg ? { backgroundColor: bg } : undefined}
                  onPointerDown={(e) => {
                    if (tool === 'pan') return
                    e.preventDefault()
                    if (tool === 'select' || tool === 'erase') {
                      if (tool === 'select' && selectionRef.current?.has(key)) {
                        selectPhaseRef.current = 'moving'
                        moveStartRef.current = { x, y }
                        moveOffsetRef.current = { dx: 0, dy: 0 }
                      } else {
                        selectPhaseRef.current = 'rubber'
                        rubberStartRef.current = { x, y }
                        const r = { x1: x, y1: y, x2: x, y2: y }
                        rubberRectRef.current = r; setRubberRect(r)
                        setSelection(null); selectionRef.current = null; setMoveOffset(null)
                      }
                    } else {
                      isDrawingRef.current = true; pendingCellsRef.current.clear(); paint(key)
                    }
                  }}
                  onPointerEnter={() => {
                    if (tool === 'pan') return
                    if (tool === 'select' || tool === 'erase') {
                      if (selectPhaseRef.current === 'rubber' && rubberStartRef.current) {
                        const r = { x1: Math.min(rubberStartRef.current.x, x), y1: Math.min(rubberStartRef.current.y, y), x2: Math.max(rubberStartRef.current.x, x), y2: Math.max(rubberStartRef.current.y, y) }
                        rubberRectRef.current = r; setRubberRect(r)
                      } else if (selectPhaseRef.current === 'moving' && moveStartRef.current) {
                        const o = { dx: x - moveStartRef.current.x, dy: y - moveStartRef.current.y }
                        moveOffsetRef.current = o; setMoveOffset(o)
                      }
                    } else {
                      if (!isDrawingRef.current) return; paint(key)
                    }
                  }}
                  onMouseEnter={(e) => {
                    if (isDrawingRef.current || selectPhaseRef.current !== 'idle') return
                    if (!plantId) {
                      if (hoveredGroupRef.current) { hoveredGroupRef.current = null; setPopover(null) }
                      return
                    }
                    if (hoveredGroupRef.current?.has(key)) return
                    const group = floodFill(cells, key, plantId, dims.cols, dims.rows)
                    hoveredGroupRef.current = group
                    const plant = plants.find(p => p.id === plantId)
                    const rect = e.currentTarget.getBoundingClientRect()
                    const below = rect.top < 180
                    setPopover({ x: rect.left + rect.width / 2, y: below ? rect.bottom + 8 : rect.top - 8, below, plant: plant ?? null, orphaned: !plant, sqFt: group.size })
                  }}
                />
              )
            })}
          </div>

          {popover && (
            <div className={`plant-popover${popover.below ? ' plant-popover--below' : ''}`} style={{ left: popover.x, top: popover.y }}>
              {popover.orphaned ? <div className="popover-orphan">Removed plant</div> : (
                <>
                  <div className="popover-header">
                    <span className="popover-emoji"><Emoji>{emojiForPlant(popover.plant)}</Emoji></span>
                    <div>
                      <div className="popover-name">{popover.plant.name}</div>
                      {popover.plant.variety && <div className="popover-variety">{popover.plant.variety}</div>}
                      <div className="popover-sqft">{popover.sqFt} sq ft</div>
                    </div>
                  </div>
                  <div className="popover-care">
                    {popover.plant.water_interval_days && (() => {
                      const r = dueIn(popover.plant, logsMap?.get(popover.plant.id), 'water_interval_days', 'watered')
                      return <span className={`care-timer care-timer--${r?.state ?? 'upcoming'}`}><Droplets size={13} /><b>Water</b> <span className="val-mono">{formatDueIn(r)}</span></span>
                    })()}
                    {popover.plant.fertilize_interval_days && (() => {
                      const r = dueIn(popover.plant, logsMap?.get(popover.plant.id), 'fertilize_interval_days', 'fertilized')
                      return <span className={`care-timer care-timer--${r?.state ?? 'upcoming'}`}><FlaskConical size={13} /><b>Fertilize</b> <span className="val-mono">{formatDueIn(r)}</span></span>
                    })()}
                    {popover.plant.prune_interval_days && (() => {
                      const r = dueIn(popover.plant, logsMap?.get(popover.plant.id), 'prune_interval_days', 'pruned')
                      return <span className={`care-timer care-timer--${r?.state ?? 'upcoming'}`}><Scissors size={13} /><b>Prune</b> <span className="val-mono">{formatDueIn(r)}</span></span>
                    })()}
                    {popover.plant.days_to_harvest         && <span><Wheat size={13} /><b>Harvest</b> in {popover.plant.days_to_harvest}d</span>}
                  </div>
                </>
              )}
            </div>
          )}

        </div>

        {/* Desktop right panel */}
        <div className="crop-panel">
          <CropList plants={plants} healthMap={healthMap} onSelect={handleSelectPlant} />
        </div>

      </div>

      {/* Mobile FAB */}
      <button className="crop-panel-fab" onClick={() => setSheetOpen(true)} aria-label="View crops">
        <Leaf size={20} strokeWidth={2} />
      </button>

      {/* Mobile bottom sheet */}
      <AnimatePresence>
        {sheetOpen && (
          <>
            <motion.div className="crop-sheet-backdrop"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSheetOpen(false)}
            />
            <motion.div className="crop-sheet"
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 32, stiffness: 320 }}
            >
              <div className="crop-sheet-handle" />
              <CropList plants={plants} healthMap={healthMap} onSelect={handleSelectPlant} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  )
}
