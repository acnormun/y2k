import * as THREE from 'three'
import { TeapotGeometry } from 'three/addons/geometries/TeapotGeometry.js'
import { disposeObject, type SceneQuality } from './utils'

// A tribute to the Windows 9x "3D Pipes" screensaver: pipes crawl through a voxel grid,
// turn at ball joints (and, very rarely, at a Utah teapot), then the screen fades and restarts.

const GRID = new THREE.Vector3(18, 12, 12)
const PIPE_RADIUS = 0.17
const JOINT_RADIUS = 0.25
const STEP_SECONDS = 0.085
const TEAPOT_CHANCE = 1 / 90
const PIPE_COLORS = ['#ff2bd6', '#39ff5a', '#29d9ff', '#ffe14d', '#ff7a2f', '#b44dff', '#f5f5f5']

const DIRECTIONS = [
  new THREE.Vector3(1, 0, 0),
  new THREE.Vector3(-1, 0, 0),
  new THREE.Vector3(0, 1, 0),
  new THREE.Vector3(0, -1, 0),
  new THREE.Vector3(0, 0, 1),
  new THREE.Vector3(0, 0, -1),
]
const UP = new THREE.Vector3(0, 1, 0)

type Pipe = {
  cell: THREE.Vector3
  next: THREE.Vector3
  direction: number
  material: THREE.MeshPhongMaterial
  segment: THREE.Mesh | null
  progress: number
  alive: boolean
}

