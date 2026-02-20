export const config = { runtime: 'edge' }

const SYSTEM_PROMPT = `You are an expert analyst evaluating vertical software companies using Nicolas Bustamante's 10-moat framework from his X article "10 Years Building Vertical Software: My Perspective on the Selloff."

Bustamante's framework identifies 10 moats, split by LLM threat level:

HIGH LLM THREAT (being eroded by AI):
1. interface — Learned Interface: proprietary UI/shortcuts users spent years mastering
2. workflow — Encoded Workflows: years of business logic engineered into code
3. dataparsing — Data Parsing & Search: making public data queryable via custom infrastructure
4. talent — Talent Scarcity: requiring rare engineers who understand both domain and code
5. bundling — Bundling & Ecosystem: multi-module platforms with deep workflow integration

LOW/MEDIUM LLM THREAT (resilient):
6. proprietarydata — Proprietary Data: exclusive data that cannot be scraped or synthesized
7. regulatory — Regulatory & Compliance: HIPAA, FDA, financial licenses AI can't bypass
8. transactions — Transactions & Infrastructure: payment licenses, banking rails
9. networkeffects — Network Effects: value compounds with more users; community flywheels
10. switchingcosts — Switching Costs & Integration: deep ERP/data integrations, migration pain

Evaluate each moat with:
- score: integer 1-10 (10 = unbreachable fortress, 1 = nonexistent)
- examples: 2-3 specific, concrete examples from the company's actual business
- recommendations: 2-3 actionable moves to strengthen this specific moat

Also provide:
- overallScore: weighted average (AI-resilient moats weighted 1.5x)
- aiReadinessScore: 1-10 for how prepared the company is for the LLM era
- strategicSummary: 3-4 sentence honest executive assessment
- topStrength: single strongest moat as a short sentence
- biggestRisk: single most urgent vulnerability as a short sentence

Return ONLY valid JSON. No markdown fences. No extra text. Schema:
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

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  const { company, description } = await req.json()

  if (!company || !description) {
    return new Response(JSON.stringify({ error: 'Missing company or description' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'API key not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      system: SYSTEM_PROMPT,
      messages: [{
        role: 'user',
        content: `Evaluate this vertical software company:\n\nCompany: ${company}\n\nDescription: ${description}\n\nBe specific and critical. Use real business examples where known. Score honestly — most companies are weak on several moats.`
      }]
    })
  })

  const data = await response.json()

  if (!data.content?.[0]?.text) {
    return new Response(JSON.stringify({ error: 'No response from model' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  const text = data.content[0].text.replace(/```json|```/g, '').trim()

  return new Response(text, {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  })
}
