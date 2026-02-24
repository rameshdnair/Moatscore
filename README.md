# 🏰 MoatScore

Evaluate vertical software companies against Nicolas Bustamante's 10-moat framework — separating companies that survive the LLM era from those that don't.

## Features

- **Single analysis** — score any vertical software company across all 10 moats
- **Side-by-side comparison** — pit two companies against each other, moat by moat
- **Shareable URLs** — results are encoded in the URL hash; just copy and send
- **PDF export** — hit "Export PDF" and use browser print → Save as PDF
- **Leaderboard** — tracks every company you've analyzed, ranked by moat score

---

## Deploy to Vercel in 5 minutes

### 1. Push to GitHub

```bash
# Create a new repo on github.com, then:
git init
git add .
git commit -m "init moatscore"
git remote add origin https://github.com/YOUR_USERNAME/moatscore.git
git push -u origin main
```

### 2. Deploy on Vercel

1. Go to [vercel.com](https://vercel.com) → **Add New Project**
2. Import your GitHub repo
3. Leave all build settings as defaults (Vercel detects Vite automatically)
4. Click **Deploy**

### 3. Add your Anthropic API key

1. In your Vercel project → **Settings → Environment Variables**
2. Add:
   - **Name:** `ANTHROPIC_API_KEY`
   - **Value:** `sk-ant-...` (your key from [console.anthropic.com](https://console.anthropic.com))
3. Click **Save**, then **Redeploy** (Deployments tab → ⋯ → Redeploy)

That's it. Share the Vercel URL with friends — your API key stays server-side and is never exposed.

---

## Run locally

```bash
npm install
```

Create a `.env` file:
```
ANTHROPIC_API_KEY=sk-ant-your-key-here
```

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

---

## The 10 Moats (Bustamante Framework)

| Status | Moat |
|--------|------|
| ⚠️ LLM-threatened | Learned Interface |
| ⚠️ LLM-threatened | Encoded Workflows |
| ⚠️ LLM-threatened | Data Parsing & Search |
| ⚠️ LLM-threatened | Talent Scarcity |
| ⚠️ LLM-threatened | Bundling & Ecosystem |
| 🛡️ AI-resilient | Proprietary Data |
| 🛡️ AI-resilient | Regulatory & Compliance |
| 🛡️ AI-resilient | Transactions & Infrastructure |
| ⚡ Partial | Network Effects |
| ⚡ Partial | Switching Costs & Integration |

Based on: *"10 Years Building Vertical Software: My Perspective on the Selloff"* by [@nicbstme](https://x.com/nicbstme)
