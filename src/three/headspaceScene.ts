import * as THREE from 'three'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'
import { BAND_COUNT, SpectrumSynth } from '../audio/spectrum'
import { player, TRACKS } from '../stores/player'
import { disposeObject } from './utils'

// A tribute to the Windows Media Player 7 "Headspace" skin: a glossy green head whose visor
// is the visualizer. It nods to the beat, looks at the cursor and naps when the music stops.

export const VISUALIZATIONS = ['bars', 'ambience', 'battery', 'scope'] as const
export type VisualizationName = (typeof VISUALIZATIONS)[number]

export type HeadspaceOptions = {
  reducedMotion: boolean
  onVisorClick?: () => void
}

// Head silhouette (radius, height) spun around the Y axis.
const HEAD_PROFILE = new THREE.SplineCurve([
  new THREE.Vector2(0.001, -1.02),
  new THREE.Vector2(0.36, -0.98),
  new THREE.Vector2(0.58, -0.84),
  new THREE.Vector2(0.7, -0.58),
  new THREE.Vector2(0.8, -0.28),
  new THREE.Vector2(0.94, 0.06),
  new THREE.Vector2(1.03, 0.42),
  new THREE.Vector2(1.05, 0.74),
  new THREE.Vector2(0.97, 1.03),
  new THREE.Vector2(0.78, 1.27),
  new THREE.Vector2(0.46, 1.43),
  new THREE.Vector2(0.001, 1.48),
])
const PROFILE_POINTS = HEAD_PROFILE.getPoints(72)

const radiusAt = (y: number) => {
  for (let index = 1; index < PROFILE_POINTS.length; index += 1) {
    const a = PROFILE_POINTS[index - 1]
    const b = PROFILE_POINTS[index]

    if (y >= a.y && y <= b.y) {
      return THREE.MathUtils.lerp(a.x, b.x, (y - a.y) / (b.y - a.y))
    }
  }

  return 0
}

// Evenly sampled slice of the head silhouette, pushed outward so it sits on the skull.
const profileSlice = (from: number, to: number, steps: number, scale: number, offset = 0) =>
  Array.from({ length: steps + 1 }, (_, index) => {
    const y = from + ((to - from) * index) / steps
    return new THREE.Vector2(radiusAt(y) * scale + offset, y)
  })

const VISOR_BOTTOM = -0.34
const VISOR_TOP = 0.56
const VISOR_ARC = 1.9

const VISOR_VERTEX = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vViewDir;
  void main() {
    vUv = uv;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vNormal = normalize(normalMatrix * normal);
    vViewDir = normalize(-mvPosition.xyz);
    gl_Position = projectionMatrix * mvPosition;
  }
