import React, { useState } from 'react'
import Layout from './components/Layout.jsx'
// M2 TODO: ScenarioInput — future refinements: character limit indicator, validation styling
import ScenarioInput from './components/ScenarioInput.jsx'
// M2 TODO: CameraFeed — future refinements: mirror transform, loading spinner while stream starts
import CameraFeed from './components/CameraFeed.jsx'
// M2 TODO: FigurineScene — future refinements: loading state, transition animation when scenario changes
import FigurineScene from './components/FigurineScene.jsx'
// M2 TODO: RecordingControls — future refinements: elapsed timer display, confirmation before stop
import RecordingControls from './components/RecordingControls.jsx'

// ─── M2: UI Integration Shell ────────────────────────────────────────────────
// This file wires all M2 UI components together and provides placeholder hooks
// for M1 (Integrator) to connect camera capture and recording logic.
// ─────────────────────────────────────────────────────────────────────────────

export default function App() {
  // ── M2: UI state ────────────────────────────────────────────────────────────
  const [scenario, setScenario] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [hasRecording, setHasRecording] = useState(false)

  // ── M1 placeholder: replace null with the live MediaStream once camera is
  //    initialised (e.g. via navigator.mediaDevices.getUserMedia) ───────────
  const [videoStream] = useState(null)

  // ── M1 placeholder: called when the student submits a scenario ─────────────
  // TODO (M1): trigger AI/figurine session initialisation here.
  function handleStartSession(scenarioText) {
    setScenario(scenarioText)
  }

  // ── M1 placeholder: start recording the session ───────────────────────────
  // TODO (M1): initialise MediaRecorder and begin capturing stream here.
  // TODO (M1): call getUserMedia if videoStream is still null at this point.
  function handleStartRecording() {
    setIsRecording(true)
  }

  // ── M1 placeholder: stop recording the session ────────────────────────────
  // TODO (M1): stop MediaRecorder and collect recorded Blob here.
  // TODO (M1): store the Blob in state so handleDownload can reference it.
  function handleStopRecording() {
    setIsRecording(false)
    setHasRecording(true)
  }

  // ── M1 placeholder: download the recorded session ─────────────────────────
  // TODO (M1): create an object URL from the recorded Blob and trigger download.
  // TODO (M1): revoke the object URL after download to free memory.
  function handleDownload() {
    alert('Download triggered — recording pipeline not yet connected.')
  }

  // ── M2: Render ──────────────────────────────────────────────────────────────
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
            {/* M2: section label */}
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 px-1">
              Input &amp; Camera
            </p>

            {/* M2: scenario text entry — calls handleStartSession on submit */}
            <ScenarioInput onStart={handleStartSession} />

            {/* M1 placeholder: videoStream will be a live MediaStream once
                camera access is granted; null renders the placeholder UI */}
            <CameraFeed stream={videoStream} />
          </section>

          {/* ── Right column: Figurine Scene + Recording Controls ── */}
          <section className="flex flex-col gap-4" aria-label="Scene and Recording">
            {/* M2: section label */}
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 px-1">
              Virtual Client &amp; Recording
            </p>

            {/* M3 placeholder: FigurineScene will receive scene/AI data later;
                for now it displays the active scenario label */}
            <FigurineScene scenario={scenario} />

            {/* ── Divider ── */}
            <hr className="border-gray-200" />

            {/* M2: recording controls wired to M1 placeholder handlers */}
            <RecordingControls
              onStart={handleStartRecording}
              onStop={handleStopRecording}
              onDownload={hasRecording ? handleDownload : undefined}
              isRecording={isRecording}
            />
          </section>

        </div>
      </div>
    </Layout>
  )
}
