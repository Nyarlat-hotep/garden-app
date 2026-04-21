export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  if (!process.env.CLAUDE_API_KEY) return res.status(200).json([])

  const { zone, season, category, location } = req.body ?? {}

  const userPrompt = `Location: ${location || 'temperate region'}, hardiness zone ${zone || '7'}, current season: ${season || 'spring'}.
Recommend 6 ${category || 'vegetable'}s to grow right now. Consider what thrives in zone ${zone || '7'} during ${season || 'spring'}, what can be started from seed vs transplant at this time of year, and mix beginner-friendly options with some interesting varieties.`

  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1200,
        system: 'You are a gardening expert specializing in regional growing recommendations. Return exactly 6 plant recommendations as a JSON array. Each object must have: { "name": string, "variety_suggestion": string, "reason": string, "days_to_harvest": number|null, "difficulty": "easy"|"moderate"|"challenging", "tip": string }. Respond with ONLY the JSON array, no other text.',
        messages: [{ role: 'user', content: userPrompt }],
      }),
    })

    if (!r.ok) {
      console.error('Anthropic error:', r.status, await r.text())
      return res.status(200).json([])
    }

    const data = await r.json()
    const text = data.content?.[0]?.text ?? '[]'
    const jsonMatch = text.match(/\[[\s\S]*\]/)
    const results = jsonMatch ? JSON.parse(jsonMatch[0]) : []
    res.status(200).json(results)
  } catch (err) {
    console.error('claude-discover error:', err)
    res.status(200).json([])
  }
}
