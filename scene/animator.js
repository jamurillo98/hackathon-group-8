/**
 * scene/animator.js
 * Drives mood state machine, idle oscillations, and speaking gestures.
 *
 * Exports:
 *   initAnimator(clientFigure, studentFigure)
 *   setMood(mood)
 *   startSpeaking()
 *   stopSpeaking()
 *   computeMouthOpen(t, baseMouthHeight, speaking)
 *   update(delta)
 */

// All six moods with their animation parameter values.
// Each field is a plain number so they can be lerped smoothly.
export const MOOD_PARAMS = {
  calm: {
    idlePeriod:      4,
    idleAmplitude:   0.03,
    forwardLean:     0,
    headTilt:        0,
    shoulderDrop:    0,
    bounceAmplitude: 0,
    browLeftY:       0,
    browRightY:      0,
    browLeftRot:     0,
    browRightRot:    0,
    eyeScale:        0.9,
    mouthScaleX:     1.0,
    mouthHeight:     0.04,
    armRaise:        0,
  },
  anxious: {
    idlePeriod:      1.5,
    idleAmplitude:   0.05,
    forwardLean:     0.1,
    headTilt:        0.05,
    shoulderDrop:    0,
    bounceAmplitude: 0,
    browLeftY:       0.04,
    browRightY:      0.04,
    browLeftRot:     -0.2,
    browRightRot:    0.2,
    eyeScale:        1.25,
    mouthScaleX:     0.9,
    mouthHeight:     0.055,
    armRaise:        -0.2,
  },
  angry: {
    idlePeriod:      1.2,
    idleAmplitude:   0.06,
    forwardLean:     0.22,
    headTilt:        0,
    shoulderDrop:    0,
    bounceAmplitude: 0,
    browLeftY:       -0.04,
    browRightY:      -0.04,
    browLeftRot:     0.3,
    browRightRot:    -0.3,
    eyeScale:        0.65,
    mouthScaleX:     0.85,
    mouthHeight:     0.05,
    armRaise:        0.3,
  },
  sad: {
    idlePeriod:      6,
    idleAmplitude:   0.015,
    forwardLean:     -0.05,
    headTilt:        -0.08,
    shoulderDrop:    -0.08,
    bounceAmplitude: 0,
    browLeftY:       -0.03,
    browRightY:      -0.03,
    browLeftRot:     0.25,
    browRightRot:    -0.25,
    eyeScale:        0.8,
    mouthScaleX:     0.9,
    mouthHeight:     0.035,
    armRaise:        -0.1,
  },
  happy: {
    idlePeriod:      3,
    idleAmplitude:   0.04,
    forwardLean:     -0.03,
    headTilt:        0,
    shoulderDrop:    0.04,
    bounceAmplitude: 0.04,
    browLeftY:       0.025,
    browRightY:      0.025,
    browLeftRot:     -0.1,
    browRightRot:    0.1,
    eyeScale:        0.8,
    mouthScaleX:     1.3,
    mouthHeight:     0.04,
    armRaise:        0.15,
  },
  confused: {
    idlePeriod:      3.5,
    idleAmplitude:   0.03,
    forwardLean:     0.05,
    headTilt:        0.18,
    shoulderDrop:    0,
    bounceAmplitude: 0,
    browLeftY:       0.045,
    browRightY:      -0.01,
    browLeftRot:     -0.3,
    browRightRot:    0.1,
    eyeScale:        1.0,
    mouthScaleX:     0.8,
    mouthHeight:     0.05,
    armRaise:        0.1,
  },
};

// Private module state
let clientFigure = null;
let studentFigure = null;

let currentMood = 'calm';
let transitionProgress = 1.0;
let isSpeaking = false;
let time = 0;

// These three objects hold copies of the 14-field params
let current = {};
let previous = {};
let target = {};

// Neutral positions of brow/eye parts, captured at init so we apply offsets from them
let neutralBrowLeftY  = 0;
let neutralBrowRightY = 0;

// Helper: deep-copy a params object (all values are plain numbers)
function copyParams(src) {
  return Object.assign({}, src);
}

/**
 * initAnimator(clientFig, studentFig)
 * Store figure references and seed all state to the calm baseline.
 * Must be called after figures are added to the scene.
 */
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

  // Record the initial brow positions as neutrals so offsets are applied relative to them
  if (clientFigure && clientFigure.userData.leftBrow) {
    neutralBrowLeftY  = clientFigure.userData.leftBrow.position.y;
  }
  if (clientFigure && clientFigure.userData.rightBrow) {
    neutralBrowRightY = clientFigure.userData.rightBrow.position.y;
  }
}

/**
 * setMood(mood)
 * Kick off a 0.3s smooth transition to the given mood.
 * Unknown moods fall back to calm with a console warning.
 * Calling with the current mood is a no-op.
 */
export function setMood(mood) {
  if (!MOOD_PARAMS[mood]) {
    console.warn('animator: unknown mood "' + mood + '", falling back to calm');
    mood = 'calm';
  }

  // No-op guard: do nothing if we are already in this mood
  if (mood === currentMood) return;

  // Snapshot where we are now as the lerp start point
  previous = copyParams(current);
  target   = copyParams(MOOD_PARAMS[mood]);

  transitionProgress = 0.0;
  currentMood = mood;
}

