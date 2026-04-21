import { useState, useEffect } from 'react'
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

  async function saveProfile(updates) {
    const { data, error } = await supabase
      .from('profiles')
      .upsert({ id: userId, ...updates })
      .select()
      .single()
    if (!error && data) setProfile(data)
    if (error) throw error
    return data
  }

  return { profile, saveProfile }
}
