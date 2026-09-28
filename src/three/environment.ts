import * as THREE from 'three'
import type { ScenePalette } from './palette'
import { disposeObject } from './utils'

// Builds a tiny "photo studio" made of a gradient dome and neon light panels, then
// pre-filters it into an environment map. Chrome surfaces reflect it as the Y2K
// magenta / cyan / lime streaks.
export const createY2KEnvironment = (renderer: THREE.WebGLRenderer, palette: ScenePalette) => {
  const envScene = new THREE.Scene()

  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(10, 48, 24),
    new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      uniforms: {
        uTop: { value: new THREE.Color(palette.env.top) },
        uHorizon: { value: new THREE.Color(palette.env.horizon) },
        uGround: { value: new THREE.Color(palette.env.ground) },
        uBottom: { value: new THREE.Color(palette.env.bottom) },
        uBand: { value: new THREE.Color(palette.env.band) },
      },
      vertexShader: /* glsl */ `
        varying vec3 vDir;
        void main() {
          vDir = normalize(position);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        uniform vec3 uTop;
        uniform vec3 uHorizon;
        uniform vec3 uGround;
        uniform vec3 uBottom;
        uniform vec3 uBand;
        varying vec3 vDir;
        void main() {
          float h = vDir.y;
          // Classic chrome read: bright sky, hard dark ground, glowing horizon line.
          vec3 color = h > 0.0
            ? mix(uHorizon, uTop, smoothstep(0.0, 0.7, h))
            : mix(uGround, uBottom, smoothstep(0.0, 0.75, -h));
          color += uBand * exp(-pow(h * 14.0, 2.0));
          gl_FragColor = vec4(color, 1.0);
        }
      `,
    }),
  )
  envScene.add(dome)

  const panelGeometry = new THREE.PlaneGeometry(1, 1)
  const layout: Array<[x: number, y: number, z: number, w: number, h: number]> = [
    [-6.5, 2.5, 2, 2.2, 9],
    [6.5, 2, 1, 2.2, 8],
    [0, 3.5, 7, 10, 0.9],
    [0, 8, 0, 8, 3],
    [-2, 1.5, -7.5, 7, 0.8],
  ]

  palette.env.panels.forEach(([color, intensity], index) => {
    const [x, y, z, w, h] = layout[index % layout.length]
    const panel = new THREE.Mesh(
      panelGeometry,
      new THREE.MeshBasicMaterial({
        color: new THREE.Color(color).multiplyScalar(intensity),
        side: THREE.DoubleSide,
      }),
    )
    panel.position.set(x, y, z)
    panel.scale.set(w, h, 1)
    panel.lookAt(0, 0, 0)
    envScene.add(panel)
  })

  const pmrem = new THREE.PMREMGenerator(renderer)
  const target = pmrem.fromScene(envScene, 0.03)
  pmrem.dispose()
  disposeObject(envScene)

  return target
}
