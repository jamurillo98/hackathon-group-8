# Requirements Document

## Introduction

The Virtual Client 3D Scene (M3) is the interaction and rendering layer of the Virtual Client web application. It renders two figurines in a Three.js WebGL canvas, drives six distinct mood states on the client figurine through a smooth animation state machine, streams the student's webcam feed into a mirrored panel, and exposes a small public API (`window.*`) that lets the AI dialogue engine (M4) and the main integrator (M1) control mood, captions, and speaking animation.

The module is self-contained: no bundler, no TypeScript, no external CSS framework. Every file is a plain ES module loading Three.js from a pinned CDN URL. The `demo.html` page doubles as a standalone test harness. A Playwright verification script (`verify.js`) captures seven screenshots to prove the state machine works without a live AI engine.

---

## Glossary

- **Scene**: The Three.js WebGL rendering context, camera, lighting, and rAF loop managed by `scene.js`
- **Animator**: The animation state machine in `animator.js` that drives mood transitions, idle oscillations, and speaking gestures
- **Client_Figure**: The AI-driven figurine (left side) whose pose is controlled by the Animator
- **Student_Figure**: The student stand-in figurine (right side) with independent gentle sway and breathing
- **Camera_Feed**: The `camera-feed.js` module managing the webcam stream lifecycle
- **MoodParams**: A record of numeric animation parameters that define the visual appearance of a mood state
- **MOOD_PARAMS**: The lookup table mapping the six mood name strings to their MoodParams objects
- **Transition**: A smooth lerp over 0.3 seconds between two MoodParams states
- **rAF_Loop**: The single `requestAnimationFrame` loop owned by `scene.js`
- **UserData**: The named mesh/group references attached to a figure's `THREE.Group` root
- **Public_API**: The `window.*` functions exposed by `demo.html` for external callers
- **AI_Engine**: The optional `ai/dialogue.js` module owned by M4, providing `reply()` and `speak()`
- **Fallback_Mode**: Operation without AI engine, using keyword-based mood detection
- **Verify_Script**: The Playwright script `verify.js` that captures seven screenshot PNGs

---

## Requirements

### Requirement 1: Mood State Machine

**User Story:** As a developer integrating M3, I want the client figurine to express six distinct mood states with smooth transitions, so that the virtual client conveys realistic emotional responses.

#### Acceptance Criteria

1. THE Animator SHALL define MoodParams for all six mood names: `calm`, `anxious`, `angry`, `sad`, `happy`, and `confused`, where every numeric field in each MoodParams record is a finite number.
2. WHEN `setMood(mood)` is called with a valid mood name, THE Animator SHALL snapshot the current MoodParams as `previous`, load the target MoodParams, and set `transitionProgress` to `0.0` to begin a new transition.
3. WHEN `setMood(mood)` is called with `mood` equal to `currentMood`, THE Animator SHALL leave `currentMood`, `previous`, `target`, and `transitionProgress` all unchanged.
4. WHEN `setMood(mood)` is called with an unrecognized mood name, THE Animator SHALL log a warning and substitute `calm` as the target mood, without throwing an error or entering an undefined state. IF `calm` is already `currentMood`, the same-mood guard from C3 applies and no transition is started.
5. WHILE a mood transition is in progress (`transitionProgress` in `(0, 1)`), THE Animator SHALL update each parameter `p` in `current` using the explicit formula `current[p] = previous[p] + (target[p] - previous[p]) * transitionProgress`, such that no parameter snaps discontinuously.
6. WHEN `transitionProgress` reaches or would exceed `1.0`, THE Animator SHALL clamp `transitionProgress` to exactly `1.0` and hold all `current` parameters equal to the `target` MoodParams values.
7. WHILE a mood transition is active, THE Animator SHALL advance `transitionProgress` by `delta / 0.3` each frame, completing the transition in exactly `0.3` seconds of elapsed time.

---

### Requirement 2: Speaking and Idle Animations

**User Story:** As a developer, I want the client figurine to show talking gestures and always-on idle breathing so that the scene feels alive and responsive.

