<template>
  <button
    ref="itemRef"
    class="desktop-item"
    :class="{ 'desktop-item--dragging': isDragging }"
    :style="itemStyle"
    type="button"
    @pointerdown="handlePointerDown"
  >
    <span class="desktop-item__icon" :class="`desktop-item__icon--${kind}`">
      <img :src="iconSrc" :alt="label" class="desktop-item__icon-image">
    </span>
    <span class="desktop-item__label">{{ label }}</span>
  </button>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'

type DesktopItemKind = 'folder' | 'file' | 'app' | 'script'

const props = defineProps<{
  accent: string
  kind: DesktopItemKind
  label: string
  x: number
  y: number
}>()

const emit = defineEmits<{
  (e: 'update:position', position: { x: number; y: number }): void
}>()

const itemRef = ref<HTMLElement | null>(null)
const isDragging = ref(false)

let dragOffsetX = 0
let dragOffsetY = 0

const itemStyle = computed(() => ({
  left: `${props.x}px`,
  top: `${props.y}px`,
}))

const iconSrc = computed(() => {
  switch (props.kind) {
    case 'folder':
      return new URL('../assets/folder.svg', import.meta.url).href
    case 'file':
      return new URL('../assets/doc.svg', import.meta.url).href
    case 'app':
      return new URL('../assets/brain.svg', import.meta.url).href
    case 'script':
      return new URL('../assets/prompt_red.svg', import.meta.url).href
  }
})

const clamp = (value: number, min: number, max: number) => {
  if (value < min) return min
  if (value > max) return max
  return value
}

const handlePointerMove = (event: PointerEvent) => {
  const itemEl = itemRef.value
  const parentEl = itemEl?.offsetParent as HTMLElement | null

  if (!isDragging.value || !itemEl || !parentEl) {
    return
  }

  const parentRect = parentEl.getBoundingClientRect()
  const maxX = Math.max(0, parentRect.width - itemEl.offsetWidth)
  const maxY = Math.max(0, parentRect.height - itemEl.offsetHeight)
  const nextX = clamp(event.clientX - parentRect.left - dragOffsetX, 0, maxX)
  const nextY = clamp(event.clientY - parentRect.top - dragOffsetY, 0, maxY)

  emit('update:position', { x: nextX, y: nextY })
}

const stopDragging = () => {
  isDragging.value = false
  window.removeEventListener('pointermove', handlePointerMove)
  window.removeEventListener('pointerup', stopDragging)
}

const handlePointerDown = (event: PointerEvent) => {
  const itemEl = itemRef.value
  const parentEl = itemEl?.offsetParent as HTMLElement | null

  if (!itemEl || !parentEl) {
    return
  }

  const parentRect = parentEl.getBoundingClientRect()
  dragOffsetX = event.clientX - parentRect.left - props.x
  dragOffsetY = event.clientY - parentRect.top - props.y
  isDragging.value = true

  window.addEventListener('pointermove', handlePointerMove)
  window.addEventListener('pointerup', stopDragging)
}

onBeforeUnmount(() => {
  stopDragging()
})
</script>

<style scoped>
.desktop-item {
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  width: 96px;
  padding: 0.25rem;
  background: transparent;
  border: 0;
  cursor: grab;
  user-select: none;
}

.desktop-item--dragging {
  cursor: grabbing;
}

.desktop-item__icon {
  position: relative;
  display: grid;
  place-items: center;
  width: 52px;
  height: 52px;
  background: rgba(255, 255, 255, 0.5);
  border: 2px solid #000;
  box-shadow: 4px 4px 0 0 rgba(0, 0, 0, 0.12);
}

.desktop-item__label {
  padding: 0 0.3rem;
  background: #111;
  color: #fefee5;
  font-family: var(--font-secondary);
  font-size: 0.7rem;
  line-height: 1.2;
}

.desktop-item__folder,
.desktop-item__file,
.desktop-item__chip,
.desktop-item__script {
  position: relative;
  display: block;
}

.desktop-item__folder {
  width: 28px;
  height: 18px;
  border: 3px solid var(--desktop-accent);
  border-radius: 3px;
}

.desktop-item__folder::before {
  content: '';
  position: absolute;
  left: 2px;
  top: -8px;
  width: 12px;
  height: 7px;
  border: 3px solid var(--desktop-accent);
  border-bottom: 0;
  border-radius: 3px 3px 0 0;
  background: transparent;
}

.desktop-item__file {
  width: 22px;
  height: 30px;
  border: 3px solid var(--desktop-accent);
  border-radius: 2px;
}

.desktop-item__file::before {
  content: '';
  position: absolute;
  top: -3px;
  right: -3px;
  width: 10px;
  height: 10px;
  background: #fefee5;
  clip-path: polygon(0 0, 100% 0, 100% 100%);
  border-top: 3px solid var(--desktop-accent);
  border-right: 3px solid var(--desktop-accent);
}

.desktop-item__file::after {
  content: '';
  position: absolute;
  left: 4px;
  top: 12px;
  width: 10px;
  height: 3px;
  background: var(--desktop-accent);
  box-shadow: 0 7px 0 var(--desktop-accent);
}

.desktop-item__chip {
  width: 22px;
  height: 22px;
  border: 3px solid var(--desktop-accent);
  border-radius: 4px;
  box-shadow:
    -9px 0 0 -7px var(--desktop-accent),
    9px 0 0 -7px var(--desktop-accent),
    0 -9px 0 -7px var(--desktop-accent),
    0 9px 0 -7px var(--desktop-accent),
    -9px -9px 0 -7px var(--desktop-accent),
    9px -9px 0 -7px var(--desktop-accent),
    -9px 9px 0 -7px var(--desktop-accent),
    9px 9px 0 -7px var(--desktop-accent);
}

.desktop-item__chip::before,
.desktop-item__chip::after {
  content: '';
  position: absolute;
  background: var(--desktop-accent);
}

.desktop-item__chip::before {
  inset: 4px 8px;
}

.desktop-item__chip::after {
  inset: 8px 4px;
}

.desktop-item__script {
  width: 28px;
  height: 18px;
  border: 3px solid var(--desktop-accent);
  border-radius: 4px;
}

.desktop-item__script::before {
  content: '';
  position: absolute;
  left: 8px;
  top: 4px;
  width: 0;
  height: 0;
  border-top: 5px solid transparent;
  border-bottom: 5px solid transparent;
  border-left: 8px solid var(--desktop-accent);
}
</style>
