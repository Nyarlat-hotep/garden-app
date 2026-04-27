import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase.js'

export function useProfile(userId) {
  const [profile, setProfile] = useState(null)

  useEffect(() => {
    if (!userId) return
    supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
      .then(({ data }) => { if (data) setProfile(data) })
  }, [userId])

  const saveProfile = useCallback(async (updates) => {
    const { data, error } = await supabase
      .from('profiles')
      .upsert({ id: userId, ...updates })
      .select()
      .single()
    if (!error && data) setProfile(data)
    if (error) throw error
    return data
  }, [userId])

  return { profile, saveProfile }
}
