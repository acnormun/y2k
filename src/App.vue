<template>
  <div class="app-shell">
    <Navbar
      :is-dark-mode="isDarkMode"
      @open-modal="openModal"
      @toggle-dark-mode="isDarkMode = !isDarkMode"
    />
    <div class="main">
      <Sidebar v-if="isSidebarOpen" @open-modal="openModal" />
      <RouterView v-slot="{ Component }">
        <component :is="Component" @open-modal="openModal" />
      </RouterView>
    </div>
    <Footer
      @toggle-sidebar="isSidebarOpen = !isSidebarOpen"
      @open-modal="openModal"
    />
    <InitialModal
      :is-open="activeModal === 'welcome'"
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
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import AboutMe from './components/AboutMe.vue';
import Contact from './components/Contact.vue';
import Footer from './components/Footer.vue';
import MyWork from './components/MyWork.vue';
import Navbar from './components/Navbar.vue';
import Sidebar from './components/Sidebar.vue';
import Snake from './components/Snake.vue';
import MediaPlayer from './components/MediaPlayer.vue';
import Terminal from './components/Terminal.vue';
import InitialModal from './components/InitialModal.vue';
import { LOCALE_STORAGE_KEY } from './i18n';

const MOBILE_BREAKPOINT = 720
const THEME_STORAGE_KEY = 'portfolio-dark-mode'
const isSidebarOpen = ref(true)
const isTerminalOpen = ref(false)
const activeModal = ref<'welcome' | 'my-work' | 'about' | 'contact' | 'snake' | 'media-player' | null>('welcome')
const isDarkMode = ref(false)
const { locale } = useI18n()

const openModal = (modal: 'welcome' | 'my-work' | 'about' | 'contact' | 'snake' | 'media-player' | 'terminal') => {
  if (modal === 'terminal') {
    isTerminalOpen.value = true
    return
  }

  activeModal.value = modal
}

const closeModal = () => {
  activeModal.value = null
}

const closeTerminal = () => {
  isTerminalOpen.value = false
}

onMounted(() => {
  if (typeof window !== 'undefined') {
    isSidebarOpen.value = window.innerWidth > MOBILE_BREAKPOINT
    isDarkMode.value = window.localStorage.getItem(THEME_STORAGE_KEY) === 'true'
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
  isDarkMode,
  (value) => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(THEME_STORAGE_KEY, String(value))
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
