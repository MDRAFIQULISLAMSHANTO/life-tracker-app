const GEMINI_MODEL = 'gemini-3-flash-preview'
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`

export async function POST(req) {
  try {
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

    const res = await fetch(`${GEMINI_URL}?key=${process.env.GEMINI_API_KEY}`, {
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
