import React from 'react'

/**
 * Layout
 *
 * Props:
 *   children (React.ReactNode) — the main page content
 */
export default function Layout({ children }) {
  return (
    <div className="flex min-h-screen flex-col bg-gray-50 text-gray-900">
      {/* ── Header ── */}
      <header className="flex items-center justify-between bg-indigo-700 px-6 py-4 shadow-md">
        <div className="flex items-center gap-3">
          {/* simple logo mark */}
          <span
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-indigo-700 font-bold text-sm select-none"
            aria-hidden="true"
          >
            VC
          </span>
          <h1 className="text-lg font-bold tracking-wide text-white">
            Virtual Client Interaction
          </h1>
        </div>
        <span className="hidden text-xs text-indigo-200 sm:block">
          ACU IT Hackathon — Group 8
        </span>
      </header>

      {/* ── Main ── */}
      <main className="flex flex-1 flex-col">
        {children}
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-gray-200 bg-white px-6 py-3 text-center text-xs text-gray-400">
        © 2026 ACU Hackathon Group 8 · Virtual Client Interaction Web App
      </footer>
    </div>
  )
}