#### Acceptance Criteria

1. WHEN `startSpeaking()` is called, THE Animator SHALL activate a mouth open/close animation driven by the formula `baseMouthHeight + ((sin((2*PI/0.25)*time) + 1) / 2) * 0.07`, where the additive offset is non-negative and ranges from `0` to `0.07` scene units.
2. THE Animator SHALL ensure `computeMouthOpen()` always returns a value of at least `0.025` scene units (the minimum `mouthHeight` across all moods), preventing mouth geometry from degenerating to zero height for any combination of mood and speaking state.
3. WHILE the `isSpeaking` flag is active, THE Animator SHALL apply arm raise animation (alternating left/right arms at `±0.12` radians on the Z-axis with a `0.4`-second period) and head nod animation (`±0.08` radians on the X-axis with a `0.5`-second period) to the Client_Figure.
4. IF `stopSpeaking()` is called one or more times with no intervening `startSpeaking()`, THEN THE Animator SHALL set `isSpeaking` to false, leave all other state unchanged, and throw no errors.
5. THE Animator SHALL apply a breathing animation to the Client_Figure torso at all times, oscillating `scale.y` between `0.99` and `1.01` on a `3.5`-second period.
6. THE Animator SHALL apply an independent gentle sway (amplitude `±0.025` radians) and breathing animation to the Student_Figure at all times, using a `5`-second sway period with a phase offset of `1.2` radians relative to the Client_Figure sway.
7. WHERE the `confused` mood is active and `isSpeaking` is false, THE Animator SHALL rotate the Client_Figure's right arm to `-0.6` radians on the X-axis (raised toward the chin position).

---

### Requirement 3: Webcam Panel

**User Story:** As a user, I want my webcam feed displayed in a mirrored panel, so that I can see myself while interacting with the virtual client.

#### Acceptance Criteria

1. WHEN `startCamera(videoElement)` is called with a valid `HTMLVideoElement`, THE Camera_Feed SHALL request `{ video: true, audio: false }` via `navigator.mediaDevices.getUserMedia` and, on success, set the stream as the video source and hide the `.camera-fallback` element, resulting in a visibly playing video feed.
2. IF `navigator.mediaDevices` is absent, `getUserMedia` is unavailable, permission is denied, or any other error occurs, THEN THE Camera_Feed SHALL show the `.camera-fallback` element with the text "Camera unavailable" and SHALL NOT throw an exception, propagate a promise rejection, or call `alert()`.
3. THE Camera_Feed SHALL display the video feed as a horizontal mirror reflection (as seen in a selfie camera) for the lifetime of the stream.
4. WHEN `stopCamera(videoElement)` is called, THE Camera_Feed SHALL stop all active media tracks, clear the video source, and show the `.camera-fallback` element.
5. IF `startCamera` is called with a null or missing `videoElement`, THEN THE Camera_Feed SHALL log a warning and return without requesting camera access or throwing.

---

### Requirement 4: Scene Rendering and Performance

**User Story:** As a developer, I want the 3D scene to render at 60 fps with minimal polygon count and a clean visual aesthetic, so that it runs smoothly on mid-range hardware.

#### Acceptance Criteria

1. THE Scene SHALL use a single `requestAnimationFrame` loop owned exclusively by `scene.js`; no other module SHALL call `requestAnimationFrame`. Calling `startLoop()` while the loop is already running SHALL NOT start a second loop.
2. THE Scene SHALL cap the per-frame `delta` value at `0.1` seconds to prevent animation jumps after tab focus loss.
3. THE Scene SHALL sustain at least `60` frames per second for a minimum of `5` continuous seconds on hardware with a GPU PassMark score of at least `1500` and a CPU PassMark score of at least `3000`, using Chrome or Edge.
4. THE Animator SHALL compute all animation increments relative to `delta` (elapsed seconds) so that the final pose after a given wall-clock duration is the same regardless of how many frames that duration is divided into.
5. THE Scene SHALL set the background color to `#F7F4EC` (flat warm white) with no gradients and no glow effects.
6. THE Scene SHALL contain exactly one `AmbientLight` at intensity `0.65` and one `DirectionalLight` at intensity `0.85` positioned at `(2, 5, 4)`; no colored lights are permitted.
7. THE Scene SHALL handle `window.resize` events to maintain the correct aspect ratio, such that after each resize event `camera.aspect` equals `canvas.clientWidth / canvas.clientHeight` within a tolerance of `±0.01`.
8. THE Scene SHALL keep the total polygon count for each figurine under `500` triangles to meet the frame-rate target on the specified hardware.

