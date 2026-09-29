import * as THREE from 'three'
import { disposeObject, type SceneQuality } from './utils'

// A tribute to the Windows Vista "Bubbles" screensaver: iridescent soap bubbles drift over the
// live desktop, wobble, and bounce off the screen edges and each other.

const BUBBLE_VERTEX = /* glsl */ `
  uniform float uTime;
  uniform float uSeed;
  varying vec3 vNormal;
  varying vec3 vViewDir;
  varying vec3 vLocal;

  void main() {
    vec3 p = position;
    // Soap-film wobble.
    float wobble = sin(p.x * 3.1 + uTime * 2.3 + uSeed) * sin(p.y * 2.7 - uTime * 1.9 + uSeed * 2.0) * 0.035;
    p += normal * wobble;
    vLocal = position;
    vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
    vNormal = normalize(normalMatrix * normal);
    vViewDir = normalize(-mvPosition.xyz);
    gl_Position = projectionMatrix * mvPosition;
  }
`

const BUBBLE_FRAGMENT = /* glsl */ `
  uniform float uTime;
  uniform float uSeed;
  uniform float uOpacity;
  varying vec3 vNormal;
  varying vec3 vViewDir;
  varying vec3 vLocal;

  void main() {
    vec3 n = normalize(vNormal);
    if (!gl_FrontFacing) n = -n;
    vec3 v = normalize(vViewDir);
    float facing = abs(dot(n, v));
    float fresnel = pow(1.0 - facing, 2.2);

    // Thin-film interference: swirling thickness mapped to rainbow hues.
    float swirl = sin(vLocal.y * 4.0 + uTime * 0.9 + uSeed) + sin(vLocal.x * 3.0 - uTime * 0.7 + uSeed * 1.7);
    float thickness = 0.5 + 0.25 * swirl + (1.0 - facing) * 0.9;
    vec3 film = 0.5 + 0.5 * cos(6.2831 * (thickness + vec3(0.0, 0.33, 0.67)));

    vec3 l1 = normalize(vec3(-0.55, 0.7, 0.55));
    vec3 l2 = normalize(vec3(0.6, -0.35, 0.7));
    float spec1 = pow(max(dot(reflect(-l1, n), v), 0.0), 70.0);
    float spec2 = pow(max(dot(reflect(-l2, n), v), 0.0), 26.0) * 0.35;

    // A soft "window" reflection in the upper-left of every bubble.
    vec2 w = vec2(n.x + 0.38, n.y - 0.42);
    float window = smoothstep(0.24, 0.12, max(abs(w.x) * 1.4, abs(w.y) * 2.0)) * 0.35;

    // Mostly clear in the middle, colourful at the rim, bright specular highlights.
    float highlight = spec1 + spec2 + window;
    float alpha = clamp(fresnel * 0.85 + 0.015 + highlight, 0.0, 0.95) * uOpacity;
    vec3 color = mix(film * (0.6 + fresnel * 0.8), vec3(1.0), clamp(highlight * 1.5, 0.0, 1.0));
    gl_FragColor = vec4(color, alpha);
  }
`

type Bubble = {
  mesh: THREE.Mesh<THREE.SphereGeometry, THREE.ShaderMaterial>
  radius: number
  velocity: THREE.Vector3
  birth: number
}

