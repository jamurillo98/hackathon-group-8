/**
 * scene/animator.js
 * Drives mood state machine, idle oscillations, speaking gestures, and face tints.
 *
 * Exports:
 *   initAnimator(clientFigure, studentFigure)
 *   setMood(mood)
 *   startSpeaking()
 *   stopSpeaking()
 *   computeMouthOpen(t, baseMouthHeight, speaking)
 *   update(delta)
 *   MOOD_PARAMS  (exported for tests)
 */

import * as THREE from 'three';

// ---------------------------------------------------------------------------
// MOOD_PARAMS
// Every numeric field is lerped over 0.3s during a mood transition.
//
// mouthCornerY  : Y offset applied to left and right mouth corners.
//                 Positive = smile (corners up), Negative = frown (corners down).
// mouthMidScaleY: Y scale on the centre mouth bar (squashed for tense moods).
// faceTint      : RGB hex colour blended onto the face material (muted tones only).
// ---------------------------------------------------------------------------
export const MOOD_PARAMS = {
  calm: {
    idlePeriod:      4.0,
    idleAmplitude:   0.04,
    forwardLean:     0,
    headTilt:        0,
    shoulderDrop:    0,
    bounceAmplitude: 0,
    browLeftY:       0,
    browRightY:      0,
    browLeftRot:     0,
    browRightRot:    0,
    eyeScaleY:       0.9,
    eyeScaleX:       1.0,
    mouthCornerY:    0.005,    // very slight upturn -- neutral pleasant
    mouthMidScaleY:  1.0,
    mouthHeight:     0.04,
    armRaise:        0,
    headDrop:        0,
    // Face tint: neutral warm skin -- no colour shift
    faceTintR:       0xD4 / 255,
    faceTintG:       0xA5 / 255,
    faceTintB:       0x74 / 255,
  },

  happy: {
    idlePeriod:      2.5,
    idleAmplitude:   0.05,
    forwardLean:     -0.06,
    headTilt:        0,
    shoulderDrop:    0.05,
    bounceAmplitude: 0.06,
    browLeftY:       0.07,   // brows lifted and relaxed (no scowl)
    browRightY:      0.07,
    browLeftRot:     0.0,    // flat/relaxed, NOT angled (angled reads as anger)
    browRightRot:    0.0,
    eyeScaleY:       0.7,    // gentle squint from smiling
    eyeScaleX:       1.1,
    mouthCornerY:    0.12,   // big smile -- corners way up
    mouthMidScaleY:  1.0,
    mouthHeight:     0.04,
    armRaise:        0.25,
    headDrop:        0,
    // Face tint: warm healthy flush
    faceTintR:       0xE8 / 255,
    faceTintG:       0xA8 / 255,
    faceTintB:       0x6A / 255,
  },

  sad: {
    idlePeriod:      6.0,
    idleAmplitude:   0.02,
    forwardLean:     0.08,
    headTilt:        0,
    shoulderDrop:    -0.12,
    bounceAmplitude: 0,
    browLeftY:       -0.04,
    browRightY:      -0.04,
    browLeftRot:     0.45,   // inner brows raised = sad arch
    browRightRot:    -0.45,
    eyeScaleY:       0.70,   // drooping lids
    eyeScaleX:       0.9,
    mouthCornerY:    -0.11,  // clear downward frown
    mouthMidScaleY:  1.0,
    mouthHeight:     0.035,
    armRaise:        -0.15,
    headDrop:        -0.12,  // head tilted / bowed down
    // Face tint: slightly cool, desaturated
    faceTintR:       0xBB / 255,
    faceTintG:       0x9E / 255,
    faceTintB:       0x88 / 255,
  },

  angry: {
    idlePeriod:      1.1,
    idleAmplitude:   0.07,
    forwardLean:     0.30,   // strong aggressive lean
    headTilt:        0,
    shoulderDrop:    0,
    bounceAmplitude: 0,
    browLeftY:       -0.07,  // brows pulled hard down
    browRightY:      -0.07,
    browLeftRot:     0.55,   // steep V-shape inward
    browRightRot:    -0.55,
    eyeScaleY:       0.45,   // clearly narrowed
    eyeScaleX:       1.05,
    mouthCornerY:    -0.03,  // tight compressed frown
    mouthMidScaleY:  0.55,   // squashed flat
    mouthHeight:     0.05,
    armRaise:        0.40,   // arms spread / tense
    headDrop:        0,
    // Face tint: muted warm red flush
    faceTintR:       0xC8 / 255,
    faceTintG:       0x7A / 255,
    faceTintB:       0x5E / 255,
  },

  anxious: {
    idlePeriod:      1.4,
    idleAmplitude:   0.06,
    forwardLean:     0.12,
    headTilt:        0.06,
    shoulderDrop:    0,
    bounceAmplitude: 0,
    browLeftY:       0.09,   // both brows raised high
    browRightY:      0.09,
    browLeftRot:     -0.30,  // slight inward pull
    browRightRot:    0.30,
    eyeScaleY:       1.40,   // wide open
    eyeScaleX:       1.0,
    mouthCornerY:    -0.02,  // slight tense downturn
    mouthMidScaleY:  0.85,
    mouthHeight:     0.052,
    armRaise:        -0.25,  // arms drawn in
    headDrop:        0,
    // Face tint: slightly pale/cool
    faceTintR:       0xBE / 255,
    faceTintG:       0xA2 / 255,
    faceTintB:       0x84 / 255,
  },

  confused: {
    idlePeriod:      3.5,
    idleAmplitude:   0.04,
    forwardLean:     0.05,
    headTilt:        0.26,   // strong side tilt -- clearly visible
    shoulderDrop:    0,
    bounceAmplitude: 0,
    browLeftY:       0.10,   // one brow up ...
    browRightY:      -0.04,  // ... one brow down
    browLeftRot:     -0.35,
    browRightRot:    0.08,
    eyeScaleY:       1.05,
    eyeScaleX:       1.0,
    mouthCornerY:    0.01,   // slight asymmetric quirk (right corner driven separately)
    mouthMidScaleY:  0.9,
    mouthHeight:     0.048,
    armRaise:        0.12,
    headDrop:        0,
    // Face tint: near neutral, very slight warm
    faceTintR:       0xD0 / 255,
    faceTintG:       0xA4 / 255,
    faceTintB:       0x72 / 255,
  },
};