---

### Requirement 5: Figure Construction

**User Story:** As a developer, I want both figurines built from Three.js primitives within a polygon budget, so that the scene is lightweight and renders with flat, readable shading.

#### Acceptance Criteria

1. THE Scene SHALL render two figurines: Client_Figure positioned at `(-1.4, 0, 0)` and Student_Figure positioned at `(1.4, 0, 0)`.
2. WHEN `createClientFigure()` or `createStudentFigure()` is called, THE figures module SHALL return a `THREE.Group` with all eleven `userData` references (`head`, `torso`, `leftArm`, `rightArm`, `leftLeg`, `rightLeg`, `leftEye`, `rightEye`, `leftBrow`, `rightBrow`, `mouth`) populated as non-null objects.
3. THE figures module SHALL keep the total polygon count for each figure under `500` triangles, achieved by using 8-segment spheres (`SphereGeometry` with `widthSegments=8, heightSegments=6`), 8-segment cylinders, and `BoxGeometry` for flat elements such as brows and mouth.
4. THE figures module SHALL use `MeshLambertMaterial` exclusively for all figure meshes; `MeshStandardMaterial` and emissive material properties SHALL NOT be used.
5. THE Client_Figure SHALL use a dark slate/navy torso color (`#2C3E50`) and warm neutral skin color (`#D4A574`), rotated approximately `15` degrees (within `±1` degree) around the Y-axis inward toward the viewer.
6. THE Student_Figure SHALL use a muted dark green torso color (`#4A6741`) and a skin color of `#C68642`, with a Y-axis rotation equal in magnitude and opposite in sign to the Client_Figure's rotation (mirrored inward).

---

### Requirement 6: Public API

**User Story:** As an integrator (M1) or AI engine (M4), I want a stable `window.*` API to control mood, captions, and speaking, so that modules can drive the scene without importing internal modules directly.

#### Acceptance Criteria

1. THE Public_API SHALL expose `window.setMood(mood)` that delegates to `Animator.setMood()` and accepts the six valid mood names (`calm`, `anxious`, `angry`, `sad`, `happy`, `confused`); invalid mood names SHALL fall back to `calm` without throwing.
2. THE Public_API SHALL expose `window.showReply(text, mood)` that sets the caption element's visible text to `text` using a method that treats the value as plain characters (not HTML), calls `window.setMood(mood)`, and hides the caption element when `text` is empty or null.
3. THE Public_API SHALL expose `window.playSpeaking(durationMs)` that calls `startSpeaking()` immediately and schedules `stopSpeaking()` after `durationMs` milliseconds; `durationMs` SHALL be a positive integer of at least `1`.
4. THE Public_API SHALL expose `window.startCamera()` that delegates to `Camera_Feed.startCamera()` with the designated `<video>` element present in `demo.html`.
5. THE Public_API SHALL expose `window.stopCamera()` that delegates to `Camera_Feed.stopCamera()` with the same designated `<video>` element.
6. THE Public_API SHALL never assign AI-sourced or user-sourced text to any DOM element using `innerHTML`, `outerHTML`, or `insertAdjacentHTML`, ensuring no executable content is parsed from reply strings.

---

### Requirement 7: AI Engine Integration

**User Story:** As a developer, I want the scene to integrate with `ai/dialogue.js` gracefully, so that it works both with and without a live AI engine.

#### Acceptance Criteria

