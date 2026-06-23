import { useEffect, useState } from "react";

export default function SpeechInput({ onTranscript }) {
  const [listening, setListening] = useState(false);

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.error("Speech recognition not supported");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;

    recognition.onresult = (event) => {
      const transcript = event.results[event.results.length - 1][0].transcript;
      onTranscript(transcript);
    };

    if (listening) recognition.start();
    else recognition.stop();

    return () => recognition.stop();
  }, [listening]);

  return (
    <button
      onClick={() => setListening(!listening)}
      className="mt-3 bg-purple-600 text-white px-4 py-2 rounded"
    >
      {listening ? "Stop Listening" : "Start Listening"}
    </button>
  );
}
