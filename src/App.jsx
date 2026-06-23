import React, { useState, useRef } from 'react'
import Layout from './components/Layout.jsx'
// M2 TODO: ScenarioInput — future refinements: character limit indicator, validation styling
import ScenarioInput from './components/ScenarioInput.jsx'
// M2 TODO: CameraFeed — future refinements: mirror transform, loading spinner while stream starts
import CameraFeed from './components/CameraFeed.jsx'
// M2 TODO: FigurineScene — future refinements: loading state, transition animation when scenario changes
import FigurineScene from './components/FigurineScene.jsx'
// M2 TODO: RecordingControls — future refinements: elapsed timer display, confirmation before stop
import RecordingControls from './components/RecordingControls.jsx'
// M4: AI dialogue engine — provides reply(), speak(), getFeedback(), reset()
import { createDialogue } from './ai/dialogue.js'

// ─── M2: UI Integration Shell ────────────────────────────────────────────────
// Wires all M2 UI components together and connects M4 AI dialogue logic.
// M1 camera / recording hooks are marked with TODO (M1) comments below.
// ─────────────────────────────────────────────────────────────────────────────

export default function App() {
  // ── M2: UI state ────────────────────────────────────────────────────────────
  const [scenario, setScenario]         = useState('')
  const [isRecording, setIsRecording]   = useState(false)
  const [hasRecording, setHasRecording] = useState(false)
  const [clientMood, setClientMood]     = useState(null)   // M4: last known client mood
  const [feedback, setFeedback]         = useState('')     // M4: end-of-session feedback

  // ── M1 placeholder: replace null with live MediaStream from getUserMedia ────
  const [videoStream] = useState(null)

  // ── M4: single dialogue instance per session ─────────────────────────────────
  const dialogueRef = useRef(null)

  // ── M1 + M4: called when the student submits a scenario ─────────────────────
  // TODO (M1): initialise camera stream (getUserMedia) here if not already active.
  // TODO (M1): trigger figurine/scene reset for the new scenario (M3 hook).
  function handleStartSession(scenarioText) {
    setScenario(scenarioText)
    setFeedback('')
    setClientMood(null)
    // M4: create a fresh dialogue engine for the new scenario
    dialogueRef.current = createDialogue()
  }

  // ── M1 placeholder: start recording ─────────────────────────────────────────
  // TODO (M1): initialise MediaRecorder with videoStream and begin capture.
  // TODO (M1): call getUserMedia first if videoStream is still null.
  function handleStartRecording() {
    setIsRecording(true)
  }

  // ── M1 placeholder: stop recording ──────────────────────────────────────────
  // TODO (M1): stop MediaRecorder and collect the recorded Blob.
  // TODO (M1): store the Blob in a ref so handleDownload can reference it.
  // M4: also fetch end-of-session coaching feedback when the student stops
  async function handleStopRecording() {
    setIsRecording(false)
    setHasRecording(true)
    if (dialogueRef.current && scenario) {
      // M4: non-blocking — fetch feedback in the background
      dialogueRef.current.getFeedback(scenario).then(setFeedback)
    }
  }

  // ── M1 placeholder: download the recording ───────────────────────────────────
  // TODO (M1): create an object URL from the recorded Blob and trigger download.
  // TODO (M1): revoke the object URL after download to free memory.
  function handleDownload() {
    alert('Download triggered — recording pipeline not yet connected.')
  }

  // ── M2: Render ───────────────────────────────────────────────────────────────
  return (
    <Layout>
      <div className="mx-auto w-full max-w-5xl flex-1 p-4 lg:p-6 flex flex-col gap-6">

        {/* ── Page header ── */}
        <div className="rounded-2xl bg-white px-6 py-4 shadow-sm border border-gray-100">
          <h2 className="text-base font-semibold text-gray-700">Session Workspace</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Enter a scenario, review the camera feed, and control recording below.
          </p>
        </div>

        {/* ── Main two-column grid ── */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

          {/* ── Left column: Scenario Input + Camera Feed ── */}
          <section className="flex flex-col gap-4" aria-label="Input and Camera">
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 px-1">
              Input &amp; Camera
            </p>
            {/* M2: scenario text entry — calls handleStartSession on submit */}
            <ScenarioInput onStart={handleStartSession} />
            {/* M1 placeholder: videoStream null → shows placeholder UI */}
            <CameraFeed stream={videoStream} />
          </section>

          {/* ── Right column: Figurine Scene + Recording Controls ── */}
          <section className="flex flex-col gap-4" aria-label="Scene and Recording">
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 px-1">
              Virtual Client &amp; Recording
            </p>
            {/* M3 placeholder: FigurineScene receives scene/AI data later */}
            <FigurineScene scenario={scenario} />

            {/* M4: client mood badge — shown after first AI reply */}
            {clientMood && (
              <div className="flex items-center gap-2 rounded-xl bg-indigo-50 px-4 py-2 text-sm text-indigo-700 border border-indigo-100">
                <span className="font-semibold">Client mood:</span>
                <span className="capitalize">{clientMood}</span>
              </div>
            )}

            <hr className="border-gray-200" />

            {/* M2: recording controls wired to M1 placeholder handlers */}
            <RecordingControls
              onStart={handleStartRecording}
              onStop={handleStopRecording}
              onDownload={hasRecording ? handleDownload : undefined}
              isRecording={isRecording}
            />

            {/* M4: end-of-session feedback — shown after recording stops */}
            {feedback && (
              <div className="rounded-2xl bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-800 whitespace-pre-wrap">
                <p className="font-semibold mb-1">Session Feedback</p>
                {feedback}
              </div>
            )}
          </section>

        </div>
      </div>
    </Layout>
  )
}
