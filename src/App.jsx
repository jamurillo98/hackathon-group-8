import { useState } from "react";
import CameraFeed from "./components/CameraFeed";
import Recorder from "./components/Recorder";
import Scene from "./scene/Scene";
import SpeechInput from "./components/SpeechInput";

export default function App() {
  const [scenario, setScenario] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [stream, setStream] = useState(null);

  async function startSession() {
    if (!scenario.trim()) {
      alert("Please enter a scenario first.");
      return;
    }

    setAiResponse("Thanks for explaining. How can I help you today?");
  }

  async function handleUserSpeech(transcript) {
    // Mock AI response for hackathon
    setAiResponse(
      "I hear you. " + transcript + " — can you tell me a bit more about how you're feeling?"
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Virtual Client Interaction</h1>

      <div className="grid grid-cols-2 gap-6">
        
        {/* LEFT SIDE */}
        <div>
          <h2 className="font-semibold mb-2">Scenario</h2>
          <textarea
            className="w-full border p-2 rounded"
            placeholder="Describe the client scenario..."
            value={scenario}
            onChange={(e) => setScenario(e.target.value)}
          />

          <button
            onClick={startSession}
            className="mt-3 bg-blue-600 text-white px-4 py-2 rounded"
          >
            Start Session
          </button>

          <div className="mt-4">
            <CameraFeed onStreamReady={setStream} />
          </div>
        </div>

        {/* RIGHT SIDE */}
        <div>
          <Scene scenario={scenario} aiResponse={aiResponse} />
          <SpeechInput onTranscript={handleUserSpeech} />
          <Recorder stream={stream} />
        </div>
      </div>
    </div>
  );
}
