<template>
  <div class="app-shell">
    <Navbar
      :is-dark-mode="isDarkMode"
      :is-scene-enabled="isSceneEnabled"
      @open-modal="openModal"
      @toggle-dark-mode="isDarkMode = !isDarkMode"
      @toggle-scene="isSceneEnabled = !isSceneEnabled"
    />
    <div class="main">
      <Sidebar
        v-if="isSidebarOpen"
        :active-section="activeModal === 'media-player' ? 'player' : 'desktop'"
        @open-modal="openModal"
      />
      <RouterView v-slot="{ Component }">
        <component
          :is="Component"
          :is-dark-mode="isDarkMode"
          :scene-enabled="isSceneEnabled"
          :scene-paused="isBooting || isScreensaverOn"
          @open-modal="openModal"
        />
      </RouterView>
    </div>
    <PaperclipMascot />
    <Footer
      @toggle-sidebar="isSidebarOpen = !isSidebarOpen"
      @open-modal="openModal"
    />
    <InitialModal
      :is-open="activeModal === 'welcome' && !isBooting"
      @open-my-work="openModal('my-work')"
      @open-about="openModal('about')"
      @close="closeModal"
    />
    <MyWork
      :is-open="activeModal === 'my-work'"
      @close="closeModal"
    />
    <AboutMe
      :is-open="activeModal === 'about'"
      @close="closeModal"
    />
    <ResumeDoc
      :is-open="activeModal === 'resume'"
      @close="closeModal"
    />
    <Contact
      :is-open="activeModal === 'contact'"
      @close="closeModal"
    />
    <Snake
      :is-open="activeModal === 'snake'"
      @close="closeModal"
    />
    <MediaPlayer
      :is-open="activeModal === 'media-player'"
      @close="closeModal"
    />
    <Terminal
      :is-open="isTerminalOpen"
      @close="closeTerminal"
      @open-modal="openModal"
    />
    <Screensaver
      v-if="isScreensaverOn"
      @exit="exitScreensaver"
    />
    <BootScreen
      v-if="isBooting"
      @done="finishBoot"
    />
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import AboutMe from './components/AboutMe.vue';
import Contact from './components/Contact.vue';
import Footer from './components/Footer.vue';
import MyWork from './components/MyWork.vue';
import ResumeDoc from './components/ResumeDoc.vue';
import Navbar from './components/Navbar.vue';
import PaperclipMascot from './components/PaperclipMascot.vue';
import Sidebar from './components/Sidebar.vue';
import Snake from './components/Snake.vue';
import MediaPlayer from './components/MediaPlayer.vue';
import Terminal from './components/Terminal.vue';
import InitialModal from './components/InitialModal.vue';
import BootScreen from './components/BootScreen.vue';
import Screensaver from './components/Screensaver.vue';
import { LOCALE_STORAGE_KEY } from './i18n';
import { prefersReducedMotion } from './three/utils';

const MOBILE_BREAKPOINT = 720
const THEME_STORAGE_KEY = 'portfolio-dark-mode'
const SCENE_STORAGE_KEY = 'portfolio-3d'
const BOOT_SESSION_KEY = 'portfolio-booted'
const IDLE_TIMEOUT_MS = 90_000
const IDLE_CHECK_MS = 5_000

const readStorage = (storage: 'localStorage' | 'sessionStorage', key: string) => {
  try {
    return typeof window === 'undefined' ? null : window[storage].getItem(key)
  } catch {
    return null
  }
}

const writeStorage = (storage: 'localStorage' | 'sessionStorage', key: string, value: string) => {
  try {
    window[storage].setItem(key, value)
  } catch {
    // Storage can be unavailable (private mode, blocked cookies); the preference just won't persist.
  }
}

const isSidebarOpen = ref(true)
const isTerminalOpen = ref(false)
const activeModal = ref<'welcome' | 'my-work' | 'about' | 'resume' | 'contact' | 'snake' | 'media-player' | null>('welcome')
// Read synchronously: the immediate theme watcher below would otherwise overwrite the saved value.
const isDarkMode = ref(readStorage('localStorage', THEME_STORAGE_KEY) === 'true')
const isSceneEnabled = ref(readStorage('localStorage', SCENE_STORAGE_KEY) !== 'false')
// The boot animation plays once per browser session and never for reduced-motion users.
const isBooting = ref(readStorage('sessionStorage', BOOT_SESSION_KEY) !== 'true' && !prefersReducedMotion())
const isScreensaverOn = ref(false)
const { locale } = useI18n()

let lastActivityAt = Date.now()
let idleTimer: number | null = null

const openModal = (modal: 'welcome' | 'my-work' | 'about' | 'resume' | 'contact' | 'snake' | 'media-player' | 'terminal' | 'screensaver' | 'reboot') => {
  if (modal === 'terminal') {
    isTerminalOpen.value = true
    return
  }

  if (modal === 'screensaver') {
    isScreensaverOn.value = true
    return
  }

  if (modal === 'reboot') {
    isBooting.value = true
    return
  }

  activeModal.value = modal
}

const finishBoot = () => {
  isBooting.value = false
  writeStorage('sessionStorage', BOOT_SESSION_KEY, 'true')
  markActivity()
}

const markActivity = () => {
  lastActivityAt = Date.now()
}

const exitScreensaver = () => {
  isScreensaverOn.value = false
  markActivity()
}

const checkIdle = () => {
  if (!isSceneEnabled.value || isBooting.value || isScreensaverOn.value || document.hidden || prefersReducedMotion()) {
    return
  }

  if (Date.now() - lastActivityAt >= IDLE_TIMEOUT_MS) {
    isScreensaverOn.value = true
  }
}

const ACTIVITY_EVENTS = ['pointermove', 'pointerdown', 'keydown', 'wheel', 'touchstart'] as const

const closeModal = () => {
  activeModal.value = null
}

const closeTerminal = () => {
  isTerminalOpen.value = false
}

onMounted(() => {
  if (typeof window !== 'undefined') {
    isSidebarOpen.value = window.innerWidth > MOBILE_BREAKPOINT
  }

  ACTIVITY_EVENTS.forEach((type) => window.addEventListener(type, markActivity, { passive: true }))
  idleTimer = window.setInterval(checkIdle, IDLE_CHECK_MS)
})

onBeforeUnmount(() => {
  ACTIVITY_EVENTS.forEach((type) => window.removeEventListener(type, markActivity))

  if (idleTimer !== null) {
    window.clearInterval(idleTimer)
  }
})

watch(isSceneEnabled, (value) => {
  writeStorage('localStorage', SCENE_STORAGE_KEY, String(value))
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
  isDarkMode,
  (value) => {
    if (typeof window !== 'undefined') {
      writeStorage('localStorage', THEME_STORAGE_KEY, String(value))
    }

    if (typeof document !== 'undefined') {
      document.body.classList.toggle('theme-dark', value)
      document.documentElement.style.colorScheme = value ? 'dark' : 'light'
    }
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
