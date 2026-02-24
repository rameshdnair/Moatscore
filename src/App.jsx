import { useState, useEffect, useRef, useCallback } from 'react'

// ─── Constants ───────────────────────────────────────────────────────────────

const MOATS = [
  { id: 'interface',      name: 'Learned Interface',        icon: '⌨️', llmRisk: 'HIGH',   bustamante: 'When the interface is a natural language conversation, years of muscle memory become worthless. The switching cost that justified $25K per seat per year dissolves.' },
  { id: 'workflow',       name: 'Encoded Workflows',         icon: '⚙️', llmRisk: 'HIGH',   bustamante: 'Business logic is migrating from code written by specialized engineers to markdown files that anyone with domain expertise can write. The workflow moat is eroding very fast.' },
  { id: 'dataparsing',   name: 'Data Parsing & Search',     icon: '🔍', llmRisk: 'HIGH',   bustamante: 'LLMs make this trivial. The parsing infrastructure that took years to build is now a commodity capability that comes free with the model.' },
  { id: 'talent',         name: 'Talent Scarcity',           icon: '🧠', llmRisk: 'HIGH',   bustamante: 'Domain experts now write methodology directly into markdown skill files. They don\'t need Python. LLMs flip this moat entirely.' },
  { id: 'bundling',       name: 'Bundling & Ecosystem',      icon: '📦', llmRisk: 'HIGH',   bustamante: 'The bundle kept customers locked in because they\'d built their entire workflow around the ecosystem. But LLMs can replicate individual modules cheaply.' },
  { id: 'proprietarydata', name: 'Proprietary Data',         icon: '🔒', llmRisk: 'LOW',    bustamante: 'If you possess private data that cannot be scraped or synthesized, LLMs will multiply your value. This is the scarce fuel all agents crave.' },
  { id: 'regulatory',     name: 'Regulatory & Compliance',   icon: '📋', llmRisk: 'LOW',    bustamante: 'Epic\'s barriers are HIPAA compliance and FDA certification. No matter how intelligent AI becomes, it cannot bypass regulatory hurdles.' },
  { id: 'transactions',   name: 'Transactions & Infrastructure', icon: '💳', llmRisk: 'LOW', bustamante: 'Stripe\'s barrier lies in its licenses and payment processing channels. AI cannot move funds without banking infrastructure.' },
  { id: 'networkeffects', name: 'Network Effects',           icon: '🕸️', llmRisk: 'MEDIUM', bustamante: 'Companies building the connective tissue between users create agency loops that may be more defensible than keyboard shortcuts ever were.' },
  { id: 'switchingcosts', name: 'Switching Costs & Integration', icon: '🔗', llmRisk: 'MEDIUM', bustamante: 'The integration switching costs can survive even when interface moats erode — deep ERP and data integrations remain painful to unwind.' }
]

const RISK = {
  HIGH:   { label: '⚠️ LLM Threat',     color: '#ff6b6b', bg: 'rgba(255,107,107,0.12)' },
  MEDIUM: { label: '⚡ Partial Threat',  color: '#ffd93d', bg: 'rgba(255,217,61,0.12)' },
  LOW:    { label: '🛡️ AI-Resilient',   color: '#6bcb77', bg: 'rgba(107,203,119,0.12)' }
}

const scoreColor  = s => s >= 8 ? '#6bcb77' : s >= 5 ? '#ffd93d' : '#ff6b6b'
const scoreLabel  = s => s >= 8 ? 'Strong' : s >= 6 ? 'Moderate' : s >= 4 ? 'Weak' : 'Critical'
const STORAGE_KEY = 'moatscore_leaderboard'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function encodeShare(payload) {
  try { return btoa(unescape(encodeURIComponent(JSON.stringify(payload)))) } catch { return null }
}
function decodeShare(str) {
  try { return JSON.parse(decodeURIComponent(escape(atob(str)))) } catch { return null }
}

async function runAnalysis(company, description) {
  const res = await fetch('/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ company, description })
  })
  if (!res.ok) throw new Error(`API error ${res.status}`)
  return res.json()
}

function saveToLeaderboard(entry) {
  try {
    const board = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
    const deduped = board.filter(e => e.company.toLowerCase() !== entry.company.toLowerCase())
    const updated = [entry, ...deduped].slice(0, 50)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  } catch {}
}

