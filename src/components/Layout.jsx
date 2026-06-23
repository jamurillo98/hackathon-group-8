import React from 'react'

/**
 * Layout  -  app shell: branded header, main content, footer.
 * Product: Lumora  -  "Practice the hard conversations."
 */
export default function Layout({ children }) {
  return (
    <div className="flex min-h-screen flex-col bg-[#F4F6F8] text-slate-900">
      {/* ── Header ── */}
      <header className="sticky top-0 z-40 border-b border-slate-200/60 bg-gradient-to-r from-teal-700 via-teal-600 to-emerald-600 shadow-sm">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-3.5">
          <div className="flex items-center gap-3">
            {/* Logo mark */}
            <span
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/95 text-teal-700 shadow-sm"
              aria-hidden="true"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 3a6 6 0 0 1 6 6c0 2.5-1.5 3.8-2.5 5-.5.6-.5 1.3-.5 2H9c0-.7 0-1.4-.5-2C7.5 12.8 6 11.5 6 9a6 6 0 0 1 6-6Z" />
                <path d="M10 19h4M10.5 21.5h3" />
              </svg>
            </span>
            <div className="leading-tight">
              <h1 className="text-[17px] font-bold tracking-tight text-white">Lumora</h1>
              <p className="text-[11px] font-medium text-teal-100/90">Practice the hard conversations</p>
            </div>
          </div>
          <span className="hidden rounded-full bg-white/15 px-3 py-1 text-[11px] font-medium text-white sm:block">
            ACU IT Hackathon
          </span>
        </div>
      </header>

      {/* ── Main ── */}
      <main className="flex flex-1 flex-col">{children}</main>

      {/* ── Footer ── */}
      <footer className="border-t border-slate-200 bg-white/70 px-6 py-3 text-center text-[11px] text-slate-400">
        Lumora · Virtual Client Interaction · ACU IT Hackathon 2026
      </footer>
    </div>
  )
}
