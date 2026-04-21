import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase.js'

export function useActivityLogs(userId) {
  const [logs, setLogs]     = useState([])
  const [saving, setSaving] = useState('idle')

  useEffect(() => {
    if (!userId) return
    supabase
      .from('activity_logs')
      .select('*')
      .eq('user_id', userId)
      .order('logged_at', { ascending: false })
      .then(({ data, error }) => {
        if (!error) setLogs(data ?? [])
      })
  }, [userId])

  // Returns Map<plantId, { watered: ISO, pruned: ISO, ... }>
  const latestLogsMap = useCallback(() => {
    const map = new Map()
    for (const log of logs) {
      if (!map.has(log.plant_id)) map.set(log.plant_id, {})
      const entry = map.get(log.plant_id)
      if (!entry[log.activity]) entry[log.activity] = log.logged_at
    }
    return map
  }, [logs])

  async function addLog(entry) {
    setSaving('saving')
    const { data, error } = await supabase
      .from('activity_logs')
      .insert(entry)
      .select()
      .single()
    if (!error) setLogs(prev => [data, ...prev])
    setSaving('idle')
    if (error) throw error
    return data
  }

  async function removeLog(id) {
    setSaving('saving')
    await supabase.from('activity_logs').delete().eq('id', id)
    setLogs(prev => prev.filter(l => l.id !== id))
    setSaving('idle')
  }

  return { logs, latestLogsMap, saving, addLog, removeLog }
}
