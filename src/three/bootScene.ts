import * as THREE from 'three'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'
import { createChromeMaterial, createSparkleGeometry } from './objects'
import { disposeObject } from './utils'

const TILE_COLORS = ['#ff2bd6', '#39ff5a', '#29d9ff', '#ffe14d']
const TILE_SIZE = 0.92
const TILE_GAP = 0.1

// Shared by the GPU tiles and the CPU-driven trail so everything ripples together.
const waveAt = (x: number, y: number, time: number) =>
  Math.sin(x * 2.4 - time * 3.2) * 0.2 * ((x + 1.4) / 2.8) + Math.sin(y * 1.7 - time * 2.1) * 0.05

const TILE_VERTEX = /* glsl */ `
  uniform float uTime;
  uniform vec2 uOffset;
  varying vec3 vNormal;
  varying vec3 vView;
  varying vec2 vUv;

  float wave(vec2 p) {
    return sin(p.x * 2.4 - uTime * 3.2) * 0.2 * ((p.x + 1.4) / 2.8) + sin(p.y * 1.7 - uTime * 2.1) * 0.05;
  }

  void main() {
    vec2 flag = position.xy + uOffset;
    float z = wave(flag);
    float dzdx = (wave(flag + vec2(0.01, 0.0)) - z) / 0.01;
    float dzdy = (wave(flag + vec2(0.0, 0.01)) - z) / 0.01;
    vNormal = normalize(normalMatrix * normalize(vec3(-dzdx, -dzdy, 1.0)));
    vec4 mvPosition = modelViewMatrix * vec4(position.xy, z, 1.0);
    vView = -mvPosition.xyz;
    vUv = uv;
    gl_Position = projectionMatrix * mvPosition;
  }
`