// ---------------------------------------------------------------------------
// Module state
// ---------------------------------------------------------------------------
let clientFigure  = null;
let studentFigure = null;
let currentMood        = 'calm';
let transitionProgress = 1.0;
let isSpeaking         = false;
let time               = 0;

let current  = {};
let previous = {};
let target   = {};

// Neutral geometry positions captured at init
let neutralBrowLeftY  = 0;
let neutralBrowRightY = 0;
let neutralMouthY     = 0;   // Y of mouthMid, used as anchor for corner offsets

// THREE.Color instances reused for lerping (no GC churn)
const _colorA = new THREE.Color();
const _colorB = new THREE.Color();
const _colorOut = new THREE.Color();

function copyParams(src) { return Object.assign({}, src); }

// ---------------------------------------------------------------------------
// Public: initAnimator
// ---------------------------------------------------------------------------
export function initAnimator(clientFig, studentFig) {
  clientFigure  = clientFig;
  studentFigure = studentFig;

  current  = copyParams(MOOD_PARAMS.calm);
  previous = copyParams(MOOD_PARAMS.calm);
  target   = copyParams(MOOD_PARAMS.calm);

  currentMood        = 'calm';
  transitionProgress = 1.0;
  isSpeaking         = false;
  time               = 0;

  if (clientFigure) {
    const u = clientFigure.userData;
    if (u.leftBrow)  neutralBrowLeftY  = u.leftBrow.position.y;
    if (u.rightBrow) neutralBrowRightY = u.rightBrow.position.y;
    if (u.mouthMid)  neutralMouthY     = u.mouthMid.position.y;
  }
}

// ---------------------------------------------------------------------------
// Public: setMood
// ---------------------------------------------------------------------------
export function setMood(mood) {
  if (!MOOD_PARAMS[mood]) {
    console.warn('animator: unknown mood "' + mood + '", falling back to calm');
    mood = 'calm';
  }
  if (mood === currentMood) return;
  previous = copyParams(current);
  target   = copyParams(MOOD_PARAMS[mood]);
  transitionProgress = 0.0;
  currentMood = mood;
}

// ---------------------------------------------------------------------------
// Public: speaking
// ---------------------------------------------------------------------------
export function startSpeaking() { isSpeaking = true; }
export function stopSpeaking()  { isSpeaking = false; }

// ---------------------------------------------------------------------------
// Public: computeMouthOpen
// ---------------------------------------------------------------------------
export function computeMouthOpen(t, baseMouthHeight, speaking) {
  return baseMouthHeight + (speaking
    ? ((Math.sin(2 * Math.PI / 0.25 * t) + 1) / 2) * 0.07
    : 0);
}

