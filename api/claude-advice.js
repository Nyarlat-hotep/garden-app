import Anthropic from '@anthropic-ai/sdk'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  if (!process.env.CLAUDE_API_KEY) {
    res.setHeader('Content-Type', 'text/plain; charset=utf-8')
    res.status(200).end('AI advice unavailable — API key not configured.')
    return
  }

  const client = new Anthropic({ apiKey: process.env.CLAUDE_API_KEY })

  const { plantName, variety, zone, season, perenualData, recentActivity } = req.body

  const careInfo = perenualData
    ? `Watering: ${perenualData.watering || 'unknown'}, Sunlight: ${(perenualData.sunlight || []).join(', ')}, Care level: ${perenualData.care_level || 'unknown'}.`
    : ''

  const userPrompt = `I'm growing ${plantName}${variety ? ` (${variety})` : ''}${zone ? ` in hardiness zone ${zone}` : ''}.
${season ? `It's currently ${season}.` : ''}
${careInfo}
${recentActivity ? `Recent care: ${JSON.stringify(recentActivity)}.` : ''}
Give me specific, practical care advice for right now, including any seasonal considerations.`

  res.setHeader('Content-Type', 'text/plain; charset=utf-8')
  res.setHeader('Transfer-Encoding', 'chunked')
  res.setHeader('Cache-Control', 'no-cache')

  try {
    const stream = client.messages.stream({
      model: 'claude-sonnet-4-6',
      max_tokens: 600,
      system: 'You are a knowledgeable home gardener. Give practical, specific care advice in 3-4 short paragraphs. Use plain text, no markdown headers. Focus on actionable, seasonal tips.',
      messages: [{ role: 'user', content: userPrompt }],
    })

    for await (const chunk of stream) {
      if (chunk.type === 'content_block_delta' && chunk.delta?.type === 'text_delta') {
        res.write(chunk.delta.text)
      }
    }
  } catch (err) {
    res.write('Unable to load AI advice right now.')
  }

  res.end()
}
