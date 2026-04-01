<template>
  <div class="paperclip-mascot" :style="mascotStyle">
    <transition name="paperclip-pop">
      <div v-if="isBubbleVisible" class="paperclip-mascot__bubble" role="status" aria-live="polite">
        {{ t('mascot.bubble') }}
      </div>
    </transition>

    <button
      type="button"
      class="paperclip-mascot__button"
      :aria-label="t('mascot.aria')"
      @pointerdown="handlePointerDown"
      @pointerup="handlePointerUp"
    >
      <img :src="paperclipSrc" :alt="t('mascot.alt')">
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const paperclipSrc = new URL('../assets/clippy.svg', import.meta.url).href
const isBubbleVisible = ref(false)
const position = ref({ x: 0, y: 0 })
const isDragging = ref(false)

let bubbleTimer: number | null = null
let dragOffsetX = 0
let dragOffsetY = 0
let pointerStartX = 0
let pointerStartY = 0
let pointerMoved = false
const dragThreshold = 8

const mascotStyle = computed(() => ({
  left: `${position.value.x}px`,
  top: `${position.value.y}px`,
}))

const speak = () => {
  isBubbleVisible.value = true

  if (bubbleTimer !== null) {
    window.clearTimeout(bubbleTimer)
  }

  bubbleTimer = window.setTimeout(() => {
    isBubbleVisible.value = false
    bubbleTimer = null
  }, 1600)
}

const getMascotSize = () => (window.innerWidth <= 720 ? 118 : 156)

const setInitialPosition = () => {
  const mascotSize = getMascotSize()
  const horizontalOffset = window.innerWidth <= 720 ? 12 : 16
  const verticalOffset = window.innerWidth <= 720 ? 116 : 78

  position.value = {
    x: Math.max(8, window.innerWidth - mascotSize - horizontalOffset),
    y: Math.max(8, window.innerHeight - mascotSize - verticalOffset),
  }
}

const clamp = (value: number, min: number, max: number) => {
  if (value < min) return min
  if (value > max) return max
  return value
}

const handlePointerMove = (event: PointerEvent) => {
  if (!isDragging.value) {
    return
  }

  const deltaX = event.clientX - pointerStartX
  const deltaY = event.clientY - pointerStartY

  if (!pointerMoved && Math.hypot(deltaX, deltaY) >= dragThreshold) {
    pointerMoved = true
  }

  const mascotSize = getMascotSize()
  const nextX = clamp(event.clientX - dragOffsetX, 8, window.innerWidth - mascotSize - 8)
  const nextY = clamp(event.clientY - dragOffsetY, 8, window.innerHeight - mascotSize - 8)

  position.value = { x: nextX, y: nextY }
}

const stopDragging = () => {
  isDragging.value = false
  window.removeEventListener('pointermove', handlePointerMove)
  window.removeEventListener('pointerup', stopDragging)
}

const handlePointerDown = (event: PointerEvent) => {
  pointerStartX = event.clientX
  pointerStartY = event.clientY
  dragOffsetX = event.clientX - position.value.x
  dragOffsetY = event.clientY - position.value.y
  pointerMoved = false
  isDragging.value = true

  window.addEventListener('pointermove', handlePointerMove)
  window.addEventListener('pointerup', stopDragging)
}

const handlePointerUp = () => {
  if (!pointerMoved) {
    speak()
  }
}

onMounted(() => {
  setInitialPosition()
  window.addEventListener('resize', setInitialPosition)
})

onBeforeUnmount(() => {
  if (bubbleTimer !== null) {
    window.clearTimeout(bubbleTimer)
  }

  stopDragging()
  window.removeEventListener('resize', setInitialPosition)
})
</script>

<style scoped>
.paperclip-mascot {
  position: fixed;
  z-index: 32;
  display: block;
}

.paperclip-mascot__button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 156px;
  height: 156px;
  padding: 0;
  border: 0;
  background: transparent;
  box-shadow: none;
  cursor: pointer;
}

.paperclip-mascot__button img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  filter: drop-shadow(0 8px 16px rgba(0, 0, 0, 0.18));
}

.paperclip-mascot__bubble {
  position: absolute;
  right: 0;
  bottom: calc(100% + 10px);
  width: 220px;
  padding: 0.65rem 0.8rem;
  border: 2px solid #000;
  border-radius: 0;
  background: #fffef6;
  box-shadow: 4px 4px 0 rgba(0, 0, 0, 0.14);
  color: #1f1f1f;
  font-family: var(--font-tertiary);
  font-size: 0.82rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  line-height: 1.35;
  text-align: left;
  pointer-events: none;
}

.paperclip-pop-enter-active,
.paperclip-pop-leave-active {
  transition: opacity 140ms ease, transform 140ms ease;
}

.paperclip-pop-enter-from,
.paperclip-pop-leave-to {
  opacity: 0;
  transform: translateY(6px) scale(0.96);
}

@media (max-width: 720px) {
  .paperclip-mascot__button {
    width: 118px;
    height: 118px;
  }

  .paperclip-mascot__bubble {
    width: min(210px, calc(100vw - 24px));
    right: 4px;
    bottom: calc(100% + 8px);
    padding: 0.6rem 0.72rem;
    font-size: 0.76rem;
  }
}
</style>