// ---------------------------------------------------------------------------
// Internal: applyClientPose
// ---------------------------------------------------------------------------
function applyClientPose() {
  if (!clientFigure) return;
  const u = clientFigure.userData;

  // Head rotation
  if (u.head) {
    u.head.rotation.z = current.headTilt;
    u.head.rotation.x = current.headDrop + (isSpeaking
      ? Math.sin(2 * Math.PI / 0.5 * time) * 0.10
      : 0);
  }

  // Face tint -- lerp between two muted colours, no emissive
  if (u.headMat) {
    _colorA.setRGB(current.faceTintR, current.faceTintG, current.faceTintB);
    u.headMat.color.copy(_colorA);
  }

  // Torso
  if (u.torso) {
    u.torso.rotation.x = current.forwardLean;
    u.torso.scale.y    = 1.0 + Math.sin(2 * Math.PI / 3.5 * time) * 0.01;
    u.torso.rotation.z = Math.sin(2 * Math.PI / current.idlePeriod * time) * current.idleAmplitude;
    u.torso.position.y = Math.sin(2 * Math.PI / current.idlePeriod * time) * current.bounceAmplitude;
  }

  // Eyes
  if (u.leftEye) {
    u.leftEye.scale.y  = current.eyeScaleY;
    u.leftEye.scale.x  = current.eyeScaleX;
  }
  if (u.rightEye) {
    u.rightEye.scale.y = current.eyeScaleY;
    u.rightEye.scale.x = current.eyeScaleX;
  }

  // Brows
  if (u.leftBrow) {
    u.leftBrow.position.y = neutralBrowLeftY  + current.browLeftY;
    u.leftBrow.rotation.z = current.browLeftRot;
  }
  if (u.rightBrow) {
    u.rightBrow.position.y = neutralBrowRightY + current.browRightY;
    u.rightBrow.rotation.z = current.browRightRot;
  }

  // Mouth -- a curved torus arc. We pick a "smile amount" from mouthCornerY:
  //   positive mouthCornerY  -> smile (arc opens up)
  //   negative mouthCornerY  -> frown (arc opens down)
  //   near zero              -> flat-ish line (arc squashed flat)
  if (u.mouthGroup && u.mouthArc) {
    const smile = current.mouthCornerY;          // roughly -0.11 .. +0.12
    const amount = Math.max(-1, Math.min(1, smile / 0.11));  // normalise to -1..1

    // Base arc smiles at rotation PI. To frown, rotate by another PI (flip it).
    // Blend the flip with the smile amount: amount +1 = full smile (PI),
    // amount -1 = full frown (0). amount 0 = flatten the arc vertically.
    // NOTE: on the client figure, arc base rotation.z = 0 reads as a SMILE,
    // rotation.z = PI reads as a FROWN (verified by screenshot).
    if (amount >= 0) {
      u.mouthGroup.rotation.z = 0;               // smiling orientation
    } else {
      u.mouthGroup.rotation.z = Math.PI;         // frowning orientation
    }
    // Curviness: flat-ish near zero, curvy at the extremes.
    const curve = 0.35 + Math.abs(amount) * 0.75;
    u.mouthArc.scale.x = 1.0;

    // Speaking opens the mouth: thicken it.
    const open = isSpeaking
      ? ((Math.sin(2 * Math.PI / 0.25 * time) + 1) / 2)
      : 0;
    u.mouthArc.scale.y = curve + open * 0.5;
    u.mouthArc.scale.z = 1.0 + open * 1.4;

    // Confused: a small flat mouth tilted to one side.
    if (currentMood === 'confused') {
      u.mouthGroup.rotation.z = 0.35;            // tilt sideways = unsure
      u.mouthArc.scale.y = 0.45;                 // mostly flat
    }
  }

  // Arms
  if (u.leftArm) {
    u.leftArm.rotation.z = current.armRaise;
    u.leftArm.position.y = current.shoulderDrop;
    if (isSpeaking) {
      u.leftArm.rotation.z = current.armRaise + Math.sin(2 * Math.PI / 0.4 * time) * 0.14;
    }
  }
  if (u.rightArm) {
    u.rightArm.rotation.z = -current.armRaise;
    u.rightArm.position.y = current.shoulderDrop;
    if (isSpeaking) {
      u.rightArm.rotation.z = -current.armRaise - Math.sin(2 * Math.PI / 0.4 * time) * 0.14;
    }
    // Confused: right hand raised toward chin
    if (currentMood === 'confused' && !isSpeaking) {
      u.rightArm.rotation.x = -0.65;
    } else {
      u.rightArm.rotation.x = 0;
    }
  }
}

// ---------------------------------------------------------------------------
// Internal: applyStudentPose
// ---------------------------------------------------------------------------
function applyStudentPose() {
  if (!studentFigure) return;
  const u = studentFigure.userData;
  if (u.torso) {
    u.torso.rotation.z = Math.sin(2 * Math.PI / 5 * time + 1.2) * 0.025;
    u.torso.scale.y    = 1.0 + Math.sin(2 * Math.PI / 3.5 * time + 0.8) * 0.01;
  }
}

// ---------------------------------------------------------------------------
// Public: update (called every frame by scene.js)
// ---------------------------------------------------------------------------
export function update(delta) {
  time += delta;

  if (transitionProgress < 1.0) {
    transitionProgress = Math.min(transitionProgress + delta / 0.3, 1.0);
    for (const k of Object.keys(current)) {
      current[k] = previous[k] + (target[k] - previous[k]) * transitionProgress;
    }
  }

  applyClientPose();
  applyStudentPose();
}
