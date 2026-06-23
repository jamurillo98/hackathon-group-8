/**
 * src/scene/figures.js
 * Builds two figurines (client and student) from Three.js primitives.
 *
 * Exports:
 *   createClientFigure()
 *   createStudentFigure()
 */

// M3: three is installed as an npm dependency
import * as THREE from 'three'

function makeSphere(r, color) {
  return new THREE.Mesh(
    new THREE.SphereGeometry(r, 8, 6),
    new THREE.MeshLambertMaterial({ color })
  )
}

function makeCylinder(rTop, rBot, height, color) {
  return new THREE.Mesh(
    new THREE.CylinderGeometry(rTop, rBot, height, 8),
    new THREE.MeshLambertMaterial({ color })
  )
}

function makeBox(w, h, d, color) {
  return new THREE.Mesh(
    new THREE.BoxGeometry(w, h, d),
    new THREE.MeshLambertMaterial({ color })
  )
}

function buildFigure(palette) {
  const group = new THREE.Group()

  const torso = makeCylinder(0.18, 0.16, 0.55, palette.torsoColor)
  torso.position.y = 0
  group.add(torso)

  const head = makeSphere(0.28, palette.skinColor)
  head.position.y = 0.45
  group.add(head)

  const leftEye = makeSphere(0.055, 0x3A2010)
  leftEye.position.set(-0.10, 0.47, 0.25)
  group.add(leftEye)

  const rightEye = makeSphere(0.055, 0x3A2010)
  rightEye.position.set(0.10, 0.47, 0.25)
  group.add(rightEye)

  const leftBrow = makeBox(0.12, 0.025, 0.02, 0x2C1A0A)
  leftBrow.position.set(-0.10, 0.535, 0.26)
  group.add(leftBrow)

  const rightBrow = makeBox(0.12, 0.025, 0.02, 0x2C1A0A)
  rightBrow.position.set(0.10, 0.535, 0.26)
  group.add(rightBrow)

  const mouth = makeBox(0.14, 0.04, 0.02, 0x8B4513)
  mouth.position.set(0, 0.36, 0.26)
  group.add(mouth)

  const leftArmGroup = new THREE.Group()
  leftArmGroup.position.set(-0.30, 0.18, 0)
  const leftArmMesh = makeCylinder(0.06, 0.05, 0.42, palette.torsoColor)
  leftArmMesh.rotation.z = 0.18
  leftArmMesh.position.y = -0.21
  leftArmGroup.add(leftArmMesh)
  group.add(leftArmGroup)

  const rightArmGroup = new THREE.Group()
  rightArmGroup.position.set(0.30, 0.18, 0)
  const rightArmMesh = makeCylinder(0.06, 0.05, 0.42, palette.torsoColor)
  rightArmMesh.rotation.z = -0.18
  rightArmMesh.position.y = -0.21
  rightArmGroup.add(rightArmMesh)
  group.add(rightArmGroup)

  const leftLegGroup = new THREE.Group()
  leftLegGroup.position.set(-0.10, -0.28, 0)
  const leftLegMesh = makeCylinder(0.07, 0.06, 0.44, palette.torsoColor)
  leftLegMesh.position.y = -0.22
  leftLegGroup.add(leftLegMesh)
  group.add(leftLegGroup)

  const rightLegGroup = new THREE.Group()
  rightLegGroup.position.set(0.10, -0.28, 0)
  const rightLegMesh = makeCylinder(0.07, 0.06, 0.44, palette.torsoColor)
  rightLegMesh.position.y = -0.22
  rightLegGroup.add(rightLegMesh)
  group.add(rightLegGroup)

  group.userData.head      = head
  group.userData.torso     = torso
  group.userData.leftArm   = leftArmGroup
  group.userData.rightArm  = rightArmGroup
  group.userData.leftLeg   = leftLegGroup
  group.userData.rightLeg  = rightLegGroup
  group.userData.leftEye   = leftEye
  group.userData.rightEye  = rightEye
  group.userData.leftBrow  = leftBrow
  group.userData.rightBrow = rightBrow
  group.userData.mouth     = mouth

  return group
}

export function createClientFigure() {
  const fig = buildFigure({ torsoColor: 0x2C3E50, skinColor: 0xD4A574 })
  fig.position.set(-1.4, 0, 0)
  fig.rotation.y = 0.2618
  return fig
}

export function createStudentFigure() {
  const fig = buildFigure({ torsoColor: 0x4A6741, skinColor: 0xC68642 })
  fig.position.set(1.4, 0, 0)
  fig.rotation.y = -0.2618
  return fig
}
