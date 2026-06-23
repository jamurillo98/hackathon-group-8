# Implementation Plan: Virtual Client 3D Scene

## Overview

Build the `scene/` folder as a collection of plain ES modules backed by Three.js 0.161.0 (CDN). The implementation follows the six-module split described in the design: `scene.js` owns the rAF loop and WebGL context; `figures.js` constructs both figurines from primitives; `animator.js` drives the mood state machine, idle oscillations, and speaking gestures; `camera-feed.js` handles webcam lifecycle; `demo.html` bootstraps everything and exposes the public API; and `verify.js` runs Playwright screenshot verification. Property-based tests use `fast-check`; screenshot integration tests use `@playwright/test`.

---

## Tasks

- [ ] 1. Project scaffolding and package setup
  - Create `package.json` at the repo root with `@playwright/test` and `fast-check` as `devDependencies` (exact pinned versions), and a `"test"` script (`node scene/verify.js`) and a `"test:props"` script (`node --experimental-vm-modules node_modules/.bin/jest` or equivalent runner for the property tests in `scene/_verify/`)
  - Create the `scene/_verify/` directory (add a `.gitkeep` so it is tracked)
  - _Requirements: 8.1, 8.3_

- [ ] 2. Implement `scene/figures.js` — figurine geometry and materials
  - [ ] 2.1 Build the shared `buildFigure(palette)` helper
    - Define `palette = { torso, skin }` parameter
    - Use 8×6 `SphereGeometry` for head and eyes; 8-segment `CylinderGeometry` for torso, arms, legs; `BoxGeometry` for brows and mouth
    - Use `MeshLambertMaterial` exclusively — no `MeshStandardMaterial`, no emissive
    - Wire all eleven `userData` references before returning the `THREE.Group`: `head`, `torso`, `leftArm`, `rightArm`, `leftLeg`, `rightLeg`, `leftEye`, `rightEye`, `leftBrow`, `rightBrow`, `mouth`
    - Keep total triangle count per group under 500
    - _Requirements: 5.2, 5.3, 5.4_

  - [ ]* 2.2 Write property test for figure userData completeness (Property 9)
    - **Property 9: Figure userData completeness**
    - For any call to `createClientFigure()` or `createStudentFigure()`, all eleven `userData` references are non-null objects
    - **Validates: Requirements 5.2**

  - [ ]* 2.3 Write property test for figure material exclusivity (Property 10)
    - **Property 10: Figure material exclusivity**
    - Every mesh in both figure groups uses `MeshLambertMaterial`; no mesh has a `MeshStandardMaterial` or a non-zero `emissive` intensity
    - **Validates: Requirements 5.4**

  - [ ] 2.4 Export `createClientFigure()` and `createStudentFigure()`
    - `createClientFigure`: torso `#2C3E50`, skin `#D4A574`, position `(-1.4, 0, 0)`, Y-rotation `+15°` (≈ `0.2618` rad, inward)
    - `createStudentFigure`: torso `#4A6741`, skin `#C68642`, position `(1.4, 0, 0)`, Y-rotation `-15°` (mirrored inward)
    - _Requirements: 5.1, 5.5, 5.6_

