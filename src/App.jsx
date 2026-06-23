import React, { useState, useRef, useCallback } from 'react'
import Layout from './components/Layout.jsx'
import ScenarioInput from './components/ScenarioInput.jsx'
import CameraFeed from './components/CameraFeed.jsx'
import RecordingControls from './components/RecordingControls.jsx'
import SceneView from './scene/SceneView.jsx'
import { createDialogue } from './ai/dialogue.js'

// ─── Fully wired app: scenario -> speech/typed -> AI (reply+mood) -> 3D + TTS,
//     live transcript, end-of-session AI coaching, camera, recording/download ───
export default function App() {
  const [scenario, setScenario]       = useState('')
  const [sessionActive, setSession]   = useState(false)
  const [mood, setMood]               = useState('calm')
  const [speaking, setSpeaking]       = useState(false)
  const [status, setStatus]           = useState('Enter a scenario to begin.')
  const [isRecording, setIsRecording] = useState(false)
  const [hasRecording, setHasRecording] = useState(false)
  const [videoStream, setVideoStream] = useState(null)
  const [transcript, setTranscript]   = useState([])   // {who:'you'|'client', text}
  const [typed, setTyped]             = useState('')
  const [feedback, setFeedback]       = useState('')
  const [loadingFb, setLoadingFb]     = useState(false)
  const [askRecord, setAskRecord]     = useState(false)   // record-or-not modal
  const pendingScenarioRef            = useRef('')         // scenario waiting on the modal choice

  const dlgRef      = useRef(null)
  const recorderRef = useRef(null)
  const chunksRef   = useRef([])
  const blobRef     = useRef(null)
  const streamRef   = useRef(null)
  const recRef      = useRef(null)

  const startCamera = useCallback(async () => {
    if (streamRef.current) return streamRef.current
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      streamRef.current = stream
      setVideoStream(stream)
      return stream
    } catch {
      setStatus('Camera/mic unavailable. You can still type to talk.')
      return null
    }
  }, [])

  // Clicking Start Session opens the record-or-not popup first.
  function handleStartSession(scenarioText) {
    if (!scenarioText.trim()) return
    pendingScenarioRef.current = scenarioText
    setAskRecord(true)
  }

  // The popup choice actually begins the session, optionally auto-recording.
  async function beginSession(withRecording) {
    const scenarioText = pendingScenarioRef.current
    setAskRecord(false)
    if (!scenarioText) return
    setScenario(scenarioText)
    dlgRef.current = createDialogue()
    setSession(true)
    setMood('calm')
    setTranscript([])
    setFeedback('')
    setStatus('Session started. Talk or type to the client.')
    await startCamera()
    if (withRecording) await handleStartRecording()
  }

  // One turn: studentText -> AI {reply, mood} -> transcript + animate + speak
  async function runTurn(studentText) {
    if (!dlgRef.current || !studentText) return
    setTranscript((t) => [...t, { who: 'you', text: studentText }])
    setStatus('Client is thinking…')
    let reply = '', m = 'calm'
    try {
      const r = await dlgRef.current.reply(scenario, studentText)
      reply = r.reply; m = r.mood || 'calm'
    } catch {
      reply = "Sorry, I didn't quite catch that, could you say it again?"; m = 'confused'
    }
    setMood(m)
    setTranscript((t) => [...t, { who: 'client', text: reply }])
    setStatus('Client (' + m + ') is speaking…')
    setSpeaking(true)
    dlgRef.current.speak(reply, () => { setSpeaking(false); setStatus('Your turn.') })
  }

  function sendTyped() {
    const t = typed.trim()
    if (!t) return
    setTyped('')
    runTurn(t)
  }

  function listen() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) { setStatus('Speech not supported here. Use Chrome/Edge, or type below.'); return }
    if (recRef.current) { try { recRef.current.abort() } catch {} recRef.current = null }
    const rec = new SR()
    recRef.current = rec
    rec.lang = 'en-AU'; rec.interimResults = false; rec.continuous = false
    setStatus('Listening… speak now.')
    rec.onresult = (e) => runTurn(e.results[0][0].transcript)
    rec.onerror  = (e) => { if (e.error !== 'aborted') setStatus('Mic: ' + e.error + ' (or type below)') }
    rec.onend    = () => { recRef.current = null }
    try { rec.start() } catch {}
  }

  // End session -> AI coaching feedback (uses dialogue.getFeedback)
  async function endSession() {
    if (!dlgRef.current) return
    setLoadingFb(true)
    setStatus('Generating your coaching feedback…')
    try {
      const fb = await dlgRef.current.getFeedback(scenario)
      setFeedback(fb)
    } catch {
      setFeedback('Feedback unavailable right now. Review your transcript: where did you acknowledge the client’s emotion, and where could you have asked one more question?')
    }
    setLoadingFb(false)
    setStatus('Session ended. See your coaching feedback below.')
  }

  // Recording
  async function handleStartRecording() {
    const stream = await startCamera()
    if (!stream) { setStatus('No camera/mic to record.'); return }
    chunksRef.current = []
    let mr
    try { mr = new MediaRecorder(stream, { mimeType: 'video/webm' }) }
    catch { mr = new MediaRecorder(stream) }
    mr.ondataavailable = (e) => { if (e.data && e.data.size) chunksRef.current.push(e.data) }
    mr.onstop = () => {
      blobRef.current = new Blob(chunksRef.current, { type: 'video/webm' })
      setHasRecording(true)
      setStatus('Recording ready. Click Download.')
    }
    mr.start()
    recorderRef.current = mr
    setIsRecording(true)
    setStatus('Recording…')
  }
  function handleStopRecording() {
    try { recorderRef.current?.stop() } catch {}
    setIsRecording(false)
  }
  function handleDownload() {
    if (!blobRef.current) { setStatus('Nothing recorded yet.'); return }
    const url = URL.createObjectURL(blobRef.current)
    const a = document.createElement('a')
    a.href = url
    a.download = 'virtual-client-session.webm'
    document.body.appendChild(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 2000)
  }

  return (
    <Layout>
      {/* Record-or-not popup, shown when a session is starting */}
      {askRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-800">Record this session?</h3>
            <p className="mt-1 text-sm text-gray-500">
              You can record your conversation (camera and microphone) to review or download afterwards.
              Recording starts automatically if you choose Yes.
            </p>
            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => beginSession(false)}
                className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50 active:scale-95"
              >
                No, just practise
              </button>
              <button
                type="button"
                onClick={() => beginSession(true)}
                className="rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700 active:scale-95"
              >
                Yes, record it
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mx-auto w-full max-w-6xl flex-1 p-4 lg:p-6 flex flex-col gap-6">
        <div className="rounded-2xl bg-white px-6 py-4 shadow-sm border border-slate-100 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-slate-800">Session Workspace</h2>
            <p className="text-xs text-slate-400 mt-0.5">{status}</p>
          </div>
          <span className={
            'shrink-0 rounded-full px-3 py-1 text-[11px] font-semibold ' +
            (sessionActive ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                           : 'bg-slate-50 text-slate-400 border border-slate-100')
          }>
            {sessionActive ? '● Live session' : 'Idle'}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* LEFT: input + camera */}
          <section className="flex flex-col gap-4" aria-label="Input and Camera">
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 px-1">Input &amp; Camera</p>
            <ScenarioInput onStart={handleStartSession} />

            {sessionActive && (
              <div className="flex flex-col gap-2 rounded-2xl bg-white p-4 shadow-md">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={listen}
                    className="rounded-xl bg-teal-600 text-white px-4 py-2 text-sm font-semibold hover:bg-teal-700 active:scale-95"
                  >
                    🎙 Talk
                  </button>
                  <input
                    type="text"
                    value={typed}
                    onChange={(e) => setTyped(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') sendTyped() }}
                    placeholder="…or type what you'd say, then Enter"
                    className="flex-1 rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                  <button
                    type="button"
                    onClick={sendTyped}
                    className="rounded-xl bg-gray-100 text-gray-700 px-4 py-2 text-sm font-semibold hover:bg-gray-200 active:scale-95"
                  >
                    Send
                  </button>
                </div>
                <button
                  type="button"
                  onClick={endSession}
                  className="self-start rounded-xl border border-teal-200 text-teal-700 px-4 py-2 text-sm font-semibold hover:bg-teal-50 active:scale-95"
                >
                  End + Get Feedback
                </button>
              </div>
            )}

            <CameraFeed stream={videoStream} />
          </section>

          {/* RIGHT: scene + transcript + recording */}
          <section className="flex flex-col gap-4" aria-label="Scene and Recording">
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 px-1">Virtual Client &amp; Recording</p>
            <SceneView scenario={scenario} mood={mood} speaking={speaking} />

            {/* Live transcript */}
            {transcript.length > 0 && (
              <div className="rounded-2xl bg-white p-4 shadow-md max-h-56 overflow-y-auto flex flex-col gap-2">
                <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">Transcript</p>
                {transcript.map((m, i) => (
                  <div
                    key={i}
                    className={
                      'max-w-[85%] rounded-xl px-3 py-2 text-sm ' +
                      (m.who === 'you'
                        ? 'self-end bg-teal-50 border border-teal-100 text-gray-800'
                        : 'self-start bg-gray-50 border border-gray-200 text-gray-800')
                    }
                  >
                    <span className="block text-[10px] uppercase tracking-wide text-gray-400 mb-0.5">
                      {m.who === 'you' ? 'You' : 'Client'}
                    </span>
                    {m.text}
                  </div>
                ))}
              </div>
            )}

            <hr className="border-gray-200" />
            <RecordingControls
              onStart={handleStartRecording}
              onStop={handleStopRecording}
              onDownload={hasRecording ? handleDownload : undefined}
              isRecording={isRecording}
            />

            {/* AI coaching feedback */}
            {(loadingFb || feedback) && (
              <div className="rounded-2xl bg-emerald-50 border border-emerald-100 p-4 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-widest text-emerald-700 mb-2">Coaching Feedback</p>
                {loadingFb
                  ? <p className="text-sm text-gray-500">Analysing your conversation…</p>
                  : <p className="text-sm text-gray-800 whitespace-pre-wrap">{feedback}</p>}
              </div>
            )}
          </section>
        </div>
      </div>
    </Layout>
  )
}
