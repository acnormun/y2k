import * as THREE from 'three'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js'
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js'
import { createY2KEnvironment } from './environment'
import {
  createBlob,
  createButterfly,
  createCandyMaterial,
  createChromeMaterial,
  createCompactDisc,
  createFloppyDisk,
  createHeartGeometry,
  createSparkleGeometry,
  type BlobUniforms,
  type Butterfly,
} from './objects'
import { getPalette, type ScenePalette } from './palette'
import { Y2KScreenShader } from './postfx'
import { disposeObject, type SceneQuality } from './utils'

export type DesktopSceneOptions = {
  dark: boolean
  quality: SceneQuality
  reducedMotion: boolean
  onReady?: () => void
  onContextLost?: () => void
}

type Floater = {
  object: THREE.Object3D
  anchor: THREE.Vector3
  scale: number
  bob: number
  bobSpeed: number
  phase: number
  // Stars spin freely; flat objects (floppies, CDs, hearts) sway so they keep facing the viewer.
  freeSpin: boolean
  yaw: number
  swing: number
  rotationSpeed: THREE.Vector3
  spin: number
  spinAngle: number
  hover: number
}

type FlyingButterfly = Butterfly & {
  center: THREE.Vector3
  radius: THREE.Vector3
  frequency: THREE.Vector3
  phase: number
  clock: number
  boost: number
  hover: number
}

type Orbiter = {
  mesh: THREE.Mesh
  tilt: THREE.Quaternion
  radius: number
  speed: number
  phase: number
}

type PickResult =
  | { type: 'blob'; point: THREE.Vector3 }
  | { type: 'floater'; target: Floater; point: THREE.Vector3 }
  | { type: 'butterfly'; target: FlyingButterfly; point: THREE.Vector3 }
  | { type: 'floor'; point: THREE.Vector3 }
  | { type: 'sky'; point: THREE.Vector3 }

type FloaterDefinition =
  | { kind: 'floppy'; color: string; label: string; position: [number, number, number]; scale: number }
  | { kind: 'cd'; position: [number, number, number]; scale: number }
  | { kind: 'star'; tint: string; position: [number, number, number]; scale: number }
  | { kind: 'heart'; color: string; position: [number, number, number]; scale: number }

const FLOOR_Y = -2.4
const BURST_CAPACITY = 520

const FLOATERS: FloaterDefinition[] = [
  { kind: 'floppy', color: '#d400d4', label: 'PORTFOLIO_2K', position: [-1.1, 1.75, -1.8], scale: 0.62 },
  { kind: 'star', tint: '#ffffff', position: [0.4, 2.45, -0.4], scale: 0.34 },
  { kind: 'cd', position: [4.1, 1.95, -1.6], scale: 0.62 },
  { kind: 'heart', color: '#ff3fb4', position: [1.2, -1.35, 2.6], scale: 0.3 },
  { kind: 'floppy', color: '#0b8d1b', label: 'SNAKE.EXE', position: [4.5, -1.05, -0.6], scale: 0.55 },
  { kind: 'star', tint: '#ffd76b', position: [-3.3, 2.3, -3.4], scale: 0.3 },
  { kind: 'cd', position: [-3.1, -0.55, -4.5], scale: 0.72 },
  { kind: 'star', tint: '#ff7ce5', position: [5.4, 0.55, -3.2], scale: 0.32 },
  { kind: 'floppy', color: '#00a8e8', label: 'MIXTAPE_01', position: [-0.3, -1.6, 2.3], scale: 0.45 },
  { kind: 'heart', color: '#b44dff', position: [-2.0, 0.95, 0.4], scale: 0.22 },
  { kind: 'star', tint: '#9ff3ff', position: [2.5, -1.95, 1.8], scale: 0.2 },
  { kind: 'star', tint: '#ffffff', position: [-1.5, 0.6, -7.5], scale: 0.55 },
]

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))
const damp = (current: number, target: number, lambda: number, dt: number) =>
  THREE.MathUtils.lerp(current, target, 1 - Math.exp(-lambda * dt))
const easeOutCubic = (value: number) => 1 - Math.pow(1 - value, 3)

export class DesktopScene {
  private readonly host: HTMLElement
  private readonly options: DesktopSceneOptions
  private readonly renderer: THREE.WebGLRenderer
  private readonly scene = new THREE.Scene()
  private readonly camera = new THREE.PerspectiveCamera(38, 1, 0.1, 500)
  private readonly composer: EffectComposer
  private readonly bloomPass: UnrealBloomPass | null
  private readonly screenPass: ShaderPass
  private readonly raycaster = new THREE.Raycaster()
  private readonly resizeObserver: ResizeObserver

  private palette: ScenePalette
  private envTarget: THREE.WebGLRenderTarget | null = null

  private readonly sky: THREE.Mesh<THREE.SphereGeometry, THREE.ShaderMaterial>
  private readonly floor: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>
  private readonly sun: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>
  private readonly shadow: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>
  private readonly blob: THREE.Mesh
  private readonly blobUniforms: BlobUniforms
  private readonly halo = new THREE.Group()
  private readonly orbiters: Orbiter[] = []
  private readonly floaters: Floater[] = []
  private readonly butterflies: FlyingButterfly[] = []
  private readonly pickables: THREE.Object3D[] = []
  private readonly sparkles: THREE.Points<THREE.BufferGeometry, THREE.ShaderMaterial>
  private readonly burst: THREE.Points<THREE.BufferGeometry, THREE.ShaderMaterial>
  private readonly burstVelocity = new Float32Array(BURST_CAPACITY * 3)
  private burstCursor = 0
  private readonly ambientLight = new THREE.AmbientLight()
  private readonly keyLight = new THREE.DirectionalLight()
  private readonly rimLight = new THREE.PointLight('#ffffff', 1, 30, 1.4)

