<template>
  <div
    ref="hostRef"
    class="y2k-scene"
    :class="{ 'y2k-scene--ready': isReady }"
    aria-hidden="true"
  />
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { DesktopScene } from '../three/desktopScene'
import { detectQuality, isWebGLAvailable, prefersReducedMotion } from '../three/utils'

const props = defineProps<{
  isDarkMode: boolean
  paused: boolean
}>()

const hostRef = ref<HTMLElement | null>(null)
const isReady = ref(false)
let scene: DesktopScene | null = null
let isUnmounted = false

onMounted(async () => {
  if (!hostRef.value || !isWebGLAvailable()) {
    return
  }

  try {
    // three.js is loaded lazily so the desktop UI paints before the 3D chunk arrives.
    const { DesktopScene } = await import('../three/desktopScene')

    if (isUnmounted || !hostRef.value) {
      return
    }

    scene = new DesktopScene(hostRef.value, {
      dark: props.isDarkMode,
      quality: detectQuality(),
      reducedMotion: prefersReducedMotion(),
      onReady: () => {
        isReady.value = true
      },
      onContextLost: () => {
        isReady.value = false
      },
    })
    scene.setPaused(props.paused)
  } catch (error) {
    console.warn('[y2k] 3D wallpaper disabled:', error)
    scene?.dispose()
    scene = null
  }
})

watch(
  () => props.isDarkMode,
  (value) => scene?.setTheme(value),
)

watch(
  () => props.paused,
  (value) => scene?.setPaused(value),
)

onBeforeUnmount(() => {
  isUnmounted = true
  scene?.dispose()
  scene = null
})
</script>

<style scoped>
.y2k-scene {
  position: absolute;
  inset: 0;
  z-index: 0;
  overflow: hidden;
  opacity: 0;
  transition: opacity 900ms ease;
}

.y2k-scene--ready {
  opacity: 1;
}

.y2k-scene :deep(.y2k-scene__canvas) {
  display: block;
  width: 100%;
  height: 100%;
  max-width: none;
  touch-action: manipulation;
}
</style>