- [ ] 3. Implement `scene/animator.js` — mood state machine and animation
  - [ ] 3.1 Define `MOOD_PARAMS` lookup table for all six moods
    - Keys: `calm`, `anxious`, `angry`, `sad`, `happy`, `confused`
    - Each entry is a `MoodParams` record with all fourteen numeric fields finite: `idlePeriod`, `idleAmplitude`, `forwardLean`, `headTilt`, `shoulderDrop`, `bounceAmplitude`, `browLeftY`, `browRightY`, `browLeftRot`, `browRightRot`, `eyeScale`, `mouthScaleX`, `mouthHeight`, `armRaise`
    - Every `mouthHeight` value ≥ `0.025` (minimum mouth floor per Req 2.2)
    - Every `idlePeriod` value > 0
    - Distinguish moods visually: `angry` has `forwardLean ≥ 0.18`, `eyeScale ≤ 0.75`, V-shape brows; `happy` has `bounceAmplitude > 0`, wide smile `mouthScaleX ≥ 1.25`; `sad` has `shoulderDrop < 0`, drooping brows; `anxious` has `eyeScale ≥ 1.2`, elevated brows; `confused` has `headTilt ≠ 0`, asymmetric brows; `calm` is neutral baseline
    - _Requirements: 1.1_

  - [ ]* 3.2 Write property test for mood completeness (Property 1)
    - **Property 1: Mood completeness**
    - For every mood in `['calm','anxious','angry','sad','happy','confused']`, `MOOD_PARAMS[mood]` exists and every numeric field is a finite number
    - **Validates: Requirements 1.1**

  - [ ] 3.3 Implement `initAnimator(clientFigure, studentFigure)`
    - Store references to both figure groups
    - Seed `current`, `previous`, and `target` all to a deep copy of `MOOD_PARAMS['calm']`
    - Set `currentMood = 'calm'`, `transitionProgress = 1.0`, `isSpeaking = false`, `time = 0`
    - _Requirements: 1.2_

  - [ ] 3.4 Implement `setMood(mood)` with same-mood guard and unknown-mood fallback
    - If `mood` is not in `MOOD_PARAMS`: log a warning, substitute `'calm'`
    - If resolved mood equals `currentMood`: return immediately (no-op)
    - Otherwise: snapshot `current` → `previous`, copy `MOOD_PARAMS[mood]` → `target`, set `transitionProgress = 0.0`, update `currentMood`
    - _Requirements: 1.2, 1.3, 1.4_

  - [ ]* 3.5 Write property test for unknown mood graceful fallback (Property 4)
    - **Property 4: Unknown mood graceful fallback**
    - Use `fast-check` `fc.string()` arbitrary; for any non-mood string, `setMood()` never throws, always resolves to a valid state, and `currentMood` is one of the six valid names
    - **Validates: Requirements 1.4**

  - [ ]* 3.6 Write property test for no-op guard (Property 3)
    - **Property 3: No-op guard**
    - After `setMood(m)` completes a transition (`transitionProgress = 1.0`), calling `setMood(m)` again leaves `transitionProgress` unchanged at `1.0` and takes no new snapshot
    - **Validates: Requirements 1.3**

  - [ ] 3.7 Implement `update(delta)` — mood lerp, idle oscillations, and pose application
    - Advance `time += delta`
    - If `transitionProgress < 1.0`: `transitionProgress = Math.min(transitionProgress + delta / 0.3, 1.0)`; lerp every key: `current[k] = previous[k] + (target[k] - previous[k]) * transitionProgress`
    - `applyClientPose()`: apply `current` fields to client figure's meshes/groups (brow positions and rotations, eye Y-scale, mouth X-scale and height, torso forward lean, head tilt, arm positions)
    - Idle sway client: `sin(2π/current.idlePeriod * time) * current.idleAmplitude` on torso Z-rotation
    - Breathing client: `torso.scale.y = 1.0 + sin(2π/3.5 * time) * 0.01` (range `[0.99, 1.01]`)
    - Speaking gestures (when `isSpeaking`): arm Z alternating `±0.12` rad at 0.4s period; head X nod `±0.08` rad at 0.5s period
    - Confused idle special case (when `currentMood === 'confused'` and `!isSpeaking`): right arm X-rotation = `-0.6` rad
    - `applyStudentPose()`: independent sway `sin(2π/5 * time + 1.2) * 0.025` on student torso Z-rotation; breathing on student torso Y-scale
    - Cap: caller (scene.js) supplies delta already capped at 0.1
    - _Requirements: 1.5, 1.6, 1.7, 2.3, 2.5, 2.6, 2.7, 4.4_

  - [ ]* 3.8 Write property test for transition interpolation invariant (Property 2)
    - **Property 2: Transition interpolation invariant**
    - Use `fc.nat({ max: 100 })` for frame count and `fc.float({ min: 0.001, max: 0.1 })` for per-frame delta; after `setMood(m)` and N `update(d)` calls while `transitionProgress < 1.0`, every `current[k]` is a finite number between `previous[k]` and `target[k]` (inclusive); once `transitionProgress = 1.0`, every `current[k] === target[k]`
    - **Validates: Requirements 1.2, 1.5, 1.6**

  - [ ]* 3.9 Write property test for frame rate independence (Property 8)
    - **Property 8: Frame rate independence**
    - For any sequence of delta values summing to time `T ≤ 1.0` with `setMood('angry')` applied once at `t=0`, the final `current` values after all `update()` calls are identical regardless of how many frames the duration is split into
    - **Validates: Requirements 4.4**

  - [ ] 3.10 Implement `startSpeaking()` and `stopSpeaking()`
    - `startSpeaking()`: set `isSpeaking = true`
    - `stopSpeaking()`: set `isSpeaking = false` (idempotent — calling multiple times has no additional effect and never throws)
    - _Requirements: 2.1, 2.3, 2.4_

  - [ ] 3.11 Implement `computeMouthOpen(time, baseMouthHeight, isSpeaking)` and wire into `applyClientPose()`
    - Formula: `mouthOpen = baseMouthHeight + (isSpeaking ? ((sin(2π/0.25 * time) + 1) / 2) * 0.07 : 0)`
    - Set `mouth.scale.y` proportional to `mouthOpen`
    - _Requirements: 2.1, 2.2_

  - [ ]* 3.12 Write property test for mouth positivity and speaking range (Property 5)
    - **Property 5: Mouth positivity and speaking range**
    - Use `fc.float({ min: 0, max: 1000 })` for time and `fc.float({ min: 0.001, max: 1.0 })` for `baseMouthHeight`; `computeMouthOpen` always returns a positive value; when `isSpeaking=true` result is in `[baseMouthHeight, baseMouthHeight+0.07]`; when false, result equals `baseMouthHeight`
    - **Validates: Requirements 2.1, 2.2**

  - [ ]* 3.13 Write property test for speaking stop idempotency (Property 7)
    - **Property 7: Speaking stop idempotent**
    - Use `fc.nat({ max: 20 })` as call count; calling `stopSpeaking()` N times with no intervening `startSpeaking()` leaves `isSpeaking = false` and throws no errors on every call
    - **Validates: Requirements 2.4**

