<template>
  <section class="desktop" :aria-label="t('desktop.aria')">
    <DesktopItem
      v-for="item in localizedDesktopItems"
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
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import DesktopItem from '../components/DesktopItem.vue'

type DesktopEntry = {
  accent: string
  id: string
  kind: 'folder' | 'file' | 'app' | 'script'
  x: number
  y: number
}

const { t } = useI18n()

const desktopItems = ref<DesktopEntry[]>([
  { id: 'my-work', kind: 'folder', accent: '#d400d4', x: 28, y: 28 },
  { id: 'about', kind: 'file', accent: '#45b649', x: 28, y: 144 },
  { id: 'resume', kind: 'file', accent: '#ff27d5', x: 28, y: 260 },
  { id: 'snake', kind: 'app', accent: '#00a8e8', x: 28, y: 376 },
  { id: 'mail', kind: 'script', accent: '#ff3b6b', x: 28, y: 492 },
])

const localizedDesktopItems = computed(() =>
  desktopItems.value.map((item) => ({
    ...item,
    label:
      item.id === 'my-work'
        ? t('desktop.myWork')
        : item.id === 'about'
          ? t('desktop.about')
          : item.id === 'resume'
            ? t('desktop.resume')
          : item.id === 'snake'
            ? t('desktop.snake')
            : t('desktop.mail'),
  })),
)

const emit = defineEmits<{
  (e: 'open-modal', modal: 'welcome' | 'my-work' | 'about' | 'resume' | 'contact' | 'snake'): void
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
    return
  }

  if (id === 'resume') {
    emit('open-modal', 'resume')
    return
  }

  if (id === 'snake') {
    emit('open-modal', 'snake')
    return
  }

  if (id === 'mail') {
    emit('open-modal', 'contact')
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

@media (max-width: 720px) {
  .desktop {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 1rem;
    align-content: start;
    overflow-y: auto;
    padding: 6.25rem 1rem 1rem;
  }
}
</style>