  private readonly cameraBase = new THREE.Vector3(0, 0.6, 9)
  private readonly lookTarget = new THREE.Vector3(0, 0.15, 0)
  private readonly blobAnchor = new THREE.Vector3(1.8, 0.25, 0)
  private blobScale = 1.12
  private spread = 1

  private readonly pointer = new THREE.Vector2()
  private readonly pointerSmooth = new THREE.Vector2()
  private readonly hoverPointer = new THREE.Vector2()
  private hoverPending = false
  private isPointerOverCanvas = false
  private hoveredFloater: Floater | null = null
  private hoveredButterfly: FlyingButterfly | null = null
  private blobHoverTarget = 0

  private pulse = 0
  private glitch = 0
  private elapsed = 0
  private lastTime = 0
  private frameId = 0
  private running = false
  private paused = false
  private hidden = false
  private contextLost = false
  private hasRendered = false
  private disposed = false

  constructor(host: HTMLElement, options: DesktopSceneOptions) {
    this.host = host
    this.options = options
    this.palette = getPalette(options.dark)
    this.hidden = document.hidden

    const isHigh = options.quality === 'high'

    this.renderer = new THREE.WebGLRenderer({
      antialias: false,
      alpha: false,
      powerPreference: 'high-performance',
    })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isHigh ? 1.75 : 1.25))
    this.renderer.toneMapping = THREE.NeutralToneMapping
    this.renderer.toneMappingExposure = 1
    this.renderer.domElement.className = 'y2k-scene__canvas'
    host.appendChild(this.renderer.domElement)

    const renderTarget = new THREE.WebGLRenderTarget(1, 1, {
      type: THREE.HalfFloatType,
      samples: isHigh ? 4 : 0,
    })
    this.composer = new EffectComposer(this.renderer, renderTarget)
    this.composer.setPixelRatio(this.renderer.getPixelRatio())
    this.composer.addPass(new RenderPass(this.scene, this.camera))

    this.bloomPass = isHigh ? new UnrealBloomPass(new THREE.Vector2(1, 1), 0.5, 0.4, 0.8) : null

    if (this.bloomPass) {
      this.composer.addPass(this.bloomPass)
    }

    this.composer.addPass(new OutputPass())
    this.screenPass = new ShaderPass(Y2KScreenShader)
    this.composer.addPass(this.screenPass)

    this.scene.add(this.ambientLight, this.keyLight, this.rimLight)
    this.keyLight.position.set(4, 6, 6)
    this.rimLight.position.set(-3, 1.5, -2.5)

    this.sky = this.createSky()
    this.floor = this.createFloor()
    this.sun = this.createSun()
    this.shadow = this.createShadow()

    const blob = createBlob(isHigh ? 180 : 96)
    this.blob = blob.mesh
    this.blobUniforms = blob.uniforms
    this.scene.add(this.blob)

    this.createHalo()
    this.createFloaters(isHigh)
    this.createButterflies(isHigh ? 3 : 2)
    this.sparkles = this.createSparkles(isHigh ? 340 : 150)
    this.burst = this.createBurst()

    this.applyPalette(this.palette)

    this.resizeObserver = new ResizeObserver(() => this.handleResize())
    this.resizeObserver.observe(host)
    this.handleResize()

    window.addEventListener('pointermove', this.handlePointerMove, { passive: true })
    this.renderer.domElement.addEventListener('pointerdown', this.handlePointerDown)
    this.renderer.domElement.addEventListener('pointerleave', this.handlePointerLeave)
    this.renderer.domElement.addEventListener('webglcontextlost', this.handleContextLost)
    this.renderer.domElement.addEventListener('webglcontextrestored', this.handleContextRestored)
    document.addEventListener('visibilitychange', this.handleVisibility)

    if (options.reducedMotion) {
      // A calm, frozen frame instead of a constantly moving wallpaper.
      this.elapsed = 14
      this.update(0)
      this.renderFrame()
    } else {
      this.syncLoop()
    }
  }

  /* ---------------------------------------------------------------- */
  /* Public API                                                        */
  /* ---------------------------------------------------------------- */

  setTheme(dark: boolean) {
    const next = getPalette(dark)

    if (next === this.palette) {
      return
    }

    this.palette = next
    this.applyPalette(next)
    // A CRT glitch masks the palette swap (skipped when motion is reduced: the frame would freeze mid-glitch).
    this.glitch = this.options.reducedMotion ? 0 : 1
    this.requestStaticFrame()
  }

  setPaused(paused: boolean) {
    this.paused = paused
    this.syncLoop()
  }

  dispose() {
    if (this.disposed) {
      return
    }

    this.disposed = true
    this.stop()
    this.resizeObserver.disconnect()
    window.removeEventListener('pointermove', this.handlePointerMove)
    this.renderer.domElement.removeEventListener('pointerdown', this.handlePointerDown)
    this.renderer.domElement.removeEventListener('pointerleave', this.handlePointerLeave)
    this.renderer.domElement.removeEventListener('webglcontextlost', this.handleContextLost)
    this.renderer.domElement.removeEventListener('webglcontextrestored', this.handleContextRestored)
    document.removeEventListener('visibilitychange', this.handleVisibility)

    disposeObject(this.scene)
    this.envTarget?.dispose()
    this.bloomPass?.dispose()
    this.screenPass.dispose()
    this.composer.dispose()
    this.renderer.dispose()
    this.renderer.domElement.remove()
  }

  /* ---------------------------------------------------------------- */
  /* Scene construction                                                */
  /* ---------------------------------------------------------------- */

  private createSky() {
    const sky = new THREE.Mesh(
      new THREE.SphereGeometry(300, 48, 24),
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        depthWrite: false,
        uniforms: {
          uTop: { value: new THREE.Color() },
          uHorizon: { value: new THREE.Color() },
          uBottom: { value: new THREE.Color() },
          uGlow: { value: new THREE.Color() },
          uGlowStrength: { value: 0.35 },
          uSunDir: { value: new THREE.Vector3(0, 0.08, -1).normalize() },
        },
        vertexShader: /* glsl */ `
          varying vec3 vDir;
          void main() {
            vDir = position;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: /* glsl */ `
          uniform vec3 uTop;
          uniform vec3 uHorizon;
          uniform vec3 uBottom;
          uniform vec3 uGlow;
          uniform float uGlowStrength;
          uniform vec3 uSunDir;
          varying vec3 vDir;
          void main() {
            vec3 dir = normalize(vDir);
            float h = dir.y;
            vec3 color = h > 0.0
              ? mix(uHorizon, uTop, pow(smoothstep(0.0, 0.55, h), 0.75))
              : mix(uHorizon, uBottom, smoothstep(0.0, 0.2, -h));
            float glow = pow(max(dot(dir, uSunDir), 0.0), 5.0);
            color += uGlow * glow * uGlowStrength;
            gl_FragColor = vec4(color, 1.0);
          }
        `,
      }),
    )
    sky.renderOrder = -2
    this.scene.add(sky)
    return sky
  }

  private createFloor() {
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(420, 280, 1, 1),
      new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uFloor: { value: new THREE.Color() },
          uGrid: { value: new THREE.Color() },
          uFog: { value: new THREE.Color() },
          uIntensity: { value: 1 },
          uRipple: { value: new THREE.Vector3(0, 0, -100) },
        },
        vertexShader: /* glsl */ `
          varying vec3 vWorld;
          varying float vDepth;
          void main() {
            vec4 world = modelMatrix * vec4(position, 1.0);
            vWorld = world.xyz;
            vec4 view = viewMatrix * world;
            vDepth = -view.z;
            gl_Position = projectionMatrix * view;
          }
        `,
        fragmentShader: /* glsl */ `
          uniform float uTime;
          uniform vec3 uFloor;
          uniform vec3 uGrid;
          uniform vec3 uFog;
          uniform float uIntensity;
          uniform vec3 uRipple;
          varying vec3 vWorld;
          varying float vDepth;

          void main() {
            vec2 coord = vWorld.xz * 0.42;
            coord.y -= uTime * 0.45;
            vec2 width = fwidth(coord);
            vec2 grid = abs(fract(coord - 0.5) - 0.5) / width;
            float line = min(grid.x, grid.y);
            // Fade lines out once they get thinner than a pixel, otherwise they alias into a haze.
            float lod = 1.0 - smoothstep(0.08, 0.35, max(width.x, width.y));
            float mask = (1.0 - min(line, 1.0)) * lod;
            float glow = exp(-line * 0.22) * 0.3 * lod;

            float age = uTime - uRipple.z;
            float radius = distance(vWorld.xz, uRipple.xy);
            float ring = exp(-pow((radius - age * 7.5) * 1.1, 2.0)) * exp(-age * 0.9) * step(0.0, age);

            float fade = 1.0 - smoothstep(8.0, 55.0, vDepth);
            float amount = (mask + glow) * uIntensity * fade * (1.0 + ring * 2.5) + ring * 0.55 * fade;
            vec3 color = mix(uFloor, uGrid, clamp(amount, 0.0, 1.0));
            color += uGrid * max(amount - 1.0, 0.0) * 0.6;
            color = mix(uFog, color, 1.0 - smoothstep(18.0, 120.0, vDepth));
            gl_FragColor = vec4(color, 1.0);
          }
        `,
      }),
    )
    floor.rotation.x = -Math.PI / 2
    floor.position.set(0, FLOOR_Y, -110)
    this.scene.add(floor)
    return floor
  }

  private createSun() {
    const sun = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 1),
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        uniforms: {
          uTime: { value: 0 },
          uTop: { value: new THREE.Color() },
          uBottom: { value: new THREE.Color() },
          uOpacity: { value: 1 },
        },
        vertexShader: /* glsl */ `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: /* glsl */ `
          uniform float uTime;
          uniform vec3 uTop;
          uniform vec3 uBottom;
          uniform float uOpacity;
          varying vec2 vUv;
          void main() {
            vec2 p = vUv - 0.5;
            float r = length(p);
            float radius = 0.3;
            float disc = 1.0 - smoothstep(radius - 0.003, radius, r);
            float y = clamp((p.y + radius) / (2.0 * radius), 0.0, 1.0);
            float thickness = clamp((0.58 - y) * 1.05, 0.0, 0.72);
            float lines = step(thickness, fract(y * 11.0 + uTime * 0.18));
            vec3 color = mix(uBottom, uTop, smoothstep(0.1, 0.95, y));
            float halo = exp(-max(r - radius, 0.0) * 16.0) * (1.0 - disc) * 0.45;
            float body = disc * lines;
            vec3 finalColor = color * body + mix(uBottom, uTop, 0.35) * halo;
            float alpha = (body + halo) * uOpacity;
            if (alpha < 0.002) discard;
            gl_FragColor = vec4(finalColor / max(body + halo, 0.001), alpha);
          }
        `,
      }),
    )
    sun.position.set(0, 17, -190)
    sun.scale.setScalar(110)
    sun.renderOrder = -1
    this.scene.add(sun)
    return sun
  }

  private createShadow() {
    const shadow = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 1),
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        uniforms: {
          uColor: { value: new THREE.Color() },
          uOpacity: { value: 0.3 },
        },
        vertexShader: /* glsl */ `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: /* glsl */ `
          uniform vec3 uColor;
          uniform float uOpacity;
          varying vec2 vUv;
          void main() {
            float d = length(vUv - 0.5) * 2.0;
            float alpha = pow(1.0 - smoothstep(0.0, 1.0, d), 1.6) * uOpacity;
            gl_FragColor = vec4(uColor, alpha);
          }
        `,
      }),
    )
    shadow.rotation.x = -Math.PI / 2
    shadow.position.y = FLOOR_Y + 0.02
    this.scene.add(shadow)
    return shadow
  }

  private createHalo() {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1, 0.016, 12, 220), createChromeMaterial('#ffffff'))
    ring.rotation.x = Math.PI / 2
    const ringTilt = new THREE.Group()
    ringTilt.rotation.set(0.35, 0, -0.42)
    ringTilt.add(ring)
    ringTilt.scale.setScalar(1.62)
    this.halo.add(ringTilt)

    const outerRing = new THREE.Mesh(new THREE.TorusGeometry(1, 0.008, 8, 220), createChromeMaterial('#ff9be8'))
    outerRing.rotation.x = Math.PI / 2
    const outerTilt = new THREE.Group()
    outerTilt.rotation.set(-0.5, 0, 0.6)
    outerTilt.add(outerRing)
    outerTilt.scale.setScalar(1.9)
    this.halo.add(outerTilt)

    const orbGeometry = new THREE.SphereGeometry(0.075, 24, 16)
    const tints = ['#ffffff', '#ff9be8', '#9ff3ff']

    tints.forEach((tint, index) => {
      const mesh = new THREE.Mesh(orbGeometry, createChromeMaterial(tint))
      const tilt = new THREE.Quaternion().setFromEuler(new THREE.Euler(0.4 + index * 0.7, index * 1.3, -0.3 + index * 0.5))
      this.orbiters.push({ mesh, tilt, radius: 1.45 + index * 0.22, speed: 0.9 - index * 0.18, phase: index * 2.1 })
      this.halo.add(mesh)
    })

    this.scene.add(this.halo)
  }

  private createFloaters(isHigh: boolean) {
    const sparkleGeometry = createSparkleGeometry()
    const heartGeometry = createHeartGeometry()
    const definitions = isHigh ? FLOATERS : FLOATERS.slice(0, 8)

    definitions.forEach((definition, index) => {
      let object: THREE.Object3D

      switch (definition.kind) {
        case 'floppy':
          object = createFloppyDisk(definition.color, definition.label)
          break
        case 'cd':
          object = createCompactDisc()
          break
        case 'star':
          object = new THREE.Mesh(sparkleGeometry, createChromeMaterial(definition.tint))
          break
        case 'heart':
          object = new THREE.Mesh(heartGeometry, createCandyMaterial(definition.color))
          break
      }

      const [x, y, z] = definition.position
      const freeSpin = definition.kind === 'star'
      object.userData.pickIndex = index

      const floater: Floater = {
        object,
        anchor: new THREE.Vector3(x, y, z),
        scale: definition.scale,
        bob: 0.12 + Math.random() * 0.14,
        bobSpeed: 0.6 + Math.random() * 0.5,
        phase: Math.random() * Math.PI * 2,
        freeSpin,
        yaw: freeSpin ? Math.random() * Math.PI * 2 : (Math.random() - 0.5) * 0.8,
        swing: 0.45 + Math.random() * 0.35,
        rotationSpeed: new THREE.Vector3(
          0.25 + Math.random() * 0.3,
          (freeSpin ? 0.9 : 0.35 + Math.random() * 0.25) * (Math.random() > 0.5 ? 1 : -1),
          0.2 + Math.random() * 0.3,
        ),
        spin: 0,
        spinAngle: 0,
        hover: 0,
      }

      this.floaters.push(floater)
      this.pickables.push(object)
      this.scene.add(object)
    })
  }

  private createButterflies(count: number) {
    const looks: Array<[string, string]> = [
      ['#ff4fd8', '#9ff3ff'],
      ['#39c8ff', '#ff9be8'],
      ['#b44dff', '#fff6a8'],
    ]

    for (let index = 0; index < count; index += 1) {
      const [color, sheen] = looks[index % looks.length]
      const butterfly = createButterfly(color, sheen)
      butterfly.group.scale.setScalar(0.34)
      butterfly.group.userData.butterflyIndex = index

      this.butterflies.push({
        ...butterfly,
        center: new THREE.Vector3(index === 0 ? 1.2 : index === 1 ? -0.5 : 2.6, 0.6 + index * 0.35, -0.8 - index * 0.9),
        radius: new THREE.Vector3(3.2 + index * 0.6, 1.1 + index * 0.2, 2.2),
        frequency: new THREE.Vector3(0.21 + index * 0.04, 0.37 + index * 0.05, 0.16 + index * 0.03),
        phase: index * 2.4,
        clock: Math.random() * 20,
        boost: 0,
        hover: 0,
      })

      this.pickables.push(butterfly.group)
      this.scene.add(butterfly.group)
    }
  }

  private createPointMaterial(extraVertex: string) {
    return new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: {
        uTime: { value: 0 },
        uProjScale: { value: 1000 },
        uColors: { value: [new THREE.Color(), new THREE.Color(), new THREE.Color(), new THREE.Color()] },
      },
      vertexShader: /* glsl */ `
        uniform float uTime;
        uniform float uProjScale;
        uniform vec3 uColors[4];
        attribute float aSize;
        attribute float aPhase;
        attribute float aColorIndex;
        varying vec3 vColor;
        varying float vAlpha;
        void main() {
          vec3 p = position;
          float alpha = 1.0;
          float sizeScale = 1.0;
          ${extraVertex}
          vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
          gl_Position = projectionMatrix * mvPosition;
          gl_PointSize = min(aSize * sizeScale * uProjScale / max(-mvPosition.z, 0.1), 96.0);
          vColor = uColors[int(aColorIndex)];
          vAlpha = alpha;
        }
      `,
      fragmentShader: /* glsl */ `
        varying vec3 vColor;
        varying float vAlpha;
        void main() {
          vec2 uv = gl_PointCoord - 0.5;
          float d = length(uv);
          float cross = max(0.0, 1.0 - abs(uv.x) * 16.0) * max(0.0, 1.0 - abs(uv.y) * 2.1)
            + max(0.0, 1.0 - abs(uv.y) * 16.0) * max(0.0, 1.0 - abs(uv.x) * 2.1);
          float core = 1.0 - smoothstep(0.0, 0.2, d);
          float alpha = clamp(cross + core, 0.0, 1.0) * vAlpha;
          if (alpha < 0.01) discard;
          gl_FragColor = vec4(mix(vColor, vec3(1.0), core * 0.35), alpha);
        }
      `,
    })
  }

  private createSparkles(count: number) {
    const geometry = new THREE.BufferGeometry()
    const positions = new Float32Array(count * 3)
    const sizes = new Float32Array(count)
    const phases = new Float32Array(count)
    const colorIndex = new Float32Array(count)

    for (let index = 0; index < count; index += 1) {
      positions[index * 3] = (Math.random() - 0.5) * 26
      positions[index * 3 + 1] = FLOOR_Y + 0.4 + Math.random() * 9
      positions[index * 3 + 2] = -22 + Math.random() * 26
      sizes[index] = 0.1 + Math.random() * 0.2
      phases[index] = Math.random()
      colorIndex[index] = Math.floor(Math.random() * 4)
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1))
    geometry.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1))
    geometry.setAttribute('aColorIndex', new THREE.BufferAttribute(colorIndex, 1))

    const material = this.createPointMaterial(
      /* glsl */ `
        p.y += sin(uTime * 0.35 + aPhase * 6.2831) * 0.18;
        p.x += cos(uTime * 0.21 + aPhase * 12.0) * 0.12;
        float twinkle = 0.5 + 0.5 * sin(uTime * (1.4 + aPhase * 2.2) + aPhase * 40.0);
        alpha = pow(twinkle, 1.6);
        sizeScale = 0.55 + twinkle * 0.7;
      `,
    )

    const points = new THREE.Points(geometry, material)
    points.frustumCulled = false
    this.scene.add(points)
    return points
  }

  private createBurst() {
    const geometry = new THREE.BufferGeometry()
    const positions = new Float32Array(BURST_CAPACITY * 3)
    const sizes = new Float32Array(BURST_CAPACITY)
    const phases = new Float32Array(BURST_CAPACITY)
    const colorIndex = new Float32Array(BURST_CAPACITY)

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3).setUsage(THREE.DynamicDrawUsage))
    geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1))
    geometry.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1).setUsage(THREE.DynamicDrawUsage))
    geometry.setAttribute('aColorIndex', new THREE.BufferAttribute(colorIndex, 1))

    // aPhase doubles as remaining life for burst particles.
    const material = this.createPointMaterial(
      /* glsl */ `
        alpha = smoothstep(0.0, 0.25, aPhase);
        sizeScale = 0.4 + aPhase * 0.9;
      `,
    )

    const points = new THREE.Points(geometry, material)
    points.frustumCulled = false
    this.scene.add(points)
    return points
  }

  /* ---------------------------------------------------------------- */
  /* Palette / theme                                                   */
  /* ---------------------------------------------------------------- */

  private applyPalette(palette: ScenePalette) {
    const skyUniforms = this.sky.material.uniforms
    skyUniforms.uTop.value.set(palette.skyTop)
    skyUniforms.uHorizon.value.set(palette.skyHorizon)
    skyUniforms.uBottom.value.set(palette.skyBottom)
    skyUniforms.uGlow.value.set(palette.skyGlow)
    skyUniforms.uGlowStrength.value = palette.skyGlowStrength

    const floorUniforms = this.floor.material.uniforms
    floorUniforms.uFloor.value.set(palette.floor)
    floorUniforms.uGrid.value.set(palette.grid)
    floorUniforms.uFog.value.set(palette.skyHorizon)
    floorUniforms.uIntensity.value = palette.gridIntensity

    const sunUniforms = this.sun.material.uniforms
    sunUniforms.uTop.value.set(palette.sunTop)
    sunUniforms.uBottom.value.set(palette.sunBottom)
    sunUniforms.uOpacity.value = palette.sunOpacity

    const shadowMaterial = this.shadow.material
    shadowMaterial.uniforms.uColor.value.set(palette.shadow)
    shadowMaterial.uniforms.uOpacity.value = palette.shadowOpacity
    shadowMaterial.blending = palette.sparkleAdditive ? THREE.AdditiveBlending : THREE.NormalBlending

    this.ambientLight.color.set(palette.ambient)
    this.ambientLight.intensity = palette.ambientIntensity
    this.keyLight.color.set(palette.key)
    this.keyLight.intensity = palette.keyIntensity
    this.rimLight.color.set(palette.rim)
    this.rimLight.intensity = palette.rimIntensity * 5

    for (const points of [this.sparkles, this.burst]) {
      const colors = points.material.uniforms.uColors.value as THREE.Color[]
      palette.sparkles.forEach((color, index) => colors[index]?.set(color))
      points.material.blending = palette.sparkleAdditive ? THREE.AdditiveBlending : THREE.NormalBlending
    }

    if (this.bloomPass) {
      this.bloomPass.strength = palette.bloom.strength
      this.bloomPass.radius = palette.bloom.radius
      this.bloomPass.threshold = palette.bloom.threshold
    }

    const screen = this.screenPass.uniforms
    screen.uAberration.value = palette.crt.aberration
    screen.uScanline.value = palette.crt.scanline
    screen.uGrain.value = palette.crt.grain
    screen.uVignette.value = palette.crt.vignette
    ;(screen.uVignetteColor.value as THREE.Color).set(palette.crt.vignetteColor)
    screen.uRoll.value = palette.crt.roll

    this.rebuildEnvironment()
  }

  private rebuildEnvironment() {
    this.envTarget?.dispose()
    this.envTarget = createY2KEnvironment(this.renderer, this.palette)
    this.scene.environment = this.envTarget.texture
  }

  /* ---------------------------------------------------------------- */
  /* Layout                                                            */
  /* ---------------------------------------------------------------- */

  private handleResize() {
    const width = Math.max(1, this.host.clientWidth)
    const height = Math.max(1, this.host.clientHeight)
    const aspect = width / height
    const isPortrait = aspect < 1

    this.renderer.setSize(width, height, false)
    this.composer.setSize(width, height)

    this.camera.aspect = aspect
    this.camera.fov = isPortrait ? 52 : 38
    this.camera.updateProjectionMatrix()

    this.cameraBase.set(0, isPortrait ? 1 : 0.6, isPortrait ? 10.5 : 9)
    this.lookTarget.set(0, isPortrait ? 0.5 : 0.15, 0)
    this.spread = clamp(aspect / 1.6, 0.5, 1.35)

    if (isPortrait) {
      this.blobAnchor.set(0, 1.1, 0)
      this.blobScale = 1.05
    } else {
      this.blobAnchor.set(Math.min(2, 1.2 * aspect), 0.3, 0)
      this.blobScale = 1.12
    }

    const pixelRatio = this.renderer.getPixelRatio()
    const bufferHeight = height * pixelRatio
    const projScale = bufferHeight / (2 * Math.tan(THREE.MathUtils.degToRad(this.camera.fov) / 2))
    this.sparkles.material.uniforms.uProjScale.value = projScale
    this.burst.material.uniforms.uProjScale.value = projScale

    const screen = this.screenPass.uniforms
    ;(screen.uResolution.value as THREE.Vector2).set(width * pixelRatio, height * pixelRatio)
    screen.uPixelRatio.value = pixelRatio

    this.requestStaticFrame()
  }

  /* ---------------------------------------------------------------- */
  /* Interaction                                                       */
  /* ---------------------------------------------------------------- */

  private toNdc(event: PointerEvent, target: THREE.Vector2) {
    const rect = this.renderer.domElement.getBoundingClientRect()
    target.set(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1,
    )
    return target
  }

  private handlePointerMove = (event: PointerEvent) => {
    this.toNdc(event, this.pointer)
    this.pointer.set(clamp(this.pointer.x, -1.2, 1.2), clamp(this.pointer.y, -1.2, 1.2))
    this.isPointerOverCanvas = event.target === this.renderer.domElement

    if (this.isPointerOverCanvas) {
      this.hoverPointer.copy(this.pointer)
      this.hoverPending = true
    } else {
      this.clearHover()
    }
  }

  private handlePointerLeave = () => {
    this.isPointerOverCanvas = false
    this.clearHover()
  }

  private clearHover() {
    this.hoveredFloater = null
    this.hoveredButterfly = null
    this.blobHoverTarget = 0
    this.renderer.domElement.style.cursor = ''
  }

  private handlePointerDown = (event: PointerEvent) => {
    if (this.options.reducedMotion || event.button !== 0) {
      return
    }

    const ndc = this.toNdc(event, new THREE.Vector2())
    const result = this.pick(ndc)

    switch (result.type) {
      case 'blob':
        this.pulse = 1
        this.glitch = Math.max(this.glitch, 0.5)
        this.spawnBurst(result.point, 56, 4.2)
        this.startRipple(this.blob.position.x, this.blob.position.z)
        break
      case 'floater':
        result.target.spin += 16
        this.spawnBurst(result.point, 34, 3.2)
        break
      case 'butterfly':
        result.target.boost = 1
        this.spawnBurst(result.point, 22, 2.4)
        break
      case 'floor':
        this.startRipple(result.point.x, result.point.z)
        this.spawnBurst(result.point, 18, 2.6)
        break
      case 'sky':
        this.spawnBurst(result.point, 40, 3.4)
        break
    }
  }

  private pick(ndc: THREE.Vector2): PickResult {
    this.raycaster.setFromCamera(ndc, this.camera)
    const ray = this.raycaster.ray

    let best: PickResult | null = null
    let bestDistance = Infinity

    const blobHit = ray.intersectSphere(
      new THREE.Sphere(this.blob.position, this.blob.scale.x * 1.08),
      new THREE.Vector3(),
    )

    if (blobHit) {
      best = { type: 'blob', point: blobHit }
      bestDistance = blobHit.distanceTo(ray.origin)
    }

    const hits = this.raycaster.intersectObjects(this.pickables, true)

    for (const hit of hits) {
      if (hit.distance >= bestDistance) {
        break
      }

      let node: THREE.Object3D | null = hit.object

      while (node && node.userData.pickIndex === undefined && node.userData.butterflyIndex === undefined) {
        node = node.parent
      }

      if (!node) {
        continue
      }

      if (node.userData.pickIndex !== undefined) {
        best = { type: 'floater', target: this.floaters[node.userData.pickIndex as number], point: hit.point }
      } else {
        best = { type: 'butterfly', target: this.butterflies[node.userData.butterflyIndex as number], point: hit.point }
      }

      bestDistance = hit.distance
      break
    }

    if (best) {
      return best
    }

    const floorPoint = ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 1, 0), -FLOOR_Y), new THREE.Vector3())

    if (floorPoint && floorPoint.distanceTo(ray.origin) < 60) {
      return { type: 'floor', point: floorPoint }
    }

    return { type: 'sky', point: ray.at(8, new THREE.Vector3()) }
  }

  private updateHover() {
    if (!this.hoverPending || !this.isPointerOverCanvas) {
      return
    }

    this.hoverPending = false
    const result = this.pick(this.hoverPointer)

    this.hoveredFloater = result.type === 'floater' ? result.target : null
    this.hoveredButterfly = result.type === 'butterfly' ? result.target : null
    this.blobHoverTarget = result.type === 'blob' ? 1 : 0

    if (result.type === 'blob') {
      const local = this.blob.worldToLocal(result.point.clone())
      this.blobUniforms.uPointerDir.value.copy(local.normalize())
    }

    this.renderer.domElement.style.cursor =
      result.type === 'blob' || result.type === 'floater' || result.type === 'butterfly' ? 'pointer' : 'crosshair'
  }

  private startRipple(x: number, z: number) {
    const uniforms = this.floor.material.uniforms
    ;(uniforms.uRipple.value as THREE.Vector3).set(x, z, uniforms.uTime.value as number)
  }

  private spawnBurst(origin: THREE.Vector3, count: number, speed: number) {
    const positions = this.burst.geometry.getAttribute('position') as THREE.BufferAttribute
    const life = this.burst.geometry.getAttribute('aPhase') as THREE.BufferAttribute
    const sizes = this.burst.geometry.getAttribute('aSize') as THREE.BufferAttribute
    const colors = this.burst.geometry.getAttribute('aColorIndex') as THREE.BufferAttribute
    const direction = new THREE.Vector3()

    for (let index = 0; index < count; index += 1) {
      const slot = this.burstCursor
      this.burstCursor = (this.burstCursor + 1) % BURST_CAPACITY

      direction.randomDirection()
      const velocity = speed * (0.35 + Math.random() * 0.65)

      positions.setXYZ(slot, origin.x, origin.y, origin.z)
      this.burstVelocity[slot * 3] = direction.x * velocity
      this.burstVelocity[slot * 3 + 1] = direction.y * velocity + 1.2
      this.burstVelocity[slot * 3 + 2] = direction.z * velocity
      life.setX(slot, 0.7 + Math.random() * 0.3)
      sizes.setX(slot, 0.1 + Math.random() * 0.16)
      colors.setX(slot, Math.floor(Math.random() * 4))
    }

    sizes.needsUpdate = true
    colors.needsUpdate = true
  }

  /* ---------------------------------------------------------------- */
  /* Loop                                                              */
  /* ---------------------------------------------------------------- */

  private handleVisibility = () => {
    this.hidden = document.hidden
    this.syncLoop()
  }

  private handleContextLost = (event: Event) => {
    event.preventDefault()
    this.contextLost = true
    this.syncLoop()
    this.options.onContextLost?.()
  }

  private handleContextRestored = () => {
    this.contextLost = false
    this.rebuildEnvironment()
    this.syncLoop()
    this.requestStaticFrame()
  }

  private syncLoop() {
    const shouldRun = !this.disposed && !this.paused && !this.hidden && !this.contextLost && !this.options.reducedMotion

    if (shouldRun) {
      this.start()
    } else {
      this.stop()
    }
  }

  private start() {
    if (this.running) {
      return
    }

    this.running = true
    this.lastTime = performance.now()
    this.frameId = requestAnimationFrame(this.tick)
  }

  private stop() {
    this.running = false
    cancelAnimationFrame(this.frameId)
  }

  private requestStaticFrame() {
    if (!this.running && !this.contextLost && !this.disposed) {
      this.update(0)
      this.renderFrame()
    }
  }

  private tick = (now: number) => {
    if (!this.running) {
      return
    }

    this.frameId = requestAnimationFrame(this.tick)
    const dt = Math.min((now - this.lastTime) / 1000, 1 / 20)
    this.lastTime = now
    this.update(dt)
    this.renderFrame()
  }

  private renderFrame() {
    this.composer.render()

    if (!this.hasRendered) {
      this.hasRendered = true
      this.options.onReady?.()
    }
  }

  private update(dt: number) {
    this.elapsed += dt
    const t = this.elapsed

    this.updateHover()

    this.pulse = Math.max(0, this.pulse - dt * 0.85)
    this.glitch = Math.max(0, this.glitch - dt * 1.8)

    // Camera drift + pointer parallax.
    this.pointerSmooth.x = damp(this.pointerSmooth.x, this.pointer.x, 2.5, dt)
    this.pointerSmooth.y = damp(this.pointerSmooth.y, this.pointer.y, 2.5, dt)
    this.camera.position.set(
      this.cameraBase.x + this.pointerSmooth.x * 0.75 + Math.sin(t * 0.13) * 0.25,
      this.cameraBase.y + this.pointerSmooth.y * 0.4 + Math.sin(t * 0.17) * 0.12,
      this.cameraBase.z + Math.sin(t * 0.09) * 0.2,
    )
    this.camera.lookAt(
      this.lookTarget.x + this.pointerSmooth.x * 0.25,
      this.lookTarget.y + this.pointerSmooth.y * 0.12,
      this.lookTarget.z,
    )
    this.sky.position.copy(this.camera.position)

    // Liquid chrome blob.
    const pulse = easeOutCubic(this.pulse)
    this.blobUniforms.uTime.value = t
    this.blobUniforms.uPulse.value = pulse
    this.blobUniforms.uHover.value = damp(this.blobUniforms.uHover.value, this.blobHoverTarget, 6, dt)
    this.blob.position.set(this.blobAnchor.x, this.blobAnchor.y + Math.sin(t * 0.8) * 0.14, this.blobAnchor.z)
    this.blob.rotation.y += dt * (0.12 + pulse * 2.5)
    this.blob.rotation.x = Math.sin(t * 0.3) * 0.2
    this.blob.scale.setScalar(this.blobScale * (1 + pulse * 0.08))

    this.halo.position.copy(this.blob.position)
    this.halo.scale.setScalar(this.blobScale)
    this.halo.rotation.y = t * 0.25
    this.halo.rotation.z = Math.sin(t * 0.2) * 0.15

    for (const orbiter of this.orbiters) {
      const angle = t * orbiter.speed + orbiter.phase
      orbiter.mesh.position
        .set(Math.cos(angle) * orbiter.radius, 0, Math.sin(angle) * orbiter.radius)
        .applyQuaternion(orbiter.tilt)
    }

    this.shadow.position.x = this.blob.position.x
    this.shadow.position.z = this.blob.position.z
    const lift = this.blob.position.y - FLOOR_Y
    this.shadow.scale.setScalar(this.blobScale * (5.2 - lift * 0.35))

    this.rimLight.position.set(this.blob.position.x - 3, 1.5, -2.5)

    // Floating desktop junk.
    for (const floater of this.floaters) {
      const isHovered = floater === this.hoveredFloater
      floater.hover = damp(floater.hover, isHovered ? 1 : 0, 8, dt)
      floater.spin *= Math.exp(-dt * 1.6)

      // Clicked objects do a few full turns, then settle back on a whole revolution.
      floater.spinAngle += floater.spin * dt
      if (Math.abs(floater.spin) < 1.5) {
        const settled = Math.round(floater.spinAngle / (Math.PI * 2)) * Math.PI * 2
        floater.spinAngle = damp(floater.spinAngle, settled, 3, dt)
      }

      const { object, anchor, rotationSpeed } = floater
      object.position.set(
        anchor.x * this.spread,
        anchor.y + Math.sin(t * floater.bobSpeed + floater.phase) * floater.bob + floater.hover * 0.12,
        anchor.z,
      )

      if (floater.freeSpin) {
        object.rotation.set(
          Math.sin(t * rotationSpeed.x + floater.phase) * 0.35,
          floater.yaw + t * rotationSpeed.y + floater.spinAngle,
          Math.sin(t * rotationSpeed.z + floater.phase) * 0.2,
        )
      } else {
        object.rotation.set(
          Math.sin(t * rotationSpeed.x + floater.phase) * 0.28,
          floater.yaw + Math.sin(t * rotationSpeed.y + floater.phase) * floater.swing + floater.spinAngle,
          Math.sin(t * rotationSpeed.z + floater.phase * 1.7) * 0.18,
        )
      }

      object.scale.setScalar(floater.scale * (1 + floater.hover * 0.2))
    }

    // Butterflies on Lissajous flight paths.
    const nextPosition = new THREE.Vector3()

    for (const butterfly of this.butterflies) {
      const isHovered = butterfly === this.hoveredButterfly
      butterfly.hover = damp(butterfly.hover, isHovered ? 1 : 0, 8, dt)
      butterfly.boost = Math.max(0, butterfly.boost - dt * 0.45)
      butterfly.clock += dt * (1 + butterfly.boost * 3.5)

      const positionAt = (time: number, target: THREE.Vector3) =>
        target.set(
          butterfly.center.x * this.spread + Math.sin(time * butterfly.frequency.x + butterfly.phase) * butterfly.radius.x * this.spread,
          butterfly.center.y + Math.sin(time * butterfly.frequency.y * 2 + butterfly.phase) * butterfly.radius.y,
          butterfly.center.z + Math.cos(time * butterfly.frequency.z + butterfly.phase) * butterfly.radius.z,
        )

      positionAt(butterfly.clock, butterfly.group.position)
      positionAt(butterfly.clock + 0.4, nextPosition)
      butterfly.group.lookAt(nextPosition)

      const flap = Math.sin(t * (13 + butterfly.boost * 14) + butterfly.phase) * (0.95 + butterfly.hover * 0.25)
      butterfly.rightWing.rotation.y = -flap
      butterfly.leftWing.rotation.y = flap
      butterfly.group.scale.setScalar(0.34 * (1 + butterfly.hover * 0.25))
    }

    // Particles.
    this.sparkles.material.uniforms.uTime.value = t
    this.burst.material.uniforms.uTime.value = t
    this.updateBurst(dt)

    this.floor.material.uniforms.uTime.value = t
    this.sun.material.uniforms.uTime.value = t

    this.screenPass.uniforms.uTime.value = t
    this.screenPass.uniforms.uGlitch.value = this.glitch
  }

  private updateBurst(dt: number) {
    if (dt === 0) {
      return
    }

    const positions = this.burst.geometry.getAttribute('position') as THREE.BufferAttribute
    const life = this.burst.geometry.getAttribute('aPhase') as THREE.BufferAttribute
    const drag = Math.exp(-dt * 1.8)
    let active = false

    for (let index = 0; index < BURST_CAPACITY; index += 1) {
      const remaining = life.getX(index)

      if (remaining <= 0) {
        continue
      }

      active = true
      const offset = index * 3
      this.burstVelocity[offset] *= drag
      this.burstVelocity[offset + 1] = this.burstVelocity[offset + 1] * drag - 2.6 * dt
      this.burstVelocity[offset + 2] *= drag

      positions.setXYZ(
        index,
        positions.getX(index) + this.burstVelocity[offset] * dt,
        positions.getY(index) + this.burstVelocity[offset + 1] * dt,
        positions.getZ(index) + this.burstVelocity[offset + 2] * dt,
      )
      life.setX(index, Math.max(0, remaining - dt * 0.75))
    }

    if (active) {
      positions.needsUpdate = true
      life.needsUpdate = true
    }
  }
}