`

const VISOR_FRAGMENT = /* glsl */ `
  uniform float uTime;
  uniform float uLevels[${BAND_COUNT}];
  uniform float uBass;
  uniform float uMid;
  uniform float uTreble;
  uniform float uEnergy;
  uniform float uKick;
  uniform float uMode;
  uniform float uPlaying;
  uniform float uGlitch;
  uniform float uBlink;
  uniform vec2 uLook;
  uniform float uAspect;
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vViewDir;

  const vec3 LIME = vec3(0.55, 1.0, 0.2);
  const vec3 MINT = vec3(0.2, 1.0, 0.6);
  const vec3 PINK = vec3(1.0, 0.2, 0.85);
  const vec3 GOLD = vec3(1.0, 0.85, 0.2);

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
  }

  float bandAt(float x) {
    float f = clamp(x, 0.0, 1.0) * ${(BAND_COUNT - 1).toFixed(1)};
    int i = int(floor(f));
    int j = min(i + 1, ${BAND_COUNT - 1});
    return mix(uLevels[i], uLevels[j], fract(f));
  }

  vec3 barsAndWaves(vec2 s) {
    float x = s.x / uAspect + 0.5;
    float columns = 26.0;
    float column = floor(x * columns);
    float inColumn = fract(x * columns);
    float level = bandAt(abs(column - (columns - 1.0) * 0.5) / ((columns - 1.0) * 0.5));
    float base = -0.42;
    float height = level * 0.8;
    float y = s.y - base;
    float lit = step(0.0, y) * step(y, height) * step(0.12, inColumn) * step(inColumn, 0.88);
    lit *= step(0.28, fract(y * 34.0));
    vec3 ramp = mix(LIME, GOLD, smoothstep(0.1, 0.45, y));
    ramp = mix(ramp, PINK, smoothstep(0.45, 0.75, y));
    float cap = exp(-abs(y - height - 0.03) * 140.0) * step(0.12, inColumn) * step(inColumn, 0.88) * step(0.02, level);
    float waveY = 0.2 + sin(x * 11.0 + uTime * 3.5) * 0.07 * (0.4 + uMid) + sin(x * 29.0 - uTime * 6.0) * 0.03 * uTreble;
    float wave = exp(-abs(s.y - waveY) * 70.0);
    return ramp * lit + vec3(1.0) * cap * 0.8 + MINT * wave * 0.9;
  }

  vec3 ambience(vec2 s) {
    vec2 p = s * 3.2;
    float t = uTime * 0.55;
    float v = sin(p.x + t) + sin(p.y * 1.3 - t * 1.2) + sin((p.x + p.y) * 0.8 + t * 0.7);
    v += sin(length(p + vec2(sin(t * 0.5), cos(t * 0.3)) * 1.5) * 2.6 - t * 2.2 - uBass * 5.0);
    vec3 color = 0.5 + 0.5 * cos(6.2831 * (v * 0.17 + vec3(0.0, 0.33, 0.67) + uTime * 0.04));
    color = mix(color, LIME, 0.22);
    return color * (0.35 + uEnergy * 1.1);
  }

  vec3 battery(vec2 s) {
    float r = length(s);
    float angle = atan(s.y, s.x) + uTime * 0.35;
    float segment = 6.2831 / 8.0;
    angle = abs(mod(angle, segment) - segment * 0.5);
    vec2 k = vec2(cos(angle), sin(angle)) * r;
    float rings = 0.5 + 0.5 * sin(r * 42.0 - uTime * 6.0 - uBass * 12.0);
    float petals = sin(k.x * 26.0 + uTime * 2.0) * sin(k.y * 26.0 - uTime * 3.0);
    float value = smoothstep(0.35, 1.0, rings) * (0.55 + petals * 0.45);
    vec3 color = mix(LIME, PINK, 0.5 + 0.5 * sin(r * 9.0 - uTime * 2.0));
    return color * value * (0.45 + uEnergy * 1.2) + GOLD * exp(-r * 7.0) * uKick * 1.4;
  }

  vec3 scope(vec2 s) {
    float glow = 0.0;
    for (int k = 0; k < 3; k++) {
      float fk = float(k);
      float x = s.x * 9.0;
      float amp = 0.07 + bandAt(0.15 + fk * 0.3) * 0.26;
      float y = sin(x * (1.0 + fk * 0.7) + uTime * (3.0 + fk)) * amp + sin(x * 3.3 - uTime * 5.0) * 0.03 * uTreble;
      glow += exp(-abs(s.y - y + (fk - 1.0) * 0.015) * 85.0) * (1.0 - fk * 0.25);
    }
    vec2 grid = abs(fract(s * vec2(10.0, 10.0)) - 0.5);
    float lines = (1.0 - smoothstep(0.0, 0.03, min(grid.x, grid.y))) * 0.08;
    return LIME * glow + PINK * glow * 0.25 + LIME * lines;
  }

  vec3 face(vec2 s) {
    vec2 look = uLook * vec2(0.09, 0.05);
    float eyeHeight = mix(0.15, 0.012, uBlink);
    vec2 left = (s - vec2(-0.33, 0.04) - look) / vec2(0.12, eyeHeight);
    vec2 right = (s - vec2(0.33, 0.04) - look) / vec2(0.12, eyeHeight);
    float eyes = max(1.0 - smoothstep(0.82, 1.0, length(left)), 1.0 - smoothstep(0.82, 1.0, length(right)));
    float glint = (1.0 - smoothstep(0.0, 0.25, length(left - vec2(-0.35, 0.4)))) + (1.0 - smoothstep(0.0, 0.25, length(right - vec2(-0.35, 0.4))));
    float halo = exp(-length(left) * 1.4) + exp(-length(right) * 1.4);
    return LIME * eyes * (1.0 - glint * 0.6) + vec3(1.0) * glint * eyes * 0.7 + LIME * halo * 0.18;
  }

  void main() {
    vec2 uv = vUv;

    // Track-change glitch: slices jump sideways.
    float slice = floor(uv.y * 24.0);
    uv.x += (hash(vec2(slice, floor(uTime * 30.0))) - 0.5) * 0.08 * uGlitch;

    vec2 s = (uv - 0.5) * vec2(uAspect, 1.0);

    // Rounded-rectangle visor mask.
    vec2 halfSize = vec2(uAspect * 0.5, 0.5) - 0.015;
    float radius = 0.2;
    float d = length(max(abs(s) - halfSize + radius, 0.0)) - radius;
    if (d > 0.0) discard;

    vec3 viz;
    if (uMode < 0.5) viz = barsAndWaves(s);
    else if (uMode < 1.5) viz = ambience(s);
    else if (uMode < 2.5) viz = battery(s);
    else viz = scope(s);

    vec3 color = vec3(0.01, 0.05, 0.02) + mix(face(s), viz, uPlaying);

    // Glass: scanlines, glossy reflection band, fresnel rim, bezel.
    color *= 0.86 + 0.14 * sin(uv.y * 260.0);
    float band = exp(-pow((s.x * 0.45 + s.y - 0.32) * 5.0, 2.0));
    color += vec3(0.85, 1.0, 0.9) * band * 0.12;
    float fresnel = pow(1.0 - max(dot(normalize(vNormal), normalize(vViewDir)), 0.0), 3.0);
    color += vec3(0.5, 1.0, 0.6) * fresnel * 0.25;
    color = mix(color, vec3(0.03, 0.12, 0.02), smoothstep(-0.03, -0.004, d));
    color += vec3(0.6, 1.0, 0.4) * exp(-abs(d + 0.022) * 220.0) * 0.35;

    gl_FragColor = vec4(color, 1.0);
  }
