/**
 * scene/scene.js
 * Owns the WebGL context, camera, lighting, and the single rAF loop.
 *
 * Exports:
 *   initScene(canvasElement)
 *   setAnimatorUpdate(fn)
 *   startLoop()
 *   stopLoop()
 *   getScene()
 *   getCamera()
 *   getRenderer()
 */

import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.161.0/build/three.module.js';

// Module-level references, set by initScene
let renderer = null;
let scene = null;
let camera = null;
let canvasEl = null;

// The animator update function, provided by the caller via setAnimatorUpdate
let animatorUpdateFn = null;

// rAF loop state
let rafHandle = null;
let running = false;
let lastTime = 0;

/**
 * initScene(canvasElement)
 * Attaches the renderer to the canvas, creates the scene, camera, and lights.
 * Catches WebGL failures and shows a plain-text fallback instead of throwing.
 */
export function initScene(canvasElement) {
  canvasEl = canvasElement;

  try {
    renderer = new THREE.WebGLRenderer({ canvas: canvasElement, antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(canvasElement.clientWidth, canvasElement.clientHeight);
  } catch (err) {
    // WebGL is not available in this browser
    const msg = document.createTextNode(
      'Your browser does not support WebGL. Please use Chrome or Edge.'
    );
    canvasElement.parentNode.appendChild(msg);
    return;
  }

  // Create the scene with a flat warm off-white background
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xF7F4EC);

  // Perspective camera: fov 45, positioned above and back, looking slightly down
  camera = new THREE.PerspectiveCamera(
    45,
    canvasElement.clientWidth / canvasElement.clientHeight,
    0.1,
    100
  );
  camera.position.set(0, 1.8, 7);
  camera.lookAt(0, 1.2, 0);

  // Soft ambient light fills the whole scene without harsh shadows
  const ambient = new THREE.AmbientLight(0xffffff, 0.65);
  scene.add(ambient);

  // Single directional light from above and slightly in front
  const dirLight = new THREE.DirectionalLight(0xffffff, 0.85);
  dirLight.position.set(2, 5, 4);
  scene.add(dirLight);

  // Keep camera aspect and renderer size in sync with the window
  window.addEventListener('resize', handleResize);
}

/**
 * handleResize()
 * Updates camera aspect ratio and renderer size when the window changes.
 */
function handleResize() {
  if (!camera || !renderer || !canvasEl) return;
  camera.aspect = canvasEl.clientWidth / canvasEl.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(canvasEl.clientWidth, canvasEl.clientHeight);
}

/**
 * setAnimatorUpdate(fn)
 * Register the function to call each frame with the delta in seconds.
 * Called by demo.html before startLoop().
 */
export function setAnimatorUpdate(fn) {
  animatorUpdateFn = fn;
}

/**
 * startLoop()
 * Begins the requestAnimationFrame loop.
 * Guard ensures only one loop runs at a time.
 */
export function startLoop() {
  if (running) return;  // never start a second loop

  running = true;
  lastTime = performance.now();

  function tick(now) {
    // Cap delta at 0.1s to prevent large jumps after tab focus loss
    const delta = Math.min((now - lastTime) / 1000, 0.1);
    lastTime = now;

    // Drive animations if a handler has been registered
    if (animatorUpdateFn) animatorUpdateFn(delta);

    // Render the scene
    renderer.render(scene, camera);

    rafHandle = requestAnimationFrame(tick);
  }

  rafHandle = requestAnimationFrame(tick);
}

/**
 * stopLoop()
 * Cancels the active rAF handle and marks the loop as stopped.
 */
export function stopLoop() {
  cancelAnimationFrame(rafHandle);
  running = false;
}

/**
 * Getters for modules that need direct access to the Three.js objects.
 */
export function getScene()    { return scene; }
export function getCamera()   { return camera; }
export function getRenderer() { return renderer; }