1. WHEN `ai/dialogue.js` is present and exports `reply()` and `speak()`, THE Scene SHALL call `reply(scenario, studentText)` on each conversation turn and use the returned `{ reply: string, mood: MoodName }` to update the caption and mood. IF the returned `mood` is not one of the six valid mood names, THE Scene SHALL fall back to `calm`.
2. IF the dynamic `import('../ai/dialogue.js')` rejects for any reason (missing file, syntax error, or network error), THEN THE Scene SHALL enter Fallback_Mode and display a persistent, non-dismissible visible text indicator for the entire session duration stating that the AI engine is not connected.
3. IF `reply()` throws after a successful import, THEN THE Scene SHALL catch the error, display the fallback reply text for that turn, keep the current mood unchanged, and NOT permanently enter Fallback_Mode.
4. WHILE operating in Fallback_Mode, THE Scene SHALL detect mood from student input using the following keyword mapping: `angry` maps to `angry`, `sad` maps to `sad`, `happy` maps to `happy`, `anxious` or `worried` maps to `anxious`, `confused` maps to `confused`, and any input with no matching keyword defaults to `calm`.
5. WHILE operating in Fallback_Mode, THE Scene SHALL display a fixed, non-dynamic reply string that is identical on every turn and indicates the AI engine is not connected (for example, "[AI engine not connected -- running in test mode]").

---

### Requirement 8: Verification and Demo Harness

**User Story:** As a QA engineer, I want automated screenshots of all mood states and speaking, so that I can confirm the state machine works without a live AI engine.

#### Acceptance Criteria

1. THE Verify_Script SHALL capture exactly `7` PNG screenshots: one for each of the six moods (`calm`, `anxious`, `angry`, `sad`, `happy`, `confused`) and one for the speaking state.
2. WHEN the Verify_Script runs, THE Verify_Script SHALL start a local HTTP server, open `demo.html` in headless Chromium at a `1100x700` viewport, wait at least `1.5` seconds for scene initialization, then for each mood call `window.setMood(mood)` and wait at least `800` milliseconds before capturing that mood's screenshot.
3. THE Verify_Script SHALL save all screenshots to the `scene/_verify/` directory with filenames matching the mood names and `speaking.png`.
4. THE demo.html SHALL include a test harness UI with controls to trigger each mood individually, send test student input, and start and stop the camera independently, without requiring a running AI engine. WHEN the AI engine is absent, a visible test-mode note SHALL be present in the UI.
5. WHEN `window.playSpeaking(durationMs)` is called with a positive integer `durationMs`, THE demo.html SHALL call `startSpeaking()` immediately, wait `500` milliseconds, capture the speaking screenshot, and schedule `stopSpeaking()` after the full `durationMs` milliseconds using `setTimeout`.

---

### Requirement 9: Error Handling and Resilience

**User Story:** As a developer, I want all error conditions handled gracefully so that the scene never crashes the host page under foreseeable failure conditions.

#### Acceptance Criteria

1. IF WebGL context creation fails, THEN THE host page SHALL stop the rAF loop, display a plain-text fallback message ("Your browser does not support WebGL. Please use Chrome or Edge."), and SHALL NOT propagate the exception to `window.onerror` or the global scope.
2. IF the `speak()` callback `onDone` does not fire within a safety timeout of `Math.max(1000, charCount * 60)` milliseconds (where `charCount` is the character length of the reply text), THEN THE Scene SHALL call `stopSpeaking()` automatically to prevent the speaking animation from running indefinitely.
3. WHEN `window.stopCamera()` is called after camera tracks have been terminated by the browser, THE Scene SHALL stop any remaining active tracks, clear the video source, and show the `.camera-fallback` element without throwing. WHEN `window.startCamera()` is subsequently called, THE Scene SHALL re-request camera permission as if no prior stream existed.
4. THE Scene SHALL never call `alert()`, `eval()`, or `new Function()` under any code path.
5. THE Scene SHALL never assign AI-sourced text to any `innerHTML` property.
