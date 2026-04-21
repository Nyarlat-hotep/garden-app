import { createClient } from '@supabase/supabase-js'

const CATEGORY_TERMS = {
  vegetable: ['tomato', 'carrot', 'lettuce', 'pepper', 'cucumber', 'spinach', 'broccoli', 'zucchini'],
  fruit:     ['strawberry', 'blueberry', 'apple', 'raspberry', 'peach', 'blackberry', 'plum'],
  herb:      ['basil', 'mint', 'rosemary', 'thyme', 'parsley', 'cilantro', 'oregano', 'chive'],
  protein:   ['bean', 'pea', 'chickpea', 'lentil', 'soybean', 'edamame'],
}

async function fetchTerm(key, term) {
  const url = `https://perenual.com/api/species-list?key=${key}&q=${encodeURIComponent(term)}&page=1`
  const r = await fetch(url)
  if (!r.ok) return []
  const data = await r.json()
  return (data.data ?? []).map(s => ({
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
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const key = process.env.PERENUAL_API_KEY
  if (!key) return res.status(200).json([])

  const { category = 'vegetable', zone = '' } = req.body ?? {}
  const cacheKey = `browse:${zone}:${category}`

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

  try {
    const terms   = CATEGORY_TERMS[category] ?? [category]
    const batches = await Promise.all(terms.map(t => fetchTerm(key, t)))
    const seen    = new Set()
    const results = batches.flat().filter(p => {
      if (seen.has(p.id)) return false
      seen.add(p.id)
      return true
    })

    console.log('[perenual-browse] category:', category, '| results:', results.length)

    if (supabase) {
      supabase.from('discovery_cache').upsert({ cache_key: cacheKey, results, cached_at: new Date().toISOString() }).then(() => {})
    }

    res.status(200).json(results)
  } catch (err) {
    console.error('perenual-browse error:', err)
    res.status(200).json([])
  }
}