function loadLeaderboard() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') } catch { return [] }
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function ScoreArc({ score, size = 120 }) {
  const r = 46, cx = 60, cy = 60
  const circ = Math.PI * r
  const color = scoreColor(score)
  return (
    <svg width={size} height={size * 0.72} viewBox="0 0 120 86">
      <path d={`M ${cx-r} ${cy} A ${r} ${r} 0 0 1 ${cx+r} ${cy}`} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="9"/>
      <path d={`M ${cx-r} ${cy} A ${r} ${r} 0 0 1 ${cx+r} ${cy}`} fill="none" stroke={color} strokeWidth="9"
        strokeDasharray={`${(score/10)*circ} ${circ}`} strokeLinecap="round"
        style={{ transition: 'stroke-dasharray 1s ease' }}/>
      <text x={cx} y={cy-4} textAnchor="middle" fill={color} fontSize="22" fontWeight="800">{score.toFixed(1)}</text>
      <text x={cx} y={cx+6} textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="10">{scoreLabel(score)}</text>
    </svg>
  )
}

function Bar({ score, color }) {
  return (
    <div style={{ flex:1, background:'rgba(255,255,255,0.06)', borderRadius:4, height:6, overflow:'hidden' }}>
      <div style={{ width:`${score*10}%`, background:color||scoreColor(score), height:'100%', borderRadius:4, transition:'width 1s ease' }}/>
    </div>
  )
}

function MoatCard({ moat, result, compact }) {
  const [open, setOpen] = useState(false)
  if (!result) return null
  const color = scoreColor(result.score)
  const risk  = RISK[moat.llmRisk]
  return (
    <div onClick={() => !compact && setOpen(o => !o)}
      style={{ background:'rgba(255,255,255,0.025)', border:`1px solid rgba(255,255,255,0.06)`, borderLeft:`3px solid ${color}`, borderRadius:10, overflow:'hidden', cursor: compact ? 'default' : 'pointer' }}>
      <div style={{ padding: compact ? '12px 16px' : '14px 18px', display:'flex', alignItems:'center', gap:12 }}>
        <span style={{ fontSize: compact ? 18 : 22 }}>{moat.icon}</span>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap', marginBottom:6 }}>
            <span style={{ fontWeight:700, color:'#fff', fontSize: compact ? 13 : 14 }}>{moat.name}</span>
            {!compact && <span style={{ fontSize:10, padding:'2px 7px', borderRadius:20, background:risk.bg, color:risk.color, fontWeight:600 }}>{risk.label}</span>}
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <Bar score={result.score}/>
            <span style={{ color, fontWeight:800, fontSize:14, minWidth:30 }}>{result.score}/10</span>
          </div>
        </div>
        {!compact && <span style={{ color:'rgba(255,255,255,0.25)', fontSize:16, transition:'transform 0.2s', transform: open?'rotate(180deg)':'none' }}>▾</span>}
      </div>
      {!compact && open && (
        <div style={{ padding:'0 18px 18px', borderTop:'1px solid rgba(255,255,255,0.05)' }}>
          {result.examples?.length > 0 && <>
            <div style={{ fontSize:11, fontWeight:700, color:'rgba(255,255,255,0.35)', letterSpacing:'0.1em', margin:'14px 0 8px' }}>EVIDENCE</div>
            {result.examples.map((e,i) => (
              <div key={i} style={{ display:'flex', gap:9, marginBottom:5, fontSize:13, color:'rgba(255,255,255,0.7)' }}>
                <span style={{ color, flexShrink:0, marginTop:2 }}>◆</span><span>{e}</span>
              </div>
            ))}
          </>}
          {result.recommendations?.length > 0 && <>
            <div style={{ fontSize:11, fontWeight:700, color:'rgba(255,255,255,0.35)', letterSpacing:'0.1em', margin:'14px 0 8px' }}>RECOMMENDATIONS</div>
            {result.recommendations.map((r,i) => (
              <div key={i} style={{ display:'flex', gap:9, marginBottom:5, fontSize:13, color:'rgba(255,255,255,0.7)' }}>
                <span style={{ color:'#6bcb77', flexShrink:0, marginTop:2 }}>→</span><span>{r}</span>
              </div>
            ))}
          </>}
          <blockquote style={{ margin:'14px 0 0', padding:'10px 12px', background:'rgba(255,255,255,0.02)', borderRadius:7, borderLeft:'2px solid rgba(255,255,255,0.1)', fontSize:12, color:'rgba(255,255,255,0.4)', lineHeight:1.6, fontStyle:'italic' }}>
            "{moat.bustamante}"
          </blockquote>
        </div>
      )}
    </div>
  )
}

