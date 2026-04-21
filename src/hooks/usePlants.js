import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../lib/supabase.js'
import { computeHealth } from '../utils/health.js'
import { detectFamily } from '../data/plantFamilies.js'

export function usePlants(userId, latestLogsMap) {
  const [plants, setPlants]         = useState([])
  const [saving, setSaving]         = useState('idle')
  const [searchQuery, setSearchQuery]       = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')

  useEffect(() => {
    if (!userId) return
    supabase
      .from('plants')
      .select('*')
      .eq('user_id', userId)
      .order('name')
      .then(({ data, error }) => {
        if (!error) setPlants(data ?? [])
      })
  }, [userId])

  const healthMap = useMemo(() => {
    const map = new Map()
    const logsMap = latestLogsMap ? latestLogsMap() : new Map()
    for (const plant of plants) {
      map.set(plant.id, computeHealth(plant, logsMap.get(plant.id) ?? {}))
    }
    return map
  }, [plants, latestLogsMap])

  const filtered = useMemo(() => {
    return plants.filter(p => {
      const matchesSearch = !searchQuery ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.variety || '').toLowerCase().includes(searchQuery.toLowerCase())
      const matchesCategory = categoryFilter === 'all' || p.category === categoryFilter
      return matchesSearch && matchesCategory
    })
  }, [plants, searchQuery, categoryFilter])

  async function addPlant(plant) {
    setSaving('saving')
    const row = { ...plant, user_id: userId, plant_family: plant.plant_family || detectFamily(plant.name) }
    const { data, error } = await supabase.from('plants').insert(row).select().single()
    if (!error) setPlants(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)))
    setSaving('idle')
    if (error) throw error
    return data
  }

  async function editPlant(plant) {
    setSaving('saving')
    const row = { ...plant, plant_family: plant.plant_family || detectFamily(plant.name) }
    const { data, error } = await supabase.from('plants').update(row).eq('id', plant.id).select().single()
    if (!error) setPlants(prev => prev.map(p => p.id === plant.id ? data : p))
    setSaving('idle')
    if (error) throw error
    return data
  }

  async function removePlant(id) {
    setSaving('saving')
    await supabase.from('plants').delete().eq('id', id)
    setPlants(prev => prev.filter(p => p.id !== id))
    setSaving('idle')
  }

  return {
    plants, healthMap, saving, filtered,
    searchQuery, setSearchQuery,
    categoryFilter, setCategoryFilter,
    addPlant, editPlant, removePlant,
  }
}
