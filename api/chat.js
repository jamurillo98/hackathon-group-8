// ─── M1: Vercel Serverless Function ──────────────────────────────────────────
// Route: POST /api/chat
// Proxies requests to OpenAI so the API key never reaches the browser.
// The OPENAI_KEY environment variable must be set in the Vercel project settings.
// ─────────────────────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }
  try {
    const upstream = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // TODO (M1): set OPENAI_KEY in Vercel project environment variables
        'Authorization': 'Bearer ' + process.env.OPENAI_KEY,
      },
      body: JSON.stringify(req.body),
    })
    const data = await upstream.json()
    return res.status(200).json(data)
  } catch (e) {
    return res.status(500).json({ error: 'Upstream call failed' })
  }
}