export class BubblesScene {
  private readonly host: HTMLElement
  private readonly renderer: THREE.WebGLRenderer
  private readonly scene = new THREE.Scene()
  private readonly camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100)
  private readonly geometry: THREE.SphereGeometry
  private readonly bubbles: Bubble[] = []
  private readonly bounds = new THREE.Vector3(8, 5, 2.5)
  private readonly resizeObserver: ResizeObserver
  private readonly count: number
  private elapsed = 0
  private lastTime = performance.now()
  private frameId = 0

  constructor(host: HTMLElement, quality: SceneQuality) {
    this.host = host
    this.count = quality === 'high' ? 13 : 7

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, quality === 'high' ? 2 : 1.25))
    this.renderer.setClearColor(0x000000, 0)
    this.renderer.domElement.className = 'bubbles-scene__canvas'
    host.appendChild(this.renderer.domElement)

    this.camera.position.set(0, 0, 14)
    this.geometry = new THREE.SphereGeometry(1, 48, 32)

    this.resizeObserver = new ResizeObserver(() => this.handleResize())
    this.resizeObserver.observe(host)
    this.handleResize()

    for (let index = 0; index < this.count; index += 1) {
      this.spawn(index * 0.35)
    }

    this.frameId = requestAnimationFrame(this.tick)
  }

  dispose() {
    cancelAnimationFrame(this.frameId)
    this.resizeObserver.disconnect()
    disposeObject(this.scene)
    this.geometry.dispose()
    this.renderer.dispose()
    this.renderer.domElement.remove()
  }

  private spawn(delay: number) {
    const radius = 0.7 + Math.random() * 1.1
    const material = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      uniforms: {
        uTime: { value: 0 },
        uSeed: { value: Math.random() * 100 },
        uOpacity: { value: 0 },
      },
      vertexShader: BUBBLE_VERTEX,
      fragmentShader: BUBBLE_FRAGMENT,
    })
    const mesh = new THREE.Mesh(this.geometry, material)

    // Place without overlapping existing bubbles when possible.
    for (let attempt = 0; attempt < 30; attempt += 1) {
      mesh.position.set(
        (Math.random() * 2 - 1) * (this.bounds.x - radius),
        (Math.random() * 2 - 1) * (this.bounds.y - radius),
        (Math.random() * 2 - 1) * (this.bounds.z - radius * 0.5),
      )

      if (this.bubbles.every((other) => other.mesh.position.distanceTo(mesh.position) > other.radius + radius + 0.2)) {
        break
      }
    }

    const speed = 1.1 + Math.random() * 1.2
    const velocity = new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, (Math.random() - 0.5) * 0.3)
      .normalize()
      .multiplyScalar(speed)

    mesh.scale.setScalar(0.001)
    this.scene.add(mesh)
    this.bubbles.push({ mesh, radius, velocity, birth: this.elapsed + delay })
  }

  private handleResize() {
    const width = Math.max(1, this.host.clientWidth)
    const height = Math.max(1, this.host.clientHeight)
    this.renderer.setSize(width, height, false)
    this.camera.aspect = width / height
    this.camera.updateProjectionMatrix()

    const halfHeight = Math.tan(THREE.MathUtils.degToRad(this.camera.fov) / 2) * this.camera.position.z
    this.bounds.set(halfHeight * this.camera.aspect, halfHeight, 2.5)
  }

  private tick = (now: number) => {
    this.frameId = requestAnimationFrame(this.tick)
    const dt = Math.min((now - this.lastTime) / 1000, 1 / 20)
    this.lastTime = now
    this.elapsed += dt
    this.update(dt)
    this.renderer.render(this.scene, this.camera)
  }

  private update(dt: number) {
    const t = this.elapsed
    const normal = new THREE.Vector3()
    const relative = new THREE.Vector3()

    for (const bubble of this.bubbles) {
      const { mesh, radius, velocity } = bubble
      const age = t - bubble.birth
      const grow = THREE.MathUtils.clamp(age / 1.2, 0, 1)
      // "Blown" in with a little overshoot.
      const scale = grow < 1 ? radius * (1 - Math.pow(1 - grow, 3)) * (1 + Math.sin(grow * Math.PI) * 0.12) : radius
      mesh.scale.setScalar(Math.max(0.001, scale))
      mesh.material.uniforms.uTime.value = t
      mesh.material.uniforms.uOpacity.value = grow

      if (age < 0) {
        continue
      }

      mesh.position.addScaledVector(velocity, dt)
      mesh.rotation.y += dt * 0.2

      for (const axis of ['x', 'y', 'z'] as const) {
        const limit = this.bounds[axis] - (axis === 'z' ? radius * 0.5 : radius)

        if (mesh.position[axis] > limit) {
          mesh.position[axis] = limit
          velocity[axis] = -Math.abs(velocity[axis])
        } else if (mesh.position[axis] < -limit) {
          mesh.position[axis] = -limit
          velocity[axis] = Math.abs(velocity[axis])
        }
      }
    }

    // Elastic collisions, mass proportional to volume.
    for (let i = 0; i < this.bubbles.length; i += 1) {
      for (let j = i + 1; j < this.bubbles.length; j += 1) {
        const a = this.bubbles[i]
        const b = this.bubbles[j]

        if (t < a.birth || t < b.birth) {
          continue
        }

        relative.subVectors(b.mesh.position, a.mesh.position)
        const distance = relative.length()
        const minDistance = a.radius + b.radius

        if (distance === 0 || distance >= minDistance) {
          continue
        }

        normal.copy(relative).divideScalar(distance)
        const massA = a.radius ** 3
        const massB = b.radius ** 3
        const overlap = minDistance - distance
        a.mesh.position.addScaledVector(normal, (-overlap * massB) / (massA + massB))
        b.mesh.position.addScaledVector(normal, (overlap * massA) / (massA + massB))

        const approach = a.velocity.clone().sub(b.velocity).dot(normal)

        if (approach > 0) {
          const impulse = (2 * approach) / (massA + massB)
          a.velocity.addScaledVector(normal, -impulse * massB)
          b.velocity.addScaledVector(normal, impulse * massA)
        }
      }
    }
  }
}
