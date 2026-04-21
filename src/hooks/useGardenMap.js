import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../lib/supabase.js'

// Only cells are stored — grid dimensions are always computed from viewport
const DEFAULT_CELLS = {}

export function useGardenMap(userId) {
  const [cells, setCells]   = useState(DEFAULT_CELLS)
  const [saving, setSaving] = useState('idle')
  const cellsRef            = useRef(cells)
  const debounceRef         = useRef(null)

  useEffect(() => { cellsRef.current = cells }, [cells])

  useEffect(() => {
    if (!userId) return
    supabase
      .from('profiles')
      .select('garden_map')
      .eq('id', userId)
      .single()
      .then(({ data }) => {
        if (data?.garden_map?.cells) setCells(data.garden_map.cells)
      })
  }, [userId])

  useEffect(() => () => clearTimeout(debounceRef.current), [])

  const scheduleSave = useCallback(() => {
    clearTimeout(debounceRef.current)
    setSaving('saving')
    debounceRef.current = setTimeout(async () => {
      await supabase
        .from('profiles')
        .upsert({ id: userId, garden_map: { cells: cellsRef.current } })
      setSaving('idle')
    }, 500)
  }, [userId])

  const paintCells = useCallback((cellKeys, mode, plantId) => {
    setCells(prev => {
      const next = { ...prev }
      for (const key of cellKeys) {
        if (mode === 'area')  next[key] = next[key] ?? {}
        if (mode === 'plant') next[key] = { plantId }
        if (mode === 'erase') delete next[key]
      }
      return next
    })
    scheduleSave()
  }, [scheduleSave])

  return { cells, saving, paintCells }
}
