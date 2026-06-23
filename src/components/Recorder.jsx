import { useRef, useState } from "react";

export default function Recorder() {
  const mediaRecorderRef = useRef(null);
  const recordedChunks = useRef([]);
  const [recording, setRecording] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState(null);

  async function startRecording() {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true
    });

    mediaRecorderRef.current = new MediaRecorder(stream);
    recordedChunks.current = [];

    mediaRecorderRef.current.ondataavailable = (e) => {
      if (e.data.size > 0) recordedChunks.current.push(e.data);
    };

    mediaRecorderRef.current.onstop = () => {
      const blob = new Blob(recordedChunks.current, { type: "video/webm" });
      const url = URL.createObjectURL(blob);
      setDownloadUrl(url);
    };

    mediaRecorderRef.current.start();
    setRecording(true);
  }

  function stopRecording() {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    setRecording(false);
  }

  function download() {
    if (!downloadUrl) return;
    const a = document.createElement("a");
    a.href = downloadUrl;
    a.download = "session-recording.webm";
    a.click();
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={startRecording}
        disabled={recording}
        className="bg-green-500 text-white px-4 py-2 rounded"
      >
        Start Recording
      </button>

      <button
        onClick={stopRecording}
        disabled={!recording}
        className="bg-gray-500 text-white px-4 py-2 rounded"
      >
        Stop Recording
      </button>

      <button
        onClick={download}
        disabled={!downloadUrl}
        className="bg-white border px-4 py-2 rounded"
      >
        Download
      </button>
    </div>
  );
}