- [ ] 4. Checkpoint — core animation and figure modules complete
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 5. Implement `scene/scene.js` — renderer, camera, lights, and rAF loop
  - [ ] 5.1 Implement `initScene(canvasElement)`
    - Create `THREE.WebGLRenderer({ canvas: canvasElement, antialias: true, alpha: false })`
    - Set `scene.background = new THREE.Color(0xF7F4EC)`
    - Place camera at `(0, 1.8, 7)` looking at `(0, 1.2, 0)` (`PerspectiveCamera`, fov 45, near 0.1, far 100)
    - Add `AmbientLight(0xffffff, 0.65)` and `DirectionalLight(0xffffff, 0.85)` at `(2, 5, 4)` — no colored lights
    - Register `window.resize` handler: update `camera.aspect = canvas.clientWidth / canvas.clientHeight`, call `camera.updateProjectionMatrix()`, resize renderer
    - Catch WebGL context failure; show plain-text fallback "Your browser does not support WebGL. Please use Chrome or Edge." without re-throwing
    - _Requirements: 4.1, 4.5, 4.6, 4.7, 9.1_

  - [ ] 5.2 Implement `startLoop()` and `stopLoop()`
    - `startLoop()`: guard with `if (running) return;` — never starts a second loop
    - Each frame: compute `delta = Math.min((now - lastTime) / 1000, 0.1)`, call `animatorUpdate(delta)`, then `renderer.render(scene, camera)`
    - `stopLoop()`: cancel the pending `requestAnimationFrame` handle, set `running = false`
    - Export `getScene()`, `getCamera()`, `getRenderer()`
    - _Requirements: 4.1, 4.2_