/**
 * startSpeaking()
 * Enable talking gestures and mouth animation.
 */
export function startSpeaking() {
  isSpeaking = true;
}

/**
 * stopSpeaking()
 * Disable talking gestures. Idempotent -- safe to call multiple times.
 */
export function stopSpeaking() {
  isSpeaking = false;
}

/**
 * computeMouthOpen(t, baseMouthHeight, speaking)
 * Returns the mouth geometry height for the current frame.
 * When speaking, adds a 4Hz sine wave that opens the mouth up to 0.07 extra.
 */
export function computeMouthOpen(t, baseMouthHeight, speaking) {
  return baseMouthHeight + (speaking
    ? ((Math.sin(2 * Math.PI / 0.25 * t) + 1) / 2) * 0.07
    : 0);
}

/**
 * applyClientPose()
 * Internal. Reads current params and writes them to the client figure's meshes.
 */
function applyClientPose() {
  if (!clientFigure) return;
  const u = clientFigure.userData;

  // Head tilt (side tilt for confused, slight drop for sad)
  if (u.head) {
    u.head.rotation.z = current.headTilt;

    // Head nod while speaking, reset when idle
    if (isSpeaking) {
      u.head.rotation.x = Math.sin(2 * Math.PI / 0.5 * time) * 0.08;
    } else {
      u.head.rotation.x = 0;
    }
  }

  // Torso forward/backward lean
  if (u.torso) {
    u.torso.rotation.x = current.forwardLean;

    // Breathing: subtle torso scale oscillation on a 3.5s period
    u.torso.scale.y = 1.0 + Math.sin(2 * Math.PI / 3.5 * time) * 0.01;

    // Idle body sway on torso Z rotation
    u.torso.rotation.z = Math.sin(2 * Math.PI / current.idlePeriod * time) * current.idleAmplitude;

    // Happy bounce: move torso up and down slightly
    u.torso.position.y = Math.sin(2 * Math.PI / current.idlePeriod * time) * current.bounceAmplitude;
  }

  // Eyes: scale Y to widen (anxious) or narrow (angry)
  if (u.leftEye)  u.leftEye.scale.y  = current.eyeScale;
  if (u.rightEye) u.rightEye.scale.y = current.eyeScale;

  // Brows: offset from their neutral positions, plus Z rotation for expression shape
  if (u.leftBrow) {
    u.leftBrow.position.y = neutralBrowLeftY  + current.browLeftY;
    u.leftBrow.rotation.z = current.browLeftRot;
  }
  if (u.rightBrow) {
    u.rightBrow.position.y = neutralBrowRightY + current.browRightY;
    u.rightBrow.rotation.z = current.browRightRot;
  }

  // Mouth: width from mouthScaleX, height from computeMouthOpen
  if (u.mouth) {
    u.mouth.scale.x = current.mouthScaleX;
    const mouthOpen = computeMouthOpen(time, current.mouthHeight, isSpeaking);
    // Normalize mouth Y scale relative to base height of 0.04
    u.mouth.scale.y = mouthOpen / 0.04;
  }

  // Arms: Z rotation for spread/retract, Y offset for shoulder drop
  if (u.leftArm) {
    u.leftArm.rotation.z = current.armRaise;
    u.leftArm.position.y = current.shoulderDrop;

    // Talking arm gesture: alternate sway at 0.4s period
    if (isSpeaking) {
      u.leftArm.rotation.z = current.armRaise + Math.sin(2 * Math.PI / 0.4 * time) * 0.12;
    }
  }
  if (u.rightArm) {
    u.rightArm.rotation.z = -current.armRaise;
    u.rightArm.position.y = current.shoulderDrop;

    if (isSpeaking) {
      u.rightArm.rotation.z = -current.armRaise + Math.sin(2 * Math.PI / 0.4 * time) * 0.12;
    }
  }

  // Confused special case: raise right arm toward chin when idle
  if (currentMood === 'confused' && !isSpeaking) {
    if (u.rightArm) {
      u.rightArm.rotation.x = -0.6;
    }
  } else {
    if (u.rightArm) {
      u.rightArm.rotation.x = 0;
    }
  }
}

/**
 * applyStudentPose()
 * Internal. Student has a gentle independent sway and breathing only.
 */
function applyStudentPose() {
  if (!studentFigure) return;
  const u = studentFigure.userData;

  // Phase-offset sway so the student does not mirror the client
  studentFigure.userData.torso && (
    studentFigure.userData.torso.rotation.z =
      Math.sin(2 * Math.PI / 5 * time + 1.2) * 0.025
  );

  // Breathing on the student torso, offset phase so it looks independent
  if (u.torso) {
    u.torso.scale.y = 1.0 + Math.sin(2 * Math.PI / 3.5 * time + 0.8) * 0.01;
  }
}

/**
 * update(delta)
 * Called every frame by scene.js with the capped delta in seconds.
 * Advances time, lerps the mood transition, then applies poses.
 */
export function update(delta) {
  time += delta;

  // Advance the transition: lerp from previous to target over 0.3s
  if (transitionProgress < 1.0) {
    transitionProgress = Math.min(transitionProgress + delta / 0.3, 1.0);
    for (const k of Object.keys(current)) {
      current[k] = previous[k] + (target[k] - previous[k]) * transitionProgress;
    }
  }

  applyClientPose();
  applyStudentPose();
}
