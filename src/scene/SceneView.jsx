import React, { useEffect, useRef } from 'react'
import { initScene, startLoop, stopLoop, setAnimatorUpdate, getScene } from './scene.js'
import { createClientFigure, createStudentFigure } from './figures.js'
import { initAnimator, setMood, startSpeaking, stopSpeaking, update } from './animator.js'

/**
 * SceneView
 * M3: React wrapper for the Three.js figurine scene.
 *
 * Props:
 *   scenario  (string)  — active scenario text, displayed as a label
 *   mood      (string)  — one of: calm | anxious | angry | sad | happy | confused
 *   speaking  (boolean) — drives the speaking animation on the client figurine
 */
export default function SceneView({ scenario, mood = 'calm', speaking = false }) {
  const canvasRef = useRef(null)
  const initialised = useRef(false)

  // ── Mount: initialise the Three.js scene once ──────────────────────────────
  useEffect(() => {
    if (initialised.current) return
    initialised.current = true

    const canvas = canvasRef.current
    initScene(canvas)

    const threeScene    = getScene()
    const clientFigure  = createClientFigure()
    const studentFigure = createStudentFigure()
    threeScene.add(clientFigure)
    threeScene.add(studentFigure)

    initAnimator(clientFigure, studentFigure)
    setAnimatorUpdate(update)
    startLoop()

    // Cleanup on unmount
    return () => stopLoop()
  }, [])

  // ── Sync mood prop → animator ──────────────────────────────────────────────
  useEffect(() => {
    setMood(mood)
  }, [mood])

  // ── Sync speaking prop → animator ─────────────────────────────────────────
  useEffect(() => {
    if (speaking) startSpeaking()
    else          stopSpeaking()
  }, [speaking])

  return (
    <div className="relative flex w-full flex-col overflow-hidden rounded-2xl border border-gray-200 bg-[#F7F4EC] shadow-sm min-h-64">
      {/* Three.js canvas */}
      <canvas
        ref={canvasRef}
        className="w-full flex-1 block"
        style={{ minHeight: '16rem' }}
        aria-label="Virtual client figurine scene"
      />

      {/* Scenario label */}
      <div className="border-t border-gray-200 bg-white px-4 py-2">
        {scenario ? (
          <p className="truncate text-xs text-gray-600">
            <span className="font-semibold text-indigo-600">Scenario: </span>
            {scenario}
          </p>
        ) : (
          <p className="text-xs text-gray-400 select-none">No scenario loaded yet</p>
        )}
      </div>
    </div>
  )
}
