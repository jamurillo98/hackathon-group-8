import { useEffect, useRef } from "react";

export default function CameraFeed({ onStreamReady }) {
  const videoRef = useRef(null);

  useEffect(() => {
    async function enableCamera() {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      videoRef.current.srcObject = stream;
      onStreamReady(stream);
    }
    enableCamera();
  }, []);

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      className="w-full h-64 bg-black rounded-md"
    />
  );
}
