export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { query } = req.body
  const key = process.env.PERENUAL_API_KEY

  if (!key) return res.status(200).json([])

  try {
    const url = `https://perenual.com/api/species-list?key=${key}&q=${encodeURIComponent(query)}&page=1`
    const r = await fetch(url)
    const data = await r.json()

    const results = (data.data ?? []).slice(0, 8).map(s => ({
      id: s.id,
      common_name: s.common_name,
      scientific_name: s.scientific_name?.[0] ?? '',
      image_url: s.default_image?.small_url ?? s.default_image?.thumbnail ?? null,
      watering: s.watering,
      sunlight: s.sunlight,
      cycle: s.cycle,
    }))

    res.status(200).json(results)
  } catch {
    res.status(200).json([])
  }
}
