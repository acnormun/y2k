<template>
  <div class="app-shell">
    <Navbar @open-modal="openModal" />
    <div class="main">
      <Sidebar v-if="isSidebarOpen" />
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
    <Terminal
      :is-open="isTerminalOpen"
      @close="closeTerminal"
      @open-modal="openModal"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import AboutMe from './components/AboutMe.vue';
import Contact from './components/Contact.vue';
import Footer from './components/Footer.vue';
import MyWork from './components/MyWork.vue';
import Navbar from './components/Navbar.vue';
import Sidebar from './components/Sidebar.vue';
import Snake from './components/Snake.vue';
import Terminal from './components/Terminal.vue';
import InitialModal from './components/InitialModal.vue';

const isSidebarOpen = ref(true)
const isTerminalOpen = ref(false)
const activeModal = ref<'welcome' | 'my-work' | 'about' | 'contact' | 'snake' | null>('welcome')

const openModal = (modal: 'welcome' | 'my-work' | 'about' | 'contact' | 'snake' | 'terminal') => {
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
</script>

<style>
.app-shell {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.main {
  display: flex;
  flex: 1;
  flex-direction: row;
  min-height: 0;
}
</style>
