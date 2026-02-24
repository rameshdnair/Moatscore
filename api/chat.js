export const config = { maxDuration: 60 }

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method not allowed')

  const { company, results, messages } = req.body
  if (!messages?.length) return res.status(400).json({ error: 'Missing messages' })

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return res.status(500).json({ error: 'API key not configured' })

  const moatSummary = results?.moats
    ? Object.entries(results.moats).map(([k, v]) => `${k}: ${v.score}/10`).join(', ')
    : ''

  const system = `You are an expert moat analyst helping a user understand their analysis of "${company}".

Analysis results:
- Overall Moat Score: ${results?.overallScore}/10
- AI Readiness: ${results?.aiReadinessScore}/10
- Strategic Summary: ${results?.strategicSummary}
- Top Strength: ${results?.topStrength}
- Biggest Risk: ${results?.biggestRisk}
- Individual moat scores: ${moatSummary}

Answer questions concisely and insightfully. Reference specific moat scores when relevant. Keep responses under 200 words.`

  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache, no-transform')
  res.setHeader('X-Accel-Buffering', 'no')
  res.setHeader('Access-Control-Allow-Origin', '*')

  try {
    const upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 512,
        stream: true,
        system,
        messages
      })
    })

    const reader = upstream.body.getReader()
    const decoder = new TextDecoder()

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      const chunk = decoder.decode(value, { stream: true })
      for (const line of chunk.split('\n')) {
        if (!line.startsWith('data: ')) continue
        const data = line.slice(6).trim()
        if (data === '[DONE]') continue
        try {
          const parsed = JSON.parse(data)
          if (parsed.type === 'content_block_delta' && parsed.delta?.type === 'text_delta') {
            res.write(`data: ${JSON.stringify({ text: parsed.delta.text })}\n\n`)
          }
          if (parsed.type === 'message_stop') {
            res.write('data: [DONE]\n\n')
          }
        } catch {}
      }
    }
  } catch (e) {
    res.write(`data: ${JSON.stringify({ error: e.message })}\n\n`)
  }

  res.end()
}
