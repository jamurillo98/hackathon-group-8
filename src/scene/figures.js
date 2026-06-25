/**
 * scene/figures.js
 * Builds two figurines (client and student) from Three.js primitives.
 *
 * Exports:
 *   createClientFigure()  -- returns THREE.Group for the AI client (left side)
 *   createStudentFigure() -- returns THREE.Group for the student (right side)
 *
 * userData wired on every group:
 *   head, torso, leftArm, rightArm, leftLeg, rightLeg,
 *   leftEye, rightEye, leftBrow, rightBrow,
 *   mouthLeft, mouthMid, mouthRight,
 *   headMat  (the MeshLambertMaterial on the head sphere, for face-tint)
 *
 * Polygon budget: under 500 triangles per figure.
 * All materials are MeshLambertMaterial. No emissive, no MeshStandardMaterial.
 */

import * as THREE from 'three';

// Low-poly sphere
function makeSphere(r, color) {
  const geo = new THREE.SphereGeometry(r, 8, 6);
  const mat = new THREE.MeshLambertMaterial({ color });
  return new THREE.Mesh(geo, mat);
}

// Low-poly cylinder
function makeCylinder(rTop, rBot, h, color) {
  const geo = new THREE.CylinderGeometry(rTop, rBot, h, 8);
  const mat = new THREE.MeshLambertMaterial({ color });
  return new THREE.Mesh(geo, mat);
}

// Flat box (brows, mouth segments)
function makeBox(w, h, d, color) {
  const geo = new THREE.BoxGeometry(w, h, d);
  const mat = new THREE.MeshLambertMaterial({ color });
  return new THREE.Mesh(geo, mat);
}

/**
 * buildFigure(palette)
 * palette = { torsoColor, skinColor }
 * Returns a THREE.Group. Group Y-origin is at the figure's waist/ground level.
 */
