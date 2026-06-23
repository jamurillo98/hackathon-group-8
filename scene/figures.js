/**
 * scene/figures.js
 * Builds two figurines (client and student) from Three.js primitives.
 *
 * Exports:
 *   createClientFigure()  -- returns THREE.Group for the AI client (left side)
 *   createStudentFigure() -- returns THREE.Group for the student (right side)
 *
 * Each returned group has all eleven parts wired on group.userData:
 *   head, torso, leftArm, rightArm, leftLeg, rightLeg,
 *   leftEye, rightEye, leftBrow, rightBrow, mouth
 *
 * Polygon budget: under 500 triangles per figure.
 * All materials are MeshLambertMaterial -- no MeshStandardMaterial, no emissive.
 */

import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.161.0/build/three.module.js';

// Helper: create a low-poly sphere mesh
function makeSphere(r, color) {
  const geo = new THREE.SphereGeometry(r, 8, 6);
  const mat = new THREE.MeshLambertMaterial({ color });
  return new THREE.Mesh(geo, mat);
}

// Helper: create a low-poly cylinder mesh
function makeCylinder(rTop, rBot, height, color) {
  const geo = new THREE.CylinderGeometry(rTop, rBot, height, 8);
  const mat = new THREE.MeshLambertMaterial({ color });
  return new THREE.Mesh(geo, mat);
}

// Helper: create a box mesh (used for brows and mouth)
function makeBox(w, h, d, color) {
  const geo = new THREE.BoxGeometry(w, h, d);
  const mat = new THREE.MeshLambertMaterial({ color });
  return new THREE.Mesh(geo, mat);
}

/**
 * buildFigure(palette)
 * Shared builder for both figures.
 *   palette = { torsoColor, skinColor }
 * Returns a THREE.Group with all parts positioned relative to group center.
 * Group center sits at ground level; torso is at y=0 relative to group.
 */
function buildFigure(palette) {
  const group = new THREE.Group();

  // Torso: main body cylinder, centered at y=0 in the group
  const torso = makeCylinder(0.18, 0.16, 0.55, palette.torsoColor);
  torso.position.y = 0;
  group.add(torso);

  // Head: sphere sitting above the torso
  const head = makeSphere(0.28, palette.skinColor);
  head.position.y = 0.45;
  group.add(head);

  // Eyes: two small spheres on the front of the head
  const leftEye = makeSphere(0.055, 0x3A2010);
  leftEye.position.set(-0.10, 0.47, 0.25);
  group.add(leftEye);

  const rightEye = makeSphere(0.055, 0x3A2010);
  rightEye.position.set(0.10, 0.47, 0.25);
  group.add(rightEye);

  // Brows: thin boxes just above each eye
  const leftBrow = makeBox(0.12, 0.025, 0.02, 0x2C1A0A);
  leftBrow.position.set(-0.10, 0.535, 0.26);
  group.add(leftBrow);

  const rightBrow = makeBox(0.12, 0.025, 0.02, 0x2C1A0A);
  rightBrow.position.set(0.10, 0.535, 0.26);
  group.add(rightBrow);

  // Mouth: thin box below the eyes, on the front of the head
  const mouth = makeBox(0.14, 0.04, 0.02, 0x8B4513);
  mouth.position.set(0, 0.36, 0.26);
  group.add(mouth);

  // Left arm: cylinder in a group so we can rotate from the shoulder
  const leftArmGroup = new THREE.Group();
  leftArmGroup.position.set(-0.30, 0.18, 0);
  const leftArmMesh = makeCylinder(0.06, 0.05, 0.42, palette.torsoColor);
  // Tilt the cylinder so it hangs down from the shoulder
  leftArmMesh.rotation.z = 0.18;
  leftArmMesh.position.y = -0.21;
  leftArmGroup.add(leftArmMesh);
  // Store the arm mesh as a pivot reference for shoulder rotation
  leftArmGroup.userData.pivot = leftArmMesh;
  group.add(leftArmGroup);

  // Right arm: mirror of the left
  const rightArmGroup = new THREE.Group();
  rightArmGroup.position.set(0.30, 0.18, 0);
  const rightArmMesh = makeCylinder(0.06, 0.05, 0.42, palette.torsoColor);
  rightArmMesh.rotation.z = -0.18;
  rightArmMesh.position.y = -0.21;
  rightArmGroup.add(rightArmMesh);
  rightArmGroup.userData.pivot = rightArmMesh;
  group.add(rightArmGroup);

  // Left leg: cylinder below the torso
  const leftLegGroup = new THREE.Group();
  leftLegGroup.position.set(-0.10, -0.28, 0);
  const leftLegMesh = makeCylinder(0.07, 0.06, 0.44, palette.torsoColor);
  leftLegMesh.position.y = -0.22;
  leftLegGroup.add(leftLegMesh);
  group.add(leftLegGroup);

  // Right leg: mirror of the left
  const rightLegGroup = new THREE.Group();
  rightLegGroup.position.set(0.10, -0.28, 0);
  const rightLegMesh = makeCylinder(0.07, 0.06, 0.44, palette.torsoColor);
  rightLegMesh.position.y = -0.22;
  rightLegGroup.add(rightLegMesh);
  group.add(rightLegGroup);

  // Wire all eleven userData references so the animator can access them by name
  group.userData.head = head;
  group.userData.torso = torso;
  group.userData.leftArm = leftArmGroup;
  group.userData.rightArm = rightArmGroup;
  group.userData.leftLeg = leftLegGroup;
  group.userData.rightLeg = rightLegGroup;
  group.userData.leftEye = leftEye;
  group.userData.rightEye = rightEye;
  group.userData.leftBrow = leftBrow;
  group.userData.rightBrow = rightBrow;
  group.userData.mouth = mouth;

  return group;
}

/**
 * createClientFigure()
 * The AI-driven client. Dark slate torso, warm neutral skin.
 * Positioned on the left side, rotated 15 degrees inward to face center.
 */
export function createClientFigure() {
  const palette = {
    torsoColor: 0x2C3E50,  // dark slate/navy
    skinColor:  0xD4A574,  // warm neutral skin
  };
  const fig = buildFigure(palette);
  fig.position.set(-1.4, 0, 0);
  fig.rotation.y = 0.2618;  // +15 degrees, facing inward (toward center)
  return fig;
}

/**
 * createStudentFigure()
 * The student stand-in. Muted dark green torso, slightly different skin.
 * Positioned on the right side, mirrored 15 degrees inward.
 */
export function createStudentFigure() {
  const palette = {
    torsoColor: 0x4A6741,  // muted dark green
    skinColor:  0xC68642,  // slightly different skin tone
  };
  const fig = buildFigure(palette);
  fig.position.set(1.4, 0, 0);
  fig.rotation.y = -0.2618;  // -15 degrees, mirrored inward
  return fig;
}
