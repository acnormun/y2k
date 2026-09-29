import type { Directive } from 'vue'

type TiltOptions = {
  max?: number
  scale?: number
}

type TiltElement = HTMLElement & {
  __tiltCleanup?: () => void
}

const TILT_PROPERTIES = ['--tilt-rx', '--tilt-ry', '--tilt-mx', '--tilt-my', '--tilt-scale']

// Holographic trading-card tilt: the element leans toward the pointer and a foil sheen follows it.
// Styles live in style.css (.tilt-3d). Skipped for touch devices and reduced-motion users.
export const vTilt: Directive<TiltElement, TiltOptions | undefined> = {
  mounted(el, binding) {
    const skip =
      window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
      window.matchMedia('(pointer: coarse)').matches

    if (skip) {
      return
    }

    const max = binding.value?.max ?? 12
    const scale = binding.value?.scale ?? 1.04
    el.classList.add('tilt-3d')

    const handleMove = (event: PointerEvent) => {
      const rect = el.getBoundingClientRect()
      const x = (event.clientX - rect.left) / rect.width
      const y = (event.clientY - rect.top) / rect.height

      el.style.setProperty('--tilt-rx', `${((0.5 - y) * max * 2).toFixed(2)}deg`)
      el.style.setProperty('--tilt-ry', `${((x - 0.5) * max * 2).toFixed(2)}deg`)
      el.style.setProperty('--tilt-mx', `${(x * 100).toFixed(1)}%`)
      el.style.setProperty('--tilt-my', `${(y * 100).toFixed(1)}%`)
      el.style.setProperty('--tilt-scale', String(scale))
      el.classList.add('tilt-3d--active')
    }

    const handleLeave = () => {
      TILT_PROPERTIES.forEach((property) => el.style.removeProperty(property))
      el.classList.remove('tilt-3d--active')
    }

    el.addEventListener('pointermove', handleMove)
    el.addEventListener('pointerleave', handleLeave)
    el.__tiltCleanup = () => {
      el.removeEventListener('pointermove', handleMove)
      el.removeEventListener('pointerleave', handleLeave)
    }
  },

  unmounted(el) {
    el.__tiltCleanup?.()
  },
}
