<template>
  <footer ref="taskbarRef" class="taskbar">
    <StartMenu />

    <button
      class="taskbar__start"
      :class="{ 'taskbar__start--open': desktop.state.isStartMenuOpen }"
      type="button"
      aria-haspopup="menu"
      :aria-expanded="desktop.state.isStartMenuOpen"
      data-start-button
      @click="desktop.toggleStartMenu()"
    >
      <img src="../assets/start.svg" alt="">
      <span>{{ t('footer.start') }}</span>
    </button>

    <div class="taskbar__quick" :aria-label="t('taskbar.quickLaunch')">
      <button
        v-for="item in quickLaunch"
        :key="item.action"
        class="taskbar__quick-button"
        type="button"
        :title="item.label"
        :aria-label="item.label"
        @click="desktop.run(item.action)"
      >
        <img :src="item.icon" alt="">
      </button>
    </div>

    <nav class="taskbar__windows" :aria-label="t('taskbar.openWindows')">
      <TransitionGroup name="taskbar-window">
        <button
          v-for="id in desktop.state.openWindows"
          :key="id"
          class="taskbar__window"
          :class="{ 'taskbar__window--active': desktop.state.activeWindow === id }"
          type="button"
          :aria-pressed="desktop.state.activeWindow === id"
          :title="t(`taskbar.windows.${id}`)"
          @click="desktop.toggleTaskbarWindow(id)"
        >
          <img :src="WINDOW_ICONS[id]" alt="">
          <span>{{ t(`taskbar.windows.${id}`) }}</span>
          <span v-if="id === 'media-player' && player.isPlaying.value" class="taskbar__window-eq" aria-hidden="true"><i /><i /><i /></span>
        </button>
      </TransitionGroup>
    </nav>

    <div class="taskbar__tray">
      <Transition name="tray-player">
        <div v-if="player.isActive.value" class="taskbar__now-playing">
          <button
            class="taskbar__np-toggle"
            type="button"
            :aria-label="player.isPlaying.value ? t('player.pause') : t('player.play')"
            @click="player.toggle()"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path :d="player.isPlaying.value ? 'M7 5h3.5v14H7zM13.5 5H17v14h-3.5z' : 'M8 5.5v13a1 1 0 0 0 1.5.86l10.2-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5Z'" />
            </svg>
          </button>
          <button class="taskbar__np-info" type="button" :title="t('taskbar.openPlayer')" @click="desktop.openWindow('media-player')">
            <span class="taskbar__np-eq" :class="{ 'taskbar__np-eq--paused': !player.isPlaying.value }" aria-hidden="true"><i /><i /><i /><i /></span>
            <span class="taskbar__np-marquee"><span>{{ player.track.value.title }} — {{ player.track.value.artist }}</span></span>
          </button>
        </div>
      </Transition>

      <button
        class="taskbar__tray-icon"
        type="button"
        :title="t('taskbar.assistant')"
        :aria-label="t('taskbar.assistant')"
        @click="desktop.showAssistant()"
      >
        <img src="../assets/clip.svg" alt="">
      </button>

      <time class="taskbar__clock" :datetime="now.toISOString()" :title="fullDate">
        {{ clockLabel }}
      </time>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import StartMenu from './StartMenu.vue'
import { desktop, type DesktopAction, type WindowId } from '../stores/desktop'
import { player } from '../stores/player'

const { t, locale } = useI18n()
const taskbarRef = ref<HTMLElement | null>(null)
const now = ref(new Date())
let clockTimer: number | null = null
let resizeObserver: ResizeObserver | null = null

// Static URLs so Vite only bundles the icons actually used.
const ICON = {
  brain: new URL('../assets/brain.svg', import.meta.url).href,
  computer: new URL('../assets/computer.svg', import.meta.url).href,
  contact: new URL('../assets/contact.svg', import.meta.url).href,
  doc: new URL('../assets/doc.svg', import.meta.url).href,
  files: new URL('../assets/files.svg', import.meta.url).href,
  folder: new URL('../assets/folder.svg', import.meta.url).href,
  mic: new URL('../assets/mic.svg', import.meta.url).href,
  prompt: new URL('../assets/prompt.svg', import.meta.url).href,
}

const WINDOW_ICONS: Record<WindowId, string> = {
  welcome: ICON.computer,
  'my-work': ICON.folder,
  about: ICON.doc,
  resume: ICON.doc,
  contact: ICON.contact,
  snake: ICON.brain,
  'media-player': ICON.prompt,
}

