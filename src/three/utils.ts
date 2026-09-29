import type { Material, Object3D, Texture } from 'three'

export type SceneQuality = 'high' | 'low'

export const isWebGLAvailable = () => {
  if (typeof window === 'undefined') {
    return false
  }

  try {
    const canvas = document.createElement('canvas')
    return Boolean(canvas.getContext('webgl2'))
  } catch {
    return false
  }
}

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

export const detectQuality = (): SceneQuality => {
  if (typeof window === 'undefined') {
    return 'low'
  }

  const isCoarsePointer = window.matchMedia('(pointer: coarse)').matches
  const isSmallScreen = window.innerWidth <= 720

  return isCoarsePointer || isSmallScreen ? 'low' : 'high'
}

const disposeMaterial = (material: Material) => {
  for (const value of Object.values(material)) {
    if (value && typeof value === 'object' && (value as Texture).isTexture) {
      ;(value as Texture).dispose()
    }
  }

  material.dispose()
}

// Frees every geometry, material and texture reachable from the given root.
export const disposeObject = (root: Object3D) => {
  root.traverse((child) => {
    const mesh = child as Object3D & {
      geometry?: { dispose: () => void }
      material?: Material | Material[]
    }

    mesh.geometry?.dispose()

    if (Array.isArray(mesh.material)) {
      mesh.material.forEach(disposeMaterial)
    } else if (mesh.material) {
      disposeMaterial(mesh.material)
    }
  })
}
