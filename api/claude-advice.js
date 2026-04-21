export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  if (!process.env.CLAUDE_API_KEY) {
    res.setHeader('Content-Type', 'text/plain; charset=utf-8')
    return res.status(200).end('AI advice unavailable — API key not configured.')
  }

  const { plantName, variety, zone, season, perenualData, recentActivity } = req.body ?? {}

  const careInfo = perenualData
    ? `Watering: ${perenualData.watering || 'unknown'}, Sunlight: ${(perenualData.sunlight || []).join(', ')}, Care level: ${perenualData.care_level || 'unknown'}.`
    : ''

  const userPrompt = `I'm growing ${plantName || 'this plant'}${variety ? ` (${variety})` : ''}${zone ? ` in hardiness zone ${zone}` : ''}.
${season ? `It's currently ${season}.` : ''}
${careInfo}
${recentActivity ? `Recent care: ${JSON.stringify(recentActivity)}.` : ''}
Give me specific, practical care advice for right now, including any seasonal considerations.`

  res.setHeader('Content-Type', 'text/plain; charset=utf-8')
  res.setHeader('Cache-Control', 'no-cache')

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
        max_tokens: 600,
        stream: true,
        system: 'You are a knowledgeable home gardener. Give practical, specific care advice in 3-4 short paragraphs. Use plain text, no markdown headers. Focus on actionable, seasonal tips.',
        messages: [{ role: 'user', content: userPrompt }],
      }),
    })

    if (!r.ok) {
      console.error('Anthropic advice error:', r.status, await r.text())
      return res.end('Unable to load AI advice right now.')
    }

    const reader = r.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop()
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue
        const raw = line.slice(6).trim()
        if (raw === '[DONE]') continue
        try {
          const event = JSON.parse(raw)
          if (event.type === 'content_block_delta' && event.delta?.type === 'text_delta') {
            res.write(event.delta.text)
          }
        } catch {}
      }
    }
  } catch (err) {
    console.error('claude-advice error:', err)
    res.write('Unable to load AI advice right now.')
  }

  res.end()
}