const quickLaunch = computed<Array<{ action: DesktopAction; label: string; icon: string }>>(() => [
  { action: 'my-work', label: t('footer.files'), icon: ICON.files },
  { action: 'terminal', label: t('footer.cmd'), icon: ICON.prompt },
  { action: 'media-player', label: t('taskbar.windows.media-player'), icon: ICON.mic },
])

const clockLabel = computed(() =>
  now.value.toLocaleTimeString(locale.value, { hour: '2-digit', minute: '2-digit' }),
)

const fullDate = computed(() =>
  now.value.toLocaleDateString(locale.value, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
)

// Windows sit above the taskbar, so publish its height for their layout.
const publishHeight = () => {
  const height = taskbarRef.value?.offsetHeight ?? 0
  document.documentElement.style.setProperty('--taskbar-height', `${height}px`)
}

onMounted(() => {
  clockTimer = window.setInterval(() => {
    now.value = new Date()
  }, 1000)

  publishHeight()
  resizeObserver = new ResizeObserver(publishHeight)

  if (taskbarRef.value) {
    resizeObserver.observe(taskbarRef.value)
  }
})

onBeforeUnmount(() => {
  if (clockTimer !== null) {
    window.clearInterval(clockTimer)
  }

  resizeObserver?.disconnect()
})
</script>

<style scoped>
.taskbar {
  position: relative;
  /* Above windows (40) and the assistant (52) so the Start menu is never covered. */
  z-index: 53;
  display: flex;
  align-items: center;
  gap: 0.6rem;
  min-height: 52px;
  padding: 0.45rem 0.6rem;
  border-top: 2px solid #fff;
  background: linear-gradient(180deg, #d4d4d4 0%, #c0c0c0 100%);
  box-shadow: inset 0 1px 0 #dfdfdf, 0 -1px 0 #000;
  font-family: var(--font-secondary);
}

.taskbar__start {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  gap: 0.5rem;
  height: 36px;
  padding: 0 0.8rem 0 0.6rem;
  border: 2px solid;
  border-color: #fff #404040 #404040 #fff;
  border-radius: 4px;
  background: linear-gradient(180deg, #d61bd6 0%, #b300b3 55%, #8a008a 100%);
  box-shadow: inset 1px 1px 0 rgba(255, 255, 255, 0.35);
  color: #fff;
  font: inherit;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-shadow: 1px 1px 0 rgba(0, 0, 0, 0.4);
  cursor: pointer;
}

.taskbar__start img {
  width: 18px;
  height: 18px;
  filter: brightness(0) invert(1);
}

.taskbar__start:hover {
  filter: brightness(1.08);
}

.taskbar__start--open,
.taskbar__start:active {
  border-color: #404040 #fff #fff #404040;
  box-shadow: inset 1px 1px 2px rgba(0, 0, 0, 0.4);
}

.taskbar__quick {
  display: flex;
  flex-shrink: 0;
  gap: 0.2rem;
  padding: 0 0.5rem;
  border-right: 2px groove #fff;
  border-left: 2px groove #fff;
}

.taskbar__quick-button {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  padding: 0;
  border: 1px solid transparent;
  background: transparent;
  cursor: pointer;
}

.taskbar__quick-button:hover {
  border-color: #fff #404040 #404040 #fff;
}

.taskbar__quick-button img {
  width: 20px;
  height: 20px;
}

.taskbar__windows {
  display: flex;
  flex: 1;
  gap: 0.35rem;
  min-width: 0;
  overflow: hidden;
}

.taskbar__window {
  display: inline-flex;
  flex: 0 1 180px;
  align-items: center;
  gap: 0.45rem;
  min-width: 0;
  height: 36px;
  padding: 0 0.6rem;
  border: 2px solid;
  border-color: #fff #404040 #404040 #fff;
  background: #c0c0c0;
  color: #111;
  font: inherit;
  font-size: 0.74rem;
  text-align: left;
  cursor: pointer;
}

.taskbar__window img {
  flex-shrink: 0;
  width: 16px;
  height: 16px;
}

.taskbar__window span:not(.taskbar__window-eq) {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.taskbar__window--active {
  border-color: #404040 #fff #fff #404040;
  background:
    repeating-conic-gradient(#d8d8d8 0 25%, #fff 0 50%) 0 0 / 2px 2px;
  font-weight: 700;
}

.taskbar__window-eq,
.taskbar__np-eq {
  display: inline-flex;
  flex-shrink: 0;
  align-items: flex-end;
  gap: 2px;
  height: 12px;
  margin-left: auto;
}

.taskbar__window-eq i,
.taskbar__np-eq i {
  width: 3px;
  background: #b300b3;
  animation: taskbar-eq 600ms ease-in-out infinite alternate;
}

.taskbar__window-eq i:nth-child(2),
.taskbar__np-eq i:nth-child(2) {
  animation-delay: -200ms;
}

.taskbar__window-eq i:nth-child(3),
.taskbar__np-eq i:nth-child(3) {
  animation-delay: -420ms;
}

.taskbar__np-eq i:nth-child(4) {
  animation-delay: -120ms;
}

.taskbar__np-eq--paused i {
  height: 3px;
  animation: none;
}

.taskbar-window-enter-active,
.taskbar-window-leave-active {
  transition: opacity 200ms ease, transform 200ms ease;
}

.taskbar-window-enter-from,
.taskbar-window-leave-to {
  opacity: 0;
  transform: translateY(12px);
}

.taskbar__tray {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  gap: 0.35rem;
  height: 36px;
  padding: 0 0.5rem;
  border: 2px solid;
  border-color: #808080 #fff #fff #808080;
  background: #c8c8c8;
}

.taskbar__now-playing {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  max-width: 230px;
  padding-right: 0.35rem;
  border-right: 1px solid #808080;
}

.taskbar__np-toggle {
  display: grid;
  flex-shrink: 0;
  place-items: center;
  width: 24px;
  height: 24px;
  padding: 0;
  border: 1px solid #0f3006;
  border-radius: 50%;
  background: radial-gradient(circle at 40% 30%, #f4ffd9, #9dff4a 45%, #3fa313 100%);
  color: #06180a;
  cursor: pointer;
}

.taskbar__np-toggle svg {
  width: 14px;
  height: 14px;
  fill: currentColor;
}

.taskbar__np-info {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  min-width: 0;
  padding: 0;
  border: 0;
  background: transparent;
  color: #111;
  font: inherit;
  font-size: 0.7rem;
  cursor: pointer;
}

.taskbar__np-info .taskbar__np-eq {
  margin-left: 0;
}

.taskbar__np-marquee {
  overflow: hidden;
  max-width: 150px;
  mask-image: linear-gradient(90deg, transparent, #000 10%, #000 90%, transparent);
}

.taskbar__np-marquee span {
  display: inline-block;
  padding-left: 100%;
  white-space: nowrap;
  animation: taskbar-marquee 10s linear infinite;
}

.tray-player-enter-active,
.tray-player-leave-active {
  transition: opacity 250ms ease, max-width 350ms ease;
}

.tray-player-enter-from,
.tray-player-leave-to {
  max-width: 0;
  opacity: 0;
}

.taskbar__tray-icon {
  display: grid;
  place-items: center;
  width: 26px;
  height: 26px;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
}

.taskbar__tray-icon img {
  width: 18px;
  height: 18px;
}

.taskbar__tray-icon:hover {
  filter: drop-shadow(0 0 4px #b300b3);
}

.taskbar__clock {
  padding: 0 0.2rem;
  color: #000;
  font-size: 0.78rem;
  font-variant-numeric: tabular-nums;
}

@keyframes taskbar-eq {
  from {
    height: 3px;
  }

  to {
    height: 12px;
  }
}

@keyframes taskbar-marquee {
  to {
    transform: translateX(-100%);
  }
}

@media (prefers-reduced-motion: reduce) {
  .taskbar__window-eq i,
  .taskbar__np-eq i,
  .taskbar__np-marquee span {
    animation: none;
  }

  .taskbar__np-marquee span {
    padding-left: 0;
  }
}

@media (max-width: 720px) {
  .taskbar {
    gap: 0.4rem;
    padding: 0.4rem;
  }

  .taskbar__quick,
  .taskbar__tray-icon {
    display: none;
  }

  .taskbar__start span {
    display: none;
  }

  .taskbar__window {
    flex: 0 0 auto;
    justify-content: center;
    width: 40px;
    padding: 0;
  }

  .taskbar__window span {
    display: none;
  }

  .taskbar__now-playing {
    max-width: 120px;
  }

  .taskbar__np-marquee {
    max-width: 60px;
  }
}
</style>