- [ ] 6. Implement `scene/camera-feed.js` — webcam lifecycle
  - [ ] 6.1 Implement `startCamera(videoElement)`
    - Guard: if `videoElement` is null/undefined, log warning and return without requesting camera access
    - Guard: if `navigator.mediaDevices` is absent, call `showFallback()` and return
    - Call `navigator.mediaDevices.getUserMedia({ video: true, audio: false })`
    - On success: `videoElement.srcObject = stream`, call `videoElement.play()`, hide `.camera-fallback`
    - On any error: show `.camera-fallback` with text "Camera unavailable" — never `alert()`, never throw, never propagate rejection
    - Store `stream` reference for `stopCamera()`
    - _Requirements: 3.1, 3.2, 3.3, 3.5_

  - [ ]* 6.2 Write property test for camera no-throw (Property 6)
    - **Property 6: Camera no-throw**
    - Mock `navigator.mediaDevices` to simulate absent API, permission denial, and arbitrary runtime errors; `startCamera()` always resolves and never calls `alert()` in every simulated environment
    - **Validates: Requirements 3.2, 3.5**

  - [ ] 6.3 Implement `stopCamera(videoElement)`
    - Stop all active media tracks on stored `stream`
    - Clear `videoElement.srcObject = null`
    - Show `.camera-fallback`
    - Handle the case where tracks have already been terminated (no-throw)
    - _Requirements: 3.4, 9.3_

- [ ] 7. Implement `scene/demo.html` — bootstrap, public API, and test harness UI
  - [ ] 7.1 Bootstrap the scene in an inline ES module script
    - Import from CDN: `https://cdn.jsdelivr.net/npm/three@0.161.0/build/three.module.js`
    - Import `initScene`, `startLoop`, `getScene` from `./scene.js`
    - Import `createClientFigure`, `createStudentFigure` from `./figures.js`
    - Import `initAnimator`, `setMood`, `startSpeaking`, `stopSpeaking`, `update` as `animatorUpdate` from `./animator.js`
    - Import `startCamera` as `cameraStart`, `stopCamera` as `cameraStop` from `./camera-feed.js`
    - Catch WebGL errors gracefully; show plain-text fallback without calling `alert()`
    - _Requirements: 4.1, 9.1, 9.4_

  - [ ] 7.2 Attempt dynamic import of `ai/dialogue.js` and implement fallback mode
    - `try { const ai = await import('../ai/dialogue.js'); dialogueEngine = ai; }` — on rejection, set `dialogueEngine = null` and display persistent non-dismissible "AI engine not connected — running in test mode" banner
    - Wire `onStudentSend(scenario, text)`: if `dialogueEngine` present, call `reply(scenario, text)`, validate returned mood (fallback to `calm` if invalid), call `showReply(replyText, mood)`, call `speak(text, onDone)`, wrap with safety timeout `Math.max(1000, charCount * 60)` ms
    - If `dialogueEngine` is null: use keyword-based mood detection (`angry`, `sad`, `happy`, `anxious`/`worried`, `confused` → respective mood, else `calm`); display fixed reply string `"[AI engine not connected -- running in test mode]"`
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 9.2_

  - [ ] 7.3 Expose the five `window.*` public API functions
    - `window.setMood(mood)` → delegates to `animator.setMood(mood)` (invalid names fall back to `calm`, never throw)
    - `window.showReply(text, mood)` → sets `captionEl.textContent = text` (NOT `innerHTML`), calls `window.setMood(mood)`, hides caption when `text` is empty or null
    - `window.playSpeaking(durationMs)` → calls `startSpeaking()` immediately, schedules `stopSpeaking()` after `durationMs` ms via `setTimeout`; `durationMs` must be a positive integer ≥ 1
    - `window.startCamera()` → calls `cameraStart(videoEl)`
    - `window.stopCamera()` → calls `cameraStop(videoEl)`
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 9.4, 9.5_

  - [ ]* 7.4 Write property test for XSS prevention via textContent (Property 11)
    - **Property 11: XSS prevention via textContent**
    - Use `fc.string()` to generate arbitrary strings (including `<script>`, `<img onerror=...>`, `&amp;`, etc.); calling `window.showReply(str, 'calm')` must insert the string via `textContent` only — inspect that the DOM node's `textContent === str` and no script is parsed
    - **Validates: Requirements 6.2, 6.6**

  - [ ]* 7.5 Write property test for keyword mood detection coverage (Property 12)
    - **Property 12: Keyword mood detection covers valid moods**
    - Use `fc.string()` as student input; the fallback keyword detector always returns one of the six valid mood names; no input returns `undefined` or an invalid string
    - **Validates: Requirements 7.3**

  - [ ] 7.6 Build the test harness UI controls
    - Six mood buttons (one per mood), a text input + "Send" button for student text, "Start Camera" / "Stop Camera" buttons, and a "Speak 2s" button wired to `window.playSpeaking(2000)`
    - Video element for webcam with CSS `transform: scaleX(-1)` for mirror and `.camera-fallback` sibling with "Camera unavailable" text
    - Caption display element (`<p id="caption">`) for reply text
    - Visible test-mode note shown when `dialogueEngine` is null
    - Background color `#F7F4EC`, no gradients, no glow
    - _Requirements: 4.5, 8.4_

