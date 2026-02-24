export const config = { maxDuration: 60 }

const BULL_PROMPT = `You are a bullish venture capital analyst specializing in vertical software defensibility. You believe strongly in this company's long-term moat in the LLM era. Argue persuasively for its 3-4 strongest competitive advantages. Be specific, confident, and compelling. Write 3-4 focused paragraphs — no bullet points.`

const BEAR_PROMPT = `You are a bearish short-seller specializing in moat vulnerabilities in vertical software. You are skeptical of claimed advantages and believe this company is more exposed to LLM disruption than it appears. Argue persuasively against its moats, focusing on the 3-4 biggest vulnerabilities. Be specific, sharp, and compelling. Write 3-4 focused paragraphs — no bullet points.`

const SYNTHESIS_PROMPT = `You are a neutral senior analyst who has heard a bull and bear case for a vertical software company. Synthesize both into a balanced verdict.

Return ONLY valid JSON. No markdown fences. No extra text. Schema:
{
  "verdict": "one-sentence overall verdict",
  "bullPoints": ["strongest bull point", "second strongest bull point"],
  "bearPoints": ["strongest bear point", "second strongest bear point"],
  "score": <defensibility score 1-10>,
  "recommendation": "2-3 sentence final recommendation"
}`

async function callClaude(apiKey, system, userMessage) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system,
      messages: [{ role: 'user', content: userMessage }]
    })
  })
  const data = await response.json()
  return data.content?.[0]?.text || ''
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method not allowed')

  const { company, description } = req.body
  if (!company || !description) return res.status(400).json({ error: 'Missing company or description' })

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return res.status(500).json({ error: 'API key not configured' })

  const prompt = `Company: ${company}\n\nDescription: ${description}`

  // Bull and bear run in parallel
  const [bull, bear] = await Promise.all([
    callClaude(apiKey, BULL_PROMPT, prompt),
    callClaude(apiKey, BEAR_PROMPT, prompt)
  ])

  // Synthesis uses both arguments
  const synthesisRaw = await callClaude(
    apiKey,
    SYNTHESIS_PROMPT,
    `Bull case:\n${bull}\n\nBear case:\n${bear}\n\nCompany: ${company}`
  )

  let synthesis
  try {
    synthesis = JSON.parse(synthesisRaw.replace(/```json|```/g, '').trim())
  } catch {
    synthesis = { verdict: 'Synthesis unavailable', bullPoints: [], bearPoints: [], score: 5, recommendation: '' }
  }

  res.setHeader('Content-Type', 'application/json')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.status(200).json({ bull, bear, synthesis })
}
