export function createDialogue(config = {}) {
  // The browser calls OUR backend, not OpenAI directly. The key lives on Vercel.
  const settings = {
    apiUrl:    config.apiUrl    || "/api/chat",   // our Vercel serverless function
    model:     config.model     || "gpt-4o-mini",
    voiceLang: config.voiceLang || "en-AU",
  };

  let history = [];   // conversation memory for the session

  // ---- 1. THE BRAIN: (scenario + what the student said) -> { reply, mood } ----
  async function reply(scenario, studentSaid) {
    const messages = [
      {
        role: "system",
        content:
          `You are role-playing as a CLIENT for a student to practise on. ` +
          `Character and situation: ${scenario}. Stay fully in character. ` +
          `Reply in 1 to 2 short spoken sentences, like a real person on a call. ` +
          `Return ONLY valid JSON in this exact shape, nothing else: ` +
          `{"reply":"<what you say>","mood":"<one of: calm, anxious, angry, sad, happy, confused>"}`,
      },
      ...history.map((h) => ({ role: h.role, content: h.content })),
      { role: "user", content: studentSaid },
    ];
    history.push({ role: "user", content: studentSaid });

    try {
      const res = await fetch(settings.apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: settings.model,
          messages,
          max_tokens: 100,
          response_format: { type: "json_object" },
        }),
      });
      const data = await res.json();
      const parsed = JSON.parse(data.choices[0].message.content);
      history.push({ role: "assistant", content: parsed.reply });
      return { reply: parsed.reply, mood: parsed.mood };
    } catch (e) {
      const fb = ruleBasedReply(scenario, studentSaid);
      history.push({ role: "assistant", content: fb });
      return { reply: fb, mood: moodFromScenario(scenario) };
    }
  }

  // ---- 2. SPEAK the reply out loud (browser TTS, works offline) ----
  function speak(text, onDone) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = settings.voiceLang;
    utterance.rate = 1;
    utterance.onend = () => { if (onDone) onDone(); };
    window.speechSynthesis.speak(utterance);
  }

  // ---- 3. END-OF-SESSION coaching feedback ----
  async function getFeedback(scenario) {
    const convo = history
      .map((h) => `${h.role === "user" ? "Student" : "Client"}: ${h.content}`)
      .join("\n");
    const messages = [
      {
        role: "system",
        content:
          `You are a communication-skills coach. Read this practice transcript and give ` +
          `SHORT, specific, kind feedback: 2 things the student did well and 2 to improve, ` +
          `focused on listening, empathy, clarity, and handling emotion. Address the student as "you".`,
      },
      { role: "user", content: `Scenario: ${scenario}\n\nTranscript:\n${convo}` },
    ];
    try {
      const res = await fetch(settings.apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: settings.model, messages, max_tokens: 250 }),
      });
      const data = await res.json();
      return data.choices[0].message.content.trim();
    } catch (e) {
      return "Feedback unavailable right now. Review your recording and note where you acknowledged the client's emotion and where you could have asked one more question.";
    }
  }

  function reset() { history = []; }

  // ---- FALLBACKS (no internet / no backend needed) ----
  function ruleBasedReply(scenario, studentSaid) {
    const said = studentSaid.toLowerCase();
    const s = scenario.toLowerCase();
    const anxious = /anxious|scared|worried|nervous/.test(s);
    const angry = /angry|furious|frustrated|upset/.test(s);
    if (/hello|hi|good morning|how are you/.test(said))
      return anxious ? "Oh, hi. I'm honestly a bit scared."
           : angry   ? "Finally. I've been waiting and I'm not happy."
           :           "Hi, thanks for seeing me.";
    if (/pain|hurt|breath|chest|symptom/.test(said))
      return "Yeah, it's been getting worse. What does that mean?";
    if (/down|broken|not working|system|error/.test(said))
      return "It's been down for hours and it's costing us money. When is it fixed?";
    if (/calm|okay|understand|sorry|help/.test(said))
      return anxious ? "Okay, that helps a little. Thank you."
                     : "Right, so what are you actually going to do about it?";
    return anxious ? "I'm not sure. I just want to know if I'll be okay."
         : angry   ? "Look, I just need this sorted."
         :           "Hmm, can you tell me more?";
  }

  function moodFromScenario(s) {
    s = s.toLowerCase();
    if (/anxious|scared|worried|nervous|afraid/.test(s)) return "anxious";
    if (/angry|furious|frustrated|upset|annoyed/.test(s)) return "angry";
    if (/sad|grieving|depressed|loss/.test(s)) return "sad";
    return "calm";
  }

  return { reply, speak, getFeedback, reset, settings };
}