function CompanyInput({ label, value, desc, onName, onDesc, loading, onRun, error }) {
  return (
    <div style={{ flex:1, minWidth:260, background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:14, padding:24 }}>
      <div style={{ fontSize:12, fontWeight:700, color:'rgba(255,255,255,0.35)', letterSpacing:'0.12em', marginBottom:16 }}>{label}</div>
      <input className="input-field" placeholder="Company name…" value={value} onChange={e => onName(e.target.value)} style={{ marginBottom:12 }}/>
      <textarea className="input-field" placeholder="Describe the product, data assets, integrations, regulations…" value={desc} onChange={e => onDesc(e.target.value)} style={{ minHeight:120, resize:'vertical', lineHeight:1.6, marginBottom:16 }}/>
      {error && <div style={{ color:'#ff6b6b', fontSize:12, marginBottom:12, padding:'8px 12px', background:'rgba(255,107,107,0.08)', borderRadius:7 }}>{error}</div>}
      <button className="btn-primary" onClick={onRun} disabled={loading} style={{ opacity:loading?0.5:1, cursor:loading?'not-allowed':'pointer' }}>
        {loading ? 'Analyzing…' : 'Analyze →'}
      </button>
    </div>
  )
}

function Scorecard({ company, results, printRef }) {
  return (
    <div ref={printRef}>
      <div style={{ textAlign:'center', padding:'28px 24px 24px', background:'linear-gradient(135deg,rgba(124,92,191,0.13),rgba(90,63,160,0.06))', border:'1px solid rgba(124,92,191,0.22)', borderRadius:18, marginBottom:28 }}>
        <div style={{ fontSize:10, fontFamily:'monospace', color:'rgba(255,255,255,0.3)', letterSpacing:'0.18em', marginBottom:4 }}>MOAT SCORECARD</div>
        <h2 style={{ fontSize:24, fontWeight:800, marginBottom:22, letterSpacing:'-0.02em' }}>{company}</h2>
        <div style={{ display:'flex', justifyContent:'center', gap:36, flexWrap:'wrap', marginBottom:22 }}>
          <div><div style={{ fontSize:11, color:'rgba(255,255,255,0.3)', marginBottom:4 }}>OVERALL MOAT</div><ScoreArc score={results.overallScore}/></div>
          <div><div style={{ fontSize:11, color:'rgba(255,255,255,0.3)', marginBottom:4 }}>AI READINESS</div><ScoreArc score={results.aiReadinessScore}/></div>
        </div>
        <p style={{ fontSize:14, color:'rgba(255,255,255,0.55)', lineHeight:1.7, maxWidth:520, margin:'0 auto 22px' }}>{results.strategicSummary}</p>
        <div style={{ display:'flex', gap:14, flexWrap:'wrap', justifyContent:'center' }}>
          <div style={{ padding:'11px 18px', background:'rgba(107,203,119,0.09)', border:'1px solid rgba(107,203,119,0.18)', borderRadius:10, textAlign:'left', maxWidth:220 }}>
            <div style={{ fontSize:10, color:'#6bcb77', letterSpacing:'0.12em', marginBottom:5 }}>💪 TOP STRENGTH</div>
            <div style={{ fontSize:13, color:'rgba(255,255,255,0.8)', lineHeight:1.4 }}>{results.topStrength}</div>
          </div>
          <div style={{ padding:'11px 18px', background:'rgba(255,107,107,0.09)', border:'1px solid rgba(255,107,107,0.18)', borderRadius:10, textAlign:'left', maxWidth:220 }}>
            <div style={{ fontSize:10, color:'#ff6b6b', letterSpacing:'0.12em', marginBottom:5 }}>🚨 BIGGEST RISK</div>
            <div style={{ fontSize:13, color:'rgba(255,255,255,0.8)', lineHeight:1.4 }}>{results.biggestRisk}</div>
          </div>
        </div>
      </div>

      <div style={{ fontSize:11, color:'rgba(255,255,255,0.22)', letterSpacing:'0.14em', marginBottom:10, fontFamily:'monospace' }}>LLM-THREATENED MOATS — tap to expand</div>
      <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:26 }}>
        {MOATS.filter(m => m.llmRisk === 'HIGH').map(m => <MoatCard key={m.id} moat={m} result={results.moats?.[m.id]}/>)}
      </div>

      <div style={{ fontSize:11, color:'rgba(255,255,255,0.22)', letterSpacing:'0.14em', marginBottom:10, fontFamily:'monospace' }}>RESILIENT MOATS — tap to expand</div>
      <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:32 }}>
        {MOATS.filter(m => m.llmRisk !== 'HIGH').map(m => <MoatCard key={m.id} moat={m} result={results.moats?.[m.id]}/>)}
      </div>
    </div>
  )
}

