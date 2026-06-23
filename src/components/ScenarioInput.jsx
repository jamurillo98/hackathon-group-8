import React, { useState } from 'react'

/**
 * ScenarioInput
 *
 * Props:
 *   onStart(scenarioText: string) — called when the user clicks "Start Session"
 */
export default function ScenarioInput({ onStart }) {
  const [scenarioText, setScenarioText] = useState('')

  function handleStart() {
    if (typeof onStart === 'function') {
      onStart(scenarioText)
    }
  }

  return (
    <div className="flex flex-col gap-3 p-4 bg-white rounded-2xl shadow-md w-full">
      <label
        htmlFor="scenario-input"
        className="text-sm font-semibold text-gray-700"
      >
        Scenario
      </label>
      <textarea
        id="scenario-input"
        value={scenarioText}
        onChange={(e) => setScenarioText(e.target.value)}
        placeholder="Describe the client scenario (e.g. 'Patient reports chest pain and anxiety…')"
        rows={4}
        className="w-full resize-none rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />
      <button
        type="button"
        onClick={handleStart}
        className="self-end rounded-xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 active:scale-95 transition-transform"
      >
        Start Session
      </button>
    </div>
  )
}
