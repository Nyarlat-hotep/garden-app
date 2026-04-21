import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../lib/supabase.js'

const DEFAULT_GARDEN = { gridWidth: 50, gridHeight: 35, cells: {} }

export function useGardenMap(userId) {
  const [gardenData, setGardenData] = useState(DEFAULT_GARDEN)
  const [saving, setSaving]         = useState('idle')
  const gardenDataRef               = useRef(gardenData)
  const debounceRef                 = useRef(null)

  // Mirror state into ref so debounce closure reads fresh data
  useEffect(() => { gardenDataRef.current = gardenData }, [gardenData])

  useEffect(() => {
    if (!userId) return
    supabase
      .from('profiles')
      .select('garden_map')
      .eq('id', userId)
      .single()
      .then(({ data }) => {
        if (data?.garden_map) setGardenData(data.garden_map)
      })
  }, [userId])

  useEffect(() => () => clearTimeout(debounceRef.current), [])

  const scheduleSave = useCallback(() => {
    clearTimeout(debounceRef.current)
    setSaving('saving')
    debounceRef.current = setTimeout(async () => {
      await supabase
        .from('profiles')
        .upsert({ id: userId, garden_map: gardenDataRef.current })
      setSaving('idle')
    }, 500)
  }, [userId])

  const paintCells = useCallback((cellKeys, mode, plantId) => {
    setGardenData(prev => {
      const cells = { ...prev.cells }
      for (const key of cellKeys) {
        if (mode === 'area')  cells[key] = cells[key] ?? {}
        if (mode === 'plant') cells[key] = { plantId }
        if (mode === 'erase') delete cells[key]
      }
      return { ...prev, cells }
    })
    scheduleSave()
  }, [scheduleSave])

  return { gardenData, saving, paintCells }
}
