export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { id } = req.body
  const key = process.env.PERENUAL_API_KEY

  if (!key || !id) return res.status(200).json(null)

  try {
    const r = await fetch(`https://perenual.com/api/species/details/${id}?key=${key}`)
    const data = await r.json()

    res.status(200).json({
      id: data.id,
      common_name: data.common_name,
      scientific_name: data.scientific_name?.[0] ?? '',
      description: data.description,
      watering: data.watering,
      sunlight: data.sunlight,
      hardiness: data.hardiness,
      cycle: data.cycle,
      care_level: data.care_level,
      growth_rate: data.growth_rate,
      maintenance: data.maintenance,
      pruning_month: data.pruning_month,
      image_url: data.default_image?.medium_url ?? data.default_image?.small_url ?? null,
    })
  } catch {
    res.status(200).json(null)
  }
}
