export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  if (!process.env.CLAUDE_API_KEY) return res.status(200).json([])

  const { zone, season, category, location } = req.body ?? {}

  const userPrompt = `Location: ${location || 'temperate region'}${zone ? `, hardiness zone ${zone}` : ''}, current season: ${season || 'spring'}.
Recommend 12 ${category || 'vegetable'}s to grow right now. Mix beginner-friendly staples with interesting varieties. Consider what can still be direct-seeded vs needs transplants at this point in the season.`

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
        system: 'You are a gardening expert specializing in regional growing recommendations. Return exactly 12 plant recommendations as a JSON array. Each object must have: { "name": string, "variety_suggestion": string, "reason": string, "days_to_harvest": number|null, "difficulty": "easy"|"moderate"|"challenging", "tip": string }. Respond with ONLY the JSON array, no other text.',
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
