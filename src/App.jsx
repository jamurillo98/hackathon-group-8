import React, { useState } from 'react'
import Layout from './components/Layout.jsx'
import ScenarioInput from './components/ScenarioInput.jsx'
import CameraFeed from './components/CameraFeed.jsx'
import Scene from './scene/Scene.jsx'
import RecordingControls from './components/RecordingControls.jsx'
import Recorder from './components/Recorder.jsx'

export default function App() {
  const [activeScenario, setActiveScenario] = useState('')
  const [stream, setStream] = useState(null)
  const [aiResponse, setAiResponse] = useState(null)
  const [isRecording, setIsRecording] = useState(false)
  const [hasRecording, setHasRecording] = useState(false)

  function handleStart(scenarioText) {
    setActiveScenario(scenarioText)
  }

  function handleRecordStart() {
    setIsRecording(true)
  }

  function handleRecordStop() {
    setIsRecording(false)
    setHasRecording(true)
  }

  function handleDownload() {
    // Placeholder: real download logic lives in the recording pipeline (M1)
    alert('Download triggered — recording pipeline not yet connected.')
  }

  return (
    <Layout>
      <div className="mx-auto w-full max-w-5xl flex-1 p-4 lg:p-6">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* Left column */}
          <div className="flex flex-col gap-4">
            <ScenarioInput onStart={handleStart} />
            <CameraFeed onStreamReady={setStream} />
          </div>

          {/* Right column */}
          <div className="flex flex-col gap-4">
            <Scene scenario={activeScenario} aiResponse={aiResponse} />
            <RecordingControls
              onStart={handleRecordStart}
              onStop={handleRecordStop}
              onDownload={hasRecording ? handleDownload : undefined}
              isRecording={isRecording}
            />
            <div className="pt-2">
              <Recorder stream={stream} />
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
