import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import { SIMPLEX_NOISE_GLSL } from './shaders/noise'

/* ------------------------------------------------------------------ */
/* Liquid chrome blob                                                   */
/* ------------------------------------------------------------------ */

export type BlobUniforms = {
  uTime: { value: number }
  uAmp: { value: number }
  uFreq: { value: number }
  uPulse: { value: number }
  uHover: { value: number }
  uPointerDir: { value: THREE.Vector3 }
}

const BLOB_VERTEX_HEAD = /* glsl */ `
uniform float uTime;
uniform float uAmp;
uniform float uFreq;
uniform float uPulse;
uniform float uHover;
uniform vec3 uPointerDir;
${SIMPLEX_NOISE_GLSL}

float y2kDisplace(vec3 p) {
  vec3 q = p * uFreq;
  float n = y2kSnoise(q + vec3(uTime * 0.2, uTime * 0.15, -uTime * 0.1));
  n += 0.28 * y2kSnoise(q * 1.9 + vec3(-uTime * 0.26, uTime * 0.18, uTime * 0.22));
  float spikes = y2kSnoise(q * 4.5 + uTime * 1.4) * uPulse * 0.6;
  float ripple = sin(p.y * 14.0 - uTime * 9.0) * 0.04 * uPulse;
  float d = distance(normalize(p), uPointerDir);
  float bulge = uHover * exp(-d * d * 6.0) * 0.3;
  return n * uAmp * (1.0 + uPulse * 0.8) + spikes * uAmp + ripple + bulge;
}

vec3 y2kDisplacePoint(vec3 p) {
  return p + normalize(p) * y2kDisplace(p);
}
`

// Recomputes the normal from two displaced neighbours so lighting follows the wobble.
const BLOB_NORMAL = /* glsl */ `
vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
  vec3 objectTangent = vec3( tangent.xyz );
#endif
vec3 y2kUp = abs(normal.y) < 0.99 ? vec3(0.0, 1.0, 0.0) : vec3(1.0, 0.0, 0.0);
vec3 y2kTangent = normalize(cross(normal, y2kUp));
vec3 y2kBitangent = normalize(cross(normal, y2kTangent));
vec3 y2kDisplaced = y2kDisplacePoint(position);
vec3 y2kNeighbourA = y2kDisplacePoint(position + y2kTangent * 0.012);
vec3 y2kNeighbourB = y2kDisplacePoint(position + y2kBitangent * 0.012);
objectNormal = normalize(cross(y2kNeighbourA - y2kDisplaced, y2kNeighbourB - y2kDisplaced));
`

export const createBlob = (segments: number) => {
  const uniforms: BlobUniforms = {
    uTime: { value: 0 },
    uAmp: { value: 0.17 },
    uFreq: { value: 0.85 },
    uPulse: { value: 0 },
    uHover: { value: 0 },
    uPointerDir: { value: new THREE.Vector3(0, 0, 1) },
  }

  const material = new THREE.MeshPhysicalMaterial({
    color: '#ffffff',
    metalness: 1,
    roughness: 0.04,
    iridescence: 0.85,
    iridescenceIOR: 1.35,
    iridescenceThicknessRange: [220, 620],
    clearcoat: 1,
    clearcoatRoughness: 0.06,
    envMapIntensity: 1.3,
  })

  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms)
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', `#include <common>\n${BLOB_VERTEX_HEAD}`)
      .replace('#include <beginnormal_vertex>', BLOB_NORMAL)
      .replace('#include <begin_vertex>', 'vec3 transformed = y2kDisplaced;')
  }
  material.customProgramCacheKey = () => 'y2k-liquid-chrome'

  const mesh = new THREE.Mesh(new THREE.SphereGeometry(1, segments, segments), material)

  return { mesh, uniforms }
}

/* ------------------------------------------------------------------ */
/* Shared materials                                                     */
/* ------------------------------------------------------------------ */

export const createChromeMaterial = (tint = '#ffffff') =>
  new THREE.MeshPhysicalMaterial({
    color: tint,
    metalness: 1,
    roughness: 0.12,
    clearcoat: 1,
    clearcoatRoughness: 0.1,
    envMapIntensity: 1.4,
  })