// ─── Views ───────────────────────────────────────────────────────────────────

function HomeView({ onResults }) {
  const [company, setCompany]   = useState('')
  const [desc, setDesc]         = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  const run = async () => {
    if (!company.trim() || !desc.trim()) { setError('Please fill in both fields.'); return }
    setError(''); setLoading(true)
    try {
      const results = await runAnalysis(company.trim(), desc.trim())
      saveToLeaderboard({ company: company.trim(), overallScore: results.overallScore, aiReadinessScore: results.aiReadinessScore, date: new Date().toISOString() })
      onResults(company.trim(), results)
    } catch (e) { setError('Analysis failed: ' + e.message) }
    finally { setLoading(false) }
  }

  return (
    <div style={{ paddingTop:48 }}>
      <div style={{ textAlign:'center', marginBottom:44 }}>
        <div style={{ fontSize:11, fontFamily:'monospace', color:'#7c5cbf', letterSpacing:'0.2em', marginBottom:14 }}>VERTICAL SOFTWARE MOAT EVALUATOR</div>
        <h1 style={{ fontSize:'clamp(26px,5vw,42px)', fontWeight:800, letterSpacing:'-0.03em', lineHeight:1.1, marginBottom:14 }}>
          How defensible is<br/>your vertical software?
        </h1>
        <p style={{ fontSize:15, color:'rgba(255,255,255,0.4)', lineHeight:1.65, maxWidth:460, margin:'0 auto' }}>
          Evaluate against Bustamante's 10-moat framework — separating vertical software that survives the LLM era from software that doesn't.
        </p>
      </div>

      <div style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:16, padding:28, maxWidth:560, margin:'0 auto' }}>
        <label style={labelStyle}>COMPANY NAME</label>
        <input className="input-field" value={company} onChange={e => setCompany(e.target.value)} placeholder="e.g. Veeva, Procore, Clio…" style={{ marginBottom:18 }}/>
        <label style={labelStyle}>COMPANY DESCRIPTION</label>
        <textarea className="input-field" value={desc} onChange={e => setDesc(e.target.value)}
          placeholder="Describe the product, data assets, integrations, regulations, what makes customers stay…"
          style={{ minHeight:130, resize:'vertical', lineHeight:1.6, marginBottom:8 }}/>
        <div style={{ fontSize:12, color:'rgba(255,255,255,0.22)', marginBottom:20 }}>The more detail, the sharper the analysis.</div>
        {error && <div style={{ color:'#ff6b6b', fontSize:13, marginBottom:14, padding:'9px 13px', background:'rgba(255,107,107,0.08)', borderRadius:7 }}>{error}</div>}
        <button className="btn-primary" onClick={run} disabled={loading} style={{ opacity:loading?0.5:1 }}>
          {loading ? 'Analyzing…' : 'Analyze Moat Strength →'}
        </button>
      </div>

      <div style={{ maxWidth:560, margin:'36px auto 0' }}>
        <div style={{ fontSize:11, color:'rgba(255,255,255,0.22)', marginBottom:14, letterSpacing:'0.12em', fontFamily:'monospace' }}>10 MOATS EVALUATED</div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
          {MOATS.map(m => {
            const risk = RISK[m.llmRisk]
            return (
              <div key={m.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 13px', background:'rgba(255,255,255,0.02)', borderRadius:8, border:'1px solid rgba(255,255,255,0.05)' }}>
                <span style={{ fontSize:17 }}>{m.icon}</span>
                <div>
                  <div style={{ fontSize:12, fontWeight:600 }}>{m.name}</div>
                  <div style={{ fontSize:10, color:risk.color }}>{risk.label}</div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function ResultsView({ company, results, onReset }) {
  const printRef  = useRef(null)
  const [copied, setCopied] = useState(false)
  const [toast, setToast]   = useState('')

  useEffect(() => {
    // Reflect state in URL hash for sharing
    const payload = encodeShare({ company, results })
    if (payload) window.location.hash = payload
  }, [company, results])

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true); setToast('Link copied!')
      setTimeout(() => { setCopied(false); setToast('') }, 3000)
    } catch {
      setToast('Copy: ' + window.location.href.slice(0, 60) + '…')
    }
  }

  const handlePrint = () => window.print()

  return (
    <>
      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:24, flexWrap:'wrap' }}>
        <button className="btn-secondary" onClick={() => { window.location.hash=''; onReset() }}>← Back</button>
        <div style={{ flex:1 }}/>
        <button className="btn-secondary" onClick={handlePrint} title="Print / Save as PDF">🖨️ Export PDF</button>
        <button className="btn-secondary" onClick={handleShare} style={{ minWidth:120, background: copied ? 'rgba(107,203,119,0.15)' : undefined }}>
          {copied ? '✓ Copied!' : '🔗 Share Link'}
        </button>
      </div>

      {toast && (
        <div style={{ padding:'10px 16px', background:'rgba(107,203,119,0.12)', border:'1px solid rgba(107,203,119,0.2)', borderRadius:8, marginBottom:16, fontSize:13, color:'#6bcb77' }}>
          {toast}
        </div>
      )}

      <Scorecard company={company} results={results} printRef={printRef}/>

      <div style={{ marginTop:16, padding:'20px 24px', background:'rgba(255,255,255,0.018)', border:'1px solid rgba(255,255,255,0.05)', borderRadius:12 }}>
        <div style={{ fontSize:11, fontWeight:700, color:'rgba(255,255,255,0.25)', letterSpacing:'0.12em', marginBottom:10 }}>FRAMEWORK</div>
        <p style={{ fontSize:13, color:'rgba(255,255,255,0.4)', lineHeight:1.7 }}>
          Based on Nicolas Bustamante's X article <em>"10 Years Building Vertical Software: My Perspective on the Selloff."</em> He built Doctrine (Europe's largest legal platform) and Fintool (AI equity research) — giving him a unique perspective on both sides of the LLM disruption. Core insight: AI is dismantling moats built on interface complexity, workflow encoding, and public data search — while proprietary data, regulatory compliance, and transaction infrastructure remain defensible.
        </p>
      </div>
    </>
  )
}

