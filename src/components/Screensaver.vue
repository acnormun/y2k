<template>
  <Teleport to="body">
    <div
      class="screensaver theme-exempt"
      role="dialog"
      aria-modal="true"
      :aria-label="t('screensaver.aria')"
    >
      <div ref="sceneRef" class="screensaver__scene" aria-hidden="true" />
      <p class="screensaver__hint">{{ t('screensaver.hint') }}</p>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { PipesScene } from '../three/pipesScene'
import { detectQuality, isWebGLAvailable } from '../three/utils'

const emit = defineEmits<{
  (e: 'exit'): void
}>()

// Ignore the click / key press that launched the screensaver.
const ARM_DELAY_MS = 700
const MOVE_THRESHOLD_PX = 14

const { t } = useI18n()
const sceneRef = ref<HTMLElement | null>(null)
let scene: PipesScene | null = null
let isUnmounted = false
let armedAt = 0
let origin: { x: number; y: number } | null = null

const isArmed = () => performance.now() >= armedAt

const wake = () => {
  if (isArmed()) {
    emit('exit')
  }
}

const handlePointerMove = (event: PointerEvent) => {
  if (!isArmed()) {
    origin = null
    return
  }

  if (!origin) {
    origin = { x: event.clientX, y: event.clientY }
    return
  }

  if (Math.hypot(event.clientX - origin.x, event.clientY - origin.y) > MOVE_THRESHOLD_PX) {
    wake()
  }
}

const listeners: Array<[keyof WindowEventMap, EventListener]> = [
  ['pointermove', handlePointerMove as EventListener],
  ['pointerdown', wake],
  ['keydown', wake],
  ['wheel', wake],
  ['touchstart', wake],
]

onMounted(async () => {
  armedAt = performance.now() + ARM_DELAY_MS
  listeners.forEach(([type, listener]) => window.addEventListener(type, listener, { passive: true }))

  if (!isWebGLAvailable()) {
    return
  }

  try {
    const { PipesScene } = await import('../three/pipesScene')

    if (!isUnmounted && sceneRef.value) {
      scene = new PipesScene(sceneRef.value, detectQuality())
    }
  } catch (error) {
    console.warn('[y2k] screensaver disabled:', error)
  }
})

onBeforeUnmount(() => {
  isUnmounted = true
  listeners.forEach(([type, listener]) => window.removeEventListener(type, listener))
  scene?.dispose()
  scene = null
})
</script>

<style scoped>
.screensaver {
  position: fixed;
  inset: 0;
  z-index: 190;
  background: #000;
  cursor: none;
  animation: screensaver-in 600ms ease both;
}

.screensaver__scene {
  position: absolute;
  inset: 0;
}

.screensaver__scene :deep(.pipes-scene__canvas) {
  display: block;
  width: 100%;
  height: 100%;
  max-width: none;
}

.screensaver__hint {
  position: absolute;
  left: 50%;
  bottom: 1.5rem;
  padding: 0.35rem 0.75rem;
  border: 1px solid rgba(255, 255, 255, 0.35);
  background: rgba(0, 0, 0, 0.55);
  color: rgba(255, 255, 255, 0.85);
  font-family: var(--font-secondary);
  font-size: 0.72rem;
  letter-spacing: 0.06em;
  transform: translateX(-50%);
  animation: screensaver-hint 4.5s ease forwards;
  pointer-events: none;
}

@keyframes screensaver-in {
  from {
    opacity: 0;
  }
}

@keyframes screensaver-hint {
  0%,
  70% {
    opacity: 1;
  }

  100% {
    opacity: 0;
  }
}
</style>
