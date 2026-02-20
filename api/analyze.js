const SYSTEM = `You are an expert analyst evaluating vertical software companies using Nicolas Bustamante's 10-moat framework.

Moats to evaluate:
1. interface - Learned Interface (HIGH LLM threat)
2. workflow - Encoded Workflows (HIGH LLM threat)
3. dataparsing - Data Parsing and Search (HIGH LLM threat)
4. talent - Talent Scarcity (HIGH LLM threat)
5. bundling - Bundling and Ecosystem (HIGH LLM threat)
6. proprietarydata - Proprietary Data (LOW LLM threat)
7. regulatory - Regulatory and Compliance (LOW LLM threat)
8. transactions - Transactions and Infrastructure (LOW LLM threat)
9. networkeffects - Network Effects (MEDIUM LLM threat)
10. switchingcosts - Switching Costs and Integration (MEDIUM LLM threat)

Return ONLY valid JSON, no markdown, no extra text:
{
  "overallScore": 7.2,
  "aiReadinessScore": 6.5,
  "strategicSummary": "example summary",
  "topStrength": "example strength",
  "biggestRisk": "example risk",
  "moats": {
    "interface": { "score": 7, "examples": ["example1", "example2"], "recommendations": ["rec1", "rec2"] },
    "workflow": { "score": 7, "examples": ["example1"], "recommendations": ["rec1"] },
    "dataparsing": { "score": 7, "examples": ["example1"], "recommendations": ["rec1"] },
    "talent": { "score": 7, "examples": ["example1"], "recommendations": ["rec1"] },
    "bundling": { "score": 7, "examples": ["example1"], "recommendations": ["rec1"] },
    "proprietarydata": { "score": 7, "examples": ["example1"], "recommendations": ["rec1"] },
    "regulatory": { "score": 7, "examples": ["example1"], "recommendations": ["rec1"] },
    "transactions": { "score": 7, "examples": ["example1"], "recommendations": ["rec1"] },
    "networkeffects": { "score": 7, "examples": ["example1"], "recommendations": ["rec1"] },
    "switchingcosts": { "score": 7, "examples": ["example1"], "recommendations": ["rec1"] }
  }
}`;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { company, description } = req.body;

  if (!company || !description) {
    return res.status(400).json({ error: "Missing company or description" });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: "API key not configured" });
  }

  let response;

  try {
    response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 2000,
        system: SYSTEM,
        messages: [
          {
            role: "user",
            content: "Evaluate this vertical software company:\n\nCompany: " + company + "\n\nDescription: " + description + "\n\nBe specific and critical. Score honestly."
          }
        ]
      })
    });
  } catch (fetchErr) {
    console.error("Fetch failed:", fetchErr.message);
    return res.status(500).json({ error: "Failed to reach Anthropic: " + fetchErr.message });
  }

  let data;

  try {
    data = await response.json();
  } catch (parseErr) {
    console.error("Failed to parse Anthropic response:", parseErr.message);
    return res.status(500).json({ error: "Invalid response from Anthropic" });
  }

  if (!response.ok) {
    console.error("Anthropic error:", JSON.stringify(data));
    return res.status(500).json({ error: data && data.error && data.error.message ? data.error.message : "Anthropic API error" });
  }

  if (!data.content || !data.content[0] || !data.content[0].text) {
    console.error("Unexpected structure:", JSON.stringify(data));
    return res.status(500).json({ error: "No content in Anthropic response" });
  }

  let parsed;

  try {
    const text = data.content[0].text.replace(/```json/g, "").replace(/```/g, "").trim();
    parsed = JSON.parse(text);
  } catch (jsonErr) {
    console.error("JSON parse failed:", jsonErr.message);
    return res.status(500).json({ error: "Could not parse model response as JSON" });
  }

  return res.status(200).json(parsed);
}