- [ ] 8. Checkpoint — scene bootstrap and public API wired
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 9. Implement `scene/verify.js` — Playwright screenshot runner
  - [ ] 9.1 Start a local HTTP static server and open `demo.html`
    - Spawn a lightweight HTTP server serving the workspace root (e.g., using Node's `http` module or `http-server` package)
    - Launch headless Chromium via Playwright at `1100×700` viewport
    - Wait 1500 ms after navigation for scene initialization
    - _Requirements: 8.2_

  - [ ] 9.2 Capture one screenshot per mood
    - For each mood in `['calm','anxious','angry','sad','happy','confused']`:
      - Call `page.evaluate(() => window.setMood(mood))`
      - Wait 800 ms
      - Save PNG to `scene/_verify/{mood}.png`
    - _Requirements: 8.1, 8.2, 8.3_

  - [ ] 9.3 Capture the speaking screenshot
    - Call `page.evaluate(() => window.playSpeaking(2000))`
    - Wait 500 ms
    - Save PNG to `scene/_verify/speaking.png`
    - Tear down server and close browser
    - _Requirements: 8.1, 8.5_

- [ ] 10. Write `scene/README.md`
  - Document module layout, CDN URL, how to run `verify.js`, how to run property tests, and how to use the public API from a host page
  - _Requirements: 8.4_

- [ ] 11. Final checkpoint — all screenshots generated and property tests pass
  - Ensure all tests pass, ask the user if questions arise.

---

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP; they should NOT be implemented automatically but should be written when the parent task is complete.
- Each task references specific requirements for traceability.
- Property tests live in `scene/_verify/` and use `fast-check` (installed via `package.json`). They run against pure functions exported from `animator.js` and `figures.js` in a Node.js environment with a lightweight Three.js stub.
- `MeshLambertMaterial` is mandatory across all figurine meshes — no `MeshStandardMaterial`, no emissive colors.
- The single rAF loop is owned exclusively by `scene.js`; no other module calls `requestAnimationFrame`.
- Background `#F7F4EC` is a flat warm white — no gradients, no glow, no post-processing effects.
- `demo.html` uses `element.textContent` (not `innerHTML`) for all AI-sourced text — XSS prevention is a hard requirement.
- The `scene/_verify/` directory must exist before `verify.js` runs; the `.gitkeep` file created in Task 1 ensures this.

---

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1"] },
    { "id": 1, "tasks": ["2.1"] },
    { "id": 2, "tasks": ["2.2", "2.3", "2.4", "3.1"] },
    { "id": 3, "tasks": ["3.2", "3.3"] },
    { "id": 4, "tasks": ["3.4"] },
    { "id": 5, "tasks": ["3.5", "3.6", "3.7"] },
    { "id": 6, "tasks": ["3.8", "3.9", "3.10"] },
    { "id": 7, "tasks": ["3.11", "3.12", "3.13"] },
    { "id": 8, "tasks": ["5.1"] },
    { "id": 9, "tasks": ["5.2", "6.1"] },
    { "id": 10, "tasks": ["6.2", "6.3"] },
    { "id": 11, "tasks": ["7.1"] },
    { "id": 12, "tasks": ["7.2"] },
    { "id": 13, "tasks": ["7.3"] },
    { "id": 14, "tasks": ["7.4", "7.5", "7.6"] },
    { "id": 15, "tasks": ["9.1"] },
    { "id": 16, "tasks": ["9.2"] },
    { "id": 17, "tasks": ["9.3", "10"] }
  ]
}
```
