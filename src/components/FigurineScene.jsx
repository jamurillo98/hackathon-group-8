import React from 'react'

/**
 * FigurineScene
 *
 * Props:
 *   scenario (string | undefined) — the active scenario text to display as a label
 */
export default function FigurineScene({ scenario }) {
  return (
    <div className="relative flex w-full flex-col overflow-hidden rounded-2xl border-2 border-dashed border-indigo-300 bg-indigo-50 shadow-inner min-h-64">
      {/* Placeholder icon */}
      <div className="flex flex-1 flex-col items-center justify-center gap-2 p-6">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-14 w-14 text-indigo-300"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
          />
        </svg>
        <p className="text-sm font-medium text-indigo-400 select-none">
          Virtual Client Scene
        </p>
      </div>

      {/* Scenario label */}
      {scenario ? (
        <div className="border-t border-indigo-200 bg-white px-4 py-2">
          <p className="truncate text-xs text-gray-600">
            <span className="font-semibold text-indigo-600">Scenario: </span>
            {scenario}
          </p>
        </div>
      ) : (
        <div className="border-t border-indigo-200 bg-white px-4 py-2">
          <p className="text-xs text-gray-400 select-none">
            No scenario loaded yet
          </p>
        </div>
      )}
    </div>
  )
}