const TILE_FRAGMENT = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;
  varying vec3 vNormal;
  varying vec3 vView;
  varying vec2 vUv;

  void main() {
    vec3 n = normalize(vNormal);
    if (!gl_FrontFacing) n = -n;
    vec3 v = normalize(vView);
    vec3 l = normalize(vec3(0.4, 0.8, 1.0));
    float diffuse = max(dot(n, l), 0.0) * 0.55 + 0.5;
    float specular = pow(max(dot(reflect(-l, n), v), 0.0), 28.0) * 0.9;
    float fresnel = pow(1.0 - max(dot(n, v), 0.0), 3.0) * 0.5;
    float edge = min(min(vUv.x, 1.0 - vUv.x), min(vUv.y, 1.0 - vUv.y));
    vec3 color = uColor * (0.8 + 0.35 * vUv.y) * diffuse + vec3(specular) + uColor * fresnel;
    color += smoothstep(0.05, 0.0, edge) * 0.3;
    gl_FragColor = vec4(color, uOpacity);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`

type TrailPixel = {
  mesh: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>
  base: THREE.Vector2
  phase: number
}

export class BootScene {
  private readonly host: HTMLElement
  private readonly renderer: THREE.WebGLRenderer
  private readonly scene = new THREE.Scene()
  private readonly camera = new THREE.PerspectiveCamera(35, 1, 0.1, 50)
  private readonly flag = new THREE.Group()
  private readonly tiles: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>[] = []
  private readonly trail: TrailPixel[] = []
  private readonly ring = new THREE.Group()
  private readonly stars: THREE.Mesh[] = []
  private readonly glow: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>
  private readonly envTarget: THREE.WebGLRenderTarget
  private readonly resizeObserver: ResizeObserver
  private frameId = 0
  private startTime = performance.now()

  constructor(host: HTMLElement) {
    this.host = host
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    this.renderer.setClearColor(0x000000, 0)
    this.renderer.domElement.className = 'boot-scene__canvas'
    host.appendChild(this.renderer.domElement)

    const pmrem = new THREE.PMREMGenerator(this.renderer)
    const room = new RoomEnvironment()
    this.envTarget = pmrem.fromScene(room, 0.04)
    room.dispose()
    pmrem.dispose()
    this.scene.environment = this.envTarget.texture

    this.camera.position.set(0, 0, 6.4)

    this.glow = new THREE.Mesh(
      new THREE.PlaneGeometry(7, 7),
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: { uOpacity: { value: 0 } },
        vertexShader: /* glsl */ `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: /* glsl */ `
          uniform float uOpacity;
          varying vec2 vUv;
          void main() {
            float d = length(vUv - 0.5) * 2.0;
            float glow = pow(max(1.0 - d, 0.0), 2.4) * uOpacity;
            gl_FragColor = vec4(mix(vec3(0.2, 0.05, 0.9), vec3(1.0, 0.1, 0.8), glow) * glow, glow);
            #include <colorspace_fragment>
          }
        `,
      }),
    )
    this.glow.position.z = -1.2
    this.scene.add(this.glow)

    this.createFlag()
    this.createTrail()
    this.createRing()

    this.resizeObserver = new ResizeObserver(() => this.handleResize())
    this.resizeObserver.observe(host)
    this.handleResize()

    this.frameId = requestAnimationFrame(this.tick)
  }

  dispose() {
    cancelAnimationFrame(this.frameId)
    this.resizeObserver.disconnect()
    disposeObject(this.scene)
    this.envTarget.dispose()
    this.renderer.dispose()
    this.renderer.domElement.remove()
  }

  private createFlag() {
    const geometry = new THREE.PlaneGeometry(TILE_SIZE, TILE_SIZE, 24, 24)
    const half = (TILE_SIZE + TILE_GAP) / 2

    TILE_COLORS.forEach((color, index) => {
      const offset = new THREE.Vector2(index % 2 === 0 ? -half : half, index < 2 ? half : -half)
      const tile = new THREE.Mesh(
        geometry,
        new THREE.ShaderMaterial({
          transparent: true,
          side: THREE.DoubleSide,
          uniforms: {
            uTime: { value: 0 },
            uOffset: { value: offset },
            uColor: { value: new THREE.Color(color) },
            uOpacity: { value: 0 },
          },
          vertexShader: TILE_VERTEX,
          fragmentShader: TILE_FRAGMENT,
        }),
      )
      tile.position.set(offset.x, offset.y, 0)
      this.tiles.push(tile)
      this.flag.add(tile)
    })

    this.scene.add(this.flag)
  }

  private createTrail() {
    const geometry = new THREE.PlaneGeometry(1, 1)
    const rows = [
      { y: (TILE_SIZE + TILE_GAP) / 2, color: TILE_COLORS[0] },
      { y: -(TILE_SIZE + TILE_GAP) / 2, color: TILE_COLORS[2] },
    ]
    const sizes = [0.3, 0.22, 0.16, 0.11, 0.07]

    rows.forEach((row, rowIndex) => {
      let x = -(TILE_SIZE + TILE_GAP) - 0.12

      sizes.forEach((size, index) => {
        x -= size / 2 + 0.08
        const mesh = new THREE.Mesh(
          geometry,
          new THREE.MeshBasicMaterial({ color: row.color, transparent: true, opacity: 0, side: THREE.DoubleSide }),
        )
        mesh.scale.setScalar(size)
        this.trail.push({
          mesh,
          base: new THREE.Vector2(x, row.y + (index % 2 === 0 ? 0.12 : -0.12) * (rowIndex === 0 ? 1 : -1)),
          phase: index * 0.35 + rowIndex * 0.2,
        })
        this.flag.add(mesh)
        x -= size / 2
      })
    })
  }

  private createRing() {
    const torus = new THREE.Mesh(new THREE.TorusGeometry(1.75, 0.028, 16, 200), createChromeMaterial('#ffffff'))
    torus.rotation.x = Math.PI / 2.3
    this.ring.add(torus)

    const inner = new THREE.Mesh(new THREE.TorusGeometry(1.95, 0.012, 12, 200), createChromeMaterial('#ff9be8'))
    inner.rotation.set(Math.PI / 1.8, 0.3, 0)
    this.ring.add(inner)

    const sparkle = createSparkleGeometry()
    const tints = ['#ffffff', '#ff9be8', '#9ff3ff']

    tints.forEach((tint) => {
      const star = new THREE.Mesh(sparkle, createChromeMaterial(tint))
      star.scale.setScalar(0.16)
      this.stars.push(star)
      this.scene.add(star)
    })

    this.scene.add(this.ring)
  }

  private handleResize() {
    const width = Math.max(1, this.host.clientWidth)
    const height = Math.max(1, this.host.clientHeight)
    this.renderer.setSize(width, height, false)
    const aspect = width / height
    const tanHalf = Math.tan(THREE.MathUtils.degToRad(this.camera.fov) / 2)
    this.camera.aspect = aspect
    // Pull back on narrow screens so the flag, trail and ring always fit horizontally.
    this.camera.position.z = Math.max(6.4, 2.5 / (tanHalf * aspect))
    this.camera.updateProjectionMatrix()
  }

  private tick = (now: number) => {
    this.frameId = requestAnimationFrame(this.tick)
    const t = (now - this.startTime) / 1000
    const reveal = THREE.MathUtils.smoothstep(t, 0, 1.2)
    const eased = 1 - Math.pow(1 - reveal, 3)

    this.flag.rotation.set(0.08 + Math.sin(t * 0.8) * 0.05, THREE.MathUtils.lerp(-1.3, -0.28, eased) + Math.sin(t * 0.6) * 0.08, 0)
    this.flag.scale.setScalar(THREE.MathUtils.lerp(0.55, 1, eased))
    this.flag.position.y = 0.45 + Math.sin(t * 1.2) * 0.05

    for (const tile of this.tiles) {
      tile.material.uniforms.uTime.value = t
      tile.material.uniforms.uOpacity.value = reveal
    }

    for (const pixel of this.trail) {
      const flicker = 0.5 + 0.5 * Math.sin(t * 5 - pixel.phase * 6)
      pixel.mesh.position.set(pixel.base.x, pixel.base.y, waveAt(pixel.base.x, pixel.base.y, t))
      pixel.mesh.material.opacity = reveal * (0.35 + flicker * 0.65)
    }

    this.glow.material.uniforms.uOpacity.value = reveal * (0.75 + Math.sin(t * 2) * 0.1)

    this.ring.position.y = this.flag.position.y
    this.ring.rotation.set(Math.sin(t * 0.5) * 0.2, t * 0.6, Math.sin(t * 0.4) * 0.15)
    this.ring.scale.setScalar(THREE.MathUtils.lerp(1.6, 1, eased))

    this.stars.forEach((star, index) => {
      const angle = t * (0.9 + index * 0.25) + index * 2.1
      star.position.set(Math.cos(angle) * 2.1, this.flag.position.y + Math.sin(angle * 1.3) * 0.9, Math.sin(angle) * 1.1)
      star.rotation.set(0, t * 2.5 + index, 0)
      star.scale.setScalar(0.16 * reveal)
    })

    this.renderer.render(this.scene, this.camera)
  }
}
