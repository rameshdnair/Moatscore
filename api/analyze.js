export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { company, description } = req.body
  if (!company || !description) return res.status(400).json({ error: 'Missing fields' })

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return res.status(500).json({ error: 'API key not configured' })

  const SYSTEM = `You are an expert analyst evaluating vertical software companies using Nicolas Bustamante's 10-moat framework.

Moats to evaluate:
1. interface — Learned Interface (HIGH LLM threat)
2. workflow — Encoded Workflows (HIGH LLM threat)
3. dataparsing — Data Parsing & Search (HIGH LLM threat)
4. talent — Talent Scarcity (HIGH LLM threat)
5. bundling — Bundling & Ecosystem (HIGH LLM threat)
6. proprietarydata — Proprietary Data (LOW LLM threat)
7. regulatory — Regulatory & Compliance (LOW LLM threat)
8. transactions — Transactions & Infrastructure (LOW LLM threat)
9. networkeffects — Network Effects (MEDIUM LLM threat)
10. switchingcosts — Switching Costs & Integration (MEDIUM LLM threat)

Return ONLY valid JSON, no markdown, no extra text:
{
  "overallScore": number,
  "aiReadinessScore": number,
  "strategicSummary": string,
  "topStrength": string,
  "biggestRisk": string,
  "moats": {
    "interface": { "score": number, "examples": string[], "recommendations": string[] },
    "workflow": { "score": number, "examples": string[], "recommendations": string[] },
    "dataparsing": { "score": number, "examples": string[], "recommendations": string[] },
    "talent": { "score": number, "examples": string[], "recommendations": string[] },
    "bundling": { "score": number, "examples": string[], "recommendations": string[] },
    "proprietarydata": { "score": number, "examples": string[], "recommendations": string[] },
    "regulatory": { "score": number, "examples": string[], "recommendations": string[] },
    "transactions": { "score": number, "examples": string[], "recommendations": string[] },
    "networkeffects": { "score": number, "examples": string[], "recommendations": string[] },
    "switchingcosts": { "score": number, "examples": string[], "recommendations": string[] }
  }
}`

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2000,
        system: SYSTEM,
        messages: [{
          role: 'user',
          content: `Evaluate this vertical software company:\n\nCompany: ${company}\n\nDescription: ${description}\n\nBe specific and critical. Score honestly.`
        }]
      })
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('Anthropic error:', JSON.stringify(data))
      return res.status(500).json({ error: data?.error?.message || 'Anthropic API error' })
    }

    if (!data.content?.[0]?.text) {
      console.error('Unexpected response:', JSON.stringify(data))
      return res.status(500).json({ error: 'No content in response' })
    }

    const text = data.content[0].text.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(text)
    res.status(200).json(parsed)
  } catch (e) {
    console.error('Handler error:', e.message)
    res.status(500).json({ error: e.message })
  }
    })

    const data = await response.json()
    if (!data.content?.[0]?.text) return res.status(500).json({ error: 'No response from model' })

    const text = data.content[0].text.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(text)
    res.status(200).json(parsed)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
}
