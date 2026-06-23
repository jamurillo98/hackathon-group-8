import React, { useState } from 'react'

/**
 * ScenarioInput
 *
 * Props:
 *   onStart(scenarioText: string) — called when the user clicks "Start Session"
 */

// Predefined scenarios so judges (and students) can start a realistic session in one click.
const PRESETS = [
  { label: 'Anxious patient',  text: 'An anxious patient who is scared their chest pain might be a heart attack' },
  { label: 'Angry IT client',  text: 'An angry IT client whose system has been down for hours and is losing money' },
  { label: 'Grieving family',  text: 'A grieving family member who just received bad news and needs support' },
  { label: 'Confused customer', text: 'A confused elderly customer who cannot understand their phone bill' },
  { label: 'Nervous student',  text: 'A nervous first-year student asking for help and afraid of looking stupid' },
  { label: 'Upset parent',     text: 'An upset parent demanding answers about their child at a school front desk' },
]

export default function ScenarioInput({ onStart }) {
  const [scenarioText, setScenarioText] = useState('')

  function handleStart() {
    if (typeof onStart === 'function') {
      onStart(scenarioText)
    }
  }

  return (
    <div className="flex flex-col gap-3 p-4 bg-white rounded-2xl shadow-md w-full">
      <label htmlFor="scenario-input" className="text-sm font-semibold text-gray-700">
        Scenario
      </label>

      {/* Quick-pick preset scenarios */}
      <div className="flex flex-wrap gap-2">
        {PRESETS.map((p) => (
          <button
            key={p.label}
            type="button"
            onClick={() => setScenarioText(p.text)}
            className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs text-gray-600 hover:border-teal-400 hover:text-teal-600 transition-colors"
          >
            {p.label}
          </button>
        ))}
      </div>

      <textarea
        id="scenario-input"
        value={scenarioText}
        onChange={(e) => setScenarioText(e.target.value)}
        placeholder="Describe the client scenario, or pick one above (e.g. 'Patient reports chest pain and anxiety…')"
        rows={3}
        className="w-full resize-none rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
      />
      <button
        type="button"
        onClick={handleStart}
        className="self-end rounded-xl bg-teal-600 px-5 py-2 text-sm font-semibold text-white hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 active:scale-95 transition-transform"
      >
        Start Session
      </button>
    </div>
  )
}
