export type ScenePalette = {
  skyTop: string
  skyHorizon: string
  skyBottom: string
  skyGlow: string
  skyGlowStrength: number
  floor: string
  grid: string
  gridIntensity: number
  sunTop: string
  sunBottom: string
  sunOpacity: number
  shadow: string
  shadowOpacity: number
  sparkles: string[]
  sparkleAdditive: boolean
  ambient: string
  ambientIntensity: number
  key: string
  keyIntensity: number
  rim: string
  rimIntensity: number
  env: {
    top: string
    horizon: string
    ground: string
    bottom: string
    band: string
    panels: Array<[color: string, intensity: number]>
  }
  bloom: {
    strength: number
    radius: number
    threshold: number
  }
  crt: {
    aberration: number
    scanline: number
    grain: number
    vignette: number
    vignetteColor: string
    roll: number
  }
}

// Daylight desktop: cream paper, magenta grid and pastel chrome, matching the existing UI.
export const LIGHT_PALETTE: ScenePalette = {
  skyTop: '#f3c8ee',
  skyHorizon: '#fffef0',
  skyBottom: '#f8f6db',
  skyGlow: '#ffb86b',
  skyGlowStrength: 0.35,
  floor: '#f8f5d8',
  grid: '#d400d4',
  gridIntensity: 0.62,
  sunTop: '#fff2a6',
  sunBottom: '#ff5fd2',
  sunOpacity: 0.75,
  shadow: '#6b1f66',
  shadowOpacity: 0.22,
  sparkles: ['#e600e6', '#00a8e8', '#0b8d1b', '#ff9f1c'],
  sparkleAdditive: false,
  ambient: '#fff6fb',
  ambientIntensity: 0.9,
  key: '#ffffff',
  keyIntensity: 2.2,
  rim: '#ff66d9',
  rimIntensity: 2.4,
  env: {
    top: '#fff0fb',
    horizon: '#ffe3f7',
    ground: '#c77fd0',
    bottom: '#3d1670',
    band: '#ffffff',
    panels: [
      ['#ff00ff', 2.4],
      ['#00ccff', 2.4],
      ['#ffffff', 3],
      ['#ffe3fa', 1.6],
      ['#39ff14', 1.5],
    ],
  },
  bloom: {
    strength: 0.28,
    radius: 0.35,
    threshold: 0.92,
  },
  crt: {
    aberration: 0.012,
    scanline: 0.035,
    grain: 0.03,
    vignette: 0.22,
    vignetteColor: '#e9c4f0',
    roll: 0.025,
  },
}

// Night desktop: deep violet void, neon grid and a striped synthwave sun.
export const DARK_PALETTE: ScenePalette = {
  skyTop: '#040010',
  skyHorizon: '#3b0a45',
  skyBottom: '#0b0214',
  skyGlow: '#ff2bd6',
  skyGlowStrength: 0.2,
  floor: '#0b0214',
  grid: '#ff2bd6',
  gridIntensity: 1.05,
  sunTop: '#ffe66b',
  sunBottom: '#ff1f8f',
  sunOpacity: 1,
  shadow: '#ff2bd6',
  shadowOpacity: 0.35,
  sparkles: ['#ff4df0', '#39e6ff', '#7dff5c', '#fff6a8'],
  sparkleAdditive: true,
  ambient: '#3a1a55',
  ambientIntensity: 0.6,
  key: '#b9f3ff',
  keyIntensity: 1.6,
  rim: '#ff2bd6',
  rimIntensity: 2.6,
  env: {
    top: '#1a0536',
    horizon: '#4a0f5c',
    ground: '#3a0a4c',
    bottom: '#040008',
    band: '#ff5ce1',
    panels: [
      ['#ff00ff', 2.8],
      ['#00e5ff', 2.8],
      ['#ffffff', 1.8],
      ['#7a2cff', 1.6],
      ['#39ff14', 1.6],
    ],
  },
  bloom: {
    strength: 0.62,
    radius: 0.45,
    threshold: 0.42,
  },
  crt: {
    aberration: 0.02,
    scanline: 0.12,
    grain: 0.05,
    vignette: 0.6,
    vignetteColor: '#000000',
    roll: 0.05,
  },
}

export const getPalette = (dark: boolean) => (dark ? DARK_PALETTE : LIGHT_PALETTE)
