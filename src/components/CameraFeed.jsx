import { useEffect, useRef } from "react";

export default function CameraFeed() {
  const videoRef = useRef(null);

  useEffect(() => {
    async function enableCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Camera error:", err);
      }
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
