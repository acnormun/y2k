// YouTube audio is cross-origin, so it can't be analysed. Instead this synthesises a believable
// spectrum from each track's tempo and the playhead: kicks on the beat, snares on the backbeat,
// hats on eighths, plus band noise. The EQ gains shape it, so the sliders visibly do something.

export const BAND_COUNT = 16

const hash = (value: number) => {
  const x = Math.sin(value * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

const smoothNoise = (time: number, seed: number) => {
  const index = Math.floor(time)
  const fraction = time - index
  const eased = fraction * fraction * (3 - 2 * fraction)
  return hash(index + seed * 57) * (1 - eased) + hash(index + 1 + seed * 57) * eased
}

const smoothstep = (edge0: number, edge1: number, value: number) => {
  const t = Math.min(1, Math.max(0, (value - edge0) / (edge1 - edge0)))
  return t * t * (3 - 2 * t)
}

export class SpectrumSynth {
  readonly bands = new Float32Array(BAND_COUNT)
  bass = 0
  mid = 0
  treble = 0
  energy = 0
  kick = 0
  beatPhase = 0
  beat = 0

  update(playhead: number, bpm: number, playing: boolean, eq: readonly number[], dt: number) {
    const beat = (playhead * bpm) / 60
    const phase = beat - Math.floor(beat)
    const eighth = beat * 2 - Math.floor(beat * 2)
    const kick = Math.exp(-phase * 7)
    const snare = Math.floor(beat) % 2 === 1 ? Math.exp(-phase * 9) : 0
    const hats = Math.exp(-eighth * 12)

    this.beat = beat
    this.beatPhase = phase
    this.kick = playing ? kick : 0

    let bass = 0
    let mid = 0
    let treble = 0
    let total = 0

    for (let index = 0; index < BAND_COUNT; index += 1) {
      const f = index / (BAND_COUNT - 1)
      const low = 1 - smoothstep(0, 0.35, f)
      const high = smoothstep(0.55, 1, f)
      const middle = Math.max(0, 1 - low - high)

      let value = 0.18 + 0.32 * smoothNoise(playhead * 3.2 + index * 1.7, index)
      value += low * kick * 0.85 + middle * snare * 0.55 + high * hats * 0.45
      value *= 1 - f * 0.3

      const gain = eq[Math.round(f * (eq.length - 1))] ?? 0
      value *= Math.pow(10, gain / 40)

      const target = playing ? Math.min(1, Math.max(0, value)) : 0
      const current = this.bands[index]
      const speed = target > current ? 24 : 6
      const next = current + (target - current) * (1 - Math.exp(-speed * dt))
      this.bands[index] = next

      total += next
      if (index < 4) bass += next
      else if (index < 11) mid += next
      else treble += next
    }

    this.bass = bass / 4
    this.mid = mid / 7
    this.treble = treble / 5
    this.energy = total / BAND_COUNT
  }
}
