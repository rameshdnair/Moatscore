export const config = { maxDuration: 30 }

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method not allowed')

  const { text, company } = req.body
  if (!text) return res.status(400).json({ error: 'Missing text' })

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
      system: `You extract competitive moat signals from company documents. Focus only on facts present in the text. Prioritize: proprietary data assets, regulatory/compliance barriers, switching costs and integrations, network effects, transaction infrastructure, and workflow complexity. Be concise and specific — no fluff.`,
      messages: [{
        role: 'user',
        content: `Extract moat signals from this text about ${company || 'this company'} into a 4-6 sentence description suitable for moat analysis:\n\n${text.slice(0, 8000)}`
      }]
    })
  })

  const data = await response.json()
  const description = data.content?.[0]?.text || ''

  res.setHeader('Content-Type', 'application/json')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.status(200).json({ description })
}
