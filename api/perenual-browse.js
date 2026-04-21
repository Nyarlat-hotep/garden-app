import { createClient } from '@supabase/supabase-js'

const CATEGORY_QUERIES = {
  vegetable: 'vegetable',
  fruit: 'fruit',
  herb: 'herb',
  protein: 'bean',
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const key = process.env.PERENUAL_API_KEY
  if (!key) return res.status(200).json([])

  const { category = 'vegetable', zone = '', page = 1 } = req.body ?? {}
  const cacheKey = `browse:${zone}:${category}:${page}`

  // Try cache — skip silently if Supabase unavailable
  let supabase = null
  try {
    supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY)
    const { data: cached } = await supabase
      .from('discovery_cache')
      .select('results, cached_at')
      .eq('cache_key', cacheKey)
      .single()
    if (cached) {
      const ageMs = Date.now() - new Date(cached.cached_at).getTime()
      if (ageMs < 7 * 24 * 60 * 60 * 1000) return res.status(200).json(cached.results)
    }
  } catch {}

  // Fetch from Perenual
  try {
    const q   = CATEGORY_QUERIES[category] || category
    let url   = `https://perenual.com/api/species-list?key=${key}&q=${encodeURIComponent(q)}&page=${page}`
    if (zone) url += `&hardiness=${zone}`

    const r    = await fetch(url)
    const data = await r.json()

    if (!r.ok) {
      console.error('Perenual error:', r.status, data)
      return res.status(200).json([])
    }

    const results = (data.data ?? []).map(s => ({
      id:              s.id,
      name:            s.common_name || s.scientific_name?.[0] || 'Unknown',
      scientific_name: s.scientific_name?.[0] ?? '',
      image_url:       s.default_image?.small_url ?? s.default_image?.thumbnail ?? null,
      watering:        s.watering,
      sunlight:        Array.isArray(s.sunlight) ? s.sunlight : [],
      cycle:           s.cycle,
      hardiness_min:   s.hardiness?.min ?? null,
      hardiness_max:   s.hardiness?.max ?? null,
      care_level:      s.care_level,
    }))

    // Cache in background — don't block response
    if (supabase) {
      supabase.from('discovery_cache').upsert({ cache_key: cacheKey, results, cached_at: new Date().toISOString() }).then(() => {})
    }

    res.status(200).json(results)
  } catch (err) {
    console.error('perenual-browse error:', err)
    res.status(200).json([])
  }
}