export class PipesScene {
  private readonly host: HTMLElement
  private readonly renderer: THREE.WebGLRenderer
  private readonly scene = new THREE.Scene()
  private readonly camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100)
  private readonly root = new THREE.Group()
  private readonly fader: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>
  private readonly segmentGeometry: THREE.CylinderGeometry
  private readonly jointGeometry: THREE.SphereGeometry
  private readonly teapotGeometry: TeapotGeometry
  private readonly resizeObserver: ResizeObserver
  private readonly maxPipes: number
  private readonly maxSegments: number

  private occupied = new Set<string>()
  private pipes: Pipe[] = []
  private segmentCount = 0
  private spawnCooldown = 0
  private fadeState: 'in' | 'running' | 'out' = 'in'
  private fadeProgress = 1
  private elapsed = 0
  private lastTime = performance.now()
  private frameId = 0

  constructor(host: HTMLElement, quality: SceneQuality) {
    this.host = host
    this.maxPipes = quality === 'high' ? 4 : 3
    this.maxSegments = quality === 'high' ? 560 : 360

    this.renderer = new THREE.WebGLRenderer({ antialias: true })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, quality === 'high' ? 2 : 1.25))
    this.renderer.domElement.className = 'pipes-scene__canvas'
    host.appendChild(this.renderer.domElement)

    this.scene.background = new THREE.Color('#000000')
    this.scene.add(this.root, this.camera)

    const key = new THREE.DirectionalLight('#ffffff', 2.4)
    key.position.set(-6, 10, 12)
    const fill = new THREE.DirectionalLight('#9fd8ff', 0.8)
    fill.position.set(10, -4, 6)
    this.scene.add(new THREE.AmbientLight('#ffffff', 0.35), key, fill)

    this.segmentGeometry = new THREE.CylinderGeometry(PIPE_RADIUS, PIPE_RADIUS, 1, 18, 1, true)
    this.segmentGeometry.translate(0, 0.5, 0)
    this.jointGeometry = new THREE.SphereGeometry(JOINT_RADIUS, 20, 14)
    this.teapotGeometry = new TeapotGeometry(0.3, 8)

    this.fader = new THREE.Mesh(
      new THREE.PlaneGeometry(4, 4),
      new THREE.MeshBasicMaterial({ color: '#000000', transparent: true, opacity: 1, depthTest: false }),
    )
    this.fader.position.z = -0.5
    this.fader.renderOrder = 10
    this.camera.add(this.fader)

    this.resizeObserver = new ResizeObserver(() => this.handleResize())
    this.resizeObserver.observe(host)
    this.handleResize()

    this.frameId = requestAnimationFrame(this.tick)
  }

  dispose() {
    cancelAnimationFrame(this.frameId)
    this.resizeObserver.disconnect()
    disposeObject(this.scene)
    this.segmentGeometry.dispose()
    this.jointGeometry.dispose()
    this.teapotGeometry.dispose()
    this.renderer.dispose()
    this.renderer.domElement.remove()
  }

  private handleResize() {
    const width = Math.max(1, this.host.clientWidth)
    const height = Math.max(1, this.host.clientHeight)
    const aspect = width / height
    this.renderer.setSize(width, height, false)
    this.camera.aspect = aspect

    const tanHalf = Math.tan(THREE.MathUtils.degToRad(this.camera.fov) / 2)
    const distance = Math.max(GRID.y / 2 / tanHalf, GRID.x / 2 / (tanHalf * aspect)) + GRID.z / 2
    this.camera.position.set(0, 0, distance * 1.05)
    this.camera.far = distance * 3
    this.camera.updateProjectionMatrix()
  }

  private cellKey(cell: THREE.Vector3) {
    return `${cell.x},${cell.y},${cell.z}`
  }

  private isFree(cell: THREE.Vector3) {
    return (
      cell.x >= 0 && cell.y >= 0 && cell.z >= 0 &&
      cell.x < GRID.x && cell.y < GRID.y && cell.z < GRID.z &&
      !this.occupied.has(this.cellKey(cell))
    )
  }

  private toWorld(cell: THREE.Vector3, target = new THREE.Vector3()) {
    return target.set(cell.x - (GRID.x - 1) / 2, cell.y - (GRID.y - 1) / 2, cell.z - (GRID.z - 1) / 2)
  }

  private addJoint(cell: THREE.Vector3, material: THREE.Material) {
    const isTeapot = Math.random() < TEAPOT_CHANCE
    const joint = new THREE.Mesh(isTeapot ? this.teapotGeometry : this.jointGeometry, material)
    this.toWorld(cell, joint.position)

    if (isTeapot) {
      joint.rotation.y = Math.random() * Math.PI * 2
    }

    this.root.add(joint)
  }

  private spawnPipe() {
    const cell = new THREE.Vector3()

    for (let attempt = 0; attempt < 60; attempt += 1) {
      cell.set(
        Math.floor(Math.random() * GRID.x),
        Math.floor(Math.random() * GRID.y),
        Math.floor(Math.random() * GRID.z),
      )

      if (this.isFree(cell)) {
        const material = new THREE.MeshPhongMaterial({
          color: PIPE_COLORS[Math.floor(Math.random() * PIPE_COLORS.length)],
          specular: '#ffffff',
          shininess: 70,
        })
        this.occupied.add(this.cellKey(cell))
        this.addJoint(cell, material)
        this.pipes.push({ cell, next: cell.clone(), direction: -1, material, segment: null, progress: 0, alive: true })
        return true
      }
    }

    return false
  }

  private advance(pipe: Pipe) {
    const candidates: number[] = []
    const probe = new THREE.Vector3()

    DIRECTIONS.forEach((direction, index) => {
      if (this.isFree(probe.copy(pipe.cell).add(direction))) {
        candidates.push(index)
      }
    })

    if (candidates.length === 0) {
      pipe.alive = false
      this.addJoint(pipe.cell, pipe.material)
      return
    }

    const keepGoing = pipe.direction >= 0 && candidates.includes(pipe.direction) && Math.random() < 0.72
    const direction = keepGoing ? pipe.direction : candidates[Math.floor(Math.random() * candidates.length)]

    if (pipe.direction >= 0 && direction !== pipe.direction) {
      this.addJoint(pipe.cell, pipe.material)
    }

    pipe.direction = direction
    pipe.next.copy(pipe.cell).add(DIRECTIONS[direction])
    this.occupied.add(this.cellKey(pipe.next))

    const segment = new THREE.Mesh(this.segmentGeometry, pipe.material)
    this.toWorld(pipe.cell, segment.position)
    segment.quaternion.setFromUnitVectors(UP, DIRECTIONS[direction])
    segment.scale.set(1, 0.001, 1)
    this.root.add(segment)

    pipe.segment = segment
    pipe.progress = 0
  }

  private reset() {
    // Geometries are shared, so only the per-pipe materials need freeing.
    for (const pipe of this.pipes) {
      pipe.material.dispose()
    }

    this.root.clear()
    this.occupied.clear()
    this.pipes = []
    this.segmentCount = 0
    this.spawnCooldown = 0
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
    this.root.rotation.y = Math.sin(this.elapsed * 0.06) * 0.35
    this.root.rotation.x = Math.sin(this.elapsed * 0.045) * 0.12

    if (this.fadeState === 'in') {
      this.fadeProgress = Math.max(0, this.fadeProgress - dt * 1.4)
      this.fader.material.opacity = this.fadeProgress

      if (this.fadeProgress === 0) {
        this.fadeState = 'running'
      }
    } else if (this.fadeState === 'out') {
      this.fadeProgress = Math.min(1, this.fadeProgress + dt * 1.1)
      this.fader.material.opacity = this.fadeProgress

      if (this.fadeProgress === 1) {
        this.reset()
        this.fadeState = 'in'
      }

      return
    }

    for (const pipe of this.pipes) {
      if (!pipe.alive) {
        continue
      }

      if (pipe.segment) {
        pipe.progress += dt / STEP_SECONDS
        pipe.segment.scale.y = Math.min(pipe.progress, 1)

        if (pipe.progress < 1) {
          continue
        }

        pipe.cell.copy(pipe.next)
        pipe.segment = null
        this.segmentCount += 1
      }

      this.advance(pipe)
    }

    const alive = this.pipes.filter((pipe) => pipe.alive).length
    this.spawnCooldown -= dt

    if (alive < this.maxPipes && this.spawnCooldown <= 0 && this.segmentCount < this.maxSegments) {
      this.spawnCooldown = this.pipes.length === 0 ? 0 : 1.2 + Math.random() * 1.5
      const spawned = this.spawnPipe()

      if (!spawned && alive === 0) {
        this.fadeState = 'out'
      }
    }

    if (this.segmentCount >= this.maxSegments && alive === 0) {
      this.fadeState = 'out'
    } else if (this.segmentCount >= this.maxSegments * 1.15) {
      this.fadeState = 'out'
    }
  }
}
