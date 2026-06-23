# Scene Module (M3)

3D figurine scene, 6-mood animator, webcam panel, and verification screenshots for the Virtual Client web app.

---

## Files

| File | Purpose |
|------|---------|
| `scene.js` | Three.js renderer, scene, camera, lighting, render loop |
| `figures.js` | Builds client and student figurines from Three.js primitives |
| `animator.js` | All mood states, idle animation, speaking gestures, transitions |
| `camera-feed.js` | getUserMedia webcam feed with graceful fallback |
| `demo.html` | Self-contained test harness page |
| `verify.js` | Playwright script that captures 7 verification screenshots |
| `_verify/` | Output folder for screenshots (7 PNG files) |

---

## Public API (window.*)

These five functions are exposed on `window` by `demo.html` and can be called from the parent app or browser console.

### `window.setMood(mood)`
Switches the client figurine to the given mood immediately (with a 0.3s smooth transition).

Accepted mood values: `"calm"`, `"anxious"`, `"angry"`, `"sad"`, `"happy"`, `"confused"`

```js
window.setMood('anxious');
```

### `window.showReply(text, mood)`
Displays the given text in the speech-bubble caption near the client figurine, switches to the given mood, and starts the speaking animation (mouth open-close, gesture). If the AI dialogue engine is connected, TTS is used and the animation stops when speech ends. Otherwise, duration is estimated from text length.

```js
window.showReply("I'm quite worried about the data breach.", 'anxious');
```

### `window.playSpeaking(durationMs)`
Manually triggers the talking animation for the specified number of milliseconds. Useful for testing animation without a full dialogue turn.

```js
window.playSpeaking(2000); // talk for 2 seconds
```

### `window.startCamera()`
Requests webcam permission and starts the mirrored live video feed in the camera panel. Gracefully falls back to a placeholder if denied.

```js
window.startCamera();
```

### `window.stopCamera()`
Stops the active webcam stream and hides the video element.

```js
window.stopCamera();
```

---

## Integrating with the Main App

To embed the scene in the main app, either:

1. Load `demo.html` inside an `<iframe>` and use `postMessage` to send mood/reply commands, or
2. Import the individual modules directly into your own page:

```js
import { initScene, startLoop, getScene } from './scene/scene.js';
import { createClientFigure, createStudentFigure } from './scene/figures.js';
import { initAnimator, setMood, startSpeaking, stopSpeaking } from './scene/animator.js';
import { startCamera, stopCamera } from './scene/camera-feed.js';
```

Call sequence:

```js
const canvas = document.querySelector('#my-canvas');
initScene(canvas);

const scene = getScene();
scene.add(createClientFigure());
scene.add(createStudentFigure());

initAnimator(clientFig, studentFig);
startLoop();
```

---

## What `../ai/dialogue.js` Must Export

For the AI integration to work, `ai/dialogue.js` must export:

```js
// Returns a promise resolving to { reply: string, mood: string }
// mood must be one of: calm, anxious, angry, sad, happy, confused
export async function reply(scenario, studentText) { ... }

// Uses SpeechSynthesis to speak the text, calls onDone when finished
export function speak(text, onDone) { ... }
```

If either export is missing or the file does not exist, the scene falls back gracefully:
- `showReply()` uses an estimated duration instead of TTS
- The test harness shows a "[AI engine not connected]" placeholder

---

## Running the Verification Script

From the repo root:

```bash
node scene/verify.js
```

This starts a local HTTP server, opens a headless browser, cycles through all 6 moods, and saves 7 screenshots to `scene/_verify/`.

Expected files after running:
- `calm.png`, `anxious.png`, `angry.png`, `sad.png`, `happy.png`, `confused.png`
- `speaking.png`

---

## Dependencies

- Three.js 0.161.0 (loaded via CDN, pinned version)
- Playwright (devDependency for verification only)
- No build step required. All files are plain ES modules.
