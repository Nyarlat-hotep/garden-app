import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../lib/supabase.js'
import { getCurrentSeason } from '../utils/seasons.js'
import { checkRotationConflict } from '../utils/rotation.js'

export function useGardenMap(userId) {
  const [beds, setBeds]               = useState([])
  const [assignments, setAssignments] = useState([])
  const [saving, setSaving]           = useState('idle')
  const [selectedSeason, setSelectedSeason] = useState(getCurrentSeason())
  const [selectedYear, setSelectedYear]     = useState(new Date().getFullYear())
  const [gridCols, setGridCols]             = useState(4)

  useEffect(() => {
    if (!userId) return
    Promise.all([
      supabase.from('garden_beds').select('*').eq('user_id', userId).order('grid_row').then(r => r.data ?? []),
      supabase.from('bed_assignments').select('*').eq('user_id', userId).then(r => r.data ?? []),
    ]).then(([bedsData, assignData]) => {
      setBeds(bedsData)
      setAssignments(assignData)
    })
  }, [userId])

  const currentAssignments = useMemo(() =>
    assignments.filter(a => a.season === selectedSeason && a.year === selectedYear),
    [assignments, selectedSeason, selectedYear]
  )

  const rotationWarnings = useMemo(() => {
    const warnings = new Map()
    for (const a of currentAssignments) {
      if (!a.plant_family) continue
      const result = checkRotationConflict(a.bed_id, a.plant_family, selectedSeason, selectedYear, assignments)
      if (result.hasConflict) warnings.set(a.bed_id, result)
    }
    return warnings
  }, [currentAssignments, assignments, selectedSeason, selectedYear])

  async function addBed(name) {
    setSaving('saving')
    const existing = beds
    const maxRow = existing.length ? Math.max(...existing.map(b => b.grid_row)) : -1
    const row = { user_id: userId, name, grid_col: 0, grid_row: maxRow + 1 }
    const { data, error } = await supabase.from('garden_beds').insert(row).select().single()
    if (!error) setBeds(prev => [...prev, data])
    setSaving('idle')
    if (error) throw error
  }

  async function removeBed(id) {
    setSaving('saving')
    await supabase.from('garden_beds').delete().eq('id', id)
    setBeds(prev => prev.filter(b => b.id !== id))
    setAssignments(prev => prev.filter(a => a.bed_id !== id))
    setSaving('idle')
  }

  async function assignPlant(bedId, plant) {
    setSaving('saving')
    const existing = currentAssignments.find(a => a.bed_id === bedId)
    const row = {
      user_id: userId,
      bed_id: bedId,
      plant_id: plant.id,
      plant_family: plant.plant_family,
      plant_name: plant.name,
      season: selectedSeason,
      year: selectedYear,
    }
    let data, error
    if (existing) {
      ({ data, error } = await supabase.from('bed_assignments').update(row).eq('id', existing.id).select().single())
      if (!error) setAssignments(prev => prev.map(a => a.id === existing.id ? data : a))
    } else {
      ({ data, error } = await supabase.from('bed_assignments').insert(row).select().single())
      if (!error) setAssignments(prev => [...prev, data])
    }
    setSaving('idle')
    if (error) throw error
  }

  async function clearBed(bedId) {
    const existing = currentAssignments.find(a => a.bed_id === bedId)
    if (!existing) return
    setSaving('saving')
    await supabase.from('bed_assignments').delete().eq('id', existing.id)
    setAssignments(prev => prev.filter(a => a.id !== existing.id))
    setSaving('idle')
  }

  return {
    beds, saving, currentAssignments, assignments,
    rotationWarnings, gridCols, setGridCols,
    selectedSeason, selectedYear, setSelectedSeason, setSelectedYear,
    addBed, removeBed, assignPlant, clearBed,
  }
}