export const createIridescentMaterial = (tint = '#ffffff') =>
  new THREE.MeshPhysicalMaterial({
    color: tint,
    metalness: 1,
    roughness: 0.16,
    iridescence: 1,
    iridescenceIOR: 1.9,
    iridescenceThicknessRange: [100, 900],
    envMapIntensity: 1.4,
    side: THREE.DoubleSide,
  })

export const createCandyMaterial = (color: string) =>
  new THREE.MeshPhysicalMaterial({
    color,
    metalness: 0.1,
    roughness: 0.18,
    clearcoat: 1,
    clearcoatRoughness: 0.05,
    sheen: 1,
    sheenColor: new THREE.Color('#ffffff'),
    sheenRoughness: 0.4,
    envMapIntensity: 1.1,
  })

/* ------------------------------------------------------------------ */
/* Sparkle star ✦                                                       */
/* ------------------------------------------------------------------ */

export const createSparkleGeometry = () => {
  const shape = new THREE.Shape()
  const pinch = 0.14

  shape.moveTo(0, 1)
  shape.quadraticCurveTo(pinch, pinch, 1, 0)
  shape.quadraticCurveTo(pinch, -pinch, 0, -1)
  shape.quadraticCurveTo(-pinch, -pinch, -1, 0)
  shape.quadraticCurveTo(-pinch, pinch, 0, 1)

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: 0.12,
    bevelEnabled: true,
    bevelThickness: 0.09,
    bevelSize: 0.06,
    bevelSegments: 5,
    curveSegments: 28,
  })
  geometry.center()
  geometry.computeVertexNormals()

  return geometry
}

/* ------------------------------------------------------------------ */
/* Heart                                                                */
/* ------------------------------------------------------------------ */

export const createHeartGeometry = () => {
  const shape = new THREE.Shape()

  shape.moveTo(5, 5)
  shape.bezierCurveTo(5, 5, 4, 0, 0, 0)
  shape.bezierCurveTo(-6, 0, -6, 7, -6, 7)
  shape.bezierCurveTo(-6, 11, -3, 15.4, 5, 19)
  shape.bezierCurveTo(12, 15.4, 16, 11, 16, 7)
  shape.bezierCurveTo(16, 7, 16, 0, 10, 0)
  shape.bezierCurveTo(7, 0, 5, 5, 5, 5)

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: 2,
    bevelEnabled: true,
    bevelThickness: 2.2,
    bevelSize: 1.8,
    bevelSegments: 8,
    curveSegments: 32,
  })
  geometry.center()
  geometry.rotateZ(Math.PI)
  geometry.scale(1 / 11, 1 / 11, 1 / 11)
  geometry.computeVertexNormals()

  return geometry
}

/* ------------------------------------------------------------------ */
/* Compact disc                                                         */
/* ------------------------------------------------------------------ */

export const createCompactDisc = () => {
  const group = new THREE.Group()

  const shape = new THREE.Shape()
  shape.absarc(0, 0, 1, 0, Math.PI * 2, false)
  const hole = new THREE.Path()
  hole.absarc(0, 0, 0.15, 0, Math.PI * 2, true)
  shape.holes.push(hole)

  const discGeometry = new THREE.ExtrudeGeometry(shape, {
    depth: 0.02,
    bevelEnabled: true,
    bevelThickness: 0.012,
    bevelSize: 0.012,
    bevelSegments: 2,
    curveSegments: 72,
  })
  discGeometry.center()

  const disc = new THREE.Mesh(discGeometry, createIridescentMaterial('#f4f4ff'))

  const hub = new THREE.Mesh(
    new THREE.RingGeometry(0.16, 0.36, 64),
    new THREE.MeshPhysicalMaterial({
      color: '#ffffff',
      roughness: 0.1,
      transparent: true,
      opacity: 0.55,
      clearcoat: 1,
      side: THREE.DoubleSide,
    }),
  )
  hub.position.z = 0.03

  group.add(disc, hub)
  return group
}

/* ------------------------------------------------------------------ */
/* 3.5" floppy disk                                                     */
/* ------------------------------------------------------------------ */

