<template>
  <div class="app-shell">
    <Navbar />
    <div class="main">
      <Sidebar
        :active-section="desktop.state.activeWindow === 'media-player' ? 'player' : 'desktop'"
      />
      <RouterView v-slot="{ Component }">
        <component
          :is="Component"
          :is-dark-mode="desktop.state.isDarkMode"
          :scene-enabled="desktop.state.isSceneEnabled"
          :scene-paused="desktop.state.overlay !== null"
          @open-modal="desktop.run"
        />
      </RouterView>
    </div>
    <OfficeAssistant />
    <Taskbar />
    <InitialModal
      :is-open="isWindowOpen('welcome') && desktop.state.overlay !== 'boot'"
      @open-my-work="desktop.openWindow('my-work')"
      @open-about="desktop.openWindow('about')"
      @close="desktop.closeWindow('welcome')"
      @minimize="desktop.minimizeWindow('welcome')"
    />
    <MyWork
      :is-open="isWindowOpen('my-work')"
      @close="desktop.closeWindow('my-work')"
      @minimize="desktop.minimizeWindow('my-work')"
    />
    <AboutMe
      :is-open="isWindowOpen('about')"
      @close="desktop.closeWindow('about')"
      @minimize="desktop.minimizeWindow('about')"
    />
    <ResumeDoc
      :is-open="isWindowOpen('resume')"
      @close="desktop.closeWindow('resume')"
      @minimize="desktop.minimizeWindow('resume')"
    />
    <Contact
      :is-open="isWindowOpen('contact')"
      @close="desktop.closeWindow('contact')"
      @minimize="desktop.minimizeWindow('contact')"
    />
    <Snake
      :is-open="isWindowOpen('snake')"
      @close="desktop.closeWindow('snake')"
      @minimize="desktop.minimizeWindow('snake')"
    />
    <MediaPlayer
      :is-open="isWindowOpen('media-player')"
      @close="desktop.closeWindow('media-player')"
      @minimize="desktop.minimizeWindow('media-player')"
    />
    <Terminal
      :is-open="desktop.state.isTerminalOpen"
      @close="desktop.closeTerminal"
    />
    <ShutdownDialog v-if="desktop.state.overlay === 'shutdown-dialog'" />
    <ShutdownScreen v-if="desktop.state.overlay === 'shutdown'" />
    <BlueScreen v-if="desktop.state.overlay === 'bsod'" />
    <Screensaver
      v-if="desktop.state.overlay === 'screensaver'"
      @exit="exitScreensaver"
    />
    <BootScreen
      v-if="desktop.state.overlay === 'boot'"
      @done="finishBoot"
    />
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import AboutMe from './components/AboutMe.vue';
import BlueScreen from './components/BlueScreen.vue';
import BootScreen from './components/BootScreen.vue';
import Contact from './components/Contact.vue';
import InitialModal from './components/InitialModal.vue';
import MediaPlayer from './components/MediaPlayer.vue';
import MyWork from './components/MyWork.vue';
import Navbar from './components/Navbar.vue';
import OfficeAssistant from './components/OfficeAssistant.vue';
import ResumeDoc from './components/ResumeDoc.vue';
import Screensaver from './components/Screensaver.vue';
import ShutdownDialog from './components/ShutdownDialog.vue';
import ShutdownScreen from './components/ShutdownScreen.vue';
import Sidebar from './components/Sidebar.vue';
import Snake from './components/Snake.vue';
import Taskbar from './components/Taskbar.vue';
import Terminal from './components/Terminal.vue';
import { LOCALE_STORAGE_KEY } from './i18n';
import { desktop, type WindowId } from './stores/desktop';
import { prefersReducedMotion } from './three/utils';

const IDLE_TIMEOUT_MS = 120_000
const IDLE_CHECK_MS = 5_000
const ACTIVITY_EVENTS = ['pointermove', 'pointerdown', 'keydown', 'wheel', 'touchstart'] as const

const { locale } = useI18n()

let lastActivityAt = Date.now()
let idleTimer: number | null = null

const isWindowOpen = (id: WindowId) => desktop.state.activeWindow === id

const markActivity = () => {
  lastActivityAt = Date.now()
}

const finishBoot = () => {
  desktop.finishBoot()
  markActivity()
}

const exitScreensaver = () => {
  desktop.setOverlay(null)
  markActivity()
}

const checkIdle = () => {
  if (!desktop.state.isSceneEnabled || desktop.state.overlay !== null || document.hidden || prefersReducedMotion()) {
    return
  }

  if (Date.now() - lastActivityAt >= IDLE_TIMEOUT_MS) {
    desktop.setOverlay('screensaver')
  }
}

onMounted(() => {
  ACTIVITY_EVENTS.forEach((type) => window.addEventListener(type, markActivity, { passive: true }))
  idleTimer = window.setInterval(checkIdle, IDLE_CHECK_MS)
})

onBeforeUnmount(() => {
  ACTIVITY_EVENTS.forEach((type) => window.removeEventListener(type, markActivity))

  if (idleTimer !== null) {
    window.clearInterval(idleTimer)
  }
})

watch(
  locale,
  (value) => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(LOCALE_STORAGE_KEY, value)
    }

    if (typeof document !== 'undefined') {
      document.documentElement.lang = value
    }
  },
  { immediate: true },
)

watch(
  () => desktop.state.isDarkMode,
  (value) => {
    document.body.classList.toggle('theme-dark', value)
    document.documentElement.style.colorScheme = value ? 'dark' : 'light'
  },
  { immediate: true },
)
</script>

<style>
.app-shell {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.main {
  display: flex;
  flex: 1;
  flex-direction: row;
  min-height: 0;
  position: relative;
}

@media (max-width: 720px) {
  .app-shell {
    min-height: 100dvh;
  }

  .main {
    flex: 1 1 auto;
    min-height: 0;
  }
}
</style>
