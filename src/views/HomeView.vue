<template>
  <section class="desktop" aria-label="Desktop">
    <DesktopItem
      v-for="item in desktopItems"
      :key="item.id"
      :accent="item.accent"
      :kind="item.kind"
      :label="item.label"
      :x="item.x"
      :y="item.y"
      @activate="openItem(item.id)"
      @update:position="updateItemPosition(item.id, $event)"
    />
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import DesktopItem from '../components/DesktopItem.vue'

type DesktopEntry = {
  accent: string
  id: string
  kind: 'folder' | 'file' | 'app' | 'script'
  label: string
  x: number
  y: number
}

const desktopItems = ref<DesktopEntry[]>([
  { id: 'my-work', label: 'My Work', kind: 'folder', accent: '#d400d4', x: 28, y: 28 },
  { id: 'about', label: 'About.txt', kind: 'file', accent: '#45b649', x: 28, y: 144 },
  { id: 'brain-dump', label: 'Brain_Dump.exe', kind: 'app', accent: '#00a8e8', x: 28, y: 260 },
  { id: 'mail', label: 'Mail.sh', kind: 'script', accent: '#ff3b6b', x: 28, y: 376 },
])

const emit = defineEmits<{
  (e: 'open-modal', modal: 'welcome' | 'my-work' | 'about'): void
}>()

const updateItemPosition = (id: string, position: { x: number; y: number }) => {
  desktopItems.value = desktopItems.value.map((item) =>
    item.id === id
      ? { ...item, x: position.x, y: position.y }
      : item,
  )
}

const openItem = (id: string) => {
  if (id === 'my-work') {
    emit('open-modal', 'my-work')
    return
  }

  if (id === 'about') {
    emit('open-modal', 'about')
  }
}
</script>

<style scoped>
.desktop {
  position: relative;
  flex: 1;
  min-height: 100%;
  overflow: hidden;
  background:
    radial-gradient(circle at 20% 20%, rgba(179, 0, 179, 0.1), transparent 22%),
    linear-gradient(180deg, #f8f6db 0%, #fffef0 100%);
}

.desktop::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(0, 0, 0, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 0, 0, 0.03) 1px, transparent 1px);
  background-size: 22px 22px;
  pointer-events: none;
}
</style>
