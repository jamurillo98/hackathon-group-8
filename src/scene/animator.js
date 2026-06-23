/**
 * src/scene/animator.js
 * Drives mood state machine, idle oscillations, and speaking gestures.
 *
 * Exports:
 *   initAnimator(clientFigure, studentFigure)
 *   setMood(mood)
 *   startSpeaking()
 *   stopSpeaking()
 *   update(delta)
 *   MOOD_PARAMS
 */

export const MOOD_PARAMS = {
  calm:     { idlePeriod:4,   idleAmplitude:0.03,  forwardLean:0,     headTilt:0,     shoulderDrop:0,     bounceAmplitude:0,    browLeftY:0,     browRightY:0,     browLeftRot:0,    browRightRot:0,    eyeScale:0.9,  mouthScaleX:1.0,  mouthHeight:0.040, armRaise:0    },
  anxious:  { idlePeriod:1.5, idleAmplitude:0.05,  forwardLean:0.1,   headTilt:0.05,  shoulderDrop:0,     bounceAmplitude:0,    browLeftY:0.04,  browRightY:0.04,  browLeftRot:-0.2, browRightRot:0.2,  eyeScale:1.25, mouthScaleX:0.9,  mouthHeight:0.055, armRaise:-0.2 },
  angry:    { idlePeriod:1.2, idleAmplitude:0.06,  forwardLean:0.22,  headTilt:0,     shoulderDrop:0,     bounceAmplitude:0,    browLeftY:-0.04, browRightY:-0.04, browLeftRot:0.3,  browRightRot:-0.3, eyeScale:0.65, mouthScaleX:0.85, mouthHeight:0.050, armRaise:0.3  },
  sad:      { idlePeriod:6,   idleAmplitude:0.015, forwardLean:-0.05, headTilt:-0.08, shoulderDrop:-0.08, bounceAmplitude:0,    browLeftY:-0.03, browRightY:-0.03, browLeftRot:0.25, browRightRot:-0.25,eyeScale:0.8,  mouthScaleX:0.9,  mouthHeight:0.035, armRaise:-0.1 },
  happy:    { idlePeriod:3,   idleAmplitude:0.04,  forwardLean:-0.03, headTilt:0,     shoulderDrop:0.04,  bounceAmplitude:0.04, browLeftY:0.025, browRightY:0.025, browLeftRot:-0.1, browRightRot:0.1,  eyeScale:0.8,  mouthScaleX:1.3,  mouthHeight:0.040, armRaise:0.15 },
  confused: { idlePeriod:3.5, idleAmplitude:0.03,  forwardLean:0.05,  headTilt:0.18,  shoulderDrop:0,     bounceAmplitude:0,    browLeftY:0.045, browRightY:-0.01, browLeftRot:-0.3, browRightRot:0.1,  eyeScale:1.0,  mouthScaleX:0.8,  mouthHeight:0.050, armRaise:0.1  },
}

let clientFigure  = null
let studentFigure = null
let currentMood        = 'calm'
let transitionProgress = 1.0
let isSpeaking = false
let time = 0

let current  = {}
let previous = {}
let target   = {}

let neutralBrowLeftY  = 0
let neutralBrowRightY = 0

function copyParams(src) { return Object.assign({}, src) }

export function initAnimator(clientFig, studentFig) {
  clientFigure  = clientFig
  studentFigure = studentFig

  current  = copyParams(MOOD_PARAMS.calm)
  previous = copyParams(MOOD_PARAMS.calm)
  target   = copyParams(MOOD_PARAMS.calm)

  currentMood        = 'calm'
  transitionProgress = 1.0
  isSpeaking         = false
  time               = 0

  if (clientFigure?.userData?.leftBrow)  neutralBrowLeftY  = clientFigure.userData.leftBrow.position.y
  if (clientFigure?.userData?.rightBrow) neutralBrowRightY = clientFigure.userData.rightBrow.position.y
}

export function setMood(mood) {
  if (!MOOD_PARAMS[mood]) {
    console.warn(`animator: unknown mood "${mood}", falling back to calm`)
    mood = 'calm'
  }
  if (mood === currentMood) return
  previous = copyParams(current)
  target   = copyParams(MOOD_PARAMS[mood])
  transitionProgress = 0.0
  currentMood = mood
}

export function startSpeaking() { isSpeaking = true  }
export function stopSpeaking()  { isSpeaking = false }

function computeMouthOpen(t, baseMouthHeight, speaking) {
  return baseMouthHeight + (speaking
    ? ((Math.sin(2 * Math.PI / 0.25 * t) + 1) / 2) * 0.07
    : 0)
}

function applyClientPose() {
  if (!clientFigure) return
  const u = clientFigure.userData

  if (u.head) {
    u.head.rotation.z = current.headTilt
    u.head.rotation.x = isSpeaking ? Math.sin(2 * Math.PI / 0.5 * time) * 0.08 : 0
  }
  if (u.torso) {
    u.torso.rotation.x = current.forwardLean
    u.torso.scale.y    = 1.0 + Math.sin(2 * Math.PI / 3.5 * time) * 0.01
    u.torso.rotation.z = Math.sin(2 * Math.PI / current.idlePeriod * time) * current.idleAmplitude
    u.torso.position.y = Math.sin(2 * Math.PI / current.idlePeriod * time) * current.bounceAmplitude
  }
  if (u.leftEye)  u.leftEye.scale.y  = current.eyeScale
  if (u.rightEye) u.rightEye.scale.y = current.eyeScale
  if (u.leftBrow) {
    u.leftBrow.position.y = neutralBrowLeftY  + current.browLeftY
    u.leftBrow.rotation.z = current.browLeftRot
  }
  if (u.rightBrow) {
    u.rightBrow.position.y = neutralBrowRightY + current.browRightY
    u.rightBrow.rotation.z = current.browRightRot
  }
  if (u.mouth) {
    u.mouth.scale.x = current.mouthScaleX
    u.mouth.scale.y = computeMouthOpen(time, current.mouthHeight, isSpeaking) / 0.04
  }
  if (u.leftArm) {
    u.leftArm.rotation.z = isSpeaking
      ? current.armRaise + Math.sin(2 * Math.PI / 0.4 * time) * 0.12
      : current.armRaise
    u.leftArm.position.y = current.shoulderDrop
  }
  if (u.rightArm) {
    u.rightArm.rotation.z = isSpeaking
      ? -current.armRaise + Math.sin(2 * Math.PI / 0.4 * time) * 0.12
      : -current.armRaise
    u.rightArm.position.y = current.shoulderDrop
    u.rightArm.rotation.x = (currentMood === 'confused' && !isSpeaking) ? -0.6 : 0
  }
}

function applyStudentPose() {
  if (!studentFigure) return
  const u = studentFigure.userData
  if (u.torso) {
    u.torso.rotation.z = Math.sin(2 * Math.PI / 5 * time + 1.2) * 0.025
    u.torso.scale.y    = 1.0 + Math.sin(2 * Math.PI / 3.5 * time + 0.8) * 0.01
  }
}

export function update(delta) {
  time += delta
  if (transitionProgress < 1.0) {
    transitionProgress = Math.min(transitionProgress + delta / 0.3, 1.0)
    for (const k of Object.keys(current)) {
      current[k] = previous[k] + (target[k] - previous[k]) * transitionProgress
    }
  }
  applyClientPose()
  applyStudentPose()
}
