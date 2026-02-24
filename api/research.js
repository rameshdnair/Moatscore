export const config = { maxDuration: 30 }

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method not allowed')

  const { company } = req.body
  if (!company) return res.status(400).json({ error: 'Missing company' })

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return res.status(500).json({ error: 'API key not configured' })

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 400,
      messages: [{
        role: 'user',
        content: `Write a 4-6 sentence description of "${company}" for competitive moat analysis. Cover: what the product does, key proprietary data assets, major integrations or ecosystems, any regulatory or compliance requirements, and what keeps customers from switching. Be factual and specific. If you don't have reliable information about this company, say so briefly.`
      }]
    })
  })

  const data = await response.json()
  const description = data.content?.[0]?.text || ''

  res.setHeader('Content-Type', 'application/json')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.status(200).json({ description })
}
