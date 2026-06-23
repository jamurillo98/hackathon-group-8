import React from 'react'

/**
 * RecordingControls
 *
 * Props:
 *   onStart      () => void  — called when the user clicks "Start Recording"
 *   onStop       () => void  — called when the user clicks "Stop Recording"
 *   onDownload   () => void  — called when the user clicks "Download"; pass null/undefined to keep button disabled
 *   isRecording  boolean     — drives the enabled/disabled state of Start and Stop buttons
 */
export default function RecordingControls({
  onStart,
  onStop,
  onDownload,
  isRecording = false,
}) {
  const downloadAvailable = typeof onDownload === 'function'

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-white p-4 shadow-md">
      {/* Start Recording */}
      <button
        type="button"
        onClick={typeof onStart === 'function' ? onStart : undefined}
        disabled={isRecording}
        aria-label="Start recording"
        className={[
          'flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-green-500',
          isRecording
            ? 'cursor-not-allowed bg-gray-100 text-gray-400'
            : 'bg-green-600 text-white hover:bg-green-700 active:scale-95',
        ].join(' ')}
      >
        {/* circle icon */}
        <span
          className={[
            'inline-block h-2.5 w-2.5 rounded-full',
            isRecording ? 'bg-gray-300' : 'bg-white',
          ].join(' ')}
          aria-hidden="true"
        />
        Start Recording
      </button>

      {/* Stop Recording */}
      <button
        type="button"
        onClick={typeof onStop === 'function' ? onStop : undefined}
        disabled={!isRecording}
        aria-label="Stop recording"
        className={[
          'flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-red-500',
          !isRecording
            ? 'cursor-not-allowed bg-gray-100 text-gray-400'
            : 'bg-red-600 text-white hover:bg-red-700 active:scale-95',
        ].join(' ')}
      >
        {/* stop square icon */}
        <span
          className={[
            'inline-block h-2.5 w-2.5 rounded-sm',
            !isRecording ? 'bg-gray-300' : 'bg-white',
          ].join(' ')}
          aria-hidden="true"
        />
        Stop Recording
      </button>

      {/* Divider */}
      <span className="hidden h-6 w-px bg-gray-200 sm:block" aria-hidden="true" />

      {/* Download */}
      <button
        type="button"
        onClick={downloadAvailable ? onDownload : undefined}
        disabled={!downloadAvailable}
        aria-label="Download recording"
        className={[
          'flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500',
          !downloadAvailable
            ? 'cursor-not-allowed bg-gray-100 text-gray-400'
            : 'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95',
        ].join(' ')}
      >
        {/* download arrow icon */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M12 4v12m0 0l-4-4m4 4l4-4"
          />
        </svg>
        Download
      </button>

      {/* Status badge */}
      {isRecording && (
        <span className="ml-auto flex items-center gap-1.5 rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
          <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" aria-hidden="true" />
          Recording
        </span>
      )}
    </div>
  )
}