const createFloppyLabel = (text: string, accent: string) => {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 164
  const ctx = canvas.getContext('2d')

  if (ctx) {
    ctx.fillStyle = '#fffef6'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.fillStyle = accent
    ctx.fillRect(0, 0, canvas.width, 26)
    ctx.strokeStyle = 'rgba(0, 120, 220, 0.35)'
    ctx.lineWidth = 2

    for (let y = 62; y < canvas.height; y += 30) {
      ctx.beginPath()
      ctx.moveTo(12, y)
      ctx.lineTo(canvas.width - 12, y)
      ctx.stroke()
    }

    ctx.fillStyle = '#1f1f1f'
    ctx.font = 'bold 30px "Space Mono", "Courier New", monospace'
    ctx.textBaseline = 'alphabetic'
    ctx.fillText(text, 16, 86, canvas.width - 32)
    ctx.font = '20px "Space Mono", "Courier New", monospace'
    ctx.fillStyle = '#b300b3'
    ctx.fillText('1.44 MB  ✦  2000', 16, 118, canvas.width - 32)
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 4
  return texture
}

export const createFloppyDisk = (color: string, label: string) => {
  const group = new THREE.Group()

  const body = new THREE.Mesh(
    new RoundedBoxGeometry(1, 1, 0.1, 3, 0.035),
    new THREE.MeshPhysicalMaterial({
      color,
      roughness: 0.35,
      clearcoat: 0.8,
      clearcoatRoughness: 0.2,
      envMapIntensity: 0.9,
    }),
  )

  const shutter = new THREE.Mesh(
    new THREE.BoxGeometry(0.54, 0.34, 0.112),
    new THREE.MeshStandardMaterial({ color: '#e3e6ee', metalness: 1, roughness: 0.2 }),
  )
  shutter.position.set(0.04, 0.33, 0)

  const slot = new THREE.Mesh(
    new THREE.BoxGeometry(0.12, 0.22, 0.118),
    new THREE.MeshStandardMaterial({ color: '#141414', roughness: 0.7 }),
  )
  slot.position.set(0.15, 0.34, 0)

  const paper = new THREE.Mesh(
    new THREE.PlaneGeometry(0.8, 0.5),
    new THREE.MeshStandardMaterial({ map: createFloppyLabel(label, color), roughness: 0.85 }),
  )
  paper.position.set(0, -0.2, 0.0515)

  group.add(body, shutter, slot, paper)
  return group
}

/* ------------------------------------------------------------------ */
/* Butterfly                                                            */
/* ------------------------------------------------------------------ */

export type Butterfly = {
  group: THREE.Group
  leftWing: THREE.Object3D
  rightWing: THREE.Object3D
}

export const createButterfly = (color: string, sheen: string): Butterfly => {
  const group = new THREE.Group()
  const inner = new THREE.Group()
  // Body along +Z so Object3D.lookAt() points the head where it flies.
  inner.rotation.x = Math.PI / 2
  group.add(inner)

  const wing = new THREE.Shape()
  wing.moveTo(0, 0.05)
  wing.bezierCurveTo(0.25, 0.9, 1.15, 1.05, 0.98, 0.4)
  wing.bezierCurveTo(0.92, 0.12, 0.55, 0.04, 0.3, -0.02)
  wing.bezierCurveTo(0.78, -0.12, 0.82, -0.66, 0.42, -0.72)
  wing.bezierCurveTo(0.18, -0.74, 0.04, -0.34, 0, -0.1)

  const wingGeometry = new THREE.ShapeGeometry(wing, 24)
  const wingMaterial = new THREE.MeshPhysicalMaterial({
    color,
    metalness: 0.35,
    roughness: 0.25,
    iridescence: 1,
    iridescenceIOR: 1.8,
    sheen: 1,
    sheenColor: new THREE.Color(sheen),
    clearcoat: 0.6,
    side: THREE.DoubleSide,
    envMapIntensity: 1.2,
  })

  const rightWing = new THREE.Group()
  rightWing.add(new THREE.Mesh(wingGeometry, wingMaterial))

  const leftWing = new THREE.Group()
  const leftMesh = new THREE.Mesh(wingGeometry, wingMaterial)
  leftMesh.scale.x = -1
  leftWing.add(leftMesh)

  const body = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.05, 0.62, 4, 10),
    new THREE.MeshStandardMaterial({ color: '#221133', roughness: 0.4, metalness: 0.3 }),
  )

  inner.add(rightWing, leftWing, body)

  return { group, leftWing, rightWing }
}
