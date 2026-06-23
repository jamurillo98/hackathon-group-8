import { useEffect, useRef } from "react";

export default function CameraFeed({ onStreamReady }) {
  const videoRef = useRef(null);

  useEffect(() => {
    async function enableCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        if (typeof onStreamReady === "function") onStreamReady(stream);
      } catch (err) {
        console.error("Camera error:", err);
      }
    }

    enableCamera();
  }, [onStreamReady]);

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      className="w-full h-64 bg-black rounded-md"
    />
  );
}
