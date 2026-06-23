/**
 * src/scene/scene.js
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

// M3: three is installed as an npm dependency (see package.json)
import * as THREE from 'three'

let renderer = null
let scene    = null
let camera   = null
let canvasEl = null

let animatorUpdateFn = null
let rafHandle = null
let running   = false
let lastTime  = 0

/**
 * initScene(canvasElement)
 * Attaches the renderer to the canvas, creates the scene, camera, and lights.
 * Catches WebGL failures and shows a plain-text fallback instead of throwing.
 */
export function initScene(canvasElement) {
  canvasEl = canvasElement

  try {
    renderer = new THREE.WebGLRenderer({ canvas: canvasElement, antialias: true, alpha: false })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(canvasElement.clientWidth, canvasElement.clientHeight)
  } catch {
    const msg = document.createTextNode(
      'Your browser does not support WebGL. Please use Chrome or Edge.'
    )
    canvasElement.parentNode.appendChild(msg)
    return
  }

  scene = new THREE.Scene()
  scene.background = new THREE.Color(0xF7F4EC)

  camera = new THREE.PerspectiveCamera(
    45,
    canvasElement.clientWidth / canvasElement.clientHeight,
    0.1,
    100
  )
  camera.position.set(0, 1.8, 7)
  camera.lookAt(0, 1.2, 0)

  const ambient = new THREE.AmbientLight(0xffffff, 0.65)
  scene.add(ambient)

  const dirLight = new THREE.DirectionalLight(0xffffff, 0.85)
  dirLight.position.set(2, 5, 4)
  scene.add(dirLight)

  window.addEventListener('resize', handleResize)
}

function handleResize() {
  if (!camera || !renderer || !canvasEl) return
  camera.aspect = canvasEl.clientWidth / canvasEl.clientHeight
  camera.updateProjectionMatrix()
  renderer.setSize(canvasEl.clientWidth, canvasEl.clientHeight)
}

export function setAnimatorUpdate(fn) {
  animatorUpdateFn = fn
}

export function startLoop() {
  if (running) return

  running  = true
  lastTime = performance.now()

  function tick(now) {
    const delta = Math.min((now - lastTime) / 1000, 0.1)
    lastTime = now
    if (animatorUpdateFn) animatorUpdateFn(delta)
    renderer.render(scene, camera)
    rafHandle = requestAnimationFrame(tick)
  }

  rafHandle = requestAnimationFrame(tick)
}

export function stopLoop() {
  cancelAnimationFrame(rafHandle)
  running = false
}

export function getScene()    { return scene    }
export function getCamera()   { return camera   }
export function getRenderer() { return renderer }
