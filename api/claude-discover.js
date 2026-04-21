export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  console.log('[claude-discover] key present:', !!process.env.CLAUDE_API_KEY, '| body:', JSON.stringify(req.body))
  if (!process.env.CLAUDE_API_KEY) {
    console.log('[claude-discover] missing CLAUDE_API_KEY')
    return res.status(200).json([])
  }

  const { zone, season, category, location } = req.body ?? {}

  const userPrompt = `Location: ${location || 'temperate region'}${zone ? `, zone ${zone}` : ''}, season: ${season || 'spring'}. Recommend 8 ${category || 'vegetable'}s to grow right now.`

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
        max_tokens: 2048,
        system: 'You are a gardening expert. Return exactly 8 plant recommendations as a JSON array. Each object: { "name": string, "variety_suggestion": string, "reason": string (max 20 words), "days_to_harvest": number|null, "difficulty": "easy"|"moderate"|"challenging", "tip": string (max 20 words) }. ONLY output the JSON array, nothing else.',
        messages: [{ role: 'user', content: userPrompt }],
      }),
    })

    if (!r.ok) {
      const errText = await r.text()
      console.error('[claude-discover] Anthropic error:', r.status, errText)
      return res.status(200).json([])
    }

    const data = await r.json()
    const text = data.content?.[0]?.text ?? '[]'
    console.log('[claude-discover] raw response length:', text.length, '| preview:', text.slice(0, 120))
    const jsonMatch = text.match(/\[[\s\S]*\]/)
    const results = jsonMatch ? JSON.parse(jsonMatch[0]) : []
    console.log('[claude-discover] parsed results count:', results.length)
    res.status(200).json(results)
  } catch (err) {
    console.error('claude-discover error:', err)
    res.status(200).json([])
  }
}
