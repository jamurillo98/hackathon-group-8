import React, { useEffect, useRef } from 'react'

/**
 * CameraFeed
 *
 * Props:
 *   stream (MediaStream | null) — the live camera stream to display
 */
export default function CameraFeed({ stream }) {
  const videoRef = useRef(null)

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream
    }
  }, [stream])

  return (
    <div className="relative w-full overflow-hidden rounded-2xl bg-gray-900 shadow-md aspect-video">
      {stream ? (
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="h-full w-full object-cover"
          aria-label="Camera feed"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <span className="text-sm text-gray-400 select-none">
            Camera feed will appear here
          </span>
        </div>
      )}
    </div>
  )
}