function CompareView() {
  const [a, setA]           = useState({ company:'', desc:'' })
  const [b, setB]           = useState({ company:'', desc:'' })
  const [resultsA, setRA]   = useState(null)
  const [resultsB, setRB]   = useState(null)
  const [loadingA, setLA]   = useState(false)
  const [loadingB, setLB]   = useState(false)
  const [errorA, setEA]     = useState('')
  const [errorB, setEB]     = useState('')

  const runA = async () => {
    if (!a.company || !a.desc) { setEA('Fill in both fields.'); return }
    setEA(''); setLA(true)
    try {
      const r = await runAnalysis(a.company, a.desc)
      saveToLeaderboard({ company:a.company, overallScore:r.overallScore, aiReadinessScore:r.aiReadinessScore, date:new Date().toISOString() })
      setRA(r)
    } catch(e) { setEA(e.message) }
    finally { setLA(false) }
  }

  const runB = async () => {
    if (!b.company || !b.desc) { setEB('Fill in both fields.'); return }
    setEB(''); setLB(true)
    try {
      const r = await runAnalysis(b.company, b.desc)
      saveToLeaderboard({ company:b.company, overallScore:r.overallScore, aiReadinessScore:r.aiReadinessScore, date:new Date().toISOString() })
      setRB(r)
    } catch(e) { setEB(e.message) }
    finally { setLB(false) }
  }

  const bothDone = resultsA && resultsB

  return (
    <div>
      <div style={{ textAlign:'center', marginBottom:32 }}>
        <h2 style={{ fontSize:22, fontWeight:800, letterSpacing:'-0.02em', marginBottom:8 }}>Side-by-Side Comparison</h2>
        <p style={{ color:'rgba(255,255,255,0.4)', fontSize:14 }}>Analyze two companies independently, then compare moat by moat.</p>
      </div>

      <div style={{ display:'flex', gap:16, flexWrap:'wrap', marginBottom:32 }}>
        <CompanyInput label="COMPANY A" value={a.company} desc={a.desc}
          onName={v => setA(p => ({...p, company:v}))} onDesc={v => setA(p => ({...p, desc:v}))}
          loading={loadingA} onRun={runA} error={errorA}/>
        <CompanyInput label="COMPANY B" value={b.company} desc={b.desc}
          onName={v => setB(p => ({...p, company:v}))} onDesc={v => setB(p => ({...p, desc:v}))}
          loading={loadingB} onRun={runB} error={errorB}/>
      </div>

      {bothDone && (
        <>
          {/* Header scores */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:28 }}>
            {[{company:a.company, r:resultsA}, {company:b.company, r:resultsB}].map(({company:c, r}, ci) => (
              <div key={ci} style={{ padding:'20px 24px', background:`linear-gradient(135deg,${ci===0?'rgba(124,92,191,0.12)':'rgba(91,171,202,0.12)'},transparent)`, border:`1px solid ${ci===0?'rgba(124,92,191,0.25)':'rgba(91,171,202,0.25)'}`, borderRadius:14, textAlign:'center' }}>
                <div style={{ fontSize:16, fontWeight:800, marginBottom:14 }}>{c}</div>
                <div style={{ display:'flex', justifyContent:'center', gap:20 }}>
                  <div><div style={{ fontSize:10, color:'rgba(255,255,255,0.3)', marginBottom:4 }}>MOAT</div><ScoreArc score={r.overallScore} size={90}/></div>
                  <div><div style={{ fontSize:10, color:'rgba(255,255,255,0.3)', marginBottom:4 }}>AI READY</div><ScoreArc score={r.aiReadinessScore} size={90}/></div>
                </div>
              </div>
            ))}
          </div>

          {/* Moat-by-moat diff */}
          <div style={{ fontSize:11, color:'rgba(255,255,255,0.22)', letterSpacing:'0.14em', marginBottom:12, fontFamily:'monospace' }}>MOAT COMPARISON — tap rows to expand</div>
          <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:32 }}>
            {MOATS.map(moat => {
              const sA = resultsA.moats?.[moat.id]?.score ?? 0
              const sB = resultsB.moats?.[moat.id]?.score ?? 0
              const diff = sA - sB
              const winner = diff > 0 ? 'A' : diff < 0 ? 'B' : '='
              const winColor = diff > 0 ? '#7c5cbf' : diff < 0 ? '#5babca' : '#888'
              const [open, setOpen] = useState(false)
              return (
                <div key={moat.id} style={{ background:'rgba(255,255,255,0.025)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:10, overflow:'hidden', cursor:'pointer' }} onClick={() => setOpen(o=>!o)}>
                  <div style={{ padding:'12px 16px', display:'flex', alignItems:'center', gap:10 }}>
                    <span style={{ fontSize:18 }}>{moat.icon}</span>
                    <span style={{ flex:1, fontWeight:600, fontSize:13 }}>{moat.name}</span>

                    {/* Score A */}
                    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', minWidth:60 }}>
                      <Bar score={sA} color="#7c5cbf"/>
                      <span style={{ fontSize:13, fontWeight:800, color:'#7c5cbf', marginTop:3 }}>{sA}/10</span>
                    </div>

                    <div style={{ width:28, textAlign:'center', fontWeight:800, fontSize:13, color:winColor }}>
                      {winner === '=' ? '=' : winner === 'A' ? `+${diff}` : `${diff}`}
                    </div>

                    {/* Score B */}
                    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', minWidth:60 }}>
                      <Bar score={sB} color="#5babca"/>
                      <span style={{ fontSize:13, fontWeight:800, color:'#5babca', marginTop:3 }}>{sB}/10</span>
                    </div>

                    <span style={{ color:'rgba(255,255,255,0.2)', fontSize:14, transition:'transform 0.2s', transform:open?'rotate(180deg)':'none', marginLeft:4 }}>▾</span>
                  </div>

                  {open && (
                    <div style={{ padding:'0 16px 16px', borderTop:'1px solid rgba(255,255,255,0.05)', display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
                      {[{r:resultsA, company:a.company, col:'#7c5cbf'}, {r:resultsB, company:b.company, col:'#5babca'}].map(({r,company:c,col}, ci) => {
                        const moatR = r.moats?.[moat.id]
                        return (
                          <div key={ci}>
                            <div style={{ fontSize:11, fontWeight:700, color:col, marginBottom:8 }}>{c}</div>
                            {moatR?.examples?.map((e,i) => (
                              <div key={i} style={{ display:'flex', gap:7, marginBottom:4, fontSize:12, color:'rgba(255,255,255,0.6)' }}>
                                <span style={{ color:col, flexShrink:0 }}>◆</span><span>{e}</span>
                              </div>
                            ))}
                            {moatR?.recommendations?.slice(0,1).map((rec,i) => (
                              <div key={i} style={{ display:'flex', gap:7, marginTop:8, fontSize:12, color:'rgba(255,255,255,0.6)' }}>
                                <span style={{ color:'#6bcb77', flexShrink:0 }}>→</span><span>{rec}</span>
                              </div>
                            ))}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </>
      )}

      {(resultsA && !resultsB) && (
        <div style={{ color:'rgba(255,255,255,0.35)', fontSize:14, textAlign:'center', marginBottom:32 }}>← Analyze Company B to see the comparison</div>
      )}
      {(!resultsA && resultsB) && (
        <div style={{ color:'rgba(255,255,255,0.35)', fontSize:14, textAlign:'center', marginBottom:32 }}>Analyze Company A → to see the comparison</div>
      )}
    </div>
  )
}

function LeaderboardView({ onLoad }) {
  const board = loadLeaderboard().sort((a,b) => b.overallScore - a.overallScore)

  return (
    <div>
      <div style={{ textAlign:'center', marginBottom:32 }}>
        <h2 style={{ fontSize:22, fontWeight:800, letterSpacing:'-0.02em', marginBottom:8 }}>🏆 Leaderboard</h2>
        <p style={{ color:'rgba(255,255,255,0.4)', fontSize:14 }}>Companies you've analyzed, ranked by overall moat score.</p>
      </div>

      {board.length === 0 && (
        <div style={{ textAlign:'center', padding:'60px 24px', color:'rgba(255,255,255,0.25)', fontSize:15 }}>
          No analyses yet — run your first evaluation to populate the leaderboard.
        </div>
      )}

      {board.length > 0 && (
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {board.map((entry, i) => {
            const color = scoreColor(entry.overallScore)
            const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i+1}.`
            return (
              <div key={entry.company} style={{ display:'flex', alignItems:'center', gap:14, padding:'14px 18px', background:'rgba(255,255,255,0.025)', border:'1px solid rgba(255,255,255,0.06)', borderLeft:`3px solid ${color}`, borderRadius:10 }}>
                <span style={{ fontSize:18, minWidth:28, textAlign:'center' }}>{medal}</span>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:700, fontSize:15, marginBottom:4 }}>{entry.company}</div>
                  <div style={{ fontSize:12, color:'rgba(255,255,255,0.3)' }}>{new Date(entry.date).toLocaleDateString()}</div>
                </div>
                <div style={{ textAlign:'center', minWidth:60 }}>
                  <div style={{ fontSize:11, color:'rgba(255,255,255,0.3)', marginBottom:2 }}>MOAT</div>
                  <div style={{ fontWeight:800, fontSize:20, color }}>{entry.overallScore.toFixed(1)}</div>
                </div>
                <div style={{ textAlign:'center', minWidth:60 }}>
                  <div style={{ fontSize:11, color:'rgba(255,255,255,0.3)', marginBottom:2 }}>AI READY</div>
                  <div style={{ fontWeight:800, fontSize:20, color:scoreColor(entry.aiReadinessScore) }}>{entry.aiReadinessScore.toFixed(1)}</div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {board.length > 0 && (
        <div style={{ marginTop:20, textAlign:'center' }}>
          <button className="btn-secondary" onClick={() => { localStorage.removeItem(STORAGE_KEY); window.location.reload() }} style={{ fontSize:12, opacity:0.5 }}>
            Clear history
          </button>
        </div>
      )}
    </div>
  )
}

// ─── App Shell ───────────────────────────────────────────────────────────────

const labelStyle = { display:'block', fontSize:12, fontWeight:700, color:'rgba(255,255,255,0.45)', marginBottom:8, letterSpacing:'0.08em' }

const TABS = ['Analyze', 'Compare', 'Leaderboard']

export default function App() {
  const [tab, setTab]         = useState('Analyze')
  const [company, setCompany] = useState(null)
  const [results, setResults] = useState(null)

  // Restore from URL hash on load
  useEffect(() => {
    const hash = window.location.hash.slice(1)
    if (!hash) return
    const payload = decodeShare(hash)
    if (payload?.company && payload?.results) {
      setCompany(payload.company)
      setResults(payload.results)
    }
  }, [])

  const handleResults = (company, res) => {
    setCompany(company)
    setResults(res)
  }

  const handleReset = () => {
    setCompany(null)
    setResults(null)
  }

  const showResults = tab === 'Analyze' && company && results

  return (
    <div style={{ minHeight:'100vh', background:'#09090e', fontFamily:"'DM Sans',system-ui,sans-serif", color:'#fff', paddingBottom:60 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        textarea,input{outline:none;font-family:inherit}
        ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.1);border-radius:4px}
        .input-field{background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.1);border-radius:9px;padding:12px 14px;color:#fff;font-size:14px;width:100%;display:block;transition:border-color 0.2s}
        .input-field:focus{border-color:rgba(124,92,191,0.55);background:rgba(124,92,191,0.05)}
        .input-field::placeholder{color:rgba(255,255,255,0.22)}
        .btn-primary{background:linear-gradient(135deg,#7c5cbf,#5a3fa0);color:#fff;border:none;padding:13px 28px;border-radius:9px;font-size:15px;font-weight:700;cursor:pointer;transition:all 0.2s;width:100%;letter-spacing:0.02em;font-family:inherit}
        .btn-primary:hover:not(:disabled){transform:translateY(-1px);box-shadow:0 8px 24px rgba(124,92,191,0.35)}
        .btn-secondary{background:rgba(255,255,255,0.06);color:rgba(255,255,255,0.65);border:1px solid rgba(255,255,255,0.1);padding:9px 18px;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;transition:all 0.2s;font-family:inherit}
        .btn-secondary:hover{background:rgba(255,255,255,0.1)}
        @media print {
          .no-print{display:none!important}
          body{background:#fff;color:#000}
          .input-field{border:1px solid #ccc}
        }
      `}</style>

      {/* Nav */}
      <nav className="no-print" style={{ background:'rgba(255,255,255,0.02)', borderBottom:'1px solid rgba(255,255,255,0.06)', padding:'0 24px', display:'flex', alignItems:'center', gap:16, height:56 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginRight:16 }}>
          <div style={{ width:32, height:32, borderRadius:8, background:'linear-gradient(135deg,#7c5cbf,#5a3fa0)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16 }}>🏰</div>
          <span style={{ fontWeight:800, fontSize:15, letterSpacing:'-0.01em' }}>MoatScore</span>
        </div>

        {TABS.map(t => (
          <button key={t} onClick={() => { setTab(t); if(t!=='Analyze') handleReset() }}
            style={{ background:'none', border:'none', color: tab===t ? '#fff' : 'rgba(255,255,255,0.4)', fontWeight: tab===t ? 700 : 500, fontSize:14, cursor:'pointer', padding:'4px 2px', borderBottom: tab===t ? '2px solid #7c5cbf' : '2px solid transparent', transition:'all 0.15s', fontFamily:'inherit' }}>
            {t}
          </button>
        ))}

        <div style={{ flex:1 }}/>
        <span style={{ fontSize:11, color:'rgba(255,255,255,0.2)', fontFamily:'monospace' }}>Bustamante Framework</span>
      </nav>

      <div style={{ maxWidth:780, margin:'0 auto', padding:'0 20px' }}>
        {tab === 'Analyze' && !showResults && <HomeView onResults={handleResults}/>}
        {tab === 'Analyze' && showResults  && <ResultsView company={company} results={results} onReset={handleReset}/>}
        {tab === 'Compare'     && <div style={{ paddingTop:40 }}><CompareView/></div>}
        {tab === 'Leaderboard' && <div style={{ paddingTop:40 }}><LeaderboardView/></div>}
      </div>

      <footer className="no-print" style={{ textAlign:'center', padding:'20px 24px', borderTop:'1px solid rgba(255,255,255,0.06)', marginTop:40, fontSize:12, color:'rgba(255,255,255,0.25)' }}>
        Created by Ramesh
      </footer>
    </div>
  )
}
