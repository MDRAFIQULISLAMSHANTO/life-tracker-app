/**
 * Generates the shared daily morning quote.
 *
 * Lazy, not cron-driven: whichever signed-in client first finds today's doc
 * missing calls this route, and every other client picks the result up through
 * its onSnapshot listener. Generation is guarded by Firestore `create()`, which
 * fails if the doc already exists — so a hundred people opening the app at 7am
 * still produce exactly one generation.
 */
import { QUOTES_COLLECTION, appDateKey } from '../../../lib/contentPaths'
import { contentDocRef, isAdminConfigured, verifyBearer } from '../../../lib/firebaseAdmin'

const GEMINI_MODEL = 'gemini-3-flash-preview'
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`

/**
 * Per-uid sliding window, matching the AI chat route. In-memory, so it is
 * per serverless instance rather than global — enough to stop one client
 * hammering the key. The `create()` guard is what actually bounds cost.
 */
const RATE_LIMIT = 5
const RATE_WINDOW_MS = 60 * 1000
const hits = new Map()

function rateLimited(uid) {
  const now = Date.now()
  const recent = (hits.get(uid) || []).filter((t) => now - t < RATE_WINDOW_MS)
  if (recent.length >= RATE_LIMIT) {
    hits.set(uid, recent)
    return true
  }
  recent.push(now)
  hits.set(uid, recent)
  if (hits.size > 1000) {
    for (const [k, v] of hits) if (!v.some((t) => now - t < RATE_WINDOW_MS)) hits.delete(k)
  }
  return false
}

const SYSTEM_PROMPT = `You write the single short quote that greets someone opening their personal money-and-growth dashboard in the morning.

Rules:
- One or two sentences. Under 200 characters. No preamble, no emoji, no hashtags.
- Grounded and practical — discipline, compounding, focus, honest self-assessment, starting small. Not saccharine hustle-culture filler.
- If you attribute it to a real person, the quote must be one they actually said. If you write it yourself, set author to null. Never invent an attribution.
- Respond with JSON only, no markdown fence: {"text": "...", "author": "..." or null, "theme": "one or two words"}`

async function generateQuote(apiKey, dateKey) {
  const res = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents: [{ role: 'user', parts: [{ text: `Today is ${dateKey}. Write today's quote.` }] }],
      generationConfig: {
        maxOutputTokens: 256,
        temperature: 1,
        responseMimeType: 'application/json',
      },
    }),
  })

  const data = await res.json()
  if (!res.ok) {
    throw new Error(data?.error?.message || `Gemini error ${res.status}`)
  }

  const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text || ''
  let parsed
  try {
    parsed = JSON.parse(raw)
  } catch {
    throw new Error('Model did not return JSON')
  }

  const text = String(parsed?.text || '').trim()
  if (!text) throw new Error('Model returned an empty quote')

  return {
    text: text.slice(0, 300),
    author: parsed?.author ? String(parsed.author).trim().slice(0, 80) : null,
    theme: parsed?.theme ? String(parsed.theme).trim().slice(0, 40) : null,
  }
}

export async function POST(req) {
  try {
    if (!isAdminConfigured()) {
      return Response.json(
        { error: 'FIREBASE_SERVICE_ACCOUNT is not configured on the server.' },
        { status: 500 }
      )
    }

    const caller = await verifyBearer(req)
    if (!caller) {
      return Response.json({ error: 'Sign in to load the daily quote.' }, { status: 401 })
    }
    if (rateLimited(caller.uid)) {
      return Response.json({ error: 'Too many requests. Try again shortly.' }, { status: 429 })
    }

    // The date key is decided here, not by the caller — otherwise any client
    // could backfill or pre-generate arbitrary days.
    const dateKey = appDateKey()
    const docRef = contentDocRef(QUOTES_COLLECTION, dateKey)

    const existing = await docRef.get()
    if (existing.exists) {
      return Response.json({ dateKey, quote: existing.data(), generated: false })
    }

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey || apiKey === 'your_gemini_api_key_here') {
      return Response.json({ error: 'GEMINI_API_KEY not configured on server.' }, { status: 500 })
    }

    const quote = await generateQuote(apiKey, dateKey)
    const payload = {
      ...quote,
      dateKey,
      model: GEMINI_MODEL,
      generatedAt: new Date().toISOString(),
    }

    try {
      await docRef.create(payload)
    } catch (e) {
      // ALREADY_EXISTS (code 6): another client won the race a moment ago.
      // Their quote is the canonical one — hand it back rather than overwriting.
      if (e?.code === 6) {
        const winner = await docRef.get()
        return Response.json({ dateKey, quote: winner.data(), generated: false })
      }
      throw e
    }

    return Response.json({ dateKey, quote: payload, generated: true })
  } catch (err) {
    // Deliberately not persisting a fallback: a bad generation written to the
    // doc would be stuck there all day. The client shows its own fallback.
    console.error('[daily-quote]', err)
    return Response.json({ error: err.message || 'Could not generate a quote' }, { status: 500 })
  }
}