function buildFigure(palette) {
  const group = new THREE.Group();

  // Torso
  const torso = makeCylinder(0.18, 0.16, 0.55, palette.torsoColor);
  torso.position.y = 0;
  group.add(torso);

  // Head -- store the material so the animator can tint it per mood
  const headGeo = new THREE.SphereGeometry(0.28, 8, 6);
  const headMat = new THREE.MeshLambertMaterial({ color: palette.skinColor });
  const head    = new THREE.Mesh(headGeo, headMat);
  head.position.y = 0.45;
  group.add(head);

  // Eyes
  const leftEye = makeSphere(0.055, 0x3A2010);
  leftEye.position.set(-0.10, 0.47, 0.25);
  group.add(leftEye);

  const rightEye = makeSphere(0.055, 0x3A2010);
  rightEye.position.set(0.10, 0.47, 0.25);
  group.add(rightEye);

  // Brows -- wider and taller than before so rotations are readable
  const leftBrow = makeBox(0.14, 0.035, 0.02, 0x2C1A0A);
  leftBrow.position.set(-0.10, 0.545, 0.26);
  group.add(leftBrow);

  const rightBrow = makeBox(0.14, 0.035, 0.02, 0x2C1A0A);
  rightBrow.position.set(0.10, 0.545, 0.26);
  group.add(rightBrow);

  // Mouth = a curved torus ARC (reads instantly as a smile / frown / line).
  // The arc is the bottom half of a torus. A small group wraps it so the animator
  // can rotate the whole mouth (flip smile<->frown) and scale it (open while speaking).
  // mouthArc.rotation.z = 0       -> smile (cup opening up)
  // mouthArc.rotation.z = Math.PI -> frown (cup opening down)
  const MOUTH_COLOR = 0x5A2208;  // dark so it reads against the face
  const MOUTH_Y     = 0.345;
  const MOUTH_Z     = 0.255;

  const mouthGroup = new THREE.Group();
  mouthGroup.position.set(0, MOUTH_Y, MOUTH_Z);

  // TorusGeometry(radius, tube, radialSegments, tubularSegments, arc)
  // arc = PI gives a half circle. We orient it so by default it smiles.
  const arcGeo = new THREE.TorusGeometry(0.095, 0.02, 6, 12, Math.PI);
  const arcMat = new THREE.MeshLambertMaterial({ color: MOUTH_COLOR });
  const mouthArc = new THREE.Mesh(arcGeo, arcMat);
  // A half torus drawn from 0..PI opens downward; rotate PI so it opens UP = smile.
  mouthArc.rotation.z = Math.PI;
  mouthGroup.add(mouthArc);

  group.add(mouthGroup);

  // Left arm group (shoulder pivot)
  const leftArmGroup = new THREE.Group();
  leftArmGroup.position.set(-0.30, 0.18, 0);
  const leftArmMesh = makeCylinder(0.06, 0.05, 0.42, palette.torsoColor);
  leftArmMesh.rotation.z = 0.18;
  leftArmMesh.position.y = -0.21;
  leftArmGroup.add(leftArmMesh);
  leftArmGroup.userData.pivot = leftArmMesh;
  group.add(leftArmGroup);

  // Right arm group
  const rightArmGroup = new THREE.Group();
  rightArmGroup.position.set(0.30, 0.18, 0);
  const rightArmMesh = makeCylinder(0.06, 0.05, 0.42, palette.torsoColor);
  rightArmMesh.rotation.z = -0.18;
  rightArmMesh.position.y = -0.21;
  rightArmGroup.add(rightArmMesh);
  rightArmGroup.userData.pivot = rightArmMesh;
  group.add(rightArmGroup);

  // Left leg
  const leftLegGroup = new THREE.Group();
  leftLegGroup.position.set(-0.10, -0.28, 0);
  const leftLegMesh = makeCylinder(0.07, 0.06, 0.44, palette.torsoColor);
  leftLegMesh.position.y = -0.22;
  leftLegGroup.add(leftLegMesh);
  group.add(leftLegGroup);

  // Right leg
  const rightLegGroup = new THREE.Group();
  rightLegGroup.position.set(0.10, -0.28, 0);
  const rightLegMesh = makeCylinder(0.07, 0.06, 0.44, palette.torsoColor);
  rightLegMesh.position.y = -0.22;
  rightLegGroup.add(rightLegMesh);
  group.add(rightLegGroup);

  // Wire userData
  group.userData.head       = head;
  group.userData.headMat    = headMat;   // exposed so animator can tint
  group.userData.torso      = torso;
  group.userData.leftArm    = leftArmGroup;
  group.userData.rightArm   = rightArmGroup;
  group.userData.leftLeg    = leftLegGroup;
  group.userData.rightLeg   = rightLegGroup;
  group.userData.leftEye    = leftEye;
  group.userData.rightEye   = rightEye;
  group.userData.leftBrow   = leftBrow;
  group.userData.rightBrow  = rightBrow;
  group.userData.mouthGroup = mouthGroup;   // rotate to flip smile/frown
  group.userData.mouthArc   = mouthArc;     // scale to open while speaking

  // Backward-compat alias
  group.userData.mouth = mouthGroup;

  return group;
}

/**
 * createClientFigure()
 * Dark slate torso, warm neutral skin. Positioned left, facing center.
 */
export function createClientFigure() {
  const fig = buildFigure({ torsoColor: 0x2C3E50, skinColor: 0xD4A574 });
  fig.position.set(-0.95, 0, 0);
  fig.rotation.y = 0.2618;  // +15 deg inward
  return fig;
}

/**
 * createStudentFigure()
 * Muted dark green torso. Positioned right, mirrored inward.
 */
export function createStudentFigure() {
  const fig = buildFigure({ torsoColor: 0x4A6741, skinColor: 0xC68642 });
  fig.position.set(0.95, 0, 0);
  fig.rotation.y = -0.2618;  // -15 deg inward
  // The student is the listener and is not mood-driven, so give it a calm, flat
  // neutral mouth (not the default smile) so it does not look oddly happy in a sad scene.
  if (fig.userData.mouthArc) {
    fig.userData.mouthArc.scale.y = 0.22;
  }
  return fig;
}
