const GEMINI_MODEL = 'gemini-3-flash-preview'
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`

const IDENTITY_LOOKUP = 'https://identitytoolkit.googleapis.com/v1/accounts:lookup'

/**
 * Verify a Firebase ID token without pulling in firebase-admin (which would need
 * a service-account secret this project doesn't have). accounts:lookup rejects
 * expired/forged tokens, so a success response proves the caller is signed in.
 * Results are cached briefly so a chat burst is one lookup, not one per message.
 */
const tokenCache = new Map() // idToken -> { uid, expires }
const TOKEN_TTL_MS = 5 * 60 * 1000

async function verifyIdToken(idToken) {
  const now = Date.now()
  const hit = tokenCache.get(idToken)
  if (hit && hit.expires > now) return hit.uid

  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY
  if (!apiKey) return null

  const res = await fetch(`${IDENTITY_LOOKUP}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken }),
  })
  if (!res.ok) return null
  const data = await res.json()
  const uid = data?.users?.[0]?.localId
  if (!uid) return null

  if (tokenCache.size > 500) tokenCache.clear()
  tokenCache.set(idToken, { uid, expires: now + TOKEN_TTL_MS })
  return uid
}

/**
 * Per-uid sliding window. In-memory, so it is per serverless instance rather
 * than global — enough to stop a single client hammering the key, not a
 * distributed quota. Move to Firestore/Redis if this ever runs at scale.
 */
const RATE_LIMIT = 20
const RATE_WINDOW_MS = 60 * 1000
const hits = new Map() // uid -> number[] (timestamps)

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

export async function POST(req) {
  try {
    const authHeader = req.headers.get('authorization') || ''
    const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : ''
    if (!idToken) {
      return Response.json({ error: 'Sign in to use the AI advisor.' }, { status: 401 })
    }

    const uid = await verifyIdToken(idToken)
    if (!uid) {
      return Response.json({ error: 'Session expired. Sign in again.' }, { status: 401 })
    }

    if (rateLimited(uid)) {
      return Response.json(
        { error: 'Too many messages. Wait a minute and try again.' },
        { status: 429 }
      )
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.Gemini_api_key
    if (!apiKey || apiKey === 'your_gemini_api_key_here') {
      return Response.json({ error: 'GEMINI_API_KEY not configured on server. Add it to Vercel environment variables.' }, { status: 500 })
    }

    const { messages, financeContext } = await req.json()

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return Response.json({ error: 'messages array required' }, { status: 400 })
    }

    const systemPrompt = `You are Livio AI, a personal financial advisor embedded in the Livio finance app. You help users understand their financial situation and make better decisions.

Personality:
- Warm, direct, and practical — like a trusted friend who happens to be a financial expert
- Use clear language, avoid jargon unless explaining it
- Be encouraging but honest about risks
- Keep responses concise (2-4 paragraphs max unless asked for detail)

User's current financial snapshot:
${financeContext ? JSON.stringify(financeContext, null, 2) : 'No data available yet'}

Your capabilities:
- Analyze spending patterns and trends
- Suggest investment strategies appropriate for the user's income level
- Give loan management advice (when to take, how to repay)
- Identify areas where the user is overspending
- React to their financial actions with honest assessments
- Suggest savings goals based on their income/expense ratio

Always relate your advice to the user's actual numbers when data is available. If no data exists, guide them on how to use Livio to track their finances.`

    // Build contents — Gemini requires alternating user/model turns starting with user
    const allButLast = messages.slice(0, -1)
    const firstUserIdx = allButLast.findIndex((m) => m.role === 'user')
    const history = firstUserIdx >= 0 ? allButLast.slice(firstUserIdx) : []

    const contents = [
      ...history.map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      })),
      {
        role: 'user',
        parts: [{ text: messages[messages.length - 1].content }],
      },
    ]

    const res = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents,
        generationConfig: { maxOutputTokens: 1024, temperature: 0.7 },
      }),
    })

    const data = await res.json()

    if (!res.ok) {
      const msg = data?.error?.message || `Gemini error ${res.status}`
      console.error('[AI chat error]', msg)
      return Response.json({ error: msg }, { status: res.status })
    }

    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || ''
    return Response.json({ reply: text })
  } catch (err) {
    console.error('[AI chat error]', err)
    return Response.json({ error: err.message || 'AI service error' }, { status: 500 })
  }
}
