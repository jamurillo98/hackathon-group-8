import React, { useState } from 'react'
import Layout from './components/Layout.jsx'
import ScenarioInput from './components/ScenarioInput.jsx'
import CameraFeed from './components/CameraFeed.jsx'
import FigurineScene from './components/FigurineScene.jsx'
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
  function handleStartRecording() {
    setIsRecording(true)
  }

  // ── M1 placeholder: stop recording the session ────────────────────────────
  // TODO (M1): stop MediaRecorder and collect recorded Blob here.
  function handleStopRecording() {
    setIsRecording(false)
    setHasRecording(true)
  }

  // ── M1 placeholder: download the recorded session ─────────────────────────
  // TODO (M1): create an object URL from the recorded Blob and trigger download.
  function handleDownload() {
    alert('Download triggered — recording pipeline not yet connected.')
  }

  // ── M2: Render ──────────────────────────────────────────────────────────────
  return (
    <Layout>
      <div className="mx-auto w-full max-w-5xl flex-1 p-4 lg:p-6">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">

          {/* ── Left column: input + camera ── */}
          <div className="flex flex-col gap-4">
            {/* M2: scenario text entry — calls handleStartSession on submit */}
            <ScenarioInput onStart={handleStartSession} />

            {/* M1 placeholder: videoStream will be a live MediaStream once
                camera access is granted; null renders the placeholder UI */}
            <CameraFeed stream={videoStream} />
          </div>

          {/* ── Right column: scene + recording controls ── */}
          <div className="flex flex-col gap-4">
            {/* M3 placeholder: FigurineScene will receive scene/AI data later;
                for now it displays the active scenario label */}
            <FigurineScene scenario={scenario} />

            {/* M2: recording controls wired to M1 placeholder handlers */}
            <RecordingControls
              onStart={handleStartRecording}
              onStop={handleStopRecording}
              onDownload={hasRecording ? handleDownload : undefined}
              isRecording={isRecording}
            />
          </div>

        </div>
      </div>
    </Layout>
  )
}
