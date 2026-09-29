<template>
  <div
    ref="hostRef"
    class="headspace-head"
    :class="{ 'headspace-head--fallback': isFallback }"
    aria-hidden="true"
  />
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { HeadspaceScene } from '../three/headspaceScene'
import { isWebGLAvailable, prefersReducedMotion } from '../three/utils'

const props = defineProps<{
  mode: number
}>()

const emit = defineEmits<{
  (e: 'visor-click'): void
}>()

const hostRef = ref<HTMLElement | null>(null)
const isFallback = ref(false)
let scene: HeadspaceScene | null = null
let isUnmounted = false

onMounted(async () => {
  if (!hostRef.value || !isWebGLAvailable()) {
    isFallback.value = true
    return
  }

  try {
    const { HeadspaceScene } = await import('../three/headspaceScene')

    if (isUnmounted || !hostRef.value) {
      return
    }

    scene = new HeadspaceScene(hostRef.value, {
      reducedMotion: prefersReducedMotion(),
      onVisorClick: () => emit('visor-click'),
    })
    scene.setMode(props.mode)
  } catch (error) {
    console.warn('[y2k] headspace head disabled:', error)
    isFallback.value = true
  }
})

watch(
  () => props.mode,
  (mode) => scene?.setMode(mode),
)

onBeforeUnmount(() => {
  isUnmounted = true
  scene?.dispose()
  scene = null
})
</script>

<style scoped>
/* Size and position come from the parent (absolute + inset), so the root sets none. */

.headspace-head :deep(.headspace-scene__canvas) {
  display: block;
  width: 100%;
  height: 100%;
  max-width: none;
}

/* No WebGL: a flat green head so the skin still reads. */
.headspace-head--fallback::before {
  content: '';
  position: absolute;
  left: 50%;
  top: 50%;
  width: min(60%, 220px);
  aspect-ratio: 0.8;
  border: 3px solid #0f3006;
  border-radius: 50% 50% 46% 46% / 58% 58% 42% 42%;
  background:
    linear-gradient(180deg, transparent 38%, #06180a 38%, #06180a 62%, transparent 62%),
    radial-gradient(circle at 35% 25%, #d9ffa8 0%, #63d62b 45%, #2f7d14 100%);
  transform: translate(-50%, -50%);
}
</style>
