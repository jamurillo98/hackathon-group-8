export default async function handler(req, res) {
  // Only allow POST.
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  try {
    const upstream = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // the key comes from Vercel's environment, NOT from the browser, NOT from git
        "Authorization": "Bearer " + process.env.OPENAI_KEY,
      },
      // pass the browser's request body straight through (model, messages, etc.)
      body: JSON.stringify(req.body),
    });
    const data = await upstream.json();
    return res.status(200).json(data);
  } catch (e) {
    return res.status(500).json({ error: "Upstream call failed" });
  }
}