`

type Spring = { angle: number; velocity: number }

const stepSpring = (spring: Spring, target: number, impulse: number, dt: number) => {
  spring.velocity += (impulse + (target - spring.angle) * 90 - spring.velocity * 7) * dt
  spring.angle += spring.velocity * dt
}

export class HeadspaceScene {
  private readonly host: HTMLElement
  private readonly options: HeadspaceOptions
  private readonly renderer: THREE.WebGLRenderer
  private readonly scene = new THREE.Scene()
  private readonly camera = new THREE.PerspectiveCamera(32, 1, 0.1, 50)
  private readonly envTarget: THREE.WebGLRenderTarget
  private readonly resizeObserver: ResizeObserver
  private readonly raycaster = new THREE.Raycaster()
  private readonly spectrum = new SpectrumSynth()

  private readonly root = new THREE.Group()
  private readonly headPivot = new THREE.Group()
  private readonly head = new THREE.Group()
  private readonly skull: THREE.Mesh
  private readonly visor: THREE.Mesh<THREE.BufferGeometry, THREE.ShaderMaterial>
  private readonly mouth: THREE.Mesh
  private readonly earCones: THREE.Mesh[] = []
  private readonly antennae: Array<{ pivot: THREE.Group; tip: THREE.Mesh<THREE.SphereGeometry, THREE.MeshStandardMaterial>; spring: Spring; side: number }> = []
  private readonly powerRing: THREE.Mesh<THREE.TorusGeometry, THREE.MeshStandardMaterial>
  private readonly floorGlow: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>

  private readonly pointer = new THREE.Vector2()
  private readonly hoverPointer = new THREE.Vector2()
  private hoverPending = false
  private readonly look = new THREE.Vector2()
  private readonly levels = new Array<number>(BAND_COUNT).fill(0)
  private mode = 0
  private playingMix = 0
  private glitch = 0
  private boop = 0
  private spin = 0
  private spinAngle = 0
  private blink = 0
  private nextBlinkAt = 2
  private lastTrackIndex = -1
  private lastYaw = 0
  private elapsed = 0
  private lastTime = performance.now()
  private frameId = 0

  constructor(host: HTMLElement, options: HeadspaceOptions) {
    this.host = host
    this.options = options

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    this.renderer.setClearColor(0x000000, 0)
    this.renderer.toneMapping = THREE.NeutralToneMapping
    this.renderer.domElement.className = 'headspace-scene__canvas'
    host.appendChild(this.renderer.domElement)

    const pmrem = new THREE.PMREMGenerator(this.renderer)
    const room = new RoomEnvironment()
    this.envTarget = pmrem.fromScene(room, 0.03)
    room.dispose()
    pmrem.dispose()
    this.scene.environment = this.envTarget.texture

    this.scene.add(new THREE.HemisphereLight('#eaffd2', '#12300a', 1.2))
    const key = new THREE.DirectionalLight('#ffffff', 2.2)
    key.position.set(-3, 4, 5)
    const rimPink = new THREE.PointLight('#ff4fd8', 18, 12, 1.5)
    rimPink.position.set(2.6, 1.4, -2)
    const rimCyan = new THREE.PointLight('#3ee6ff', 12, 12, 1.5)
    rimCyan.position.set(-2.8, 0.2, -1.8)
    this.scene.add(key, rimPink, rimCyan)

    const plastic = new THREE.MeshPhysicalMaterial({
      color: '#63d62b',
      roughness: 0.3,
      clearcoat: 1,
      clearcoatRoughness: 0.08,
      sheen: 0.6,
      sheenColor: new THREE.Color('#d9ffa8'),
      envMapIntensity: 1.1,
    })
    const darkPlastic = new THREE.MeshPhysicalMaterial({
      color: '#1f5a12',
      roughness: 0.35,
      clearcoat: 1,
      clearcoatRoughness: 0.12,
    })
    const chrome = new THREE.MeshStandardMaterial({ color: '#ffffff', metalness: 1, roughness: 0.15 })

    // Skull.
    this.skull = new THREE.Mesh(new THREE.LatheGeometry(PROFILE_POINTS, 72), plastic)
    this.head.add(this.skull)

    // Visor: a slice of the same silhouette, pushed slightly outward.
    const visorGeometry = new THREE.LatheGeometry(
      profileSlice(VISOR_BOTTOM, VISOR_TOP, 24, 1.018, 0.006),
      64,
      -VISOR_ARC / 2,
      VISOR_ARC,
    )
    const visorWidth = VISOR_ARC * radiusAt((VISOR_BOTTOM + VISOR_TOP) / 2)
    const visorHeight = VISOR_TOP - VISOR_BOTTOM

    this.visor = new THREE.Mesh(
      visorGeometry,
      new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uLevels: { value: this.levels },
          uBass: { value: 0 },
          uMid: { value: 0 },
          uTreble: { value: 0 },
          uEnergy: { value: 0 },
          uKick: { value: 0 },
          uMode: { value: 0 },
          uPlaying: { value: 0 },
          uGlitch: { value: 0 },
          uBlink: { value: 0 },
          uLook: { value: new THREE.Vector2() },
          uAspect: { value: visorWidth / visorHeight },
        },
        vertexShader: VISOR_VERTEX,
        fragmentShader: VISOR_FRAGMENT,
      }),
    )
    this.head.add(this.visor)

    // Brow ridge above the visor.
    const brow = new THREE.Mesh(
      new THREE.LatheGeometry(
        profileSlice(VISOR_TOP + 0.005, VISOR_TOP + 0.085, 4, 1.035),
        64,
        -VISOR_ARC / 2 - 0.08,
        VISOR_ARC + 0.16,
      ),
      darkPlastic,
    )
    this.head.add(brow)

    // Singing mouth.
    const mouthY = -0.62
    this.mouth = new THREE.Mesh(new THREE.CapsuleGeometry(0.05, 0.3, 6, 16), new THREE.MeshPhysicalMaterial({
      color: '#0c2408',
      roughness: 0.2,
      clearcoat: 1,
    }))
    this.mouth.rotation.z = Math.PI / 2
    this.mouth.position.set(0, mouthY, radiusAt(mouthY) - 0.015)
    this.head.add(this.mouth)

    // Speaker ears.
    for (const side of [-1, 1]) {
      const ear = new THREE.Group()
      const y = 0.12
      ear.position.set(side * (radiusAt(y) - 0.02), y, -0.05)
      ear.rotation.y = side * Math.PI / 2

      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.25, 0.07, 18, 48), chrome)
      const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.05, 40), darkPlastic)
      disc.rotation.x = Math.PI / 2
      const cone = new THREE.Mesh(
        new THREE.SphereGeometry(0.13, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2),
        new THREE.MeshPhysicalMaterial({ color: '#b6ff7a', metalness: 0.6, roughness: 0.2, clearcoat: 1 }),
      )
      cone.rotation.x = Math.PI / 2
      cone.position.z = 0.02
      this.earCones.push(cone)
      ear.add(ring, disc, cone)
      this.head.add(ear)
    }

    // Antennae with springy glowing tips.
    const stalkGeometry = new THREE.CylinderGeometry(0.022, 0.034, 0.62, 12)
    stalkGeometry.translate(0, 0.31, 0)

    for (const side of [-1, 1]) {
      const pivot = new THREE.Group()
      const y = 1.3
      pivot.position.set(side * 0.34, y, 0)
      const stalk = new THREE.Mesh(stalkGeometry, chrome)
      const tip = new THREE.Mesh(
        new THREE.SphereGeometry(0.095, 24, 16),
        new THREE.MeshStandardMaterial({
          color: side < 0 ? '#b6ff3a' : '#ff4fd8',
          emissive: side < 0 ? '#7dff1a' : '#ff1fc8',
          emissiveIntensity: 0.8,
          roughness: 0.25,
        }),
      )
      tip.position.y = 0.66
      pivot.add(stalk, tip)
      this.antennae.push({ pivot, tip, spring: { angle: side * 0.42, velocity: 0 }, side })
      this.head.add(pivot)
    }

    // Neck, collar and pedestal.
    this.head.position.y = 1.05
    this.headPivot.add(this.head)
    this.headPivot.position.y = -1.05

    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.34, 0.5, 32), darkPlastic)
    neck.position.y = -1.18
    const collar = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.06, 16, 48), chrome)
    collar.rotation.x = Math.PI / 2
    collar.position.y = -1.36
    const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 1.02, 0.26, 64), darkPlastic)
    pedestal.position.y = -1.55
    this.powerRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.86, 0.025, 12, 96),
      new THREE.MeshStandardMaterial({ color: '#b6ff3a', emissive: '#7dff1a', emissiveIntensity: 0.6 }),
    )
    this.powerRing.rotation.x = Math.PI / 2
    this.powerRing.position.y = -1.42

    this.floorGlow = new THREE.Mesh(
      new THREE.PlaneGeometry(4, 4),
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: { uIntensity: { value: 0.4 } },
        vertexShader: /* glsl */ `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: /* glsl */ `
          uniform float uIntensity;
          varying vec2 vUv;
          void main() {
            float d = length(vUv - 0.5) * 2.0;
            // Premultiplied output: alpha must follow the glow or the transparent canvas turns black.
            float glow = pow(max(1.0 - d, 0.0), 2.5) * uIntensity;
            gl_FragColor = vec4(vec3(0.45, 1.0, 0.2) * glow, glow);
          }
        `,
      }),
    )
    this.floorGlow.rotation.x = -Math.PI / 2
    this.floorGlow.position.y = -1.69

    this.root.add(this.headPivot, neck, collar, pedestal, this.powerRing, this.floorGlow)
    this.scene.add(this.root)

    this.resizeObserver = new ResizeObserver(() => this.handleResize())
    this.resizeObserver.observe(host)
    this.handleResize()

    window.addEventListener('pointermove', this.handlePointerMove, { passive: true })
    this.renderer.domElement.addEventListener('pointerdown', this.handlePointerDown)

    this.frameId = requestAnimationFrame(this.tick)
  }

  setMode(mode: number) {
    this.mode = ((mode % VISUALIZATIONS.length) + VISUALIZATIONS.length) % VISUALIZATIONS.length
    this.glitch = 0.8
  }

  dispose() {
    cancelAnimationFrame(this.frameId)
    this.resizeObserver.disconnect()
    window.removeEventListener('pointermove', this.handlePointerMove)
    this.renderer.domElement.removeEventListener('pointerdown', this.handlePointerDown)
    disposeObject(this.scene)
    this.envTarget.dispose()
    this.renderer.dispose()
    this.renderer.domElement.remove()
  }

  private handleResize() {
    const width = Math.max(1, this.host.clientWidth)
    const height = Math.max(1, this.host.clientHeight)
    const aspect = width / height
    this.renderer.setSize(width, height, false)
    this.camera.aspect = aspect
    // Keep the full head (antenna tips to pedestal) in frame on any aspect ratio.
    const tanHalf = Math.tan(THREE.MathUtils.degToRad(this.camera.fov) / 2)
    const distance = Math.max(2.15 / tanHalf, 1.75 / (tanHalf * aspect))
    this.camera.position.set(0, 0.2, distance)
    this.camera.lookAt(0, 0.05, 0)
    this.camera.updateProjectionMatrix()
  }

  private handlePointerMove = (event: PointerEvent) => {
    const rect = this.renderer.domElement.getBoundingClientRect()
    const x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    const y = -((event.clientY - rect.top) / rect.height) * 2 + 1
    this.pointer.set(THREE.MathUtils.clamp(x, -1.5, 1.5), THREE.MathUtils.clamp(y, -1.5, 1.5))

    // Hover picking is deferred to the next frame (at most one raycast per frame, only over the canvas).
    if (event.target === this.renderer.domElement) {
      this.hoverPointer.set(x, y)
      this.hoverPending = true
    } else {
      this.renderer.domElement.style.cursor = ''
    }
  }

  private pick(x: number, y: number) {
    this.raycaster.setFromCamera(new THREE.Vector2(x, y), this.camera)
    const [hit] = this.raycaster.intersectObjects([this.visor, this.head], true)
    return hit ?? null
  }

  private handlePointerDown = (event: PointerEvent) => {
    const rect = this.renderer.domElement.getBoundingClientRect()
    const hit = this.pick(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1,
    )

    if (!hit) {
      return
    }

    if (hit.object === this.visor) {
      this.options.onVisorClick?.()
    }

    // Any poke makes the head squash and the antennae wobble.
    this.boop = 1
    this.antennae.forEach(({ spring, side }) => {
      spring.velocity += side * 9
    })
  }

  private tick = (now: number) => {
    this.frameId = requestAnimationFrame(this.tick)
    const dt = Math.min((now - this.lastTime) / 1000, 1 / 20)
    this.lastTime = now

    if (this.hoverPending) {
      this.hoverPending = false
      this.renderer.domElement.style.cursor = this.pick(this.hoverPointer.x, this.hoverPointer.y) ? 'pointer' : ''
    }

    this.update(this.options.reducedMotion ? dt * 0.35 : dt)
    this.renderer.render(this.scene, this.camera)
  }

  private update(dt: number) {
    this.elapsed += dt
    const t = this.elapsed
    const state = player.state
    const isPlaying = state.status === 'playing'
    const track = TRACKS[state.index]

    this.spectrum.update(player.getPlayhead(), track.bpm, isPlaying, state.eq, dt)
    const { bass, mid, treble, energy, kick, beat } = this.spectrum
    this.spectrum.bands.forEach((value, index) => {
      this.levels[index] = value
    })

    if (this.lastTrackIndex !== state.index) {
      if (this.lastTrackIndex !== -1) {
        this.glitch = 1
        this.spin = 9
      }
      this.lastTrackIndex = state.index
    }

    this.playingMix += ((isPlaying ? 1 : 0) - this.playingMix) * (1 - Math.exp(-dt * 3))
    this.glitch = Math.max(0, this.glitch - dt * 1.6)
    this.boop = Math.max(0, this.boop - dt * 2.2)

    // Blinking (only visible while the face shows).
    if (t > this.nextBlinkAt) {
      this.blink = 1
      this.nextBlinkAt = t + 2.2 + Math.random() * 3.8
    }
    this.blink = Math.max(0, this.blink - dt * 7)

    // Head: look at the cursor, nod on the kick, groove side to side at half tempo.
    this.look.lerp(this.pointer, 1 - Math.exp(-dt * 5))
    const groove = Math.sin(beat * Math.PI) * 0.07 * this.playingMix
    this.spin *= Math.exp(-dt * 3)
    this.spinAngle += this.spin * dt
    if (Math.abs(this.spin) < 0.6) {
      this.spinAngle += (Math.round(this.spinAngle / (Math.PI * 2)) * Math.PI * 2 - this.spinAngle) * (1 - Math.exp(-dt * 6))
    }

    const yaw = this.look.x * 0.5 + this.spinAngle
    const napping = 1 - this.playingMix
    this.headPivot.rotation.set(
      -this.look.y * 0.22 + kick * 0.11 * this.playingMix + napping * 0.06 + Math.sin(t * 1.3) * 0.015,
      yaw,
      groove,
    )
    const yawVelocity = (yaw - this.lastYaw) / Math.max(dt, 1e-4)
    this.lastYaw = yaw

    const squash = Math.sin(this.boop * Math.PI * 3) * this.boop * 0.08
    this.head.scale.set(1 + squash, 1 - squash + bass * 0.02 * this.playingMix, 1 + squash)
    this.root.position.y = Math.sin(t * 1.2) * 0.025 + kick * 0.03 * this.playingMix

    // Secondary motion.
    this.antennae.forEach(({ pivot, tip, spring, side }) => {
      stepSpring(spring, side * 0.42, -yawVelocity * 1.6 * side + kick * side * 5 * this.playingMix, dt)
      pivot.rotation.z = -spring.angle
      tip.material.emissiveIntensity = 0.5 + (side < 0 ? bass : treble) * 3.5 * this.playingMix + (1 - this.playingMix) * (0.3 + Math.sin(t * 2) * 0.2)
    })

    this.earCones.forEach((cone) => {
      cone.scale.setScalar(1 + bass * 0.35 * this.playingMix)
    })

    this.mouth.scale.set(1, 0.45 + (mid * 1.8 + kick * 0.4) * this.playingMix, 1)
    this.powerRing.material.emissiveIntensity = 0.4 + kick * 2.2 * this.playingMix
    this.floorGlow.material.uniforms.uIntensity.value = 0.25 + energy * 0.9 * this.playingMix

    const uniforms = this.visor.material.uniforms
    uniforms.uTime.value = t
    uniforms.uBass.value = bass
    uniforms.uMid.value = mid
    uniforms.uTreble.value = treble
    uniforms.uEnergy.value = energy
    uniforms.uKick.value = kick
    uniforms.uMode.value = this.mode
    uniforms.uPlaying.value = this.playingMix
    uniforms.uGlitch.value = this.glitch
    uniforms.uBlink.value = Math.max(this.blink, this.boop > 0.5 ? 1 : 0)
    ;(uniforms.uLook.value as THREE.Vector2).copy(this.look)
  }
}
